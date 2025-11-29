// Notification helper service for influencer role
import { db, collection, addDoc } from "@/lib/firebase.client";

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  link?: string;
}

export async function sendNotification(notification: NotificationData) {
  try {
    await addDoc(collection(db!, "notifications"), {
      ...notification,
      read: false,
      createdAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}

// Notification types for influencer role
export const NotificationTypes = {
  // KYC notifications
  KYC_APPROVED: {
    type: "kyc_approved",
    title: "KYC Approved! 🎉",
    getMessage: () => "Your identity has been verified. You can now access campaigns!"
  },
  KYC_REJECTED: {
    type: "kyc_rejected",
    title: "KYC Review Needed",
    getMessage: (reasons: string[]) => `Your KYC was not approved. ${reasons[0] || "Please review and resubmit."}`
  },
  KYC_COOLDOWN: {
    type: "kyc_cooldown",
    title: "KYC Submission Cooldown",
    getMessage: (hours: number) => `Please wait ${hours} hours before resubmitting your KYC.`
  },
  
  // Campaign notifications
  CAMPAIGN_INVITED: {
    type: "campaign_invited",
    title: "New Campaign Invitation",
    getMessage: (campaignName: string) => `You've been invited to promote "${campaignName}"`
  },
  CAMPAIGN_ACCEPTED: {
    type: "campaign_accepted",
    title: "Campaign Accepted",
    getMessage: (campaignName: string) => `You've accepted the campaign "${campaignName}"`
  },
  CAMPAIGN_ROOM_CREATED: {
    type: "campaign_room_created",
    title: "Campaign Room Created! 🚀",
    getMessage: (campaignName: string) => `Your campaign room for "${campaignName}" is ready!`
  },
  
  // Message notifications
  MENTION: {
    type: "mention",
    title: "You were mentioned",
    getMessage: (senderName: string, message: string) => `${senderName} mentioned you: "${message}"`
  },
  NEW_MESSAGE: {
    type: "new_message",
    title: "New Message",
    getMessage: (senderName: string, roomName: string) => `${senderName} sent a message in ${roomName}`
  },
  
  // Task notifications
  TASK_ASSIGNED: {
    type: "task_assigned",
    title: "New Task Assigned",
    getMessage: (taskTitle: string, assignedBy: string) => `${assignedBy} assigned you a task: "${taskTitle}"`
  },
  DELIVERABLE_DUE: {
    type: "deliverable_due",
    title: "Deliverable Due Soon",
    getMessage: (taskTitle: string, hours: number) => `"${taskTitle}" is due in ${hours} hours`
  },
  TASK_COMPLETED: {
    type: "task_completed",
    title: "Task Completed",
    getMessage: (taskTitle: string) => `Task "${taskTitle}" has been marked as complete`
  },
  
  // Payout notifications
  PAYOUT_APPROVED: {
    type: "payout_approved",
    title: "Payout Approved! 💰",
    getMessage: (amount: number, chain: string) => `Your payout of ${amount} ${chain} has been approved`
  },
  PAYOUT_SENT: {
    type: "payout_sent",
    title: "Payment Sent! 🎉",
    getMessage: (amount: number, chain: string, txHash: string) => `${amount} ${chain} sent! TX: ${txHash.substring(0, 10)}...`
  },
  PAYOUT_REJECTED: {
    type: "payout_rejected",
    title: "Payout Rejected",
    getMessage: (reason: string) => `Your payout request was rejected: ${reason}`
  },
  MILESTONE_COMPLETED: {
    type: "milestone_completed",
    title: "Milestone Reached",
    getMessage: (milestone: string, payout: number) => `Milestone "${milestone}" completed! ${payout}% payout released.`
  },
  
  // Event notifications
  EVENT_CREATED: {
    type: "event_created",
    title: "New Event Scheduled",
    getMessage: (eventTitle: string, startTime: string) => `Event scheduled: "${eventTitle}" on ${startTime}`
  },
  EVENT_REMINDER_1H: {
    type: "event_reminder",
    title: "Event Starting Soon",
    getMessage: (eventTitle: string) => `"${eventTitle}" starts in 1 hour!`
  },
  EVENT_REMINDER_1D: {
    type: "event_reminder",
    title: "Event Tomorrow",
    getMessage: (eventTitle: string) => `Reminder: "${eventTitle}" is tomorrow`
  },
  
  // Reputation notifications
  REPUTATION_UPDATED: {
    type: "reputation_updated",
    title: "Reputation Updated",
    getMessage: (score: number, tier: string) => `Your reputation score is now ${score}/100 (${tier})`
  },
  TIER_UPGRADED: {
    type: "tier_upgraded",
    title: "Tier Upgraded! 🎉",
    getMessage: (newTier: string) => `Congratulations! You've been upgraded to ${newTier} tier!`
  }
};

