/**
 * Admin Notifications System
 * Real-time notifications for admin panel
 */

import { db, collection, doc, setDoc, query, where, onSnapshot, orderBy, limit as limitQuery } from './firebase.client';

export interface AdminNotification {
  id: string;
  type: 'kyc_submission' | 'kyb_submission' | 'new_project' | 'payment' | 'spotlight_request' | 'system';
  title: string;
  message: string;
  userId?: string;
  userEmail?: string;
  submissionId?: string;
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

/**
 * Send notification to admin(s)
 */
export async function sendAdminNotification(notification: Omit<AdminNotification, 'id' | 'status' | 'createdAt'>): Promise<void> {
  try {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const fullNotification: AdminNotification = {
      id: notificationId,
      ...notification,
      status: 'unread',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db!, 'admin_notifications', notificationId), fullNotification);
    
    console.log('✅ Admin notification sent:', notification.title);
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }
}

/**
 * Notify admin when new KYC is submitted
 */
export async function notifyKYCSubmission(userId: string, userEmail: string, userName: string): Promise<void> {
  await sendAdminNotification({
    type: 'kyc_submission',
    title: 'New KYC Submission',
    message: `${userName} (${userEmail}) has submitted KYC for review`,
    userId,
    userEmail,
    submissionId: userId,
    priority: 'high',
    actionUrl: '/admin/kyc'
  });
}

/**
 * Notify admin when new KYB is submitted
 */
export async function notifyKYBSubmission(userId: string, userEmail: string, companyName: string, role: string): Promise<void> {
  await sendAdminNotification({
    type: 'kyb_submission',
    title: 'New KYB Submission',
    message: `${companyName} (${userEmail}) has submitted KYB for review as ${role}`,
    userId,
    userEmail,
    submissionId: userId,
    priority: 'high',
    actionUrl: '/admin/kyb'
  });
}

/**
 * Listen to admin notifications in real-time
 */
export function listenToAdminNotifications(
  adminEmail: string,
  onUpdate: (notifications: AdminNotification[]) => void
): () => void {
  try {
    const q = query(
      collection(db!, 'admin_notifications'),
      orderBy('createdAt', 'desc'),
      limitQuery(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminNotification));

      onUpdate(notifications);
      
      // Play sound for new unread notifications
      const unreadCount = notifications.filter(n => n.status === 'unread').length;
      if (unreadCount > 0) {
        console.log(`🔔 ${unreadCount} unread admin notifications`);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error listening to notifications:', error);
    return () => {};
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await setDoc(doc(db!, 'admin_notifications', notificationId), {
      status: 'read',
      readAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    const q = query(
      collection(db!, 'admin_notifications'),
      where('status', '==', 'unread')
    );
    
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(doc =>
      setDoc(doc.ref, {
        status: 'read',
        readAt: new Date().toISOString()
      }, { merge: true })
    );

    await Promise.all(promises);
    console.log('✅ All notifications marked as read');
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
  }
}

// Helper function for getDocs (not exported by firebase.client)
async function getDocs(q: any) {
  const { getDocs: getDocsFunc } = await import('firebase/firestore');
  return getDocsFunc(q);
}

