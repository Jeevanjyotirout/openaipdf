import { NextRequest, NextResponse } from 'next/server'
import { getJobStatus, QUEUES } from '@/services/redis'

/**
 * GET /api/jobs/[id]?queue=pdf:merge
 * Returns current status of a BullMQ job.
 * Used for polling async processing progress.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const queueName = request.nextUrl.searchParams.get('queue') || QUEUES.PDF_MERGE

  // Validate queue name
  const validQueues = Object.values(QUEUES)
  if (!validQueues.includes(queueName as any)) {
    return NextResponse.json({ error: 'Invalid queue name' }, { status: 400 })
  }

  try {
    const status = await getJobStatus(queueName, id)

    if (!status) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Map internal BullMQ states to client-friendly labels
    const stateMap: Record<string, string> = {
      waiting: 'queued',
      active: 'processing',
      completed: 'done',
      failed: 'error',
      delayed: 'queued',
      paused: 'queued',
    }

    return NextResponse.json({
      id: status.id,
      status: stateMap[status.state] || status.state,
      progress: status.progress || 0,
      result: status.result,
      error: status.error,
      createdAt: status.createdAt,
      processedAt: status.processedAt,
      finishedAt: status.finishedAt,
      processor: 'OpenAIPDF',
    })
  } catch (error: any) {
    console.error('[jobs/status] Error:', error)
    return NextResponse.json({ error: 'Failed to get job status' }, { status: 500 })
  }
}
