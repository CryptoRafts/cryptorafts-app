/**
 * React Hooks for UID-Isolated Data Access
 * All data operations enforce strict UID-based separation
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { DataIsolation } from '../security/data-isolation';

/**
 * Hook for user's isolated projects
 */
export function useUserProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log(`📂 Loading projects for user ${user.uid}`);

    DataIsolation.getUserProjects(user.uid)
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading user projects:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [user?.uid]);

  return { projects, loading, error };
}

/**
 * Hook for user's isolated chats (only chats they're participant in)
 */
export function useUserChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log(`💬 Loading chats for user ${user.uid}`);

    DataIsolation.getUserChats(user.uid)
      .then((data) => {
        setChats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading user chats:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [user?.uid]);

  return { chats, loading, error };
}

/**
 * Hook for user's isolated notifications
 */
export function useUserNotifications(limit: number = 50) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log(`🔔 Loading notifications for user ${user.uid}`);

    DataIsolation.getUserNotifications(user.uid, limit)
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading user notifications:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [user?.uid, limit]);

  return { notifications, loading, error };
}

/**
 * Hook for real-time isolated collection subscription
 */
export function useIsolatedCollection<T>(
  collectionPath: string,
  ownerField: string = 'userId'
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log(`🔒 Subscribing to isolated collection: ${collectionPath} for user ${user.uid}`);

    try {
      const unsubscribe = DataIsolation.subscribeToIsolatedCollection<T>(
        collectionPath,
        user.uid,
        (items) => {
          setData(items);
          setLoading(false);
          setError(null);
        },
        ownerField
      );

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error(`Error subscribing to ${collectionPath}:`, err);
      setError(err instanceof Error ? err.message : 'Subscription failed');
      setLoading(false);
    }
  }, [user?.uid, collectionPath, ownerField]);

  return { data, loading, error };
}

/**
 * Hook for admin access (can see all data) or user access (own data only)
 */
export function useDataWithAdminAccess<T>(
  collectionPath: string,
  ownerField: string = 'userId'
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Check if user is admin
    DataIsolation.isAdmin(user.uid).then(setIsUserAdmin);

    console.log(`🔓 Loading ${collectionPath} for user ${user.uid} (admin check in progress)`);

    try {
      const unsubscribe = DataIsolation.subscribeWithAdminAccess<T>(
        collectionPath,
        user.uid,
        (items) => {
          setData(items);
          setLoading(false);
          setError(null);
        },
        ownerField
      );

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (err) {
      console.error(`Error subscribing to ${collectionPath}:`, err);
      setError(err instanceof Error ? err.message : 'Subscription failed');
      setLoading(false);
    }
  }, [user?.uid, collectionPath, ownerField]);

  return { data, loading, error, isAdmin: isUserAdmin };
}

/**
 * Hook to check isolation health for current user
 */
export function useIsolationHealth() {
  const { user } = useAuth();
  const [health, setHealth] = useState<{ healthy: boolean; issues: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    DataIsolation.checkIsolationHealth(user.uid)
      .then(setHealth)
      .catch((err) => {
        console.error('Isolation health check failed:', err);
        setHealth({ healthy: false, issues: [err.message] });
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  return { health, loading };
}

