/**
 * Comprehensive Notification Service
 * Handles all platform notifications with UID isolation
 */

import { User } from 'firebase/auth';
import { db, collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from './firebase.client';
import { validateOwnership } from './security-isolation';

export interface Notification {
  id: string;
  userId: string;
  type: 'kyb_decision' | 'room_created' | 'meeting_request' | 'mention' | 'task_due' | 'document_uploaded' | 'stage_change' | 'webhook_failure' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: any;
  expiresAt?: any;
}

class NotificationService {
  private user: User | null = null;
  private unsubscribe: (() => void) | null = null;
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  /**
   * Initialize notification service for a user
   */
  async initialize(user: User | null): Promise<void> {
    this.user = user;
    
    if (!user) {
      this.cleanup();
      return;
    }

    // Subscribe to user's notifications
    const notificationsRef = collection(db!, 'users', user.uid, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      // Validate all notifications belong to this user
      notifications.forEach(notification => {
        try {
          validateOwnership(user, notification, 'userId');
        } catch (error) {
          console.error('🚨 SECURITY: Invalid notification ownership', error);
        }
      });

      // Notify all listeners
      this.listeners.forEach(listener => listener(notifications));
    });
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Send a notification
   */
  async send(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    options?: {
      data?: Record<string, any>;
      actionUrl?: string;
      priority?: Notification['priority'];
      expiresInHours?: number;
    }
  ): Promise<void> {
    try {
      const notification: Partial<Notification> = {
        userId,
        type,
        title,
        message,
        data: options?.data,
        actionUrl: options?.actionUrl,
        priority: options?.priority || 'medium',
        read: false,
        createdAt: serverTimestamp()
      };

      if (options?.expiresInHours) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + options.expiresInHours);
        notification.expiresAt = expiresAt;
      }

      await addDoc(collection(db!, 'users', userId, 'notifications'), notification);
      
      console.log('📬 Notification sent:', { userId, type, title });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send KYB decision notification
   */
  async sendKYBDecision(
    userId: string,
    decision: 'approved' | 'pending' | 'rejected',
    details?: string
  ): Promise<void> {
    const titles = {
      approved: '✅ KYB Approved',
      pending: '⏳ KYB Pending Review',
      rejected: '❌ KYB Rejected'
    };

    const messages = {
      approved: 'Your organization verification has been approved. You can now access all exchange features.',
      pending: 'Your KYB submission is being reviewed. This typically takes 24-48 hours.',
      rejected: `Your KYB verification was not approved. ${details || 'Please contact support for more information.'}`
    };

    await this.send(userId, 'kyb_decision', titles[decision], messages[decision], {
      priority: decision === 'approved' ? 'high' : 'medium',
      actionUrl: decision === 'rejected' ? '/exchange/kyb' : '/exchange/dashboard',
      data: { decision, details }
    });
  }

  /**
   * Send room creation notification
   */
  async sendRoomCreated(
    userId: string,
    roomId: string,
    projectName: string,
    createdBy: string
  ): Promise<void> {
    await this.send(userId, 'room_created', '💬 New Listing Room Created', 
      `A listing room has been created for ${projectName}`, {
      priority: 'high',
      actionUrl: `/exchange/listing-rooms/${roomId}`,
      data: { roomId, projectName, createdBy }
    });
  }

  /**
   * Send meeting request notification
   */
  async sendMeetingRequest(
    userId: string,
    projectName: string,
    requestedBy: string,
    meetingTime?: Date
  ): Promise<void> {
    const message = meetingTime
      ? `Meeting requested for ${projectName} at ${meetingTime.toLocaleString()}`
      : `Meeting requested for ${projectName}`;

    await this.send(userId, 'meeting_request', '📅 Meeting Request', message, {
      priority: 'high',
      data: { projectName, requestedBy, meetingTime }
    });
  }

  /**
   * Send mention notification
   */
  async sendMention(
    userId: string,
    mentionedBy: string,
    roomId: string,
    messagePreview: string
  ): Promise<void> {
    await this.send(userId, 'mention', `💬 ${mentionedBy} mentioned you`, messagePreview, {
      priority: 'high',
      actionUrl: `/messages?room=${roomId}`,
      data: { mentionedBy, roomId }
    });
  }

  /**
   * Send task due notification
   */
  async sendTaskDue(
    userId: string,
    taskTitle: string,
    dueDate: Date,
    roomId?: string
  ): Promise<void> {
    await this.send(userId, 'task_due', '⏰ Task Due Soon', 
      `"${taskTitle}" is due ${dueDate.toLocaleDateString()}`, {
      priority: 'medium',
      actionUrl: roomId ? `/exchange/listing-rooms/${roomId}` : undefined,
      data: { taskTitle, dueDate, roomId }
    });
  }

  /**
   * Send document uploaded notification
   */
  async sendDocumentUploaded(
    userId: string,
    documentName: string,
    uploadedBy: string,
    roomId?: string
  ): Promise<void> {
    await this.send(userId, 'document_uploaded', '📄 New Document Uploaded',
      `${uploadedBy} uploaded "${documentName}"`, {
      priority: 'low',
      actionUrl: roomId ? `/exchange/listing-rooms/${roomId}` : undefined,
      data: { documentName, uploadedBy, roomId }
    });
  }

  /**
   * Send pipeline stage change notification
   */
  async sendStageChange(
    userId: string,
    projectName: string,
    oldStage: string,
    newStage: string,
    pipelineId?: string
  ): Promise<void> {
    await this.send(userId, 'stage_change', '🔄 Pipeline Stage Changed',
      `${projectName} moved from "${oldStage}" to "${newStage}"`, {
      priority: 'medium',
      actionUrl: pipelineId ? `/exchange/pipeline` : undefined,
      data: { projectName, oldStage, newStage, pipelineId }
    });
  }

  /**
   * Send webhook failure notification
   */
  async sendWebhookFailure(
    userId: string,
    webhookUrl: string,
    errorMessage: string,
    failureCount: number
  ): Promise<void> {
    await this.send(userId, 'webhook_failure', '⚠️ Webhook Failure',
      `Webhook to ${webhookUrl} failed ${failureCount} times: ${errorMessage}`, {
      priority: failureCount > 3 ? 'high' : 'medium',
      actionUrl: '/exchange/settings/api',
      data: { webhookUrl, errorMessage, failureCount }
    });
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium'
  ): Promise<void> {
    await this.send(userId, 'system', title, message, {
      priority,
      expiresInHours: 72
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!this.user) return;

    try {
      const notificationRef = doc(db!, 'users', this.user.uid, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    if (!this.user) return;

    try {
      const notificationsRef = collection(db!, 'users', this.user.uid, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', this.user.uid),
        where('read', '==', false)
      );

      const snapshot = await onSnapshot(q, (snap) => {
        snap.docs.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            read: true,
            readAt: serverTimestamp()
          });
        });
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string): Promise<void> {
    if (!this.user) return;

    try {
      const notificationRef = doc(db!, 'users', this.user.uid, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
    this.user = null;
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Export helper functions
export const initializeNotifications = (user: User | null) => notificationService.initialize(user);
export const subscribeToNotifications = (callback: (notifications: Notification[]) => void) => notificationService.subscribe(callback);
export const sendNotification = notificationService.send.bind(notificationService);
export const sendKYBDecision = notificationService.sendKYBDecision.bind(notificationService);
export const sendRoomCreated = notificationService.sendRoomCreated.bind(notificationService);
export const sendMeetingRequest = notificationService.sendMeetingRequest.bind(notificationService);
export const sendMention = notificationService.sendMention.bind(notificationService);
export const sendTaskDue = notificationService.sendTaskDue.bind(notificationService);
export const sendDocumentUploaded = notificationService.sendDocumentUploaded.bind(notificationService);
export const sendStageChange = notificationService.sendStageChange.bind(notificationService);
export const sendWebhookFailure = notificationService.sendWebhookFailure.bind(notificationService);
export const sendSystemNotification = notificationService.sendSystemNotification.bind(notificationService);
export const markNotificationAsRead = notificationService.markAsRead.bind(notificationService);
export const markAllNotificationsAsRead = notificationService.markAllAsRead.bind(notificationService);
export const deleteNotification = notificationService.delete.bind(notificationService);

