"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Redirect route for old /influencer/rooms/[roomId] URLs
 * Redirects to /influencer/messages?room=[roomId]
 */
export default function InfluencerRoomsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  useEffect(() => {
    if (roomId) {
      // Redirect to the correct messages route
      router.replace(`/influencer/messages?room=${roomId}`);
    } else {
      // If no roomId, redirect to messages page
      router.replace('/influencer/messages');
    }
  }, [roomId, router]);

  return <LoadingSpinner />;
}



