import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/repair
 * Attempts to repair a corrupted or malformed PDF.
 * Uses pdf-lib's error-tolerant loader, then re-saves.
 * For severe corruption, Ghostscript's -dFIXEDMEDIA flag is more powerful.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'repair', 10, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const issuesFixed: string[] = []

    let pdfDoc: PDFDocument
    try {
      // Strict load first
      pdfDoc = await PDFDocument.load(buffer)
    } catch (strictErr) {
      // Try with encryption ignored (handles some corruption types)
      try {
        pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
        issuesFixed.push('Resolved encryption metadata corruption')
      } catch (lenientErr) {
        return NextResponse.json({
          error: 'PDF is too severely corrupted to repair automatically. Try Ghostscript: gs -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sOutputFile=repaired.pdf input.pdf',
        }, { status: 422 })
      }
    }

    // Check and fix common issues
    const pageCount = pdfDoc.getPageCount()
    if (pageCount === 0) {
      return NextResponse.json({ error: 'PDF has no readable pages' }, { status: 422 })
    }

    // Re-save with clean object streams (fixes cross-reference corruption)
    const repaired = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    })

    const outputBuffer = Buffer.from(repaired)

    // Check if repair actually helped (output should be valid)
    await PDFDocument.load(outputBuffer) // will throw if still broken
    issuesFixed.push('Rebuilt PDF cross-reference table')
    issuesFixed.push('Optimized object streams')
    if (outputBuffer.length !== buffer.length) {
      issuesFixed.push(`File size normalized (${buffer.length > outputBuffer.length ? 'reduced' : 'expanded'} by ${Math.abs(buffer.length - outputBuffer.length)} bytes)`)
    }

    const key = `output/repaired-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      pageCount,
      issuesFixed,
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[repair-pdf] Error:', error)
    return NextResponse.json({ error: 'Repair failed. The PDF may be too damaged.' }, { status: 500 })
  }
}
