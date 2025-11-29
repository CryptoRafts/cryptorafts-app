"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface KYCDocument {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  founderLogo?: string | null; // CRITICAL: Founder profile image/logo for admin display
  status: string;
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  rejectionReason?: string;
  decision?: string;
  reasons?: string[];
  confidence?: number;
  verificationId?: string;
  documents: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
    proofOfAddress?: string;
    additionalDocs?: string[];
  };
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    phone: string;
    idType?: string;
    idNumber?: string;
    idNumberLast4?: string;
  };
  verificationLevel: string;
  riskScore?: number;
  notes?: string;
  kyc?: {
    riskScore?: number;
    confidence?: number;
    verificationLevel?: string;
    status?: string;
  };
  // CRITICAL: RaftAI analysis results for admin review
  raftaiAnalysis?: {
    riskScore?: number;
    confidence?: number;
    reasons?: string[];
    checks?: any;
    decision?: string;
  } | null;
  checks?: {
    faceMatch?: { passed: boolean; confidence?: number };
    liveness?: { passed: boolean; confidence?: number };
    idVerification?: { passed: boolean; confidence?: number };
    addressVerification?: { passed: boolean; confidence?: number };
    sanctionsCheck?: { passed: boolean; found?: boolean };
    pepCheck?: { passed: boolean; found?: boolean };
    amlCheck?: { passed: boolean; riskLevel?: string };
  };
}

export default function AdminKYCPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [kycDocs, setKycDocs] = useState<KYCDocument[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<KYCDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [founderProjects, setFounderProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activeKycTab, setActiveKycTab] = useState<'kyc' | 'projects'>('kyc');

  // CRITICAL: Re-normalize selectedDoc documents whenever it changes to ensure no objects slip through
  // Use a ref to prevent infinite loops
  const lastCleanedDocId = useRef<string | null>(null);
  
  useEffect(() => {
    if (selectedDoc && selectedDoc.documents) {
      const docs = selectedDoc.documents;
      let needsUpdate = false;
      const cleanedDocs: any = {};
      
      // Check each document field for objects
      for (const key in docs) {
        const value = docs[key];
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          // Found an object - extract URL or set to null
          console.error(`⚠️ [SELECTED-DOC] CRITICAL: Found object in selectedDoc.documents.${key}!`, value);
          needsUpdate = true;
          
          // Try to extract URL from object
          let extractedUrl: string | null = null;
          if (value.downloadURL && typeof value.downloadURL === 'string' && value.downloadURL.trim().length > 0) {
            extractedUrl = value.downloadURL.trim();
          } else if (value.url && typeof value.url === 'string' && value.url.trim().length > 0) {
            extractedUrl = value.url.trim();
          } else if (value.path && typeof value.path === 'string' && value.path.trim().length > 0) {
            extractedUrl = value.path.trim();
          } else {
            // Try to find any string property that looks like a URL
            for (const objKey of Object.keys(value)) {
              const objValue = value[objKey];
              if (typeof objValue === 'string' && (objValue.startsWith('http') || objValue.startsWith('uploads/') || objValue.startsWith('kyc/') || objValue.startsWith('kyc-documents/'))) {
                extractedUrl = objValue.trim();
                break;
              }
            }
          }
          
          cleanedDocs[key] = extractedUrl || null;
        } else if (Array.isArray(value)) {
          // Clean array items
          const cleanedArray = value.map((item: any) => {
            if (typeof item === 'string' && item.trim().length > 0) {
              return item.trim();
            }
            if (item && typeof item === 'object') {
              // Try to extract URL from object
              if (item.downloadURL && typeof item.downloadURL === 'string' && item.downloadURL.trim().length > 0) {
                return item.downloadURL.trim();
              }
              if (item.url && typeof item.url === 'string' && item.url.trim().length > 0) {
                return item.url.trim();
              }
            }
            return null;
          }).filter((item: any) => item !== null);
          
          if (cleanedArray.length !== value.length || value.some((item: any) => typeof item === 'object')) {
            needsUpdate = true;
          }
          cleanedDocs[key] = cleanedArray;
        } else {
          // String or null - keep as is, but ensure it's trimmed if it's a string
          if (typeof value === 'string' && value.trim().length > 0) {
            cleanedDocs[key] = value.trim();
          } else {
            cleanedDocs[key] = value;
          }
        }
      }
      
      // If we found objects or if this is a new document (different ID), update selectedDoc
      if (needsUpdate || selectedDoc.id !== lastCleanedDocId.current) {
        if (needsUpdate) {
          console.log('🔧 [SELECTED-DOC] Re-normalizing selectedDoc documents to remove objects');
        }
        lastCleanedDocId.current = selectedDoc.id;
        setSelectedDoc({
          ...selectedDoc,
          documents: cleanedDocs
        });
      } else {
        // Mark as cleaned even if no update needed
        lastCleanedDocId.current = selectedDoc.id;
      }
    }
  }, [selectedDoc]);
  
  // Auto-load projects when modal opens with a KYC document
  useEffect(() => {
    if (showDocModal && selectedDoc) {
      const founderUserId = selectedDoc.userId || selectedDoc.id;
      console.log('🔄 [KYC] useEffect triggered - Modal opened, loading projects for:', founderUserId, {
        hasUserId: !!selectedDoc.userId,
        docId: selectedDoc.id,
        userName: selectedDoc.userName
      });
      
      if (founderUserId) {
        setFounderProjects([]);
        setLoadingProjects(true);
        // Use a small delay to ensure modal is fully rendered
        setTimeout(() => {
          loadFounderProjects(founderUserId).catch((error) => {
            console.error('❌ [KYC] Error loading projects in useEffect:', error);
            setLoadingProjects(false);
          });
        }, 100);
      } else {
        console.warn('⚠️ [KYC] Modal opened but no userId found in selectedDoc:', selectedDoc);
        setLoadingProjects(false);
      }
    } else if (!showDocModal) {
      // Reset when modal closes
      setFounderProjects([]);
      setLoadingProjects(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDocModal, selectedDoc?.userId, selectedDoc?.id]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    highRisk: 0
  });

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase.client');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        if (!auth) {
          console.error('❌ Firebase auth not initialized');
          setIsLoading(false);
          return;
        }
        
        onAuthStateChanged(auth, async (authUser) => {
          if (authUser) {
            // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
            const userEmail = authUser.email?.toLowerCase() || '';
            if (userEmail !== 'anasshamsiggc@gmail.com') {
              console.log('❌ Access denied. Only anasshamsiggc@gmail.com can access admin panel.');
              alert('Access Denied: Only authorized admin can access this panel.');
              router.replace('/admin/login');
              setIsLoading(false);
              return;
            }
            
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'admin' || userEmail === 'anasshamsiggc@gmail.com') {
              setUser(authUser);
              // Wait a bit for state to update, then load documents
              setTimeout(async () => {
                await loadKYCDocuments(authUser);
              }, 100);
              // Real-time updates are handled in useEffect hook
            } else {
              router.replace('/admin/login');
            }
          } else {
            router.replace('/admin/login');
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadKYCDocuments = async (authUser?: any) => {
    const currentUser = authUser || user;
    if (!currentUser) {
      console.log('⏳ Waiting for user authentication...');
      return;
    }

    try {
      console.log('⚡ Loading KYC documents (initial load)...');

      // Use dynamic imports to avoid chunk loading errors
      const { getDocs, collection, query, where, orderBy, doc, getDoc } = await import('firebase/firestore');
      
      // First try to get from kyc_documents collection
      let kycDocs: KYCDocument[] = [];
      
      try {
        // Ensure db is properly imported
        const { db: firestoreDb } = await import('@/lib/firebase.client');
        
        if (!firestoreDb) {
          console.error('❌ Firebase database not initialized');
          return;
        }
        
        console.log('📊 Fetching KYC documents from Firebase...');
        
        // Try to get from kyc_documents collection first
        let kycSnapshot;
        try {
          const kycCollection = collection(firestoreDb, 'kyc_documents');
          console.log('📊 Checking kyc_documents collection:', kycCollection.path);
          kycSnapshot = await getDocs(kycCollection);
          console.log('📊 Found', kycSnapshot.size, 'KYC documents in kyc_documents collection');
        } catch (error) {
          console.log('⚠️ Error fetching from kyc_documents:', error);
          kycSnapshot = { size: 0, docs: [], forEach: () => {} };
        }
        
        // Also check users subcollection for founder KYC submissions
        let userKycCount = 0;
        let usersWithKycStatus = 0;
        try {
          const usersCollection = collection(firestoreDb, 'users');
          const usersSnapshot = await getDocs(usersCollection);
          console.log('📊 Checking', usersSnapshot.size, 'users for KYC data...');
          
          for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            // Check if user has kyc_status or kyc data in their document
            // Check multiple possible field names for KYC status
            const hasKycStatus = userData.kyc_status || 
                                userData.kycStatus || 
                                userData.kyc?.status ||
                                userData.onboarding_state?.includes('KYC') ||
                                (userData.kyc && typeof userData.kyc === 'object' && Object.keys(userData.kyc).length > 0);
            
            if (hasKycStatus) {
              usersWithKycStatus++;
              const kycStatusValue = userData.kyc_status || userData.kycStatus || userData.kyc?.status || 'unknown';
              console.log('👤 Found user with KYC status:', userData.email, 'Status:', kycStatusValue, 'Role:', userData.role);
              
              const kycDocRef = doc(firestoreDb, 'kyc_documents', userDoc.id);
              const existingDoc = await getDoc(kycDocRef);
              const existingData = existingDoc.exists() ? existingDoc.data() : null;
              const existingDocuments = existingData?.documents || {};
              
                // Extract document URLs from user document's kyc field (direct access)
                const userKycData = userData.kyc || {};
                const userKycDetails = userKycData.details || {};
                const userKycDocuments = userKycDetails.documents || userKycData.documents || {};
                
                // Also check the raw verification data structure (from KYCVerification component)
                const idDocuments = userKycDetails.id_documents || {};
                const proofOfAddress = userKycDetails.proof_of_address || {};
                const selfieLiveness = userKycDetails.selfie_liveness || {};
                
                // Helper to extract URL from document (handles both string URLs and objects with downloadURL)
                const extractDocUrl = (doc: any): string | null => {
                  if (!doc) return null;
                  if (typeof doc === 'string' && doc.trim().length > 0) return doc.trim();
                  if (typeof doc === 'object' && doc !== null) {
                    if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
                      return doc.downloadURL.trim();
                    }
                    if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
                      return doc.url.trim();
                    }
                    if (doc.path && typeof doc.path === 'string' && doc.path.trim().length > 0) {
                      return doc.path.trim();
                    }
                  }
                  return null;
                };
                
                // Try multiple paths to find document URLs - check all possible locations
                // CRITICAL: Ensure all documents are strings or null, never objects
                const safeExtractDocUrl = (doc: any): string | null => {
                  const url = extractDocUrl(doc);
                  // Ensure we return string or null, never object
                  return (typeof url === 'string' && url.trim().length > 0) ? url.trim() : null;
                };
                
                const extractedDocs = {
                  selfie: safeExtractDocUrl(existingDocuments.selfie) || 
                         safeExtractDocUrl(userKycDocuments.selfie) || 
                         safeExtractDocUrl(userKycDetails.selfieUrl) || 
                         safeExtractDocUrl(userKycData.selfieUrl) || 
                         safeExtractDocUrl(userKycData.selfie) ||
                         // Check raw verification data structure
                         safeExtractDocUrl(selfieLiveness.selfie) ||
                         safeExtractDocUrl(selfieLiveness.selfieImage) ||
                         null,
                  idFront: safeExtractDocUrl(existingDocuments.idFront) || 
                          safeExtractDocUrl(userKycDocuments.idFront) || 
                          safeExtractDocUrl(userKycDetails.idFrontUrl) || 
                          safeExtractDocUrl(userKycData.idFrontUrl) || 
                          safeExtractDocUrl(userKycData.idFront) ||
                          // Check raw verification data structure
                          safeExtractDocUrl(idDocuments.idFront) ||
                          safeExtractDocUrl(idDocuments.front) ||
                          null,
                  idBack: safeExtractDocUrl(existingDocuments.idBack) || 
                         safeExtractDocUrl(userKycDocuments.idBack) || 
                         safeExtractDocUrl(userKycDetails.idBackUrl) || 
                         safeExtractDocUrl(userKycData.idBackUrl) || 
                         safeExtractDocUrl(userKycData.idBack) ||
                         // Check raw verification data structure
                         safeExtractDocUrl(idDocuments.idBack) ||
                         safeExtractDocUrl(idDocuments.back) ||
                         null,
                  proofOfAddress: safeExtractDocUrl(existingDocuments.proofOfAddress) || 
                                safeExtractDocUrl(userKycDocuments.proofOfAddress) || 
                                safeExtractDocUrl(userKycDetails.addressProofUrl) || 
                                safeExtractDocUrl(userKycData.addressProofUrl) || 
                                safeExtractDocUrl(userKycData.proofOfAddress) ||
                                // Check raw verification data structure
                                safeExtractDocUrl(proofOfAddress.proofOfAddress) ||
                                safeExtractDocUrl(proofOfAddress.proof_of_address) ||
                                safeExtractDocUrl(proofOfAddress.address) ||
                                null
                };
              
              console.log('📄 [ADMIN] Extracted documents from user kyc field:', {
                userId: userDoc.id,
                email: userData.email,
                idFront: extractedDocs.idFront ? '✓' : '✗',
                idBack: extractedDocs.idBack ? '✓' : '✗',
                proofOfAddress: extractedDocs.proofOfAddress ? '✓' : '✗',
                selfie: extractedDocs.selfie ? '✓' : '✗'
              });
              
              // Try to get KYC data from subcollection (verification is a document, not a collection)
              try {
                const kycVerificationDoc = doc(firestoreDb, 'users', userDoc.id, 'kyc', 'verification');
                const kycSnapshot = await getDoc(kycVerificationDoc);
                
                if (kycSnapshot.exists()) {
                  const kycData = kycSnapshot.data();
                  console.log('📄 Found KYC data in verification document for:', userData.email);
                  
                  // Helper to extract URL from document (enhanced to handle all formats)
                  const extractDocUrl = (doc: any): string | null => {
                    if (!doc) return null;
                    if (typeof doc === 'string' && doc.trim().length > 0) return doc.trim();
                    if (typeof doc === 'object' && doc !== null) {
                      if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
                        return doc.downloadURL.trim();
                      }
                      if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
                        return doc.url.trim();
                      }
                      if (doc.path && typeof doc.path === 'string' && doc.path.trim().length > 0) {
                        return doc.path.trim();
                      }
                    }
                    return null;
                  };
                  
                  // Merge documents from subcollection with user document kyc field
                  // CRITICAL: Ensure all documents are strings or null, never objects
                  const mergeDocUrl = (doc: any): string | null => {
                    const url = extractDocUrl(doc);
                    // Ensure we return string or null, never object
                    return (typeof url === 'string' && url.trim().length > 0) ? url.trim() : null;
                  };
                  
                  const mergedDocs = {
                    selfie: mergeDocUrl(extractedDocs.selfie) || 
                           mergeDocUrl(kycData.kyc_selfie_url) || 
                           mergeDocUrl(kycData.selfie) || 
                           mergeDocUrl(kycData.documents?.selfie) || null,
                    idFront: mergeDocUrl(extractedDocs.idFront) || 
                            mergeDocUrl(kycData.kyc_id_image_url) || 
                            mergeDocUrl(kycData.idFront) || 
                            mergeDocUrl(kycData.documents?.idFront) || null,
                    idBack: mergeDocUrl(extractedDocs.idBack) || 
                           mergeDocUrl(kycData.idBack) || 
                           mergeDocUrl(kycData.documents?.idBack) || null,
                    proofOfAddress: mergeDocUrl(extractedDocs.proofOfAddress) || 
                                   mergeDocUrl(kycData.proofOfAddress) || 
                                   mergeDocUrl(kycData.addressProofUrl) || 
                                   mergeDocUrl(kycData.documents?.proofOfAddress) || null
                  };
                  
                  // Sync to kyc_documents collection
                  if (!existingDoc.exists()) {
                    const { setDoc, serverTimestamp } = await import('firebase/firestore');
                    await setDoc(kycDocRef, {
                      userId: userDoc.id,
                      userEmail: userData.email || 'N/A',
                      userName: userData.displayName || userData.display_name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                      status: kycData.status === 'PENDING' ? 'pending' : (kycData.status?.toLowerCase() || userData.kyc_status || 'pending'),
                      submittedAt: kycData.submitted_at || serverTimestamp(),
                      reviewedAt: kycData.verified_at || null,
                      rejectionReason: kycData.reasons?.join(', ') || null,
                      personalInfo: {
                        firstName: kycData.kyc_legal_name?.split(' ')[0] || userData.firstName || '',
                        lastName: kycData.kyc_legal_name?.split(' ').slice(1).join(' ') || userData.lastName || '',
                        dateOfBirth: kycData.kyc_date_of_birth || kycData.kyc_dob || '',
                        nationality: kycData.kyc_nationality || kycData.kyc_country || userData.country || '',
                        address: kycData.kyc_address || '',
                        phone: userData.phone || ''
                      },
                      documents: mergedDocs,
                      verificationLevel: 'standard',
                      riskScore: kycData.risk_score || userKycData.riskScore || null,
                      decision: kycData.decision || null,
                      createdAt: kycData.submitted_at || serverTimestamp(),
                      updatedAt: kycData.updated_at || serverTimestamp()
                    });
                    userKycCount++;
                    console.log('✅ Synced KYC from verification document to kyc_documents for user:', userData.email);
                  } else {
                    // Update existing document but preserve documents if they exist
                    const { updateDoc, serverTimestamp } = await import('firebase/firestore');
                    const updateData: any = {
                      status: kycData.status === 'PENDING' ? 'pending' : (kycData.status?.toLowerCase() || userData.kyc_status || existingData?.status || 'pending'),
                      updatedAt: serverTimestamp()
                    };
                    
                    // Merge documents - prefer existing, then subcollection, then user kyc field
                    const finalDocs = {
                      selfie: existingDocuments.selfie || mergedDocs.selfie,
                      idFront: existingDocuments.idFront || mergedDocs.idFront,
                      idBack: existingDocuments.idBack || mergedDocs.idBack,
                      proofOfAddress: existingDocuments.proofOfAddress || mergedDocs.proofOfAddress
                    };
                    
                    // Only update if we have new documents
                    if (finalDocs.selfie || finalDocs.idFront || finalDocs.idBack || finalDocs.proofOfAddress) {
                      updateData.documents = finalDocs;
                    }
                    
                    // Update risk score if available
                    if (kycData.risk_score || userKycData.riskScore) {
                      updateData.riskScore = kycData.risk_score || userKycData.riskScore;
                    }
                    
                    if (Object.keys(updateData).length > 2) { // More than just status and updatedAt
                      await updateDoc(kycDocRef, updateData);
                      console.log('✅ Updated existing KYC document with documents:', userDoc.id);
                    }
                  }
                } else if (userData.kyc_status && !existingDoc.exists()) {
                  // Create from user document data if no subcollection exists
                  console.log('📄 Creating KYC doc from user data for:', userData.email);
                  const { setDoc, serverTimestamp } = await import('firebase/firestore');
                  await setDoc(kycDocRef, {
                    userId: userDoc.id,
                    userEmail: userData.email || 'N/A',
                    userName: userData.displayName || userData.display_name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                    status: userData.kyc_status || 'pending',
                    submittedAt: userData.created_at || serverTimestamp(),
                    reviewedAt: userData.kyc_completed_at || null,
                    personalInfo: {
                      firstName: userData.firstName || userData.display_name?.split(' ')[0] || '',
                      lastName: userData.lastName || userData.display_name?.split(' ').slice(1).join(' ') || '',
                      dateOfBirth: '',
                      nationality: userData.country || '',
                      address: '',
                      phone: userData.phone || ''
                    },
                    documents: extractedDocs, // Use extracted documents from user kyc field
                    verificationLevel: 'basic',
                    riskScore: userKycData.riskScore || null,
                    createdAt: userData.created_at || serverTimestamp(),
                    updatedAt: userData.updated_at || serverTimestamp()
                  });
                  userKycCount++;
                  console.log('✅ Created KYC doc from user data for:', userData.email);
                } else if (existingDoc.exists() && (extractedDocs.selfie || extractedDocs.idFront || extractedDocs.idBack || extractedDocs.proofOfAddress)) {
                  // Update existing document with documents from user kyc field
                  const { updateDoc, serverTimestamp } = await import('firebase/firestore');
                  const updateData: any = {
                    updatedAt: serverTimestamp()
                  };
                  
                  // Merge documents - prefer existing, then extracted
                  const finalDocs = {
                    selfie: existingDocuments.selfie || extractedDocs.selfie,
                    idFront: existingDocuments.idFront || extractedDocs.idFront,
                    idBack: existingDocuments.idBack || extractedDocs.idBack,
                    proofOfAddress: existingDocuments.proofOfAddress || extractedDocs.proofOfAddress
                  };
                  
                  updateData.documents = finalDocs;
                  
                  if (userKycData.riskScore) {
                    updateData.riskScore = userKycData.riskScore;
                  }
                  
                  await updateDoc(kycDocRef, updateData);
                  console.log('✅ Updated existing KYC document with documents from user kyc field:', userDoc.id);
                }
              } catch (error) {
                console.log('⚠️ Error checking subcollection for', userData.email, ':', error);
              }
            }
          }
          console.log('📊 Found', usersWithKycStatus, 'users with KYC status');
          console.log('📊 Synced', userKycCount, 'KYC documents from users');
        } catch (error) {
          console.error('❌ Error checking user subcollections:', error);
        }
        
        // Wait a moment for async writes to complete, then re-fetch
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Re-fetch kyc_documents after syncing
        const kycCollection = collection(firestoreDb, 'kyc_documents');
        kycSnapshot = await getDocs(kycCollection);
        console.log('📊 Total KYC documents after sync:', kycSnapshot.size);
        
        if (kycSnapshot.size > 0) {
          console.log('📊 KYC Document IDs:', kycSnapshot.docs.map(d => d.id));
          console.log('📊 Sample document data:', Object.keys(kycSnapshot.docs[0]?.data() || {}));
          // Log first document details for debugging
          const firstDoc = kycSnapshot.docs[0]?.data();
          if (firstDoc) {
            console.log('📊 First document details:', {
              userId: firstDoc.userId,
              userEmail: firstDoc.userEmail,
              status: firstDoc.status,
              hasDocuments: !!firstDoc.documents,
              documentKeys: firstDoc.documents ? Object.keys(firstDoc.documents) : []
            });
          }
        } else {
          console.log('⚠️ No KYC documents found after sync. Checking Firestore directly...');
          
          // Try to verify Firebase connection
          try {
            const testCollection = collection(firestoreDb, 'users');
            const testSnapshot = await getDocs(testCollection);
            console.log('✅ Firebase connection working - Found', testSnapshot.size, 'users');
            
            // Check if any users have KYC data that should be synced
            let usersWithKyc = 0;
            for (const userDoc of testSnapshot.docs) {
              const userData = userDoc.data();
              if (userData.kyc_status || userData.kycStatus || userData.kyc?.status) {
                usersWithKyc++;
                console.log('👤 User with KYC data:', userData.email, 'Status:', userData.kyc_status || userData.kycStatus || userData.kyc?.status);
              }
            }
            console.log('📊 Found', usersWithKyc, 'users with KYC data that should be in kyc_documents');
          } catch (error) {
            console.error('❌ Firebase connection issue:', error);
          }
        }
        
        // Normalize documents helper (synchronous version for initial mapping)
        const normalizeDocumentSync = (doc: any): string | null => {
          if (!doc) {
            return null;
          }
          if (typeof doc === 'string' && doc.trim().length > 0) {
            const url = doc.trim();
            // If it's already a full HTTPS URL, return it
            if (url.startsWith('https://')) {
              return url;
            }
            // For relative paths, return as-is (we'll convert later if needed)
            return url;
          }
          if (typeof doc === 'object' && doc !== null) {
            if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
              const url = doc.downloadURL.trim();
              if (url.startsWith('https://')) {
                return url;
              }
              return url;
            }
            if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
              const url = doc.url.trim();
              if (url.startsWith('https://')) {
                return url;
              }
              return url;
            }
          }
          return null;
        };
        
        // First, map documents with async normalization
        const docsWithPromises = kycSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Normalize documents - handle both string URLs and objects with downloadURL
          const normalizeDocument = async (doc: any): Promise<string | null> => {
            if (!doc) {
              return null;
            }
            
            let url: string | null = null;
            
            // Extract URL from string or object
            if (typeof doc === 'string' && doc.trim().length > 0) {
              url = doc.trim();
            } else if (typeof doc === 'object' && doc !== null) {
              if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
                url = doc.downloadURL.trim();
              } else if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
                url = doc.url.trim();
              } else {
                return null;
              }
            } else {
              return null;
            }
            
            // If it's already a full HTTPS URL, return it
            if (url && url.startsWith('https://')) {
              return url;
            }
            
            // If it's a relative path, try to convert to Firebase Storage URL
            if (url && (url.startsWith('uploads/') || url.startsWith('kyc/') || (url.includes('/') && !url.startsWith('http')))) {
              try {
                const { ref, getDownloadURL } = await import('firebase/storage');
                const { ensureStorage } = await import('@/lib/firebase-utils');
                const storageInstance = ensureStorage();
                if (storageInstance) {
                  // Clean up the path
                  let storagePath = url.replace(/^\/+/, '');
                  const storageRef = ref(storageInstance, storagePath);
                  const downloadURL = await getDownloadURL(storageRef);
                  if (downloadURL && downloadURL.startsWith('https://')) {
                    console.log('📄 [NORMALIZE] Converted relative path to full URL:', storagePath.substring(0, 50));
                    return downloadURL;
                  }
                }
              } catch (storageError: any) {
                // If conversion fails (404, etc.), return null so we don't show broken images
                if (storageError?.code === 'storage/object-not-found' || storageError?.code === 'storage/unauthorized') {
                  console.log('📄 [NORMALIZE] Path not found in storage:', url.substring(0, 50));
                  return null;
                }
                // For other errors, return the original URL
                return url;
              }
            }
            
            return url;
          };
          
          const rawDocuments = data.documents || {};
          
          // Enhanced normalization that handles all possible formats
          const normalizeDocumentEnhanced = async (doc: any, docType: string = 'unknown'): Promise<string | null> => {
            if (!doc) {
              console.log(`📄 [NORMALIZE-ENHANCED] ${docType} is null/undefined`);
              return null;
            }
            
            let url: string | null = null;
            
            // If it's already a string URL (full or relative)
            if (typeof doc === 'string' && doc.trim().length > 0) {
              url = doc.trim();
              console.log(`📄 [NORMALIZE-ENHANCED] ${docType} is string URL:`, url.substring(0, 50));
            } 
            // If it's an object, extract downloadURL or url
            else if (typeof doc === 'object' && doc !== null) {
              // Check for downloadURL (most common)
              if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
                url = doc.downloadURL.trim();
                console.log(`📄 [NORMALIZE-ENHANCED] ${docType} extracted from downloadURL:`, url.substring(0, 50));
              } 
              // Check for url property
              else if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
                url = doc.url.trim();
                console.log(`📄 [NORMALIZE-ENHANCED] ${docType} extracted from url:`, url.substring(0, 50));
              }
              // Check if it's a Firestore reference or other structure
              else if (doc.path && typeof doc.path === 'string' && doc.path.trim().length > 0) {
                // This might be a storage reference path
                url = doc.path.trim();
                console.log(`📄 [NORMALIZE-ENHANCED] ${docType} extracted from path:`, url.substring(0, 50));
              }
              // Check for nested structures (e.g., { value: { downloadURL: ... } })
              else if (doc.value && typeof doc.value === 'object') {
                const nested = await normalizeDocumentEnhanced(doc.value, `${docType} (nested)`);
                if (nested) {
                  url = nested;
                  console.log(`📄 [NORMALIZE-ENHANCED] ${docType} extracted from nested value:`, url.substring(0, 50));
                }
              }
              // Check for Firebase Storage reference object
              else if (doc._delegate && doc._delegate._location) {
                // This is a Firebase Storage Reference object
                const path = doc._delegate._location.path_;
                if (path && typeof path === 'string') {
                  url = path;
                  console.log(`📄 [NORMALIZE-ENHANCED] ${docType} extracted from Storage Reference path:`, url.substring(0, 50));
                }
              }
              // Check for Firestore Timestamp or other Firebase types
              else if (doc.toDate || doc.seconds) {
                // This is not a document URL, it's a timestamp - skip it
                console.log(`📄 [NORMALIZE-ENHANCED] ${docType} is a timestamp, not a document URL`);
                return null;
              }
              // Try to stringify and parse if it's a complex object
              else if (Object.keys(doc).length > 0) {
                // Last resort: try to find any string property that looks like a URL
                for (const key of Object.keys(doc)) {
                  const value = doc[key];
                  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('uploads/') || value.startsWith('kyc/') || value.startsWith('kyc-documents/'))) {
                    url = value.trim();
                    console.log(`📄 [NORMALIZE-ENHANCED] ${docType} extracted from object property "${key}":`, url.substring(0, 50));
                    break;
                  }
                }
              }
              // If object exists but no URL found, log it for debugging
              if (!url) {
                console.log(`📄 [NORMALIZE-ENHANCED] ${docType} object has no extractable URL:`, {
                  keys: Object.keys(doc),
                  docType: typeof doc,
                  doc: doc
                });
                // Return null to ensure we don't store objects in the state
                return null;
              }
            }
            
            if (!url) {
              return null;
            }
            
            // If it's already a full HTTPS URL, return it
            if (url.startsWith('https://')) {
              console.log(`📄 [NORMALIZE-ENHANCED] ${docType} is already full HTTPS URL`);
              return url;
            }
            
            // If it's a relative path, try to convert to Firebase Storage URL
            // Handle multiple possible path formats: kyc-documents/, uploads/kyc/, kyc/
            if (url.startsWith('uploads/') || url.startsWith('kyc/') || url.startsWith('kyc-documents/') || (url.includes('/') && !url.startsWith('http'))) {
              try {
                const { ref, getDownloadURL } = await import('firebase/storage');
                const { ensureStorage } = await import('@/lib/firebase-utils');
                const storageInstance = ensureStorage();
                if (storageInstance) {
                  // Clean up the path
                  let storagePath = url.replace(/^\/+/, '');
                  
                  // Try the path as-is first
                  try {
                    const storageRef = ref(storageInstance, storagePath);
                    const downloadURL = await getDownloadURL(storageRef);
                    if (downloadURL && downloadURL.startsWith('https://')) {
                      console.log(`📄 [NORMALIZE-ENHANCED] ${docType} converted relative path to full URL:`, storagePath.substring(0, 50));
                      return downloadURL;
                    }
                  } catch (firstError: any) {
                    // If path doesn't exist, try alternative paths
                    // If it's uploads/kyc/, try kyc-documents/ instead
                    if (storagePath.startsWith('uploads/kyc/')) {
                      const altPath = storagePath.replace('uploads/kyc/', 'kyc-documents/');
                      try {
                        const altStorageRef = ref(storageInstance, altPath);
                        const altDownloadURL = await getDownloadURL(altStorageRef);
                        if (altDownloadURL && altDownloadURL.startsWith('https://')) {
                          console.log(`📄 [NORMALIZE-ENHANCED] ${docType} converted uploads/kyc/ to kyc-documents/ path:`, altPath.substring(0, 50));
                          return altDownloadURL;
                        }
                      } catch (altError: any) {
                        // Try kyc/ path
                        const kycPath = storagePath.replace('uploads/kyc/', 'kyc/');
                        try {
                          const kycStorageRef = ref(storageInstance, kycPath);
                          const kycDownloadURL = await getDownloadURL(kycStorageRef);
                          if (kycDownloadURL && kycDownloadURL.startsWith('https://')) {
                            console.log(`📄 [NORMALIZE-ENHANCED] ${docType} converted to kyc/ path:`, kycPath.substring(0, 50));
                            return kycDownloadURL;
                          }
                        } catch (kycError: any) {
                          // All paths failed
                          if (firstError?.code === 'storage/object-not-found' || firstError?.code === 'storage/unauthorized') {
                            console.log(`📄 [NORMALIZE-ENHANCED] ${docType} path not found in storage (tried: ${storagePath}, ${altPath}, ${kycPath}):`, url.substring(0, 50));
                            return null;
                          }
                        }
                      }
                    }
                    // If it's kyc/ without userId, try to extract userId and use kyc-documents/
                    else if (storagePath.startsWith('kyc/') && !storagePath.includes('/kyc/')) {
                      // Extract filename and try kyc-documents/{userId}/filename
                      // This is a fallback - we'd need userId which we don't have here
                      // Just return null for now
                      if (firstError?.code === 'storage/object-not-found' || firstError?.code === 'storage/unauthorized') {
                        console.log(`📄 [NORMALIZE-ENHANCED] ${docType} path not found in storage:`, url.substring(0, 50));
                        return null;
                      }
                    }
                    // For other errors, throw to outer catch
                    throw firstError;
                  }
                }
              } catch (storageError: any) {
                // If conversion fails (404, etc.), return null so we don't show broken images
                if (storageError?.code === 'storage/object-not-found' || storageError?.code === 'storage/unauthorized') {
                  console.log(`📄 [NORMALIZE-ENHANCED] ${docType} path not found in storage:`, url.substring(0, 50));
                  return null;
                }
                // For other errors, return the original URL (might still work)
                console.log(`📄 [NORMALIZE-ENHANCED] ${docType} storage error, returning original URL:`, storageError?.message);
                return url;
              }
            }
            
            // CRITICAL: Final check - ensure we never return an object
            if (url && typeof url !== 'string') {
              console.error(`⚠️ [NORMALIZE-ENHANCED] CRITICAL: ${docType} normalizeDocumentEnhanced is about to return a non-string!`, typeof url, url);
              return null;
            }
            
            return url;
          };
          
          console.log('📄 [MAPPING] Raw documents for', doc.id, ':', {
            rawDocuments: rawDocuments,
            rawDocumentsKeys: Object.keys(rawDocuments),
            idFrontType: typeof rawDocuments.idFront,
            idFrontValue: rawDocuments.idFront,
            idBackType: typeof rawDocuments.idBack,
            idBackValue: rawDocuments.idBack,
            selfieType: typeof rawDocuments.selfie,
            selfieValue: rawDocuments.selfie,
            proofOfAddressType: typeof rawDocuments.proofOfAddress,
            proofOfAddressValue: rawDocuments.proofOfAddress
          });
          
          // Normalize all documents in parallel
          const [idFrontNorm, idBackNorm, selfieNorm, proofOfAddressNorm] = await Promise.all([
            normalizeDocumentEnhanced(rawDocuments.idFront, 'idFront'),
            normalizeDocumentEnhanced(rawDocuments.idBack, 'idBack'),
            normalizeDocumentEnhanced(rawDocuments.selfie, 'selfie'),
            normalizeDocumentEnhanced(rawDocuments.proofOfAddress, 'proofOfAddress')
          ]);
          
          // Ensure we never store objects, only strings or null
          const finalNormalizedDocuments = {
            idFront: (typeof idFrontNorm === 'string' && idFrontNorm.trim().length > 0) ? idFrontNorm.trim() : null,
            idBack: (typeof idBackNorm === 'string' && idBackNorm.trim().length > 0) ? idBackNorm.trim() : null,
            selfie: (typeof selfieNorm === 'string' && selfieNorm.trim().length > 0) ? selfieNorm.trim() : null,
            proofOfAddress: (typeof proofOfAddressNorm === 'string' && proofOfAddressNorm.trim().length > 0) ? proofOfAddressNorm.trim() : null,
            additionalDocs: Array.isArray(rawDocuments.additionalDocs) 
              ? (await Promise.all(rawDocuments.additionalDocs.map(async (d: any, idx: number) => {
                  const normalized = await normalizeDocumentEnhanced(d, `additionalDoc[${idx}]`);
                  return (typeof normalized === 'string' && normalized.trim().length > 0) ? normalized.trim() : null;
                }))).filter((d: any) => d !== null)
              : []
          };
          
          console.log('📄 [MAPPING] KYC doc:', {
            id: doc.id,
            userName: data.userName || data.displayName || 'Unknown',
            status: data.status,
            documents: {
              idFront: finalNormalizedDocuments.idFront ? '✓' : '✗',
              idBack: finalNormalizedDocuments.idBack ? '✓' : '✗',
              selfie: finalNormalizedDocuments.selfie ? '✓' : '✗',
              proofOfAddress: finalNormalizedDocuments.proofOfAddress ? '✓' : '✗'
            },
            normalizedUrls: {
              idFront: finalNormalizedDocuments.idFront ? finalNormalizedDocuments.idFront.substring(0, 50) : 'null',
              idBack: finalNormalizedDocuments.idBack ? finalNormalizedDocuments.idBack.substring(0, 50) : 'null',
              selfie: finalNormalizedDocuments.selfie ? finalNormalizedDocuments.selfie.substring(0, 50) : 'null',
              proofOfAddress: finalNormalizedDocuments.proofOfAddress ? finalNormalizedDocuments.proofOfAddress.substring(0, 50) : 'null'
            }
          });
          
          // Normalize founder logo/profile image
          const normalizeFounderLogoFromKyc = async (logoData: any): Promise<string | null> => {
            if (!logoData) return null;
            if (typeof logoData === 'string' && logoData.startsWith('https://')) return logoData;
            if (typeof logoData === 'string') {
              try {
                const { ensureStorage } = await import('@/lib/firebase-utils');
                const { ref, getDownloadURL } = await import('firebase/storage');
                const storageInstance = ensureStorage();
                if (storageInstance) {
                  const storageRef = ref(storageInstance, logoData);
                  return await getDownloadURL(storageRef);
                }
              } catch (error: any) {
                if (error?.code !== 'storage/object-not-found') {
                  console.log('⚠️ Error normalizing founder logo from KYC:', error);
                }
              }
            }
            if (typeof logoData === 'object' && logoData.downloadURL) {
              return typeof logoData.downloadURL === 'string' ? logoData.downloadURL : null;
            }
            return null;
          };
          
          const founderLogo = await normalizeFounderLogoFromKyc(data.founderLogo || data.profileImageUrl || data.profile_image_url);
          
          const mapped = {
        id: doc.id,
            userId: data.userId || doc.id,
            userEmail: data.userEmail || data.email || 'N/A',
            userName: data.userName || data.displayName || data.display_name || 'Unknown',
            // CRITICAL: Include founder logo for admin display
            founderLogo: founderLogo,
            status: data.status || 'pending',
            submittedAt: (() => {
              const timestamp = data.submittedAt || data.createdAt || data.created_at;
              if (!timestamp) return new Date();
              if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate();
              if (timestamp.seconds && typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000);
              if (timestamp instanceof Date) return timestamp;
              if (typeof timestamp === 'number') return new Date(timestamp);
              return new Date();
            })(),
            reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
            reviewedBy: data.reviewedBy || '',
            rejectionReason: data.rejectionReason || data.rejection_reason || '',
            documents: finalNormalizedDocuments,
            personalInfo: data.personalInfo || { 
              firstName: data.firstName || '', 
              lastName: data.lastName || '', 
              dateOfBirth: data.dateOfBirth || '', 
              nationality: data.nationality || '', 
              address: data.address || '', 
              phone: data.phone || '' 
            },
            verificationLevel: data.verificationLevel || 'basic',
            riskScore: data.riskScore || data.risk_score || data.kyc?.riskScore || data.raftaiAnalysis?.riskScore || 0,
            notes: data.notes || '',
            kyc: data.kyc || null,
            // CRITICAL: Include RaftAI analysis for admin review
            raftaiAnalysis: data.raftaiAnalysis || null,
            checks: data.checks || data.raftaiAnalysis?.checks || null,
            decision: data.decision || null,
            reasons: data.reasons || data.raftaiAnalysis?.reasons || null,
            confidence: data.confidence || data.raftaiAnalysis?.confidence || null,
            verificationId: data.verificationId || null
          } as KYCDocument;
          return mapped;
        });
        
        // Await all async normalization
        kycDocs = await Promise.all(docsWithPromises);
        
        console.log('📊 Total mapped KYC docs:', kycDocs.length);
      } catch (error: any) {
        console.error('❌ Error fetching KYC documents:', error?.code || error?.message);
      }

      // Load REAL KYC data - NO MOCK DATA
      if (kycDocs.length === 0) {
        console.log('📊 No KYC documents found in database - showing empty state');
        console.log('📊 Note: If you just synced data, wait 2-3 seconds for the real-time listener to update');
      } else {
        console.log('✅ Successfully loaded', kycDocs.length, 'KYC documents');
      }

      // Force update with new array references
      const newDocs = [...kycDocs];
      // CRITICAL: Final validation to ensure no objects are in documents
      // This is a recursive cleanup that ensures ALL values are strings or null
      const deepCleanDocuments = (docs: any, docId?: string): any => {
        if (!docs || typeof docs !== 'object') {
          return docs;
        }
        
        const cleaned: any = {};
        for (const key in docs) {
          const value = docs[key];
          
          // If it's null or undefined, keep it as null
          if (value === null || value === undefined) {
            cleaned[key] = null;
          }
          // If it's a string, keep it (but trim it)
          else if (typeof value === 'string') {
            cleaned[key] = value.trim().length > 0 ? value.trim() : null;
          }
          // If it's an array, clean each item
          else if (Array.isArray(value)) {
            cleaned[key] = value.map((item: any) => {
              if (typeof item === 'string' && item.trim().length > 0) {
                return item.trim();
              }
              return null;
            }).filter((item: any) => item !== null);
          }
          // If it's an object, try to extract URL or set to null
          else if (typeof value === 'object') {
            // Try to extract URL from object
            let extractedUrl: string | null = null;
            if (value.downloadURL && typeof value.downloadURL === 'string' && value.downloadURL.trim().length > 0) {
              extractedUrl = value.downloadURL.trim();
            } else if (value.url && typeof value.url === 'string' && value.url.trim().length > 0) {
              extractedUrl = value.url.trim();
            } else if (value.path && typeof value.path === 'string' && value.path.trim().length > 0) {
              extractedUrl = value.path.trim();
            }
            
            if (extractedUrl) {
              cleaned[key] = extractedUrl;
            } else {
              console.error(`⚠️ [STATE] CRITICAL: Object found in documents.${key}${docId ? ` for doc ${docId}` : ''}! Cannot extract URL. Setting to null.`, value);
              cleaned[key] = null;
            }
          }
          // For any other type (number, boolean, etc.), set to null
          else {
            console.warn(`⚠️ [STATE] Unexpected type in documents.${key}${docId ? ` for doc ${docId}` : ''}:`, typeof value, value);
            cleaned[key] = null;
          }
        }
        return cleaned;
      };
      
      const validatedDocs = newDocs.map((d: KYCDocument) => {
        const docs = d.documents || {};
        const validatedDocuments = deepCleanDocuments(docs, d.id);
        
        return {
          ...d,
          documents: validatedDocuments
        };
      });
      
      setKycDocs(validatedDocs);
      setFilteredDocs(validatedDocs);
      
      console.log('✅ Setting state with', validatedDocs.length, 'KYC documents (validated)');
      console.log('📊 First doc preview:', validatedDocs[0] ? { id: validatedDocs[0].id, name: validatedDocs[0].userName } : 'none');

      // Update stats
      const stats = {
        total: validatedDocs.length,
        pending: validatedDocs.filter(d => d.status === 'pending').length,
        approved: validatedDocs.filter(d => d.status === 'approved' || d.status === 'verified').length,
        rejected: validatedDocs.filter(d => d.status === 'rejected').length,
        highRisk: validatedDocs.filter(d => (d.riskScore || 0) > 70).length
      };
      
      console.log('📊 KYC Stats calculated:', stats);
      console.log('📊 Sample document dates:', validatedDocs.slice(0, 3).map(doc => {
        const date = doc.submittedAt instanceof Date ? doc.submittedAt : new Date(doc.submittedAt);
        return {
          id: doc.id,
          userName: doc.userName,
          submittedAt: doc.submittedAt,
          dateType: doc.submittedAt instanceof Date ? 'Date' : typeof doc.submittedAt,
          formattedDate: doc.submittedAt ? date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          }) : 'Unknown'
        };
      }));
      
      setStats(stats);
      
      // CRITICAL: Set the documents in state so they're displayed
      setKycDocs(validatedDocs);
      setFilteredDocs(validatedDocs);
      
      console.log('✅ KYC documents loaded successfully -', validatedDocs.length, 'documents set in state');
      console.log('📊 First 3 document IDs:', validatedDocs.slice(0, 3).map(d => ({ id: d.id, userName: d.userName, status: d.status })));
    } catch (error) {
      console.error('❌ Error loading KYC documents:', error);
    }
  };

  // Setup real-time updates for KYC documents
  const setupRealtimeUpdates = async () => {
    if (!user) return;

    try {
      console.log('🔄 Setting up real-time KYC updates...');
      
      // Dynamic imports to avoid chunk loading errors
      const { db: firestoreDb } = await import('@/lib/firebase.client');
      const { onSnapshot, collection } = await import('firebase/firestore');
      
      if (!firestoreDb) {
        console.error('❌ Firebase database not initialized');
        return undefined;
      }
      
      // Listen for KYC documents collection changes - NEWEST FIRST
      const { query, orderBy, collection: collectionFn } = await import('firebase/firestore');
      const kycCollection = collectionFn(firestoreDb, 'kyc_documents');
      console.log('📊 Setting up real-time listener on:', kycCollection.path);
      
        // Also listen for new KYC submissions in user subcollections
        const usersCollection = collectionFn(firestoreDb, 'users');
        const usersUnsubscribe = onSnapshot(usersCollection, async (usersSnapshot) => {
          console.log('🔄 Users updated, checking for new KYC submissions...');
          const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
          
          for (const userDoc of usersSnapshot.docs) {
            try {
              const userData = userDoc.data();
              
              // Only check users with KYC status - check multiple possible field names
              const hasKycStatus = userData.kyc_status || 
                                  userData.kycStatus || 
                                  userData.kyc?.status ||
                                  userData.onboarding_state?.includes('KYC') ||
                                  (userData.kyc && typeof userData.kyc === 'object' && Object.keys(userData.kyc).length > 0);
              
              if (hasKycStatus) {
                const kycVerificationDoc = doc(firestoreDb, 'users', userDoc.id, 'kyc', 'verification');
                const kycSnapshot = await getDoc(kycVerificationDoc);
                const kycDocRef = doc(firestoreDb, 'kyc_documents', userDoc.id);
                const existingDoc = await getDoc(kycDocRef);
                const existingData = existingDoc.exists() ? existingDoc.data() : null;
                const existingDocuments = existingData?.documents || {};
                
                // Extract document URLs from user document's kyc field (direct access)
                const userKycData = userData.kyc || {};
                const userKycDetails = userKycData.details || {};
                const userKycDocuments = userKycDetails.documents || userKycData.documents || {};
                
                // Also check the raw verification data structure (from KYCVerification component)
                const idDocuments = userKycDetails.id_documents || {};
                const proofOfAddress = userKycDetails.proof_of_address || {};
                const selfieLiveness = userKycDetails.selfie_liveness || {};
                
                // Helper to extract URL from document (handles both string URLs and objects with downloadURL)
                const extractDocUrl = (doc: any): string | null => {
                  if (!doc) return null;
                  if (typeof doc === 'string' && doc.trim().length > 0) return doc.trim();
                  if (typeof doc === 'object' && doc !== null) {
                    if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
                      return doc.downloadURL.trim();
                    }
                    if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
                      return doc.url.trim();
                    }
                    if (doc.path && typeof doc.path === 'string' && doc.path.trim().length > 0) {
                      return doc.path.trim();
                    }
                  }
                  return null;
                };
                
                const extractedDocs = {
                  selfie: extractDocUrl(existingDocuments.selfie) || 
                         extractDocUrl(userKycDocuments.selfie) || 
                         extractDocUrl(userKycDetails.selfieUrl) || 
                         extractDocUrl(userKycData.selfieUrl) || 
                         extractDocUrl(userKycData.selfie) ||
                         // Check raw verification data structure
                         extractDocUrl(selfieLiveness.selfie) ||
                         extractDocUrl(selfieLiveness.selfieImage) ||
                         null,
                  idFront: extractDocUrl(existingDocuments.idFront) || 
                          extractDocUrl(userKycDocuments.idFront) || 
                          extractDocUrl(userKycDetails.idFrontUrl) || 
                          extractDocUrl(userKycData.idFrontUrl) || 
                          extractDocUrl(userKycData.idFront) ||
                          // Check raw verification data structure
                          extractDocUrl(idDocuments.idFront) ||
                          extractDocUrl(idDocuments.front) ||
                          null,
                  idBack: extractDocUrl(existingDocuments.idBack) || 
                         extractDocUrl(userKycDocuments.idBack) || 
                         extractDocUrl(userKycDetails.idBackUrl) || 
                         extractDocUrl(userKycData.idBackUrl) || 
                         extractDocUrl(userKycData.idBack) ||
                         // Check raw verification data structure
                         extractDocUrl(idDocuments.idBack) ||
                         extractDocUrl(idDocuments.back) ||
                         null,
                  proofOfAddress: extractDocUrl(existingDocuments.proofOfAddress) || 
                                extractDocUrl(userKycDocuments.proofOfAddress) || 
                                extractDocUrl(userKycDetails.addressProofUrl) || 
                                extractDocUrl(userKycData.addressProofUrl) || 
                                extractDocUrl(userKycData.proofOfAddress) ||
                                // Check raw verification data structure
                                extractDocUrl(proofOfAddress.proofOfAddress) ||
                                extractDocUrl(proofOfAddress.proof_of_address) ||
                                extractDocUrl(proofOfAddress.address) ||
                                null
                };
                
                if (kycSnapshot.exists()) {
                  const kycData = kycSnapshot.data();
                  
                  // Helper to extract URL from document (enhanced to handle all formats)
                  const extractDocUrl = (doc: any): string | null => {
                    if (!doc) return null;
                    if (typeof doc === 'string' && doc.trim().length > 0) return doc.trim();
                    if (typeof doc === 'object' && doc !== null) {
                      if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
                        return doc.downloadURL.trim();
                      }
                      if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
                        return doc.url.trim();
                      }
                      if (doc.path && typeof doc.path === 'string' && doc.path.trim().length > 0) {
                        return doc.path.trim();
                      }
                    }
                    return null;
                  };
                  
                  // Merge documents from subcollection with user document kyc field
                  // CRITICAL: Ensure all documents are strings or null, never objects
                  const mergeDocUrl = (doc: any): string | null => {
                    const url = extractDocUrl(doc);
                    // Ensure we return string or null, never object
                    return (typeof url === 'string' && url.trim().length > 0) ? url.trim() : null;
                  };
                  
                  const mergedDocs = {
                    selfie: mergeDocUrl(extractedDocs.selfie) || 
                           mergeDocUrl(kycData.kyc_selfie_url) || 
                           mergeDocUrl(kycData.selfie) || 
                           mergeDocUrl(kycData.documents?.selfie) || null,
                    idFront: mergeDocUrl(extractedDocs.idFront) || 
                            mergeDocUrl(kycData.kyc_id_image_url) || 
                            mergeDocUrl(kycData.idFront) || 
                            mergeDocUrl(kycData.documents?.idFront) || null,
                    idBack: mergeDocUrl(extractedDocs.idBack) || 
                           mergeDocUrl(kycData.idBack) || 
                           mergeDocUrl(kycData.documents?.idBack) || null,
                    proofOfAddress: mergeDocUrl(extractedDocs.proofOfAddress) || 
                                   mergeDocUrl(kycData.proofOfAddress) || 
                                   mergeDocUrl(kycData.addressProofUrl) || 
                                   mergeDocUrl(kycData.documents?.proofOfAddress) || null
                  };
                  
                  // Sync if doesn't exist or needs update
                  if (!existingDoc.exists() || !existingDoc.data()?.submittedAt) {
                    await setDoc(kycDocRef, {
                      userId: userDoc.id,
                      userEmail: userData.email || 'N/A',
                      userName: userData.displayName || userData.display_name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                      status: kycData.status === 'PENDING' ? 'pending' : kycData.status?.toLowerCase() || userData.kyc_status || 'pending',
                      submittedAt: kycData.submitted_at || serverTimestamp(),
                      reviewedAt: kycData.verified_at || null,
                      rejectionReason: kycData.reasons?.join(', ') || null,
                      personalInfo: {
                        firstName: kycData.kyc_legal_name?.split(' ')[0] || userData.firstName || '',
                        lastName: kycData.kyc_legal_name?.split(' ').slice(1).join(' ') || userData.lastName || '',
                        dateOfBirth: kycData.kyc_date_of_birth || kycData.kyc_dob || '',
                        nationality: kycData.kyc_nationality || kycData.kyc_country || userData.country || '',
                        address: kycData.kyc_address || '',
                        phone: userData.phone || ''
                      },
                      documents: mergedDocs,
                      verificationLevel: 'standard',
                      riskScore: kycData.risk_score || userKycData.riskScore || null,
                      decision: kycData.decision || null,
                      createdAt: kycData.submitted_at || serverTimestamp(),
                      updatedAt: kycData.updated_at || serverTimestamp()
                    }, { merge: true });
                    console.log('✅ Real-time synced KYC from verification document:', userDoc.id);
                  } else if (mergedDocs.selfie || mergedDocs.idFront || mergedDocs.idBack || mergedDocs.proofOfAddress) {
                    // Update documents if we found new ones
                    const { updateDoc: updateDocFn } = await import('firebase/firestore');
                    await updateDocFn(kycDocRef, {
                      documents: mergedDocs,
                      riskScore: kycData.risk_score || userKycData.riskScore || existingData?.riskScore,
                      updatedAt: serverTimestamp()
                    });
                    console.log('✅ Real-time updated KYC documents:', userDoc.id);
                  }
                } else if (extractedDocs.selfie || extractedDocs.idFront || extractedDocs.idBack || extractedDocs.proofOfAddress) {
                  // Update with documents from user kyc field
                  if (existingDoc.exists()) {
                    const { updateDoc: updateDocFn } = await import('firebase/firestore');
                    await updateDocFn(kycDocRef, {
                      documents: extractedDocs,
                      riskScore: userKycData.riskScore || existingData?.riskScore,
                      updatedAt: serverTimestamp()
                    });
                    console.log('✅ Real-time updated KYC documents from user kyc field:', userDoc.id);
                  } else {
                    await setDoc(kycDocRef, {
                      userId: userDoc.id,
                      userEmail: userData.email || 'N/A',
                      userName: userData.displayName || userData.display_name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                      status: userData.kyc_status || 'pending',
                      submittedAt: userData.created_at || serverTimestamp(),
                      reviewedAt: userData.kyc_completed_at || null,
                      personalInfo: {
                        firstName: userData.firstName || userData.display_name?.split(' ')[0] || '',
                        lastName: userData.lastName || userData.display_name?.split(' ').slice(1).join(' ') || '',
                        dateOfBirth: '',
                        nationality: userData.country || '',
                        address: '',
                        phone: userData.phone || ''
                      },
                      documents: extractedDocs,
                      verificationLevel: 'basic',
                      riskScore: userKycData.riskScore || null,
                      createdAt: userData.created_at || serverTimestamp(),
                      updatedAt: serverTimestamp()
                    }, { merge: true });
                    console.log('✅ Real-time created KYC doc from user kyc field:', userDoc.id);
                  }
                } else if (userData.kyc_status && !existingDoc.exists()) {
                  // Create from user document data
                  await setDoc(kycDocRef, {
                    userId: userDoc.id,
                    userEmail: userData.email || 'N/A',
                    userName: userData.displayName || userData.display_name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
                    status: userData.kyc_status || 'pending',
                    submittedAt: userData.created_at || serverTimestamp(),
                    reviewedAt: userData.kyc_completed_at || null,
                    personalInfo: {
                      firstName: userData.firstName || userData.display_name?.split(' ')[0] || '',
                      lastName: userData.lastName || userData.display_name?.split(' ').slice(1).join(' ') || '',
                      dateOfBirth: '',
                      nationality: userData.country || '',
                      address: '',
                      phone: userData.phone || ''
                    },
                    documents: extractedDocs,
                    verificationLevel: 'basic',
                    riskScore: userKycData.riskScore || null,
                    createdAt: userData.created_at || serverTimestamp(),
                    updatedAt: userData.updated_at || serverTimestamp()
                  }, { merge: true });
                  console.log('✅ Real-time created KYC doc from user data:', userDoc.id);
                }
              }
            } catch (error) {
              // Skip users without KYC
            }
          }
        });
      
      // Use orderBy only if there are documents, otherwise query without orderBy to avoid index errors
      const kycQuery = kycCollection.path; // Store path for logging
      const kycUnsubscribe = onSnapshot(
        query(kycCollection, orderBy('createdAt', 'desc')), 
        (snapshot) => {
          console.log('📊 KYC documents updated in real-time:', snapshot.size, 'documents');
          console.log('📊 Real-time document IDs:', snapshot.docs.map(d => d.id));
          console.log('📊 Real-time document data:', snapshot.docs.map(d => ({ id: d.id, status: d.data().status })));
          
          // Normalize documents helper function (synchronous for real-time updates)
          // Note: For relative paths, we'll return them as-is and let the display logic handle conversion
          const normalizeDocument = (doc: any, docType: string = 'unknown'): string | null => {
            if (!doc) {
              return null;
            }
            
            // If it's already a string URL (full or relative)
            if (typeof doc === 'string' && doc.trim().length > 0) {
              const trimmed = doc.trim();
              console.log(`📄 [REALTIME-NORM] ${docType} is string URL:`, trimmed.substring(0, 50));
              return trimmed;
            }
            
            // If it's an object, extract downloadURL, url, or path
            if (typeof doc === 'object' && doc !== null) {
              // Check for downloadURL (most common)
              if (doc.downloadURL && typeof doc.downloadURL === 'string' && doc.downloadURL.trim().length > 0) {
                const trimmed = doc.downloadURL.trim();
                console.log(`📄 [REALTIME-NORM] ${docType} extracted from downloadURL:`, trimmed.substring(0, 50));
                return trimmed;
              }
              // Check for url property
              if (doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0) {
                const trimmed = doc.url.trim();
                console.log(`📄 [REALTIME-NORM] ${docType} extracted from url:`, trimmed.substring(0, 50));
                return trimmed;
              }
              // Check for path property (storage reference)
              if (doc.path && typeof doc.path === 'string' && doc.path.trim().length > 0) {
                const trimmed = doc.path.trim();
                console.log(`📄 [REALTIME-NORM] ${docType} extracted from path:`, trimmed.substring(0, 50));
                return trimmed;
              }
              // Check for nested structures (e.g., { value: { downloadURL: ... } })
              if (doc.value && typeof doc.value === 'object') {
                const nested = normalizeDocument(doc.value, `${docType} (nested)`);
                if (nested) return nested;
              }
              // Check for Firebase Storage reference object
              if (doc._delegate && doc._delegate._location) {
                // This is a Firebase Storage Reference object
                const path = doc._delegate._location.path_;
                if (path && typeof path === 'string') {
                  const trimmed = path.trim();
                  console.log(`📄 [REALTIME-NORM] ${docType} extracted from Storage Reference path:`, trimmed.substring(0, 50));
                  return trimmed;
                }
              }
              // Check for Firestore Timestamp or other Firebase types
              if (doc.toDate || doc.seconds) {
                // This is not a document URL, it's a timestamp - skip it
                console.log(`📄 [REALTIME-NORM] ${docType} is a timestamp, not a document URL`);
                return null;
              }
              // Try to find any string property that looks like a URL
              if (Object.keys(doc).length > 0) {
                for (const key of Object.keys(doc)) {
                  const value = doc[key];
                  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('uploads/') || value.startsWith('kyc/') || value.startsWith('kyc-documents/'))) {
                    const trimmed = value.trim();
                    console.log(`📄 [REALTIME-NORM] ${docType} extracted from object property "${key}":`, trimmed.substring(0, 50));
                    return trimmed;
                  }
                }
              }
              // If object exists but no URL found, log it for debugging
              console.log(`📄 [REALTIME-NORM] ${docType} object has no extractable URL:`, {
                keys: Object.keys(doc),
                docType: typeof doc,
                doc: doc
              });
              // Return null to ensure we don't store objects in the state
              return null;
            }
            
            // CRITICAL: Final check - ensure we never return an object
            if (typeof doc === 'object' && doc !== null) {
              console.error(`⚠️ [REALTIME-NORM] CRITICAL: normalizeDocument is about to return an object for ${docType}!`, doc);
              return null;
            }
            
            return null;
          };
          
          const kycDocs: KYCDocument[] = snapshot.docs.map(doc => {
            const data = doc.data();
            
            const rawDocuments = data.documents || {};
            console.log('📄 [REALTIME] Raw documents for', doc.id, ':', {
              rawDocuments: rawDocuments,
              rawDocumentsKeys: Object.keys(rawDocuments),
              idFrontType: typeof rawDocuments.idFront,
              idFrontValue: rawDocuments.idFront,
              idBackType: typeof rawDocuments.idBack,
              idBackValue: rawDocuments.idBack,
              selfieType: typeof rawDocuments.selfie,
              selfieValue: rawDocuments.selfie,
              proofOfAddressType: typeof rawDocuments.proofOfAddress,
              proofOfAddressValue: rawDocuments.proofOfAddress
            });
            
            // CRITICAL: Helper to ensure we never store objects, only strings or null
            const ensureStringOrNull = (value: any): string | null => {
              if (value === null || value === undefined) return null;
              if (typeof value === 'string' && value.trim().length > 0) return value.trim();
              // If it's still an object (shouldn't happen, but safeguard), return null
              if (typeof value === 'object') {
                console.error('⚠️ [REALTIME] CRITICAL: Object found after normalization! This should never happen:', value);
                return null;
              }
              return null;
            };
            
            const normalizedDocuments = {
              idFront: ensureStringOrNull(normalizeDocument(rawDocuments.idFront, 'idFront')),
              idBack: ensureStringOrNull(normalizeDocument(rawDocuments.idBack, 'idBack')),
              selfie: ensureStringOrNull(normalizeDocument(rawDocuments.selfie, 'selfie')),
              proofOfAddress: ensureStringOrNull(normalizeDocument(rawDocuments.proofOfAddress, 'proofOfAddress')),
              additionalDocs: Array.isArray(rawDocuments.additionalDocs) 
                ? rawDocuments.additionalDocs.map((d: any, idx: number) => {
                    const normalized = normalizeDocument(d, `additionalDoc[${idx}]`);
                    return ensureStringOrNull(normalized);
                  }).filter((d: any) => d !== null)
                : []
            };
            
            console.log('📄 [REALTIME] Mapped KYC doc:', {
              id: doc.id,
              userName: data.userName || 'Unknown',
              status: data.status,
              documents: {
                idFront: normalizedDocuments.idFront ? '✓' : '✗',
                idBack: normalizedDocuments.idBack ? '✓' : '✗',
                selfie: normalizedDocuments.selfie ? '✓' : '✗',
                proofOfAddress: normalizedDocuments.proofOfAddress ? '✓' : '✗'
              },
              normalizedUrls: {
                idFront: normalizedDocuments.idFront ? normalizedDocuments.idFront.substring(0, 50) : 'null',
                idBack: normalizedDocuments.idBack ? normalizedDocuments.idBack.substring(0, 50) : 'null',
                selfie: normalizedDocuments.selfie ? normalizedDocuments.selfie.substring(0, 50) : 'null',
                proofOfAddress: normalizedDocuments.proofOfAddress ? normalizedDocuments.proofOfAddress.substring(0, 50) : 'null'
              }
            });
            
            return {
              id: doc.id,
              userId: data.userId || '',
              userEmail: data.userEmail || '',
              userName: data.userName || '',
              status: data.status || 'pending',
              submittedAt: (() => {
                const timestamp = data.submittedAt;
                if (!timestamp) return new Date();
                if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate();
                if (timestamp.seconds && typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000);
                if (timestamp instanceof Date) return timestamp;
                if (typeof timestamp === 'number') return new Date(timestamp);
                return new Date();
              })(),
              reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
              reviewedBy: data.reviewedBy || '',
              rejectionReason: data.rejectionReason || '',
              documents: normalizedDocuments,
              personalInfo: data.personalInfo || { 
                firstName: data.firstName || '', 
                lastName: data.lastName || '', 
                dateOfBirth: data.dateOfBirth || '', 
                nationality: data.nationality || '', 
                address: data.address || '', 
                phone: data.phone || '' 
              },
              verificationLevel: data.verificationLevel || 'basic',
              riskScore: data.riskScore || data.risk_score || data.kyc?.riskScore || 0,
              notes: data.notes || '',
              kyc: data.kyc || null,
              checks: data.checks || null,
              decision: data.decision || null,
              reasons: data.reasons || null,
              confidence: data.confidence || null,
              verificationId: data.verificationId || null
            } as KYCDocument;
          });

          // Remove duplicates by userId (keep the most recent one)
          const uniqueDocs = kycDocs.reduce((acc, doc) => {
            if (!doc.userId) {
              // If no userId, just add it (shouldn't happen but handle it)
              acc.push(doc);
              return acc;
            }
            
            const existing = acc.find(d => d.userId === doc.userId);
            if (!existing) {
              acc.push(doc);
            } else {
              // Keep the one with most recent submittedAt
              const existingTime = existing.submittedAt?.getTime() || 0;
              const docTime = doc.submittedAt?.getTime() || 0;
              if (docTime > existingTime) {
                const index = acc.indexOf(existing);
                acc[index] = doc; // Replace with newer one
              }
            }
            return acc;
          }, [] as KYCDocument[]);
          
          // Sort by submittedAt descending (newest first)
          uniqueDocs.sort((a, b) => {
            const aTime = a.submittedAt?.getTime() || 0;
            const bTime = b.submittedAt?.getTime() || 0;
            return bTime - aTime; // Newest first
          });
          
          console.log('✅ Deduplicated and sorted KYC documents:', uniqueDocs.length, 'unique documents');
          console.log('📊 Document statuses:', uniqueDocs.map(d => ({ id: d.id, status: d.status, email: d.userEmail })));
          
          // Force re-render by creating new array references
          const newKycDocs = [...uniqueDocs];
          
          // CRITICAL: Final validation to ensure no objects are in documents (same as initial load)
          // This is a recursive cleanup that ensures ALL values are strings or null
          const deepCleanDocuments = (docs: any, docId?: string): any => {
            if (!docs || typeof docs !== 'object') {
              return docs;
            }
            
            const cleaned: any = {};
            for (const key in docs) {
              const value = docs[key];
              
              // If it's null or undefined, keep it as null
              if (value === null || value === undefined) {
                cleaned[key] = null;
              }
              // If it's a string, keep it (but trim it)
              else if (typeof value === 'string') {
                cleaned[key] = value.trim().length > 0 ? value.trim() : null;
              }
              // If it's an array, clean each item
              else if (Array.isArray(value)) {
                cleaned[key] = value.map((item: any) => {
                  if (typeof item === 'string' && item.trim().length > 0) {
                    return item.trim();
                  }
                  return null;
                }).filter((item: any) => item !== null);
              }
              // If it's an object, try to extract URL or set to null
              else if (typeof value === 'object') {
                // Try to extract URL from object
                let extractedUrl: string | null = null;
                if (value.downloadURL && typeof value.downloadURL === 'string' && value.downloadURL.trim().length > 0) {
                  extractedUrl = value.downloadURL.trim();
                } else if (value.url && typeof value.url === 'string' && value.url.trim().length > 0) {
                  extractedUrl = value.url.trim();
                } else if (value.path && typeof value.path === 'string' && value.path.trim().length > 0) {
                  extractedUrl = value.path.trim();
                }
                
                if (extractedUrl) {
                  cleaned[key] = extractedUrl;
                } else {
                  console.error(`⚠️ [REALTIME-STATE] CRITICAL: Object found in documents.${key}${docId ? ` for doc ${docId}` : ''}! Cannot extract URL. Setting to null.`, value);
                  cleaned[key] = null;
                }
              }
              // For any other type (number, boolean, etc.), set to null
              else {
                console.warn(`⚠️ [REALTIME-STATE] Unexpected type in documents.${key}${docId ? ` for doc ${docId}` : ''}:`, typeof value, value);
                cleaned[key] = null;
              }
            }
            return cleaned;
          };
          
          const validatedDocs = newKycDocs.map((d: KYCDocument) => {
            const docs = d.documents || {};
            const validatedDocuments = deepCleanDocuments(docs, d.id);
            
            return {
              ...d,
              documents: validatedDocuments
            };
          });
          
          const newFilteredDocs = [...validatedDocs];
          
          console.log('✅ Setting KYC state with', validatedDocs.length, 'documents (validated)');
          console.log('📄 Document IDs:', validatedDocs.map(d => d.id));
          
          setKycDocs(validatedDocs);
          setFilteredDocs(newFilteredDocs);
          
          console.log('✅ State updated - triggering re-render (validated)');

          // Update stats using deduplicated docs
          const stats = {
            total: uniqueDocs.length,
            pending: uniqueDocs.filter(d => d.status === 'pending').length,
            approved: uniqueDocs.filter(d => d.status === 'approved' || d.status === 'verified').length,
            rejected: uniqueDocs.filter(d => d.status === 'rejected').length,
            highRisk: uniqueDocs.filter(d => (d.riskScore || 0) > 70).length
          };
          setStats(stats);
          
          console.log('✅ Real-time KYC updates active -', uniqueDocs.length, 'documents');
          console.log('📊 Stats:', stats);
          
          if (uniqueDocs.length === 0) {
            console.log('⚠️ Real-time listener received 0 documents. This might mean:');
            console.log('   1. No KYC documents in kyc_documents collection yet');
            console.log('   2. Sync process is still running in background');
            console.log('   3. Check browser console for sync logs');
          }
        },
        (error) => {
          console.error('❌ Real-time listener error:', error);
          console.error('❌ Error in real-time KYC updates:', error);
        }
      );

      // Store unsubscribe function for cleanup
      return () => {
        kycUnsubscribe();
        usersUnsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
      return undefined;
    }
  };

  // Setup real-time updates with proper cleanup
  useEffect(() => {
    if (!user) {
      console.log('⏳ Waiting for user before setting up real-time updates');
      return;
    }

    console.log('🔄 Setting up real-time KYC updates for user:', user.email);

    let unsubscribe: (() => void) | undefined;

    // Delay real-time setup slightly to let initial load complete first
    const timer = setTimeout(async () => {
      try {
        unsubscribe = await setupRealtimeUpdates();
        if (unsubscribe) {
          console.log('✅ Real-time updates successfully set up');
        } else {
          console.error('❌ Failed to set up real-time updates - unsubscribe is undefined');
        }
      } catch (error) {
        console.error('❌ Error in setupRealtimeUpdates:', error);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        console.log('🧹 Cleaning up real-time listeners');
        unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    console.log('🔍 Filter effect triggered - kycDocs:', kycDocs.length, 'searchTerm:', searchTerm, 'statusFilter:', statusFilter);
    
    // Create a new array to ensure React detects the change
    let filtered = [...kycDocs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.personalInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.personalInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length, 'documents');
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
      console.log('🔍 After status filter:', filtered.length, 'documents');
    }

    console.log('✅ Setting filteredDocs to', filtered.length, 'documents');
    // Force update by creating new array reference
    setFilteredDocs([...filtered]);
  }, [kycDocs, searchTerm, statusFilter]);

  const handleApproveKYC = async (docId: string, notes?: string) => {
    try {
      setIsUpdating(true);
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setIsUpdating(false);
        return;
      }
      
      const firestoreDb = ensureDb();
      if (!firestoreDb) {
        console.error('❌ Firebase database not initialized');
        alert('Database not available. Please refresh and try again.');
        setIsUpdating(false);
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      const docRef = doc(firestoreDb, 'kyc_documents', docId);
      const { getDoc: getDocFn } = await import('firebase/firestore');
      const docData = await getDocFn(docRef);
      const kycData = docData.data();
      
      // The docId in kyc_documents collection IS the userId (as per auth-simple.ts line 486)
      const userId = docId; // Use docId directly since it's the userId
      
      console.log('🔍 [Approve KYC] Document info:', {
        docId,
        userId,
        kycDataUserId: kycData?.userId,
        kycDataStatus: kycData?.status
      });

      // Update kyc_documents collection
      await updateDoc(docRef, {
        status: 'approved',
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
        notes: notes || '',
        updatedAt: serverTimestamp()
      });

      // Also update user document
      if (userId) {
        const userRef = doc(firestoreDb, 'users', userId);
        
        // Get current user data to preserve nested kyc object if it exists
        const userDoc = await getDocFn(userRef);
        const currentUserData = userDoc.exists() ? userDoc.data() : {};
        
        // Prepare update object
        const updateData: any = {
          kycStatus: 'approved',  // camelCase - what founder checks
          kyc_status: 'approved', // snake_case - legacy support
          onboarding_state: 'DONE',
          updated_at: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Also update the nested kyc object - ALWAYS set it
        const currentKyc = currentUserData.kyc && typeof currentUserData.kyc === 'object' 
          ? currentUserData.kyc 
          : {};
        
        updateData.kyc = {
          ...currentKyc,
          status: 'approved',
          updatedAt: Date.now()
        };
        
        await updateDoc(userRef, updateData);
        console.log('✅ Updated user document with approved KYC status:', userId);
        console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
        
        // Verify the update
        const verifyDoc = await getDocFn(userRef);
        if (verifyDoc.exists()) {
          const verifiedData = verifyDoc.data();
          console.log('✅ Verification - Current user KYC status:', {
            kycStatus: verifiedData.kycStatus,
            kyc_status: verifiedData.kyc_status,
            kyc_object_status: verifiedData.kyc?.status
          });
        }

        // Update user subcollection if exists
        try {
          const userKycRef = doc(firestoreDb, 'users', userId, 'kyc', 'verification');
          const userKycDoc = await getDocFn(userKycRef);
          if (userKycDoc.exists()) {
            await updateDoc(userKycRef, {
              status: 'APPROVED',
              decision: 'APPROVED',
              reviewed_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
          }
        } catch (error) {
          console.log('⚠️ Could not update user KYC subcollection:', error);
        }
      }
      
      // Update local state
      setKycDocs(prev => prev.map(d => 
        d.id === docId 
          ? { ...d, status: 'approved', reviewedBy: user.uid, reviewedAt: new Date(), notes: notes || '' }
          : d
      ));
      
      console.log('✅ KYC approved/re-approved successfully');
      alert('KYC approved successfully!');
    } catch (error: any) {
      console.error('❌ Error approving KYC:', error);
      alert(`Error approving KYC: ${error?.message || 'Unknown error'}`);
      throw error; // Re-throw to allow caller to handle
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectKYC = async (docId: string, reason: string) => {
    try {
      setIsUpdating(true);
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setIsUpdating(false);
        return;
      }
      
      const firestoreDb = ensureDb();
      if (!firestoreDb) {
        console.error('❌ Firebase database not initialized');
        alert('Database not available. Please refresh and try again.');
        setIsUpdating(false);
        return;
      }
      
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const docRef = doc(firestoreDb, 'kyc_documents', docId);
      const { serverTimestamp, getDoc: getDocFn } = await import('firebase/firestore');
      const docData = await getDocFn(docRef);
      const kycData = docData.data();
      const userId = kycData?.userId || docId;

      // Update kyc_documents collection
      await updateDoc(docRef, {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Also update user document
      if (userId) {
        const userRef = doc(firestoreDb, 'users', userId);
        await updateDoc(userRef, {
          kycStatus: 'rejected',  // camelCase - what founder checks
          kyc_status: 'rejected', // snake_case - legacy support
          onboarding_state: 'KYC_REJECTED',
          updated_at: serverTimestamp()
        });

        // Update user subcollection if exists
        try {
          const userKycRef = doc(firestoreDb, 'users', userId, 'kyc', 'verification');
          const userKycDoc = await getDocFn(userKycRef);
          if (userKycDoc.exists()) {
            await updateDoc(userKycRef, {
              status: 'REJECTED',
              decision: 'REJECTED',
              rejection_reason: reason,
              reviewed_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
          }
        } catch (error) {
          console.log('⚠️ Could not update user KYC subcollection:', error);
        }
      }
      
      // Update local state
      setKycDocs(prev => prev.map(d => 
        d.id === docId 
          ? { ...d, status: 'rejected', rejectionReason: reason, reviewedBy: user.uid, reviewedAt: new Date() }
          : d
      ));
      
      console.log('✅ KYC rejected successfully');
      alert('KYC rejected successfully!');
    } catch (error: any) {
      console.error('❌ Error rejecting KYC:', error);
      alert(`Error rejecting KYC: ${error?.message || 'Unknown error'}`);
      throw error; // Re-throw to allow caller to handle
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteKYC = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this KYC document?')) return;
    
    try {
      const { db: firestoreDb } = await import('@/lib/firebase.client');
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      if (!firestoreDb) {
        console.error('❌ Firebase database not initialized');
        return;
      }
      
      await deleteDoc(doc(firestoreDb, 'kyc_documents', docId));
      setKycDocs(prev => prev.filter(d => d.id !== docId));
      console.log('✅ KYC document deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting KYC document:', error);
      alert('Error deleting KYC document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'under_review': return 'bg-blue-500';
      default: return 'bg-black/40';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <NeonCyanIcon type="check" size={16} className="text-current" />;
      case 'pending': return <NeonCyanIcon type="clock" size={16} className="text-current" />;
      case 'rejected': return <NeonCyanIcon type="x-circle" size={16} className="text-current" />;
      case 'under_review': return <NeonCyanIcon type="eye" size={16} className="text-current" />;
      default: return <NeonCyanIcon type="clock" size={16} className="text-current" />;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk === 0 || risk === undefined || risk === null) return 'bg-black/40 text-cyan-400/70 border-2 border-cyan-400/20';
    if (risk < 20) return 'bg-green-500/30 text-green-200 border-2 border-green-400';
    if (risk < 40) return 'bg-green-600/20 text-green-300 border border-green-500/50';
    if (risk < 60) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50';
    if (risk < 80) return 'bg-orange-500/20 text-orange-300 border border-orange-500/50';
    return 'bg-red-500/30 text-red-200 border-2 border-red-400';
  };

  // Load founder projects with all data (logo, team, RaftAI, documents, socials)
  const loadFounderProjects = async (userId: string) => {
    if (!userId) {
      console.error('❌ [KYC] loadFounderProjects called with empty userId');
      setLoadingProjects(false);
      return;
    }
    
    try {
      setLoadingProjects(true);
      console.log('🔄 [KYC] Starting to load projects for userId:', userId);
      const { waitForFirebase, ensureDb } = await import('@/lib/firebase-utils');
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ Database not available');
        return;
      }
      
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      
          // Fetch projects for this founder - try multiple field names and handle missing orderBy
          let projectsSnapshot;
          let queryMethod = 'unknown';
          try {
            // First try with orderBy
            console.log('🔍 [KYC] Attempting query 1: founderId with orderBy for userId:', userId);
            const projectsQuery = query(
              collection(dbInstance, 'projects'),
              where('founderId', '==', userId),
              orderBy('createdAt', 'desc')
            );
            projectsSnapshot = await getDocs(projectsQuery);
            queryMethod = 'founderId_with_orderBy';
            console.log('✅ [KYC] Query 1 SUCCESS: Found', projectsSnapshot.size, 'projects with founderId + orderBy');
          } catch (orderByError: any) {
            // If orderBy fails (missing index or field), try without it
            console.log('⚠️ [KYC] Query 1 FAILED:', orderByError?.message, '- Trying query 2 (founderId without orderBy)');
            try {
              // Try without orderBy
              const projectsQuery = query(
                collection(dbInstance, 'projects'),
                where('founderId', '==', userId)
              );
              projectsSnapshot = await getDocs(projectsQuery);
              queryMethod = 'founderId_no_orderBy';
              console.log('✅ [KYC] Query 2 SUCCESS: Found', projectsSnapshot.size, 'projects with founderId (no orderBy)');
            } catch (founderIdError: any) {
              // Try with userId field name
              console.log('⚠️ [KYC] Query 2 FAILED:', founderIdError?.message, '- Trying query 3 (userId field)');
              try {
                const projectsQuery = query(
                  collection(dbInstance, 'projects'),
                  where('userId', '==', userId)
                );
                projectsSnapshot = await getDocs(projectsQuery);
                queryMethod = 'userId';
                console.log('✅ [KYC] Query 3 SUCCESS: Found', projectsSnapshot.size, 'projects with userId field');
              } catch (userIdError: any) {
                // Try with ownerId field name
                console.log('⚠️ [KYC] Query 3 FAILED:', userIdError?.message, '- Trying query 4 (ownerId field)');
                try {
                  const projectsQuery = query(
                    collection(dbInstance, 'projects'),
                    where('ownerId', '==', userId)
                  );
                  projectsSnapshot = await getDocs(projectsQuery);
                  queryMethod = 'ownerId';
                  console.log('✅ [KYC] Query 4 SUCCESS: Found', projectsSnapshot.size, 'projects with ownerId field');
                } catch (ownerIdError: any) {
                  // Last resort: fetch all projects and filter client-side
                  console.log('⚠️ [KYC] Query 4 FAILED:', ownerIdError?.message, '- Trying query 5 (fetch all + client-side filter)');
                  const allProjectsSnapshot = await getDocs(collection(dbInstance, 'projects'));
                  const allProjects = allProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  console.log('📊 [KYC] Fetched', allProjects.length, 'total projects from database');
                  
                  // Filter by founderId, userId, ownerId, or founder.id
                  const filteredProjects = allProjects.filter((p: any) => {
                    const matches = p.founderId === userId || 
                                   p.userId === userId || 
                                   p.ownerId === userId ||
                                   (p.founder && (p.founder.id === userId || p.founder.userId === userId));
                    
                    if (matches) {
                      console.log('✅ [KYC] Found matching project:', {
                        projectId: p.id,
                        projectName: p.name || p.title || 'Untitled',
                        founderId: p.founderId,
                        userId: p.userId,
                        ownerId: p.ownerId,
                        founder: p.founder
                      });
                    }
                    return matches;
                  });
                  
                  queryMethod = 'client_side_filter';
                  console.log('✅ [KYC] Query 5 SUCCESS: Filtered', filteredProjects.length, 'projects from', allProjects.length, 'total projects');
                  
                  // Create a mock snapshot-like object
                  projectsSnapshot = {
                    docs: filteredProjects.map((p: any) => ({
                      id: p.id,
                      data: () => {
                        // Remove the id from data since it's already in the doc id
                        const { id, ...data } = p;
                        return data;
                      }
                    })),
                    size: filteredProjects.length
                  } as any;
                }
              }
            }
          }
          
          console.log('📊 [KYC] Final query result:', {
            method: queryMethod,
            projectCount: projectsSnapshot.size,
            userId: userId
          });
      const projects: any[] = [];
      
      for (const projectDoc of projectsSnapshot.docs) {
        const projectData = projectDoc.data();
        
        // Normalize project data similar to VC role
        const normalizedProject = {
          id: projectDoc.id,
          ...projectData,
          // Normalize founder logo
          founderLogo: await normalizeFounderLogo(projectData, userId),
          // Normalize RaftAI data
          raftai: normalizeRaftAIData(projectData),
          // Normalize documents
          documents: normalizeDocuments(projectData),
          // Normalize team data
          team: normalizeTeamData(projectData),
          // Normalize socials
          socials: normalizeSocials(projectData)
        };
        
        projects.push(normalizedProject);
      }
      
      setFounderProjects(projects);
      console.log('✅ [KYC] Successfully loaded', projects.length, 'projects for founder:', userId);
      if (projects.length === 0) {
        console.log('⚠️ [KYC] No projects found for userId:', userId, '- This founder may not have submitted any projects yet');
      }
    } catch (error: any) {
      console.error('❌ [KYC] Error loading founder projects:', error);
      console.error('❌ [KYC] Error details:', {
        message: error?.message,
        code: error?.code,
        userId: userId
      });
      setFounderProjects([]);
    } finally {
      setLoadingProjects(false);
      console.log('✅ [KYC] Finished loading projects, loading state set to false');
    }
  };

  // Helper functions to normalize data (similar to VC role)
  const normalizeFounderLogo = async (projectData: any, userId: string): Promise<string | null> => {
    try {
      const { ensureStorage } = await import('@/lib/firebase-utils');
      const { ref, getDownloadURL } = await import('firebase/storage');
      
      // Check multiple possible locations for founder logo
      const logoPath = projectData.founderLogo || 
                      projectData.founder_logo || 
                      projectData.logo ||
                      `uploads/profiles/${userId}/avatar.png` ||
                      `profiles/${userId}/avatar.png`;
      
      if (!logoPath) return null;
      
      // If already a full URL, return it
      if (typeof logoPath === 'string' && logoPath.startsWith('https://')) {
        return logoPath;
      }
      
      // Try to get download URL from Firebase Storage
      const storageInstance = ensureStorage();
      if (storageInstance) {
        const storagePath = typeof logoPath === 'string' ? logoPath : logoPath.path || '';
        if (storagePath) {
          const storageRef = ref(storageInstance, storagePath);
          const downloadURL = await getDownloadURL(storageRef);
          return downloadURL;
        }
      }
    } catch (error: any) {
      // Silently handle 404s
      if (error?.code !== 'storage/object-not-found') {
        console.log('⚠️ Error normalizing founder logo:', error);
      }
    }
    return null;
  };

  const normalizeRaftAIData = (projectData: any): any => {
    // Check multiple possible locations for RaftAI data
    const raftai = projectData.raftai || 
                   projectData.raftAI || 
                   projectData.raft_ai ||
                   projectData.analysis ||
                   projectData.aiAnalysis;
    
    if (!raftai) return null;
    
    // If it's a string, try to parse it
    if (typeof raftai === 'string') {
      try {
        return JSON.parse(raftai);
      } catch {
        return { summary: raftai };
      }
    }
    
    return raftai;
  };

  const normalizeDocuments = (projectData: any): any[] => {
    const docs: any[] = [];
    
    // Check multiple possible locations
    const documents = projectData.documents || 
                     projectData.docs || 
                     projectData.files ||
                     {};
    
    if (typeof documents === 'object' && !Array.isArray(documents)) {
      Object.entries(documents).forEach(([key, value]: [string, any]) => {
        if (value) {
          const url = typeof value === 'string' ? value : (value.downloadURL || value.url || value.path);
          if (url && typeof url === 'string' && url.trim().length > 0) {
            docs.push({ name: key, url: url.trim() });
          }
        }
      });
    } else if (Array.isArray(documents)) {
      documents.forEach((doc: any) => {
        const url = typeof doc === 'string' ? doc : (doc.downloadURL || doc.url || doc.path);
        if (url && typeof url === 'string' && url.trim().length > 0) {
          docs.push({ name: doc.name || 'Document', url: url.trim() });
        }
      });
    }
    
    return docs;
  };

  const normalizeTeamData = (projectData: any): any[] => {
    const team: any[] = [];
    
    // Check multiple possible locations
    const teamData = projectData.team || 
                    projectData.teamMembers || 
                    projectData.members ||
                    projectData.founders ||
                    [];
    
    if (Array.isArray(teamData)) {
      teamData.forEach((member: any) => {
        if (member && typeof member === 'object') {
          team.push({
            name: member.name || member.fullName || 'Unknown',
            role: member.role || member.position || 'Team Member',
            bio: member.bio || member.description || '',
            linkedin: member.linkedin || member.linkedIn || '',
            twitter: member.twitter || '',
            avatar: member.avatar || member.image || ''
          });
        }
      });
    } else if (teamData && typeof teamData === 'object') {
      Object.entries(teamData).forEach(([key, member]: [string, any]) => {
        if (member && typeof member === 'object') {
          team.push({
            name: member.name || member.fullName || key,
            role: member.role || member.position || 'Team Member',
            bio: member.bio || member.description || '',
            linkedin: member.linkedin || member.linkedIn || '',
            twitter: member.twitter || '',
            avatar: member.avatar || member.image || ''
          });
        }
      });
    }
    
    return team;
  };

  const normalizeSocials = (projectData: any): any => {
    return {
      website: projectData.website || projectData.url || '',
      twitter: projectData.twitter || projectData.socialMedia?.twitter || '',
      linkedin: projectData.linkedin || projectData.socialMedia?.linkedin || '',
      telegram: projectData.telegram || projectData.socialMedia?.telegram || '',
      discord: projectData.discord || projectData.socialMedia?.discord || '',
      github: projectData.github || projectData.socialMedia?.github || ''
    };
  };


  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Back Button */}
            <div>
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-black/60 border-2 border-cyan-400/20 hover:border-cyan-400/50 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg shadow-cyan-500/10 group"
          >
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <NeonCyanIcon type="shield" size={32} className="text-blue-400" />
                KYC Management
              </h1>
        </div>
              <p className="text-white/60">Review and verify user identity documents</p>
        </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards - Fully Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-shadow shadow-cyan-500/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <NeonCyanIcon type="chart" size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white text-xl sm:text-2xl font-bold truncate">{stats.total}</div>
                <div className="text-white/70 text-xs sm:text-sm truncate">Total KYC</div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-shadow shadow-cyan-500/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <NeonCyanIcon type="clock" size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white text-xl sm:text-2xl font-bold truncate">{stats.pending}</div>
                <div className="text-white/70 text-xs sm:text-sm truncate">Pending Review</div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-shadow shadow-cyan-500/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <NeonCyanIcon type="check" size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white text-xl sm:text-2xl font-bold truncate">{stats.approved}</div>
                <div className="text-white/70 text-xs sm:text-sm truncate">Approved</div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-shadow shadow-cyan-500/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <NeonCyanIcon type="x-circle" size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white text-xl sm:text-2xl font-bold truncate">{stats.rejected}</div>
                <div className="text-white/70 text-xs sm:text-sm truncate">Rejected</div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-shadow shadow-cyan-500/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <NeonCyanIcon type="exclamation" size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white text-xl sm:text-2xl font-bold truncate">{stats.highRisk}</div>
                <div className="text-white/70 text-xs sm:text-sm truncate">High Risk</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Fully Responsive */}
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-cyan-500/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <NeonCyanIcon type="search" size={20} className="absolute left-3 top-3 text-white/40" />
              <input
                type="text"
                placeholder="Search KYC documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <NeonCyanIcon type="close" size={16} className="text-current" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* KYC Documents Table - Fully Responsive */}
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl overflow-hidden shadow-cyan-500/10">
          {/* Debug Header */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-2 bg-yellow-900/20 text-yellow-300 text-xs">
              Showing {filteredDocs.length} of {kycDocs.length} KYC documents | 
              Search: "{searchTerm}" | Filter: {statusFilter}
            </div>
          )}
          <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
            <table className="w-full min-w-[640px] admin-kyc-table" style={{ display: 'table', tableLayout: 'auto', borderCollapse: 'collapse', width: '100%', backgroundColor: 'transparent' }}>
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-white/80 font-semibold text-xs sm:text-sm">User</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-white/80 font-semibold text-xs sm:text-sm">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-white/80 font-semibold text-xs sm:text-sm hidden md:table-cell">Submitted</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-white/80 font-semibold text-xs sm:text-sm">Actions</th>
                </tr>
              </thead>
              <tbody style={{ display: 'table-row-group', visibility: 'visible' }}>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center border border-cyan-400/20">
                          <NeonCyanIcon type="shield" size={32} className="text-cyan-400/70" />
                        </div>
                        <div>
                          <p className="text-white text-lg font-semibold mb-2">No KYC Documents Found</p>
                          <p className="text-cyan-400/70 text-sm">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search or filter criteria.' 
                              : 'KYC documents will appear here once users submit their verification documents.'}
                          </p>
                          <p className="text-cyan-400/50 text-xs mt-2">
                            Debug: filteredDocs={filteredDocs.length}, kycDocs={kycDocs.length}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    console.log('🖥️ Rendering KYC doc in table:', doc.id, doc.userName, doc.status);
                    return (
                  <tr 
                    key={`kyc-row-${doc.id}`}
                    className="border-t border-cyan-400/20 hover:bg-black/40 transition-colors bg-black/60"
                    style={{ 
                      display: 'table-row !important', 
                      visibility: 'visible !important',
                      opacity: '1 !important',
                      height: 'auto !important',
                      minHeight: '60px',
                      backgroundColor: 'rgb(31, 41, 55) !important',
                      position: 'relative',
                      zIndex: 1
                    } as any}
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {doc.founderLogo ? (
                          <img 
                            src={doc.founderLogo} 
                            alt={doc.userName || 'Founder'} 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-cyan-400/30 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0 ${doc.founderLogo ? 'hidden' : ''}`}>
                          {doc.personalInfo?.firstName?.charAt(0) || doc.userName?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium text-sm sm:text-base truncate">{doc.userName || 'No Name'}</div>
                          <div className="text-white/60 text-xs sm:text-sm truncate">{doc.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1 w-fit ${getStatusColor(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        <span className="hidden sm:inline">{doc.status.toUpperCase()}</span>
                        <span className="sm:hidden">{doc.status.charAt(0).toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-white/60 text-xs sm:text-sm hidden md:table-cell">
                      {(() => {
                        if (!doc.submittedAt) return 'Unknown';
                        const date = doc.submittedAt instanceof Date ? doc.submittedAt : new Date(doc.submittedAt);
                        return date.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        });
                      })()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={async () => {
                            console.log('📄 [VIEW] Opening modal for doc:', {
                              id: doc.id,
                              userName: doc.userName,
                              documents: doc.documents,
                              documentKeys: doc.documents ? Object.keys(doc.documents) : [],
                              idFront: doc.documents?.idFront,
                              idBack: doc.documents?.idBack,
                              selfie: doc.documents?.selfie,
                              proofOfAddress: doc.documents?.proofOfAddress
                            });
                            // Fetch documents from user's kyc field as fallback
                            let userKycDocuments: any = {};
                            try {
                              const { db: firestoreDb } = await import('@/lib/firebase.client');
                              const { doc: docFn, getDoc: getDocFn } = await import('firebase/firestore');
                              if (firestoreDb && (doc.userId || doc.id)) {
                                const userDocRef = docFn(firestoreDb, 'users', doc.userId || doc.id);
                                const userDocSnap = await getDocFn(userDocRef);
                                if (userDocSnap.exists()) {
                                  const userData = userDocSnap.data();
                                  const userKycData = userData.kyc || {};
                                  const userKycDetails = userKycData.details || {};
                                  const idDocuments = userKycDetails.id_documents || {};
                                  const proofOfAddress = userKycDetails.proof_of_address || {};
                                  const selfieLiveness = userKycDetails.selfie_liveness || {};
                                  
                                  // Helper to extract URL
                                  const extractUrl = (d: any): string | null => {
                                    if (!d) return null;
                                    if (typeof d === 'string' && d.trim().length > 0) return d.trim();
                                    if (typeof d === 'object' && d !== null) {
                                      if (d.downloadURL && typeof d.downloadURL === 'string') return d.downloadURL.trim();
                                      if (d.url && typeof d.url === 'string') return d.url.trim();
                                      if (d.path && typeof d.path === 'string') return d.path.trim();
                                    }
                                    return null;
                                  };
                                  
                                  userKycDocuments = {
                                    idFront: extractUrl(userKycDetails.documents?.idFront) || 
                                            extractUrl(userKycData.documents?.idFront) ||
                                            extractUrl(userKycData.idFrontUrl) ||
                                            extractUrl(userKycDetails.idFrontUrl) ||
                                            extractUrl(idDocuments.idFront) ||
                                            extractUrl(idDocuments.front) ||
                                            null,
                                    idBack: extractUrl(userKycDetails.documents?.idBack) || 
                                           extractUrl(userKycData.documents?.idBack) ||
                                           extractUrl(userKycData.idBackUrl) ||
                                           extractUrl(userKycDetails.idBackUrl) ||
                                           extractUrl(idDocuments.idBack) ||
                                           extractUrl(idDocuments.back) ||
                                           null,
                                    selfie: extractUrl(userKycDetails.documents?.selfie) || 
                                           extractUrl(userKycData.documents?.selfie) ||
                                           extractUrl(userKycData.selfieUrl) ||
                                           extractUrl(userKycDetails.selfieUrl) ||
                                           extractUrl(selfieLiveness.selfie) ||
                                           extractUrl(selfieLiveness.selfieImage) ||
                                           null,
                                    proofOfAddress: extractUrl(userKycDetails.documents?.proofOfAddress) || 
                                                  extractUrl(userKycData.documents?.proofOfAddress) ||
                                                  extractUrl(userKycData.addressProofUrl) ||
                                                  extractUrl(userKycDetails.addressProofUrl) ||
                                                  extractUrl(proofOfAddress.proofOfAddress) ||
                                                  extractUrl(proofOfAddress.proof_of_address) ||
                                                  extractUrl(proofOfAddress.address) ||
                                                  null
                                  };
                                  
                                  console.log('📄 [MODAL] Fetched documents from user kyc field:', {
                                    userId: doc.userId || doc.id,
                                    documents: {
                                      idFront: userKycDocuments.idFront ? '✓' : '✗',
                                      idBack: userKycDocuments.idBack ? '✓' : '✗',
                                      selfie: userKycDocuments.selfie ? '✓' : '✗',
                                      proofOfAddress: userKycDocuments.proofOfAddress ? '✓' : '✗'
                                    }
                                  });
                                }
                              }
                            } catch (error) {
                              console.error('⚠️ Error fetching user kyc documents:', error);
                            }
                            
                            // Helper to normalize and convert relative paths to full URLs
                            // CRITICAL: This function MUST return only strings or null, NEVER objects
                            const normalizeAndConvertUrl = async (d: any): Promise<string | null> => {
                              // CRITICAL: First check - if it's not a string or null/undefined, try to extract or return null
                              if (!d) {
                                console.log('📄 [NORMALIZE-MODAL] Document is null/undefined');
                                return null;
                              }
                              
                              // CRITICAL: If it's an object (shouldn't happen after getDocumentValue, but safeguard), try to extract URL
                              if (typeof d === 'object' && d !== null && !Array.isArray(d)) {
                                console.error('⚠️ [NORMALIZE-MODAL] CRITICAL: Received object in normalizeAndConvertUrl! This should never happen after getDocumentValue. Trying to extract URL:', d);
                                // Try to extract URL from object - check multiple possible properties
                                if (d.downloadURL && typeof d.downloadURL === 'string' && d.downloadURL.trim().length > 0) {
                                  d = d.downloadURL.trim();
                                } else if (d.url && typeof d.url === 'string' && d.url.trim().length > 0) {
                                  d = d.url.trim();
                                } else if (d.path && typeof d.path === 'string' && d.path.trim().length > 0) {
                                  d = d.path.trim();
                                } else if (d.value && typeof d.value === 'object') {
                                  // Nested structure - recursively extract
                                  const nested = await normalizeAndConvertUrl(d.value);
                                  if (nested) {
                                    d = nested;
                                  } else {
                                    console.error('⚠️ [NORMALIZE-MODAL] CRITICAL: Nested object has no extractable URL, returning null:', d);
                                    return null;
                                  }
                                } else if (d._delegate && d._delegate._location) {
                                  // Firebase Storage reference
                                  const path = d._delegate._location.path_;
                                  if (path && typeof path === 'string' && path.trim().length > 0) {
                                    d = path.trim();
                                  } else {
                                    console.error('⚠️ [NORMALIZE-MODAL] CRITICAL: Storage reference has no path, returning null:', d);
                                    return null;
                                  }
                                } else {
                                  // Try to find any string property that looks like a URL
                                  let foundUrl = false;
                                  for (const key of Object.keys(d)) {
                                    const value = d[key];
                                    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('uploads/') || value.startsWith('kyc/') || value.startsWith('kyc-documents/'))) {
                                      d = value.trim();
                                      foundUrl = true;
                                      break;
                                    }
                                  }
                                  if (!foundUrl) {
                                    // Can't extract, return null
                                    console.error('⚠️ [NORMALIZE-MODAL] CRITICAL: Object has no extractable URL, returning null:', d);
                                    return null;
                                  }
                                }
                              }
                              
                              // CRITICAL: After extraction attempt, ensure d is now a string or null
                              if (typeof d !== 'string') {
                                console.error('⚠️ [NORMALIZE-MODAL] CRITICAL: After extraction, d is still not a string!', typeof d, d);
                                return null;
                              }
                              
                              let url: string | null = null;
                              
                              // At this point, d should be a string (we've already handled objects above)
                              // If it's already a string URL (full or relative)
                              if (d.trim().length > 0) {
                                url = d.trim();
                                console.log('📄 [NORMALIZE-MODAL] Document is string URL:', url.substring(0, 50));
                              } else {
                                // Empty string, return null
                                console.log('📄 [NORMALIZE-MODAL] Empty string, returning null');
                                return null;
                              }
                              
                              // If we still don't have a URL, return null
                              if (!url || url.trim().length === 0) {
                                console.log('📄 [NORMALIZE-MODAL] No valid URL found, returning null');
                                return null;
                              }
                              
                              // If already a full HTTPS URL, return it
                              if (url.startsWith('https://')) {
                                console.log('📄 [NORMALIZE-MODAL] Already full HTTPS URL');
                                return url;
                              }
                              
                              // If it's a relative path, try to convert to full URL
                              if (url.startsWith('uploads/') || url.startsWith('kyc/') || url.startsWith('kyc-documents/') || (url.includes('/') && !url.startsWith('http'))) {
                                try {
                                  const { ref, getDownloadURL } = await import('firebase/storage');
                                  const { ensureStorage } = await import('@/lib/firebase-utils');
                                  const storageInstance = ensureStorage();
                                  if (storageInstance) {
                                    const storagePath = url.replace(/^\/+/, '');
                                    
                                    // Try the path as-is first
                                    try {
                                      const storageRef = ref(storageInstance, storagePath);
                                      const downloadURL = await getDownloadURL(storageRef);
                                      if (downloadURL && downloadURL.startsWith('https://')) {
                                        console.log('📄 [NORMALIZE-MODAL] Converted relative path to full URL:', storagePath.substring(0, 50));
                                        return downloadURL;
                                      }
                                    } catch (firstError: any) {
                                      // If uploads/kyc/ fails, try kyc-documents/
                                      if (storagePath.startsWith('uploads/kyc/')) {
                                        const altPath = storagePath.replace('uploads/kyc/', 'kyc-documents/');
                                        try {
                                          const altStorageRef = ref(storageInstance, altPath);
                                          const altDownloadURL = await getDownloadURL(altStorageRef);
                                          if (altDownloadURL && altDownloadURL.startsWith('https://')) {
                                            console.log('📄 [NORMALIZE-MODAL] Converted uploads/kyc/ to kyc-documents/ path:', altPath.substring(0, 50));
                                            return altDownloadURL;
                                          }
                                        } catch (altError: any) {
                                          // Try kyc/ path
                                          const kycPath = storagePath.replace('uploads/kyc/', 'kyc/');
                                          try {
                                            const kycStorageRef = ref(storageInstance, kycPath);
                                            const kycDownloadURL = await getDownloadURL(kycStorageRef);
                                            if (kycDownloadURL && kycDownloadURL.startsWith('https://')) {
                                              console.log('📄 [NORMALIZE-MODAL] Converted to kyc/ path:', kycPath.substring(0, 50));
                                              return kycDownloadURL;
                                            }
                                          } catch (kycError: any) {
                                            // All paths failed, return original URL (might still work)
                                            console.log('📄 [NORMALIZE-MODAL] All path conversions failed, returning original URL');
                                            return url;
                                          }
                                        }
                                      }
                                      // Return original URL if conversion fails (might still work)
                                      console.log('📄 [NORMALIZE-MODAL] Path conversion failed, returning original URL');
                                      return url;
                                    }
                                  }
                                } catch (storageError: any) {
                                  // Return original URL if conversion fails (might still work)
                                  console.log('📄 [NORMALIZE-MODAL] Storage error, returning original URL:', storageError?.message);
                                  return url;
                                }
                              }
                              
                              // CRITICAL: Final check - ensure we never return an object
                              if (typeof url !== 'string') {
                                console.error('⚠️ [NORMALIZE-MODAL] CRITICAL: normalizeAndConvertUrl is about to return a non-string!', typeof url, url);
                                return null;
                              }
                              
                              // Return the URL (should be a string at this point)
                              console.log('📄 [NORMALIZE-MODAL] Returning URL:', url.substring(0, 50));
                              return url;
                            };
                            
                            // CRITICAL: Only use doc.documents if it's a string, otherwise use userKycDocuments
                            // This prevents passing objects to normalizeAndConvertUrl
                            // MUST ALWAYS return string or null, NEVER an object
                            const getDocumentValue = (docValue: any, userValue: any, docType: string): string | null => {
                              // If docValue is a string, use it
                              if (typeof docValue === 'string' && docValue.trim().length > 0) {
                                return docValue.trim();
                              }
                              // If docValue is an object, try to extract URL from it first
                              if (docValue && typeof docValue === 'object' && !Array.isArray(docValue)) {
                                console.warn(`⚠️ [MODAL] ${docType} is an object in doc.documents, trying to extract URL:`, docValue);
                                // Try to extract URL from object
                                if (docValue.downloadURL && typeof docValue.downloadURL === 'string' && docValue.downloadURL.trim().length > 0) {
                                  return docValue.downloadURL.trim();
                                }
                                if (docValue.url && typeof docValue.url === 'string' && docValue.url.trim().length > 0) {
                                  return docValue.url.trim();
                                }
                                if (docValue.path && typeof docValue.path === 'string' && docValue.path.trim().length > 0) {
                                  return docValue.path.trim();
                                }
                                // If we can't extract from object, fall through to userValue
                              }
                              // Use userValue if it's a string, otherwise return null
                              // CRITICAL: Ensure userValue is also a string or null, never an object
                              if (userValue && typeof userValue === 'string' && userValue.trim().length > 0) {
                                return userValue.trim();
                              }
                              // If userValue is an object (shouldn't happen, but safeguard), try to extract
                              if (userValue && typeof userValue === 'object' && !Array.isArray(userValue)) {
                                console.warn(`⚠️ [MODAL] ${docType} userValue is also an object, trying to extract URL:`, userValue);
                                if (userValue.downloadURL && typeof userValue.downloadURL === 'string' && userValue.downloadURL.trim().length > 0) {
                                  return userValue.downloadURL.trim();
                                }
                                if (userValue.url && typeof userValue.url === 'string' && userValue.url.trim().length > 0) {
                                  return userValue.url.trim();
                                }
                                if (userValue.path && typeof userValue.path === 'string' && userValue.path.trim().length > 0) {
                                  return userValue.path.trim();
                                }
                              }
                              // Return null if we can't extract a string URL
                              return null;
                            };
                            
                            // Normalize all documents and convert relative paths to full URLs
                            const [idFrontUrl, idBackUrl, selfieUrl, proofOfAddressUrl] = await Promise.all([
                              normalizeAndConvertUrl(getDocumentValue(doc.documents?.idFront, userKycDocuments.idFront, 'idFront')),
                              normalizeAndConvertUrl(getDocumentValue(doc.documents?.idBack, userKycDocuments.idBack, 'idBack')),
                              normalizeAndConvertUrl(getDocumentValue(doc.documents?.selfie, userKycDocuments.selfie, 'selfie')),
                              normalizeAndConvertUrl(getDocumentValue(doc.documents?.proofOfAddress, userKycDocuments.proofOfAddress, 'proofOfAddress'))
                            ]);
                            
                            // CRITICAL SAFEGUARD: Ensure all normalized values are strings or null, NEVER objects
                            const ensureStringOrNull = (value: any): string | null => {
                              if (value === null || value === undefined) return null;
                              if (typeof value === 'string' && value.trim().length > 0) return value.trim();
                              // If it's still an object (shouldn't happen, but safeguard), return null
                              if (typeof value === 'object') {
                                console.error('⚠️ [MODAL] CRITICAL: Object found after normalization! This should never happen:', value);
                                return null;
                              }
                              // For any other type (number, boolean, etc.), return null
                              if (typeof value !== 'string') {
                                console.error('⚠️ [MODAL] CRITICAL: Non-string value found after normalization!', typeof value, value);
                                return null;
                              }
                              return null;
                            };
                            
                            // Ensure documents are normalized (strings or null, never objects)
                            const normalizedDoc = {
                              ...doc,
                              documents: {
                                idFront: ensureStringOrNull(idFrontUrl),
                                idBack: ensureStringOrNull(idBackUrl),
                                selfie: ensureStringOrNull(selfieUrl),
                                proofOfAddress: ensureStringOrNull(proofOfAddressUrl),
                                additionalDocs: Array.isArray(doc.documents?.additionalDocs) 
                                  ? (await Promise.all(doc.documents.additionalDocs.map(normalizeAndConvertUrl)))
                                      .map(ensureStringOrNull)
                                      .filter((d: any) => d !== null) as string[]
                                  : []
                              }
                            };
                            
                            // CRITICAL: Final validation - double-check that all documents are strings or null
                            const finalValidateDocuments = (docs: any): any => {
                              const validated: any = {};
                              for (const key in docs) {
                                const value = docs[key];
                                if (value === null || value === undefined) {
                                  validated[key] = null;
                                } else if (typeof value === 'string' && value.trim().length > 0) {
                                  validated[key] = value.trim();
                                } else if (Array.isArray(value)) {
                                  validated[key] = value.map((item: any) => {
                                    if (typeof item === 'string' && item.trim().length > 0) {
                                      return item.trim();
                                    }
                                    return null;
                                  }).filter((item: any) => item !== null);
                                } else {
                                  // If it's an object or any other type, set to null
                                  console.error(`⚠️ [MODAL] CRITICAL: Final validation found non-string in documents.${key}!`, typeof value, value);
                                  validated[key] = null;
                                }
                              }
                              return validated;
                            };
                            
                            // Apply final validation
                            normalizedDoc.documents = finalValidateDocuments(normalizedDoc.documents);
                            
                            // Final validation: Ensure no objects are in documents
                            const validateDocuments = (docs: any): boolean => {
                              for (const key in docs) {
                                const value = docs[key];
                                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                                  console.error('⚠️ [MODAL] CRITICAL: Object found in documents after normalization:', key, value);
                                  return false;
                                }
                                if (Array.isArray(value)) {
                                  for (const item of value) {
                                    if (item !== null && typeof item === 'object') {
                                      console.error('⚠️ [MODAL] CRITICAL: Object found in additionalDocs array:', item);
                                      return false;
                                    }
                                  }
                                }
                              }
                              return true;
                            };
                            
                            if (!validateDocuments(normalizedDoc.documents)) {
                              console.error('⚠️ [MODAL] CRITICAL: Documents validation failed! Setting all to null to prevent errors.');
                              normalizedDoc.documents = {
                                idFront: null,
                                idBack: null,
                                selfie: null,
                                proofOfAddress: null,
                                additionalDocs: []
                              };
                            }
                            
                            console.log('📄 [MODAL] Setting selectedDoc with normalized documents:', {
                              id: normalizedDoc.id,
                              documents: {
                                idFront: normalizedDoc.documents.idFront ? '✓' : '✗',
                                idBack: normalizedDoc.documents.idBack ? '✓' : '✗',
                                selfie: normalizedDoc.documents.selfie ? '✓' : '✗',
                                proofOfAddress: normalizedDoc.documents.proofOfAddress ? '✓' : '✗'
                              },
                              idFrontType: typeof normalizedDoc.documents.idFront,
                              idFrontValue: normalizedDoc.documents.idFront ? normalizedDoc.documents.idFront.substring(0, 50) : 'null',
                              idBackType: typeof normalizedDoc.documents.idBack,
                              selfieType: typeof normalizedDoc.documents.selfie,
                              proofOfAddressType: typeof normalizedDoc.documents.proofOfAddress,
                              validationPassed: validateDocuments(normalizedDoc.documents)
                            });
                            setSelectedDoc(normalizedDoc);
                            setShowDocModal(true);
                            setActiveKycTab('kyc');
                            // Load founder projects - use doc.id as fallback if userId is missing
                            const founderUserId = doc.userId || doc.id;
                            console.log('📊 [KYC] Opening modal, loading projects for founder:', founderUserId, 'doc:', { 
                              id: doc.id, 
                              userId: doc.userId,
                              userName: doc.userName,
                              userEmail: doc.userEmail
                            });
                            // Reset projects state
                            setFounderProjects([]);
                            setLoadingProjects(true);
                            if (founderUserId) {
                              await loadFounderProjects(founderUserId);
                            } else {
                              console.error('❌ [KYC] No userId found in doc:', doc);
                              setLoadingProjects(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1 shadow-lg"
                          title="View Details"
                        >
                          <NeonCyanIcon type="eye" size={16} className="text-current" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                const notes = prompt('Approval notes (optional):');
                                handleApproveKYC(doc.id, notes || undefined);
                              }}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-900 disabled:to-green-900 text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1 shadow-lg"
                              title="Approve KYC"
                            >
                              <NeonCyanIcon type="check" size={16} className="text-current" />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason (required):');
                                if (reason) handleRejectKYC(doc.id, reason);
                              }}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-900 disabled:to-red-900 text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1 shadow-lg"
                              title="Reject KYC"
                            >
                              <NeonCyanIcon type="x-circle" size={16} className="text-current" />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}
                        
                        {doc.status === 'approved' && (
                          <>
                            <button
                              onClick={() => {
                                const notes = prompt('Approval notes (optional):');
                                handleApproveKYC(doc.id, notes || undefined);
                              }}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-900 disabled:to-blue-900 text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1 shadow-lg"
                              title="Re-approve KYC"
                            >
                              <NeonCyanIcon type="check" size={16} className="text-current" />
                              <span className="hidden sm:inline">Re-approve</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason (required):');
                                if (reason) handleRejectKYC(doc.id, reason);
                              }}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-900 disabled:to-red-900 text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1 shadow-lg"
                              title="Reject KYC"
                            >
                              <NeonCyanIcon type="x-circle" size={16} className="text-current" />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}
                        
                        {doc.status === 'rejected' && (
                          <>
                            <button
                              onClick={() => {
                                const notes = prompt('Approval notes (optional):');
                                handleApproveKYC(doc.id, notes || undefined);
                              }}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-900 disabled:to-green-900 text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1 shadow-lg"
                              title="Approve KYC"
                            >
                              <NeonCyanIcon type="check" size={16} className="text-current" />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Debug Info */}
        {filteredDocs.length === 0 && kycDocs.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ Data exists ({kycDocs.length} docs) but filtered to 0. Check search/filter.
            </p>
          </div>
        )}

        {/* KYC Document Details Modal - Enhanced with Full Details */}
        {showDocModal && selectedDoc && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" style={{ zIndex: 100, overflow: 'auto' }}>
            <div className="bg-gray-900 border-2 border-gray-600 rounded-2xl p-6 max-w-7xl w-full shadow-2xl" style={{ zIndex: 100, maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
              {/* Header - Fixed */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700 flex-shrink-0">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">KYC Document Review</h2>
                  <p className="text-cyan-400/70 text-sm">Complete verification details and documents</p>
                  
                  {/* Tabs */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setActiveKycTab('kyc')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeKycTab === 'kyc'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-black/40 text-white/60 hover:text-white hover:bg-black/60'
                      }`}
                    >
                      KYC Documents
                    </button>
                    <button
                      onClick={() => setActiveKycTab('projects')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeKycTab === 'projects'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-black/40 text-white/60 hover:text-white hover:bg-black/60'
                      }`}
                    >
                      Founder Projects ({founderProjects.length})
                    </button>
                  </div>
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-2 text-xs text-gray-500">
                      Documents: {JSON.stringify({
                        idFront: selectedDoc.documents?.idFront ? '✓' : '✗',
                        idBack: selectedDoc.documents?.idBack ? '✓' : '✗',
                        selfie: selectedDoc.documents?.selfie ? '✓' : '✗',
                        proofOfAddress: selectedDoc.documents?.proofOfAddress ? '✓' : '✗'
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    console.log('📄 [MODAL] Closing modal, selectedDoc documents:', selectedDoc.documents);
                    setShowDocModal(false);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <NeonCyanIcon type="close" size={24} className="text-white" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto pr-2 -mr-2" style={{ maxHeight: 'calc(95vh - 120px)' }}>
                {activeKycTab === 'kyc' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Personal Information & Documents */}
                <div className="lg:col-span-2 space-y-6">
                  {/* User Profile Header */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
                    <div className="flex items-center gap-4">
                      {selectedDoc.founderLogo ? (
                        <img 
                          src={selectedDoc.founderLogo} 
                          alt={selectedDoc.userName || 'Founder'} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400/30"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl ${selectedDoc.founderLogo ? 'hidden' : ''}`}>
                        {selectedDoc.personalInfo?.firstName?.charAt(0) || selectedDoc.userName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {selectedDoc.personalInfo?.firstName || ''} {selectedDoc.personalInfo?.lastName || ''}
                        </h3>
                        <p className="text-gray-300">{selectedDoc.userEmail}</p>
                        <p className="text-cyan-400/70 text-sm mt-1">User ID: {selectedDoc.userId}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white flex items-center gap-2 ${getStatusColor(selectedDoc.status)}`}>
                          {getStatusIcon(selectedDoc.status)}
                          {selectedDoc.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* RaftAI Analysis Section */}
                  {selectedDoc.raftaiAnalysis && (
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <NeonCyanIcon type="sparkles" size={24} className="text-purple-400" />
                        RaftAI Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-gray-400 text-sm font-medium">Risk Score</label>
                          <p className="text-white font-semibold text-2xl mt-1">
                            {selectedDoc.raftaiAnalysis.riskScore !== undefined ? selectedDoc.raftaiAnalysis.riskScore : selectedDoc.riskScore || 0}
                          </p>
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm font-medium">Confidence</label>
                          <p className="text-white font-semibold text-2xl mt-1">
                            {selectedDoc.raftaiAnalysis.confidence !== undefined ? `${selectedDoc.raftaiAnalysis.confidence}%` : selectedDoc.confidence ? `${selectedDoc.confidence}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm font-medium">Decision</label>
                          <p className="text-white font-semibold mt-1">
                            {selectedDoc.raftaiAnalysis.decision || selectedDoc.decision || 'Pending Review'}
                          </p>
                        </div>
                      </div>
                      {selectedDoc.raftaiAnalysis.reasons && selectedDoc.raftaiAnalysis.reasons.length > 0 && (
                        <div className="mt-4">
                          <label className="text-gray-400 text-sm font-medium">Analysis Reasons</label>
                          <ul className="mt-2 space-y-1">
                            {selectedDoc.raftaiAnalysis.reasons.map((reason: string, idx: number) => (
                              <li key={idx} className="text-white/80 text-sm flex items-start gap-2">
                                <span className="text-purple-400 mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Personal Information */}
                  <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <NeonCyanIcon type="user" size={24} className="text-blue-400" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm font-medium">First Name</label>
                        <p className="text-white font-semibold mt-1">{selectedDoc.personalInfo?.firstName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm font-medium">Last Name</label>
                        <p className="text-white font-semibold mt-1">{selectedDoc.personalInfo?.lastName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm font-medium">Date of Birth</label>
                        <p className="text-white font-semibold mt-1">{selectedDoc.personalInfo?.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm font-medium">Nationality</label>
                        <p className="text-white font-semibold mt-1">{selectedDoc.personalInfo?.nationality || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-gray-400 text-sm font-medium">Address</label>
                        <p className="text-white font-semibold mt-1">{selectedDoc.personalInfo?.address || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm font-medium">Phone Number</label>
                        <p className="text-white font-semibold mt-1">{selectedDoc.personalInfo?.phone || 'N/A'}</p>
                      </div>
                      {selectedDoc.personalInfo?.idType && (
                        <div>
                          <label className="text-gray-400 text-sm font-medium">ID Type</label>
                          <p className="text-white font-semibold mt-1">{selectedDoc.personalInfo.idType}</p>
                        </div>
                      )}
                      {selectedDoc.personalInfo?.idNumberLast4 && (
                        <div>
                          <label className="text-gray-400 text-sm font-medium">ID Number (Last 4)</label>
                          <p className="text-white font-mono font-semibold mt-1">****{selectedDoc.personalInfo.idNumberLast4}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submitted Documents */}
                  <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <NeonCyanIcon type="user" size={24} className="text-blue-400" />
                      Submitted Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        // CRITICAL: Documents should already be normalized (strings or null) when selectedDoc is set
                        // But we add defensive checks in case an object somehow slipped through
                        const idFront = selectedDoc.documents?.idFront;
                        
                        // Defensive extraction: handle both string URLs and objects (fallback)
                        let idFrontUrl: string | null = null;
                        if (idFront) {
                          if (typeof idFront === 'string' && idFront.trim() !== '') {
                            idFrontUrl = idFront.trim();
                          } else if (typeof idFront === 'object' && idFront !== null) {
                            // CRITICAL: This should never happen after our normalization, but handle it defensively
                            console.error('⚠️ [DISPLAY] CRITICAL: ID Front is still an object! This should never happen after normalization:', idFront);
                            // Try to extract URL from object as fallback
                            if (idFront.downloadURL && typeof idFront.downloadURL === 'string' && idFront.downloadURL.trim() !== '') {
                              idFrontUrl = idFront.downloadURL.trim();
                            } else if (idFront.url && typeof idFront.url === 'string' && idFront.url.trim() !== '') {
                              idFrontUrl = idFront.url.trim();
                            } else if (idFront.path && typeof idFront.path === 'string' && idFront.path.trim() !== '') {
                              idFrontUrl = idFront.path.trim();
                            } else {
                              // Object has no extractable URL
                              console.error('⚠️ [DISPLAY] ID Front object has no extractable URL:', idFront);
                              idFrontUrl = null;
                            }
                          }
                        }
                        
                        // If we have a URL (even if relative), show it
                        const hasValidUrl = idFrontUrl !== null && idFrontUrl.length > 0;
                        
                        if (!hasValidUrl) {
                          console.log('📄 [DISPLAY] ID Front missing:', { 
                            idFront, 
                            type: typeof idFront,
                            idFrontUrl,
                            isString: typeof idFront === 'string',
                            isObject: typeof idFront === 'object',
                            documents: selectedDoc.documents,
                            allDocumentKeys: selectedDoc.documents ? Object.keys(selectedDoc.documents) : [],
                            idFrontValue: idFront,
                            selectedDocDocuments: selectedDoc.documents
                          });
                        }
                        return hasValidUrl;
                      })() ? (
                        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                          <label className="text-gray-300 text-sm font-medium mb-2 block text-left">ID Front</label>
                          <div className="mt-2">
                            <img 
                              src={(() => {
                                // Documents should already be normalized (strings or null)
                                const idFront = selectedDoc.documents?.idFront;
                                // Handle string (normalized) or object (fallback)
                                if (typeof idFront === 'string' && idFront.trim().length > 0) {
                                  return idFront.trim();
                                }
                                // Fallback: extract from object if normalization didn't run
                                if (idFront && typeof idFront === 'object') {
                                  if (idFront.downloadURL && typeof idFront.downloadURL === 'string') {
                                    return idFront.downloadURL.trim();
                                  }
                                  if (idFront.url && typeof idFront.url === 'string') {
                                    return idFront.url.trim();
                                  }
                                  if (idFront.path && typeof idFront.path === 'string') {
                                    return idFront.path.trim();
                                  }
                                }
                                return '';
                              })()} 
                              alt="ID Front" 
                              className="w-full h-48 object-contain rounded-lg bg-gray-900 p-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={async () => {
                                const idFront = selectedDoc.documents?.idFront;
                                let url = '';
                                if (typeof idFront === 'string') {
                                  url = idFront;
                                } else if (idFront?.downloadURL) {
                                  url = idFront.downloadURL;
                                } else if (idFront?.url) {
                                  url = idFront.url;
                                } else if (idFront?.path) {
                                  url = idFront.path;
                                }
                                
                                // If it's a relative path, try to convert it
                                if (url && !url.startsWith('https://') && (url.startsWith('uploads/') || url.startsWith('kyc/') || url.startsWith('kyc-documents/'))) {
                                  try {
                                    const { ref, getDownloadURL } = await import('firebase/storage');
                                    const { ensureStorage } = await import('@/lib/firebase-utils');
                                    const storageInstance = ensureStorage();
                                    if (storageInstance) {
                                      const storagePath = url.replace(/^\/+/, '');
                                      const storageRef = ref(storageInstance, storagePath);
                                      url = await getDownloadURL(storageRef);
                                    }
                                  } catch (e) {
                                    console.error('Failed to get download URL:', e);
                                  }
                                }
                                
                                if (url) window.open(url, '_blank');
                              }}
                              onError={async (e) => {
                                const idFront = selectedDoc.documents?.idFront;
                                let url = '';
                                if (typeof idFront === 'string') {
                                  url = idFront;
                                } else if (idFront && typeof idFront === 'object') {
                                  if (idFront.downloadURL && typeof idFront.downloadURL === 'string') {
                                    url = idFront.downloadURL;
                                  } else if (idFront.url && typeof idFront.url === 'string') {
                                    url = idFront.url;
                                  } else if (idFront.path && typeof idFront.path === 'string') {
                                    url = idFront.path;
                                  }
                                }
                                
                                // If it's a relative path, try to convert it
                                if (url && !url.startsWith('https://') && (url.startsWith('uploads/') || url.startsWith('kyc/') || url.startsWith('kyc-documents/'))) {
                                  try {
                                    const { ref, getDownloadURL } = await import('firebase/storage');
                                    const { ensureStorage } = await import('@/lib/firebase-utils');
                                    const storageInstance = ensureStorage();
                                    if (storageInstance) {
                                      const storagePath = url.replace(/^\/+/, '');
                                      
                                      // Try the path as-is first
                                      try {
                                        const storageRef = ref(storageInstance, storagePath);
                                        const downloadURL = await getDownloadURL(storageRef);
                                        if (downloadURL) {
                                          (e.target as HTMLImageElement).src = downloadURL;
                                          return;
                                        }
                                      } catch (firstError: any) {
                                        // If uploads/kyc/ fails, try kyc-documents/
                                        if (storagePath.startsWith('uploads/kyc/')) {
                                          const altPath = storagePath.replace('uploads/kyc/', 'kyc-documents/');
                                          try {
                                            const altStorageRef = ref(storageInstance, altPath);
                                            const altDownloadURL = await getDownloadURL(altStorageRef);
                                            if (altDownloadURL) {
                                              (e.target as HTMLImageElement).src = altDownloadURL;
                                              return;
                                            }
                                          } catch (altError: any) {
                                            console.error('Failed to load ID Front from alternative path:', altPath, altError);
                                          }
                                        }
                                        throw firstError;
                                      }
                                    }
                                  } catch (storageError: any) {
                                    console.error('Failed to load ID Front image:', url, storageError);
                                  }
                                }
                                
                                console.error('Failed to load ID Front image:', url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <a 
                              href={(() => {
                                const idFront = selectedDoc.documents?.idFront;
                                // Handle all possible formats
                                if (typeof idFront === 'string' && idFront.trim().length > 0) {
                                  return idFront.trim();
                                }
                                if (idFront && typeof idFront === 'object') {
                                  if (idFront.downloadURL && typeof idFront.downloadURL === 'string') {
                                    return idFront.downloadURL.trim();
                                  }
                                  if (idFront.url && typeof idFront.url === 'string') {
                                    return idFront.url.trim();
                                  }
                                  if (idFront.path && typeof idFront.path === 'string') {
                                    return idFront.path.trim();
                                  }
                                }
                                return '#';
                              })()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 block text-blue-400 hover:text-blue-300 text-xs text-center"
                            >
                              View Full Size →
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 border-dashed">
                          <label className="text-gray-500 text-sm text-left block">ID Front</label>
                          <p className="text-gray-500 text-xs mt-2">Not provided</p>
                        </div>
                      )}
                      {(() => {
                        const idBack = selectedDoc.documents?.idBack;
                        // Handle both string URLs and objects with downloadURL
                        let idBackUrl: string | null = null;
                        if (idBack) {
                          if (typeof idBack === 'string' && idBack.trim() !== '') {
                            idBackUrl = idBack.trim();
                          } else if (typeof idBack === 'object' && idBack !== null) {
                            if (idBack.downloadURL && typeof idBack.downloadURL === 'string' && idBack.downloadURL.trim() !== '') {
                              idBackUrl = idBack.downloadURL.trim();
                            } else if (idBack.url && typeof idBack.url === 'string' && idBack.url.trim() !== '') {
                              idBackUrl = idBack.url.trim();
                            }
                          }
                        }
                        // If we have a URL (even if relative), show it
                        const hasValidUrl = idBackUrl !== null && idBackUrl.length > 0;
                        return hasValidUrl;
                      })() ? (
                        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                          <label className="text-gray-300 text-sm font-medium mb-2 block text-left">ID Back</label>
                          <div className="mt-2">
                            <img 
                              src={(() => {
                                const idBack = selectedDoc.documents?.idBack;
                                // Handle all possible formats
                                if (typeof idBack === 'string' && idBack.trim().length > 0) {
                                  return idBack.trim();
                                }
                                if (idBack && typeof idBack === 'object') {
                                  if (idBack.downloadURL && typeof idBack.downloadURL === 'string') {
                                    return idBack.downloadURL.trim();
                                  }
                                  if (idBack.url && typeof idBack.url === 'string') {
                                    return idBack.url.trim();
                                  }
                                  if (idBack.path && typeof idBack.path === 'string') {
                                    return idBack.path.trim();
                                  }
                                }
                                return '';
                              })()} 
                              alt="ID Back" 
                              className="w-full h-48 object-contain rounded-lg bg-gray-900 p-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={async () => {
                                const idBack = selectedDoc.documents?.idBack;
                                let url = '';
                                if (typeof idBack === 'string') {
                                  url = idBack;
                                } else if (idBack?.downloadURL) {
                                  url = idBack.downloadURL;
                                } else if (idBack?.url) {
                                  url = idBack.url;
                                } else if (idBack?.path) {
                                  url = idBack.path;
                                }
                                
                                // If it's a relative path, try to convert it
                                if (url && !url.startsWith('https://') && (url.startsWith('uploads/') || url.startsWith('kyc/') || url.startsWith('kyc-documents/'))) {
                                  try {
                                    const { ref, getDownloadURL } = await import('firebase/storage');
                                    const { ensureStorage } = await import('@/lib/firebase-utils');
                                    const storageInstance = ensureStorage();
                                    if (storageInstance) {
                                      const storagePath = url.replace(/^\/+/, '');
                                      const storageRef = ref(storageInstance, storagePath);
                                      url = await getDownloadURL(storageRef);
                                    }
                                  } catch (e) {
                                    console.error('Failed to get download URL:', e);
                                  }
                                }
                                
                                if (url) window.open(url, '_blank');
                              }}
                              onError={async (e) => {
                                const idBack = selectedDoc.documents?.idBack;
                                let url = '';
                                if (typeof idBack === 'string') {
                                  url = idBack;
                                } else if (idBack?.downloadURL) {
                                  url = idBack.downloadURL;
                                } else if (idBack?.url) {
                                  url = idBack.url;
                                } else if (idBack?.path) {
                                  url = idBack.path;
                                }
                                
                                // If it's a relative path, try to convert it
                                if (url && !url.startsWith('https://') && (url.startsWith('uploads/') || url.startsWith('kyc/') || url.startsWith('kyc-documents/'))) {
                                  try {
                                    const { ref, getDownloadURL } = await import('firebase/storage');
                                    const { ensureStorage } = await import('@/lib/firebase-utils');
                                    const storageInstance = ensureStorage();
                                    if (storageInstance) {
                                      const storagePath = url.replace(/^\/+/, '');
                                      const storageRef = ref(storageInstance, storagePath);
                                      const downloadURL = await getDownloadURL(storageRef);
                                      if (downloadURL) {
                                        (e.target as HTMLImageElement).src = downloadURL;
                                        return;
                                      }
                                    }
                                  } catch (storageError: any) {
                                    console.error('Failed to load ID Back image:', url, storageError);
                                  }
                                }
                                
                                console.error('Failed to load ID Back image:', url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <a 
                              href={(() => {
                                const idBack = selectedDoc.documents?.idBack;
                                // Handle all possible formats
                                if (typeof idBack === 'string' && idBack.trim().length > 0) {
                                  return idBack.trim();
                                }
                                if (idBack && typeof idBack === 'object') {
                                  if (idBack.downloadURL && typeof idBack.downloadURL === 'string') {
                                    return idBack.downloadURL.trim();
                                  }
                                  if (idBack.url && typeof idBack.url === 'string') {
                                    return idBack.url.trim();
                                  }
                                  if (idBack.path && typeof idBack.path === 'string') {
                                    return idBack.path.trim();
                                  }
                                }
                                return '#';
                              })()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 block text-blue-400 hover:text-blue-300 text-xs text-center"
                            >
                              View Full Size →
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 border-dashed">
                          <label className="text-gray-500 text-sm text-left block">ID Back</label>
                          <p className="text-gray-500 text-xs mt-2">Not provided</p>
                        </div>
                      )}
                      {(() => {
                        const selfie = selectedDoc.documents?.selfie;
                        let selfieUrl: string | null = null;
                        if (selfie) {
                          if (typeof selfie === 'string' && selfie.trim() !== '') {
                            selfieUrl = selfie.trim();
                          } else if (typeof selfie === 'object' && selfie !== null) {
                            if (selfie.downloadURL && typeof selfie.downloadURL === 'string' && selfie.downloadURL.trim() !== '') {
                              selfieUrl = selfie.downloadURL.trim();
                            } else if (selfie.url && typeof selfie.url === 'string' && selfie.url.trim() !== '') {
                              selfieUrl = selfie.url.trim();
                            }
                          }
                        }
                        return selfieUrl !== null;
                      })() ? (
                        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                          <label className="text-gray-300 text-sm font-medium mb-2 block text-left">Selfie</label>
                          <div className="mt-2">
                            <img 
                              src={(() => {
                                const selfie = selectedDoc.documents?.selfie;
                                if (typeof selfie === 'string') return selfie;
                                if (selfie?.downloadURL) return selfie.downloadURL;
                                if (selfie?.url) return selfie.url;
                                return '';
                              })()} 
                              alt="Selfie" 
                              className="w-full h-48 object-contain rounded-lg bg-gray-900 p-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                const selfie = selectedDoc.documents?.selfie;
                                const url = typeof selfie === 'string' ? selfie : (selfie?.downloadURL || selfie?.url || '');
                                if (url) window.open(url, '_blank');
                              }}
                              onError={(e) => {
                                const selfie = selectedDoc.documents?.selfie;
                                const url = typeof selfie === 'string' ? selfie : (selfie?.downloadURL || selfie?.url || '');
                                console.error('Failed to load Selfie image:', url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <a 
                              href={(() => {
                                const selfie = selectedDoc.documents?.selfie;
                                if (typeof selfie === 'string') return selfie;
                                if (selfie?.downloadURL) return selfie.downloadURL;
                                if (selfie?.url) return selfie.url;
                                return '#';
                              })()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 block text-blue-400 hover:text-blue-300 text-xs text-center"
                            >
                              View Full Size →
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 border-dashed">
                          <label className="text-gray-500 text-sm text-left block">Selfie</label>
                          <p className="text-gray-500 text-xs mt-2">Not provided</p>
                        </div>
                      )}
                      {(() => {
                        const proofOfAddress = selectedDoc.documents?.proofOfAddress;
                        let proofOfAddressUrl: string | null = null;
                        if (proofOfAddress) {
                          if (typeof proofOfAddress === 'string' && proofOfAddress.trim() !== '') {
                            proofOfAddressUrl = proofOfAddress.trim();
                          } else if (typeof proofOfAddress === 'object' && proofOfAddress !== null) {
                            if (proofOfAddress.downloadURL && typeof proofOfAddress.downloadURL === 'string' && proofOfAddress.downloadURL.trim() !== '') {
                              proofOfAddressUrl = proofOfAddress.downloadURL.trim();
                            } else if (proofOfAddress.url && typeof proofOfAddress.url === 'string' && proofOfAddress.url.trim() !== '') {
                              proofOfAddressUrl = proofOfAddress.url.trim();
                            }
                          }
                        }
                        return proofOfAddressUrl !== null;
                      })() ? (
                        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                          <label className="text-gray-300 text-sm font-medium mb-2 block text-left">Proof of Address</label>
                          <div className="mt-2">
                            <img 
                              src={(() => {
                                const proofOfAddress = selectedDoc.documents?.proofOfAddress;
                                if (typeof proofOfAddress === 'string') return proofOfAddress;
                                if (proofOfAddress?.downloadURL) return proofOfAddress.downloadURL;
                                if (proofOfAddress?.url) return proofOfAddress.url;
                                return '';
                              })()} 
                              alt="Proof of Address" 
                              className="w-full h-48 object-contain rounded-lg bg-gray-900 p-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                const proofOfAddress = selectedDoc.documents?.proofOfAddress;
                                const url = typeof proofOfAddress === 'string' ? proofOfAddress : (proofOfAddress?.downloadURL || proofOfAddress?.url || '');
                                if (url) window.open(url, '_blank');
                              }}
                              onError={(e) => {
                                const proofOfAddress = selectedDoc.documents?.proofOfAddress;
                                const url = typeof proofOfAddress === 'string' ? proofOfAddress : (proofOfAddress?.downloadURL || proofOfAddress?.url || '');
                                console.error('Failed to load Proof of Address image:', url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <a 
                              href={(() => {
                                const proofOfAddress = selectedDoc.documents?.proofOfAddress;
                                if (typeof proofOfAddress === 'string') return proofOfAddress;
                                if (proofOfAddress?.downloadURL) return proofOfAddress.downloadURL;
                                if (proofOfAddress?.url) return proofOfAddress.url;
                                return '#';
                              })()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 block text-blue-400 hover:text-blue-300 text-xs text-center"
                            >
                              View Full Size →
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 border-dashed">
                          <label className="text-gray-500 text-sm text-left block">Proof of Address</label>
                          <p className="text-gray-500 text-xs mt-2">Not provided</p>
                        </div>
                      )}
                      {selectedDoc.documents.additionalDocs && selectedDoc.documents.additionalDocs.length > 0 && (
                        <div className="md:col-span-2 bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                          <label className="text-gray-300 text-sm font-medium mb-2 block">Additional Documents</label>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedDoc.documents.additionalDocs.map((docUrl, idx) => (
                              <img 
                                key={idx}
                                src={docUrl} 
                                alt={`Additional Doc ${idx + 1}`} 
                                className="w-full h-32 object-contain rounded-lg bg-gray-900 p-2 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(docUrl, '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Review Information & RaftAI Verification */}
                <div className="space-y-6">
                  {/* Status & Risk Score - Enhanced */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <NeonCyanIcon type="document" size={24} className="text-green-400" />
                      Review Status
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-300 text-sm font-medium block mb-2">Current Status</label>
                        <div className={`px-4 py-3 rounded-lg text-center font-semibold text-white flex items-center justify-center gap-2 shadow-lg ${getStatusColor(selectedDoc.status)}`}>
                          {getStatusIcon(selectedDoc.status)}
                          {selectedDoc.status.toUpperCase().replace('_', ' ')}
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm font-medium flex items-center justify-between mb-2">
                          <span>RaftAI Risk Score</span>
                          <span className="text-xs text-purple-400 flex items-center gap-1">
                            <NeonCyanIcon type="shield" size={12} className="text-current" />
                            AI-Powered
                          </span>
                        </label>
                        <div className={`px-4 py-6 rounded-xl text-center shadow-lg ${getRiskColor(selectedDoc.riskScore || selectedDoc.kyc?.riskScore || 0)}`}>
                          <p className="text-5xl font-bold mb-1">{selectedDoc.riskScore || selectedDoc.kyc?.riskScore || 0}%</p>
                          <p className="text-sm font-semibold mt-2">
                            {(() => {
                              const riskScore = selectedDoc.riskScore || selectedDoc.kyc?.riskScore || 0;
                              if (riskScore === 0) return 'Not calculated';
                              if (riskScore < 20) return 'Very Low Risk ✓';
                              if (riskScore < 40) return 'Low Risk ✓';
                              if (riskScore < 60) return 'Medium Risk ⚠';
                              if (riskScore < 80) return 'High Risk ⚠';
                              return 'Critical Risk ⛔';
                            })()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm font-medium block mb-2">Verification Level</label>
                        <p className="text-white font-semibold px-4 py-2 bg-blue-600/20 rounded-lg text-center border border-blue-500/30">
                          {selectedDoc.verificationLevel || selectedDoc.kyc?.verificationLevel || 'Standard'}
                        </p>
                      </div>
                      {selectedDoc.confidence !== undefined || selectedDoc.kyc?.confidence !== undefined ? (
                        <div>
                          <label className="text-gray-300 text-sm font-medium block mb-2">AI Confidence Score</label>
                          <div className="relative">
                            <p className="text-white font-semibold px-4 py-2 bg-purple-600/20 rounded-lg text-center border border-purple-500/30">
                              {Math.round((selectedDoc.confidence || selectedDoc.kyc?.confidence || 0) * 100)}%
                            </p>
                            <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.round((selectedDoc.confidence || selectedDoc.kyc?.confidence || 0) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* RaftAI Verification Details */}
                  {(selectedDoc.decision || selectedDoc.reasons || selectedDoc.checks || selectedDoc.verificationId) && (
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <NeonCyanIcon type="shield" size={24} className="text-purple-400" />
                        RaftAI Verification
                      </h3>
                      <div className="space-y-3">
                        {selectedDoc.decision && (
                          <div>
                            <label className="text-gray-300 text-sm font-medium block mb-1">AI Decision</label>
                            <p className={`px-3 py-2 rounded-lg font-semibold text-center ${
                              selectedDoc.decision === 'APPROVED' 
                                ? 'bg-green-600/30 text-green-300 border border-green-500/50' 
                                : 'bg-red-600/30 text-red-300 border border-red-500/50'
                            }`}>
                              {selectedDoc.decision}
                            </p>
                          </div>
                        )}
                        {selectedDoc.verificationId && (
                          <div>
                            <label className="text-gray-300 text-sm font-medium block mb-1">Verification ID</label>
                            <p className="text-white font-mono text-xs bg-gray-800 px-3 py-2 rounded-lg border border-gray-600 break-all">
                              {selectedDoc.verificationId}
                            </p>
                          </div>
                        )}
                        {selectedDoc.reasons && selectedDoc.reasons.length > 0 && (
                          <div>
                            <label className="text-gray-300 text-sm font-medium block mb-2">Verification Reasons</label>
                            <ul className="space-y-1">
                              {selectedDoc.reasons.map((reason, idx) => (
                                <li key={idx} className="text-gray-300 text-sm bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/50 flex items-start gap-2">
                                  <span className="text-blue-400 mt-0.5">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedDoc.checks && (
                          <div>
                            <label className="text-gray-300 text-sm font-medium block mb-2">Verification Checks</label>
                            <div className="space-y-2">
                              {selectedDoc.checks.faceMatch && (
                                <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/50">
                                  <span className="text-gray-300 text-sm">Face Match</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    selectedDoc.checks.faceMatch.passed ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
                                  }`}>
                                    {selectedDoc.checks.faceMatch.passed ? '✓ Passed' : '✗ Failed'}
                                    {selectedDoc.checks.faceMatch.confidence !== undefined && ` (${Math.round(selectedDoc.checks.faceMatch.confidence * 100)}%)`}
                                  </span>
                                </div>
                              )}
                              {selectedDoc.checks.liveness && (
                                <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/50">
                                  <span className="text-gray-300 text-sm">Liveness Check</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    selectedDoc.checks.liveness.passed ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
                                  }`}>
                                    {selectedDoc.checks.liveness.passed ? '✓ Passed' : '✗ Failed'}
                                    {selectedDoc.checks.liveness.confidence !== undefined && ` (${Math.round(selectedDoc.checks.liveness.confidence * 100)}%)`}
                                  </span>
                                </div>
                              )}
                              {selectedDoc.checks.idVerification && (
                                <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/50">
                                  <span className="text-gray-300 text-sm">ID Verification</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    selectedDoc.checks.idVerification.passed ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
                                  }`}>
                                    {selectedDoc.checks.idVerification.passed ? '✓ Passed' : '✗ Failed'}
                                    {selectedDoc.checks.idVerification.confidence !== undefined && ` (${Math.round(selectedDoc.checks.idVerification.confidence * 100)}%)`}
                                  </span>
                                </div>
                              )}
                              {selectedDoc.checks.addressVerification && (
                                <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/50">
                                  <span className="text-gray-300 text-sm">Address Verification</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    selectedDoc.checks.addressVerification.passed ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
                                  }`}>
                                    {selectedDoc.checks.addressVerification.passed ? '✓ Passed' : '✗ Failed'}
                                    {selectedDoc.checks.addressVerification.confidence !== undefined && ` (${Math.round(selectedDoc.checks.addressVerification.confidence * 100)}%)`}
                                  </span>
                                </div>
                              )}
                              {selectedDoc.checks.sanctionsCheck && (
                                <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/50">
                                  <span className="text-gray-300 text-sm">Sanctions Check</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    selectedDoc.checks.sanctionsCheck.passed && !selectedDoc.checks.sanctionsCheck.found ? 'bg-green-600/30 text-green-300' : 'bg-yellow-600/30 text-yellow-300'
                                  }`}>
                                    {selectedDoc.checks.sanctionsCheck.passed && !selectedDoc.checks.sanctionsCheck.found ? '✓ Clear' : '⚠️ Match Found'}
                                  </span>
                                </div>
                              )}
                              {selectedDoc.checks.pepCheck && (
                                <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/50">
                                  <span className="text-gray-300 text-sm">PEP Check</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    selectedDoc.checks.pepCheck.passed && !selectedDoc.checks.pepCheck.found ? 'bg-green-600/30 text-green-300' : 'bg-yellow-600/30 text-yellow-300'
                                  }`}>
                                    {selectedDoc.checks.pepCheck.passed && !selectedDoc.checks.pepCheck.found ? '✓ Clear' : '⚠️ Match Found'}
                                  </span>
                                </div>
                              )}
                              {selectedDoc.checks.amlCheck && (
                                <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/50">
                                  <span className="text-gray-300 text-sm">AML Check</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    selectedDoc.checks.amlCheck.passed ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
                                  }`}>
                                    {selectedDoc.checks.amlCheck.passed ? '✓ Passed' : '✗ Failed'}
                                    {selectedDoc.checks.amlCheck.riskLevel && ` (${selectedDoc.checks.amlCheck.riskLevel})`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Review History */}
                  <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <NeonCyanIcon type="clock" size={24} className="text-yellow-400" />
                      Review History & Timeline
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50">
                        <label className="text-gray-300 text-sm font-medium flex items-center gap-2 mb-2">
                          <NeonCyanIcon type="clock" size={16} className="text-blue-400" />
                          Submitted At
                        </label>
                        <p className="text-white font-semibold">
                          {selectedDoc.submittedAt 
                            ? (selectedDoc.submittedAt instanceof Date 
                                ? selectedDoc.submittedAt.toLocaleString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : new Date(selectedDoc.submittedAt).toLocaleString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }))
                            : 'Not available'}
                        </p>
                      </div>
                      
                      {selectedDoc.reviewedAt && (
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50">
                          <label className="text-gray-300 text-sm font-medium flex items-center gap-2 mb-2">
                            <NeonCyanIcon type="check" size={16} className="text-green-400" />
                            Reviewed At
                          </label>
                          <p className="text-white font-semibold">
                            {selectedDoc.reviewedAt?.toDate 
                              ? selectedDoc.reviewedAt.toDate().toLocaleString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : selectedDoc.reviewedAt?.seconds
                              ? new Date(selectedDoc.reviewedAt.seconds * 1000).toLocaleString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : new Date(selectedDoc.reviewedAt).toLocaleString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                          </p>
                        </div>
                      )}
                      
                      {selectedDoc.reviewedBy && (
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50">
                          <label className="text-gray-300 text-sm font-medium flex items-center gap-2 mb-2">
                            <NeonCyanIcon type="user" size={16} className="text-purple-400" />
                            Reviewed By (Admin ID)
                          </label>
                          <p className="text-white font-mono text-sm bg-gray-700/70 px-3 py-2 rounded-lg border border-gray-600 break-all">
                            {selectedDoc.reviewedBy}
                          </p>
                        </div>
                      )}
                      
                      {selectedDoc.rejectionReason && (
                        <div className="bg-red-600/20 rounded-lg p-4 border border-red-500/50">
                          <label className="text-red-300 text-sm font-medium flex items-center gap-2 mb-2">
                            <XCircleIcon className="w-4 h-4 text-red-400" />
                            Rejection Reason
                          </label>
                          <p className="text-white font-medium leading-relaxed">
                            {selectedDoc.rejectionReason}
                          </p>
                        </div>
                      )}
                      
                      {selectedDoc.notes && (
                        <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/50">
                          <label className="text-blue-300 text-sm font-medium flex items-center gap-2 mb-2">
                            <NeonCyanIcon type="document" size={16} className="text-blue-400" />
                            Admin Notes
                          </label>
                          <p className="text-white font-medium leading-relaxed whitespace-pre-wrap">
                            {selectedDoc.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-white font-semibold text-lg mb-4">Review Actions</h3>
                    
                    {selectedDoc.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={async () => {
                            const notes = prompt('Approval notes (optional):');
                            try {
                              await handleApproveKYC(selectedDoc.id, notes || undefined);
                              setShowDocModal(false);
                            } catch (error) {
                              console.error('Error approving KYC:', error);
                            }
                          }}
                          disabled={isUpdating}
                          className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-900 disabled:to-green-900 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
                        >
                          <NeonCyanIcon type="check" size={20} className="text-current" />
                          Approve KYC
                        </button>
                        <button
                          onClick={async () => {
                            const reason = prompt('Rejection reason (required):');
                            if (reason) {
                              try {
                                await handleRejectKYC(selectedDoc.id, reason);
                                setShowDocModal(false);
                              } catch (error) {
                                console.error('Error rejecting KYC:', error);
                              }
                            }
                          }}
                          disabled={isUpdating}
                          className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-900 disabled:to-red-900 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
                        >
                          <NeonCyanIcon type="x-circle" size={20} className="text-current" />
                          Reject KYC
                        </button>
                      </div>
                    )}
                    
                    {selectedDoc.status === 'approved' && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={async () => {
                            const notes = prompt('Approval notes (optional):');
                            try {
                              await handleApproveKYC(selectedDoc.id, notes || undefined);
                              setShowDocModal(false);
                            } catch (error) {
                              console.error('Error re-approving KYC:', error);
                            }
                          }}
                          disabled={isUpdating}
                          className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-900 disabled:to-blue-900 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
                        >
                          <NeonCyanIcon type="check" size={20} className="text-current" />
                          Re-approve
                        </button>
                        <button
                          onClick={async () => {
                            const reason = prompt('Rejection reason (required):');
                            if (reason) {
                              try {
                                await handleRejectKYC(selectedDoc.id, reason);
                                setShowDocModal(false);
                              } catch (error) {
                                console.error('Error rejecting KYC:', error);
                              }
                            }
                          }}
                          disabled={isUpdating}
                          className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-900 disabled:to-red-900 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
                        >
                          <NeonCyanIcon type="x-circle" size={20} className="text-current" />
                          Reject KYC
                        </button>
                      </div>
                    )}
                    
                    {selectedDoc.status === 'rejected' && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={async () => {
                            const notes = prompt('Approval notes (optional):');
                            try {
                              await handleApproveKYC(selectedDoc.id, notes || undefined);
                              setShowDocModal(false);
                            } catch (error) {
                              console.error('Error approving KYC:', error);
                            }
                          }}
                          disabled={isUpdating}
                          className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-900 disabled:to-green-900 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
                        >
                          <NeonCyanIcon type="check" size={20} className="text-current" />
                          Approve KYC
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Reset KYC to pending? User will need to resubmit documents.')) return;
                            
                            try {
                              setIsUpdating(true);
                              const { db: firestoreDb } = await import('@/lib/firebase.client');
                              const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                              
                              if (!firestoreDb) return;
                              
                              const userId = selectedDoc.userId || selectedDoc.id;
                              const docRef = doc(firestoreDb, 'kyc_documents', userId);
                              const userRef = doc(firestoreDb, 'users', userId);
                              
                              // Reset to pending in kyc_documents
                              await updateDoc(docRef, {
                                status: 'pending',
                                rejectionReason: null,
                                reviewedBy: null,
                                reviewedAt: null,
                                updatedAt: serverTimestamp()
                              });
                              
                              // Reset user document
                              const { getDoc: getDocFn } = await import('firebase/firestore');
                              const userDoc = await getDocFn(userRef);
                              const currentUserData = userDoc.exists() ? userDoc.data() : {};
                              
                              const updateData: any = {
                                kycStatus: 'pending',
                                kyc_status: 'pending',
                                onboarding_state: 'KYC_PENDING',
                                updated_at: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              };
                              
                              if (currentUserData.kyc) {
                                updateData.kyc = {
                                  ...currentUserData.kyc,
                                  status: 'pending'
                                };
                              }
                              
                              await updateDoc(userRef, updateData);
                              
                              // Update local state
                              setKycDocs(prev => prev.map(d => 
                                d.id === selectedDoc.id 
                                  ? { ...d, status: 'pending', rejectionReason: '', reviewedBy: '', reviewedAt: null }
                                  : d
                              ));
                              
                              alert('KYC reset to pending successfully');
                              setShowDocModal(false);
                            } catch (error) {
                              console.error('Error resetting KYC:', error);
                              alert('Error resetting KYC');
                            } finally {
                              setIsUpdating(false);
                            }
                          }}
                          disabled={isUpdating}
                          className="px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-yellow-900 disabled:to-yellow-900 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
                        >
                          <NeonCyanIcon type="arrow-right" size={20} className="text-current" />
                          Redo KYC
                        </button>
                      </div>
                    )}
                    
                    {isUpdating && (
                      <div className="text-center py-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                        <p className="text-white/70 text-sm mt-2">Processing...</p>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
                ) : (
                  // Projects Tab - Show all founder project data
                  <div className="space-y-6">
                    {loadingProjects ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <p className="text-white/60">Loading founder projects...</p>
                      </div>
                    ) : founderProjects.length === 0 ? (
                      <div className="text-center py-12 bg-black/40 rounded-xl border border-cyan-400/20">
                        <NeonCyanIcon type="rocket" size={48} className="text-cyan-400/50 mx-auto mb-4" />
                        <p className="text-white/60 text-lg mb-2">No Projects Found</p>
                        <p className="text-cyan-400/70 text-sm">This founder hasn't submitted any projects yet.</p>
                      </div>
                    ) : (
                      founderProjects.map((project) => (
                        <div key={project.id} className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
                          {/* Project Header with Logo */}
                          <div className="flex items-start gap-4 mb-6">
                            {project.founderLogo && (
                              <img 
                                src={project.founderLogo} 
                                alt="Founder Logo" 
                                className="w-20 h-20 rounded-xl object-cover border-2 border-cyan-400/30"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-white mb-2">{project.name || project.projectName || 'Untitled Project'}</h3>
                              <p className="text-cyan-400/70 text-sm mb-2">{project.description || project.valueProposition || 'No description'}</p>
                              <div className="flex flex-wrap gap-2">
                                {project.category && (
                                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg border border-cyan-400/30">
                                    {project.category}
                                  </span>
                                )}
                                {project.status && (
                                  <span className={`px-2 py-1 text-xs rounded-lg border ${
                                    project.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-400/30' :
                                    project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                                    'bg-gray-500/20 text-gray-400 border-gray-400/30'
                                  }`}>
                                    {project.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* RaftAI Analysis */}
                          {project.raftai && (
                            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6 mb-6">
                              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <NeonCyanIcon type="cpu" size={24} className="text-purple-400" />
                                RaftAI Analysis
                              </h4>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                {project.raftai.score && (
                                  <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                                    <span className="text-white/60 text-xs">Score</span>
                                    <p className="text-white font-bold text-2xl">{project.raftai.score}/100</p>
                                  </div>
                                )}
                                <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                                  <span className="text-white/60 text-xs">Risk</span>
                                  <p className="text-white font-bold text-lg">
                                    {project.raftai.rating || (project.raftai.score ? (project.raftai.score >= 80 ? 'Low' : project.raftai.score >= 60 ? 'Med' : 'High') : 'N/A')}
                                  </p>
                                </div>
                              </div>
                              {project.raftai.summary && (
                                <p className="text-white/80 text-sm mb-2">{project.raftai.summary}</p>
                              )}
                              {project.raftai.insights && Array.isArray(project.raftai.insights) && project.raftai.insights.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-white/60 text-sm font-medium mb-2">Key Insights:</p>
                                  <ul className="space-y-1">
                                    {project.raftai.insights.slice(0, 3).map((insight: string, idx: number) => (
                                      <li key={idx} className="text-cyan-400 text-sm flex items-start gap-2">
                                        <span className="text-cyan-400 mt-0.5">•</span>
                                        <span>{insight}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Team Members */}
                          {project.team && Array.isArray(project.team) && project.team.length > 0 && (
                            <div className="bg-black/40 rounded-xl p-6 mb-6 border border-cyan-400/20">
                              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <NeonCyanIcon type="users" size={24} className="text-blue-400" />
                                Team ({project.team.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {project.team.map((member: any, idx: number) => (
                                  <div key={idx} className="bg-black/60 rounded-lg p-4 border border-cyan-400/10">
                                    <div className="flex items-center gap-3 mb-2">
                                      {member.avatar && (
                                        <img 
                                          src={member.avatar} 
                                          alt={member.name} 
                                          className="w-10 h-10 rounded-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <p className="text-white font-semibold">{member.name}</p>
                                        <p className="text-cyan-400/70 text-xs">{member.role}</p>
                                      </div>
                                    </div>
                                    {member.bio && (
                                      <p className="text-white/60 text-xs mt-2">{member.bio}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Documents */}
                          {project.documents && Array.isArray(project.documents) && project.documents.length > 0 && (
                            <div className="bg-black/40 rounded-xl p-6 mb-6 border border-cyan-400/20">
                              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <NeonCyanIcon type="document" size={24} className="text-green-400" />
                                Documents ({project.documents.length})
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {project.documents.map((doc: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-black/60 rounded-lg p-3 border border-cyan-400/10 hover:border-cyan-400/30 transition-all flex items-center gap-2"
                                  >
                                    <NeonCyanIcon type="document" size={20} className="text-cyan-400" />
                                    <span className="text-white text-sm truncate">{doc.name}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Social Links */}
                          {project.socials && (project.socials.website || project.socials.twitter || project.socials.linkedin || project.socials.telegram) && (
                            <div className="bg-black/40 rounded-xl p-6 border border-cyan-400/20">
                              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <NeonCyanIcon type="globe" size={24} className="text-cyan-400" />
                                Social Links
                              </h4>
                              <div className="flex flex-wrap gap-3">
                                {project.socials.website && (
                                  <a href={project.socials.website} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-400/30 hover:bg-cyan-500/30 transition-all flex items-center gap-2">
                                    <NeonCyanIcon type="globe" size={16} />
                                    Website
                                  </a>
                                )}
                                {project.socials.twitter && (
                                  <a href={project.socials.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30 hover:bg-blue-500/30 transition-all flex items-center gap-2">
                                    <NeonCyanIcon type="globe" size={16} />
                                    Twitter
                                  </a>
                                )}
                                {project.socials.linkedin && (
                                  <a href={project.socials.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-600/30 transition-all flex items-center gap-2">
                                    <NeonCyanIcon type="globe" size={16} />
                                    LinkedIn
                                  </a>
                                )}
                                {project.socials.telegram && (
                                  <a href={project.socials.telegram} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-cyan-600/20 text-cyan-300 rounded-lg border border-cyan-500/30 hover:bg-cyan-600/30 transition-all flex items-center gap-2">
                                    <NeonCyanIcon type="globe" size={16} />
                                    Telegram
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* View Project Link */}
                          <div className="mt-6 pt-4 border-t border-cyan-400/20">
                            <button
                              onClick={() => router.push(`/admin/project/${project.id}`)}
                              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all font-semibold shadow-lg shadow-cyan-500/20 border border-cyan-400/30 flex items-center justify-center gap-2"
                            >
                              <NeonCyanIcon type="eye" size={20} />
                              View Full Project Details
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {/* Footer - Fixed */}
              <div className="mt-6 pt-4 border-t border-gray-700 flex-shrink-0">
                <button
                  onClick={() => setShowDocModal(false)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-semibold shadow-lg"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}