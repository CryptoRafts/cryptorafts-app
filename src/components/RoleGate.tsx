"use client";
import { useRoleFlags } from '@/lib/guards';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGateProps {
  requiredRole: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGate({ requiredRole, children, fallback }: RoleGateProps) {
  const { user, loading, role, profile } = useRoleFlags();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Please log in to access this page.</div>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (role !== requiredRole) {
    // If role is still loading or undefined, show loading
    if (role === undefined || role === null) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <div className="text-white/70 mb-6">
            You don't have permission to access this page. Required role: {requiredRole}, Your role: {role || 'none'}
          </div>
          <button 
            onClick={() => router.push('/')}
            className="btn-neon-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
