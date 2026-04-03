import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/watermark
 * Adds a text or image watermark to all pages of a PDF.
 * Body: FormData {
 *   file: File,
 *   type: 'text' | 'image',
 *   text?: string,
 *   image?: File,
 *   opacity: string (0.1–1.0),
 *   angle: string (degrees),
 *   position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
 *   fontSize: string
 * }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'watermark', 20, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'text'
    const text = (formData.get('text') as string) || 'CONFIDENTIAL'
    const opacity = Math.min(1, Math.max(0.05, parseFloat((formData.get('opacity') as string) || '0.3')))
    const angle = parseFloat((formData.get('angle') as string) || '45')
    const fontSize = Math.min(200, Math.max(8, parseInt((formData.get('fontSize') as string) || '60')))

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (type === 'text' && !text.trim())
      return NextResponse.json({ error: 'Watermark text cannot be empty' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfDoc = await PDFDocument.load(buffer)
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pages = pdfDoc.getPages()

    for (const page of pages) {
      const { width, height } = page.getSize()
      const textWidth = font.widthOfTextAtSize(text, fontSize)
      const textHeight = font.heightAtSize(fontSize)

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity,
        rotate: degrees(angle),
        blendMode: undefined,
      })
    }

    const bytes = await pdfDoc.save({ useObjectStreams: true })
    const outputBuffer = Buffer.from(bytes)

    const key = `output/watermarked-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      pagesWatermarked: pages.length,
      expiresIn: 3600,
    })
  } catch (error: any) {
    console.error('[watermark-pdf] Error:', error)
    return NextResponse.json({ error: 'Watermark failed. Please try again.' }, { status: 500 })
  }
}
