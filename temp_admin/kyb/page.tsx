"use client";

import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminKYBPage() {
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
    return <LoadingSpinner />;
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
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">KYB Management</h1>
          <p className="text-white/60">KYB management functionality coming soon...</p>
        </div>
      </div>
    </div>
  );
}
