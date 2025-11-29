"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect old /chat route to new /messages route
    router.replace('/messages');
  }, [router]);
  
  return null;
}

