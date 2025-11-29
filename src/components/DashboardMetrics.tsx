"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { firestoreManager } from '@/lib/firestore-utils';

interface MetricsData {
  pitches: number;
  chatRooms: number;
  notifications: number;
  projects: number;
  loading: boolean;
  error?: string;
}

interface DashboardMetricsProps {
  userId: string;
  refreshInterval?: number;
}

export default function DashboardMetrics({ 
  userId, 
  refreshInterval = 30000 
}: DashboardMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData>({
    pitches: 0,
    chatRooms: 0,
    notifications: 0,
    projects: 0,
    loading: true
  });

  const updateMetrics = useCallback(async () => {
    if (!userId) return;

    try {
      setMetrics(prev => ({ ...prev, loading: true, error: undefined }));

      // Execute queries with proper error handling
      const [pitches, chatRooms, notifications, projects] = await Promise.allSettled([
        firestoreManager.getPitchesCount(userId),
        firestoreManager.getChatRoomsCount(userId),
        firestoreManager.getNotificationsCount(userId),
        firestoreManager.getProjectsCount(userId)
      ]);

      setMetrics({
        pitches: pitches.status === 'fulfilled' ? pitches.value : 0,
        chatRooms: chatRooms.status === 'fulfilled' ? chatRooms.value : 0,
        notifications: notifications.status === 'fulfilled' ? notifications.value : 0,
        projects: projects.status === 'fulfilled' ? projects.value : 0,
        loading: false
      });

    } catch (error) {
      console.error('Error updating metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load metrics'
      }));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Initial load
    updateMetrics();

    // Set up interval for updates
    const interval = setInterval(updateMetrics, refreshInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      firestoreManager.cleanupAll();
    };
  }, [userId, updateMetrics, refreshInterval]);

  if (metrics.loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-white/60">Loading metrics...</span>
      </div>
    );
  }

  if (metrics.error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400 text-sm">Error loading metrics: {metrics.error}</p>
        <button 
          onClick={updateMetrics}
          className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
        <div className="text-center">
          <p className="text-white/60 text-sm">Pitches</p>
          <p className="text-2xl font-bold text-white">{metrics.pitches}</p>
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
        <div className="text-center">
          <p className="text-white/60 text-sm">Chat Rooms</p>
          <p className="text-2xl font-bold text-white">{metrics.chatRooms}</p>
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
        <div className="text-center">
          <p className="text-white/60 text-sm">Notifications</p>
          <p className="text-2xl font-bold text-white">{metrics.notifications}</p>
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
        <div className="text-center">
          <p className="text-white/60 text-sm">Projects</p>
          <p className="text-2xl font-bold text-white">{metrics.projects}</p>
        </div>
      </div>
    </div>
  );
}
