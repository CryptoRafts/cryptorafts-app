import { auth, db } from '@/lib/firebase.client';
import { collection, onSnapshot, doc, addDoc, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { notificationManager } from './notification-manager';

export interface RealtimeNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'deal' | 'milestone' | 'project' | 'system' | 'admin';
  isRead: boolean;
  timestamp: Date;
  source: string;
  metadata?: {
    chatRoomId?: string;
    projectId?: string;
    dealId?: string;
    senderId?: string;
    senderName?: string;
    url?: string;
  };
}

class RealtimeNotificationService {
  private user: User | null = null;
  private unsubscribeFunctions: (() => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Check if auth is available (client-side only)
    if (typeof window === 'undefined' || !auth) {
      console.warn('🔔 Firebase auth not available, skipping realtime notifications initialization');
      return;
    }

    onAuthStateChanged(auth, (user) => {
      this.user = user;
      if (user) {
        this.startListening();
      } else {
        this.stopListening();
      }
    });
  }

  private async startListening() {
    if (!this.user || this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🔔 Starting real-time notification listeners for user:', this.user.uid);

    // Get user role first to set up appropriate listeners
    // Try localStorage first for faster access, then Firestore
    let userRole = localStorage.getItem('userRole');
    
    if (!userRole) {
      const userDocRef = doc(db!, 'users', this.user.uid);
      try {
        const { getDoc } = await import('firebase/firestore');
        const userSnapshot = await getDoc(userDocRef);
        const userData = userSnapshot.data();
        userRole = userData?.role;
        
        // ENHANCED: Store role in localStorage for notifications to work correctly
        if (userRole && typeof window !== 'undefined') {
          localStorage.setItem('userRole', userRole);
          console.log('✅ [NOTIFICATIONS] Stored user role in localStorage:', userRole);
        }
      } catch (error) {
        console.warn('⚠️ Could not load role from Firestore:', error);
      }
    }

    console.log('🔔 User role:', userRole);

    try {
      // Listen for chat messages (all roles)
      this.listenForChatMessages();
      
      // Listen for project updates (all roles)
      this.listenForProjectUpdates();
      
      // Listen for deal updates (all roles)
      this.listenForDealUpdates();
      
      // Listen for system notifications (all roles)
      this.listenForSystemNotifications();
      
      // Only listen for admin notifications if user is admin
      if (userRole === 'admin') {
        this.listenForAdminNotifications();
        // Also set up admin-specific notification manager
        this.setupAdminNotificationManager();
      } else {
        console.log('🔔 User is not admin, skipping admin notifications');
      }

      // Set up role-specific listeners
      this.setupRoleSpecificListeners(userRole);
      
    } catch (error) {
      console.error('Error getting user role:', error);
      // Fallback to basic listeners
      this.listenForChatMessages();
      this.listenForSystemNotifications();
    }
  }

  private setupRoleSpecificListeners(userRole: string) {
    switch (userRole) {
      case 'founder':
        this.listenForFounderNotifications();
        break;
      case 'vc':
        this.listenForVCNotifications();
        break;
      case 'exchange':
        this.listenForExchangeNotifications();
        break;
      case 'ido':
        this.listenForIDONotifications();
        break;
      case 'influencer':
        this.listenForInfluencerNotifications();
        break;
      case 'agency':
        this.listenForAgencyNotifications();
        break;
      default:
        console.log('🔔 No specific listeners for role:', userRole);
    }
  }

  private stopListening() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    this.isInitialized = false;
    console.log('🔔 Stopped real-time notification listeners');
  }

  private listenForChatMessages() {
    // DISABLED: Chat notifications are handled by notificationManager in RoleAwareNavigation
    // to prevent duplicate notifications and sounds
    console.log('ℹ️ Chat notifications handled by notification-manager (preventing duplicates)');
    return;
  }

  // Direct chat message listener for founders (backup method)
  private listenForFounderChatMessages() {
    if (!this.user) return;
    
    try {
      // Listen to messages in groupChats where founder is a member
      const messagesRef = collection(db!, 'groupChats');
      const messagesQuery = query(
        messagesRef,
        where('members', 'array-contains', this.user.uid)
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const chatData = change.doc.data();
            const lastMessage = chatData.lastMessage;
            const unreadCount = chatData.unreadCount?.[this.user!.uid] || 0;
            
            // Only notify if there are unread messages and last message is from someone else
            if (unreadCount > 0 && lastMessage && lastMessage.senderId !== this.user!.uid) {
              // Check if notification already exists
              const existingNotif = notificationManager.getNotifications().find(n => 
                n.metadata?.chatId === change.doc.id && 
                n.metadata?.messageTime === lastMessage.createdAt
              );
              
              if (!existingNotif) {
                notificationManager.addNotification({
                  title: `💬 New Message in ${chatData.name || 'Chat'}`,
                  message: `${lastMessage.senderName || 'Someone'}: ${lastMessage.text?.substring(0, 50) || 'New message'}`,
                  type: 'info',
                  source: 'chat',
                  metadata: {
                    chatId: change.doc.id,
                    unreadCount,
                    messageTime: lastMessage.createdAt,
                    url: `/founder/messages?room=${change.doc.id}`
                  }
                });
                console.log('🔔 [FOUNDER] Direct chat notification added for:', change.doc.id);
              }
            }
          }
        });
      }, (error) => {
        console.log('ℹ️ Founder direct chat notifications not available:', error);
      });
      
      this.unsubscribeFunctions.push(unsubscribe);
      console.log('✅ Founder direct chat message listener enabled');
    } catch (error) {
      console.error('❌ Error setting up founder direct chat listener:', error);
    }
  }

  private listenForProjectUpdates() {
    if (!this.user) return;

    try {
      // Only listen to projects where user is the founder
      const projectsRef = collection(db!, 'projects');
      const projectsQuery = query(
        projectsRef,
        where('founderId', '==', this.user.uid)
      );
      
      const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const projectData = change.doc.data();
            const projectId = change.doc.id;

            // Check if this is a recent update (within last 5 minutes)
            // FIXED: Safely convert timestamp - handle both Firestore Timestamps and other formats
            const safeToDate = (timestamp: any): Date | null => {
              if (!timestamp) return null;
              if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
              }
              if (typeof timestamp === 'number') {
                return new Date(timestamp);
              }
              if (timestamp instanceof Date) {
                return timestamp;
              }
              return null;
            };
            const updateTime = safeToDate(projectData.updatedAt);
            if (!updateTime || (Date.now() - updateTime.getTime()) > 5 * 60 * 1000) return;

            // Don't notify for updates made by current user
            if (projectData.lastUpdatedBy === this.user?.uid) return;

            let title = 'Project Updated';
            let message = `${projectData.name || 'Project'} has been updated`;

            if (projectData.status === 'approved') {
              title = 'Project Approved';
              message = `${projectData.name || 'Your project'} has been approved!`;
            } else if (projectData.status === 'rejected') {
              title = 'Project Review';
              message = `${projectData.name || 'Your project'} needs attention`;
            }

            this.createNotification({
              title,
              message,
              type: 'project',
              source: projectData.name || 'project',
              metadata: {
                projectId,
                url: `/projects/${projectId}`
              }
            });
          }
        });
      }, (error) => {
        console.log('ℹ️ Project notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.log('ℹ️ Project notifications setup skipped:', error);
    }
  }

  private listenForDealUpdates() {
    if (!this.user) return;

    try {
      // Skip deal notifications for now to avoid permission errors
      // TODO: Add proper deal notifications with indexed queries
      console.log('ℹ️ Deal notifications temporarily disabled - no index available');
    } catch (error) {
      console.log('ℹ️ Deal notifications setup skipped:', error);
    }
  }

  private listenForSystemNotifications() {
    if (!this.user) return;

    // Skip system notifications to avoid permission errors
    // System notifications are optional and not critical
    console.log('ℹ️ System notifications disabled (optional feature)');
    
    // Alternative: Listen to user-specific notifications instead
    try {
      const userNotificationsRef = collection(db!, 'notifications');
      const userNotificationsQuery = query(
        userNotificationsRef,
        where('userId', '==', this.user.uid)
      );
      
      const unsubscribe = onSnapshot(userNotificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationData = change.doc.data();
            
            // Filter for recent notifications (within 24 hours)
            const notificationTime = notificationData.createdAt?.toDate?.() || new Date(notificationData.createdAt);
            if (notificationTime && (Date.now() - notificationTime.getTime()) < 24 * 60 * 60 * 1000) {
              this.createNotification({
                title: notificationData.title || 'Notification',
                message: notificationData.message || 'You have a new notification',
                type: notificationData.type || 'system',
                source: notificationData.source || 'system',
                metadata: notificationData.metadata || {}
              });
            }
          }
        });
      }, (error) => {
        console.log('ℹ️ User notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.log('ℹ️ Notifications setup skipped:', error);
    }
  }

  private listenForAdminNotifications() {
    if (!this.user) return;

    try {
      console.log('🔔 Setting up admin notifications for admin user:', this.user.uid);

      // Admin notifications are only for admin users
      const adminNotificationsRef = collection(db!, 'adminNotifications');
      
      const unsubscribe = onSnapshot(adminNotificationsRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationData = change.doc.data();
            
            // Filter for active notifications
            if (!notificationData.isActive) return;
            
            // Check if notification is recent (within 24 hours)
            // FIXED: Safely convert timestamp - handle both Firestore Timestamps and other formats
            const safeToDate = (timestamp: any): Date | null => {
              if (!timestamp) return null;
              if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
              }
              if (typeof timestamp === 'number') {
                return new Date(timestamp);
              }
              if (timestamp instanceof Date) {
                return timestamp;
              }
              return null;
            };
            const notificationTime = safeToDate(notificationData.createdAt);
            if (!notificationTime || (Date.now() - notificationTime.getTime()) > 24 * 60 * 60 * 1000) return;

            this.createNotification({
              title: notificationData.title || 'Admin Notification',
              message: notificationData.message || 'You have a new admin notification',
              type: 'admin',
              source: 'admin',
              metadata: {
                url: notificationData.url
              }
            });
          }
        });
      }, (error) => {
        console.log('ℹ️ Admin notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.log('ℹ️ Admin notifications setup skipped:', error);
    }
  }

  // Setup admin-specific notification manager
  private async setupAdminNotificationManager() {
    if (!this.user) return;

    try {
      console.log('🔔 Setting up admin notification manager for user:', this.user.uid);
      
      // Initialize notification manager for admin user
      notificationManager.initializeForUser(this.user.uid);
      
      // Subscribe to admin notifications
      const adminUnsubscribe = await notificationManager.subscribeToAdminNotifications(this.user.uid);
      if (adminUnsubscribe) {
        this.unsubscribeFunctions.push(adminUnsubscribe);
      }
      
      // Subscribe to chat notifications (admin can see all chats)
      const chatUnsubscribe = await notificationManager.subscribeToChatNotifications(this.user.uid);
      if (chatUnsubscribe) {
        this.unsubscribeFunctions.push(chatUnsubscribe);
      }
      
      console.log('✅ Admin notification manager setup complete');
    } catch (error) {
      console.error('❌ Error setting up admin notification manager:', error);
    }
  }

  private listenForFounderNotifications() {
    if (!this.user) return;
    console.log('🔔 Setting up founder-specific notifications');
    
    try {
      // Initialize notification manager for founder FIRST
      notificationManager.initializeForUser(this.user.uid);
      
      // Subscribe to chat notifications for founders
      (async () => {
        try {
          // Wait a bit for initialization to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('🔔 [FOUNDER] Setting up chat notifications for user:', this.user!.uid);
          const chatUnsubscribe = await notificationManager.subscribeToChatNotifications(this.user!.uid);
          if (chatUnsubscribe && typeof chatUnsubscribe === 'function') {
            this.unsubscribeFunctions.push(chatUnsubscribe);
            console.log('✅ [FOUNDER] Chat notifications enabled');
          } else {
            console.warn('⚠️ [FOUNDER] Chat notifications returned no unsubscribe function');
            // Try backup method
            setTimeout(() => {
              this.listenForFounderChatMessages();
            }, 500);
          }
        } catch (error) {
          console.error('❌ [FOUNDER] Error setting up chat notifications:', error);
          // Fallback to backup method
          setTimeout(() => {
            this.listenForFounderChatMessages();
          }, 500);
        }
      })();
      
      // Also listen directly to chat messages for founders (backup method)
      // Add a delay to ensure notificationManager is fully initialized
      setTimeout(() => {
        this.listenForFounderChatMessages();
      }, 2000);
      
      // ENHANCED: Listen for incoming calls for Founder
      this.setupCallNotifications();
      
      // Listen for KYC status updates
      const kycSubmissionsRef = collection(db!, 'kycSubmissions');
      const kycQuery = query(
        kycSubmissionsRef,
        where('userId', '==', this.user.uid)
      );
      
      const unsubscribeKYC = onSnapshot(kycQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const kycData = change.doc.data();
            if (kycData.status === 'approved' || kycData.status === 'verified') {
              notificationManager.addNotification({
                title: 'KYC Approved ✅',
                message: 'Your KYC verification has been approved! You can now access all features.',
                type: 'success',
                source: 'kyc',
                metadata: { url: '/founder/dashboard' }
              });
            } else if (kycData.status === 'rejected') {
              notificationManager.addNotification({
                title: 'KYC Review Required',
                message: 'Your KYC verification needs attention. Please review and resubmit.',
                type: 'warning',
                source: 'kyc',
                metadata: { url: '/founder/kyc' }
              });
            }
          }
        });
      }, (error) => {
        console.log('ℹ️ KYC notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribeKYC);
      
      // Listen for project acceptance notifications (when VC/Exchange/IDO accepts pitch)
      // FIXED: Listen to ALL notifications for this user, not just unread ones
      // This ensures we catch notifications even if they were marked as read elsewhere
      const notificationsRef = collection(db!, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', this.user.uid)
        // Removed 'read == false' filter to catch all notifications
        // We'll filter duplicates ourselves
      );
      
      // Track processed notification IDs to prevent duplicates
      const processedNotificationIds = new Set<string>();
      
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationId = change.doc.id;
            const notificationData = change.doc.data();
            
            // Skip if already processed
            if (processedNotificationIds.has(notificationId)) {
              return;
            }
            
            // Handle both Timestamp and Date formats
            let notificationTime: Date | null = null;
            if (notificationData.createdAt) {
              if (notificationData.createdAt.toDate) {
                // Firestore Timestamp
                notificationTime = notificationData.createdAt.toDate();
              } else if (notificationData.createdAt instanceof Date) {
                // Already a Date
                notificationTime = notificationData.createdAt;
              } else if (typeof notificationData.createdAt === 'number') {
                // Unix timestamp
                notificationTime = new Date(notificationData.createdAt);
              } else if (typeof notificationData.createdAt === 'string') {
                // ISO string
                notificationTime = new Date(notificationData.createdAt);
              }
            } else {
              // Fallback to current time if no timestamp
              notificationTime = new Date();
            }
            
            // Only show notifications from the last 7 days to avoid spam
            const isRecent = notificationTime && (Date.now() - notificationTime.getTime()) < 7 * 24 * 60 * 60 * 1000;
            
            if (isRecent) {
              // Check if notification already exists to prevent duplicates
              const existingNotif = notificationManager.getNotifications().find(n => 
                n.metadata?.notificationId === notificationId ||
                (n.title === notificationData.title && 
                 n.message === notificationData.message &&
                 Math.abs(n.timestamp.getTime() - (notificationTime?.getTime() || 0)) < 5000) // 5 second window
              );
              
              if (!existingNotif) {
                // Mark as processed
                processedNotificationIds.add(notificationId);
                
                // Determine notification type
                let notifType: 'info' | 'success' | 'warning' | 'error' = 'info';
                if (notificationData.type === 'project_accepted' || notificationData.type === 'campaign_accepted') {
                  notifType = 'success';
                } else if (notificationData.type === 'error' || notificationData.type === 'rejected') {
                  notifType = 'error';
                } else if (notificationData.type === 'warning' || notificationData.type === 'pending') {
                  notifType = 'warning';
                }
                
                notificationManager.addNotification({
                  title: notificationData.title || 'New Notification',
                  message: notificationData.message || 'You have a new notification',
                  type: notifType,
                  source: notificationData.source || 'system',
                  metadata: {
                    ...(notificationData.data || notificationData.metadata || {}),
                    notificationId: notificationId,
                    url: notificationData.link || notificationData.data?.roomUrl || notificationData.metadata?.url || `/founder/messages`
                  }
                });
                console.log('🔔 [FOUNDER] Added notification:', notificationData.title, 'Type:', notificationData.type);
              } else {
                console.log('⏭️ [FOUNDER] Skipped duplicate notification:', notificationData.title);
              }
            }
          }
        });
      }, (error) => {
        console.error('❌ [FOUNDER] Error listening to notifications:', error);
        // Try to continue with other listeners even if this one fails
      });
      
      this.unsubscribeFunctions.push(unsubscribeNotifications);
      console.log('✅ [FOUNDER] Notification listener set up for user:', this.user.uid);
      
      // Listen for spotlight application status updates
      const spotlightApplicationsRef = collection(db!, 'spotlightApplications');
      const spotlightQuery = query(
        spotlightApplicationsRef,
        where('userId', '==', this.user.uid)
      );
      
      const unsubscribeSpotlight = onSnapshot(spotlightQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const spotlightData = change.doc.data();
            
            if (spotlightData.applicationStatus === 'approved' && spotlightData.paymentStatus === 'completed') {
              notificationManager.addNotification({
                title: 'Spotlight Approved! 🌟',
                message: `Your project "${spotlightData.projectName}" is now live in the spotlight!`,
                type: 'success',
                source: 'spotlight',
                metadata: { url: '/spotlight/success' }
              });
            } else if (spotlightData.applicationStatus === 'rejected') {
              notificationManager.addNotification({
                title: 'Spotlight Application',
                message: `Your spotlight application for "${spotlightData.projectName}" needs attention.`,
                type: 'warning',
                source: 'spotlight',
                metadata: { url: '/spotlight/apply' }
              });
            }
          }
        });
      }, (error) => {
        console.log('ℹ️ Spotlight notifications not available:', error);
      });
      
      this.unsubscribeFunctions.push(unsubscribeSpotlight);
      
      console.log('✅ Founder notifications fully configured');
    } catch (error) {
      console.error('❌ Error setting up founder notifications:', error);
    }
  }

  private listenForVCNotifications() {
    if (!this.user) return;
    console.log('🔔 Setting up VC-specific notifications');
    
    try {
      // Initialize notification manager for VC
      notificationManager.initializeForUser(this.user.uid);
      
      // Subscribe to chat notifications for VC
      (async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔔 [VC] Setting up chat notifications for user:', this.user!.uid);
          const chatUnsubscribe = await notificationManager.subscribeToChatNotifications(this.user!.uid);
          if (chatUnsubscribe && typeof chatUnsubscribe === 'function') {
            this.unsubscribeFunctions.push(chatUnsubscribe);
            console.log('✅ [VC] Chat notifications enabled');
          } else {
            console.warn('⚠️ [VC] Chat notifications returned no unsubscribe function');
          }
        } catch (error) {
          console.error('❌ [VC] Error setting up chat notifications:', error);
        }
      })();
      
      // Listen for notifications sent TO this VC user
      const notificationsRef = collection(db!, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', this.user.uid)
      );
      
      const processedNotificationIds = new Set<string>();
      
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationId = change.doc.id;
            if (processedNotificationIds.has(notificationId)) return;
            
            const notificationData = change.doc.data();
            const notificationTime = notificationData.createdAt?.toDate?.() || new Date(notificationData.createdAt || Date.now());
            const isRecent = notificationTime && (Date.now() - notificationTime.getTime()) < 7 * 24 * 60 * 60 * 1000;
            
            if (isRecent) {
              const existingNotif = notificationManager.getNotifications().find(n => 
                n.metadata?.notificationId === notificationId
              );
              
              if (!existingNotif) {
                processedNotificationIds.add(notificationId);
                let notifType: 'info' | 'success' | 'warning' | 'error' = 'info';
                if (notificationData.type === 'project_accepted') notifType = 'success';
                else if (notificationData.type === 'error') notifType = 'error';
                else if (notificationData.type === 'warning') notifType = 'warning';
                
                notificationManager.addNotification({
                  title: notificationData.title || 'New Notification',
                  message: notificationData.message || 'You have a new notification',
                  type: notifType,
                  source: notificationData.source || 'system',
                  metadata: {
                    ...(notificationData.data || notificationData.metadata || {}),
                    notificationId: notificationId,
                    url: notificationData.link || notificationData.data?.roomUrl || notificationData.metadata?.url
                  }
                });
                console.log('🔔 [VC] Added notification:', notificationData.title);
              }
            }
          }
        });
      }, (error) => {
        console.error('❌ [VC] Error listening to notifications:', error);
      });
      
      this.unsubscribeFunctions.push(unsubscribeNotifications);
      
      // ENHANCED: Listen for incoming calls for VC
      this.setupCallNotifications();
      
      // Listen for new pitch submissions (last 24 hours)
      const projectsRef = collection(db!, 'projects');
      const pitchesQuery = query(
        projectsRef,
        where('status', 'in', ['pending', 'submitted', 'review']),
        where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      );
      
      const unsubscribePitches = onSnapshot(pitchesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const projectData = change.doc.data();
            this.createNotification({
              title: 'New Pitch Available',
              message: `New project: ${projectData.name || 'Untitled Project'}`,
              type: 'project',
              source: 'pitch',
              metadata: {
                projectId: change.doc.id,
                url: `/vc/dealflow`
              }
            });
          }
        });
      }, (error) => {
        console.log('ℹ️ Pitch notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribePitches);
      console.log('✅ VC notifications fully configured');
    } catch (error) {
      console.error('❌ Error setting up VC notifications:', error);
    }
  }

  private listenForExchangeNotifications() {
    if (!this.user) return;
    console.log('🔔 Setting up Exchange-specific notifications');
    
    try {
      // Initialize notification manager for Exchange
      notificationManager.initializeForUser(this.user.uid);
      
      // Subscribe to chat notifications for Exchange
      (async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔔 [EXCHANGE] Setting up chat notifications for user:', this.user!.uid);
          const chatUnsubscribe = await notificationManager.subscribeToChatNotifications(this.user!.uid);
          if (chatUnsubscribe && typeof chatUnsubscribe === 'function') {
            this.unsubscribeFunctions.push(chatUnsubscribe);
            console.log('✅ [EXCHANGE] Chat notifications enabled');
          } else {
            console.warn('⚠️ [EXCHANGE] Chat notifications returned no unsubscribe function');
          }
        } catch (error) {
          console.error('❌ [EXCHANGE] Error setting up chat notifications:', error);
        }
      })();
      
      // Listen for notifications sent TO this Exchange user
      const notificationsRef = collection(db!, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', this.user.uid)
      );
      
      const processedNotificationIds = new Set<string>();
      
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationId = change.doc.id;
            if (processedNotificationIds.has(notificationId)) return;
            
            const notificationData = change.doc.data();
            const notificationTime = notificationData.createdAt?.toDate?.() || new Date(notificationData.createdAt || Date.now());
            const isRecent = notificationTime && (Date.now() - notificationTime.getTime()) < 7 * 24 * 60 * 60 * 1000;
            
            if (isRecent) {
              const existingNotif = notificationManager.getNotifications().find(n => 
                n.metadata?.notificationId === notificationId
              );
              
              if (!existingNotif) {
                processedNotificationIds.add(notificationId);
                let notifType: 'info' | 'success' | 'warning' | 'error' = 'info';
                if (notificationData.type === 'project_accepted') notifType = 'success';
                else if (notificationData.type === 'error') notifType = 'error';
                else if (notificationData.type === 'warning') notifType = 'warning';
                
                notificationManager.addNotification({
                  title: notificationData.title || 'New Notification',
                  message: notificationData.message || 'You have a new notification',
                  type: notifType,
                  source: notificationData.source || 'system',
                  metadata: {
                    ...(notificationData.data || notificationData.metadata || {}),
                    notificationId: notificationId,
                    url: notificationData.link || notificationData.data?.roomUrl || notificationData.metadata?.url
                  }
                });
                console.log('🔔 [EXCHANGE] Added notification:', notificationData.title);
              }
            }
          }
        });
      }, (error) => {
        console.error('❌ [EXCHANGE] Error listening to notifications:', error);
      });
      
      this.unsubscribeFunctions.push(unsubscribeNotifications);
      
      // ENHANCED: Listen for incoming calls for Exchange
      this.setupCallNotifications();
      
      // Listen for new listing requests
      const listingsRef = collection(db!, 'listingRequests');
      const listingsQuery = query(
        listingsRef,
        where('status', '==', 'pending'),
        where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      );
      
      const unsubscribeListings = onSnapshot(listingsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const listingData = change.doc.data();
            this.createNotification({
              title: 'New Listing Request',
              message: `New token listing request: ${listingData.tokenName || 'Untitled'}`,
              type: 'deal',
              source: 'listing',
              metadata: {
                listingId: change.doc.id,
                url: `/exchange/listings`
              }
            });
          }
        });
      }, (error) => {
        console.log('ℹ️ Listing notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribeListings);
      
      // ENHANCED: Listen for incoming calls for Exchange
      this.setupCallNotifications();
      
      console.log('✅ Exchange notifications fully configured');
    } catch (error) {
      console.error('❌ Error setting up Exchange notifications:', error);
    }
  }

  private listenForIDONotifications() {
    if (!this.user) return;
    console.log('🔔 Setting up IDO-specific notifications');
    
    try {
      // Initialize notification manager for IDO
      notificationManager.initializeForUser(this.user.uid);
      
      // Subscribe to chat notifications for IDO
      (async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔔 [IDO] Setting up chat notifications for user:', this.user!.uid);
          const chatUnsubscribe = await notificationManager.subscribeToChatNotifications(this.user!.uid);
          if (chatUnsubscribe && typeof chatUnsubscribe === 'function') {
            this.unsubscribeFunctions.push(chatUnsubscribe);
            console.log('✅ [IDO] Chat notifications enabled');
          } else {
            console.warn('⚠️ [IDO] Chat notifications returned no unsubscribe function');
          }
        } catch (error) {
          console.error('❌ [IDO] Error setting up chat notifications:', error);
        }
      })();
      
      // Listen for notifications sent TO this IDO user
      const notificationsRef = collection(db!, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', this.user.uid)
      );
      
      const processedNotificationIds = new Set<string>();
      
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationId = change.doc.id;
            if (processedNotificationIds.has(notificationId)) return;
            
            const notificationData = change.doc.data();
            const notificationTime = notificationData.createdAt?.toDate?.() || new Date(notificationData.createdAt || Date.now());
            const isRecent = notificationTime && (Date.now() - notificationTime.getTime()) < 7 * 24 * 60 * 60 * 1000;
            
            if (isRecent) {
              const existingNotif = notificationManager.getNotifications().find(n => 
                n.metadata?.notificationId === notificationId
              );
              
              if (!existingNotif) {
                processedNotificationIds.add(notificationId);
                let notifType: 'info' | 'success' | 'warning' | 'error' = 'info';
                if (notificationData.type === 'project_accepted') notifType = 'success';
                else if (notificationData.type === 'error') notifType = 'error';
                else if (notificationData.type === 'warning') notifType = 'warning';
                
                notificationManager.addNotification({
                  title: notificationData.title || 'New Notification',
                  message: notificationData.message || 'You have a new notification',
                  type: notifType,
                  source: notificationData.source || 'system',
                  metadata: {
                    ...(notificationData.data || notificationData.metadata || {}),
                    notificationId: notificationId,
                    url: notificationData.link || notificationData.data?.roomUrl || notificationData.metadata?.url
                  }
                });
                console.log('🔔 [IDO] Added notification:', notificationData.title);
              }
            }
          }
        });
      }, (error) => {
        console.error('❌ [IDO] Error listening to notifications:', error);
      });
      
      this.unsubscribeFunctions.push(unsubscribeNotifications);
      
      // ENHANCED: Listen for incoming calls for IDO (already added above)
      
      // Listen for new IDO launch requests
      const idoRequestsRef = collection(db!, 'idoRequests');
      const idoQuery = query(
        idoRequestsRef,
        where('status', '==', 'pending'),
        where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      );
      
      const unsubscribeIDO = onSnapshot(idoQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const idoData = change.doc.data();
            this.createNotification({
              title: 'New IDO Request',
              message: `New IDO launch request: ${idoData.projectName || 'Untitled'}`,
              type: 'project',
              source: 'ido',
              metadata: {
                idoId: change.doc.id,
                url: `/ido/dashboard`
              }
            });
          }
        });
      }, (error) => {
        console.log('ℹ️ IDO notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribeIDO);
      
      // ENHANCED: Listen for incoming calls for IDO
      this.setupCallNotifications();
      
      console.log('✅ IDO notifications fully configured');
    } catch (error) {
      console.error('❌ Error setting up IDO notifications:', error);
    }
  }

  private listenForInfluencerNotifications() {
    if (!this.user) return;
    console.log('🔔 Setting up Influencer-specific notifications');
    
    try {
      // Initialize notification manager for Influencer
      notificationManager.initializeForUser(this.user.uid);
      
      // Subscribe to chat notifications for Influencer
      (async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔔 [INFLUENCER] Setting up chat notifications for user:', this.user!.uid);
          const chatUnsubscribe = await notificationManager.subscribeToChatNotifications(this.user!.uid);
          if (chatUnsubscribe && typeof chatUnsubscribe === 'function') {
            this.unsubscribeFunctions.push(chatUnsubscribe);
            console.log('✅ [INFLUENCER] Chat notifications enabled');
          } else {
            console.warn('⚠️ [INFLUENCER] Chat notifications returned no unsubscribe function');
          }
        } catch (error) {
          console.error('❌ [INFLUENCER] Error setting up chat notifications:', error);
        }
      })();
      
      // Listen for notifications sent TO this Influencer user
      const notificationsRef = collection(db!, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', this.user.uid)
      );
      
      const processedNotificationIds = new Set<string>();
      
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationId = change.doc.id;
            if (processedNotificationIds.has(notificationId)) return;
            
            const notificationData = change.doc.data();
            const notificationTime = notificationData.createdAt?.toDate?.() || new Date(notificationData.createdAt || Date.now());
            const isRecent = notificationTime && (Date.now() - notificationTime.getTime()) < 7 * 24 * 60 * 60 * 1000;
            
            if (isRecent) {
              const existingNotif = notificationManager.getNotifications().find(n => 
                n.metadata?.notificationId === notificationId
              );
              
              if (!existingNotif) {
                processedNotificationIds.add(notificationId);
                let notifType: 'info' | 'success' | 'warning' | 'error' = 'info';
                if (notificationData.type === 'project_accepted' || notificationData.type === 'campaign_accepted') notifType = 'success';
                else if (notificationData.type === 'error') notifType = 'error';
                else if (notificationData.type === 'warning') notifType = 'warning';
                
                notificationManager.addNotification({
                  title: notificationData.title || 'New Notification',
                  message: notificationData.message || 'You have a new notification',
                  type: notifType,
                  source: notificationData.source || 'system',
                  metadata: {
                    ...(notificationData.data || notificationData.metadata || {}),
                    notificationId: notificationId,
                    url: notificationData.link || notificationData.data?.roomUrl || notificationData.metadata?.url
                  }
                });
                console.log('🔔 [INFLUENCER] Added notification:', notificationData.title);
              }
            }
          }
        });
      }, (error) => {
        console.error('❌ [INFLUENCER] Error listening to notifications:', error);
      });
      
      this.unsubscribeFunctions.push(unsubscribeNotifications);
      
      // ENHANCED: Listen for incoming calls for Influencer (already added above)
      
      // Listen for new campaign invitations
      const campaignsRef = collection(db!, 'campaigns');
      const campaignsQuery = query(
        campaignsRef,
        where('status', '==', 'active'),
        where('invitedInfluencers', 'array-contains', this.user.uid),
        where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      );
      
      const unsubscribeCampaigns = onSnapshot(campaignsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const campaignData = change.doc.data();
            this.createNotification({
              title: 'New Campaign Invitation',
              message: `You've been invited to campaign: ${campaignData.name || 'Untitled'}`,
              type: 'project',
              source: 'campaign',
              metadata: {
                campaignId: change.doc.id,
                url: `/influencer/campaigns`
              }
            });
          }
        });
      }, (error) => {
        console.log('ℹ️ Campaign notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribeCampaigns);
      
      // ENHANCED: Listen for incoming calls for Influencer
      this.setupCallNotifications();
      
      console.log('✅ Influencer notifications fully configured');
    } catch (error) {
      console.error('❌ Error setting up Influencer notifications:', error);
    }
  }

  private listenForAgencyNotifications() {
    if (!this.user) return;
    console.log('🔔 Setting up Agency-specific notifications');
    
    try {
      // Initialize notification manager for Agency
      notificationManager.initializeForUser(this.user.uid);
      
      // Subscribe to chat notifications for Agency
      (async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔔 [AGENCY] Setting up chat notifications for user:', this.user!.uid);
          const chatUnsubscribe = await notificationManager.subscribeToChatNotifications(this.user!.uid);
          if (chatUnsubscribe && typeof chatUnsubscribe === 'function') {
            this.unsubscribeFunctions.push(chatUnsubscribe);
            console.log('✅ [AGENCY] Chat notifications enabled');
          } else {
            console.warn('⚠️ [AGENCY] Chat notifications returned no unsubscribe function');
          }
        } catch (error) {
          console.error('❌ [AGENCY] Error setting up chat notifications:', error);
        }
      })();
      
      // Listen for notifications sent TO this Agency user
      const notificationsRef = collection(db!, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', this.user.uid)
      );
      
      const processedNotificationIds = new Set<string>();
      
      const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationId = change.doc.id;
            if (processedNotificationIds.has(notificationId)) return;
            
            const notificationData = change.doc.data();
            const notificationTime = notificationData.createdAt?.toDate?.() || new Date(notificationData.createdAt || Date.now());
            const isRecent = notificationTime && (Date.now() - notificationTime.getTime()) < 7 * 24 * 60 * 60 * 1000;
            
            if (isRecent) {
              const existingNotif = notificationManager.getNotifications().find(n => 
                n.metadata?.notificationId === notificationId
              );
              
              if (!existingNotif) {
                processedNotificationIds.add(notificationId);
                let notifType: 'info' | 'success' | 'warning' | 'error' = 'info';
                if (notificationData.type === 'project_accepted') notifType = 'success';
                else if (notificationData.type === 'error') notifType = 'error';
                else if (notificationData.type === 'warning') notifType = 'warning';
                
                notificationManager.addNotification({
                  title: notificationData.title || 'New Notification',
                  message: notificationData.message || 'You have a new notification',
                  type: notifType,
                  source: notificationData.source || 'system',
                  metadata: {
                    ...(notificationData.data || notificationData.metadata || {}),
                    notificationId: notificationId,
                    url: notificationData.link || notificationData.data?.roomUrl || notificationData.metadata?.url
                  }
                });
                console.log('🔔 [AGENCY] Added notification:', notificationData.title);
              }
            }
          }
        });
      }, (error) => {
        console.error('❌ [AGENCY] Error listening to notifications:', error);
      });
      
      this.unsubscribeFunctions.push(unsubscribeNotifications);
      
      // ENHANCED: Listen for incoming calls for Agency (already added above)
      
      // Listen for new project assignments
      const projectsRef = collection(db!, 'projects');
      const projectsQuery = query(
        projectsRef,
        where('assignedAgency', '==', this.user.uid),
        where('status', 'in', ['active', 'in_progress']),
        where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      );
      
      const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const projectData = change.doc.data();
            if (change.type === 'added') {
              this.createNotification({
                title: 'New Project Assignment',
                message: `You've been assigned to project: ${projectData.name || 'Untitled'}`,
                type: 'project',
                source: 'assignment',
                metadata: {
                  projectId: change.doc.id,
                  url: `/agency/projects`
                }
              });
            }
          }
        });
      }, (error) => {
        console.log('ℹ️ Agency project notifications not available:', error);
      });

      this.unsubscribeFunctions.push(unsubscribeProjects);
      
      // ENHANCED: Listen for incoming calls for Agency
      this.setupCallNotifications();
      
      console.log('✅ Agency notifications fully configured');
    } catch (error) {
      console.error('❌ Error setting up Agency notifications:', error);
    }
  }
  
  // ENHANCED: Setup call notifications for all roles
  private setupCallNotifications() {
    if (!this.user) return;
    
    try {
      // Listen for call notifications in Firebase
      const notificationsRef = collection(db!, 'notifications');
      const callNotificationsQuery = query(
        notificationsRef,
        where('userId', '==', this.user.uid),
        where('type', '==', 'call')
      );
      
      const unsubscribeCalls = onSnapshot(callNotificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationData = change.doc.data();
            const notificationTime = notificationData.createdAt?.toDate?.() || new Date(notificationData.createdAt || Date.now());
            const isRecent = notificationTime && (Date.now() - notificationTime.getTime()) < 60 * 1000; // Only last minute
            
            if (isRecent) {
              const existingNotif = notificationManager.getNotifications().find(n => 
                n.metadata?.callId === notificationData.data?.callId
              );
              
              if (!existingNotif) {
                // ENHANCED: Get user role to determine correct message route
                let userRole = 'user';
                if (typeof window !== 'undefined') {
                  userRole = localStorage.getItem('userRole') || 'user';
                }
                
                // Determine correct route based on role (use from notification data if available, otherwise calculate)
                let messageRoute = notificationData.data?.url || '/messages';
                if (!notificationData.data?.url) {
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
                  
                  // Add room ID if available
                  if (notificationData.data?.roomId) {
                    messageRoute = `${messageRoute}?room=${notificationData.data.roomId}`;
                  }
                }
                
                notificationManager.addNotification({
                  title: notificationData.title || '📞 Incoming Call',
                  message: notificationData.message || 'You have an incoming call',
                  type: 'info',
                  source: 'call',
                  metadata: {
                    ...(notificationData.data || {}),
                    notificationId: change.doc.id,
                    url: messageRoute
                  }
                });
                console.log('🔔 [CALL] Added call notification:', notificationData.title);
              }
            }
          }
        });
      }, (error) => {
        console.error('❌ Error listening to call notifications:', error);
      });
      
      this.unsubscribeFunctions.push(unsubscribeCalls);
      console.log('✅ Call notifications enabled');
    } catch (error) {
      console.error('❌ Error setting up call notifications:', error);
    }
  }

  private createNotification(notificationData: {
    title: string;
    message: string;
    type: RealtimeNotification['type'];
    source: string;
    metadata?: RealtimeNotification['metadata'];
  }) {
    if (!this.user) return;

    // Don't play sound here - notificationManager.addNotification() already plays sound
    // This prevents duplicate sounds

    // Add to local notification manager (this will play sound once)
    notificationManager.addNotification({
      title: notificationData.title,
      message: notificationData.message,
      type: this.getNotificationType(notificationData.type),
      isRead: false,
      source: notificationData.source,
      metadata: notificationData.metadata
    });

    // Don't save to Firestore - causes unnecessary writes and potential loops
    // localStorage is sufficient for notifications
  }

  private playNotificationSound(type: RealtimeNotification['type']) {
    // Check if sound is enabled
    const isSoundEnabled = typeof window !== 'undefined' 
      ? localStorage.getItem('notificationSoundEnabled') !== 'false'
      : true;
    
    if (!isSoundEnabled) {
      console.log('🔇 Notification sound muted');
      return;
    }

    try {
      // Create audio context for notification sounds
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Improved sound configurations for better quality
      const soundConfigs = {
        message: { 
          frequencies: [800, 1000], 
          duration: 0.4, 
          type: 'sine' as OscillatorType,
          volume: 0.15
        },
        deal: { 
          frequencies: [600, 800], 
          duration: 0.5, 
          type: 'triangle' as OscillatorType,
          volume: 0.12
        },
        project: { 
          frequencies: [400, 600], 
          duration: 0.6, 
          type: 'sine' as OscillatorType,
          volume: 0.1
        },
        system: { 
          frequencies: [1000, 1200], 
          duration: 0.3, 
          type: 'sine' as OscillatorType,
          volume: 0.18
        },
        admin: { 
          frequencies: [800, 1000, 1200], 
          duration: 0.35, 
          type: 'sine' as OscillatorType,
          volume: 0.2
        },
        milestone: { 
          frequencies: [500, 700], 
          duration: 0.7, 
          type: 'triangle' as OscillatorType,
          volume: 0.14
        }
      };

      const config = soundConfigs[type] || soundConfigs.message;
      const currentTime = audioContext.currentTime;
      
      // Create a more pleasant chord-like sound
      config.frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Stagger the start times slightly for a chord effect
        const startTime = currentTime + (index * 0.02);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = config.type;
        
        // Smoother volume envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + config.duration);
      });

      console.log(`🔔 Played improved notification sound for ${type}`);
    } catch (error) {
      console.log('🔔 Could not play notification sound:', error);
      // Fallback to browser notification if audio fails
      this.showBrowserNotification(type);
    }
  }

  private showBrowserNotification(type: RealtimeNotification['type']) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const titles = {
        message: 'New Message',
        deal: 'Deal Update',
        project: 'Project Update',
        system: 'System Notification',
        admin: 'Admin Notification',
        milestone: 'Milestone Update'
      };

      new Notification(titles[type] || 'Notification', {
        icon: '/cryptorafts.logo.png',
        badge: '/cryptorafts.logo.png',
        tag: type
      });
    }
  }

  private getNotificationType(type: RealtimeNotification['type']): 'info' | 'success' | 'warning' | 'error' {
    switch (type) {
      case 'message':
        return 'info';
      case 'deal':
        return 'success';
      case 'project':
        return 'info';
      case 'system':
        return 'warning';
      case 'admin':
        return 'error';
      case 'milestone':
        return 'success';
      default:
        return 'info';
    }
  }

  private async saveNotificationToFirestore(notificationData: {
    title: string;
    message: string;
    type: RealtimeNotification['type'];
    source: string;
    metadata?: RealtimeNotification['metadata'];
  }) {
    if (!this.user) return;

    try {
      // Save to notifications collection (user-specific)
      await addDoc(collection(db!, 'notifications'), {
        userId: this.user.uid,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        source: notificationData.source,
        isRead: false,
        metadata: notificationData.metadata || {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      // Silently fail - local notifications still work
      console.log('ℹ️ Notification not saved to Firestore (using local storage instead)');
    }
  }

  // Request notification permissions (silently degrade if blocked)
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      // Never ask if permission was denied - user has blocked it
      if (Notification.permission === 'denied') {
        console.log('🔔 Browser notifications blocked - using in-app notifications');
        return false;
      }
      
      // Don't ask if already default - let user enable from settings if they want
      if (Notification.permission === 'default') {
        console.log('🔔 Using in-app notifications (enable browser notifications from settings if desired)');
        return false;
      }
      
      // Already granted - good to use
      if (Notification.permission === 'granted') {
        console.log('🔔 Browser notifications enabled');
        return true;
      }
    }
    return false;
  }

  // Send a test notification
  sendTestNotification() {
    this.createNotification({
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      type: 'system',
      source: 'test'
    });
  }

  // Cleanup
  destroy() {
    this.stopListening();
  }
}

// Create singleton instance
export const realtimeNotificationService = new RealtimeNotificationService();

// Request notification permissions on load
if (typeof window !== 'undefined') {
  realtimeNotificationService.requestNotificationPermission();
}

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).realtimeNotificationService = realtimeNotificationService;
}
