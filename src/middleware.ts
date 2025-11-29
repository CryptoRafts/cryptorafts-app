import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Note: Redirects are handled by nginx at server level
  // No need to redirect in middleware to avoid redirect loops
  
  const response = NextResponse.next();
  
  // Allow RSS feed to use its own cache headers
  if (pathname === '/feed.xml' || pathname === '/api/blog/rss' || pathname === '/rss' || pathname === '/rss.xml') {
    // RSS feed routes use their own cache headers
    return response;
  }
  
  // Add aggressive cache-busting headers for other routes
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

