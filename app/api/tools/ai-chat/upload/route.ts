import { NextRequest, NextResponse } from 'next/server'
import { uploadToS3 } from '@/services/s3'
import { rateLimit } from '@/lib/rate-limit'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/tools/ai-chat/upload
 * Uploads and indexes a PDF for AI chat session.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await rateLimit(ip, 'ai-upload', 5, 3600)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf')
      return NextResponse.json({ error: 'Only PDF files supported for AI chat' }, { status: 400 })
    if (file.size > 50 * 1024 * 1024)
      return NextResponse.json({ error: 'File too large for AI chat (max 50MB)' }, { status: 400 })

    const sessionId = uuidv4()
    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `sessions/${sessionId}/source.pdf`

    await uploadToS3(buffer, key, 'application/pdf')

    // In production: trigger text extraction job, create vector embeddings,
    // store in a vector DB (e.g. Pinecone / pgvector) indexed by sessionId.

    return NextResponse.json({
      success: true,
      sessionId,
      fileName: file.name,
      size: file.size,
    })
  } catch (error: any) {
    console.error('[ai-chat-upload] Error:', error)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
