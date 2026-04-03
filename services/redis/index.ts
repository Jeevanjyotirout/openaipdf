import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

/** Shared Redis connection (reused across queues) */
let redisConnection: IORedis | null = null

export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null, // required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    })

    redisConnection.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })
    redisConnection.on('connect', () => {
      console.log('[Redis] Connected')
    })
  }
  return redisConnection
}

// ─── Queue names ─────────────────────────────────────────────────────────────
export const QUEUES = {
  PDF_MERGE:       'pdf:merge',
  PDF_SPLIT:       'pdf:split',
  PDF_COMPRESS:    'pdf:compress',
  PDF_CONVERT:     'pdf:convert',
  PDF_OCR:         'pdf:ocr',
  PDF_WATERMARK:   'pdf:watermark',
  PDF_PROTECT:     'pdf:protect',
  PDF_SIGN:        'pdf:sign',
  AI_SUMMARIZE:    'ai:summarize',
  AI_TRANSLATE:    'ai:translate',
  CLEANUP:         'cleanup',
} as const

// ─── Queue instances ──────────────────────────────────────────────────────────
const queueInstances: Map<string, Queue> = new Map()

export function getQueue(name: string): Queue {
  if (!queueInstances.has(name)) {
    const connection = getRedisConnection()
    queueInstances.set(
      name,
      new Queue(name, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 3600, count: 100 },
          removeOnFail: { age: 86400, count: 500 },
        },
      })
    )
  }
  return queueInstances.get(name)!
}

// ─── Job types ────────────────────────────────────────────────────────────────
export interface MergeJobData {
  jobId: string
  s3Keys: string[]
  outputKey: string
  userId?: string
}

export interface CompressJobData {
  jobId: string
  s3Key: string
  outputKey: string
  level: 'low' | 'medium' | 'high'
  userId?: string
}

export interface ConvertJobData {
  jobId: string
  s3Key: string
  outputKey: string
  fromFormat: string
  toFormat: string
  userId?: string
}

export interface OcrJobData {
  jobId: string
  s3Key: string
  outputKey: string
  language: string
  userId?: string
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

/**
 * Add a PDF merge job to the queue.
 */
export async function enqueueMerge(data: MergeJobData): Promise<string> {
  const queue = getQueue(QUEUES.PDF_MERGE)
  const job = await queue.add('merge', data, {
    priority: data.userId ? 1 : 5, // Pro users get higher priority
  })
  return job.id!
}

/**
 * Add a compress job.
 */
export async function enqueueCompress(data: CompressJobData): Promise<string> {
  const queue = getQueue(QUEUES.PDF_COMPRESS)
  const job = await queue.add('compress', data)
  return job.id!
}

/**
 * Add an OCR job.
 */
export async function enqueueOcr(data: OcrJobData): Promise<string> {
  const queue = getQueue(QUEUES.PDF_OCR)
  const job = await queue.add('ocr', data, {
    timeout: 300_000, // OCR can take up to 5 minutes
  })
  return job.id!
}

/**
 * Get job status and progress.
 */
export async function getJobStatus(queueName: string, jobId: string) {
  const queue = getQueue(queueName)
  const job = await queue.getJob(jobId)
  if (!job) return null

  const state = await job.getState()
  return {
    id: job.id,
    state,
    progress: job.progress,
    data: job.data,
    result: job.returnvalue,
    error: job.failedReason,
    createdAt: new Date(job.timestamp),
    processedAt: job.processedOn ? new Date(job.processedOn) : null,
    finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
  }
}

/**
 * Create a QueueEvents listener for real-time updates (WebSocket/SSE use).
 */
export function createQueueEvents(queueName: string): QueueEvents {
  return new QueueEvents(queueName, { connection: getRedisConnection() })
}
