"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/ido/register');
  }, [router]);
  
  if (typeof window !== 'undefined') {
    window.location.replace('/ido/register');
  }
  
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/ido/register" />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    </>
  );
}

