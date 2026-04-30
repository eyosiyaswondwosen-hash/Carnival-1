import { NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'lebawi_admin_session'

export function middleware(request) {
  // Protect admin routes, allow login page and API routes through
  const { pathname } = request.nextUrl

  // Only gate the dashboard page itself; login page must remain accessible.
  // API routes do their own server-side auth via requireAdmin().
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') return NextResponse.next()

    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
