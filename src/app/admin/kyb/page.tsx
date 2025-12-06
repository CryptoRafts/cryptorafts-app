"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface KYBDocument {
  id: string;
  organizationName: string;
  organizationType: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  businessDescription: string;
  documents: {
    registrationCertificate?: string;
    taxCertificate?: string;
    bankStatement?: string;
    businessLicense?: string;
  };
  kybStatus: 'pending' | 'approved' | 'rejected' | 'skipped';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export default function AdminKYBPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [kybDocuments, setKybDocuments] = useState<KYBDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KYBDocument | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    skipped: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<KYBDocument[]>([]);

  // Filter documents based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDocuments(kybDocuments);
    } else {
      const filtered = kybDocuments.filter(doc => 
        doc.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.organizationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, kybDocuments]);

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
        
        onAuthStateChanged(auth, (user) => {
          if (user) {
            // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
            const userEmail = user.email?.toLowerCase() || '';
            if (userEmail !== 'anasshamsiggc@gmail.com') {
              console.log('❌ Access denied. Only anasshamsiggc@gmail.com can access admin panel.');
              alert('Access Denied: Only authorized admin can access this panel.');
              router.replace('/admin/login');
              setIsLoading(false);
              return;
            }
            
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'admin' || userEmail === 'anasshamsiggc@gmail.com') {
              setUser(user);
              loadKYBDocuments();
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

  const loadKYBDocuments = async () => {
    try {
      // Dynamic imports to avoid chunk loading errors
      const { ensureDb, waitForFirebase } = await import('@/lib/firebase-utils');
      const { collection, query, where, orderBy, getDocs, addDoc, Timestamp, doc, getDoc } = await import('firebase/firestore');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }
      
      const db = ensureDb();
      if (!db) {
        console.error('❌ Firebase database not initialized');
        return;
      }
      
      // First check if any organizations exist
      const totalQuery = query(collection(db, 'organizations'));
      let totalSnapshot = await getDocs(totalQuery);
      
      console.log('📊 Fetching KYB organizations from Firebase...');
      console.log('📊 Found', totalSnapshot.size, 'organizations in Firebase');
      
      let documents: KYBDocument[] = [];
      
      // Load REAL KYB data - NO MOCK DATA
      if (totalSnapshot.size === 0) {
        console.log('📊 No KYB organizations found in database - showing empty state');
      }
      
      // Also check users subcollections for KYB submissions
      let userKybCount = 0;
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        console.log('📊 Checking', usersSnapshot.size, 'users for KYB data...');
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          
          // Check if user has KYB data - check multiple field variations
          const hasKybStatus = userData.kyb_status || userData.kybStatus || userData.kyb?.status;
          const hasKybData = userData.kyb || userData.kybData;
          const hasCompanyName = userData.company_name || userData.companyName;
          const requiresKyb = ['vc', 'exchange', 'ido', 'agency'].includes(userData.role);
          
          // Check if already synced to organizations
          const orgExists = totalSnapshot.docs.find(orgDoc => {
            const orgData = orgDoc.data();
            return orgData.userId === userDoc.id || orgData.email === userData.email;
          });
          
          if (orgExists) {
            continue; // Skip if already synced
          }
          
          // Only process if user has KYB data or requires KYB
          if (hasKybStatus || hasKybData || (requiresKyb && hasCompanyName)) {
            try {
              // Try to get KYB data from subcollection first
              const kybVerificationDoc = doc(db, 'users', userDoc.id, 'kyb', 'verification');
              const kybSnapshot = await getDoc(kybVerificationDoc);
              
              if (kybSnapshot.exists()) {
                const kybData = kybSnapshot.data();
                console.log('📄 Found KYB data in verification document for:', userData.email);
                
                // Create organization document from KYB subcollection data
                const { setDoc, serverTimestamp } = await import('firebase/firestore');
                const newOrgRef = doc(collection(db, 'organizations'));
                await setDoc(newOrgRef, {
                  userId: userDoc.id,
                  organizationName: kybData.organization_name || kybData.company_name || userData.company_name || userData.companyName || 'Unknown',
                  organizationType: kybData.business_type || kybData.organizationType || 'N/A',
                  registrationNumber: kybData.registration_number || kybData.kyb_reg_number || kybData.registrationNumber || 'N/A',
                  taxId: kybData.tax_id || kybData.taxId || 'N/A',
                  address: kybData.address || kybData.business_address || userData.address || 'N/A',
                  country: kybData.country || kybData.jurisdiction || userData.country || 'N/A',
                  contactPerson: userData.displayName || userData.display_name || userData.name || 'N/A',
                  email: userData.email || 'N/A',
                  phone: kybData.phone || userData.phone || 'N/A',
                  website: kybData.website || userData.website || '',
                  businessDescription: kybData.business_description || kybData.businessDescription || 'N/A',
                  documents: kybData.kyb_docs || kybData.documents || {},
                  kybStatus: kybData.status === 'SUBMITTED' ? 'pending' : (kybData.status?.toLowerCase() || hasKybStatus?.toLowerCase() || 'pending'),
                  submittedAt: kybData.submitted_at || kybData.submittedAt || userData.kybSubmittedAt || serverTimestamp(),
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
                userKybCount++;
                console.log('✅ Synced KYB from user subcollection to organizations for:', userData.email);
              } else if (hasKybStatus || (requiresKyb && hasCompanyName)) {
                // Create from user document data (no subcollection)
                const { setDoc, serverTimestamp } = await import('firebase/firestore');
                const newOrgRef = doc(collection(db, 'organizations'));
                
                // Get KYB status - check multiple variations
                const kybStatusValue = userData.kyb_status || userData.kybStatus || userData.kyb?.status || 'pending';
                const kybStatus = typeof kybStatusValue === 'string' ? kybStatusValue.toLowerCase() : 'pending';
                
                await setDoc(newOrgRef, {
                  userId: userDoc.id,
                  organizationName: userData.company_name || userData.companyName || userData.organizationName || 'Unknown',
                  organizationType: userData.organizationType || userData.business_type || 'N/A',
                  registrationNumber: userData.registrationNumber || userData.registration_number || userData.kyb_reg_number || 'N/A',
                  taxId: userData.taxId || userData.tax_id || 'N/A',
                  address: userData.address || userData.business_address || 'N/A',
                  country: userData.country || 'N/A',
                  contactPerson: userData.displayName || userData.display_name || userData.name || userData.primaryContactName || 'N/A',
                  email: userData.email || 'N/A',
                  phone: userData.phone || userData.phoneNumber || 'N/A',
                  website: userData.website || '',
                  businessDescription: userData.businessDescription || userData.business_description || 'N/A',
                  documents: userData.kyb?.documents || userData.documents || {},
                  kybStatus: kybStatus,
                  submittedAt: userData.kybSubmittedAt || userData.kyb_submitted_at || userData.created_at || userData.createdAt || serverTimestamp(),
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
                userKybCount++;
                console.log('✅ Created KYB doc from user data for:', userData.email, 'Status:', kybStatus);
              }
            } catch (error) {
              console.log('⚠️ Error checking KYB subcollection for', userData.email, ':', error);
            }
          }
        }
        console.log('📊 Synced', userKybCount, 'KYB documents from users');
        
        // Re-fetch organizations after sync
        if (userKybCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const updatedQuery = query(collection(db, 'organizations'));
          totalSnapshot = await getDocs(updatedQuery);
          console.log('📊 Total organizations after sync:', totalSnapshot.size);
        }
      } catch (error) {
        console.error('❌ Error checking user subcollections:', error);
      }
      
      // Fetch all organizations (not just pending) for real-time display
      documents = totalSnapshot.docs.map(doc => {
        const data = doc.data();
        const mapped = {
        id: doc.id,
          organizationName: data.organizationName || data.company_name || 'N/A',
          organizationType: data.organizationType || data.business_type || 'N/A',
          registrationNumber: data.registrationNumber || data.registration_number || data.kyb_reg_number || 'N/A',
          taxId: data.taxId || data.tax_id || 'N/A',
          address: data.address || data.business_address || 'N/A',
          country: data.country || 'N/A',
          contactPerson: data.contactPerson || data.contact_person || 'N/A',
          email: data.email || 'N/A',
          phone: data.phone || 'N/A',
          website: data.website || '',
          businessDescription: data.businessDescription || data.business_description || 'N/A',
          documents: data.documents || {},
          kybStatus: (() => {
            // Prioritize actual status over "not_submitted" (case-insensitive)
            const kybStatusNested = data.kyb?.status;
            const kybStatusTop = data.kybStatus;
            const kyb_statusField = data.kyb_status;
            
            // Normalize all statuses to lowercase for comparison
            const normalizeStatus = (status: any): string => {
              if (!status) return '';
              const normalized = String(status).toLowerCase().trim();
              // Handle variations
              if (normalized === 'not_submitted' || normalized === 'notsubmitted' || normalized === 'not submitted') {
                return 'not_submitted';
              }
              return normalized;
            };
            
            const nestedNormalized = normalizeStatus(kybStatusNested);
            const topNormalized = normalizeStatus(kybStatusTop);
            const fieldNormalized = normalizeStatus(kyb_statusField);
            
            // If nested status exists and is not "not_submitted", use it
            if (nestedNormalized && nestedNormalized !== 'not_submitted') {
              return nestedNormalized as 'pending' | 'approved' | 'rejected' | 'skipped';
            } else if (topNormalized && topNormalized !== 'not_submitted') {
              return topNormalized as 'pending' | 'approved' | 'rejected' | 'skipped';
            } else if (fieldNormalized && fieldNormalized !== 'not_submitted') {
              return fieldNormalized as 'pending' | 'approved' | 'rejected' | 'skipped';
            } else {
              // If all are "not_submitted" but there's a submittedAt timestamp, treat as pending
              if (data.submittedAt || data.createdAt) {
                return 'pending' as 'pending' | 'approved' | 'rejected' | 'skipped';
              }
              // Default to pending if no status found
              return 'pending' as 'pending' | 'approved' | 'rejected' | 'skipped';
            }
          })(),
          submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
          reviewedBy: data.reviewedBy,
          rejectionReason: data.rejectionReason
        } as KYBDocument;
        console.log('📄 Mapped KYB doc:', mapped.id, mapped.organizationName, mapped.kybStatus);
        return mapped;
      });
      
      // Remove duplicate query code - use data we already fetched
      setKybDocuments(documents);
      
      // Calculate stats from the documents we already have
      const total = documents.length;
      const pending = documents.filter(d => d.kybStatus === 'pending').length;
      const approved = documents.filter(d => d.kybStatus === 'approved').length;
      const rejected = documents.filter(d => d.kybStatus === 'rejected').length;
      const skipped = documents.filter(d => d.kybStatus === 'skipped').length;
      
      setStats({ total, pending, approved, rejected, skipped });
      console.log('✅ KYB documents loaded successfully:', { total, pending, approved, rejected, skipped });
    } catch (error: any) {
      console.error('❌ Error loading KYB documents:', error?.code || error?.message);
    }
  };

  // Helper function to sync user KYB data to organizations collection
  const syncUserToOrganization = async (userDoc: any, userData: any) => {
    try {
      const { ensureDb } = await import('@/lib/firebase-utils');
      const { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } = await import('firebase/firestore');
      
      const db = ensureDb();
      if (!db) return;
      
      // Check if organization already exists for this user
      const orgsQuery = query(collection(db, 'organizations'), where('userId', '==', userDoc.id));
      const orgsSnapshot = await getDocs(orgsQuery);
      
      // Check if user has KYB data
      const hasKybStatus = userData.kybStatus || userData.kyb?.status;
      const hasCompanyName = userData.companyName || userData.company_name;
      const requiresKyb = ['vc', 'exchange', 'ido', 'agency'].includes(userData.role);
      
      if (!hasKybStatus && !(requiresKyb && hasCompanyName)) {
        return; // No KYB data to sync
      }
      
      // Get KYB status - normalize to lowercase
      const kybStatusValue = userData.kybStatus || userData.kyb?.status || 'pending';
      let kybStatus = typeof kybStatusValue === 'string' ? kybStatusValue.toLowerCase() : 'pending';
      
      // Normalize status values
      if (kybStatus === 'not_submitted' || kybStatus === 'notsubmitted' || kybStatus === 'not submitted') {
        // If user has submitted KYB (has kybSubmittedAt or kyb.submittedAt), change to pending
        if (userData.kybSubmittedAt || userData.kyb?.submittedAt) {
          kybStatus = 'pending';
        } else {
          return; // Skip if truly not submitted
        }
      }
      
      // Ensure status is valid
      if (!['pending', 'approved', 'rejected', 'skipped'].includes(kybStatus)) {
        kybStatus = 'pending';
      }
      
      if (orgsSnapshot.empty) {
        // Create new organization document
        const newOrgRef = doc(collection(db, 'organizations'));
        await setDoc(newOrgRef, {
          userId: userDoc.id,
          organizationName: userData.companyName || userData.company_name || userData.organizationName || 'Unknown',
          organizationType: userData.organizationType || userData.business_type || 'N/A',
          registrationNumber: userData.registrationNumber || userData.registration_number || userData.kyb_reg_number || 'N/A',
          taxId: userData.taxId || userData.tax_id || 'N/A',
          address: userData.address || userData.business_address || 'N/A',
          country: userData.country || 'N/A',
          contactPerson: userData.displayName || userData.display_name || userData.name || userData.primaryContactName || 'N/A',
          email: userData.email || 'N/A',
          phone: userData.phone || userData.phoneNumber || 'N/A',
          website: userData.website || userData.kyb?.website || '',
          businessDescription: userData.businessDescription || userData.business_description || 'N/A',
          documents: userData.kyb?.documents || userData.documents || {},
          kybStatus: kybStatus,
          submittedAt: userData.kybSubmittedAt || userData.kyb?.submittedAt || userData.created_at || userData.createdAt || serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('✅ Synced new KYB from user to organizations:', userData.email);
      } else {
        // Update existing organization document
        const orgDoc = orgsSnapshot.docs[0];
        const orgRef = doc(db, 'organizations', orgDoc.id);
        const orgData = orgDoc.data();
        
        // Always update if status is different (case-insensitive check)
        const currentStatus = (orgData.kybStatus || '').toLowerCase();
        const needsUpdate = currentStatus !== kybStatus || 
                           !orgData.organizationName || 
                           orgData.organizationName === 'Unknown' ||
                           currentStatus === 'not_submitted' ||
                           currentStatus === 'notsubmitted';
        
        if (needsUpdate) {
          // Use updateDoc instead of setDoc with merge to ensure status is overwritten
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(orgRef, {
            organizationName: userData.companyName || userData.company_name || orgData.organizationName || 'Unknown',
            organizationType: userData.organizationType || userData.business_type || orgData.organizationType || 'N/A',
            registrationNumber: userData.registrationNumber || userData.registration_number || orgData.registrationNumber || 'N/A',
            taxId: userData.taxId || userData.tax_id || orgData.taxId || 'N/A',
            address: userData.address || userData.business_address || orgData.address || 'N/A',
            country: userData.country || orgData.country || 'N/A',
            contactPerson: userData.displayName || userData.display_name || userData.name || orgData.contactPerson || 'N/A',
            email: userData.email || orgData.email || 'N/A',
            phone: userData.phone || userData.phoneNumber || orgData.phone || 'N/A',
            website: userData.website || userData.kyb?.website || orgData.website || '',
            businessDescription: userData.businessDescription || userData.business_description || orgData.businessDescription || 'N/A',
            kybStatus: kybStatus, // Explicitly set status to ensure it's updated
            updatedAt: serverTimestamp()
          });
          console.log('✅ Updated KYB in organizations:', userData.email, 'Status:', currentStatus, '->', kybStatus);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing user to organization:', error);
    }
  };

  // Setup real-time updates for KYB documents
  const setupRealtimeUpdates = async () => {
    if (!user) return;

    try {
      console.log('🔄 Setting up real-time KYB updates...');
      
      const { ensureDb, waitForFirebase, createSnapshotErrorHandler } = await import('@/lib/firebase-utils');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return undefined;
      }
      
      const firestoreDb = ensureDb();
      if (!firestoreDb) {
        console.error('❌ Firebase database not initialized');
        return undefined;
      }
      
      const { onSnapshot, collection, query, orderBy, where, getDocs, doc } = await import('firebase/firestore');
      
      // Listen for organizations collection changes
      const organizationsCollection = collection(firestoreDb, 'organizations');
      
      // Also listen to users collection for new KYB submissions
      const usersCollection = collection(firestoreDb, 'users');
      
      // Try with orderBy first, fallback to simple query if it fails
      let kybUnsubscribe: (() => void) | undefined;
      let usersUnsubscribe: (() => void) | undefined;
      
      try {
        // Try query with orderBy
        const kybQuery = query(organizationsCollection, orderBy('createdAt', 'desc'));
        kybUnsubscribe = onSnapshot(
          kybQuery,
          (snapshot) => {
            console.log('📊 KYB organizations updated in real-time:', snapshot.size, 'organizations');
            
            const documents: KYBDocument[] = snapshot.docs.map(doc => {
              const data = doc.data();
              
              // Normalize status (same logic as in loadKYBDocuments)
              const normalizeStatus = (status: any): string => {
                if (!status) return '';
                const normalized = String(status).toLowerCase().trim();
                if (normalized === 'not_submitted' || normalized === 'notsubmitted' || normalized === 'not submitted') {
                  return 'not_submitted';
                }
                return normalized;
              };
              
              const kybStatusNested = normalizeStatus(data.kyb?.status);
              const kybStatusTop = normalizeStatus(data.kybStatus);
              const kyb_statusField = normalizeStatus(data.kyb_status);
              
              let finalStatus = 'pending';
              if (kybStatusNested && kybStatusNested !== 'not_submitted') {
                finalStatus = kybStatusNested;
              } else if (kybStatusTop && kybStatusTop !== 'not_submitted') {
                finalStatus = kybStatusTop;
              } else if (kyb_statusField && kyb_statusField !== 'not_submitted') {
                finalStatus = kyb_statusField;
              } else if (data.submittedAt || data.createdAt) {
                finalStatus = 'pending'; // If submitted but status is not_submitted, treat as pending
              }
              
              return {
                id: doc.id,
                organizationName: data.organizationName || data.company_name || 'N/A',
                organizationType: data.organizationType || data.business_type || 'N/A',
                registrationNumber: data.registrationNumber || data.registration_number || data.kyb_reg_number || 'N/A',
                taxId: data.taxId || data.tax_id || 'N/A',
                address: data.address || data.business_address || 'N/A',
                country: data.country || 'N/A',
                contactPerson: data.contactPerson || data.contact_person || 'N/A',
                email: data.email || 'N/A',
                phone: data.phone || 'N/A',
                website: data.website || '',
                businessDescription: data.businessDescription || data.business_description || 'N/A',
                documents: data.documents || {},
                kybStatus: finalStatus as 'pending' | 'approved' | 'rejected' | 'skipped',
                submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
                reviewedBy: data.reviewedBy,
                rejectionReason: data.rejectionReason
              } as KYBDocument;
            });
            
            setKybDocuments(documents);
            
            // Calculate stats
            const total = documents.length;
            const pending = documents.filter(d => d.kybStatus === 'pending').length;
            const approved = documents.filter(d => d.kybStatus === 'approved').length;
            const rejected = documents.filter(d => d.kybStatus === 'rejected').length;
            const skipped = documents.filter(d => d.kybStatus === 'skipped').length;
            
            setStats({ total, pending, approved, rejected, skipped });
            
            console.log('✅ Real-time KYB updates active -', documents.length, 'organizations');
          },
          (error) => {
            console.error('❌ Error in real-time KYB updates:', error);
            // If orderBy fails, try without orderBy
            console.log('🔄 Retrying without orderBy...');
            const fallbackUnsubscribe = onSnapshot(
              organizationsCollection,
              (snapshot) => {
                console.log('📊 KYB organizations updated in real-time (fallback):', snapshot.size, 'organizations');
                
                const documents: KYBDocument[] = snapshot.docs
                  .map(doc => {
                    const data = doc.data();
                    
                    // Normalize status (same logic as in loadKYBDocuments)
                    const normalizeStatus = (status: any): string => {
                      if (!status) return '';
                      const normalized = String(status).toLowerCase().trim();
                      if (normalized === 'not_submitted' || normalized === 'notsubmitted' || normalized === 'not submitted') {
                        return 'not_submitted';
                      }
                      return normalized;
                    };
                    
                    const kybStatusNested = normalizeStatus(data.kyb?.status);
                    const kybStatusTop = normalizeStatus(data.kybStatus);
                    const kyb_statusField = normalizeStatus(data.kyb_status);
                    
                    let finalStatus = 'pending';
                    if (kybStatusNested && kybStatusNested !== 'not_submitted') {
                      finalStatus = kybStatusNested;
                    } else if (kybStatusTop && kybStatusTop !== 'not_submitted') {
                      finalStatus = kybStatusTop;
                    } else if (kyb_statusField && kyb_statusField !== 'not_submitted') {
                      finalStatus = kyb_statusField;
                    } else if (data.submittedAt || data.createdAt) {
                      finalStatus = 'pending'; // If submitted but status is not_submitted, treat as pending
                    }
                    
                    return {
                      id: doc.id,
                      organizationName: data.organizationName || data.company_name || 'N/A',
                      organizationType: data.organizationType || data.business_type || 'N/A',
                      registrationNumber: data.registrationNumber || data.registration_number || data.kyb_reg_number || 'N/A',
                      taxId: data.taxId || data.tax_id || 'N/A',
                      address: data.address || data.business_address || 'N/A',
                      country: data.country || 'N/A',
                      contactPerson: data.contactPerson || data.contact_person || 'N/A',
                      email: data.email || 'N/A',
                      phone: data.phone || 'N/A',
                      website: data.website || '',
                      businessDescription: data.businessDescription || data.business_description || 'N/A',
                      documents: data.documents || {},
                      kybStatus: finalStatus as 'pending' | 'approved' | 'rejected' | 'skipped',
                      submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                      reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
                      reviewedBy: data.reviewedBy,
                      rejectionReason: data.rejectionReason
                    } as KYBDocument;
                  })
                  .sort((a, b) => {
                    // Sort by submittedAt descending manually
                    const dateA = new Date(a.submittedAt).getTime();
                    const dateB = new Date(b.submittedAt).getTime();
                    return dateB - dateA;
                  });
                
                setKybDocuments(documents);
                
                // Calculate stats
                const total = documents.length;
                const pending = documents.filter(d => d.kybStatus === 'pending').length;
                const approved = documents.filter(d => d.kybStatus === 'approved').length;
                const rejected = documents.filter(d => d.kybStatus === 'rejected').length;
                const skipped = documents.filter(d => d.kybStatus === 'skipped').length;
                
                setStats({ total, pending, approved, rejected, skipped });
                
                console.log('✅ Real-time KYB updates active (fallback) -', documents.length, 'organizations');
              },
              (fallbackError) => {
                console.error('❌ Error in fallback real-time KYB updates:', fallbackError);
              }
            );
            kybUnsubscribe = fallbackUnsubscribe;
          }
        );
      } catch (error) {
        console.error('❌ Error setting up KYB query:', error);
        // Fallback to simple query without orderBy
        kybUnsubscribe = onSnapshot(
          organizationsCollection,
          (snapshot) => {
            console.log('📊 KYB organizations updated in real-time (simple query):', snapshot.size, 'organizations');
            
            const documents: KYBDocument[] = snapshot.docs
              .map(doc => {
                const data = doc.data();
                
                // Normalize status (same logic as in loadKYBDocuments)
                const normalizeStatus = (status: any): string => {
                  if (!status) return '';
                  const normalized = String(status).toLowerCase().trim();
                  if (normalized === 'not_submitted' || normalized === 'notsubmitted' || normalized === 'not submitted') {
                    return 'not_submitted';
                  }
                  return normalized;
                };
                
                const kybStatusNested = normalizeStatus(data.kyb?.status);
                const kybStatusTop = normalizeStatus(data.kybStatus);
                const kyb_statusField = normalizeStatus(data.kyb_status);
                
                let finalStatus = 'pending';
                if (kybStatusNested && kybStatusNested !== 'not_submitted') {
                  finalStatus = kybStatusNested;
                } else if (kybStatusTop && kybStatusTop !== 'not_submitted') {
                  finalStatus = kybStatusTop;
                } else if (kyb_statusField && kyb_statusField !== 'not_submitted') {
                  finalStatus = kyb_statusField;
                } else if (data.submittedAt || data.createdAt) {
                  finalStatus = 'pending'; // If submitted but status is not_submitted, treat as pending
                }
                
                return {
                  id: doc.id,
                  organizationName: data.organizationName || data.company_name || 'N/A',
                  organizationType: data.organizationType || data.business_type || 'N/A',
                  registrationNumber: data.registrationNumber || data.registration_number || data.kyb_reg_number || 'N/A',
                  taxId: data.taxId || data.tax_id || 'N/A',
                  address: data.address || data.business_address || 'N/A',
                  country: data.country || 'N/A',
                  contactPerson: data.contactPerson || data.contact_person || 'N/A',
                  email: data.email || 'N/A',
                  phone: data.phone || 'N/A',
                  website: data.website || '',
                  businessDescription: data.businessDescription || data.business_description || 'N/A',
                  documents: data.documents || {},
                  kybStatus: finalStatus as 'pending' | 'approved' | 'rejected' | 'skipped',
                  submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                  reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
                  reviewedBy: data.reviewedBy,
                  rejectionReason: data.rejectionReason
                } as KYBDocument;
              })
              .sort((a, b) => {
                // Sort by submittedAt descending manually
                const dateA = new Date(a.submittedAt).getTime();
                const dateB = new Date(b.submittedAt).getTime();
                return dateB - dateA;
              });
            
            setKybDocuments(documents);
            
            // Calculate stats
            const total = documents.length;
            const pending = documents.filter(d => d.kybStatus === 'pending').length;
            const approved = documents.filter(d => d.kybStatus === 'approved').length;
            const rejected = documents.filter(d => d.kybStatus === 'rejected').length;
            const skipped = documents.filter(d => d.kybStatus === 'skipped').length;
            
            setStats({ total, pending, approved, rejected, skipped });
            
            console.log('✅ Real-time KYB updates active (simple query) -', documents.length, 'organizations');
          },
          (simpleError) => {
            console.error('❌ Error in simple KYB query:', simpleError);
          }
        );
      }
      
      // Setup listener for users collection to auto-sync KYB submissions
      // Only listen to changes (not initial load) to avoid duplicate syncing
      try {
        let isInitialLoad = true;
        usersUnsubscribe = onSnapshot(
          usersCollection,
          async (snapshot) => {
            // Skip initial load - we already sync in loadKYBDocuments
            if (isInitialLoad) {
              isInitialLoad = false;
              return;
            }
            
            console.log('👥 Users collection updated, checking for new KYB submissions...');
            
            // Only check changed documents
            snapshot.docChanges().forEach(async (change) => {
              if (change.type === 'added' || change.type === 'modified') {
                const userData = change.doc.data();
                const hasKybStatus = userData.kybStatus || userData.kyb?.status;
                const requiresKyb = ['vc', 'exchange', 'ido', 'agency'].includes(userData.role);
                
                if (hasKybStatus || requiresKyb) {
                  await syncUserToOrganization(change.doc, userData);
                }
              }
            });
          },
          (error) => {
            console.error('❌ Error in users collection listener:', error);
          }
        );
        console.log('✅ Users collection listener active for KYB auto-sync');
      } catch (error) {
        console.error('❌ Error setting up users listener:', error);
      }
      
      // Return cleanup function for both listeners
      return () => {
        if (kybUnsubscribe) {
          kybUnsubscribe();
        }
        if (usersUnsubscribe) {
          usersUnsubscribe();
        }
      };
    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
      return undefined;
    }
  };

  // Setup real-time updates with proper cleanup
  useEffect(() => {
    if (!user) return;

      let unsubscribe: (() => void) | undefined;
      
    const setup = async () => {
      unsubscribe = await setupRealtimeUpdates();
    };

    setup();
      
      return () => {
        if (unsubscribe) {
        console.log('🔄 Cleaning up KYB real-time updates...');
          unsubscribe();
        }
      };
  }, [user]);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected', reason?: string) => {
    try {
      setIsUpdating(true);
      
      // Import Firebase utilities
      const { ensureDb, waitForFirebase } = await import('@/lib/firebase-utils');
      
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
      
      const { doc, updateDoc, serverTimestamp, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');
      
      const kybRef = doc(firestoreDb, 'organizations', id);
      const updateData: any = { 
        kybStatus: newStatus, 
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid || user?.email || 'admin',
        updatedAt: serverTimestamp()
      };
      
      if (reason) {
        updateData.rejectionReason = reason;
      } else if (newStatus === 'approved') {
        updateData.rejectionReason = null;
      }
      
      await updateDoc(kybRef, updateData);
      
      // Also update user document if we can find the user by organization
      try {
        const orgDoc = await getDoc(kybRef);
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const userEmail = orgData.email;
          const userId = orgData.userId || orgData.user_id; // Try userId first (more reliable)
          
          console.log('🔍 [Admin KYB] Looking up user:', { userId, userEmail, orgId: id });
          
          let userRef: any = null;
          
          // Try to find user by userId first (most reliable)
          if (userId) {
            try {
              const userDocRef = doc(firestoreDb, 'users', userId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                userRef = userDocRef;
                console.log(`✅ Found user by userId: ${userId}`);
              }
            } catch (userIdError) {
              console.log('⚠️ Could not find user by userId:', userIdError);
            }
          }
          
          // Fallback: Find user by email if userId didn't work
          if (!userRef && userEmail) {
            const usersQuery = query(collection(firestoreDb, 'users'), where('email', '==', userEmail));
            const usersSnapshot = await getDocs(usersQuery);
            
            if (!usersSnapshot.empty) {
              userRef = doc(firestoreDb, 'users', usersSnapshot.docs[0].id);
              console.log(`✅ Found user by email: ${userEmail}`);
            }
          }
          
          if (userRef) {
            // Get current user data
            const userDocSnap = await getDoc(userRef);
            const currentUserData = userDocSnap.exists() ? userDocSnap.data() : {};
            
            // Normalize status to lowercase for consistency
            const normalizedStatus = newStatus.toLowerCase();
            
            // Update ALL possible status fields to ensure it's recognized
            const userUpdateData: any = {
              kybStatus: normalizedStatus,
              kyb_status: normalizedStatus,
              updated_at: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastUpdated: serverTimestamp()
            };
            
            // Update nested kyb object if it exists
            if (currentUserData && typeof currentUserData === 'object' && 'kyb' in currentUserData && currentUserData.kyb) {
              userUpdateData.kyb = {
                ...(currentUserData.kyb as any),
                status: normalizedStatus
              };
            } else {
              // Create kyb object if it doesn't exist
              const submittedAt = (currentUserData && typeof currentUserData === 'object' && 'kybSubmittedAt' in currentUserData) 
                ? (currentUserData as any).kybSubmittedAt 
                : serverTimestamp();
              
              userUpdateData.kyb = {
                status: normalizedStatus,
                submittedAt: submittedAt,
                reviewedAt: serverTimestamp(),
                reviewedBy: user?.uid || user?.email || 'admin'
              };
            }
            
            // If approved, also set profileCompleted to true
            if (normalizedStatus === 'approved') {
              userUpdateData.profileCompleted = true;
            }
            
            await updateDoc(userRef, userUpdateData);
            console.log(`✅ Updated user document - Status set to: ${normalizedStatus}`, {
              userId: userRef.id,
              email: userEmail,
              updatedFields: Object.keys(userUpdateData)
            });
          } else {
            console.warn(`⚠️ Could not find user document for email: ${userEmail}, userId: ${userId}`);
          }
        }
      } catch (userUpdateError) {
        console.error('❌ Error updating user document:', userUpdateError);
      }
      
      // Automatically store on-chain after approval, then delete for user safety
      if (newStatus === 'approved') {
        try {
          console.log('🔗 Storing KYB data on BNB Chain...');
          const orgDoc = await getDoc(kybRef);
          const orgData = orgDoc.exists() ? orgDoc.data() : {};
          const userId = orgData.userId || orgData.user_id;
          
          // Get auth token for API authentication
          const { auth } = await import('@/lib/firebase.client');
          const { getIdToken } = await import('firebase/auth');
          const authToken = user && auth?.currentUser ? await getIdToken(auth.currentUser) : null;
          
          const storeResponse = await fetch('/api/kyb/store-on-chain', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            },
            body: JSON.stringify({
              userId: userId,
              orgId: id,
              approvalStatus: true,
            }),
          });

          if (storeResponse.ok) {
            const storeResult = await storeResponse.json();
            console.log('✅ KYB data stored on-chain:', storeResult.txHash);
            console.log('🔗 View transaction:', storeResult.explorerUrl);
            
            // Update document with on-chain info
            await updateDoc(kybRef, {
              onChainTxHash: storeResult.txHash,
              onChainStoredAt: serverTimestamp(),
            });

            // SECURITY: Automatically delete on-chain data after approval for user privacy
            try {
              console.log('🗑️ Deleting KYB data from BNB Chain for user safety...');
              const deleteResponse = await fetch('/api/kyb/delete-on-chain', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                },
                body: JSON.stringify({
                  userId: userId,
                  orgId: id,
                }),
              });

              if (deleteResponse.ok) {
                const deleteResult = await deleteResponse.json();
                console.log('✅ KYB data deleted from on-chain:', deleteResult.txHash);
                console.log('🔗 View deletion transaction:', deleteResult.explorerUrl);
                
                // Update document with deletion info
                await updateDoc(kybRef, {
                  onChainDeleted: true,
                  onChainDeleteTxHash: deleteResult.txHash,
                  onChainDeletedAt: serverTimestamp(),
                });
              } else {
                const errorData = await deleteResponse.json();
                console.error('⚠️ Failed to delete KYB on-chain:', errorData);
                // Don't fail the approval if deletion fails - data is already stored
              }
            } catch (deleteError: any) {
              console.error('⚠️ Error deleting KYB on-chain (non-critical):', deleteError);
              // Don't fail the approval if deletion fails
            }
          } else {
            const errorData = await storeResponse.json();
            console.error('⚠️ Failed to store KYB on-chain:', errorData);
            // Don't fail the approval if on-chain storage fails
          }
        } catch (onChainError: any) {
          console.error('⚠️ Error storing KYB on-chain (non-critical):', onChainError);
          // Don't fail the approval if on-chain storage fails
        }
      }
      
      console.log(`✅ KYB document ${id} status updated to ${newStatus}`);
      alert(`KYB ${newStatus} successfully!${newStatus === 'approved' ? ' Data stored on BNB Chain.' : ''}`);
      // Real-time listener will update the UI automatically
    } catch (error: any) {
      console.error(`❌ Error updating KYB document ${id} status:`, error);
      alert(`Error updating KYB status: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading KYB documents..." />
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <NeonCyanIcon type="building" size={32} className="text-blue-400" />
                KYB Management
              </h1>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-white/60">Review and manage business verification documents</p>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => router.push('/admin/kyc')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-sm font-semibold"
            >
              KYC Management
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all text-sm font-semibold"
            >
              User Registrations
            </button>
          </div>
        </div>
          </div>
          
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 shadow-cyan-500/10">
        <h2 className="text-xl font-bold mb-4 text-white">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/40 rounded-lg p-4 border border-cyan-400/10">
              <p className="text-cyan-400/70 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-black/40 rounded-lg p-4 border border-cyan-400/10">
              <p className="text-cyan-400/70 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <div className="bg-black/40 rounded-lg p-4 border border-cyan-400/10">
              <p className="text-cyan-400/70 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
            </div>
            <div className="bg-black/40 rounded-lg p-4 border border-cyan-400/10">
              <p className="text-cyan-400/70 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
          </div>
        </div>
                      </div>

        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl overflow-hidden shadow-cyan-500/10">
          {/* Search Bar */}
          <div className="p-6 border-b border-cyan-400/20">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search organizations by name, email, type, contact person, or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-3 bg-black/60 border-2 border-cyan-400/20 hover:border-cyan-400/50 text-white rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-cyan-400/70">
                Showing {filteredDocuments.length} of {kybDocuments.length} organizations
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/40 border-b border-cyan-400/20">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Organization</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
        {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-cyan-400/70">
                      {searchTerm ? 'No organizations match your search' : 'No KYB organizations found'}
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-t border-cyan-400/20 hover:bg-black/40">
                    <td className="px-6 py-4">
                        <p className="text-white font-medium">{doc.organizationName}</p>
                        <p className="text-cyan-400/70 text-sm">{doc.email}</p>
                    </td>
                      <td className="px-6 py-4 text-gray-300">{doc.organizationType}</td>
                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          doc.kybStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                          doc.kybStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          doc.kybStatus === 'skipped' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {doc.kybStatus?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {/* View Button - Always visible */}
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowDocModal(true);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1 shadow-lg"
                            title="View Details"
                          >
                            <NeonCyanIcon type="eye" size={16} className="text-current" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          
                          {doc.kybStatus === 'pending' && (
                          <>
                        <button
                                onClick={() => handleStatusUpdate(doc.id, 'approved')}
                                className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg flex items-center gap-1"
                          >
                                <NeonCyanIcon type="check" size={16} className="text-current" />
                                <span className="hidden sm:inline">Approve</span>
                        </button>
                        <button
                          onClick={() => {
                                  const reason = prompt('Rejection reason (required):');
                                  if (reason) {
                                    handleStatusUpdate(doc.id, 'rejected', reason);
                                  }
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg flex items-center gap-1"
                              >
                                <NeonCyanIcon type="x-circle" size={16} className="text-current" />
                                <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}
                        {doc.kybStatus === 'skipped' && (
                          <>
                            <button
                                onClick={() => handleStatusUpdate(doc.id, 'approved')}
                                className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg flex items-center gap-1"
                              >
                                <NeonCyanIcon type="check" size={16} className="text-current" />
                                <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason (required):');
                                  if (reason) {
                                    handleStatusUpdate(doc.id, 'rejected', reason);
                                  }
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg flex items-center gap-1"
                              >
                                <NeonCyanIcon type="x-circle" size={16} className="text-current" />
                                <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}
                        {doc.kybStatus === 'approved' && (
                          <>
                            <button
                                onClick={() => handleStatusUpdate(doc.id, 'approved')}
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg flex items-center gap-1"
                              >
                                <NeonCyanIcon type="check" size={16} className="text-current" />
                                <span className="hidden sm:inline">Re-approve</span>
                            </button>
                            <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason (required):');
                                  if (reason) {
                                    handleStatusUpdate(doc.id, 'rejected', reason);
                                  }
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg flex items-center gap-1"
                              >
                                <NeonCyanIcon type="x-circle" size={16} className="text-current" />
                                <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}
                        {doc.kybStatus === 'rejected' && (
                          <>
                            <button
                                onClick={() => handleStatusUpdate(doc.id, 'approved')}
                                className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg flex items-center gap-1"
                              >
                                <NeonCyanIcon type="check" size={16} className="text-current" />
                                <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button
                                onClick={async () => {
                                  if (!confirm('Reset KYB to pending? User will need to resubmit documents.')) return;
                                  try {
                                    const { db: firestoreDb } = await import('@/lib/firebase.client');
                                    const { doc: docFn, updateDoc, serverTimestamp } = await import('firebase/firestore');
                                    if (!firestoreDb) return;
                                    const kybRef = docFn(firestoreDb, 'organizations', doc.id);
                                    await updateDoc(kybRef, { 
                                      kybStatus: 'pending', 
                                      rejectionReason: null,
                                      reviewedAt: null,
                                      reviewedBy: null,
                                      updatedAt: serverTimestamp()
                                    });
                                    alert('KYB reset to pending successfully');
                                  } catch (error) {
                                    console.error('Error resetting KYB:', error);
                                    alert('Error resetting KYB');
                                  }
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg flex items-center gap-1"
                              >
                                <NeonCyanIcon type="arrow-right" size={16} className="text-current" />
                                <span className="hidden sm:inline">Redo</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* KYB Details Modal */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" style={{ zIndex: 100 }}>
          <div className="bg-black/90 backdrop-blur-lg rounded-2xl border-2 border-cyan-400/30 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-500/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-cyan-400/20">
              <div>
                <h2 className="text-2xl font-bold text-white">KYB Details</h2>
                <p className="text-cyan-400/70 text-sm mt-1">{selectedDoc.organizationName}</p>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-cyan-400/70 hover:text-white transition-colors"
              >
                <NeonCyanIcon type="x-circle" size={24} className="text-current" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-400/70 text-sm">Organization Name</label>
                    <p className="text-white font-medium">{selectedDoc.organizationName}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Email</label>
                    <p className="text-white">{selectedDoc.email}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Phone</label>
                    <p className="text-white">{selectedDoc.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Organization Type</label>
                    <p className="text-white">{selectedDoc.organizationType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Registration Number</label>
                    <p className="text-white">{selectedDoc.registrationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Tax ID</label>
                    <p className="text-white">{selectedDoc.taxId || 'N/A'}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-cyan-400/70 text-sm">Address</label>
                    <p className="text-white">{selectedDoc.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Country</label>
                    <p className="text-white">{selectedDoc.country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Contact Person</label>
                    <p className="text-white">{selectedDoc.contactPerson || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Website</label>
                    <p className="text-white">{selectedDoc.website || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedDoc.kybStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                      selectedDoc.kybStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      selectedDoc.kybStatus === 'skipped' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {selectedDoc.kybStatus?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <div>
                    <label className="text-cyan-400/70 text-sm">Submitted At</label>
                    <p className="text-white">
                      {selectedDoc.submittedAt ? new Date(selectedDoc.submittedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Description */}
              {selectedDoc.businessDescription && (
                <div className="mt-6 pt-6 border-t border-cyan-400/20">
                  <label className="text-cyan-400/70 text-sm block mb-2">Business Description</label>
                  <p className="text-white">{selectedDoc.businessDescription}</p>
                </div>
              )}

              {/* Documents */}
              {selectedDoc.documents && Object.keys(selectedDoc.documents).length > 0 && (
                <div className="mt-6 pt-6 border-t border-cyan-400/20">
                  <label className="text-cyan-400/70 text-sm block mb-4">Documents</label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDoc.documents.registrationCertificate && (
                      <a href={selectedDoc.documents.registrationCertificate} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:text-blue-300 underline">
                        Registration Certificate
                      </a>
                    )}
                    {selectedDoc.documents.taxCertificate && (
                      <a href={selectedDoc.documents.taxCertificate} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:text-blue-300 underline">
                        Tax Certificate
                      </a>
                    )}
                    {selectedDoc.documents.bankStatement && (
                      <a href={selectedDoc.documents.bankStatement} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:text-blue-300 underline">
                        Bank Statement
                      </a>
                    )}
                    {selectedDoc.documents.businessLicense && (
                      <a href={selectedDoc.documents.businessLicense} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:text-blue-300 underline">
                        Business License
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedDoc.kybStatus === 'rejected' && selectedDoc.rejectionReason && (
                <div className="mt-6 pt-6 border-t border-cyan-400/20">
                  <label className="text-red-400 text-sm block mb-2">Rejection Reason</label>
                  <p className="text-white bg-red-500/10 p-4 rounded-lg">{selectedDoc.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-cyan-400/20">
              <button
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 bg-black/60 border-2 border-cyan-400/20 hover:border-cyan-400/50 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedDoc.kybStatus === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowDocModal(false);
                      handleStatusUpdate(selectedDoc.id, 'approved');
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <NeonCyanIcon type="check" size={20} className="text-current" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason (required):');
                      if (reason) {
                        setShowDocModal(false);
                        handleStatusUpdate(selectedDoc.id, 'rejected', reason);
                      }
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <NeonCyanIcon type="x-circle" size={20} className="text-current" />
                    Reject
                  </button>
                </>
              )}
              {selectedDoc.kybStatus === 'skipped' && (
                <>
                  <button
                    onClick={() => {
                      setShowDocModal(false);
                      handleStatusUpdate(selectedDoc.id, 'approved');
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <NeonCyanIcon type="check" size={20} className="text-current" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason (required):');
                      if (reason) {
                        setShowDocModal(false);
                        handleStatusUpdate(selectedDoc.id, 'rejected', reason);
                      }
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <NeonCyanIcon type="x-circle" size={20} className="text-current" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
