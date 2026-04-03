import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']

/**
 * POST /api/tools/jpg-to-pdf
 * Converts one or more images to a single PDF document.
 * Body: FormData { files: File[], pageSize: 'A4'|'Letter'|'fit', quality: string }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'jpg-to-pdf', 20, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const pageSize = (formData.get('pageSize') as string) || 'A4'
    const quality = Math.min(100, Math.max(10, parseInt((formData.get('quality') as string) || '85')))

    if (!files.length) return NextResponse.json({ error: 'No image files provided' }, { status: 400 })
    if (files.length > 50) return NextResponse.json({ error: 'Max 50 images per conversion' }, { status: 400 })

    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        return NextResponse.json({ error: `Unsupported file type: ${f.name}` }, { status: 400 })
      }
      if (f.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: `Image too large: ${f.name} (max 50MB)` }, { status: 400 })
      }
    }

    const pdf = await PDFDocument.create()
    pdf.setTitle('Images to PDF')
    pdf.setCreator('OpenAIPDF')

    // A4: 595 x 842 pts | Letter: 612 x 792 pts
    const PAGE_SIZES = { A4: [595, 842], Letter: [612, 792] } as Record<string, number[]>
    const [pgW, pgH] = PAGE_SIZES[pageSize] || PAGE_SIZES.A4

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())

      // Convert via sharp to ensure compatibility
      const jpegBuf = await sharp(buffer)
        .jpeg({ quality })
        .toBuffer()

      const jpgImage = await pdf.embedJpg(jpegBuf)
      const { width: imgW, height: imgH } = jpgImage.scale(1)

      let drawW: number, drawH: number, x: number, y: number

      if (pageSize === 'fit') {
        // Page exactly fits the image
        const page = pdf.addPage([imgW, imgH])
        page.drawImage(jpgImage, { x: 0, y: 0, width: imgW, height: imgH })
        continue
      }

      // Scale image to fit within page with margins
      const margin = 20
      const maxW = pgW - margin * 2
      const maxH = pgH - margin * 2
      const scale = Math.min(maxW / imgW, maxH / imgH)
      drawW = imgW * scale
      drawH = imgH * scale
      x = (pgW - drawW) / 2
      y = (pgH - drawH) / 2

      const page = pdf.addPage([pgW, pgH])
      page.drawImage(jpgImage, { x, y, width: drawW, height: drawH })
    }

    const bytes = await pdf.save({ useObjectStreams: true })
    const outputBuffer = Buffer.from(bytes)
    const key = `output/images-to-pdf-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      pageCount: pdf.getPageCount(),
      imagesConverted: files.length,
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[jpg-to-pdf] Error:', error)
    return NextResponse.json({ error: 'Conversion failed. Please try again.' }, { status: 500 })
  }
}
