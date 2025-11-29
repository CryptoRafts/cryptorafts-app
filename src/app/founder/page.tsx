'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function FounderPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/founder/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingSpinner size="lg" message="Redirecting to dashboard..." />
    </div>
  );
}

