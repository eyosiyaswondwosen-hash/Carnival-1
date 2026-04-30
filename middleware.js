import { NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'lebawi_admin'
const COOKIE_VALUE = 'authenticated'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow login page through always
  if (pathname === '/admin/login') return NextResponse.next()

  // Protect all other /admin routes
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const val = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    if (val !== COOKIE_VALUE) {
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
