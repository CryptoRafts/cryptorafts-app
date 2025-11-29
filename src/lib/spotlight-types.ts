// Verified Spotlight Types and Interfaces

export interface SpotlightApplication {
  id: string;
  projectId: string;
  projectName: string;
  founderId: string;
  founderName: string;
  founderEmail: string;
  slotType: 'premium' | 'featured';
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'expired';
  
  // Project Details
  bannerUrl: string;
  logoUrl: string;
  tagline: string;
  description: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  
  // Verification Data
  kycVerified: boolean;
  kybVerified: boolean;
  verificationBadges: string[];
  
  // Pricing and Duration
  monthlyPrice: number; // $300 for premium, $150 for featured
  startDate: Date;
  endDate: Date;
  
  // Payment
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'crypto';
  paymentId?: string;
  stripeSessionId?: string;
  cryptoTransactionHash?: string;
  
  // Admin Management
  approvedBy?: string; // Admin user ID
  approvedAt?: Date;
  suspendedBy?: string;
  suspendedAt?: Date;
  suspensionReason?: string;
  
  // Analytics
  impressions: number;
  profileViews: number;
  clicks: number;
  lastImpression?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User who submitted application
}

export interface SpotlightSlot {
  id: string;
  type: 'premium' | 'featured';
  position: number; // 1 for premium, 1-3 for featured
  isActive: boolean;
  currentApplication?: string; // SpotlightApplication ID
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpotlightAnalytics {
  id: string;
  spotlightId: string;
  date: Date;
  impressions: number;
  profileViews: number;
  clicks: number;
  uniqueUsers: number;
  conversionRate: number;
  avgViewDuration: number; // in seconds
}

export interface SpotlightPayment {
  id: string;
  spotlightId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'stripe' | 'crypto';
  paymentId: string;
  createdAt: Date;
  completedAt?: Date;
}

// Constants
export const SPOTLIGHT_TYPES = {
  PREMIUM: {
    type: 'premium' as const,
    price: 300,
    title: 'Premium Spotlight',
    description: 'Top homepage placement',
    duration: 30, // days
    maxSlots: 1
  },
  FEATURED: {
    type: 'featured' as const,
    price: 150,
    title: 'Featured Spotlight',
    description: 'Explore section placement',
    duration: 30, // days
    maxSlots: 3
  }
} as const;

export const SPOTLIGHT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;

