"use client";

import { useState, useEffect, useCallback } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc } from '@/lib/firebase.client';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'chat' | 'deal' | 'project' | 'team';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
  icon?: 'chat' | 'deal' | 'project' | 'team';
}

interface VCNotificationsProps {
  userId: string;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
}

export default function VCNotifications({ userId, soundEnabled = true, onSoundToggle }: VCNotificationsProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Two-tone notification sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!userId || !db) return;

    // Listen to chat notifications
    const dbInstance = db;
    const chatsQuery = query(
      collection(dbInstance, 'groupChats'),
      where('members', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const newNotifications: Notification[] = [];
      
      snapshot.docs.forEach(doc => {
        const chatData = doc.data();
        const unreadCount = chatData.unreadCount?.[userId] || 0;
        
        if (unreadCount > 0 && chatData.lastMessage) {
          newNotifications.push({
            id: doc.id,
            type: 'chat',
            title: chatData.name || 'Chat Room',
            message: `${chatData.lastMessage.senderName}: ${chatData.lastMessage.text || chatData.lastMessage.content || 'New message'}`,
            timestamp: chatData.lastMessage.createdAt || chatData.lastMessage.timestamp || Date.now(),
            read: false,
            link: `/messages?room=${doc.id}`,
            icon: 'chat'
          });
        }
      });

      // Sort by timestamp
      newNotifications.sort((a, b) => b.timestamp - a.timestamp);

      // Play sound if new notifications
      if (newNotifications.length > notifications.length) {
        playNotificationSound();
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const latestNotif = newNotifications[0];
          new Notification(latestNotif.title, {
            body: latestNotif.message,
            icon: '/logo.png',
            badge: '/logo.png'
          });
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    // Don't auto-request browser notifications - use in-app notifications
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('🔔 Using in-app notifications');
    }

    return () => unsubscribe();
  }, [userId, playNotificationSound, notifications.length]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      router.push(notification.link);
      setShowPanel(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <NeonCyanIcon type="chat" size={20} className="text-blue-400" />;
      default:
        return <NeonCyanIcon type="bell" size={20} className="text-white/60" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`relative p-3 rounded-lg transition-all ${
          unreadCount > 0
            ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
        title={`${unreadCount} unread notifications`}
      >
        <NeonCyanIcon type="bell" size={24} className="text-current" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-lg">Notifications</h3>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <NeonCyanIcon type="close" size={20} className="text-white/60" />
                </button>
              </div>
              
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Mark all as read
                  </button>
                  <span className="text-white/40">•</span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <NeonCyanIcon type="bell" size={64} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 transition-colors ${
                        notification.read
                          ? 'bg-transparent hover:bg-white/5'
                          : 'bg-blue-500/10 hover:bg-blue-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.icon || notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-white font-semibold text-sm truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full ml-2" />
                            )}
                          </div>
                          <p className="text-white/70 text-xs line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          <span className="text-white/40 text-xs">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10 bg-black/50">
                <button
                  onClick={() => {
                    router.push('/messages');
                    setShowPanel(false);
                  }}
                  className="w-full py-2 text-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  View all messages →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

