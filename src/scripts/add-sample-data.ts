import { db } from '@/lib/firebase.client';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Sample data for testing admin functionality
const sampleUsers = [
  {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'founder',
    kycStatus: 'pending',
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
    isActive: true,
    phone: '+1234567890',
    country: 'USA'
  },
  {
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'investor',
    kycStatus: 'approved',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
    lastLoginAt: Timestamp.now(),
    isActive: true,
    phone: '+1234567891',
    country: 'Canada'
  },
  {
    email: 'mike.wilson@example.com',
    firstName: 'Mike',
    lastName: 'Wilson',
    role: 'founder',
    kycStatus: 'rejected',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000)), // 2 days ago
    lastLoginAt: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
    isActive: true,
    phone: '+1234567892',
    country: 'UK'
  }
];

const sampleProjects = [
  {
    name: 'CryptoWallet Pro',
    description: 'A revolutionary cryptocurrency wallet with advanced security features',
    founderId: 'founder1',
    founderName: 'John Doe',
    founderEmail: 'john.doe@example.com',
    status: 'pending',
    category: 'FinTech',
    fundingGoal: 500000,
    currentFunding: 125000,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    tags: ['crypto', 'wallet', 'security'],
    pitch: 'Revolutionary crypto wallet with biometric security'
  },
  {
    name: 'AI Trading Bot',
    description: 'Intelligent trading bot using machine learning for cryptocurrency markets',
    founderId: 'founder2',
    founderName: 'Jane Smith',
    founderEmail: 'jane.smith@example.com',
    status: 'approved',
    category: 'AI/ML',
    fundingGoal: 750000,
    currentFunding: 300000,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
    updatedAt: Timestamp.now(),
    tags: ['ai', 'trading', 'crypto', 'ml'],
    pitch: 'AI-powered trading bot for crypto markets'
  }
];

const sampleSpotlights = [
  {
    title: 'Featured: CryptoWallet Pro',
    description: 'Revolutionary cryptocurrency wallet with advanced security features',
    projectId: 'project1',
    projectName: 'CryptoWallet Pro',
    founderId: 'founder1',
    founderName: 'John Doe',
    founderEmail: 'john.doe@example.com',
    status: 'active',
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    category: 'FinTech',
    priority: 1,
    featuredImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500'
  },
  {
    title: 'Spotlight: AI Trading Bot',
    description: 'Intelligent trading bot using machine learning',
    projectId: 'project2',
    projectName: 'AI Trading Bot',
    founderId: 'founder2',
    founderName: 'Jane Smith',
    founderEmail: 'jane.smith@example.com',
    status: 'pending',
    isActive: false,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
    updatedAt: Timestamp.now(),
    category: 'AI/ML',
    priority: 2,
    featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500'
  }
];

const sampleKYCDocuments = [
  {
    userId: 'user1',
    userEmail: 'john.doe@example.com',
    userName: 'John Doe',
    status: 'pending',
    submittedAt: Timestamp.now(),
    documents: {
      idFront: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      idBack: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      selfie: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      proofOfAddress: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
    },
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15',
      nationality: 'American',
      address: '123 Main St, New York, NY 10001',
      phone: '+1234567890'
    },
    verificationLevel: 'basic'
  },
  {
    userId: 'user2',
    userEmail: 'jane.smith@example.com',
    userName: 'Jane Smith',
    status: 'approved',
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
    reviewedAt: Timestamp.now(),
    reviewedBy: 'admin@cryptorafts.com',
    documents: {
      idFront: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      idBack: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      selfie: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300',
      proofOfAddress: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
    },
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1985-05-20',
      nationality: 'Canadian',
      address: '456 Oak Ave, Toronto, ON M5V 3A8',
      phone: '+1234567891'
    },
    verificationLevel: 'enhanced'
  }
];

const sampleKYBDocuments = [
  {
    organizationName: 'TechCorp Solutions',
    organizationType: 'Corporation',
    registrationNumber: 'TC123456789',
    taxId: 'TAX987654321',
    address: '789 Business Blvd, San Francisco, CA 94105',
    country: 'USA',
    contactPerson: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    website: 'https://techcorp.com',
    businessDescription: 'Technology solutions provider specializing in blockchain and cryptocurrency services',
    documents: {
      registrationCertificate: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      taxCertificate: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      bankStatement: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      businessLicense: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
    },
    kybStatus: 'pending',
    submittedAt: Timestamp.now().toDate().toISOString(),
    contactPersonTitle: 'CEO',
    industry: 'Technology',
    employees: '50-100',
    revenue: '1M-10M'
  },
  {
    organizationName: 'Investor Group LLC',
    organizationType: 'LLC',
    registrationNumber: 'IG987654321',
    taxId: 'TAX123456789',
    address: '321 Investment St, New York, NY 10001',
    country: 'USA',
    contactPerson: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    website: 'https://investorgroup.com',
    businessDescription: 'Investment firm focused on early-stage technology startups',
    documents: {
      registrationCertificate: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      taxCertificate: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      bankStatement: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
      businessLicense: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300'
    },
    kybStatus: 'approved',
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 86400000)).toDate().toISOString(),
    reviewedAt: Timestamp.now().toDate().toISOString(),
    reviewedBy: 'admin@cryptorafts.com',
    contactPersonTitle: 'Managing Partner',
    industry: 'Finance',
    employees: '10-50',
    revenue: '10M-50M'
  }
];

const samplePitches = [
  {
    title: 'Revolutionary Crypto Wallet',
    company: 'TechCorp Solutions',
    fundingAmount: '$500,000',
    description: 'We are developing a next-generation cryptocurrency wallet with advanced security features including biometric authentication, hardware security modules, and multi-signature support.',
    status: 'pending',
    createdAt: Timestamp.now(),
    founderName: 'John Doe',
    founderEmail: 'john.doe@example.com',
    pitchDeck: 'https://example.com/pitch-deck.pdf',
    businessModel: 'SaaS',
    marketSize: '$50B',
    traction: '10,000+ users',
    teamSize: '15',
    stage: 'Series A'
  },
  {
    title: 'AI-Powered Trading Platform',
    company: 'Investor Group LLC',
    fundingAmount: '$750,000',
    description: 'Our AI-powered trading platform uses machine learning algorithms to provide intelligent investment recommendations and automated trading strategies.',
    status: 'approved',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
    reviewedAt: Timestamp.now(),
    reviewedBy: 'admin@cryptorafts.com',
    founderName: 'Jane Smith',
    founderEmail: 'jane.smith@example.com',
    pitchDeck: 'https://example.com/ai-pitch.pdf',
    businessModel: 'Subscription',
    marketSize: '$100B',
    traction: '50,000+ users',
    teamSize: '25',
    stage: 'Series B'
  }
];

export async function addSampleData() {
  try {
    console.log('🚀 Adding sample data to Firestore...');

    // Add sample users
    console.log('📝 Adding sample users...');
    for (const userData of sampleUsers) {
      await addDoc(collection(db!, 'users'), userData);
    }

    // Add sample projects
    console.log('🚀 Adding sample projects...');
    for (const projectData of sampleProjects) {
      await addDoc(collection(db!, 'projects'), projectData);
    }

    // Add sample spotlights
    console.log('⭐ Adding sample spotlights...');
    for (const spotlightData of sampleSpotlights) {
      await addDoc(collection(db!, 'spotlights'), spotlightData);
    }

    // Add sample KYC documents
    console.log('📄 Adding sample KYC documents...');
    for (const kycData of sampleKYCDocuments) {
      await addDoc(collection(db!, 'kyc_documents'), kycData);
    }

    // Add sample KYB documents
    console.log('🏢 Adding sample KYB documents...');
    for (const kybData of sampleKYBDocuments) {
      await addDoc(collection(db!, 'organizations'), kybData);
    }

    // Add sample pitches
    console.log('🎯 Adding sample pitches...');
    for (const pitchData of samplePitches) {
      await addDoc(collection(db!, 'pitches'), pitchData);
    }

    console.log('✅ Sample data added successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    return false;
  }
}

// Function to add sample data from browser console
if (typeof window !== 'undefined') {
  (window as any).addSampleData = addSampleData;
}
