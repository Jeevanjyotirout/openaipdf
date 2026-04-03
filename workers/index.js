/**
 * PDFPro Worker Process
 * Run with: node workers/index.js
 *
 * Handles all async PDF processing jobs via BullMQ.
 * Deploy as a separate Docker container for horizontal scaling.
 */

require('dotenv').config()

const { Worker } = require('bullmq')
const IORedis = require('ioredis')
const { PDFDocument, degrees, rgb, StandardFonts } = require('pdf-lib')
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')

// ─── Config ───────────────────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const AWS_BUCKET = process.env.AWS_S3_BUCKET || 'pdfpro-files'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function downloadFromS3(key) {
  const response = await s3.send(new GetObjectCommand({ Bucket: AWS_BUCKET, Key: key }))
  const chunks = []
  for await (const chunk of response.Body) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function uploadToS3(buffer, key, contentType = 'application/pdf') {
  await s3.send(
    new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    })
  )
}

// ─── Merge Worker ─────────────────────────────────────────────────────────────
const mergeWorker = new Worker(
  'pdf:merge',
  async (job) => {
    const { s3Keys, outputKey } = job.data
    console.log(`[merge] Processing job ${job.id}, ${s3Keys.length} files`)

    await job.updateProgress(5)

    const mergedPdf = await PDFDocument.create()

    for (let i = 0; i < s3Keys.length; i++) {
      const buffer = await downloadFromS3(s3Keys[i])
      const srcPdf = await PDFDocument.load(buffer)
      const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices())
      pages.forEach((p) => mergedPdf.addPage(p))

      await job.updateProgress(Math.round(10 + ((i + 1) / s3Keys.length) * 70))
    }

    mergedPdf.setCreator('PDFPro')
    const bytes = await mergedPdf.save({ useObjectStreams: true })

    await job.updateProgress(90)
    await uploadToS3(Buffer.from(bytes), outputKey)
    await job.updateProgress(100)

    return { outputKey, size: bytes.length, pageCount: mergedPdf.getPageCount() }
  },
  { connection, concurrency: 5 }
)

// ─── Compress Worker ──────────────────────────────────────────────────────────
const compressWorker = new Worker(
  'pdf:compress',
  async (job) => {
    const { s3Key, outputKey, level } = job.data
    console.log(`[compress] Processing job ${job.id}, level=${level}`)

    await job.updateProgress(10)
    const buffer = await downloadFromS3(s3Key)

    await job.updateProgress(30)
    const pdfDoc = await PDFDocument.load(buffer)

    // Save with object streams — reduces size without quality loss
    const compressed = await pdfDoc.save({ useObjectStreams: true, objectsPerTick: 100 })

    await job.updateProgress(80)
    await uploadToS3(Buffer.from(compressed), outputKey)
    await job.updateProgress(100)

    return { outputKey, originalSize: buffer.length, compressedSize: compressed.length }
  },
  { connection, concurrency: 10 }
)

// ─── OCR Worker ───────────────────────────────────────────────────────────────
const ocrWorker = new Worker(
  'pdf:ocr',
  async (job) => {
    const { s3Key, outputKey, language = 'eng' } = job.data
    console.log(`[ocr] Processing job ${job.id}, lang=${language}`)

    await job.updateProgress(10)
    const buffer = await downloadFromS3(s3Key)

    // In production: spawn Tesseract via child_process
    // const { execFile } = require('child_process')
    // Write PDF to temp file, run: tesseract input.pdf output -l eng pdf
    // Upload result

    await job.updateProgress(50)
    // Placeholder — actual OCR would use tesseract/ghostscript
    const pdfDoc = await PDFDocument.load(buffer)
    pdfDoc.setTitle('OCR Processed PDF')
    const output = await pdfDoc.save()

    await job.updateProgress(90)
    await uploadToS3(Buffer.from(output), outputKey)
    await job.updateProgress(100)

    return { outputKey, size: output.length }
  },
  { connection, concurrency: 2, limiter: { max: 5, duration: 60_000 } }
)

// ─── Cleanup Worker ───────────────────────────────────────────────────────────
const cleanupWorker = new Worker(
  'cleanup',
  async (job) => {
    const { s3Keys } = job.data
    console.log(`[cleanup] Deleting ${s3Keys.length} files`)

    const { DeleteObjectsCommand } = require('@aws-sdk/client-s3')
    const objects = s3Keys.map((Key) => ({ Key }))

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: AWS_BUCKET,
        Delete: { Objects: objects },
      })
    )

    return { deleted: s3Keys.length }
  },
  { connection, concurrency: 2 }
)

// ─── Event listeners ──────────────────────────────────────────────────────────
const workers = [mergeWorker, compressWorker, ocrWorker, cleanupWorker]

workers.forEach((worker) => {
  worker.on('completed', (job, result) => {
    console.log(`[${worker.name}] Job ${job.id} completed:`, JSON.stringify(result))
  })
  worker.on('failed', (job, err) => {
    console.error(`[${worker.name}] Job ${job?.id} failed:`, err.message)
  })
  worker.on('error', (err) => {
    console.error(`[${worker.name}] Worker error:`, err.message)
  })
})

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown() {
  console.log('\n[workers] Shutting down gracefully...')
  await Promise.all(workers.map((w) => w.close()))
  connection.disconnect()
  console.log('[workers] All workers stopped.')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log(`
╔═══════════════════════════════════════╗
║   PDFPro Worker Process — Running     ║
║   Redis: ${REDIS_URL.substring(0, 28)}  ║
╚═══════════════════════════════════════╝
`)
