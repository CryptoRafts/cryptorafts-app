"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check if user is admin
    const isAdmin = claims?.role === 'admin' || localStorage.getItem('userRole') === 'admin';
    
    if (!user || !isAdmin) {
      router.replace('/admin/login');
      return;
    }
  }, [user, claims, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading admin panel..." />
      </div>
    );
  }

  // Check admin status
  const isAdmin = claims?.role === 'admin' || localStorage.getItem('userRole') === 'admin';
  
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  );
}
