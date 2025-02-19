import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
  const isAccessPage = req.nextUrl.pathname === '/auth/access';
  const isSignInPage = req.nextUrl.pathname === '/auth/signin';
  const isLandingPage = req.nextUrl.pathname === '/';
  const isDisplayPage = req.nextUrl.pathname.startsWith('/display');
  const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard');

  // Allow access to the landing page and display page
  if (isLandingPage || isDisplayPage) {
    return NextResponse.next();
  }

  // Allow access to API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Check for access code verification
  const accessVerified = req.cookies.get('accessVerified')?.value === 'true';

  // If not verified and not on access page, redirect to access page
  if (!accessVerified && !isAccessPage) {
    return NextResponse.redirect(new URL('/auth/access', req.url));
  }

  // If verified but not authenticated and trying to access protected routes
  if (!token) {
    // Allow access to signin page
    if (isSignInPage) {
      return NextResponse.next();
    }
    
    // Redirect to signin for all other routes
    if (isDashboardPage || (!isAuthPage && !isLandingPage)) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
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