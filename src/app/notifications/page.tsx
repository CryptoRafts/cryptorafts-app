"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, db } from '@/lib/firebase.client';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import PerfectHeader from '@/components/PerfectHeader';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const notificationsContext = useNotifications();
  const notifications = notificationsContext?.notifications || [];
  const markAllAsRead = notificationsContext?.markAllAsRead || (() => {});
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter((n: any) => !n.read)
    : notifications;

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read && notification.id) {
      try {
        if (db) {
          await updateDoc(doc(db, 'notifications', notification.id), {
            read: true
          });
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <PerfectHeader />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <NeonCyanIcon type="bell" size={32} className="text-cyan-400" />
              <h1 className="text-4xl font-bold text-white">Notifications</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-black/60 text-cyan-400/70 border-2 border-cyan-400/20'
                }`}
              >
                {filter === 'all' ? 'Show Unread' : 'Show All'}
              </button>
              {notifications.filter((n: any) => !n.read).length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-black/60 backdrop-blur-lg rounded-xl p-12 text-center border-2 border-cyan-400/20">
            <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyan-400/30">
              <NeonCyanIcon type="bell" size={40} className="text-cyan-400/50" />
            </div>
            <p className="text-cyan-400/70 text-lg font-medium mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
            <p className="text-cyan-400/50 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification: any) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20 cursor-pointer transition-all hover:bg-black/80 hover:border-cyan-400/50 ${
                  notification.read 
                    ? 'border-cyan-400/10' 
                    : 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {notification.type === 'chat' ? (
                      <NeonCyanIcon type="chat" size={24} className="text-cyan-400" />
                    ) : notification.type === 'project' ? (
                      <NeonCyanIcon type="rocket" size={24} className="text-green-400" />
                    ) : (
                      <NeonCyanIcon type="bell" size={24} className="text-cyan-400/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className={`text-base font-medium mb-1 ${
                          notification.read ? 'text-cyan-400/70' : 'text-white'
                        }`}>
                          {notification.title || notification.message || notification.text || 'New notification'}
                        </p>
                        {notification.message && notification.title && (
                          <p className="text-sm text-cyan-400/60 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        {notification.createdAt && (
                          <p className="text-xs text-cyan-400/50 mt-2">
                            {new Date(
                              notification.createdAt.seconds 
                                ? notification.createdAt.seconds * 1000 
                                : notification.createdAt
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {!notification.read && (
                        <div className="w-3 h-3 bg-cyan-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

