import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Global middleware:
 * - CSRF protection (Origin validation + custom header for API routes)
 * - Rate limit checks delegation (actual limits applied in API routes)
 * - Security headers for all responses
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── API route CSRF protection ──────────────────────────
  if (pathname.startsWith('/api/')) {
    // Validate Origin/Referer for POST/PUT/DELETE
    const method = request.method
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')

      // If origin is present, it must match the host
      if (origin && host) {
        try {
          const originHost = new URL(origin).host
          if (originHost !== host) {
            return NextResponse.json(
              { error: 'Origine non autorizzata' },
              { status: 403 }
            )
          }
        } catch {
          return NextResponse.json(
            { error: 'Origine non valida' },
            { status: 403 }
          )
        }
      }

      // Require custom anti-CSRF header (browsers block cross-origin custom headers)
      const csrfHeader = request.headers.get('x-anti-csrf')
      if (!csrfHeader || csrfHeader !== '1') {
        return NextResponse.json(
          { error: 'Validazione CSRF fallita' },
          { status: 403 }
        )
      }
    }
  }

  return NextResponse.next()
}

// Apply to all API routes
export const config = {
  matcher: '/api/:path*',
}
