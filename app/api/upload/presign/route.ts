import { NextRequest, NextResponse } from 'next/server'
import { generateUploadUrl } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'
import { v4 as uuidv4 } from 'uuid'
import { getMimeType } from '@/lib/utils'

/**
 * POST /api/upload/presign
 * Returns a pre-signed S3 URL for direct large-file uploads from the browser.
 * Body: { filename: string, contentType: string, size: number }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'presign', 30, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const body = await request.json()
    const { filename, contentType, size } = body

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 })
    }
    if (size > 200 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 200MB.' }, { status: 400 })
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/html',
    ]
    if (!allowed.includes(contentType)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    const fileId = uuidv4()
    const ext = filename.split('.').pop() || 'bin'
    const key = `uploads/${fileId}.${ext}`

    const presignData = await generateUploadUrl(key, contentType, 300)
    const parsed = JSON.parse(presignData)

    return NextResponse.json({
      uploadUrl: parsed.url,
      fields: parsed.fields,
      key,
      fileId,
      expiresIn: 300,
    })
  } catch (error: any) {
    console.error('[presign] Error:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
