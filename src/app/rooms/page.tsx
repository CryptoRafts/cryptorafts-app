"use client";

import { useSimpleAuth } from '@/lib/auth-simple';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoomsPage() {
  const { user, profile, loading, isAuthed } = useSimpleAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthed) {
      router.push('/login');
      return;
    }
    
    // Redirect to appropriate dashboard based on role
    if (profile?.role && isAuthed) {
      router.push(`/${profile.role}/dashboard`);
    }
  }, [loading, isAuthed, profile?.role, router]);

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url("/worldmap.png")',
          filter: 'brightness(0.2) contrast(1.2) saturate(1.1)'
        }}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url("/worldmap.png")',
          filter: 'brightness(0.2) contrast(1.2) saturate(1.1)'
        }}
      >
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please sign in to access rooms.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat py-8 px-4"
      style={{
        backgroundImage: 'url("/worldmap.png")',
        filter: 'brightness(0.2) contrast(1.2) saturate(1.1)'
      }}
    >
      <div className="max-w-6xl mx-auto pt-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Chat Rooms</h1>
          <p className="text-white/70">Connect with other platform members</p>
        </div>

        <div className="bg-white/5 rounded-xl p-8">
          <div className="text-center text-white/70">
            <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
            <p>Chat rooms functionality is being developed. You'll be able to:</p>
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
              <li>• Join project-specific discussion rooms</li>
              <li>• Connect with investors and partners</li>
              <li>• Participate in deal flow conversations</li>
              <li>• Share updates and announcements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
