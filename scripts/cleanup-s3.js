#!/usr/bin/env node
/**
 * OpenAIPDF — S3 Cleanup Script
 * Deletes expired output files from S3 to control storage costs.
 *
 * Runs via:
 *   - Cron job: 0 * * * * node scripts/cleanup-s3.js
 *   - Or as a BullMQ scheduled job (see services/redis/index.ts)
 *
 * Files are deleted if:
 * 1. They are in the output/ or sessions/ prefix
 * 2. They are older than FILE_TTL_HOURS (default: 2 hours for free users)
 */

require('dotenv').config()
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')

const BUCKET = process.env.AWS_S3_BUCKET || 'openaipdf-files'
const FILE_TTL_HOURS = parseInt(process.env.FILE_TTL_HOURS || '2')
const PREFIXES_TO_CLEAN = ['output/', 'sessions/']
const DRY_RUN = process.env.DRY_RUN === 'true'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function getExpiredKeys(prefix) {
  const expired = []
  const cutoff = new Date(Date.now() - FILE_TTL_HOURS * 3600 * 1000)
  let continuationToken

  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }))

    for (const obj of res.Contents || []) {
      if (obj.LastModified && obj.LastModified < cutoff) {
        expired.push({ Key: obj.Key })
      }
    }

    continuationToken = res.NextContinuationToken
  } while (continuationToken)

  return expired
}

async function deleteKeys(keys) {
  if (!keys.length) return 0

  // S3 DeleteObjects supports up to 1000 keys per call
  const batches = []
  for (let i = 0; i < keys.length; i += 1000) {
    batches.push(keys.slice(i, i + 1000))
  }

  let deleted = 0
  for (const batch of batches) {
    if (!DRY_RUN) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: batch, Quiet: true },
      }))
    }
    deleted += batch.length
  }
  return deleted
}

async function main() {
  console.log(`\n🧹 OpenAIPDF S3 Cleanup — ${new Date().toISOString()}`)
  console.log(`   Bucket: ${BUCKET}`)
  console.log(`   TTL: ${FILE_TTL_HOURS}h | Dry run: ${DRY_RUN}\n`)

  let totalDeleted = 0

  for (const prefix of PREFIXES_TO_CLEAN) {
    console.log(`📁 Scanning: ${prefix}`)
    const expired = await getExpiredKeys(prefix)
    console.log(`   Found ${expired.length} expired objects`)

    if (expired.length > 0) {
      const deleted = await deleteKeys(expired)
      totalDeleted += deleted
      console.log(`   ${DRY_RUN ? '[DRY RUN] Would delete' : 'Deleted'} ${deleted} objects`)
    }
  }

  console.log(`\n✅ Cleanup complete. Total ${DRY_RUN ? 'would-delete' : 'deleted'}: ${totalDeleted} objects\n`)
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Cleanup failed:', err)
  process.exit(1)
})
