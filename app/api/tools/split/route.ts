import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/split
 * Splits a PDF by page ranges or into individual pages.
 *
 * Body: FormData {
 *   file: File,
 *   mode: 'ranges' | 'every' | 'extract',
 *   ranges?: string   // e.g. "1-3,5,7-9"
 * }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'split', 15, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mode = (formData.get('mode') as string) || 'every'
    const rangesStr = formData.get('ranges') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const srcPdf = await PDFDocument.load(buffer)
    const totalPages = srcPdf.getPageCount()

    let pageGroups: number[][] = []

    if (mode === 'every') {
      // One page per PDF
      pageGroups = Array.from({ length: totalPages }, (_, i) => [i])
    } else if (mode === 'ranges' && rangesStr) {
      // Parse "1-3,5,7-9" (1-indexed) into 0-indexed groups
      pageGroups = parseRanges(rangesStr, totalPages)
    } else {
      return NextResponse.json({ error: 'Invalid split mode or missing ranges' }, { status: 400 })
    }

    if (pageGroups.length === 0) {
      return NextResponse.json({ error: 'No valid page ranges parsed' }, { status: 400 })
    }

    // Limit output count
    if (pageGroups.length > 50) {
      return NextResponse.json({ error: 'Too many output files (max 50)' }, { status: 400 })
    }

    const outputs: { filename: string; downloadUrl: string; pages: number; size: number }[] = []

    for (let i = 0; i < pageGroups.length; i++) {
      const pages = pageGroups[i]
      const newPdf = await PDFDocument.create()
      const copied = await newPdf.copyPages(srcPdf, pages)
      copied.forEach((p) => newPdf.addPage(p))
      newPdf.setCreator('OpenAIPDF')

      const bytes = await newPdf.save({ useObjectStreams: true })
      const buf = Buffer.from(bytes)
      const key = `output/split-${Date.now()}-part${i + 1}.pdf`
      await uploadToS3(buf, key, 'application/pdf')
      const downloadUrl = await generateDownloadUrl(key, 3600)

      const label =
        pages.length === 1
          ? `page-${pages[0] + 1}`
          : `pages-${pages[0] + 1}-${pages[pages.length - 1] + 1}`

      outputs.push({ filename: `split-${label}.pdf`, downloadUrl, pages: pages.length, size: buf.length })
    }

    return NextResponse.json({
      success: true,
      totalInputPages: totalPages,
      outputCount: outputs.length,
      outputs,
    })
  } catch (error: any) {
    console.error('[split-pdf] Error:', error)
    return NextResponse.json({ error: 'Split failed. Please try again.' }, { status: 500 })
  }
}

/** Parse "1-3,5,7-9" to 0-indexed page arrays */
function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = []
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean)

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-')
      const start = Math.max(1, parseInt(startStr)) - 1
      const end = Math.min(total, parseInt(endStr)) - 1
      if (isNaN(start) || isNaN(end) || start > end) continue
      groups.push(Array.from({ length: end - start + 1 }, (_, i) => start + i))
    } else {
      const page = parseInt(part) - 1
      if (isNaN(page) || page < 0 || page >= total) continue
      groups.push([page])
    }
  }

  return groups
}
