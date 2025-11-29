import { db } from '@/lib/firebase.client';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';

export interface RealTimeNotification {
  id: string;
  type: 'chat' | 'project' | 'deal' | 'campaign' | 'kyc' | 'kyb' | 'system' | 'admin' | 'investment' | 'listing' | 'ido';
  title: string;
  message: string;
  userId: string;
  role: string;
  sourceId?: string;
  metadata?: any;
  read: boolean;
  createdAt: any;
  readAt?: any;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

class RealTimeNotificationManager {
  private listeners: Map<string, (notifications: RealTimeNotification[]) => void> = new Map();
  private unsubscribeFunctions: (() => void)[] = [];
  private currentUser: any = null;

  /**
   * Initialize notification manager for a user
   */
  async initialize(user: any): Promise<void> {
    this.currentUser = user;
    
    if (!user) {
      this.cleanup();
      return;
    }

    console.log('🔔 [REAL-TIME-NOTIFICATIONS] Initializing for user:', user.uid, 'role:', user.role);

    // Clean up existing listeners
    this.cleanup();

    // Set up real-time listeners for all notification types
    this.setupChatNotifications(user);
    this.setupProjectNotifications(user);
    this.setupDealNotifications(user);
    this.setupCampaignNotifications(user);
    this.setupVerificationNotifications(user);
    this.setupSystemNotifications(user);
    this.setupRoleSpecificNotifications(user);
  }

  /**
   * Subscribe to notifications for a specific user
   */
  subscribe(userId: string, callback: (notifications: RealTimeNotification[]) => void): () => void {
    this.listeners.set(userId, callback);
    
    return () => {
      this.listeners.delete(userId);
    };
  }

  /**
   * Setup chat notifications for all roles
   */
  private setupChatNotifications(user: any): void {
    if (!user?.uid) return;

    try {
      // Listen for unread messages in group chats
      const chatsQuery = query(
        collection(db!, 'groupChats'),
        where('members', 'array-contains', user.uid)
      );

      const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const chatNotifications: RealTimeNotification[] = [];
        
        snapshot.docs.forEach(doc => {
          const chatData = doc.data();
          const unreadCount = chatData.unreadCount?.[user.uid] || 0;
          
          // Only create notification if user has unread messages
          if (unreadCount > 0 && chatData.lastMessage) {
            chatNotifications.push({
              id: `chat_${doc.id}`,
              type: 'chat',
              title: `New message in ${chatData.name}`,
              message: chatData.lastMessage.text || 'New message',
              userId: user.uid,
              role: user.role || 'user',
              sourceId: doc.id,
              metadata: {
                chatId: doc.id,
                unreadCount,
                sender: chatData.lastMessage.senderName
              },
              read: false,
              createdAt: chatData.lastMessage.createdAt || new Date(),
              priority: 'medium',
              actionUrl: `/messages?room=${doc.id}`
            });
          }
        });
        
        this.updateNotifications(user.uid, chatNotifications, 'chat');
      }, (error) => {
        console.error('Error listening to chat notifications:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up chat notifications:', error);
    }
  }

  /**
   * Setup project notifications based on role
   */
  private setupProjectNotifications(user: any): void {
    if (!user?.uid) return;

    try {
      let projectsQuery;
      
      // Different queries based on role
      if (user.role === 'founder') {
        // Founders see notifications about their projects
        projectsQuery = query(
          collection(db!, 'projects'),
          where('founderId', '==', user.uid),
          orderBy('updatedAt', 'desc'),
          limit(10)
        );
      } else if (user.role === 'vc') {
        // VCs see all projects
        projectsQuery = query(
          collection(db!, 'projects'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      } else {
        // Other roles see projects they're involved with
        projectsQuery = query(
          collection(db!, 'projects'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      }

      const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
        const projectNotifications: RealTimeNotification[] = [];
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.data().createdAt) {
            const projectData = change.doc.data();
            
            // Only notify if it's a new project (not user's own)
            if (projectData.founderId !== user.uid) {
              projectNotifications.push({
                id: `project_${change.doc.id}`,
                type: 'project',
                title: `New Project: ${projectData.name}`,
                message: projectData.description || 'A new project has been submitted',
                userId: user.uid,
                role: user.role || 'user',
                sourceId: change.doc.id,
                metadata: {
                  projectId: change.doc.id,
                  projectName: projectData.name,
                  founderId: projectData.founderId
                },
                read: false,
                createdAt: projectData.createdAt,
                priority: 'medium',
                actionUrl: `/${user.role}/dealflow`
              });
            }
          }
        });
        
        this.updateNotifications(user.uid, projectNotifications, 'project');
      }, (error) => {
        console.error('Error listening to project notifications:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up project notifications:', error);
    }
  }

  /**
   * Setup deal notifications for VCs and Founders
   */
  private setupDealNotifications(user: any): void {
    if (!user?.uid || !['vc', 'founder'].includes(user.role)) return;

    try {
      const dealsQuery = query(
        collection(db!, 'dealRooms'),
        where(user.role === 'vc' ? 'investorId' : 'founderId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(dealsQuery, (snapshot) => {
        const dealNotifications: RealTimeNotification[] = [];
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const dealData = change.doc.data();
            
            dealNotifications.push({
              id: `deal_${change.doc.id}`,
              type: 'deal',
              title: `New Deal Room: ${dealData.projectName}`,
              message: `A new deal room has been created for ${dealData.projectName}`,
              userId: user.uid,
              role: user.role,
              sourceId: change.doc.id,
              metadata: {
                dealId: change.doc.id,
                projectName: dealData.projectName,
                amount: dealData.amount
              },
              read: false,
              createdAt: dealData.createdAt,
              priority: 'high',
              actionUrl: `/messages?room=${change.doc.id}`
            });
          }
        });
        
        this.updateNotifications(user.uid, dealNotifications, 'deal');
      }, (error) => {
        console.error('Error listening to deal notifications:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up deal notifications:', error);
    }
  }

  /**
   * Setup campaign notifications for Agency and Influencer roles
   */
  private setupCampaignNotifications(user: any): void {
    if (!user?.uid || !['agency', 'influencer'].includes(user.role)) return;

    try {
      const campaignsQuery = query(
        collection(db!, 'campaigns'),
        where(user.role === 'agency' ? 'agencyId' : 'influencerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
        const campaignNotifications: RealTimeNotification[] = [];
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const campaignData = change.doc.data();
            
            campaignNotifications.push({
              id: `campaign_${change.doc.id}`,
              type: 'campaign',
              title: `New Campaign: ${campaignData.name}`,
              message: campaignData.description || 'A new campaign has been created',
              userId: user.uid,
              role: user.role,
              sourceId: change.doc.id,
              metadata: {
                campaignId: change.doc.id,
                campaignName: campaignData.name,
                budget: campaignData.budget
              },
              read: false,
              createdAt: campaignData.createdAt,
              priority: 'medium',
              actionUrl: `/${user.role}/campaigns`
            });
          }
        });
        
        this.updateNotifications(user.uid, campaignNotifications, 'campaign');
      }, (error) => {
        console.error('Error listening to campaign notifications:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up campaign notifications:', error);
    }
  }

  /**
   * Setup verification notifications (KYC/KYB)
   */
  private setupVerificationNotifications(user: any): void {
    if (!user?.uid) return;

    try {
      // Listen for verification status changes
      const userDocRef = doc(db!, 'users', user.uid);
      
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const verificationType = ['founder', 'influencer'].includes(user.role) ? 'kyc' : 'kyb';
          const status = verificationType === 'kyc' ? 
            (userData.kycStatus || userData.kyc?.status) : 
            (userData.kybStatus || userData.kyb?.status);

          // Check if status changed to approved
          if (status === 'approved' || status === 'verified') {
            const notification: RealTimeNotification = {
              id: `verification_${user.uid}_${Date.now()}`,
              type: verificationType as 'kyc' | 'kyb',
              title: `${verificationType.toUpperCase()} Approved!`,
              message: `Your ${verificationType.toUpperCase()} verification has been approved. You can now access all features.`,
              userId: user.uid,
              role: user.role,
              metadata: {
                verificationType,
                status
              },
              read: false,
              createdAt: new Date(),
              priority: 'high',
              actionUrl: `/${user.role}/dashboard`
            };

            this.updateNotifications(user.uid, [notification], verificationType);
          }
        }
      }, (error) => {
        console.error('Error listening to verification notifications:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up verification notifications:', error);
    }
  }

  /**
   * Setup system notifications
   */
  private setupSystemNotifications(user: any): void {
    if (!user?.uid) return;

    try {
      const notificationsQuery = query(
        collection(db!, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const systemNotifications: RealTimeNotification[] = [];
        
        snapshot.docs.forEach(doc => {
          const notificationData = doc.data();
          
          systemNotifications.push({
            id: doc.id,
            type: 'system',
            title: notificationData.title || 'System Notification',
            message: notificationData.message || 'You have a new notification',
            userId: user.uid,
            role: user.role,
            metadata: notificationData.metadata || {},
            read: notificationData.read || false,
            createdAt: notificationData.createdAt,
            priority: notificationData.priority || 'medium',
            actionUrl: notificationData.actionUrl
          });
        });
        
        this.updateNotifications(user.uid, systemNotifications, 'system');
      }, (error) => {
        console.error('Error listening to system notifications:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up system notifications:', error);
    }
  }

  /**
   * Setup role-specific notifications
   */
  private setupRoleSpecificNotifications(user: any): void {
    if (!user?.uid) return;

    try {
      // Exchange: New listings
      if (user.role === 'exchange') {
        const listingsQuery = query(
          collection(db!, 'listings'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
          const listingNotifications: RealTimeNotification[] = [];
          
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const listingData = change.doc.data();
              
              listingNotifications.push({
                id: `listing_${change.doc.id}`,
                type: 'listing',
                title: `New Listing: ${listingData.tokenSymbol}`,
                message: `${listingData.tokenName} has been listed`,
                userId: user.uid,
                role: user.role,
                sourceId: change.doc.id,
                metadata: {
                  listingId: change.doc.id,
                  tokenSymbol: listingData.tokenSymbol
                },
                read: false,
                createdAt: listingData.createdAt,
                priority: 'medium',
                actionUrl: '/exchange/listings'
              });
            }
          });
          
          this.updateNotifications(user.uid, listingNotifications, 'listing');
        }, (error) => {
          console.error('Error listening to listing notifications:', error);
        });

        this.unsubscribeFunctions.push(unsubscribe);
      }

      // IDO: New IDO projects
      if (user.role === 'ido') {
        const idoProjectsQuery = query(
          collection(db!, 'ido_projects'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(idoProjectsQuery, (snapshot) => {
          const idoNotifications: RealTimeNotification[] = [];
          
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const idoData = change.doc.data();
              
              idoNotifications.push({
                id: `ido_${change.doc.id}`,
                type: 'ido',
                title: `New IDO: ${idoData.name}`,
                message: idoData.description || 'New IDO project launched',
                userId: user.uid,
                role: user.role,
                sourceId: change.doc.id,
                metadata: {
                  idoId: change.doc.id,
                  tokenPrice: idoData.tokenPrice
                },
                read: false,
                createdAt: idoData.createdAt,
                priority: 'medium',
                actionUrl: '/ido/launchpad'
              });
            }
          });
          
          this.updateNotifications(user.uid, idoNotifications, 'ido');
        }, (error) => {
          console.error('Error listening to IDO notifications:', error);
        });

        this.unsubscribeFunctions.push(unsubscribe);
      }

      // VC: Investment opportunities
      if (user.role === 'vc') {
        const investmentsQuery = query(
          collection(db!, 'investments'),
          where('investorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(investmentsQuery, (snapshot) => {
          const investmentNotifications: RealTimeNotification[] = [];
          
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const investmentData = change.doc.data();
              
              investmentNotifications.push({
                id: `investment_${change.doc.id}`,
                type: 'investment',
                title: `New Investment: ${investmentData.projectName}`,
                message: `Investment opportunity in ${investmentData.projectName}`,
                userId: user.uid,
                role: user.role,
                sourceId: change.doc.id,
                metadata: {
                  investmentId: change.doc.id,
                  projectName: investmentData.projectName,
                  amount: investmentData.amount
                },
                read: false,
                createdAt: investmentData.createdAt,
                priority: 'high',
                actionUrl: '/vc/portfolio'
              });
            }
          });
          
          this.updateNotifications(user.uid, investmentNotifications, 'investment');
        }, (error) => {
          console.error('Error listening to investment notifications:', error);
        });

        this.unsubscribeFunctions.push(unsubscribe);
      }

    } catch (error) {
      console.error('Error setting up role-specific notifications:', error);
    }
  }

  /**
   * Update notifications for a user
   */
  private updateNotifications(userId: string, notifications: RealTimeNotification[], type: string): void {
    const callback = this.listeners.get(userId);
    if (callback) {
      // Get existing notifications and merge with new ones
      const existingNotifications = this.getStoredNotifications(userId);
      const allNotifications = [...existingNotifications, ...notifications];
      
      // Store in localStorage for persistence
      this.storeNotifications(userId, allNotifications);
      
      // Notify callback
      callback(allNotifications);
    }
  }

  /**
   * Store notifications in localStorage
   */
  private storeNotifications(userId: string, notifications: RealTimeNotification[]): void {
    try {
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notifications:', error);
    }
  }

  /**
   * Get stored notifications from localStorage
   */
  private getStoredNotifications(userId: string): RealTimeNotification[] {
    try {
      const stored = localStorage.getItem(`notifications_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      // Update in Firestore if it's a system notification
      if (notificationId.startsWith('system_')) {
        await updateDoc(doc(db!, 'notifications', notificationId), {
          read: true,
          readAt: serverTimestamp()
        });
      }

      // Update in localStorage
      const notifications = this.getStoredNotifications(userId);
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
      );
      this.storeNotifications(userId, updatedNotifications);

      // Notify listeners
      const callback = this.listeners.get(userId);
      if (callback) {
        callback(updatedNotifications);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = this.getStoredNotifications(userId);
      const updatedNotifications = notifications.map(n => ({ ...n, read: true, readAt: new Date() }));
      this.storeNotifications(userId, updatedNotifications);

      // Notify listeners
      const callback = this.listeners.get(userId);
      if (callback) {
        callback(updatedNotifications);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Get unread count for a user
   */
  getUnreadCount(userId: string): number {
    const notifications = this.getStoredNotifications(userId);
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Create a new notification
   */
  async createNotification(notification: Omit<RealTimeNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    try {
      const notificationData = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: serverTimestamp(),
        read: false
      };

      // Store in Firestore
      await addDoc(collection(db!, 'notifications'), notificationData);

      // Update local storage
      const existingNotifications = this.getStoredNotifications(notification.userId);
      const updatedNotifications = [...existingNotifications, notificationData];
      this.storeNotifications(notification.userId, updatedNotifications);

      // Notify listeners
      const callback = this.listeners.get(notification.userId);
      if (callback) {
        callback(updatedNotifications);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Clean up all listeners
   */
  private cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }

  /**
   * Destroy the manager
   */
  destroy(): void {
    this.cleanup();
    this.listeners.clear();
    this.currentUser = null;
  }
}

// Export singleton instance
export const realTimeNotificationManager = new RealTimeNotificationManager();
