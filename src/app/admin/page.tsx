"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Set admin role and redirect to comprehensive admin dashboard
    const redirectToAdmin = () => {
      console.log('🚀 Setting admin role and redirecting to comprehensive admin dashboard...');
      localStorage.setItem('userRole', 'admin');
      
      // Redirect to comprehensive admin dashboard with all functionality
      router.replace('/admin-dashboard');
      setIsChecking(false);
    };

    // Small delay to ensure smooth transition
    setTimeout(redirectToAdmin, 500);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <ShieldCheckIcon className="w-8 h-8 text-white" />
        </div>
        
        <LoadingSpinner size="lg" message="Loading comprehensive admin dashboard..." />
        
        <p className="text-white mt-4">Preparing admin access...</p>
        <p className="text-gray-400 text-sm mt-2">
          Redirecting to admin dashboard with ALL navigation options...
        </p>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>Admin header will show ALL options:</p>
          <p className="mt-1 text-blue-400">Dashboard | Users | KYC | KYB | Projects | Spotlights | Add Spotlight | Pitch | Analytics | Departments | Audit | Settings | Test</p>
        </div>
      </div>
    </div>
  );
}
