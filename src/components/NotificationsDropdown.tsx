"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { notificationManager } from '@/lib/notification-manager';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: Date;
  source: 'chat' | 'milestone' | 'project' | 'team' | 'system' | 'deal' | 'admin' | 'message';
  metadata?: any;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const router = useRouter();
  const { claims } = useAuth();
  const userRole = claims?.role;

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load sound preference from localStorage
  useEffect(() => {
    const soundPref = localStorage.getItem('notificationSoundEnabled');
    if (soundPref !== null) {
      setIsSoundEnabled(soundPref === 'true');
    }
  }, []);

  // Subscribe to real-time notifications with role-based filtering
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((newNotifications) => {
      // Filter notifications based on user role
      const filteredNotifications = filterNotificationsByRole(newNotifications, userRole);
      setNotifications(filteredNotifications);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [userRole]);

  // Filter notifications based on user role
  const filterNotificationsByRole = (notifs: Notification[], role: string | undefined): Notification[] => {
    if (!role) return notifs;

    return notifs.filter(notification => {
      const source = notification.source.toLowerCase();
      
      // Admin can see all notifications
      if (role === 'admin') {
        return true;
      }

      // Block admin notifications for non-admin users
      if (source === 'admin' || source.includes('admin')) {
        return false;
      }

      // ENHANCED: Role-specific filtering - includes call notifications for all roles
      switch (role) {
        case 'founder':
          // Founders can see: chat, calls, projects, deals, milestones, system
          return ['chat', 'message', 'call', 'project', 'deal', 'milestone', 'system', 'team'].includes(source);
        
        case 'vc':
          // VCs can see: chat, calls, deals, projects (review), system
          return ['chat', 'message', 'call', 'deal', 'project', 'system', 'team'].includes(source);
        
        case 'exchange':
          // Exchange can see: deals, system, team, chat, calls
          return ['deal', 'system', 'team', 'chat', 'message', 'call'].includes(source);
        
        case 'ido':
          // IDO can see: projects, deals, system, team, chat, calls
          return ['project', 'deal', 'system', 'team', 'chat', 'message', 'call'].includes(source);
        
        case 'influencer':
          // Influencer can see: projects, system, team, chat, calls
          return ['project', 'system', 'team', 'chat', 'message', 'call'].includes(source);
        
        case 'agency':
          // Agency can see: projects, team, system, chat, calls
          return ['project', 'team', 'system', 'chat', 'message', 'call'].includes(source);
        
        default:
          // General users can see: chat, calls, system
          return ['chat', 'message', 'call', 'system'].includes(source);
      }
    });
  };

  // Toggle sound on/off
  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    localStorage.setItem('notificationSoundEnabled', String(newState));
    
    // Update notification manager sound preference
    if (typeof window !== 'undefined') {
      (window as any).notificationSoundEnabled = newState;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const markAsRead = (id: string) => {
    notificationManager.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationManager.markAllAsRead();
  };

  const getIcon = (type: string, source: string) => {
    // Use source-specific icons when available
    if (source === 'chat' || source.includes('message')) {
      return <NeonCyanIcon type="chat" size={20} className="text-blue-400" />;
    } else if (source === 'project' || source.includes('project')) {
      return <NeonCyanIcon type="rocket" size={20} className="text-purple-400" />;
    } else if (source === 'deal' || source.includes('deal')) {
      return <NeonCyanIcon type="document" size={20} className="text-green-400" />;
    } else if (source === 'team' || source.includes('team')) {
      return <NeonCyanIcon type="users" size={20} className="text-orange-400" />;
    } else if (source === 'admin' || source.includes('admin')) {
      return <NeonCyanIcon type="shield" size={20} className="text-red-400" />;
    }

    // Fallback to type-based icons
    switch (type) {
      case 'success':
        return <NeonCyanIcon type="check" size={20} className="text-green-400" />;
      case 'warning':
        return <NeonCyanIcon type="exclamation" size={20} className="text-yellow-400" />;
      case 'error':
        return <NeonCyanIcon type="exclamation" size={20} className="text-red-400" />;
      default:
        return <NeonCyanIcon type="info" size={20} className="text-blue-400" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate if URL is provided
    if (notification.metadata?.url) {
      router.push(notification.metadata.url);
      onClose();
    } else {
      // Default navigation based on source
      switch (notification.source) {
        case 'chat':
        case 'message':
          router.push('/messages');
          break;
        case 'project':
          router.push('/projects');
          break;
        case 'deal':
          router.push('/deals');
          break;
        case 'admin':
          router.push('/admin/dashboard');
          break;
        default:
          // Stay on current page
          break;
      }
      onClose();
    }
  };

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute top-12 right-0 w-96 bg-black backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-dropdown"
        >
          {/* Header with horizontal NOTIFICATIONS Text */}
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight tracking-tight">
              Notifications
            </h3>
          </div>
          
          {/* Header - Minimal, no border */}
          {unreadCount > 0 && (
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white/60 font-medium">{unreadCount} unread</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Sound Toggle Button */}
                <button
                  onClick={toggleSound}
                  className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all duration-200 group relative border border-white/20 hover:border-white/30"
                  title={isSoundEnabled ? 'Mute notifications' : 'Enable sound'}
                >
                  {isSoundEnabled ? (
                    <NeonCyanIcon type="microphone" size={16} className="text-green-400" />
                  ) : (
                    <NeonCyanIcon type="bell-slash" size={16} className="text-red-400" />
                  )}
                </button>
                
                <button
                  onClick={markAllAsRead}
                  className="text-white/60 hover:text-white text-xs font-medium transition-colors px-2 py-1 rounded hover:bg-white/10"
                >
                  Mark all read
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/30"
                >
                  <NeonCyanIcon type="close" size={16} className="text-white" />
                </button>
              </div>
            </div>
          )}
          
          {/* Close button when no unread */}
          {unreadCount === 0 && (
            <div className="absolute top-4 right-4">
              <button
                onClick={onClose}
                className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/30"
              >
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-left">
                <p className="text-white/40 text-sm font-medium">No noti yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer group ${
                      !notification.isRead ? 'bg-white/5 border-l-2 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type, notification.source)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white text-sm font-medium truncate group-hover:text-white/90 transition-colors">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                          )}
                        </div>
                        <p className="text-white/70 text-xs mt-1 line-clamp-2 group-hover:text-white/80 transition-colors">
                          {notification.message}
                        </p>
                        <p className="text-white/50 text-xs mt-2 group-hover:text-white/60 transition-colors">
                          {getTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Only show when there are notifications */}
          {notifications.length > 0 && (
            <div className="p-3 pl-20 border-t border-white/10">
              <button className="w-full text-center text-white/60 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/5 border border-white/10 hover:border-white/20">
                View all notifications
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationsDropdown;
