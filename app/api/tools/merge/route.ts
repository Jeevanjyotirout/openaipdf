import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

export const config = { api: { bodyParser: false } }

/**
 * POST /api/tools/merge
 * Merges multiple PDF files into a single PDF.
 * Accepts multipart/form-data with multiple 'files' fields.
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'merge', 10, 3600) // 10 merges per hour
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length < 2) {
      return NextResponse.json({ error: 'At least 2 PDF files required' }, { status: 400 })
    }

    if (files.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 files allowed' }, { status: 400 })
    }

    // Validate file types and sizes
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only PDFs are accepted.` },
          { status: 400 }
        )
      }
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max 100MB per file.` },
          { status: 400 }
        )
      }
    }

    // Create merged PDF
    const mergedPdf = await PDFDocument.create()

    for (const file of files) {
      const buffer = await file.arrayBuffer()
      let sourcePdf: PDFDocument

      try {
        sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: false })
      } catch (err) {
        return NextResponse.json(
          { error: `Cannot read ${file.name}. File may be corrupted or password-protected.` },
          { status: 400 }
        )
      }

      const pageCount = sourcePdf.getPageCount()
      const pageIndices = Array.from({ length: pageCount }, (_, i) => i)
      const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices)
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    // Set metadata
    mergedPdf.setTitle('Merged PDF')
    mergedPdf.setCreator('PDFPro')
    mergedPdf.setCreationDate(new Date())
    mergedPdf.setModificationDate(new Date())

    const mergedBytes = await mergedPdf.save({ useObjectStreams: true })
    const buffer = Buffer.from(mergedBytes)

    // Upload to S3
    const key = `output/merged-${Date.now()}.pdf`
    await uploadToS3(buffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600) // 1 hour expiry

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: buffer.length,
      pageCount: mergedPdf.getPageCount(),
      filesProcessed: files.length,
      expiresIn: 3600,
    })
  } catch (error: any) {
    console.error('[merge-pdf] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
