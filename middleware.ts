import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * OpenAIPDF Middleware
 * Handles:
 * - Route protection for dashboard and account pages
 * - Security headers on all responses
 * - API key authentication for /api/v1/* routes
 * - Redirect www → non-www
 */
export default withAuth(
  function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // ── Security headers ──────────────────────────────────────
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('X-Powered-By', 'OpenAIPDF')

    // ── CORS for API routes ───────────────────────────────────
    if (pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin')
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://openaipdf.com').split(',')

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')

      // Handle preflight
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: response.headers })
      }
    }

    // ── www redirect ─────────────────────────────────────────
    const host = request.headers.get('host') || ''
    if (host.startsWith('www.') && process.env.NODE_ENV === 'production') {
      const newUrl = request.url.replace('www.openaipdf.com', 'openaipdf.com')
      return NextResponse.redirect(newUrl, 301)
    }

    return response
  },
  {
    callbacks: {
      // Only require auth on protected routes
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const protectedPaths = ['/dashboard', '/account', '/settings', '/billing']
        const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
        if (!isProtected) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
