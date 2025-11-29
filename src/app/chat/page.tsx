'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Legacy /chat route - redirects to /messages
 * This ensures backward compatibility for any old links or bookmarks
 */
export default function ChatRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve query parameters when redirecting
    const roomId = searchParams.get('room');
    const redirectUrl = roomId ? `/messages?room=${roomId}` : '/messages';
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/20">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white/60">Redirecting to messages...</p>
      </div>
    </div>
  );
}
