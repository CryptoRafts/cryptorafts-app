import { db } from '@/lib/firebase.client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { RegistrationEmailManager } from '@/lib/registration-email.manager';

// Admin utility to send approval emails to all registered users
export class AdminEmailManager {
  
  // Get all registered users from Firestore
  static async getAllRegisteredUsers(): Promise<any[]> {
    try {
      const usersRef = collection(db!, 'users');
      const q = query(usersRef, where('profileCompleted', '==', true));
      const querySnapshot = await getDocs(q);
      
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📊 Found ${users.length} registered users`);
      return users;
    } catch (error) {
      console.error('❌ Error fetching registered users:', error);
      return [];
    }
  }

  // Get users by KYC status
  static async getUsersByKYCStatus(status: string): Promise<any[]> {
    try {
      const usersRef = collection(db!, 'users');
      const q = query(
        usersRef, 
        where('profileCompleted', '==', true),
        where('kycStatus', '==', status)
      );
      const querySnapshot = await getDocs(q);
      
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📊 Found ${users.length} users with KYC status: ${status}`);
      return users;
    } catch (error) {
      console.error('❌ Error fetching users by KYC status:', error);
      return [];
    }
  }

  // Send approval emails to all registered users
  static async sendApprovalEmailsToAllUsers(): Promise<{ success: number; failed: number }> {
    try {
      const users = await this.getAllRegisteredUsers();
      
      if (users.length === 0) {
        console.log('ℹ️ No registered users found');
        return { success: 0, failed: 0 };
      }

      // Convert to user data format
      const userDataList = users.map(user => 
        RegistrationEmailManager.extractUserDataFromFirestore(user)
      ).filter(userData => {
        const validation = RegistrationEmailManager.validateUserData(userData);
        if (!validation.isValid) {
          console.warn(`⚠️ Skipping user with invalid data: ${validation.errors.join(', ')}`);
        }
        return validation.isValid;
      });

      console.log(`📧 Sending approval emails to ${userDataList.length} users`);
      
      const result = await RegistrationEmailManager.sendBulkApprovalEmails(userDataList);
      
      console.log(`✅ Approval emails sent: ${result.success} success, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error('❌ Error sending approval emails to all users:', error);
      return { success: 0, failed: 0 };
    }
  }

  // Send approval emails to users with specific KYC status
  static async sendApprovalEmailsByKYCStatus(status: string): Promise<{ success: number; failed: number }> {
    try {
      const users = await this.getUsersByKYCStatus(status);
      
      if (users.length === 0) {
        console.log(`ℹ️ No users found with KYC status: ${status}`);
        return { success: 0, failed: 0 };
      }

      // Convert to user data format
      const userDataList = users.map(user => 
        RegistrationEmailManager.extractUserDataFromFirestore(user)
      ).filter(userData => {
        const validation = RegistrationEmailManager.validateUserData(userData);
        if (!validation.isValid) {
          console.warn(`⚠️ Skipping user with invalid data: ${validation.errors.join(', ')}`);
        }
        return validation.isValid;
      });

      console.log(`📧 Sending approval emails to ${userDataList.length} users with KYC status: ${status}`);
      
      const result = await RegistrationEmailManager.sendBulkApprovalEmails(userDataList);
      
      console.log(`✅ Approval emails sent: ${result.success} success, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error(`❌ Error sending approval emails to users with KYC status ${status}:`, error);
      return { success: 0, failed: 0 };
    }
  }

  // Send KYC approval notifications to approved users
  static async sendKYCApprovalNotifications(): Promise<{ success: number; failed: number }> {
    try {
      const approvedUsers = await this.getUsersByKYCStatus('approved');
      
      if (approvedUsers.length === 0) {
        console.log('ℹ️ No approved users found');
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      for (const user of approvedUsers) {
        const userData = RegistrationEmailManager.extractUserDataFromFirestore(user);
        const validation = RegistrationEmailManager.validateUserData(userData);
        
        if (validation.isValid) {
          const result = await RegistrationEmailManager.sendKYCApprovalNotification(userData);
          if (result) {
            success++;
          } else {
            failed++;
          }
        } else {
          console.warn(`⚠️ Skipping user with invalid data: ${validation.errors.join(', ')}`);
          failed++;
        }
        
        // Add delay between emails
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ KYC approval notifications sent: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error('❌ Error sending KYC approval notifications:', error);
      return { success: 0, failed: 0 };
    }
  }
}
