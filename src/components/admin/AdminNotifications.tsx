"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { 
  listenToAdminNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  AdminNotification 
} from '@/lib/admin-notifications';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

export default function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = listenToAdminNotifications(user.email, (notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => n.status === 'unread').length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'kyc_submission': return <ShieldCheckIcon className="w-5 h-5 text-blue-400" />;
      case 'kyb_submission': return <BuildingOfficeIcon className="w-5 h-5 text-purple-400" />;
      case 'spotlight_request': return <SparklesIcon className="w-5 h-5 text-yellow-400" />;
      case 'payment': return <CurrencyDollarIcon className="w-5 h-5 text-green-400" />;
      default: return <BellIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="w-6 h-6 text-yellow-400 animate-pulse" />
        ) : (
          <BellIcon className="w-6 h-6 text-white/70" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <BellIcon className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-700 hover:bg-white/5 transition-colors cursor-pointer ${
                      notif.status === 'unread' ? 'bg-purple-500/10' : ''
                    }`}
                    onClick={() => {
                      if (notif.status === 'unread') {
                        handleMarkAsRead(notif.id);
                      }
                      if (notif.actionUrl) {
                        window.location.href = notif.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm mb-1">
                          {notif.title}
                          {notif.status === 'unread' && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                          )}
                        </p>
                        <p className="text-white/70 text-xs mb-2">{notif.message}</p>
                        <p className="text-white/40 text-xs">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {notif.status === 'unread' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="flex-shrink-0 text-purple-400 hover:text-purple-300"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

