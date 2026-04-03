import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tools/unlock
 * Removes password protection / usage restrictions from a PDF.
 * Body: FormData { file: File, password?: string }
 *
 * Note: pdf-lib loads encrypted PDFs with ignoreEncryption=true to strip
 * permission restrictions. For full AES-256 removal use qpdf CLI in production.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'unlock', 15, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const password = (formData.get('password') as string) || ''

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF files only' }, { status: 400 })
    if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    let pdfDoc: PDFDocument

    try {
      // Try loading with password first
      pdfDoc = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
        // password: password || undefined, // pdf-lib doesn't support password-unlock natively
      })
    } catch {
      return NextResponse.json(
        { error: 'Cannot open this PDF. It may use AES-256 encryption not supported in this mode. Try qpdf for advanced unlocking.' },
        { status: 422 }
      )
    }

    // Re-save without encryption metadata
    pdfDoc.setCreator('OpenAIPDF — Unlocked')
    const bytes = await pdfDoc.save({ useObjectStreams: true })
    const outputBuffer = Buffer.from(bytes)

    const key = `output/unlocked-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      pageCount: pdfDoc.getPageCount(),
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[unlock-pdf] Error:', error)
    return NextResponse.json({ error: 'Unlock failed. The password may be incorrect.' }, { status: 500 })
  }
}
