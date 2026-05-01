import { NextResponse } from 'next/server'

// Must match the COOKIE_NAME in lib/admin-auth.js exactly
const ADMIN_COOKIE_NAME = 'lebawi_admin'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow login page through always
  if (pathname === '/admin/login') return NextResponse.next()

  // Protect all other /admin routes
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    // Cookie must exist and have the payload.signature format
    if (!cookie || !cookie.includes('.')) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
