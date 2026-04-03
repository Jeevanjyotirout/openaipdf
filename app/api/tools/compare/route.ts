import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/compare
 * Compares two PDFs structurally (page count, sizes, metadata).
 * Body: FormData { fileA: File, fileB: File }
 *
 * Production: integrate pdfjs-dist to extract text per page and do
 * diff comparison; or use Ghostscript's diff output.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'compare', 10, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const fileA = formData.get('fileA') as File | null
    const fileB = formData.get('fileB') as File | null

    if (!fileA || !fileB) return NextResponse.json({ error: 'Both fileA and fileB are required' }, { status: 400 })
    if (fileA.size > 50 * 1024 * 1024 || fileB.size > 50 * 1024 * 1024)
      return NextResponse.json({ error: 'Files too large (max 50MB each)' }, { status: 400 })

    const [bufA, bufB] = await Promise.all([
      fileA.arrayBuffer().then(Buffer.from),
      fileB.arrayBuffer().then(Buffer.from),
    ])

    const [pdfA, pdfB] = await Promise.all([
      PDFDocument.load(bufA),
      PDFDocument.load(bufB),
    ])

    const pagesA = pdfA.getPageCount()
    const pagesB = pdfB.getPageCount()

    const differences: Array<{ page: number; type: 'added' | 'removed' | 'modified'; description: string }> = []

    // Structural comparison
    if (pagesA !== pagesB) {
      const diff = Math.abs(pagesB - pagesA)
      const startPage = Math.min(pagesA, pagesB) + 1
      if (pagesB > pagesA) {
        for (let p = startPage; p <= pagesB; p++) {
          differences.push({ page: p, type: 'added', description: `Page ${p} exists only in PDF B` })
        }
      } else {
        for (let p = startPage; p <= pagesA; p++) {
          differences.push({ page: p, type: 'removed', description: `Page ${p} exists only in PDF A` })
        }
      }
    }

    // Page size comparison
    const pagesObjA = pdfA.getPages()
    const pagesObjB = pdfB.getPages()
    const commonPages = Math.min(pagesA, pagesB)

    for (let i = 0; i < commonPages; i++) {
      const sA = pagesObjA[i].getSize()
      const sB = pagesObjB[i].getSize()
      if (Math.abs(sA.width - sB.width) > 1 || Math.abs(sA.height - sB.height) > 1) {
        differences.push({
          page: i + 1,
          type: 'modified',
          description: `Page dimensions changed: A is ${Math.round(sA.width)}×${Math.round(sA.height)}pt, B is ${Math.round(sB.width)}×${Math.round(sB.height)}pt`,
        })
      }
    }

    // Metadata comparison
    const titleA = pdfA.getTitle() || ''
    const titleB = pdfB.getTitle() || ''
    if (titleA !== titleB && (titleA || titleB)) {
      differences.push({
        page: 0,
        type: 'modified',
        description: `Document title changed: "${titleA || '(none)'}" → "${titleB || '(none)'}"`,
      })
    }

    // File size difference
    const sizeDiff = Math.abs(bufA.length - bufB.length)
    const sizePercent = Math.round((sizeDiff / bufA.length) * 100)
    if (sizePercent > 5 && differences.length === 0) {
      differences.push({
        page: 1,
        type: 'modified',
        description: `File size changed by ${sizePercent}% (${bufA.length > bufB.length ? 'reduced' : 'increased'})`,
      })
    }

    return NextResponse.json({
      success: true,
      identical: differences.length === 0 && bufA.equals(bufB),
      differences,
      pagesA,
      pagesB,
      sizeA: bufA.length,
      sizeB: bufB.length,
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[compare-pdf] Error:', error)
    return NextResponse.json({ error: 'Comparison failed. Please try again.' }, { status: 500 })
  }
}
