"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { realTimeNotificationManager, RealTimeNotification } from '@/lib/real-time-notification-manager';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UniversalNotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { user, claims } = useAuth();
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Initialize real-time notification manager
    realTimeNotificationManager.initialize({
      uid: user.uid,
      role: claims?.role || 'user',
      email: user.email
    });

    // Subscribe to notifications
    const unsubscribe = realTimeNotificationManager.subscribe(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, claims]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <NeonCyanIcon type="chat" size={20} className="text-blue-400" />;
      case 'project':
        return <NeonCyanIcon type="document" size={20} className="text-green-400" />;
      case 'deal':
        return <NeonCyanIcon type="dollar" size={20} className="text-yellow-400" />;
      case 'campaign':
        return <NeonCyanIcon type="megaphone" size={20} className="text-purple-400" />;
      case 'kyc':
      case 'kyb':
        return <NeonCyanIcon type="shield" size={20} className="text-cyan-400" />;
      case 'system':
        return <NeonCyanIcon type="settings" size={20} className="text-gray-400" />;
      default:
        return <NeonCyanIcon type="bell" size={20} className="text-white" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'project':
        return 'border-green-500/30 bg-green-500/10';
      case 'deal':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'campaign':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'kyc':
      case 'kyb':
        return 'border-cyan-500/30 bg-cyan-500/10';
      case 'system':
        return 'border-gray-500/30 bg-gray-500/10';
      default:
        return 'border-white/20 bg-white/5';
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.uid) return;
    
    await realTimeNotificationManager.markAsRead(notificationId, user.uid);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    
    await realTimeNotificationManager.markAllAsRead(user.uid);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-black/90 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <NeonCyanIcon type="bell" size={20} className="text-cyan-400" />
          <h3 className="text-white font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <NeonCyanIcon type="close" size={20} className="text-current" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-8">
            <NeonCyanIcon type="bell" size={48} className="text-white/30 mx-auto mb-3" />
            <p className="text-white/60">No notifications yet</p>
          </div>
        ) : (
          <div className="p-2">
            {notifications.slice(0, 20).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg mb-2 border transition-all duration-200 hover:bg-white/5 ${
                  notification.read ? 'opacity-60' : ''
                } ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium text-sm truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-white/40 text-xs">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            <NeonCyanIcon type="check" size={16} className="text-current" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.metadata && (
                      <div className="mt-2 text-xs text-white/50">
                        {notification.type === 'chat' && notification.metadata.sender && (
                          <span>From: {notification.metadata.sender}</span>
                        )}
                        {notification.type === 'project' && notification.metadata.projectName && (
                          <span>Project: {notification.metadata.projectName}</span>
                        )}
                        {notification.type === 'deal' && notification.metadata.amount && (
                          <span>Amount: ${notification.metadata.amount.toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>{notifications.length} total notifications</span>
            <span>{unreadCount} unread</span>
          </div>
        </div>
      )}
    </div>
  );
}
