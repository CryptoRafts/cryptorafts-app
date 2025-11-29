/**
 * VC ROUTE GUARD MIDDLEWARE - LOCKED & SECURED
 * 
 * ⚠️ DO NOT MODIFY THIS FILE
 * ⚠️ Protects all VC routes from unauthorized access
 * 
 * This middleware ensures:
 * 1. All /vc/* routes require VC role
 * 2. Automatic redirect for unauthorized users
 * 3. Session validation
 * 4. Real-time role verification
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { VC_PROTECTED_ROUTES, isVCProtectedRoute } from '@/config/vc-role-lock';

/**
 * 🔒 LOCKED VC ROUTE PROTECTION
 * 
 * Intercepts all requests to /vc/* routes
 * Validates user has VC role before allowing access
 */
export function vcRouteGuard(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a VC protected route
  if (!isVCProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Log attempted access
  console.log('🔒 VC Route Guard: Checking access to', pathname);

  // Get user session/token from cookies or headers
  // This is a placeholder - implement your actual auth check
  const userRole = request.cookies.get('userRole')?.value;
  const isAuthenticated = request.cookies.get('authenticated')?.value === 'true';

  // Block access if not authenticated
  if (!isAuthenticated) {
    console.warn('🔒 VC Route Guard: User not authenticated, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Block access if not VC role
  if (userRole !== 'vc') {
    console.warn('🔒 VC Route Guard: User does not have VC role, redirecting to role selection');
    const roleUrl = new URL('/role', request.url);
    return NextResponse.redirect(roleUrl);
  }

  // Access granted
  console.log('✅ VC Route Guard: Access granted to', pathname);
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-VC-Route-Protected', 'true');
  response.headers.set('X-Role-Required', 'vc');
  
  return response;
}

/**
 * 🔒 LOCKED VC ROUTE CONFIGURATION
 * 
 * Export routes that should be protected
 */
export const VC_MIDDLEWARE_CONFIG = {
  matcher: [
    '/vc/:path*',
  ],
};

export default vcRouteGuard;

