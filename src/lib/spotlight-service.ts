// Verified Spotlight Service - Firestore Operations

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase.client';
import { 
  SpotlightApplication, 
  SpotlightSlot, 
  SpotlightAnalytics,
  SPOTLIGHT_TYPES,
  SPOTLIGHT_STATUS,
  PAYMENT_STATUS
} from './spotlight-types';

export class SpotlightService {
  
  // ==================== APPLICATIONS ====================
  
  /**
   * Create a new spotlight application
   */
  static async createApplication(applicationData: Partial<SpotlightApplication>): Promise<string> {
    try {
      const application: Omit<SpotlightApplication, 'id'> = {
        projectId: applicationData.projectId!,
        projectName: applicationData.projectName!,
        founderId: applicationData.founderId!,
        founderName: applicationData.founderName!,
        founderEmail: applicationData.founderEmail!,
        slotType: applicationData.slotType!,
        status: SPOTLIGHT_STATUS.PENDING,
        
        bannerUrl: applicationData.bannerUrl!,
        logoUrl: applicationData.logoUrl!,
        tagline: applicationData.tagline!,
        description: applicationData.description!,
        website: applicationData.website,
        socialLinks: applicationData.socialLinks,
        
        kycVerified: applicationData.kycVerified!,
        kybVerified: applicationData.kybVerified!,
        verificationBadges: applicationData.verificationBadges || [],
        
        monthlyPrice: applicationData.monthlyPrice!,
        startDate: applicationData.startDate!,
        endDate: applicationData.endDate!,
        
        paymentStatus: PAYMENT_STATUS.PENDING,
        paymentMethod: applicationData.paymentMethod!,
        
        impressions: 0,
        profileViews: 0,
        clicks: 0,
        
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: applicationData.createdBy!
      };

      const docRef = await addDoc(collection(db!, 'spotlightApplications'), {
        ...application,
        startDate: Timestamp.fromDate(application.startDate),
        endDate: Timestamp.fromDate(application.endDate),
        createdAt: Timestamp.fromDate(application.createdAt),
        updatedAt: Timestamp.fromDate(application.updatedAt),
        approvedAt: application.approvedAt ? Timestamp.fromDate(application.approvedAt) : null,
        suspendedAt: application.suspendedAt ? Timestamp.fromDate(application.suspendedAt) : null,
        lastImpression: application.lastImpression ? Timestamp.fromDate(application.lastImpression) : null
      });

      console.log('✅ Spotlight application created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating spotlight application:', error);
      throw error;
    }
  }

  /**
   * Get all spotlight applications (admin)
   */
  static async getAllApplications(): Promise<SpotlightApplication[]> {
    try {
      const q = query(
        collection(db!, 'spotlightApplications'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const applications: SpotlightApplication[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          approvedAt: data.approvedAt?.toDate(),
          suspendedAt: data.suspendedAt?.toDate(),
          lastImpression: data.lastImpression?.toDate()
        } as SpotlightApplication);
      });
      
      return applications;
    } catch (error) {
      console.error('❌ Error fetching spotlight applications:', error);
      throw error;
    }
  }

  /**
   * Get applications by status
   */
  static async getApplicationsByStatus(status: string): Promise<SpotlightApplication[]> {
    try {
      const q = query(
        collection(db!, 'spotlightApplications'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const applications: SpotlightApplication[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          approvedAt: data.approvedAt?.toDate(),
          suspendedAt: data.suspendedAt?.toDate(),
          lastImpression: data.lastImpression?.toDate()
        } as SpotlightApplication);
      });
      
      return applications;
    } catch (error) {
      console.error('❌ Error fetching applications by status:', error);
      throw error;
    }
  }

  /**
   * Get user's spotlight applications
   */
  static async getUserApplications(userId: string): Promise<SpotlightApplication[]> {
    try {
      const q = query(
        collection(db!, 'spotlightApplications'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const applications: SpotlightApplication[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          approvedAt: data.approvedAt?.toDate(),
          suspendedAt: data.suspendedAt?.toDate(),
          lastImpression: data.lastImpression?.toDate()
        } as SpotlightApplication);
      });
      
      return applications;
    } catch (error) {
      console.error('❌ Error fetching user applications:', error);
      throw error;
    }
  }

  /**
   * Update application status (admin)
   */
  static async updateApplicationStatus(
    applicationId: string, 
    status: string, 
    adminId: string,
    reason?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === SPOTLIGHT_STATUS.APPROVED) {
        updateData.approvedBy = adminId;
        updateData.approvedAt = Timestamp.now();
      } else if (status === SPOTLIGHT_STATUS.SUSPENDED) {
        updateData.suspendedBy = adminId;
        updateData.suspendedAt = Timestamp.now();
        if (reason) updateData.suspensionReason = reason;
      }

      await updateDoc(doc(db!, 'spotlightApplications', applicationId), updateData);
      console.log('✅ Application status updated:', applicationId, status);
    } catch (error) {
      console.error('❌ Error updating application status:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    applicationId: string, 
    paymentStatus: string,
    paymentId?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        paymentStatus,
        updatedAt: Timestamp.now()
      };

      if (paymentId) {
        updateData.paymentId = paymentId;
      }

      if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
        updateData.status = SPOTLIGHT_STATUS.APPROVED;
        updateData.approvedAt = Timestamp.now();
      }

      await updateDoc(doc(db!, 'spotlightApplications', applicationId), updateData);
      console.log('✅ Payment status updated:', applicationId, paymentStatus);
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      throw error;
    }
  }

  // ==================== ACTIVE SPOTLIGHTS ====================

  /**
   * Get active spotlight applications for display
   */
  static async getActiveSpotlights(): Promise<{
    premium: SpotlightApplication | null;
    featured: SpotlightApplication[];
  }> {
    try {
      // Simple query - only status filter (NO orderBy to avoid index requirement!)
      const q = query(
        collection(db!, 'spotlightApplications'),
        where('status', '==', SPOTLIGHT_STATUS.APPROVED)
      );
      
      const snapshot = await getDocs(q);
      const now = new Date();
      const applications: SpotlightApplication[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const startDate = data.startDate?.toDate() || new Date();
        const endDate = data.endDate?.toDate() || new Date();
        
        // Filter by date in JavaScript to avoid complex Firestore query
        if (startDate <= now && endDate >= now) {
          applications.push({
            id: doc.id,
            ...data,
            startDate,
            endDate,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            approvedAt: data.approvedAt?.toDate(),
            suspendedAt: data.suspendedAt?.toDate(),
            lastImpression: data.lastImpression?.toDate()
          } as SpotlightApplication);
        }
      });

      // Sort by startDate in JavaScript (newest first)
      applications.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      // Separate premium and featured
      const premium = applications.find(app => app.slotType === 'premium') || null;
      const featured = applications
        .filter(app => app.slotType === 'featured')
        .slice(0, 3); // Max 3 featured slots

      return { premium, featured };
    } catch (error) {
      console.error('❌ Error fetching active spotlights:', error);
      throw error;
    }
  }

  /**
   * Track impression for spotlight
   */
  static async trackImpression(spotlightId: string): Promise<void> {
    try {
      const applicationRef = doc(db!, 'spotlightApplications', spotlightId);
      const applicationDoc = await getDoc(applicationRef);
      
      if (applicationDoc.exists()) {
        const currentImpressions = applicationDoc.data().impressions || 0;
        await updateDoc(applicationRef, {
          impressions: currentImpressions + 1,
          lastImpression: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('❌ Error tracking impression:', error);
    }
  }

  /**
   * Track profile view for spotlight
   */
  static async trackProfileView(spotlightId: string): Promise<void> {
    try {
      const applicationRef = doc(db!, 'spotlightApplications', spotlightId);
      const applicationDoc = await getDoc(applicationRef);
      
      if (applicationDoc.exists()) {
        const currentViews = applicationDoc.data().profileViews || 0;
        await updateDoc(applicationRef, {
          profileViews: currentViews + 1,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('❌ Error tracking profile view:', error);
    }
  }

  /**
   * Track click for spotlight
   */
  static async trackClick(spotlightId: string): Promise<void> {
    try {
      const applicationRef = doc(db!, 'spotlightApplications', spotlightId);
      const applicationDoc = await getDoc(applicationRef);
      
      if (applicationDoc.exists()) {
        const currentClicks = applicationDoc.data().clicks || 0;
        await updateDoc(applicationRef, {
          clicks: currentClicks + 1,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('❌ Error tracking click:', error);
    }
  }

  /**
   * Update investment raised for spotlight
   */
  static async updateInvestmentRaised(spotlightId: string, amount: number): Promise<void> {
    try {
      const applicationRef = doc(db!, 'spotlightApplications', spotlightId);
      const applicationDoc = await getDoc(applicationRef);
      
      if (applicationDoc.exists()) {
        const currentInvestment = applicationDoc.data().investmentRaised || 0;
        await updateDoc(applicationRef, {
          investmentRaised: currentInvestment + amount,
          updatedAt: Timestamp.now()
        });
        console.log(`✅ Investment raised updated for ${spotlightId}: +$${amount}`);
      }
    } catch (error) {
      console.error('❌ Error updating investment raised:', error);
    }
  }

  // ==================== AUTO-EXPIRY ====================

  /**
   * Check and handle expired spotlights
   */
  static async handleExpiredSpotlights(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db!, 'spotlightApplications'),
        where('status', '==', SPOTLIGHT_STATUS.APPROVED),
        where('endDate', '<', Timestamp.fromDate(now))
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          status: SPOTLIGHT_STATUS.EXPIRED,
          updatedAt: Timestamp.now()
        });
      });
      
      if (!snapshot.empty) {
        await batch.commit();
        console.log(`✅ Marked ${snapshot.size} spotlight(s) as expired`);
      }
    } catch (error) {
      console.error('❌ Error handling expired spotlights:', error);
    }
  }

  // ==================== REAL-TIME LISTENERS ====================

  /**
   * Listen to all applications changes (admin)
   */
  static listenToApplications(
    callback: (applications: SpotlightApplication[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db!, 'spotlightApplications'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const applications: SpotlightApplication[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          approvedAt: data.approvedAt?.toDate(),
          suspendedAt: data.suspendedAt?.toDate(),
          lastImpression: data.lastImpression?.toDate()
        } as SpotlightApplication);
      });
      
      callback(applications);
    }, (error) => {
      // Handle permission errors gracefully
      console.log('ℹ️ Spotlight data not available - user may need to login');
      callback([]);
    });
  }

  /**
   * Listen to active spotlights changes
   */
  static listenToActiveSpotlights(
    callback: (data: { premium: SpotlightApplication | null; featured: SpotlightApplication[] }) => void
  ): Unsubscribe {
    // Simple query - only status filter (NO orderBy to avoid index requirement!)
    const q = query(
      collection(db!, 'spotlightApplications'),
      where('status', '==', SPOTLIGHT_STATUS.APPROVED)
    );

    return onSnapshot(q, (snapshot) => {
      const applications: SpotlightApplication[] = [];
      const now = new Date();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const startDate = data.startDate?.toDate() || new Date();
        const endDate = data.endDate?.toDate() || new Date();
        
        // Only include active spotlights
        if (startDate <= now && endDate >= now) {
          applications.push({
            id: doc.id,
            ...data,
            startDate,
            endDate,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            approvedAt: data.approvedAt?.toDate(),
            suspendedAt: data.suspendedAt?.toDate(),
            lastImpression: data.lastImpression?.toDate()
          } as SpotlightApplication);
        }
      });

      // Sort by startDate in JavaScript (newest first)
      applications.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      // Separate premium and featured
      const premium = applications.find(app => app.slotType === 'premium') || null;
      const featured = applications
        .filter(app => app.slotType === 'featured')
        .slice(0, 3);

      callback({ premium, featured });
    }, (error) => {
      // Handle permission errors gracefully
      console.log('ℹ️ Spotlight data not available - user may need to login');
      callback({ premium: null, featured: [] });
    });
  }
}

