import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/sign
 * Embeds a signature into a PDF.
 * Body: FormData { file: File, mode: 'draw'|'type'|'upload', signatureData: string, color: string }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'sign', 20, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mode = (formData.get('mode') as string) || 'draw'
    const signatureData = formData.get('signatureData') as string | null
    const colorHex = (formData.get('color') as string) || '#1a1a2e'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF files only' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfDoc = await PDFDocument.load(buffer)
    const pages = pdfDoc.getPages()
    const lastPage = pages[pages.length - 1]
    const { width, height } = lastPage.getSize()

    if (mode === 'draw' && signatureData?.startsWith('data:image/png')) {
      // Embed the drawn signature PNG
      const base64 = signatureData.split(',')[1]
      const imgBuffer = Buffer.from(base64, 'base64')
      const pngImage = await pdfDoc.embedPng(imgBuffer)
      const sigAspect = pngImage.width / pngImage.height
      const sigW = Math.min(200, width * 0.35)
      const sigH = sigW / sigAspect

      lastPage.drawImage(pngImage, {
        x: width - sigW - 40,
        y: 40,
        width: sigW,
        height: sigH,
        opacity: 0.9,
      })
    } else if (mode === 'type' && signatureData) {
      // Embed typed signature as text
      const { StandardFonts } = await import('pdf-lib')
      const font = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
      const hexToRgb = (hex: string) => ({
        r: parseInt(hex.slice(1, 3), 16) / 255,
        g: parseInt(hex.slice(3, 5), 16) / 255,
        b: parseInt(hex.slice(5, 7), 16) / 255,
      })
      const { r, g, b } = hexToRgb(colorHex)

      lastPage.drawText(signatureData, {
        x: width - 250,
        y: 50,
        size: 28,
        font,
        color: rgb(r, g, b),
        opacity: 0.85,
      })
    }

    // Add signature metadata
    pdfDoc.setCreator('OpenAIPDF — Digitally Signed')
    pdfDoc.setModificationDate(new Date())

    const bytes = await pdfDoc.save({ useObjectStreams: true })
    const outputBuffer = Buffer.from(bytes)
    const key = `output/signed-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[sign-pdf] Error:', error)
    return NextResponse.json({ error: 'Signing failed. Please try again.' }, { status: 500 })
  }
}
