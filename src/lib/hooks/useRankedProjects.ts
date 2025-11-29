/**
 * React hook for real-time ranked projects
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
// import { raftAI } from '@/lib/raftai';
import type { ProjectsByTier } from '@/lib/raftai/project-ranking';

export function useRankedProjects() {
  const { user, claims } = useAuth();
  const [projects, setProjects] = useState<ProjectsByTier>({
    high: [],
    medium: [],
    low: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Get role from claims or default to 'user'
    const userRole = claims?.role || (claims as any)?.role || 'user';

    // Don't rank for founders
    if (userRole === 'founder') {
      setLoading(false);
      return;
    }

    try {
      console.log(`📊 Subscribing to ranked projects for ${userRole}`);
      setLoading(false);
      setError(null);
      // TODO: Fix raftAI import - temporarily disabled
      // Subscribe to real-time ranked projects
      // const unsubscribe = raftAI.subscribeToRankedProjects(
      //   userRole,
      //   user.uid,
      //   (rankedProjects) => {
      //     setProjects(rankedProjects);
      //     setLoading(false);
      //     setError(null);
      //   }
      // );
      // return () => {
      //   unsubscribe();
      // };
    } catch (err) {
      console.error('Error subscribing to ranked projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      setLoading(false);
    }
  }, [user]);

  const totalProjects = projects.high.length + projects.medium.length + projects.low.length;

  return {
    projects,
    loading,
    error,
    totalProjects,
    highCount: projects.high.length,
    mediumCount: projects.medium.length,
    lowCount: projects.low.length,
  };
}

