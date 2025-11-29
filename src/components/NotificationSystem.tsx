"use client";
import React, { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc } from '@/lib/firebase.client';
import { useAuth } from '@/providers/AuthProvider';

interface Notification {
  id: string;
  userId: string;
  type: 'kyc_result' | 'kyb_result' | 'pitch_analyzed' | 'interest_acceptance' | 'new_room' | 'mention' | 'task_due' | 'event_starting' | 'file_viewed' | 'room_created' | 'project_accepted' | 'project_rejected' | 'campaign_accepted';
  title: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: {
    projectId?: string;
    roomId?: string;
    taskId?: string;
    eventId?: string;
    fileId?: string;
    counterpartyId?: string;
    counterpartyType?: string;
    acceptedBy?: string;
    acceptedByName?: string;
    acceptedByRole?: string;
    roomUrl?: string;
    founderLogo?: string;
    partnerLogo?: string;
  };
  link?: string;
  createdAt: number | any;
  expiresAt?: number;
  founderLogo?: string; // Founder logo for display
}

interface NotificationSettings {
  inApp: boolean;
  push: boolean;
  email: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  rollups: {
    daily: boolean;
    weekly: boolean;
  };
  types: {
    [key: string]: {
      inApp: boolean;
      push: boolean;
      email: boolean;
    };
  };
}

export default function NotificationSystem() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    inApp: true,
    push: true,
    email: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC'
    },
    rollups: {
      daily: true,
      weekly: false
    },
    types: {
      kyc_result: { inApp: true, push: true, email: true },
      kyb_result: { inApp: true, push: true, email: true },
      pitch_analyzed: { inApp: true, push: false, email: true },
      interest_acceptance: { inApp: true, push: true, email: true },
      new_room: { inApp: true, push: true, email: false },
      mention: { inApp: true, push: true, email: false },
      task_due: { inApp: true, push: true, email: true },
      event_starting: { inApp: true, push: true, email: false },
      file_viewed: { inApp: false, push: false, email: false },
      room_created: { inApp: true, push: false, email: false }
    }
  });

  // Listen to notifications
  useEffect(() => {
    if (!user) return;

    const firestore = db;
    if (!firestore) return;

    const notificationsQuery = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    let previousNotificationIds = new Set<string>();
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      // Check for new unread notifications (not just count increase)
      const currentNotificationIds = new Set(notifs.map(n => n.id));
      const newUnreadNotifications = notifs.filter(n => 
        !n.read && !previousNotificationIds.has(n.id)
      );
      
      // Play sound for any new unread notification
      if (newUnreadNotifications.length > 0) {
        console.log(`🔔 New notification(s) detected: ${newUnreadNotifications.length}`);
        playNotificationSound();
      }
      
      previousNotificationIds = currentNotificationIds;
      const newUnreadCount = notifs.filter(n => !n.read).length;
      setNotifications(notifs);
      setUnreadCount(newUnreadCount);
    });

    return unsubscribe;
  }, [user]);

  // Play notification sound with rate limiting
  let lastSoundTime = 0;
  const SOUND_COOLDOWN = 2000; // 2 seconds cooldown between sounds
  
  const playNotificationSound = () => {
    try {
      // Check if sound is enabled
      if (typeof window === 'undefined') return;
      
      // Rate limiting - prevent sound spam
      const now = Date.now();
      if (now - lastSoundTime < SOUND_COOLDOWN) {
        console.log('🔇 Sound rate limited (cooldown active)');
        return;
      }
      lastSoundTime = now;
      
      const soundEnabled = localStorage.getItem('notificationSoundEnabled');
      if (soundEnabled === 'false') {
        console.log('🔇 Sound muted by user preference');
        return;
      }

      console.log('🔔 Playing notification sound...');
      
      // Create audio context (handle browser compatibility)
      let audioContext: AudioContext;
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('⚠️ AudioContext not available, skipping sound');
        return;
      }
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(err => {
          console.warn('⚠️ Could not resume audio context:', err);
          return;
        });
      }
      
      // Create a pleasant two-tone chime
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant chime frequencies (C5 and E5)
      oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime);
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      // Smooth volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
      
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.6);
      oscillator2.stop(audioContext.currentTime + 0.6);
      
      console.log('🔔 Sound played successfully');
    } catch (error) {
      console.error('❌ Error playing sound:', error);
      // Don't throw - sound failure shouldn't break notifications
    }
  };

  // Don't auto-request notification permission (let user enable from settings)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('🔔 In-app notifications active. Enable browser notifications from settings if desired.');
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if (!settings.push || Notification.permission !== 'granted') return;
    if (isQuietHours()) return;

    const notificationType = settings.types[notification.type];
    if (!notificationType.push) return;

    new Notification(notification.title, {
      body: notification.message,
      icon: '/cryptorafts.logo.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent' || notification.priority === 'high'
    });
  };

  // Check if current time is within quiet hours
  const isQuietHours = (): boolean => {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = parseInt(settings.quietHours.start.split(':')[0]) * 60 + 
                     parseInt(settings.quietHours.start.split(':')[1]);
    const endTime = parseInt(settings.quietHours.end.split(':')[0]) * 60 + 
                   parseInt(settings.quietHours.end.split(':')[1]);

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const firestore = db;
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), {
        read: true,
        readAt: Date.now()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const firestore = db;
    if (!firestore) return;
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification =>
        updateDoc(doc(firestore, 'notifications', notification.id), {
          read: true,
          readAt: Date.now()
        })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    const firestore = db;
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), {
        deleted: true,
        deletedAt: Date.now()
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    const icons = {
      kyc_result: '🆔',
      kyb_result: '🏢',
      pitch_analyzed: '📊',
      interest_acceptance: '🤝',
      new_room: '💬',
      mention: '📢',
      task_due: '⏰',
      event_starting: '📅',
      file_viewed: '📁',
      room_created: '🏠'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-400',
      medium: 'text-blue-400',
      high: 'text-yellow-400',
      urgent: 'text-red-400'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-400';
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${
                    !notification.read ? 'bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Founder Logo or Icon */}
                    {notification.founderLogo || notification.data?.founderLogo ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img 
                          src={notification.founderLogo || notification.data?.founderLogo || ''} 
                          alt="Founder"
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold" style={{ display: 'none' }}>
                          {notification.title?.charAt(0) || 'F'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => {
                // Navigate to notifications settings
                window.location.href = '/settings/notifications';
              }}
              className="w-full text-sm text-blue-400 hover:text-blue-300 text-center"
            >
              Notification Settings
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}

// Notification Service Hook
export function useNotificationService() {
  const { user } = useAuth();

  const createNotification = async (notification: Omit<Notification, 'id' | 'userId'>) => {
    if (!user) return;

    const firestore = db;
    if (!firestore) return;

    try {
      await addDoc(collection(firestore, 'notifications'), {
        ...notification,
        userId: user.uid,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const sendEmailNotification = async (notification: Notification) => {
    // Implementation would call your email service
    console.log('Sending email notification:', notification);
  };

  const sendPushNotification = async (notification: Notification) => {
    // Implementation would call your push notification service
    console.log('Sending push notification:', notification);
  };

  return {
    createNotification,
    sendEmailNotification,
    sendPushNotification
  };
}
