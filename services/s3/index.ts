import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/** Lazily initialized S3 client */
let s3Client: S3Client | null = null

function getClient(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      // For Cloudflare R2 compatibility:
      // endpoint: process.env.R2_ENDPOINT,
      // forcePathStyle: true,
    })
  }
  return s3Client
}

const BUCKET = process.env.AWS_S3_BUCKET || 'openaipdf-files'

/**
 * Upload a buffer to S3.
 * @param buffer - File content
 * @param key - S3 object key (e.g. "output/merged-123.pdf")
 * @param contentType - MIME type
 * @param metadata - Optional key-value metadata
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const client = getClient()

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Auto-delete via S3 lifecycle rules (set in AWS console: prefix output/ → expire 2h)
      Metadata: {
        'created-at': new Date().toISOString(),
        ...metadata,
      },
      // Server-side encryption
      ServerSideEncryption: 'AES256',
    })
  )

  return `s3://${BUCKET}/${key}`
}

/**
 * Generate a pre-signed download URL.
 * @param key - S3 object key
 * @param expiresInSeconds - URL validity (default 1 hour)
 */
export async function generateDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = getClient()

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${key.split('/').pop()}"`,
  })

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

/**
 * Delete an object from S3.
 */
export async function deleteFromS3(key: string): Promise<void> {
  const client = getClient()
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/**
 * Check if an S3 object exists.
 */
export async function existsInS3(key: string): Promise<boolean> {
  try {
    const client = getClient()
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

/**
 * List all keys with a given prefix (for cleanup jobs).
 */
export async function listS3Keys(prefix: string): Promise<string[]> {
  const client = getClient()
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )
    res.Contents?.forEach((obj) => obj.Key && keys.push(obj.Key))
    continuationToken = res.NextContinuationToken
  } while (continuationToken)

  return keys
}

/**
 * Generate a pre-signed UPLOAD URL for direct client-side uploads.
 * Used for large files to bypass the API server.
 */
export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string> {
  const { createPresignedPost } = await import('@aws-sdk/s3-presigned-post')
  const client = getClient()

  const { url, fields } = await createPresignedPost(client, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [
      ['content-length-range', 0, 200 * 1024 * 1024], // max 200MB
      ['eq', '$Content-Type', contentType],
    ],
    Fields: { 'Content-Type': contentType },
    Expires: expiresInSeconds,
  })

  // Return as JSON string for client usage
  return JSON.stringify({ url, fields })
}
