import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/remove-pages
 * Removes specified pages from a PDF. Returns the rest.
 * Body: FormData { file: File, pages: string } — pages is "1,3,5-8" (1-indexed)
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'remove-pages', 20, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const pagesStr = (formData.get('pages') as string)?.trim()

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!pagesStr) return NextResponse.json({ error: 'pages parameter required (e.g. 2,4,6-8)' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const srcPdf = await PDFDocument.load(buffer)
    const total = srcPdf.getPageCount()

    // Build set of pages to REMOVE (0-indexed)
    const toRemove = new Set<number>()
    for (const part of pagesStr.split(',').map((s) => s.trim())) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number)
        for (let i = Math.max(1, a); i <= Math.min(total, b); i++) toRemove.add(i - 1)
      } else {
        const n = parseInt(part)
        if (!isNaN(n) && n >= 1 && n <= total) toRemove.add(n - 1)
      }
    }

    if (toRemove.size >= total) {
      return NextResponse.json({ error: 'Cannot remove all pages from a PDF.' }, { status: 400 })
    }

    // Pages to KEEP
    const toKeep = Array.from({ length: total }, (_, i) => i).filter((i) => !toRemove.has(i))

    const newPdf = await PDFDocument.create()
    newPdf.setCreator('OpenAIPDF')
    const copied = await newPdf.copyPages(srcPdf, toKeep)
    copied.forEach((p) => newPdf.addPage(p))

    const bytes = await newPdf.save({ useObjectStreams: true })
    const outputBuffer = Buffer.from(bytes)
    const key = `output/removed-pages-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      pagesRemoved: toRemove.size,
      pagesRemaining: toKeep.length,
      totalInputPages: total,
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[remove-pages] Error:', error)
    return NextResponse.json({ error: 'Failed to remove pages.' }, { status: 500 })
  }
}
