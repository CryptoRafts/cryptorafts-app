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
      userIds,
      type,
      title,
      message,
      data = {},
      channels = ['in_app'],
      priority = 'normal'
    } = body;

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, message" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    const notifications = [];

    // Create notifications for each user
    for (const userId of userIds) {
      const notificationData = {
        userId,
        type,
        title,
        message,
        data,
        channels,
        priority,
        read: false,
        timestamp: Date.now(),
        sentBy: uid,
        delivered: false
      };

      const notificationRef = await db.collection('notifications').add(notificationData);
      notifications.push({
        id: notificationRef.id,
        ...notificationData
      });

      // Send push notification if enabled
      if (channels.includes('push')) {
        await sendPushNotification(userId, title, message, data);
      }

      // Send email if enabled
      if (channels.includes('email')) {
        await sendEmailNotification(userId, title, message, data);
      }
    }

    // Create audit log
    await db.collection('audit_logs').add({
      type: 'notification_sent',
      sentBy: uid,
      notificationType: type,
      recipientCount: userIds.length,
      timestamp: Date.now()
    });

    return NextResponse.json({
      success: true,
      notifications,
      message: `Notifications sent to ${userIds.length} users`
    });

  } catch (error) {
    console.error("Notification send error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}

async function sendPushNotification(userId: string, title: string, message: string, data: any) {
  try {
    // Get user's push tokens
    const db = getAdminDb();
    if (!db) return;
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    
    const pushTokens = userData?.pushTokens || [];
    if (pushTokens.length === 0) return;

    // Send push notification via Firebase Cloud Messaging
    const adminAuth = getAdminAuth();
    if (!adminAuth) return;
    
    // TODO: Implement proper FCM push notification
    console.log(`Would send push to ${pushTokens.length} tokens for user ${userId}`);
    // Implement actual FCM push notification here when needed
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

async function sendEmailNotification(userId: string, title: string, message: string, data: any) {
  try {
    // Get user's email
    const db = getAdminDb();
    if (!db) return;
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    
    const email = userData?.email;
    if (!email) return;

    // Send email via your email service (SendGrid, AWS SES, etc.)
    // This is a placeholder implementation
    console.log(`Sending email to ${email}: ${title} - ${message}`);
    
    // In production, integrate with your email service:
    // await emailService.send({
    //   to: email,
    //   subject: title,
    //   template: 'notification',
    //   data: { message, ...data }
    // });
  } catch (error) {
    console.error('Email notification error:', error);
  }
}
