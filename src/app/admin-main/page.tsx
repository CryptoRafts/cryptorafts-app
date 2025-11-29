"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

export default function AdminMainPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    // Force admin role and redirect to dashboard
    const redirectToAdmin = () => {
      console.log('🚀 Setting admin role and redirecting to admin dashboard...');
      localStorage.setItem('userRole', 'admin');
      
      // Small delay to show the loading state
      setTimeout(() => {
        router.replace('/admin/dashboard');
        setIsRedirecting(false);
      }, 1000);
    };

    redirectToAdmin();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <ShieldCheckIcon className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Accessing Admin Panel</h1>
        <p className="text-gray-300 mb-6">Setting up admin access with all navigation options...</p>
        
        <LoadingSpinner size="lg" message="Loading admin header with all options..." />
        
        <div className="mt-6 text-sm text-gray-400">
          <p>You will see all admin options in the main header:</p>
          <p className="mt-2 text-blue-400">Dashboard | Users | KYC | KYB | Projects | Spotlights | Add Spotlight | Pitch | Analytics | Departments | Audit | Settings | Test</p>
        </div>
      </div>
    </div>
  );
}
