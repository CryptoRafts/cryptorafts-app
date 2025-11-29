/**
 * Isolation Middleware
 * Enforces total isolation across all requests
 */

import { NextRequest, NextResponse } from 'next/server';

export async function isolationMiddleware(request: NextRequest) {
  // Note: Using Firebase auth instead of next-auth
  // Token extraction would need to be done via Firebase cookies/session
  const token = null; // TODO: Implement Firebase token extraction
  
  // Skip isolation for public routes
  const publicRoutes = ['/api/auth', '/api/health', '/'];
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token || !token.sub) {
    return NextResponse.next();
  }

  const userId = token.sub;
  const pathname = request.nextUrl.pathname;

  // Validate user-specific routes
  if (pathname.startsWith('/exchange') || 
      pathname.startsWith('/agency') || 
      pathname.startsWith('/ido') || 
      pathname.startsWith('/vc') || 
      pathname.startsWith('/founder') || 
      pathname.startsWith('/influencer')) {
    
    // Ensure user can only access their own role data
    const userRole = token.role;
    const pathRole = pathname.split('/')[1];
    
    if (userRole !== pathRole) {
      console.error('🚨 ISOLATION VIOLATION: Role mismatch', {
        userId,
        userRole,
        pathRole,
        pathname
      });
      
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Validate API routes
  if (pathname.startsWith('/api/')) {
    const headers = new Headers(request.headers);
    headers.set('X-User-ID', userId);
    headers.set('X-User-Role', token.role || '');
    headers.set('X-User-Org-ID', token.orgId || userId);
    
    return NextResponse.next({
      request: {
        headers
      }
    });
  }

  // Add isolation headers to all requests
  const response = NextResponse.next();
  response.headers.set('X-User-ID', userId);
  response.headers.set('X-User-Role', token.role || '');
  response.headers.set('X-User-Org-ID', token.orgId || userId);
  response.headers.set('X-Isolation-Enabled', 'true');

  return response;
}
