"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { realtimeNotificationService } from '@/lib/realtime-notifications';
import { errorHandler } from '@/lib/error-handler';

interface RealtimeNotificationProviderProps {
  children: React.ReactNode;
}

export default function RealtimeNotificationProvider({ 
  children 
}: RealtimeNotificationProviderProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize real-time notifications when user is authenticated
    if (user) {
      try {
        console.log('🔔 Initializing real-time notifications for user:', user.uid);
        
        // Request notification permissions with error handling
        realtimeNotificationService.requestNotificationPermission().catch((error) => {
          errorHandler.handleNotificationError(error, 'Permission Request');
        });
        
        // The realtimeNotificationService automatically starts listening
        // when user authentication state changes
      } catch (error) {
        errorHandler.handleNotificationError(error, 'Initialization');
      }
    }

    // Cleanup on unmount
    return () => {
      if (user) {
        try {
          console.log('🔔 Cleaning up real-time notifications');
          realtimeNotificationService.destroy();
        } catch (error) {
          errorHandler.handleNotificationError(error, 'Cleanup');
        }
      }
    };
  }, [user]);

  // This component doesn't render anything, just manages notifications
  return <>{children}</>;
}
