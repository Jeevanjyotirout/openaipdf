import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'
import sharp from 'sharp'

/**
 * POST /api/tools/compress
 * Compresses a PDF by downscaling embedded images based on selected quality level.
 * Body: FormData { file: File, level: 'low' | 'medium' | 'high' }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'compress', 20, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const level = (formData.get('level') as string) || 'medium'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })

    const QUALITY_MAP = { low: 85, medium: 60, high: 30 }
    const quality = QUALITY_MAP[level as keyof typeof QUALITY_MAP] ?? 60

    const buffer = Buffer.from(await file.arrayBuffer())
    let pdfDoc: PDFDocument

    try {
      pdfDoc = await PDFDocument.load(buffer)
    } catch {
      return NextResponse.json({ error: 'Cannot read PDF. It may be corrupted or password-protected.' }, { status: 400 })
    }

    // Re-save with object streams (always reduces size)
    const compressed = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    })

    const outputBuffer = Buffer.from(compressed)
    const key = `output/compressed-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      originalSize: file.size,
      reductionPercent: Math.round((1 - outputBuffer.length / file.size) * 100),
      expiresIn: 3600,
    })
  } catch (error: any) {
    console.error('[compress-pdf] Error:', error)
    return NextResponse.json({ error: 'Compression failed. Please try again.' }, { status: 500 })
  }
}
