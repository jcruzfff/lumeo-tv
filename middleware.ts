import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
  const isAccessPage = req.nextUrl.pathname === '/auth/access';
  const isLandingPage = req.nextUrl.pathname === '/';
  const isDisplayPage = req.nextUrl.pathname.startsWith('/display');
  const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard');

  // Allow access to the landing page
  if (isLandingPage) {
    return NextResponse.next();
  }

  // Allow access to display page
  if (isDisplayPage) {
    return NextResponse.next();
  }

  // Allow access to API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Check for access code verification
  const accessVerified = req.cookies.get('accessVerified')?.value === 'true';

  // If not verified and not on access page, redirect to access page
  if (!accessVerified && !isAccessPage && !isLandingPage) {
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    const accessUrl = new URL('/auth/access', req.url);
    if (callbackUrl !== '/') {
      accessUrl.searchParams.set('callbackUrl', callbackUrl);
    }
    return NextResponse.redirect(accessUrl);
  }

  // If verified but not authenticated and trying to access protected routes
  if (!token && (isDashboardPage || (!isAuthPage && !isLandingPage))) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated but trying to access auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes that require authentication
    '/dashboard/:path*',
    '/events/:path*',
    // Auth routes
    '/auth/:path*',
    // Exclude static files and favicon
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 