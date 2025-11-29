import { db } from '@/lib/firebase.client';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface UniversalNotification {
  id: string;
  type: 'chat' | 'project' | 'deal' | 'campaign' | 'kyc' | 'kyb' | 'system' | 'admin';
  title: string;
  message: string;
  userId: string;
  role: string;
  sourceId?: string; // projectId, chatId, etc.
  metadata?: any;
  read: boolean;
  createdAt: any;
  readAt?: any;
  priority: 'high' | 'medium' | 'low';
}

class UniversalNotificationService {
  private listeners: Map<string, (notifications: UniversalNotification[]) => void> = new Map();
  private unsubscribeFunctions: (() => void)[] = [];
  private currentUser: any = null;

  /**
   * Initialize notification service for a user
   */
  async initialize(user: any): Promise<void> {
    this.currentUser = user;
    
    if (!user) {
      this.cleanup();
      return;
    }

    console.log('🔔 [UNIVERSAL-NOTIFICATIONS] Initializing for user:', user.uid, 'role:', user.role);

    // Clean up existing listeners
    this.cleanup();

    // Set up real-time listeners for all notification types
    this.setupChatNotifications(user);
    this.setupProjectNotifications(user);
    this.setupDealNotifications(user);
    this.setupCampaignNotifications(user);
    this.setupVerificationNotifications(user);
    this.setupSystemNotifications(user);
  }

  /**
   * Subscribe to notifications for a specific user
   */
  subscribe(userId: string, callback: (notifications: UniversalNotification[]) => void): () => void {
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
        const chatNotifications: UniversalNotification[] = [];
        
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
              priority: 'medium'
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
        const projectNotifications: UniversalNotification[] = [];
        
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
                priority: 'medium'
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
        const dealNotifications: UniversalNotification[] = [];
        
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
              priority: 'high'
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
        const campaignNotifications: UniversalNotification[] = [];
        
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
              priority: 'medium'
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
            const notification: UniversalNotification = {
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
              priority: 'high'
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
        const systemNotifications: UniversalNotification[] = [];
        
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
            priority: notificationData.priority || 'medium'
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
   * Update notifications for a user
   */
  private updateNotifications(userId: string, notifications: UniversalNotification[], type: string): void {
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
  private storeNotifications(userId: string, notifications: UniversalNotification[]): void {
    try {
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notifications:', error);
    }
  }

  /**
   * Get stored notifications from localStorage
   */
  private getStoredNotifications(userId: string): UniversalNotification[] {
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
   * Clean up all listeners
   */
  private cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    this.cleanup();
    this.listeners.clear();
    this.currentUser = null;
  }
}

// Export singleton instance
export const universalNotificationService = new UniversalNotificationService();
