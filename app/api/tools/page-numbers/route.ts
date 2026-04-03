import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/page-numbers
 * Adds page numbers to a PDF.
 * Body: FormData {
 *   file: File,
 *   position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left',
 *   startNumber: string,
 *   format: 'numeric' | 'roman' | 'alpha',
 *   prefix: string,
 *   suffix: string,
 *   fontSize: string
 * }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'page-numbers', 20, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const position = (formData.get('position') as string) || 'bottom-center'
    const startNumber = Math.max(1, parseInt((formData.get('startNumber') as string) || '1'))
    const prefix = (formData.get('prefix') as string) || ''
    const suffix = (formData.get('suffix') as string) || ''
    const fontSize = Math.min(24, Math.max(6, parseInt((formData.get('fontSize') as string) || '12')))
    const margin = 30

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfDoc = await PDFDocument.load(buffer)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const { width, height } = page.getSize()
      const label = `${prefix}${startNumber + i}${suffix}`
      const textWidth = font.widthOfTextAtSize(label, fontSize)

      let x = 0
      let y = 0

      switch (position) {
        case 'bottom-center': x = (width - textWidth) / 2; y = margin; break
        case 'bottom-right':  x = width - textWidth - margin; y = margin; break
        case 'bottom-left':   x = margin; y = margin; break
        case 'top-center':    x = (width - textWidth) / 2; y = height - margin - fontSize; break
        case 'top-right':     x = width - textWidth - margin; y = height - margin - fontSize; break
        case 'top-left':      x = margin; y = height - margin - fontSize; break
        default:              x = (width - textWidth) / 2; y = margin
      }

      page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2), opacity: 0.8 })
    }

    const bytes = await pdfDoc.save({ useObjectStreams: true })
    const outputBuffer = Buffer.from(bytes)
    const key = `output/numbered-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({ success: true, downloadUrl, size: outputBuffer.length, pagesNumbered: pages.length })
  } catch (error: any) {
    console.error('[page-numbers] Error:', error)
    return NextResponse.json({ error: 'Failed to add page numbers.' }, { status: 500 })
  }
}
