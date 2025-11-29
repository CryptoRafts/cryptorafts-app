import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";
import { requireUser } from "@/app/api/_utils";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser(req);
    if (!uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      type, 
      title, 
      message, 
      priority = 'medium',
      data = {},
      expiresAt
    } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate notification type
    const validTypes = [
      'kyc_result', 'kyb_result', 'pitch_analyzed', 'interest_acceptance',
      'new_room', 'mention', 'task_due', 'event_starting', 'file_viewed', 'room_created'
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }

    // Create notification
    const notificationData = {
      userId: uid,
      type,
      title,
      message,
      priority,
      data,
      read: false,
      createdAt: Date.now(),
      expiresAt: expiresAt || null
    };

    const docRef = await db.collection('notifications').add(notificationData);

    // Trigger additional notification channels based on user preferences
    await triggerNotificationChannels(uid, notificationData, db);

    return NextResponse.json({
      success: true,
      notificationId: docRef.id,
      notification: notificationData
    });

  } catch (error) {
    console.error('Notification creation error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function triggerNotificationChannels(userId: string, notification: any, db: any) {
  try {
    // Get user notification preferences
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const preferences = userData?.notificationSettings || {};

    // Check if notifications are enabled for this type
    const typeSettings = preferences.types?.[notification.type];
    if (!typeSettings) return;

    // Send email notification if enabled
    if (typeSettings.email && preferences.email) {
      await sendEmailNotification(userId, notification);
    }

    // Send push notification if enabled
    if (typeSettings.push && preferences.push) {
      await sendPushNotification(userId, notification);
    }

    // Check quiet hours for push notifications
    if (typeSettings.push && preferences.push && isQuietHours(preferences.quietHours)) {
      // Queue for later or send with low priority
      await queueQuietHoursNotification(userId, notification);
    }

  } catch (error) {
    console.error('Error triggering notification channels:', error);
  }
}

async function sendEmailNotification(userId: string, notification: any) {
  // Implementation would integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`Sending email notification to user ${userId}:`, notification);
  
  // Example implementation:
  // await emailService.send({
  //   to: user.email,
  //   subject: notification.title,
  //   template: 'notification',
  //   data: notification
  // });
}

async function sendPushNotification(userId: string, notification: any) {
  // Implementation would integrate with your push notification service (Firebase FCM, etc.)
  console.log(`Sending push notification to user ${userId}:`, notification);
  
  // Example implementation:
  // await pushService.send({
  //   userId,
  //   title: notification.title,
  //   body: notification.message,
  //   data: notification.data
  // });
}

async function queueQuietHoursNotification(userId: string, notification: any) {
  // Queue notification to be sent after quiet hours
  console.log(`Queuing quiet hours notification for user ${userId}:`, notification);
  
  // Implementation would store in a queue (Redis, database, etc.) to be processed later
}

function isQuietHours(quietHoursSettings: any): boolean {
  if (!quietHoursSettings?.enabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const startTime = parseInt(quietHoursSettings.start.split(':')[0]) * 60 + 
                   parseInt(quietHoursSettings.start.split(':')[1]);
  const endTime = parseInt(quietHoursSettings.end.split(':')[0]) * 60 + 
                 parseInt(quietHoursSettings.end.split(':')[1]);

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime < endTime;
  }
}
