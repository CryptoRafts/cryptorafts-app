import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from '@/lib/firebase.client';
import { ChatNotification, ChatPreferences } from './chat.types';

export class ChatNotificationService {
  private static instance: ChatNotificationService;
  
  public static getInstance(): ChatNotificationService {
    if (!ChatNotificationService.instance) {
      ChatNotificationService.instance = new ChatNotificationService();
    }
    return ChatNotificationService.instance;
  }

  // Create notification
  async createNotification(notification: Omit<ChatNotification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    const notificationData = {
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db!, 'chat_notifications'), notificationData);
    return docRef.id;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db!, 'chat_notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db!, 'chat_notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
  }

  // Get user notifications
  async getUserNotifications(userId: string, limitCount: number = 50): Promise<ChatNotification[]> {
    const q = query(
      collection(db!, 'chat_notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatNotification[];
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db!, 'chat_notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (notifications: ChatNotification[]) => void): () => void {
    const q = query(
      collection(db!, 'chat_notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatNotification[];
      callback(notifications);
    });
  }

  // Subscribe to unread count
  subscribeToUnreadCount(userId: string, callback: (count: number) => void): () => void {
    const q = query(
      collection(db!, 'chat_notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  }

  // Send message notification
  async sendMessageNotification(
    roomId: string, 
    messageId: string, 
    senderId: string, 
    messageText: string,
    roomMembers: string[]
  ): Promise<void> {
    const notifications = roomMembers
      .filter(memberId => memberId !== senderId) // Don't notify sender
      .map(memberId => ({
        userId: memberId,
        roomId,
        messageId,
        type: 'message' as const,
        title: 'New Message',
        body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
        data: { roomId, messageId, senderId }
      }));

    // Create notifications in batch
    const createPromises = notifications.map(notification => 
      this.createNotification(notification)
    );

    await Promise.all(createPromises);
  }

  // Send mention notification
  async sendMentionNotification(
    roomId: string,
    messageId: string,
    senderId: string,
    mentionedUserId: string,
    messageText: string
  ): Promise<void> {
    await this.createNotification({
      userId: mentionedUserId,
      roomId,
      messageId,
      type: 'mention',
      title: 'You were mentioned',
      body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
      data: { roomId, messageId, senderId }
    });
  }

  // Send reaction notification
  async sendReactionNotification(
    roomId: string,
    messageId: string,
    reactorId: string,
    messageOwnerId: string,
    emoji: string
  ): Promise<void> {
    if (reactorId === messageOwnerId) return; // Don't notify self

    await this.createNotification({
      userId: messageOwnerId,
      roomId,
      messageId,
      type: 'reaction',
      title: 'New Reaction',
      body: `${emoji} on your message`,
      data: { roomId, messageId, reactorId, emoji }
    });
  }

  // Send task assignment notification
  async sendTaskAssignmentNotification(
    roomId: string,
    taskId: string,
    assignerId: string,
    assigneeId: string,
    taskTitle: string
  ): Promise<void> {
    await this.createNotification({
      userId: assigneeId,
      roomId,
      type: 'task_assigned',
      title: 'Task Assigned',
      body: `You were assigned: ${taskTitle}`,
      data: { roomId, taskId, assignerId }
    });
  }

  // Send event reminder notification
  async sendEventReminderNotification(
    roomId: string,
    eventId: string,
    userId: string,
    eventTitle: string,
    eventTime: any
  ): Promise<void> {
    await this.createNotification({
      userId,
      roomId,
      type: 'event_reminder',
      title: 'Event Reminder',
      body: `${eventTitle} is starting soon`,
      data: { roomId, eventId, eventTime }
    });
  }

  // Check if user should receive notification based on preferences
  async shouldNotifyUser(
    userId: string, 
    roomId: string, 
    notificationType: 'message' | 'mention' | 'reaction' | 'task_assigned' | 'event_reminder'
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      // Check global notification settings
      if (!preferences.notifications.enabled) {
        return false;
      }

      // Check quiet hours
      if (preferences.notifications.quietHours.enabled) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = this.parseTime(preferences.notifications.quietHours.start);
        const endTime = this.parseTime(preferences.notifications.quietHours.end);
        
        if (this.isInQuietHours(currentTime, startTime, endTime)) {
          // Mentions can bypass quiet hours if enabled
          if (notificationType !== 'mention') {
            return false;
          }
        }
      }

      // Check per-room settings
      const roomSettings = preferences.notifications.perRoom[roomId];
      if (roomSettings) {
        if (!roomSettings.enabled) {
          return false;
        }
        if (roomSettings.mentionsOnly && notificationType !== 'mention') {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true; // Default to allowing notifications
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<ChatPreferences> {
    const preferencesRef = doc(db!, 'chat_preferences', userId);
    const preferencesSnap = await getDoc(preferencesRef);
    
    if (preferencesSnap.exists()) {
      return preferencesSnap.data() as ChatPreferences;
    }

    // Return default preferences
    return {
      userId,
      notifications: {
        enabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        perRoom: {},
        emailFallback: true,
        emailDelay: 24
      },
      privacy: {
        lockChats: false,
        hidePreviews: false,
        screenshotWarning: true
      },
      ui: {
        theme: 'auto',
        fontSize: 'medium',
        showTimestamps: true,
        showReadReceipts: true
      }
    };
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<ChatPreferences>): Promise<void> {
    const preferencesRef = doc(db!, 'chat_preferences', userId);
    await updateDoc(preferencesRef, {
      ...preferences,
      updatedAt: serverTimestamp()
    });
  }

  // Helper methods
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isInQuietHours(currentTime: number, startTime: number, endTime: number): boolean {
    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Clean up old notifications (run periodically)
  async cleanupOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const q = query(
      collection(db!, 'chat_notifications'),
      where('createdAt', '<', cutoffDate),
      where('read', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
  }
}

export const chatNotificationService = ChatNotificationService.getInstance();
