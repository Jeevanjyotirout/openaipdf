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

const ACCEPTED_FORMATS: Record<string, { ext: string[]; mimes: string[] }> = {
  docx: { ext: ['.docx', '.doc', '.odt'], mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.oasis.opendocument.text'] },
  xlsx: { ext: ['.xlsx', '.xls', '.ods'], mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/vnd.oasis.opendocument.spreadsheet'] },
  pptx: { ext: ['.pptx', '.ppt', '.odp'], mimes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'] },
  html: { ext: ['.html', '.htm'], mimes: ['text/html'] },
}

/**
 * POST /api/tools/convert-to-pdf
 * Converts Office documents (Word, Excel, PowerPoint, HTML) to PDF using LibreOffice.
 * Body: FormData { file: File, format: 'docx'|'xlsx'|'pptx'|'html' }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'convert-to-pdf', 15, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const tmpDir = join(tmpdir(), `openaipdf-convert-${uuidv4()}`)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const format = (formData.get('format') as string) || 'docx'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })

    const accepted = ACCEPTED_FORMATS[format]
    if (!accepted) return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })

    await mkdir(tmpDir, { recursive: true })

    const ext = '.' + file.name.split('.').pop()
    const inputPath = join(tmpDir, `input${ext}`)
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()))

    // Convert with LibreOffice
    try {
      await execFileAsync('libreoffice', [
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', tmpDir,
        inputPath,
      ], { timeout: 120_000 })
    } catch (libreErr) {
      console.warn('[convert-to-pdf] LibreOffice not available:', libreErr)
      return NextResponse.json({
        success: false,
        error: 'Office conversion requires LibreOffice. Please use the Docker deployment.',
        processor: 'OpenAIPDF',
      }, { status: 422 })
    }

    // Find the output PDF
    const outputName = `input.pdf`
    const outputPath = join(tmpDir, outputName)
    const outputBuffer = await readFile(outputPath)

    const key = `output/converted-${Date.now()}.pdf`
    await uploadToS3(outputBuffer, key, 'application/pdf')
    const downloadUrl = await generateDownloadUrl(key, 3600)

    return NextResponse.json({
      success: true,
      downloadUrl,
      size: outputBuffer.length,
      originalName: file.name,
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[convert-to-pdf] Error:', error)
    return NextResponse.json({ error: 'Conversion failed. Please try again.' }, { status: 500 })
  } finally {
    try { await rm(tmpDir, { recursive: true, force: true }) } catch {}
  }
}
