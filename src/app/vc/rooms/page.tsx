"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleGate from "@/components/RoleGate";

export default function VCRoomsPage() {
  const router = useRouter();
  // Redirect to unified messages page
  useEffect(() => {
    router.replace('/messages');
  }, [router]);

  return (
    <RoleGate requiredRole="vc">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Redirecting to Messages...</p>
        </div>
      </div>
    </RoleGate>
  );
}
