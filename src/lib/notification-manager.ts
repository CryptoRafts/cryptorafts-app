interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: Date;
  source: 'chat' | 'milestone' | 'project' | 'team' | 'system';
  metadata?: any;
}

interface NotificationListener {
  id: string;
  callback: (notifications: Notification[]) => void;
}

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: NotificationListener[] = [];
  private nextId = 1;
  private currentUserId: string | null = null; // NEW: Track current user
  private lastSoundPlayed: number = 0; // Track last sound time
  private soundCooldown: number = 2000; // 2 seconds between sounds

  constructor() {
    // Load existing notifications from storage will be called with userId
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    const listenerId = `listener-${Date.now()}-${Math.random()}`;
    this.listeners.push({ id: listenerId, callback });
    
    // Immediately call with current notifications
    try {
      callback(this.notifications);
    } catch (error) {
      console.error('Error calling notification callback:', error);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l.id !== listenerId);
    };
  }

  // Unsubscribe from notifications (legacy method for compatibility)
  unsubscribe(listenerId: string): void {
    this.listeners = this.listeners.filter(l => l.id !== listenerId);
  }

  // Add a new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${this.nextId++}`,
      timestamp: new Date()
    };

    this.notifications.unshift(newNotification); // Add to beginning
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Play notification sound if enabled
    this.playNotificationSound();

    this.notifyListeners();
    this.saveToStorage();
  }

  // Play notification sound with rate limiting
  private playNotificationSound(): void {
    try {
      // Check if sound is enabled
      if (typeof window === 'undefined') return;
      
      const soundEnabled = localStorage.getItem('notificationSoundEnabled');
      if (soundEnabled === 'false') {
        return; // Silently skip if disabled
      }

      // Rate limiting: Only play sound once every 2 seconds
      const now = Date.now();
      if (now - this.lastSoundPlayed < this.soundCooldown) {
        console.log('⏭️ [NOTIF-MGR] Sound skipped (rate limited)');
        return;
      }

      this.lastSoundPlayed = now;
      
      // Create a pleasant notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create two oscillators for a pleasant two-tone chime
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant notification frequencies (E5 and G#5 - major third interval)
      oscillator1.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
      oscillator2.frequency.setValueAtTime(830.61, audioContext.currentTime); // G#5
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      // Smooth volume envelope - gentle fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
      
      // Play the sound
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.6);
      oscillator2.stop(audioContext.currentTime + 0.6);
      
      // Reduced logging
    } catch (error) {
      // Silent fail for sound errors
    }
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    this.notifications = this.notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    
    this.notifyListeners();
    this.saveToStorage();
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    
    this.notifyListeners();
    this.saveToStorage();
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notifications;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
    this.saveToStorage();
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener.callback([...this.notifications]);
      } catch (error) {
        console.error('Error notifying listener:', error);
        // Remove problematic listener
        const index = this.listeners.findIndex(l => l.id === listener.id);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      }
    });
  }

  // NEW: Initialize for specific user (CRITICAL FOR PRIVACY)
  initializeForUser(userId: string): void {
    if (this.currentUserId === userId) {
      console.log('✅ [NOTIF-MGR] Already initialized for user:', userId);
      return; // Already initialized for this user
    }
    
    console.log('🔄 [NOTIF-MGR] Initializing notifications for user:', userId);
    
    // Clear old user's notifications
    if (this.currentUserId && this.currentUserId !== userId) {
      console.log('🧹 [NOTIF-MGR] Clearing previous user notifications:', this.currentUserId);
      this.notifications = [];
    }
    
    this.currentUserId = userId;
    this.loadFromStorage();
    this.notifyListeners();
    
    console.log('✅ [NOTIF-MGR] Initialized with', this.notifications.length, 'notifications');
  }

  // NEW: Clear all data (call on logout)
  clearUserData(): void {
    console.log('🧹 [NOTIF-MGR] Clearing all user data and logging out...');
    this.notifications = [];
    this.currentUserId = null;
    this.notifyListeners();
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      // Clear all notification-related data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('notifications_')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    console.log('✅ [NOTIF-MGR] User data cleared');
  }

  // Save to localStorage (USER-SPECIFIC) with reduced logging
  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && this.currentUserId) {
        const key = `notifications_${this.currentUserId}`;
        localStorage.setItem(key, JSON.stringify(this.notifications));
        // Reduced logging - only log on significant changes
      }
    } catch (error) {
      console.error('❌ [NOTIF-MGR] Error saving notifications:', error);
    }
  }

  // Load from localStorage (USER-SPECIFIC)
  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && this.currentUserId) {
        const key = `notifications_${this.currentUserId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.notifications = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          console.log(`📂 [NOTIF-MGR] Loaded ${this.notifications.length} notifications for user:`, this.currentUserId);
        } else {
          console.log('📂 [NOTIF-MGR] No stored notifications for user:', this.currentUserId);
          this.notifications = [];
        }
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
      this.notifications = [];
    }
  }

  // Subscribe to chat notifications from Firebase (PRIVACY-FIRST)
  async subscribeToChatNotifications(userId: string) {
    try {
      // Import Firestore functions dynamically to avoid chunk loading errors
      const { collection, query, where, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase.client');
      
      console.log('🔔 [NOTIF-MGR] Subscribing to chat notifications for user:', userId);
      console.log('🔒 [NOTIF-MGR] PRIVACY MODE: Only chats where user is explicit member');
      
      // Track processed messages to prevent duplicates
      const processedMessages = new Set<string>();
      
      // CRITICAL: Only query chats where this user is explicitly a member
      const chatsQuery = query(
        collection(db!, 'groupChats'),
        where('members', 'array-contains', userId) // ← PRIVACY FILTER
      );
      
      return onSnapshot(chatsQuery, (snapshot) => {
        console.log(`📊 [NOTIF-MGR] Checking ${snapshot.docs.length} chat rooms for user ${userId}`);
        
        snapshot.docs.forEach(doc => {
          const chatData = doc.data();
          const chatMembers = chatData.members || [];
          
          // DOUBLE-CHECK: Verify user is actually a member (redundant safety check)
          if (!chatMembers.includes(userId)) {
            console.warn('⚠️ [NOTIF-MGR] PRIVACY VIOLATION PREVENTED:', {
              chatId: doc.id,
              userId,
              reason: 'User not in members array'
            });
            return; // Skip this chat - user shouldn't see it
          }
          
          const unreadCount = chatData.unreadCount?.[userId] || 0;
          const lastMessage = chatData.lastMessage;
          
          // Only create notification if:
          // 1) User has unread messages
          // 2) Last message exists and is an object (not old string format)
          // 3) Last message is NOT from this user (don't notify about own messages)
          // 4) User is confirmed member
          if (unreadCount > 0 && lastMessage && typeof lastMessage === 'object' && lastMessage.senderId !== userId) {
            // Create unique message ID
            const messageKey = `${doc.id}-${lastMessage.createdAt}-${userId}`;
            
            // Check if we already processed this message (prevent infinite loop)
            if (processedMessages.has(messageKey)) {
              return; // Already processed this message
            }
            
            // Check if we already have a notification for this specific message
            const existingNotif = this.notifications.find(n => 
              n.metadata?.chatId === doc.id && 
              n.metadata?.messageTime === lastMessage.createdAt &&
              n.metadata?.userId === userId
            );
            
            if (!existingNotif) {
              // Mark as processed BEFORE adding notification (prevent loops)
              processedMessages.add(messageKey);
              
              // ENHANCED: Get user role to determine correct message route
              // Try to get role from localStorage first (faster), then try to get from Firestore
              let userRole = 'user';
              if (typeof window !== 'undefined') {
                userRole = localStorage.getItem('userRole') || 'user';
                
                // ENHANCED: If role not in localStorage, try to get from Firestore and store it
                if (userRole === 'user' || !userRole) {
                  try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase.client');
                    const userDocRef = doc(db!, 'users', userId);
                    const userSnapshot = await getDoc(userDocRef);
                    const userData = userSnapshot.data();
                    if (userData?.role) {
                      userRole = userData.role;
                      localStorage.setItem('userRole', userRole);
                      console.log('✅ [NOTIF-MGR] Stored user role in localStorage:', userRole);
                    }
                  } catch (error) {
                    console.warn('⚠️ [NOTIF-MGR] Could not load role from Firestore:', error);
                  }
                }
              }
              
              // Determine correct route based on role
              let messageRoute = '/messages';
              if (userRole === 'founder') {
                messageRoute = '/founder/messages';
              } else if (userRole === 'vc') {
                messageRoute = '/vc/messages';
              } else if (userRole === 'exchange') {
                messageRoute = '/exchange/messages';
              } else if (userRole === 'ido') {
                messageRoute = '/ido/messages';
              } else if (userRole === 'agency') {
                messageRoute = '/agency/messages';
              } else if (userRole === 'influencer') {
                messageRoute = '/influencer/messages';
              }
              
              this.addNotification({
                title: `💬 ${chatData.name || 'Chat'}`,
                message: `${lastMessage.senderName || 'Someone'}: ${lastMessage.text?.substring(0, 50) || 'New message'}`,
                type: 'info',
                isRead: false,
                source: 'chat',
                metadata: {
                  chatId: doc.id,
                  unreadCount,
                  messageTime: lastMessage.createdAt,
                  userId: userId,
                  url: `${messageRoute}?room=${doc.id}`
                }
              });
              console.log('🔔 [NOTIF-MGR] Added notification for user', userId, 'chat:', doc.id, unreadCount, 'unread');
            } else {
              console.log('⏭️ [NOTIF-MGR] Skipped duplicate notification for chat:', doc.id);
            }
          }
        });
      }, (error) => {
        console.error('❌ [NOTIF-MGR] Chat listener error:', error);
        // Return empty function to prevent further errors
        return () => {};
      });
    } catch (error) {
      console.error('❌ [NOTIF-MGR] Error subscribing to chat notifications:', error);
      return () => {}; // Return no-op unsubscribe
    }
  }

  // Subscribe to admin notifications
  async subscribeToAdminNotifications(userId: string) {
    try {
      console.log('🔔 [NOTIF-MGR] Setting up admin notifications for user:', userId);
      
      // Import Firestore functions dynamically
      const { collection, query, where, onSnapshot, orderBy, limit } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase.client');
      
      // Listen for admin notifications
      const adminNotificationsQuery = query(
        collection(db!, 'admin_notifications'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      return onSnapshot(adminNotificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationData = change.doc.data();
            
            // Only show unread notifications
            if (notificationData.status === 'unread') {
              this.addNotification({
                title: `🔔 ${notificationData.title || 'Admin Notification'}`,
                message: notificationData.message || 'You have a new admin notification',
                type: 'warning',
                isRead: false,
                source: 'system',
                metadata: {
                  notificationId: change.doc.id,
                  url: notificationData.actionUrl || '/admin/dashboard',
                  priority: notificationData.priority || 'medium'
                }
              });
              console.log('🔔 [NOTIF-MGR] Added admin notification:', notificationData.title);
            }
          }
        });
      }, (error) => {
        console.error('❌ [NOTIF-MGR] Admin notifications listener error:', error);
        return () => {};
      });
    } catch (error) {
      console.error('❌ [NOTIF-MGR] Error subscribing to admin notifications:', error);
      return () => {};
    }
  }
}

export const notificationManager = new NotificationManager();

// Initialize on client side
if (typeof window !== 'undefined') {
  // Do NOT auto-load - wait for user to be authenticated
  console.log('🔔 [NOTIF-MGR] Notification manager created (waiting for user authentication)');
  
  // Add console utilities for testing
  (window as any).notificationManager = {
    addTestNotification: () => {
      notificationManager.addNotification({
        title: 'Test Notification',
        message: 'This is a test notification from console',
        type: 'info',
        isRead: false,
        source: 'system'
      });
      console.log('✅ Test notification added (with sound!)');
    },
    testSound: () => {
      (notificationManager as any).playNotificationSound();
      console.log('🔔 Playing test notification sound...');
    },
    enableSound: () => {
      localStorage.setItem('notificationSoundEnabled', 'true');
      console.log('🔊 Notification sound enabled');
    },
    disableSound: () => {
      localStorage.setItem('notificationSoundEnabled', 'false');
      console.log('🔇 Notification sound disabled');
    },
    markAllRead: () => {
      notificationManager.markAllAsRead();
      console.log('✅ All notifications marked as read');
    },
    getUnreadCount: () => {
      const count = notificationManager.getUnreadCount();
      console.log('📊 Unread notifications:', count);
      return count;
    },
    clearAll: () => {
      notificationManager.clearAll();
      console.log('🗑️ All notifications cleared');
    },
    getNotifications: () => {
      const notifications = notificationManager.getNotifications();
      console.log('📋 All notifications:', notifications);
      return notifications;
    },
    getCurrentUser: () => {
      const userId = (notificationManager as any).currentUserId;
      console.log('👤 Current user ID:', userId || 'Not set');
      return userId;
    }
  };
  
  console.log('🔔 Notification manager loaded with user-specific storage!');
  console.log('Available commands:');
  console.log('- notificationManager.getCurrentUser() - Show current user ID');
  console.log('- notificationManager.addTestNotification() - Add test notification WITH sound');
  console.log('- notificationManager.testSound() - Play notification sound');
  console.log('- notificationManager.enableSound() - Enable notification sounds');
  console.log('- notificationManager.disableSound() - Disable notification sounds');
  console.log('- notificationManager.markAllRead() - Mark all as read');
  console.log('- notificationManager.getUnreadCount() - Get unread count');
  console.log('- notificationManager.clearAll() - Clear all notifications');
  console.log('- notificationManager.getNotifications() - Get all notifications');
}
