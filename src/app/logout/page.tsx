"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';

export default function LogoutPage() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Use the signOut function from SimpleAuthProvider
        await signOut();
        
        // Wait a bit for auth state to clear
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force redirect to homepage
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if logout fails
        setIsLoggingOut(false);
        // Force redirect to homepage
        window.location.href = '/';
      }
    };

    if (user) {
      handleLogout();
    } else {
      // User already logged out, redirect immediately
      window.location.href = '/';
    }
  }, [user, signOut]);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{
        backgroundImage: 'url("/worldmap.png")'
      }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Signing out...</p>
      </div>
    </div>
  );
}
