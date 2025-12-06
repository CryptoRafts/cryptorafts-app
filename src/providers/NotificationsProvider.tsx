"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./SimpleAuthProvider";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase.client";
import { safeToDate } from "@/lib/firebase-utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  userId: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setupListener = async () => {
      try {
        // Wait for Firebase to be ready
        const { waitForFirebase, ensureDb } = await import('@/lib/firebase-utils');
        const isReady = await waitForFirebase(5000);
        
        if (!isReady || !isMounted) {
          setIsLoading(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance || !isMounted) {
          setIsLoading(false);
          return;
        }

        // Real-time listener for notifications
        // CRITICAL: Handle missing index gracefully - try with orderBy first, fallback if needed
        let notificationsQuery;
        try {
          notificationsQuery = query(
            collection(dbInstance, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
        } catch (error: any) {
          // If index is missing, query without orderBy and sort client-side
          console.warn('⚠️ Notification index missing, using client-side sort:', error);
          notificationsQuery = query(
            collection(dbInstance, 'notifications'),
            where('userId', '==', user.uid),
            limit(50)
          );
        }

        unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          if (!isMounted) return;
          
          let notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeToDate(doc.data().createdAt),
          })) as Notification[];
          
          // CRITICAL: If query doesn't have orderBy, sort client-side by createdAt
          // Sort by timestamp (handle both Date objects and numbers)
          notificationsData = notificationsData.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt || 0);
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt || 0);
            return bTime - aTime; // Descending order
          });

          setNotifications(notificationsData);
          setIsLoading(false);
        }, (error: any) => {
          // Suppress "Target ID already exists" errors - these are harmless
          if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
            console.log('⚠️ Notification listener already exists, skipping...');
            setIsLoading(false);
            return;
          }
          console.error('Error fetching notifications:', error);
          setIsLoading(false);
        });
      } catch (error: any) {
        // Suppress "Target ID already exists" errors
        if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
          console.log('⚠️ Notification listener already exists, skipping...');
        } else {
          console.error('Error setting up notification listener:', error);
        }
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      // Update notification in Firestore
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db!, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      notifications.forEach(notification => {
        if (!notification.read) {
          batch.update(doc(db!, 'notifications', notification.id), {
            read: true,
            readAt: new Date()
          });
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
