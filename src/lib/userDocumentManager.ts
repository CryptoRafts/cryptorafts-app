import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase.client';

export interface UserDocument {
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  createdAt: Date;
  emailVerified: boolean;
  lastUpdated: Date;
  profileCompleted: boolean;
  uid: string;
}

export class UserDocumentManager {
  /**
   * Create or update user document in Firestore
   */
  static async createOrUpdateUser(user: User, additionalData: Partial<UserDocument> = {}): Promise<void> {
    try {
      const userData: UserDocument = {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'user',
        createdAt: new Date(),
        emailVerified: user.emailVerified || false,
        lastUpdated: new Date(),
        profileCompleted: false,
        uid: user.uid,
        ...additionalData
      };

      await setDoc(doc(db!, 'users', user.uid), userData, { merge: true });
      console.log('✅ User document created/updated:', user.email);
    } catch (error) {
      console.error('❌ Error creating user document:', error);
      throw error;
    }
  }

  /**
   * Get user document from Firestore
   */
  static async getUserDocument(uid: string): Promise<UserDocument | null> {
    try {
      const userDoc = await getDoc(doc(db!, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserDocument;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user document:', error);
      return null;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(uid: string, role: string): Promise<void> {
    try {
      await setDoc(doc(db!, 'users', uid), {
        role: role,
        roleSelectedAt: new Date(),
        lastUpdated: new Date()
      }, { merge: true });
      console.log('✅ User role updated:', role);
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Ensure user document exists
   */
  static async ensureUserDocument(user: User): Promise<UserDocument> {
    try {
      const existingDoc = await this.getUserDocument(user.uid);
      if (existingDoc) {
        return existingDoc;
      }

      // Create new user document
      await this.createOrUpdateUser(user);
      const newDoc = await this.getUserDocument(user.uid);
      return newDoc || {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'user',
        createdAt: new Date(),
        emailVerified: user.emailVerified || false,
        lastUpdated: new Date(),
        profileCompleted: false,
        uid: user.uid
      };
    } catch (error) {
      console.error('❌ Error ensuring user document:', error);
      throw error;
    }
  }
}

