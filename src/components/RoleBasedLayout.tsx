"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/SimpleAuthProvider";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useEffect } from "react";

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export default function RoleBasedLayout({ 
  children, 
  allowedRoles, 
  fallbackPath = "/role" 
}: RoleBasedLayoutProps) {
  const { user, claims, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated || !user) {
        router.push("/login");
        return;
      }

      // If no role, redirect to role selection
      if (!claims?.role) {
        router.push("/role");
        return;
      }

      // If role not allowed, show 403
      if (!allowedRoles.includes(claims.role)) {
        router.push("/403");
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, claims, allowedRoles, router]);

  // Show loading while checking authentication and role
  if (isLoading || !isAuthenticated || !claims?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner message="Verifying access..." />
      </div>
    );
  }

  // Show 403 if role not allowed
  if (!allowedRoles.includes(claims.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">403</h1>
          <p className="text-white/80 mb-6">Access Denied</p>
          <p className="text-white/60 mb-8">
            Your role ({claims.role}) is not authorized to access this page.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push(`/${claims.role}/dashboard`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push("/role")}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Switch Role
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
