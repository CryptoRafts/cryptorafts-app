'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Legacy /founder/chat route - redirects to /founder/messages
 * This fixes 404 errors for founder role when accessing chat
 */
export default function FounderChatRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve query parameters when redirecting
    const roomId = searchParams.get('room');
    const redirectUrl = roomId ? `/founder/messages?room=${roomId}` : '/founder/messages';
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

