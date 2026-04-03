import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, degrees } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/rotate
 * Rotates specified pages of a PDF.
 * Body: FormData {
 *   file: File,
 *   angle: '90' | '180' | '270',
 *   pages: 'all' | '1,3,5' (1-indexed)
 * }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'rotate', 20, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const angleStr = (formData.get('angle') as string) || '90'
    const pagesParam = (formData.get('pages') as string) || 'all'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const angle = parseInt(angleStr)
    if (![90, 180, 270, -90].includes(angle))
      return NextResponse.json({ error: 'Invalid angle. Use 90, 180, or 270.' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfDoc = await PDFDocument.load(buffer)
    const pageCount = pdfDoc.getPageCount()

    // Determine which pages to rotate (0-indexed)
    let pageIndices: number[]
    if (pagesParam === 'all') {
      pageIndices = Array.from({ length: pageCount }, (_, i) => i)
    } else {
      pageIndices = pagesParam
        .split(',')
        .map((s) => parseInt(s.trim()) - 1)
        .filter((i) => i >= 0 && i < pageCount)
    }

    if (pageIndices.length === 0)
      return NextResponse.json({ error: 'No valid pages specified' }, { status: 400 })

    const pages = pdfDoc.getPages()
    for (const idx of pageIndices) {
      const page = pages[idx]
      const currentRotation = page.getRotation().angle
      page.setRotation(degrees((currentRotation + angle + 360) % 360))
    }

    const bytes = await pdfDoc.save({ useObjectStreams: true })
    const outputBuffer = Buffer.from(bytes)

    const key = `output/rotated-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      pagesRotated: pageIndices.length,
      angle,
      expiresIn: 3600,
    })
  } catch (error: any) {
    console.error('[rotate-pdf] Error:', error)
    return NextResponse.json({ error: 'Rotation failed. Please try again.' }, { status: 500 })
  }
}
