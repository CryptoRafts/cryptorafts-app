"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/providers/AuthProvider';
import AIAssistantModal from './AIAssistantModal';
import AdaptiveLogo from './AdaptiveLogo';
import RoleNavigation from './RoleNavigation';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Notifications Component - UNIVERSAL FOR ALL ROLES
function NotificationsComponent({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  useEffect(() => {
    if (!user?.uid || !user?.role) {
      console.log('❌ No user or role, skipping notifications');
      return;
    }

    const loadNotifications = async () => {
      try {
        const { collection, query, where, onSnapshot, orderBy, limit } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase.client');
        
        if (!db) {
          console.warn('⚠️ Firestore not initialized, skipping notifications loading.');
          return;
        }
        
        console.log('🔔 Loading INDIVIDUAL notifications for user:', user.uid, 'role:', user.role);
        
        const unsubscribers: (() => void)[] = [];
        let allNotifs: any[] = [];
        let isMounted = true;

        // ===== 1. USER-SPECIFIC NOTIFICATIONS (All Roles) =====
        // Listen for notifications specifically sent to this user
        const userNotificationsQuery = query(
          collection(db!, 'userNotifications'),
          where('userId', '==', user.uid),
          where('isRead', '==', false),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const unsubscribeUserNotifs = onSnapshot(userNotificationsQuery, (snapshot) => {
          if (!isMounted) return;
          console.log('📬 User-specific notifications:', snapshot.docs.length);
          const userNotifs = snapshot.docs.map(doc => ({
            id: doc.id,
            type: doc.data().type || 'system',
            title: doc.data().title,
            message: doc.data().message,
            sender: doc.data().senderName || 'System',
            timestamp: doc.data().createdAt?.toMillis() || Date.now(),
            unread: !doc.data().isRead,
            metadata: doc.data().metadata || {}
          }));
          
          mergeNotifications(userNotifs, 'user');
        }, (error: any) => {
          // Suppress "Target ID already exists" errors
          if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
            console.log('⚠️ User notifications listener already exists, skipping...');
            return;
          }
          console.error('Error in user notifications listener:', error);
        });

        unsubscribers.push(unsubscribeUserNotifs);

        // ===== 2. CHAT NOTIFICATIONS (All Roles - Only MY chats) =====
        const chatsQuery = query(
          collection(db!, 'groupChats'),
          where('members', 'array-contains', user.uid)
        );

        const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
          console.log('💬 Checking chats for user:', user.uid);
          const chatNotifs: any[] = [];
          
          snapshot.docs.forEach(doc => {
            const chatData = doc.data();
            const unreadCount = chatData.unreadCount?.[user.uid] || 0;
            const lastMessage = chatData.lastMessage;
            
            // Only show if: 1) I have unread messages, 2) Last message is not from me
            if (unreadCount > 0 && lastMessage && lastMessage.senderId !== user.uid) {
              chatNotifs.push({
                id: `chat_${doc.id}_${lastMessage.createdAt}`,
                type: 'chat',
                title: `💬 ${chatData.name || 'Chat'}`,
                message: `${lastMessage.senderName || 'Someone'}: ${lastMessage.text?.substring(0, 50) || 'New message'}`,
                sender: lastMessage.senderName || 'Someone',
                timestamp: lastMessage.createdAt || Date.now(),
                unread: true,
                chatId: doc.id,
                metadata: { chatId: doc.id, unreadCount }
              });
            }
          });

          console.log('💬 Chat notifications for', user.uid, ':', chatNotifs.length);
          // mergeNotifications(chatNotifs, 'chat');
        });

        unsubscribers.push(unsubscribeChats);

        // ===== 3. ROLE-SPECIFIC NOTIFICATIONS =====
        
        // VCs: New pitch submissions
        if (user.role === 'vc') {
          console.log('💼 Setting up VC pitch notifications for:', user.uid);
          
          const pitchesQuery = query(
            collection(db!, 'projects'),
            where('status', 'in', ['pending', 'submitted', 'review']),
            orderBy('createdAt', 'desc'),
            limit(10)
          );

          const unsubscribePitches = onSnapshot(pitchesQuery, (snapshot) => {
            const pitchNotifs: any[] = [];
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            
            snapshot.docs.forEach(doc => {
              const pitchData = doc.data();
              const createdAt = pitchData.createdAt || 0;
              
              // Only recent pitches (last 24 hours)
              if (createdAt > oneDayAgo) {
                pitchNotifs.push({
                  id: `pitch_${doc.id}`,
                  type: 'pitch',
                  title: `🚀 New Pitch: ${pitchData.name || 'Project'}`,
                  message: pitchData.tagline || pitchData.description || 'New project for review',
                  sender: pitchData.founderName || 'Founder',
                  timestamp: createdAt,
                  unread: true,
                  projectId: doc.id,
                  metadata: { projectId: doc.id, sector: pitchData.sector }
                });
              }
            });

            console.log('🚀 VC pitch notifications:', pitchNotifs.length);
            // mergeNotifications(pitchNotifs, 'pitch');
          });

          unsubscribers.push(unsubscribePitches);
        }

        // Founders: Deal responses, funding updates
        if (user.role === 'founder') {
          console.log('👨‍💼 Setting up Founder notifications for:', user.uid);
          
          const founderProjectsQuery = query(
            collection(db!, 'projects'),
            where('founderId', '==', user.uid),
            where('status', 'in', ['approved', 'rejected', 'in_review'])
          );

          const unsubscribeFounderProjects = onSnapshot(founderProjectsQuery, (snapshot) => {
            const projectNotifs: any[] = [];
            
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'modified') {
                const projectData = change.doc.data();
                const updateTime = projectData.updatedAt?.toMillis() || 0;
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                
                // Only notify about recent updates
                if (updateTime > fiveMinutesAgo) {
                  let title = '📊 Project Updated';
                  let icon = '📊';
                  
                  if (projectData.status === 'approved') {
                    title = '✅ Project Approved!';
                    icon = '✅';
                  } else if (projectData.status === 'rejected') {
                    title = '❌ Project Needs Attention';
                    icon = '❌';
                  }
                  
                  projectNotifs.push({
                    id: `project_update_${change.doc.id}_${updateTime}`,
                    type: 'project',
                    title,
                    message: `${projectData.name || 'Your project'} - ${projectData.status}`,
                    sender: 'System',
                    timestamp: updateTime,
                    unread: true,
                    projectId: change.doc.id,
                    metadata: { projectId: change.doc.id, status: projectData.status }
                  });
                }
              }
            });

            console.log('📊 Founder project notifications:', projectNotifs.length);
            // mergeNotifications(projectNotifs, 'projects');
          });

          unsubscribers.push(unsubscribeFounderProjects);
        }

        // Exchange/IDO: Listing requests
        if (user.role === 'exchange' || user.role === 'ido') {
          console.log('🏦 Setting up Exchange/IDO notifications for:', user.uid);
          
          const listingsQuery = query(
            collection(db!, 'listingRequests'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(10)
          );

          const unsubscribeListings = onSnapshot(listingsQuery, (snapshot) => {
            const listingNotifs: any[] = [];
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            
            snapshot.docs.forEach(doc => {
              const listingData = doc.data();
              const createdAt = listingData.createdAt?.toMillis() || 0;
              
              if (createdAt > oneDayAgo) {
                listingNotifs.push({
                  id: `listing_${doc.id}`,
                  type: 'listing',
                  title: `📋 New Listing Request`,
                  message: `${listingData.projectName || 'Project'} - ${listingData.tokenSymbol || 'Token'}`,
                  sender: listingData.applicantName || 'Applicant',
                  timestamp: createdAt,
                  unread: true,
                  listingId: doc.id,
                  metadata: { listingId: doc.id }
                });
              }
            });

            console.log('📋 Listing notifications:', listingNotifs.length);
            // mergeNotifications(listingNotifs, 'listings');
          });

          unsubscribers.push(unsubscribeListings);
        }

        // Admin: System-wide notifications
        if (user.role === 'admin') {
          console.log('👑 Setting up Admin notifications for:', user.uid);
          
          const adminQuery = query(
            collection(db!, 'adminAlerts'),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc'),
            limit(10)
          );

          const unsubscribeAdmin = onSnapshot(adminQuery, (snapshot) => {
            const adminNotifs: any[] = [];
            const oneHourAgo = Date.now() - 60 * 60 * 1000;
            
            snapshot.docs.forEach(doc => {
              const alertData = doc.data();
              const createdAt = alertData.createdAt?.toMillis() || 0;
              
              if (createdAt > oneHourAgo) {
                adminNotifs.push({
                  id: `admin_${doc.id}`,
                  type: 'admin',
                  title: `⚠️ ${alertData.title || 'Admin Alert'}`,
                  message: alertData.message || 'System alert',
                  sender: 'System',
                  timestamp: createdAt,
                  unread: true,
                  metadata: { alertType: alertData.type }
                });
              }
            });

            console.log('👑 Admin notifications:', adminNotifs.length);
            // mergeNotifications(adminNotifs, 'admin');
          });

          unsubscribers.push(unsubscribeAdmin);
        }

        // Storage for all notification types
        let notifStorage: Record<string, any[]> = {
          user: [],
          chat: [],
          pitch: [],
          projects: [],
          listings: [],
          admin: []
        };

        const mergeNotifications = (newNotifs: any[], type: string) => {
          notifStorage[type] = newNotifs;
          
          // Combine all notifications
          const combined = Object.values(notifStorage)
            .flat()
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50); // Keep only 50 most recent
          
          console.log(`🔔 [${user.role}] Total notifications for ${user.uid}:`, combined.length, notifStorage);

          // Play sound only for NEW notifications
          // if (combined.length > lastNotificationCount && soundEnabled) {
          //   console.log('🔔 Playing sound - new notification detected');
          //   playNotificationSound();
          // }
          
          // setLastNotificationCount(combined.length);
          // setNotifications(combined);
        };

        // Return cleanup function
        return () => {
          isMounted = false;
          console.log('🔔 Cleaning up notification listeners for', user.uid);
          unsubscribers.forEach(unsub => {
            try {
              unsub();
            } catch (error) {
              // Ignore cleanup errors
            }
          });
        };
      } catch (error: any) {
        // Suppress "Target ID already exists" errors
        if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
          console.log('⚠️ Notification listener already exists, skipping...');
          return () => {}; // Return empty cleanup function
        }
        console.error('❌ Error loading notifications:', error);
        return () => {}; // Return empty cleanup function on error
      }
    };

    let cleanup: (() => void) | null = null;
    
    loadNotifications().then((cleanupFn) => {
      cleanup = cleanupFn || null;
    });

    return () => {
      if (cleanup) {
        try {
          cleanup();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [user?.uid, user?.role, soundEnabled]);

  // Load sound preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSoundPref = localStorage.getItem('notificationSound');
      if (savedSoundPref !== null) {
        setSoundEnabled(savedSoundPref === 'true');
      }
    }
  }, []);

  // Save sound preference when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationSound', soundEnabled.toString());
    }
  }, [soundEnabled]);

  const playNotificationSound = () => {
    if (!soundEnabled) {
      console.log('🔇 Sound muted');
      return;
    }

    try {
      console.log('🔔 Playing notification sound...');
      // Create a pleasant notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
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
    }
  };

  const testNotification = () => {
    console.log('🧪 Testing notification...');
    const testNotif = {
      id: 'test_notification',
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification',
      sender: 'System',
      timestamp: Date.now(),
      unread: true,
      chatId: 'test_chat'
    };
    
    // setNotifications([testNotif]);
    // playNotificationSound();
  };

  const totalUnread = notifications.filter(n => n.unread).length;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ y: 0 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/70 rounded-lg ${
          isOpen ? 'ring-2 ring-teal-400/60' : ''
        }`}
        aria-label={`Notifications ${totalUnread > 0 ? `(${totalUnread} unread)` : ''}`}
      >
        <NeonCyanIcon type="bell" size={20} className="text-current" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50"
          >
            <div className="px-4 py-2 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`text-xs px-2 py-1 rounded ${
                    soundEnabled 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {soundEnabled ? '🔔' : '🔕'}
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <NeonCyanIcon type="bell" size={32} className="text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  // Determine notification link based on type
                  let notifLink = '/messages';
                  if (notification.type === 'chat' && notification.chatId) {
                    notifLink = `/messages?room=${notification.chatId}`;
                  } else if (notification.type === 'pitch' && notification.projectId) {
                    notifLink = `/${user?.role}/dealflow`;
                  } else if (notification.type === 'project' && notification.projectId) {
                    notifLink = `/founder/pitch`;
                  } else if (notification.type === 'listing' && notification.listingId) {
                    notifLink = `/${user?.role}/listings`;
                  } else if (notification.type === 'admin') {
                    notifLink = '/admin/dashboard';
                  } else if (notification.metadata?.url) {
                    notifLink = notification.metadata.url;
                  }

                  // Determine notification icon color and badge based on type
                  const notifTypeConfig = {
                    chat: { color: 'bg-blue-400', badge: '💬 Chat', badgeClass: 'bg-blue-500/20 text-blue-400' },
                    pitch: { color: 'bg-green-400', badge: '🚀 Pitch', badgeClass: 'bg-green-500/20 text-green-400' },
                    project: { color: 'bg-purple-400', badge: '📊 Project', badgeClass: 'bg-purple-500/20 text-purple-400' },
                    listing: { color: 'bg-yellow-400', badge: '📋 Listing', badgeClass: 'bg-yellow-500/20 text-yellow-400' },
                    admin: { color: 'bg-red-400', badge: '⚠️ Admin', badgeClass: 'bg-red-500/20 text-red-400' },
                    system: { color: 'bg-gray-400', badge: '🔔 System', badgeClass: 'bg-gray-500/20 text-gray-400' }
                  };

                  const config = notifTypeConfig[notification.type as keyof typeof notifTypeConfig] || notifTypeConfig.system;

                  return (
                    <Link
                      key={notification.id}
                      href={notifLink}
                      className="block px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.unread ? config.color : 'bg-transparent'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {notification.title}
                            </p>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${config.badgeClass}`}>
                              {config.badge}
                            </span>
                            {notification.metadata?.unreadCount > 1 && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                {notification.metadata.unreadCount} new
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            
            <div className="px-4 py-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <Link
                  href="/messages"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View all chats →
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={testNotification}
                    className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  >
                    Test Sound
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔔 Current notifications:', notifications);
                      console.log('🔔 User:', user);
                      console.log('🔔 Sound enabled:', soundEnabled);
                    }}
                    className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                  >
                    Debug
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Command Palette Component
function CommandPalette({ isOpen, onClose, onSearch }: { isOpen: boolean; onClose: () => void; onSearch?: (q: string) => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50"
        >
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <form onSubmit={handleSubmit} className="p-4">
                <div className="flex items-center gap-3">
                  <NeonCyanIcon type="search" size={20} className="text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="flex-1 bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none text-lg"
                    aria-label="Search projects"
                  />
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-md text-xs text-slate-400">
                    <CommandLineIcon className="h-3 w-3" />
                    <span>K</span>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Avatar Component with role-specific styling
function Avatar({ user, org, size = 36, className = "" }: { 
  user?: any; 
  org?: any; 
  size?: number; 
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  
  const getInitials = () => {
    if (user?.initials) return user.initials;
    if (user?.name) {
      const parts = user.name.split(' ');
      return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : user.name[0].toUpperCase();
    }
    if (org?.name) {
      const parts = org.name.split(' ');
      return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : org.name[0].toUpperCase();
    }
    return 'U';
  };

  const getRoleIcon = () => {
    const role = user?.role;
    switch (role) {
      case 'founder':
        return '🚀';
      case 'vc':
        return '💼';
      case 'exchange':
        return '🏦';
      case 'ido':
        return '🚀';
      case 'influencer':
        return '📢';
      case 'agency':
        return '📈';
      case 'admin':
        return '👑';
      default:
        return '👤';
    }
  };

  const getRoleGradient = () => {
    const role = user?.role;
    switch (role) {
      case 'founder':
        return 'from-purple-500 to-pink-600';
      case 'vc':
        return 'from-blue-500 to-cyan-600';
      case 'exchange':
        return 'from-green-500 to-emerald-600';
      case 'ido':
        return 'from-orange-500 to-red-600';
      case 'influencer':
        return 'from-yellow-500 to-orange-600';
      case 'agency':
        return 'from-indigo-500 to-purple-600';
      case 'admin':
        return 'from-gray-500 to-gray-700';
      default:
        return 'from-teal-500 to-blue-600';
    }
  };

  const imageSrc = org?.logoURL || user?.photoURL;
  const sizeClass = size === 36 ? 'w-9 h-9' : 'w-10 h-10';
  const textSize = size === 36 ? 'text-sm' : 'text-base';
  const iconSize = size === 36 ? 'text-lg' : 'text-xl';

  if (imageSrc && !imageError) {
    return (
      <img
        src={imageSrc}
        alt={`${user?.name || org?.name || 'User'}'s avatar`}
        className={`${sizeClass} rounded-full object-cover border-2 border-white/30 shadow-lg ${className}`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${getRoleGradient()} flex items-center justify-center border-2 border-white/30 shadow-lg relative overflow-hidden ${className}`}>
      {/* Role icon as background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <span className={iconSize}>{getRoleIcon()}</span>
      </div>
      {/* Initials overlay */}
      <span className={`${textSize} font-bold text-white relative z-10 drop-shadow-sm`}>
        {getInitials()}
      </span>
    </div>
  );
}

// User/Org Menu Component
function UserMenu({ user, org, isOpen, onClose }: { 
  user?: any; 
  org?: any; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { signOut: contextSignOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    try {
      await contextSignOut();
      onClose();
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getPortalLabel = () => {
    if (!user?.role) return 'Portal';
    const roleLabels = {
      founder: 'Founder Portal',
      vc: 'VC Portal', 
      exchange: 'Exchange Portal',
      ido: 'IDO Portal',
      influencer: 'Influencer Portal',
      agency: 'Agency Portal',
      admin: 'Admin Portal'
    };
    return roleLabels[user.role as keyof typeof roleLabels] || 'Portal';
  };

  const getRoleDisplayName = () => {
    if (!user?.role) return '';
    const roleNames = {
      founder: 'Founder',
      vc: 'Venture Capital',
      exchange: 'Exchange',
      ido: 'IDO Launchpad',
      influencer: 'Influencer',
      agency: 'Agency',
      admin: 'Administrator'
    };
    return roleNames[user.role as keyof typeof roleNames] || user.role;
  };

  const showOrganization = user?.role && ['vc', 'exchange', 'ido', 'agency'].includes(user.role);
  const showAdminConsole = user?.role === 'admin';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          ref={menuRef}
          className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header */}
          <div className="px-4 py-4 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/30">
            <div className="flex items-center gap-3">
              <Avatar user={user} org={org} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name || org?.name || 'User'}
                </p>
                <p className="text-xs text-slate-300 truncate font-medium">
                  {user?.email || 'No email'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                    user?.role === 'founder' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    user?.role === 'vc' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    user?.role === 'exchange' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                    user?.role === 'ido' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                    user?.role === 'influencer' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                    user?.role === 'agency' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                    user?.role === 'admin' ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' :
                    'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  }`}>
                    {getRoleDisplayName()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-white/5 transition-colors text-sm"
              onClick={onClose}
              role="menuitem"
            >
              <NeonCyanIcon type="user-circle" size={16} className="text-current" />
              Profile
            </Link>
            
            {showOrganization && (
              <Link
                href="/organization"
                className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-white/5 transition-colors text-sm"
                onClick={onClose}
                role="menuitem"
              >
                <NeonCyanIcon type="building" size={16} className="text-current" />
                Organization
              </Link>
            )}
            
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-white/5 transition-colors text-sm"
              onClick={onClose}
              role="menuitem"
            >
                <NeonCyanIcon type="settings" size={16} className="text-current" />
              Settings
            </Link>
            
            <Link
              href="/billing"
              className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-white/5 transition-colors text-sm"
              onClick={onClose}
              role="menuitem"
            >
                <NeonCyanIcon type="credit-card" size={16} className="text-current" />
              Billing
            </Link>
            
            <Link
              href={`/${user?.role || 'dashboard'}/dashboard`}
              className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-white/5 transition-colors text-sm"
              onClick={onClose}
              role="menuitem"
            >
                <NeonCyanIcon type="shield" size={16} className="text-current" />
              {getPortalLabel()}
            </Link>
            
            {showAdminConsole && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-white/5 transition-colors text-sm"
                onClick={onClose}
                role="menuitem"
              >
                <NeonCyanIcon type="shield" size={16} className="text-current" />
                Admin Console
              </Link>
            )}
          </div>
          
          <div className="border-t border-white/10 my-2"></div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full text-left px-4 py-2 text-slate-200 hover:bg-white/5 transition-colors text-sm"
            role="menuitem"
          >
            <NeonCyanIcon type="user-circle" size={16} className="text-current" />
            Sign out
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mobile Hamburger Menu
function MobileMenu({ 
  isOpen, 
  onClose, 
  user, 
  org, 
  onSearch,
  onOpenAssistant 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user?: any; 
  org?: any;
  onSearch?: (q: string) => void;
  onOpenAssistant?: () => void;
}) {
  const { signOut: contextSignOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  const role = user?.role as string | undefined;
  const kycApproved = Boolean(user?.kycApproved);
  const isFounderWithKYC = role === 'founder' && kycApproved;
  const isVerifiedUser = kycApproved;
  const isOrgRole = ['vc', 'exchange', 'ido', 'agency'].includes(role || '');
  const isAdmin = role === 'admin';
  const showOrganization = role && ['vc', 'exchange', 'ido', 'agency'].includes(role);
  const showAdminConsole = role === 'admin';

  const handleSignOut = async () => {
    try {
      await contextSignOut();
      onClose();
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleOpenAssistantModal = () => {
    onOpenAssistant?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-dropdown sm:hidden"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            ref={menuRef} 
            className="fixed top-20 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            <div className="px-4 py-6 space-y-6">
              {/* Global Navigation */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Navigation
                </h3>
                <div className="space-y-1">
                  <Link 
                    href="/"
                    className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                    onClick={onClose}
                  >
                    <HomeIcon className="h-5 w-5" />
                    Home
                  </Link>
                  <Link 
                    href="/projects"
                    className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                    onClick={onClose}
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                    Project Overview
                  </Link>
                  <Link 
                    href="/support"
                    className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                    onClick={onClose}
                  >
                    <QuestionMarkCircleIcon className="h-5 w-5" />
                    Support
                  </Link>
                  <Link 
                    href="/contact"
                    className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                    onClick={onClose}
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    Contact Us
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Actions
                </h3>
                <div className="space-y-1">
                  <button 
                    onClick={handleOpenAssistantModal}
                    className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                  >
                    <NeonCyanIcon type="sparkles" size={20} className="text-teal-400" />
                    AI Assistant
                  </button>
                  
                  {/* Role-specific navigation will be added below */}
                </div>
              </div>

              {/* Role-specific Navigation */}
              {user?.role && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
                  </h3>
                  <RoleNavigation user={user} onClose={onClose} />
                </div>
              )}

              {/* Account Section */}
              {user ? (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Account
                  </h3>
                  <div className="space-y-1">
                    <Link 
                      href="/profile"
                      className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                      onClick={onClose}
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      Profile
                    </Link>
                    
                    {showOrganization && (
                      <Link 
                        href="/organization"
                        className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                        onClick={onClose}
                      >
                        <NeonCyanIcon type="building" size={20} className="text-current" />
                        Organization
                      </Link>
                    )}
                    
                    <Link 
                      href="/settings"
                      className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                      onClick={onClose}
                    >
                      <NeonCyanIcon type="settings" size={20} className="text-current" />
                      Settings
                    </Link>
                    
                    <Link 
                      href="/billing"
                      className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                      onClick={onClose}
                    >
                      <NeonCyanIcon type="credit-card" size={20} className="text-current" />
                      Billing
                    </Link>
                    
                    <Link 
                      href={`/${user.role}/dashboard`}
                      className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                      onClick={onClose}
                    >
                      <NeonCyanIcon type="shield" size={20} className="text-current" />
                      {user.role === 'founder' ? 'Founder Portal' : 
                       user.role === 'vc' ? 'VC Portal' :
                       user.role === 'exchange' ? 'Exchange Portal' :
                       user.role === 'ido' ? 'IDO Portal' :
                       user.role === 'influencer' ? 'Influencer Portal' :
                       user.role === 'agency' ? 'Agency Portal' :
                       user.role === 'admin' ? 'Admin Portal' : 'Portal'}
                    </Link>
                    
                    {showAdminConsole && (
                      <Link 
                        href="/admin"
                        className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                        onClick={onClose}
                      >
                        <NeonCyanIcon type="shield" size={20} className="text-current" />
                        Admin Console
                      </Link>
                    )}
                    
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors text-slate-200"
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Authentication
                  </h3>
                  <div className="space-y-2">
                    <Link 
                      href="/login"
                      className="block w-full text-left p-3 text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
                      onClick={onClose}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="block w-full text-center p-3 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-lg transition-colors font-medium"
                      onClick={onClose}
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mobile Search Overlay
function MobileSearchOverlay({ isOpen, onClose, onSearch }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSearch?: (q: string) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 sm:hidden"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed top-20 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4"
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="flex-1 bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none text-lg"
                  aria-label="Search projects"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Close search"
                >
                  <NeonCyanIcon type="close" size={20} className="text-current" />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Main Header Component
export type HeaderProps = {
  logoSrc?: string;
  user?: { 
    name?: string; 
    photoURL?: string; 
    initials?: string; 
    role?: "founder"|"vc"|"exchange"|"ido"|"influencer"|"agency"|"admin";
    email?: string;
    kycApproved?: boolean;
  };
  org?: { 
    name?: string; 
    logoURL?: string; 
    email?: string;
  };
  onSearch?: (q: string) => void;
  onOpenAssistant?: () => void;
};

export default function Header({ 
  logoSrc = "/cryptorafts.logo (1).svg",
  user: propUser,
  org,
  onSearch,
  onOpenAssistant
}: HeaderProps) {
  const { user: authUser, signOut } = useAuth();
  const user = propUser || authUser;
  const isAppUser = (value: typeof user): value is NonNullable<HeaderProps['user']> => {
    return typeof value === 'object' && value !== null && 'role' in value;
  };

  const userRole = isAppUser(user) ? user.role : undefined;
  const userKycApproved = isAppUser(user) ? user.kycApproved : undefined;
  const appUser = isAppUser(user) ? user : undefined;
  const headerRole = userRole;
  const headerKycApproved = !!userKycApproved;
  const headerDisplayName = appUser?.name ?? authUser?.displayName ?? authUser?.email?.split('@')[0] ?? 'User';
  const headerEmail = appUser?.email ?? authUser?.email ?? 'No email';
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const userButtonRef = useRef<HTMLButtonElement>(null);

  const handleOpenAssistantModal = () => {
    setIsAIAssistantOpen(true);
    onOpenAssistant?.();
  };

  // Handle Command+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const isFounderWithKYC = userRole === 'founder' && !!userKycApproved;
  const isVerifiedUser = !!userKycApproved;
  const isOrgRole = ['vc', 'exchange', 'ido', 'agency'].includes(userRole || '');
  const isAdmin = userRole === 'admin';

  return (
    <>
      <header className="sticky top-0 z-50 neo-glass-header w-full">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
          {/* Mobile Layout (≤640px) */}
          <div className="flex items-center justify-between h-40 sm:hidden">
            {/* Left: Logo - Adaptive for small screens */}
            <Link href="/" className="flex items-center relative z-10" aria-label="Cryptorafts home">
              <AdaptiveLogo 
                defaultLogoSrc={logoSrc}
                smallScreenLogoSrc="/logofor-smallscreens.png"
                alt="Cryptorafts"
                className="logo-responsive relative z-10"
                priority={true}
              />
            </Link>

            {/* Center: Search Icon */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/70 rounded"
              aria-label="Search projects"
            >
              <NeonCyanIcon type="search" size={20} className="text-current" />
            </button>

            {/* Right: Notifications + Avatar + Hamburger */}
            <div className="flex items-center gap-3">
              {/* Mobile Notifications */}
              {user && <NotificationsComponent user={user} />}
              
              {(user || org) && (
                <button
                  ref={userButtonRef}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/70"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <Avatar user={user} org={org} size={36} />
                </button>
              )}
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/70 rounded"
                aria-expanded={isMobileMenuOpen}
                aria-label="Open menu"
              >
                <NeonCyanIcon type="menu" size={20} className="text-current" />
              </button>
            </div>
          </div>

          {/* Desktop Layout (≥640px) */}
          <div className="hidden sm:flex items-center justify-between h-44">
            {/* Left: Logo - Adaptive for desktop */}
            <Link href="/" className="flex items-center relative z-10" aria-label="Cryptorafts home">
              <AdaptiveLogo 
                defaultLogoSrc={logoSrc}
                smallScreenLogoSrc="/logofor-smallscreens.png"
                alt="Cryptorafts"
                className="logo-responsive relative z-10"
                priority={true}
              />
            </Link>

            {/* Center: Role Navigation + Search */}
            <div className="flex-1 flex items-center gap-8">
              {/* Role-specific Navigation (Desktop) */}
              {headerRole && (
                <nav className="hidden lg:flex items-center gap-6">
                  <Link 
                    href={`/${headerRole}/dashboard`}
                    className="text-slate-200 hover:text-white transition-colors text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  {headerRole === 'founder' && headerKycApproved && (
                    <Link 
                      href="/founder/pitch"
                      className="text-slate-200 hover:text-white transition-colors text-sm font-medium"
                    >
                      Pitch
                    </Link>
                  )}
                  {(headerRole === 'vc' || headerRole === 'exchange' || headerRole === 'ido') && headerKycApproved && (
                    <Link 
                      href={`/${headerRole}/dealflow`}
                      className="text-slate-200 hover:text-white transition-colors text-sm font-medium"
                    >
                      {headerRole === 'vc' ? 'Dealflow' : headerRole === 'exchange' ? 'Listings' : 'Projects'}
                    </Link>
                  )}
                  {headerRole === 'vc' && headerKycApproved && (
                    <Link 
                      href="/messages"
                      className="text-slate-200 hover:text-white transition-colors text-sm font-medium"
                    >
                      Chat
                    </Link>
                  )}
                  {headerRole === 'influencer' && headerKycApproved && (
                    <Link 
                      href="/influencer/campaigns"
                      className="text-slate-200 hover:text-white transition-colors text-sm font-medium"
                    >
                      Campaigns
                    </Link>
                  )}
                  {headerRole === 'agency' && headerKycApproved && (
                    <Link 
                      href="/agency/leads"
                      className="text-slate-200 hover:text-white transition-colors text-sm font-medium"
                    >
                      Leads
                    </Link>
                  )}
                  {headerRole === 'admin' && (
                    <Link 
                      href="/admin/users"
                      className="text-slate-200 hover:text-white transition-colors text-sm font-medium"
                    >
                      Admin
                    </Link>
                  )}
                </nav>
              )}

              {/* Search */}
              <div className="flex-1 max-w-[400px]">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="relative">
                    <NeonCyanIcon type="search" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects…"
                      className="w-full pl-12 pr-20 py-3 bg-slate-800/50 border border-white/10 rounded-full text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/70 focus:border-transparent h-11"
                      aria-label="Search projects"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label="Clear search"
                      >
                        <NeonCyanIcon type="close" size={16} className="text-current" />
                      </button>
                    )}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-md text-xs text-slate-400">
                      <NeonCyanIcon type="command" size={12} className="text-current" />
                      <span>K</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Buttons + Avatar */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              {user && <NotificationsComponent user={user} />}
              
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={handleOpenAssistantModal}
                className="btn-neon-ghost flex items-center gap-2"
                aria-label="AI Assistant"
              >
                <NeonCyanIcon type="sparkles" size={16} className="text-current" />
                <span className="hidden lg:block">AI Assistant</span>
              </motion.button>

              {!(user || org) && (
                <>
                  <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                    <Link
                      href="/login"
                      className="btn-neon-ghost"
                    >
                      Log in
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                    <Link
                      href="/signup"
                      className="btn-neon-primary"
                    >
                      Sign up
                    </Link>
                  </motion.div>
                </>
              )}

              {(user || org) && (
                <div className="relative">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    ref={userButtonRef}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400/70 ${
                      isUserMenuOpen ? 'ring-2 ring-teal-400/60 bg-white/5' : ''
                    }`}
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <Avatar user={user} org={org} size={40} />
                    <div className="hidden lg:block text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-semibold text-sm">
                          {appUser?.name ?? org?.name ?? headerDisplayName}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                          headerRole === 'founder' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                          headerRole === 'vc' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          headerRole === 'exchange' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          headerRole === 'ido' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                          headerRole === 'influencer' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          headerRole === 'agency' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                          headerRole === 'admin' ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' :
                          'bg-slate-500/20 text-slate-300 border-slate-500/30'
                        }`}>
                          {headerRole?.toUpperCase() || 'USER'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">
                        {headerEmail}
                      </p>
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`} />
                  </motion.button>
                  
                  {isUserMenuOpen && (
                    <UserMenu user={user} org={org} isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        onSearch={onSearch}
      />

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay 
        isOpen={isMobileSearchOpen} 
        onClose={() => setIsMobileSearchOpen(false)}
        onSearch={onSearch}
      />

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        org={org}
        onSearch={onSearch}
        onOpenAssistant={handleOpenAssistantModal}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
      />
    </>
  );
}
