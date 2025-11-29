"use client";

import { db, collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, limit, serverTimestamp } from './firebase.client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  href?: string;
  metadata?: any;
  createdAt: any;
  readAt?: any;
}

export interface EmailNotification {
  to: string;
  subject: string;
  template: string;
  data: any;
  priority: 'low' | 'normal' | 'high';
}

class NotificationService {
  // Send in-app notification
  public async sendNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db!, 'notifications'), {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send email notification (server-side)
  public async sendEmailNotification(emailData: EmailNotification): Promise<void> {
    try {
      // In a real implementation, this would call an email service
      // For now, we'll just log it
      console.log('Email notification:', emailData);
      
      // Store email notification for tracking
      await addDoc(collection(db!, 'email_notifications'), {
        ...emailData,
        status: 'sent',
        sentAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  // Mark notification as read
  public async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db!, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  public async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsQuery = query(
        collection(db!, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await (notificationsQuery as any).get();
      if (!db) throw new Error('Database not initialized');
      const batch = db.batch();

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Subscribe to user notifications
  public subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const q = query(
      collection(db!, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    });
  }

  // Get unread notification count
  public subscribeToUnreadCount(userId: string, callback: (count: number) => void): () => void {
    const q = query(
      collection(db!, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  }

  // Send welcome notification
  public async sendWelcomeNotification(userId: string, userName: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Welcome to Cryptorafts!',
      message: `Welcome ${userName}! Your journey in the crypto ecosystem starts here.`,
      type: 'success',
      href: '/dashboard'
    });
  }

  // Send KYC verification notification
  public async sendKYCVerificationNotification(userId: string, verified: boolean): Promise<void> {
    if (verified) {
      await this.sendNotification({
        userId,
        title: 'KYC Verification Successful',
        message: 'Your identity has been successfully verified. You can now access all platform features.',
        type: 'success',
        href: '/dashboard'
      });
    } else {
      await this.sendNotification({
        userId,
        title: 'KYC Verification Failed',
        message: 'Your identity verification failed. Please contact support for assistance.',
        type: 'error',
        href: '/support'
      });
    }
  }

  // Send KYB verification notification
  public async sendKYBVerificationNotification(userId: string, verified: boolean): Promise<void> {
    if (verified) {
      await this.sendNotification({
        userId,
        title: 'KYB Verification Successful',
        message: 'Your business has been successfully verified. You can now access business features.',
        type: 'success',
        href: '/dashboard'
      });
    } else {
      await this.sendNotification({
        userId,
        title: 'KYB Verification Failed',
        message: 'Your business verification failed. Please contact support for assistance.',
        type: 'error',
        href: '/support'
      });
    }
  }

  // Send pitch submission notification
  public async sendPitchSubmissionNotification(userId: string, projectTitle: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Pitch Submitted Successfully',
      message: `Your pitch "${projectTitle}" has been submitted and is under review.`,
      type: 'success',
      href: '/founder/dashboard'
    });
  }

  // Send deal interest notification
  public async sendDealInterestNotification(userId: string, fromUser: string, projectTitle: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'New Deal Interest',
      message: `${fromUser} is interested in your project "${projectTitle}".`,
      type: 'info',
      href: '/deals'
    });
  }

  // Send deal room invitation
  public async sendDealRoomInvitation(userId: string, roomTitle: string, invitedBy: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Deal Room Invitation',
      message: `You've been invited to join "${roomTitle}" by ${invitedBy}.`,
      type: 'info',
      href: '/deal-rooms'
    });
  }

  // Send task assignment notification
  public async sendTaskAssignmentNotification(userId: string, taskTitle: string, assignedBy: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'New Task Assigned',
      message: `You've been assigned a new task: "${taskTitle}" by ${assignedBy}.`,
      type: 'info',
      href: '/tasks'
    });
  }

  // Send system maintenance notification
  public async sendSystemMaintenanceNotification(userId: string, maintenanceTime: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Scheduled Maintenance',
      message: `System maintenance is scheduled for ${maintenanceTime}. Some features may be temporarily unavailable.`,
      type: 'warning',
      href: '/status'
    });
  }

  // Send security alert
  public async sendSecurityAlert(userId: string, alertType: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Security Alert',
      message: `Security alert: ${alertType}. Please review your account security.`,
      type: 'error',
      href: '/security'
    });
  }

  // Bulk send notifications
  public async bulkSendNotifications(userIds: string[], notificationData: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    try {
      const batch = db.batch();
      
      userIds.forEach(userId => {
        const docRef = doc(collection(db!, 'notifications'));
        batch.set(docRef, {
          ...notificationData,
          userId,
          read: false,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk sending notifications:', error);
      throw error;
    }
  }

  // Send email notifications for important events
  public async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    await this.sendEmailNotification({
      to: userEmail,
      subject: 'Welcome to Cryptorafts - Your Crypto Journey Begins',
      template: 'welcome',
      data: { userName },
      priority: 'normal'
    });
  }

  public async sendKYCEmail(userEmail: string, verified: boolean): Promise<void> {
    await this.sendEmailNotification({
      to: userEmail,
      subject: verified ? 'KYC Verification Successful' : 'KYC Verification Failed',
      template: verified ? 'kyc-success' : 'kyc-failed',
      data: { verified },
      priority: 'high'
    });
  }

  public async sendDealEmail(userEmail: string, dealTitle: string, action: string): Promise<void> {
    await this.sendEmailNotification({
      to: userEmail,
      subject: `Deal Update: ${dealTitle}`,
      template: 'deal-update',
      data: { dealTitle, action },
      priority: 'normal'
    });
  }

  // Rate limiting for notifications
  public async checkNotificationRateLimit(userId: string, limit: number = 10, windowMs: number = 60000): Promise<boolean> {
    try {
      const windowStart = new Date(Date.now() - windowMs);
      const q = query(
        collection(db!, 'notifications'),
        where('userId', '==', userId),
        where('createdAt', '>=', windowStart)
      );

      const snapshot = await q.get();
      return snapshot.size < limit;
    } catch (error) {
      console.error('Error checking notification rate limit:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
