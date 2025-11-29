import { emailService } from '@/lib/email.service';

// User data interface
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
}

// Email sending utilities for the registration flow
export class RegistrationEmailManager {
  
  // Send registration confirmation email after profile completion
  static async sendRegistrationConfirmation(userData: UserData): Promise<boolean> {
    try {
      console.log('📧 Sending registration confirmation to:', userData.email);
      const result = await emailService.sendRegistrationConfirmation(userData);
      
      if (result) {
        console.log('✅ Registration confirmation sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send registration confirmation');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending registration confirmation:', error);
      return false;
    }
  }

  // Send approval email when user is approved
  static async sendApprovalEmail(userData: UserData): Promise<boolean> {
    try {
      console.log('📧 Sending approval email to:', userData.email);
      const result = await emailService.sendApprovalEmail(userData);
      
      if (result) {
        console.log('✅ Approval email sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send approval email');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending approval email:', error);
      return false;
    }
  }

  // Send KYC approval notification
  static async sendKYCApprovalNotification(userData: UserData): Promise<boolean> {
    try {
      console.log('📧 Sending KYC approval notification to:', userData.email);
      const result = await emailService.sendKYCApprovalNotification(userData);
      
      if (result) {
        console.log('✅ KYC approval notification sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send KYC approval notification');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending KYC approval notification:', error);
      return false;
    }
  }

  // Send bulk approval emails to multiple users
  static async sendBulkApprovalEmails(users: UserData[]): Promise<{ success: number; failed: number }> {
    try {
      console.log(`📧 Sending bulk approval emails to ${users.length} users`);
      const result = await emailService.sendBulkApprovalEmails(users);
      
      console.log(`✅ Bulk emails sent: ${result.success} success, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error('❌ Error sending bulk approval emails:', error);
      return { success: 0, failed: users.length };
    }
  }

  // Helper function to extract user data from Firestore document
  static extractUserDataFromFirestore(userDoc: any): UserData {
    return {
      firstName: userDoc.firstName || userDoc.name?.split(' ')[0] || '',
      lastName: userDoc.lastName || userDoc.name?.split(' ').slice(1).join(' ') || '',
      email: userDoc.email || '',
      company: userDoc.company || '',
      jobTitle: userDoc.jobTitle || '',
      phone: userDoc.phone || '',
    };
  }

  // Helper function to validate user data before sending email
  static validateUserData(userData: UserData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userData.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!userData.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!userData.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Valid email address is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Convenience functions for direct use
export const sendRegistrationConfirmation = RegistrationEmailManager.sendRegistrationConfirmation;
export const sendApprovalEmail = RegistrationEmailManager.sendApprovalEmail;
export const sendKYCApprovalNotification = RegistrationEmailManager.sendKYCApprovalNotification;
export const sendBulkApprovalEmails = RegistrationEmailManager.sendBulkApprovalEmails;
