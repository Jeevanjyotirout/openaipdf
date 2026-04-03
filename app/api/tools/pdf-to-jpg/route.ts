import { NextRequest, NextResponse } from 'next/server'
import { uploadToS3, generateDownloadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'
import { v4 as uuidv4 } from 'uuid'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readdir, readFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execFileAsync = promisify(execFile)

/**
 * POST /api/tools/pdf-to-jpg
 * Converts each PDF page to a JPG image using Ghostscript.
 * Body: FormData { file: File, dpi: string, quality: string }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'pdf-to-jpg', 10, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const tmpDir = join(tmpdir(), `openaipdf-${uuidv4()}`)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const dpi = Math.min(300, Math.max(72, parseInt((formData.get('dpi') as string) || '150')))
    const quality = Math.min(100, Math.max(10, parseInt((formData.get('quality') as string) || '90')))

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF files only' }, { status: 400 })
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })

    // Write input to temp dir
    const { mkdir } = await import('fs/promises')
    await mkdir(tmpDir, { recursive: true })
    const inputPath = join(tmpDir, 'input.pdf')
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()))

    // Convert via Ghostscript
    const outputPattern = join(tmpDir, 'page-%03d.jpg')
    try {
      await execFileAsync('gs', [
        '-dBATCH', '-dNOPAUSE', '-dSAFER',
        '-sDEVICE=jpeg',
        `-dJPEGQ=${quality}`,
        `-r${dpi}`,
        `-sOutputFile=${outputPattern}`,
        inputPath,
      ], { timeout: 120_000 })
    } catch {
      // Fallback: return placeholder if Ghostscript not available
      return NextResponse.json({
        success: false,
        error: 'PDF rendering requires Ghostscript. Please deploy with the Docker image.',
        processor: 'OpenAIPDF',
      }, { status: 422 })
    }

    // Collect output files
    const outputFiles = (await readdir(tmpDir))
      .filter((f) => f.startsWith('page-') && f.endsWith('.jpg'))
      .sort()

    if (!outputFiles.length) throw new Error('No pages rendered')

    const outputs: { filename: string; downloadUrl: string; size: number; page: number }[] = []

    for (let i = 0; i < outputFiles.length; i++) {
      const imgPath = join(tmpDir, outputFiles[i])
      const imgBuffer = await readFile(imgPath)
      const key = `output/pdf-to-jpg-${Date.now()}-page${i + 1}.jpg`
      await uploadToS3(imgBuffer, key, 'image/jpeg')
      const downloadUrl = await generateDownloadUrl(key, 3600)
      outputs.push({ filename: `page-${i + 1}.jpg`, downloadUrl, size: imgBuffer.length, page: i + 1 })
    }

    return NextResponse.json({
      success: true,
      pageCount: outputs.length,
      outputs,
      dpi,
      processor: 'OpenAIPDF',
      message: 'Processed successfully by OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[pdf-to-jpg] Error:', error)
    return NextResponse.json({ error: 'Conversion failed. Please try again.' }, { status: 500 })
  } finally {
    // Cleanup temp files
    try { await rm(tmpDir, { recursive: true, force: true }) } catch {}
  }
}
