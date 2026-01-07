import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'warizmy_access_token';

function buildLoginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = '/login';
  url.searchParams.set('next', nextPath);
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect student/teacher portal
  if (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/lehrer/dashboard' ||
    pathname.startsWith('/lehrer/dashboard/')
  ) {
    const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token) return buildLoginRedirect(request);
    return NextResponse.next();
  }

  // Protect onboarding
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token) return buildLoginRedirect(request);
    return NextResponse.next();
  }

  // Protect Admin UI
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token) return buildLoginRedirect(request);
    return NextResponse.next();
  }

  // Protect Admin API proxy routes (fail fast)
  if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) {
    const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/lehrer/dashboard/:path*',
    '/onboarding/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};


