import { NextRequest, NextResponse } from 'next/server'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'
import { writeFile, readFile, rm, mkdir } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'

const execFileAsync = promisify(execFile)

/**
 * POST /api/tools/pdf-to-word
 * Converts a PDF to DOCX using LibreOffice.
 * Body: FormData { file: File, mode: 'accurate'|'flowing' }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'pdf-to-word', 10, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const tmpDir = join(tmpdir(), `openaipdf-pdf2word-${uuidv4()}`)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF files only' }, { status: 400 })
    if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })

    await mkdir(tmpDir, { recursive: true })
    const inputPath = join(tmpDir, 'input.pdf')
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()))

    // Convert PDF → DOCX via LibreOffice
    try {
      await execFileAsync('libreoffice', [
        '--headless',
        '--convert-to', 'docx',
        '--outdir', tmpDir,
        inputPath,
      ], { timeout: 180_000 })
    } catch {
      return NextResponse.json({
        success: false,
        error: 'PDF to Word conversion requires LibreOffice. Please use the Docker deployment.',
        processor: 'OpenAIPDF',
      }, { status: 422 })
    }

    const outputPath = join(tmpDir, 'input.docx')
    const outputBuffer = await readFile(outputPath)
    const key = `output/pdf-to-word-${Date.now()}.docx`
    await uploadToS3(
      outputBuffer,
      key,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[pdf-to-word] Error:', error)
    return NextResponse.json({ error: 'Conversion failed. Please try again.' }, { status: 500 })
  } finally {
    try { await rm(tmpDir, { recursive: true, force: true }) } catch {}
  }
}
