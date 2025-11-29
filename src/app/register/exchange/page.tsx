"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to correct route
    router.replace('/exchange/register');
  }, [router]);
  
  // Also use meta refresh as backup
  if (typeof window !== 'undefined') {
    window.location.replace('/exchange/register');
  }
  
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/exchange/register" />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    </>
  );
}

