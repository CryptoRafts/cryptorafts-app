/**
 * Dossier Type Definitions
 * Complete dossier structure for KYC, KYB, Registration, and Pitch
 */

export type DossierType = 'KYC' | 'KYB' | 'Registration' | 'Pitch';
export type DossierStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_info';

/**
 * Base Dossier Interface
 */
export interface BaseDossier {
  id: string;
  type: DossierType;
  status: DossierStatus;
  userId: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  decision?: 'approved' | 'rejected';
  decisionReason?: string;
  comments: DossierComment[];
  documents: DossierDocument[];
  aiAnalysis?: AIAnalysis;
}

/**
 * KYC Dossier - Individual Identity Verification
 */
export interface KYCDossier extends BaseDossier {
  type: 'KYC';
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    countryOfResidence: string;
    phoneNumber?: string;
  };
  identityDocument: {
    type: 'passport' | 'national_id' | 'drivers_license';
    number: string;
    issuingCountry: string;
    expiryDate: string;
    frontImageUrl?: string;
    backImageUrl?: string;
  };
  biometric: {
    selfieUrl?: string;
    livenessCheckPassed?: boolean;
    faceMatchScore?: number;
  };
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    proofDocumentUrl?: string;
  };
  screening: {
    sanctionsCheck?: boolean;
    pepCheck?: boolean;
    adverseMediaCheck?: boolean;
    screeningDate?: string;
  };
}

/**
 * KYB Dossier - Business Verification
 */
export interface KYBDossier extends BaseDossier {
  type: 'KYB';
  businessInfo: {
    legalName: string;
    tradeName?: string;
    registrationNumber: string;
    incorporationDate: string;
    jurisdiction: string;
    businessType: string;
    industry: string;
    website?: string;
    phoneNumber?: string;
  };
  incorporationDocuments: {
    certificateUrl?: string;
    articlesUrl?: string;
    bylawsUrl?: string;
  };
  ultimateBeneficialOwners: {
    name: string;
    ownership: number;
    nationality: string;
    idDocumentUrl?: string;
    pepStatus?: boolean;
  }[];
  compliance: {
    taxIdNumber?: string;
    vatNumber?: string;
    taxDocumentUrl?: string;
    regulatoryLicenses?: string[];
    sanctionsScreening?: boolean;
    pepScreening?: boolean;
  };
  financials: {
    annualRevenue?: number;
    employeeCount?: number;
    fundingRounds?: {
      amount: number;
      date: string;
      investors: string[];
    }[];
  };
}

/**
 * Registration Dossier - User/Org Registration
 */
export interface RegistrationDossier extends BaseDossier {
  type: 'Registration';
  userProfile: {
    email: string;
    displayName?: string;
    company?: string;
    role?: string;
    linkedIn?: string;
    twitter?: string;
  };
  organizationProfile?: {
    name: string;
    type: string;
    size: string;
    website?: string;
    description?: string;
  };
  legalAcceptance: {
    termsOfService: boolean;
    termsAcceptedAt?: string;
    privacyPolicy: boolean;
    privacyAcceptedAt?: string;
    ipAddress?: string;
  };
  verification: {
    emailVerified: boolean;
    phoneVerified?: boolean;
    identityVerified?: boolean;
  };
}

/**
 * Pitch Dossier - Project Pitch
 */
export interface PitchDossier extends BaseDossier {
  type: 'Pitch';
  projectInfo: {
    name: string;
    tagline: string;
    description: string;
    category: string;
    website?: string;
    whitepaper?: string;
  };
  pitchDeck: {
    deckUrl?: string;
    presentationUrl?: string;
    videoUrl?: string;
  };
  tokenomics: {
    tokenName?: string;
    tokenSymbol?: string;
    totalSupply?: number;
    initialPrice?: number;
    allocationUrl?: string;
    vestingScheduleUrl?: string;
  };
  roadmap: {
    milestones: {
      title: string;
      description: string;
      targetDate: string;
      status: 'planned' | 'in_progress' | 'completed';
    }[];
    roadmapUrl?: string;
  };
  team: {
    members: {
      name: string;
      role: string;
      linkedIn?: string;
      bio?: string;
    }[];
  };
  financials: {
    fundingGoal?: number;
    currentFunding?: number;
    useOfFunds?: string;
    projectedRevenue?: number;
  };
}

/**
 * Dossier Comment
 */
export interface DossierComment {
  id: string;
  authorId: string;
  authorEmail: string;
  authorRole: string;
  text: string;
  createdAt: string;
  isInternal: boolean; // Only visible to dept/admin
}

/**
 * Dossier Document
 */
export interface DossierDocument {
  id: string;
  name: string;
  type: string; // 'id_front', 'id_back', 'selfie', 'address_proof', etc.
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  hash?: string; // Document hash for integrity
  verified?: boolean;
}

/**
 * AI Analysis Result
 */
export interface AIAnalysis {
  analysisId: string;
  provider: string; // 'RaftAI', 'OpenAI', etc.
  executedAt: string;
  executedBy: string;
  processingTime: number;
  
  scores: {
    overall: number;
    confidence: number;
    risk: number;
  };
  
  recommendation: 'approve' | 'reject' | 'needs_review' | 'needs_info';
  
  findings: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  
  risks: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  
  missingDocuments: string[];
  nextActions: string[];
  
  notes: {
    owner: string;
    dueDate?: string;
    status: 'open' | 'closed';
    text: string;
  }[];
}

/**
 * Type guard functions
 */
export function isKYCDossier(dossier: BaseDossier): dossier is KYCDossier {
  return dossier.type === 'KYC';
}

export function isKYBDossier(dossier: BaseDossier): dossier is KYBDossier {
  return dossier.type === 'KYB';
}

export function isRegistrationDossier(dossier: BaseDossier): dossier is RegistrationDossier {
  return dossier.type === 'Registration';
}

export function isPitchDossier(dossier: BaseDossier): dossier is PitchDossier {
  return dossier.type === 'Pitch';
}

/**
 * Union type for all dossiers
 */
export type Dossier = KYCDossier | KYBDossier | RegistrationDossier | PitchDossier;

