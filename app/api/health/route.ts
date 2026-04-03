import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getRedisConnection } from '@/services/redis'

/** GET /api/health — liveness + readiness probe used by Docker/Kubernetes */
export async function GET() {
  const start = Date.now()
  const checks: Record<string, 'ok' | 'error'> = {}

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  // Redis check
  try {
    const redis = getRedisConnection()
    await redis.ping()
    checks.redis = 'ok'
  } catch {
    checks.redis = 'error'
  }

  const allHealthy = Object.values(checks).every((v) => v === 'ok')
  const responseTime = Date.now() - start

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      app: 'OpenAIPDF',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
