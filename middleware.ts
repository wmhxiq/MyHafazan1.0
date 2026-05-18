import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const role = (session?.user as any)?.role

  const isLoginPage = nextUrl.pathname === '/login'
  const isAdminPage = nextUrl.pathname.startsWith('/admin')
  const isGuruPage = nextUrl.pathname.startsWith('/staf')
  const isWarisPage = nextUrl.pathname.startsWith('/waris')

  // Not logged in — redirect to login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Already logged in — redirect away from login page
  if (isLoggedIn && isLoginPage) {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', nextUrl))
    if (role === 'guru') return NextResponse.redirect(new URL('/staf/dashboard', nextUrl))
    if (role === 'waris') return NextResponse.redirect(new URL('/waris/dashboard', nextUrl))
  }

  // Wrong role — redirect to correct dashboard
  if (isLoggedIn) {
    if (isAdminPage && role !== 'admin') {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    if (isGuruPage && role !== 'guru') {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    if (isWarisPage && role !== 'waris') {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [{
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    },
  ],
}