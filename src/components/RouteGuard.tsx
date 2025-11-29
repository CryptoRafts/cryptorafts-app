"use client";
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { roleHome, isValidRole } from '@/lib/role';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: string;
  redirectTo?: string;
}

export default function RouteGuard({ 
  children, 
  requireAuth = true, 
  requireRole,
  redirectTo 
}: RouteGuardProps) {
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Don't redirect while loading or if already redirected
    if (isLoading || hasRedirected.current) {
      return;
    }

    // Handle unauthenticated users
    if (requireAuth && !isAuthenticated) {
      hasRedirected.current = true;
      router.replace('/login');
      return;
    }

    // Handle authenticated users on auth pages
    if (isAuthenticated && (pathname === '/login' || pathname === '/signup' || pathname === '/register')) {
      const userRole = claims?.role;
      if (userRole && isValidRole(userRole)) {
        hasRedirected.current = true;
        router.replace(roleHome(userRole as any));
        return;
      }
    }

    // Handle role-specific routes
    if (requireRole && isAuthenticated) {
      const userRole = claims?.role;
      if (!userRole || userRole !== requireRole) {
        hasRedirected.current = true;
        if (redirectTo) {
          router.replace(redirectTo);
        } else if (userRole && isValidRole(userRole)) {
          router.replace(roleHome(userRole as any));
        } else {
          router.replace('/role');
        }
        return;
      }
    }

    // Reset redirect flag when path changes
    hasRedirected.current = false;
  }, [isLoading, isAuthenticated, claims, pathname, requireAuth, requireRole, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show children if all checks pass
  return <>{children}</>;
}
