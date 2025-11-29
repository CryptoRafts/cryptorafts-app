"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { doc, getDoc, setDoc, addDoc, collection, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { acceptProjectClientSide } from '@/lib/acceptProjectClientSide';

// Helper to create icon wrapper
const createIconWrapper = (type: string) => {
  return ({ className }: { className?: string }) => (
    <NeonCyanIcon type={type as any} className={className || "text-current"} size={20} />
  );
};

// Milestone definitions matching pipeline
const MILESTONES = [
  { id: 'kyb_check', label: 'KYB Verification', icon: createIconWrapper('shield') },
  { id: 'dd_started', label: 'Due Diligence Started', icon: createIconWrapper('analytics') },
  { id: 'company_check', label: 'Company Background Check', icon: createIconWrapper('building') },
  { id: 'docs_verified', label: 'All Documents Verified', icon: createIconWrapper('document') },
  { id: 'token_audit', label: 'Smart Contract Audit', icon: createIconWrapper('code') },
  { id: 'ic_approval', label: 'IC Approval Received', icon: createIconWrapper('check') },
  { id: 'term_sheet_sent', label: 'Term Sheet Sent', icon: createIconWrapper('document') },
  { id: 'term_sheet_signed', label: 'Term Sheet Signed', icon: createIconWrapper('check') },
  { id: 'payment_sent', label: 'Payment Sent', icon: createIconWrapper('dollar') },
  { id: 'tokens_received', label: 'Tokens Received', icon: createIconWrapper('dollar') },
  { id: 'portfolio_added', label: 'Added to Portfolio', icon: createIconWrapper('portfolio') }
];

export default function VCProjectDetailPage() {
  const { user, claims, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const autoAction = searchParams?.get('action');
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (authLoading) return;

    if (!user || claims?.role !== 'vc') {
      router.push('/login');
      return;
    }

    if (!projectId) return;

    let unsubscribe: (() => void) | null = null;
    
    loadProject().then((cleanup) => {
      unsubscribe = cleanup || null;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
    }
    };
  }, [user, claims, authLoading, projectId, router]);

  useEffect(() => {
    if (project && autoAction === 'accept' && !actionLoading) {
      handleAcceptProject();
    }
  }, [project, autoAction]);

  const loadProject = async () => {
    if (!projectId || !user) return;

    try {
      setLoading(true);
      
      // Ensure Firebase is ready
      const { waitForFirebase, ensureDb } = await import('@/lib/firebase-utils');
      let isReady = await waitForFirebase(10000);
      if (!isReady) {
        console.warn('⚠️ Firebase not ready, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        isReady = await waitForFirebase(10000);
      }
      
      if (!isReady) {
        setError('Firebase not initialized. Please refresh the page.');
        setLoading(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database not available. Please refresh the page.');
        setLoading(false);
        return;
      }
      
      // Use real-time listener for project updates
      const { doc, onSnapshot, getDoc } = await import('firebase/firestore');
      const projectRef = doc(dbInstance, 'projects', projectId);
      
      // Set up founder listener separately for real-time updates
      // Use a ref-like pattern to store the unsubscribe function
      const founderUnsubscribeRef: { current: (() => void) | null } = { current: null };
      
      const unsubscribe = onSnapshot(projectRef, async (projectDoc) => {
      if (!projectDoc.exists()) {
        setError('Project not found');
        setLoading(false);
        return;
      }

        const rawData = projectDoc.data();
        const projectData: any = { id: projectDoc.id, ...rawData };
        
        // COMPREHENSIVE RAW DATA LOGGING - Log entire structure to understand what we're working with
        // First, log the complete raw data structure (full dump for debugging)
        console.log('🔍 [RAW DATA] COMPLETE PROJECT DATA DUMP:', rawData);
        console.log('🔍 [RAW DATA] Complete project data structure:', {
          projectId: projectDoc.id,
          allTopLevelKeys: Object.keys(rawData || {}),
          hasPitch: !!rawData?.pitch,
          pitchType: typeof rawData?.pitch,
          pitchKeys: rawData?.pitch ? Object.keys(rawData.pitch) : [],
          hasPitchData: !!rawData?.pitch?.data,
          pitchDataType: typeof rawData?.pitch?.data,
          pitchDataKeys: rawData?.pitch?.data ? Object.keys(rawData.pitch.data) : [],
          // Log full structure (truncated for size)
          fullStructure: JSON.stringify(rawData, null, 2).substring(0, 5000),
          // Specific field checks
          documentsCheck: {
            hasDocuments: !!rawData?.documents,
            documentsType: typeof rawData?.documents,
            isArray: Array.isArray(rawData?.documents),
            keys: rawData?.documents && typeof rawData.documents === 'object' && !Array.isArray(rawData.documents) ? Object.keys(rawData.documents) : null,
            sample: rawData?.documents ? JSON.stringify(rawData.documents).substring(0, 1000) : null,
            // Check individual document fields
            hasWhitepaper: !!rawData?.whitepaper || !!rawData?.pitch?.whitepaper || !!rawData?.pitch?.data?.whitepaper,
            hasPitchDeck: !!rawData?.pitchDeck || !!rawData?.pitch?.pitchDeck || !!rawData?.pitch?.data?.pitchDeck,
            hasTokenomics: !!rawData?.tokenomics || !!rawData?.pitch?.tokenomics || !!rawData?.pitch?.data?.tokenomics,
            hasRoadmap: !!rawData?.roadmap || !!rawData?.pitch?.roadmap || !!rawData?.pitch?.data?.roadmap
          },
          teamCheck: {
            hasTeam: !!rawData?.team,
            hasTeamMembers: !!rawData?.teamMembers,
            hasPitchTeam: !!rawData?.pitch?.team,
            hasPitchDataTeam: !!rawData?.pitch?.data?.team,
            hasPitchDataTeamMembers: !!rawData?.pitch?.data?.teamMembers,
            teamType: rawData?.team ? typeof rawData.team : null,
            teamMembersType: rawData?.teamMembers ? typeof rawData.teamMembers : null,
            teamSample: rawData?.team ? (typeof rawData.team === 'string' ? rawData.team.substring(0, 200) : JSON.stringify(rawData.team).substring(0, 500)) : null,
            teamMembersSample: rawData?.teamMembers ? (typeof rawData.teamMembers === 'string' ? rawData.teamMembers.substring(0, 200) : JSON.stringify(rawData.teamMembers).substring(0, 500)) : null
          },
          raftaiCheck: {
            hasRaftai: !!rawData?.raftai,
            hasRaftAI: !!rawData?.raftAI,
            hasAiAnalysis: !!rawData?.aiAnalysis,
            hasPitchRaftai: !!rawData?.pitch?.raftai,
            hasPitchDataRaftai: !!rawData?.pitch?.data?.raftai,
            hasPitchDataRaftAI: !!rawData?.pitch?.data?.raftAI,
            raftaiType: rawData?.raftai ? typeof rawData.raftai : null,
            raftaiKeys: rawData?.raftai && typeof rawData.raftai === 'object' ? Object.keys(rawData.raftai) : null,
            raftaiSample: rawData?.raftai ? JSON.stringify(rawData.raftai).substring(0, 1000) : null
          },
          founderCheck: {
            founderId: rawData?.founderId,
            founderName: rawData?.founderName,
            founderLogo: rawData?.founderLogo
          }
        });
        
        // AGGRESSIVE FIELD SEARCH - Search for any field that might contain document URLs, team data, or RaftAI data
        // Also recursively search nested objects
        console.log('🔍 [AGGRESSIVE SEARCH] Searching all fields for documents, team, and RaftAI data...');
        
        // Recursive function to find all keys in nested objects
        const findAllKeys = (obj: any, prefix = '', maxDepth = 5, currentDepth = 0): string[] => {
          if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') return [];
          const keys: string[] = [];
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              keys.push(fullKey);
              if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                keys.push(...findAllKeys(obj[key], fullKey, maxDepth, currentDepth + 1));
              }
            }
          }
          return keys;
        };
        
        const allKeys = Object.keys(rawData || {});
        const allNestedKeys = findAllKeys(rawData);
        const allKeysCombined = [...new Set([...allKeys, ...allNestedKeys])];
        
        const documentLikeKeys = allKeysCombined.filter(key => 
          key.toLowerCase().includes('doc') || 
          key.toLowerCase().includes('file') || 
          key.toLowerCase().includes('whitepaper') || 
          key.toLowerCase().includes('pitchdeck') || 
          key.toLowerCase().includes('tokenomic') ||
          key.toLowerCase().includes('audit') ||
          key.toLowerCase().includes('financial') ||
          key.toLowerCase().includes('roadmap')
        );
        const teamLikeKeys = allKeysCombined.filter(key => 
          key.toLowerCase().includes('team') || 
          key.toLowerCase().includes('member') || 
          key.toLowerCase().includes('advisor')
        );
        const raftaiLikeKeys = allKeysCombined.filter(key => 
          key.toLowerCase().includes('raft') || 
          key.toLowerCase().includes('ai') || 
          key.toLowerCase().includes('analysis') ||
          key.toLowerCase().includes('score')
        );
        console.log('🔍 [AGGRESSIVE SEARCH] Document-like keys:', documentLikeKeys);
        console.log('🔍 [AGGRESSIVE SEARCH] Team-like keys:', teamLikeKeys);
        console.log('🔍 [AGGRESSIVE SEARCH] RaftAI-like keys:', raftaiLikeKeys);
        
        // Helper to get nested value by path
        const getNestedValue = (obj: any, path: string): any => {
          const parts = path.split('.');
          let current = obj;
          for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
              current = current[part];
            } else {
              return undefined;
            }
          }
          return current;
        };
        
        // Normalize logo - check multiple possible fields
        if (!projectData.logoUrl && !projectData.logo && !projectData.image) {
          projectData.logoUrl = rawData?.logoUrl || rawData?.logo || rawData?.image || rawData?.pitch?.logo || null;
          projectData.logo = projectData.logoUrl;
          projectData.image = projectData.logoUrl;
        }
        
        // Normalize documents - check multiple possible structures (ALWAYS check for updates)
        // First, log what we're working with - comprehensive logging
        console.log('📄 [DOCUMENTS] Raw data check:', {
          hasDocuments: !!rawData?.documents,
          documentsType: typeof rawData?.documents,
          isArray: Array.isArray(rawData?.documents),
          documentsValue: rawData?.documents ? (typeof rawData.documents === 'object' ? Object.keys(rawData.documents) : rawData.documents) : null,
          hasPitch: !!rawData?.pitch,
          hasPitchDocuments: !!rawData?.pitch?.documents,
          hasPitchData: !!rawData?.pitch?.data,
          hasPitchDataDocuments: !!rawData?.pitch?.data?.documents,
          pitchDataDocumentsValue: rawData?.pitch?.data?.documents ? (typeof rawData.pitch.data.documents === 'object' ? Object.keys(rawData.pitch.data.documents) : rawData.pitch.data.documents) : null,
          hasFiles: !!rawData?.files,
          filesType: typeof rawData?.files,
          filesIsArray: Array.isArray(rawData?.files),
          pitchKeys: rawData?.pitch ? Object.keys(rawData.pitch) : [],
          pitchDataKeys: rawData?.pitch?.data ? Object.keys(rawData.pitch.data) : [],
          allKeys: Object.keys(rawData || {}),
          // Log actual document values for debugging
          documentsSample: rawData?.documents ? JSON.stringify(rawData.documents).substring(0, 500) : null,
          pitchDataDocumentsSample: rawData?.pitch?.data?.documents ? JSON.stringify(rawData.pitch.data.documents).substring(0, 500) : null
        });
        
        let documentsData: any = {};
        
        // Helper function to check if a value is a valid document URL
        const isValidDocumentUrl = (value: any): boolean => {
          if (!value) return false;
          // If it's a string URL, it's valid (accept http, https, and relative paths)
          if (typeof value === 'string' && value.trim() !== '') {
            const trimmed = value.trim();
            // Accept http, https, relative paths, and Firebase Storage paths
            if (trimmed.startsWith('http://') || 
                trimmed.startsWith('https://') || 
                trimmed.startsWith('/') || 
                trimmed.startsWith('uploads/') ||
                trimmed.startsWith('gs://') ||
                trimmed.length > 10) { // Accept any non-empty string that looks like a path/URL
              return true;
            }
          }
          // If it's an object, check if it has a URL property
          if (typeof value === 'object' && value !== null) {
            // Check for URL properties
            const url = value.downloadURL || value.fileUrl || value.url || value.downloadUrl || value.fileURL || value.href || value.path;
            if (url && typeof url === 'string' && url.trim() !== '') {
              return true;
            }
            // Check if any property looks like a URL
            const urlProps = Object.values(value).find((val: any) => 
              typeof val === 'string' && val.trim() !== '' && (
                val.startsWith('http://') || 
                val.startsWith('https://') || 
                val.startsWith('/') ||
                val.startsWith('uploads/') ||
                val.startsWith('gs://')
              )
            );
            if (urlProps) {
              return true;
            }
          }
          // If it's a File object or metadata object (has type, size, name but no URL), it's not valid
          if (typeof value === 'object' && value !== null && value.type && value.size && value.name && !value.url && !value.downloadURL && !value.fileUrl) {
            return false;
          }
          return false;
        };
        
        // Helper function to extract URL from a document value
        const extractDocumentUrl = (value: any): string | null => {
          if (!value) return null;
          if (typeof value === 'string' && value.trim() !== '') {
            return value.trim();
          }
          if (typeof value === 'object' && value !== null) {
            // Try multiple possible URL properties
            const url = value.downloadURL || value.fileUrl || value.url || value.downloadUrl || value.fileURL || value.href || value.path;
            if (url && typeof url === 'string' && url.trim() !== '') {
              return url.trim();
            }
            // Try to find any string property that looks like a URL
            const urlProps = Object.values(value).find((val: any) => 
              typeof val === 'string' && val.trim() !== '' && (
                val.startsWith('http://') || 
                val.startsWith('https://') || 
                val.startsWith('/') ||
                val.startsWith('uploads/') ||
                val.startsWith('gs://')
              )
            );
            if (urlProps && typeof urlProps === 'string') {
              return urlProps.trim();
            }
          }
          return null;
        };
        
        // FIRST: Check root-level documents field (most common structure)
        if (rawData?.documents && typeof rawData.documents === 'object' && !Array.isArray(rawData.documents)) {
          console.log('📄 [DOCUMENTS] Found root-level documents object');
          Object.entries(rawData.documents).forEach(([key, value]: [string, any]) => {
            if (isValidDocumentUrl(value)) {
              const url = extractDocumentUrl(value);
              if (url) {
                documentsData[key] = url;
                console.log(`✅ [DOCUMENTS] Added from root documents: ${key} = ${url.substring(0, 100)}`);
              } else {
                console.warn(`⚠️ [DOCUMENTS] Could not extract URL from root documents.${key}:`, value);
              }
            } else {
              console.warn(`⚠️ [DOCUMENTS] Invalid document URL in root documents.${key}:`, value);
            }
          });
        }
        
        // SECOND: Try pitch.data.documents (original pitch submission data) - merge with existing
        if (rawData?.pitch?.data?.documents && typeof rawData.pitch.data.documents === 'object' && !Array.isArray(rawData.pitch.data.documents)) {
          console.log('📄 [DOCUMENTS] Found in pitch.data.documents');
          Object.entries(rawData.pitch.data.documents).forEach(([key, value]: [string, any]) => {
            if (isValidDocumentUrl(value)) {
              const url = extractDocumentUrl(value);
              if (url) {
                // Only add if not already present (root-level takes precedence)
                if (!documentsData[key]) {
                  documentsData[key] = url;
                  console.log(`✅ [DOCUMENTS] Added from pitch.data.documents: ${key} = ${url.substring(0, 100)}`);
                } else {
                  console.log(`ℹ️ [DOCUMENTS] Skipped pitch.data.documents.${key} (already exists from root)`);
                }
              } else {
                console.warn(`⚠️ [DOCUMENTS] Could not extract URL from pitch.data.documents.${key}:`, value);
              }
            } else {
              console.warn(`⚠️ [DOCUMENTS] Invalid document URL in pitch.data.documents.${key}:`, value);
            }
          });
        }
        
        // Try pitch.data.files (files array in pitch.data)
        if (Array.isArray(rawData?.pitch?.data?.files) && rawData.pitch.data.files.length > 0) {
          console.log('📄 [DOCUMENTS] Found in pitch.data.files with', rawData.pitch.data.files.length, 'items');
          rawData.pitch.data.files.forEach((file: any, index: number) => {
            if (file && typeof file === 'object') {
              // Try to determine document type from file properties
              const fileName = file.name || file.fileName || '';
              const fileType = file.type || file.fileType || file.documentType || '';
              const fileUrl = file.url || file.downloadURL || file.fileUrl || file.downloadUrl || file.fileURL || file.href || null;
              
              if (fileUrl && isValidDocumentUrl(fileUrl)) {
                const url = extractDocumentUrl(fileUrl);
                if (url) {
                  // Try to infer document type from filename or type
                  let docKey = fileType || fileName.toLowerCase().replace(/\s+/g, '');
                  if (docKey.includes('whitepaper') || docKey.includes('white')) {
                    docKey = 'whitepaper';
                  } else if (docKey.includes('pitch') || docKey.includes('deck')) {
                    docKey = 'pitchDeck';
                  } else if (docKey.includes('financial') || docKey.includes('projection')) {
                    docKey = 'financials';
                  } else if (docKey.includes('audit')) {
                    docKey = 'auditReport';
                  } else if (docKey.includes('tokenomic') || docKey.includes('token')) {
                    docKey = 'tokenomics';
                  } else if (docKey.includes('legal')) {
                    docKey = 'legalOpinion';
                  } else if (docKey.includes('cap') || docKey.includes('table')) {
                    docKey = 'capTable';
                  } else if (docKey.includes('roadmap')) {
                    docKey = 'roadmap';
                  } else if (docKey.includes('logo')) {
                    docKey = 'projectLogo';
                  } else {
                    // Use index if we can't determine type
                    docKey = `document${index}`;
                  }
                  
                  documentsData[docKey] = url;
                  console.log(`✅ [DOCUMENTS] Added from pitch.data.files: ${docKey}`);
                }
              }
            }
          });
        }
        
        // Also check individual document fields in pitch.data (including all possible field names)
        if (rawData?.pitch?.data) {
          const pitchData = rawData.pitch.data;
          // Check all possible document field names (including URL variants)
          const pitchDataFields = [
            'whitepaper', 'whitepaperUrl', 'whitepaperURL', 'whitepaper_url',
            'pitchDeck', 'pitchdeck', 'pitchDeckUrl', 'pitchdeckUrl', 'pitchDeckURL', 'pitch_deck', 'pitchdeck_url',
            'financials', 'financialProjections', 'financialsUrl', 'financial_projections',
            'auditReport', 'audit', 'auditLink', 'auditUrl', 'audit_report', 'audits',
            'tokenomics', 'tokenEconomics', 'tokenomicsUrl', 'token_economics', 'tokenModel',
            'legalOpinion', 'legalOpinionUrl', 'legal_opinion',
            'capTable', 'capTableUrl', 'cap_table',
            'roadmap', 'roadmapUrl', 'roadmap_url',
            'projectLogo', 'logo', 'image', 'projectLogoUrl', 'logoUrl'
          ];
          pitchDataFields.forEach(field => {
            const value = pitchData[field];
            if (value && isValidDocumentUrl(value)) {
              const url = extractDocumentUrl(value);
              if (url) {
                // Normalize field names to standard keys
                let normalizedKey = field;
                if (field.includes('whitepaper')) normalizedKey = 'whitepaper';
                else if (field.includes('pitch') || field.includes('deck')) normalizedKey = 'pitchDeck';
                else if (field.includes('financial')) normalizedKey = 'financials';
                else if (field.includes('audit')) normalizedKey = 'auditReport';
                else if (field.includes('token') || field.includes('model')) normalizedKey = 'tokenomics';
                else if (field.includes('legal')) normalizedKey = 'legalOpinion';
                else if (field.includes('cap')) normalizedKey = 'capTable';
                else if (field.includes('roadmap')) normalizedKey = 'roadmap';
                else if (field.includes('logo') || field === 'image') normalizedKey = 'projectLogo';
                
                // Only add if not already present (root-level takes precedence)
                if (!documentsData[normalizedKey]) {
                  documentsData[normalizedKey] = url;
                  console.log(`✅ [DOCUMENTS] Added from pitch.data.${field} as ${normalizedKey}:`, url.substring(0, 100));
                }
              }
            }
          });
          
          // Also check if pitch.data itself has a 'files' array or 'documents' object
          if (Array.isArray(pitchData.files) && pitchData.files.length > 0) {
            console.log('📄 [DOCUMENTS] Found pitch.data.files array with', pitchData.files.length, 'items');
            pitchData.files.forEach((file: any, index: number) => {
              if (file && typeof file === 'object') {
                const fileUrl = file.url || file.downloadURL || file.fileUrl || file.downloadUrl || file.fileURL || file.href || file.path;
                if (fileUrl && isValidDocumentUrl(fileUrl)) {
                  const url = extractDocumentUrl(fileUrl);
                  if (url) {
                    // Try to infer document type from filename or type
                    const fileName = file.name || file.fileName || '';
                    const fileType = file.type || file.fileType || file.documentType || '';
                    let docKey = fileType || fileName.toLowerCase().replace(/\s+/g, '');
                    if (docKey.includes('whitepaper') || docKey.includes('white')) docKey = 'whitepaper';
                    else if (docKey.includes('pitch') || docKey.includes('deck')) docKey = 'pitchDeck';
                    else if (docKey.includes('financial') || docKey.includes('projection')) docKey = 'financials';
                    else if (docKey.includes('audit')) docKey = 'auditReport';
                    else if (docKey.includes('tokenomic') || docKey.includes('token')) docKey = 'tokenomics';
                    else if (docKey.includes('legal')) docKey = 'legalOpinion';
                    else if (docKey.includes('cap') || docKey.includes('table')) docKey = 'capTable';
                    else if (docKey.includes('roadmap')) docKey = 'roadmap';
                    else if (docKey.includes('logo')) docKey = 'projectLogo';
                    else docKey = `document${index}`;
                    
                    if (!documentsData[docKey]) {
                      documentsData[docKey] = url;
                      console.log(`✅ [DOCUMENTS] Added from pitch.data.files: ${docKey}`);
                    }
                  }
                }
              }
            });
          }
          
          // AGGRESSIVE: Check ALL fields in pitch.data for document-like values (in case documents are stored as individual fields)
          // This handles cases where pitch.data contains the full body with documents as individual fields
          console.log('🔍 [DOCUMENTS] Aggressively checking all pitch.data fields for document URLs...');
          Object.keys(pitchData).forEach((key) => {
            // Skip fields we've already checked
            if (['documents', 'files', 'team', 'teamMembers', 'raftai', 'raftAI', 'analysis'].includes(key)) {
              return;
            }
            
            const value = pitchData[key];
            // Check if this field looks like it might contain a document URL
            if (value && (typeof value === 'string' || typeof value === 'object')) {
              if (isValidDocumentUrl(value)) {
                const url = extractDocumentUrl(value);
                if (url) {
                  // Try to infer document type from field name
                  const keyLower = key.toLowerCase();
                  let docKey = key;
                  if (keyLower.includes('whitepaper') || keyLower.includes('white')) docKey = 'whitepaper';
                  else if (keyLower.includes('pitch') || keyLower.includes('deck')) docKey = 'pitchDeck';
                  else if (keyLower.includes('financial') || keyLower.includes('projection')) docKey = 'financials';
                  else if (keyLower.includes('audit')) docKey = 'auditReport';
                  else if (keyLower.includes('token') || keyLower.includes('model')) docKey = 'tokenomics';
                  else if (keyLower.includes('legal')) docKey = 'legalOpinion';
                  else if (keyLower.includes('cap') || keyLower.includes('table')) docKey = 'capTable';
                  else if (keyLower.includes('roadmap')) docKey = 'roadmap';
                  else if (keyLower.includes('logo') || keyLower === 'image') docKey = 'projectLogo';
                  
                  // Only add if not already present
                  if (!documentsData[docKey]) {
                    documentsData[docKey] = url;
                    console.log(`✅ [DOCUMENTS] Found document in pitch.data.${key} as ${docKey}:`, url.substring(0, 100));
                  }
                }
              }
            }
          });
        }
        
        // Try pitch.documents
        if (rawData?.pitch?.documents && typeof rawData.pitch.documents === 'object') {
          console.log('📄 [DOCUMENTS] Found in pitch.documents');
          Object.entries(rawData.pitch.documents).forEach(([key, value]: [string, any]) => {
            if (isValidDocumentUrl(value)) {
              const url = extractDocumentUrl(value);
              if (url) {
                documentsData[key] = url;
                console.log(`✅ [DOCUMENTS] Added from pitch.documents: ${key}`);
              }
            }
          });
        }
        
        // Try files array (common structure from API route)
        if (Array.isArray(rawData?.files) && rawData.files.length > 0) {
          console.log('📄 [DOCUMENTS] Found files array with', rawData.files.length, 'items');
          rawData.files.forEach((file: any, index: number) => {
            if (file && typeof file === 'object') {
              // Try to determine document type from file properties
              const fileName = file.name || file.fileName || '';
              const fileType = file.type || file.fileType || '';
              const fileUrl = file.url || file.downloadURL || file.fileUrl || file.downloadUrl || file.fileURL || file.href || null;
              
              if (fileUrl && isValidDocumentUrl(fileUrl)) {
                const url = extractDocumentUrl(fileUrl);
                if (url) {
                  // Try to infer document type from filename or type
                  let docKey = fileType || fileName.toLowerCase().replace(/\s+/g, '');
                  if (docKey.includes('whitepaper') || docKey.includes('white')) {
                    docKey = 'whitepaper';
                  } else if (docKey.includes('pitch') || docKey.includes('deck')) {
                    docKey = 'pitchDeck';
                  } else if (docKey.includes('financial') || docKey.includes('projection')) {
                    docKey = 'financials';
                  } else if (docKey.includes('audit')) {
                    docKey = 'auditReport';
                  } else if (docKey.includes('tokenomic') || docKey.includes('token')) {
                    docKey = 'tokenomics';
                  } else if (docKey.includes('legal')) {
                    docKey = 'legalOpinion';
                  } else if (docKey.includes('cap') || docKey.includes('table')) {
                    docKey = 'capTable';
                  } else if (docKey.includes('roadmap')) {
                    docKey = 'roadmap';
                  } else if (docKey.includes('logo')) {
                    docKey = 'projectLogo';
                  } else {
                    // Use index if we can't determine type
                    docKey = `document${index}`;
                  }
                  
                  documentsData[docKey] = url;
                  console.log(`✅ [DOCUMENTS] Added from files array: ${docKey}`);
                }
              }
            }
          });
        }
        
        // Try documents array
        if (Array.isArray(rawData?.documents)) {
          console.log('📄 [DOCUMENTS] Found documents array with', rawData.documents.length, 'items');
          rawData.documents.forEach((doc: any) => {
            if (doc.type && isValidDocumentUrl(doc.url)) {
              const url = extractDocumentUrl(doc.url);
              if (url) {
                documentsData[doc.type] = url;
                console.log(`✅ [DOCUMENTS] Added from documents array: ${doc.type}`);
              }
            } else if (doc.name && isValidDocumentUrl(doc.url)) {
              const url = extractDocumentUrl(doc.url);
              if (url) {
                const key = doc.name.toLowerCase().replace(/\s+/g, '');
                documentsData[key] = url;
                console.log(`✅ [DOCUMENTS] Added from documents array (by name): ${key}`);
              }
            } else if (doc.key && isValidDocumentUrl(doc.value)) {
              const url = extractDocumentUrl(doc.value);
              if (url) {
                documentsData[doc.key] = url;
                console.log(`✅ [DOCUMENTS] Added from documents array (by key): ${doc.key}`);
              }
            }
          });
        }
        
        // Try individual document fields (merge with existing) - only if valid URLs
        const docsObj: any = { ...documentsData };
        if (rawData?.whitepaper && isValidDocumentUrl(rawData.whitepaper)) {
          const url = extractDocumentUrl(rawData.whitepaper);
          if (url) docsObj.whitepaper = url;
        }
        if (rawData?.whitepaperUrl && isValidDocumentUrl(rawData.whitepaperUrl)) {
          const url = extractDocumentUrl(rawData.whitepaperUrl);
          if (url) docsObj.whitepaper = url;
        }
        if (rawData?.pitchDeck && isValidDocumentUrl(rawData.pitchDeck)) {
          const url = extractDocumentUrl(rawData.pitchDeck);
          if (url) docsObj.pitchDeck = url;
        }
        if (rawData?.pitchDeckUrl && isValidDocumentUrl(rawData.pitchDeckUrl)) {
          const url = extractDocumentUrl(rawData.pitchDeckUrl);
          if (url) docsObj.pitchDeck = url;
        }
        if (rawData?.financials && isValidDocumentUrl(rawData.financials)) {
          const url = extractDocumentUrl(rawData.financials);
          if (url) docsObj.financials = url;
        }
        if (rawData?.financialProjections && isValidDocumentUrl(rawData.financialProjections)) {
          const url = extractDocumentUrl(rawData.financialProjections);
          if (url) docsObj.financials = url;
        }
        if (rawData?.auditReport && isValidDocumentUrl(rawData.auditReport)) {
          const url = extractDocumentUrl(rawData.auditReport);
          if (url) docsObj.auditReport = url;
        }
        if (rawData?.audit && isValidDocumentUrl(rawData.audit)) {
          const url = extractDocumentUrl(rawData.audit);
          if (url) docsObj.auditReport = url;
        }
        if (rawData?.tokenomics && isValidDocumentUrl(rawData.tokenomics)) {
          const url = extractDocumentUrl(rawData.tokenomics);
          if (url) docsObj.tokenomics = url;
        }
        if (rawData?.tokenEconomics && isValidDocumentUrl(rawData.tokenEconomics)) {
          const url = extractDocumentUrl(rawData.tokenEconomics);
          if (url) docsObj.tokenomics = url;
        }
        if (rawData?.legalOpinion && isValidDocumentUrl(rawData.legalOpinion)) {
          const url = extractDocumentUrl(rawData.legalOpinion);
          if (url) docsObj.legalOpinion = url;
        }
        if (rawData?.capTable && isValidDocumentUrl(rawData.capTable)) {
          const url = extractDocumentUrl(rawData.capTable);
          if (url) docsObj.capTable = url;
        }
        if (rawData?.roadmap && isValidDocumentUrl(rawData.roadmap)) {
          const url = extractDocumentUrl(rawData.roadmap);
          if (url) docsObj.roadmap = url;
        }
        if (rawData?.projectLogo && isValidDocumentUrl(rawData.projectLogo)) {
          const url = extractDocumentUrl(rawData.projectLogo);
          if (url) docsObj.projectLogo = url;
        }
        
        // Also check in pitch object
        if (rawData?.pitch) {
          if (rawData.pitch.whitepaper && isValidDocumentUrl(rawData.pitch.whitepaper)) {
            const url = extractDocumentUrl(rawData.pitch.whitepaper);
            if (url && !docsObj.whitepaper) docsObj.whitepaper = url;
          }
          if (rawData.pitch.pitchDeck && isValidDocumentUrl(rawData.pitch.pitchDeck)) {
            const url = extractDocumentUrl(rawData.pitch.pitchDeck);
            if (url && !docsObj.pitchDeck) docsObj.pitchDeck = url;
          }
          if (rawData.pitch.financials && isValidDocumentUrl(rawData.pitch.financials)) {
            const url = extractDocumentUrl(rawData.pitch.financials);
            if (url && !docsObj.financials) docsObj.financials = url;
          }
          if (rawData.pitch.auditReport && isValidDocumentUrl(rawData.pitch.auditReport)) {
            const url = extractDocumentUrl(rawData.pitch.auditReport);
            if (url && !docsObj.auditReport) docsObj.auditReport = url;
          }
          if (rawData.pitch.tokenomics && isValidDocumentUrl(rawData.pitch.tokenomics)) {
            const url = extractDocumentUrl(rawData.pitch.tokenomics);
            if (url && !docsObj.tokenomics) docsObj.tokenomics = url;
          }
          if (rawData.pitch.roadmap && isValidDocumentUrl(rawData.pitch.roadmap)) {
            const url = extractDocumentUrl(rawData.pitch.roadmap);
            if (url && !docsObj.roadmap) docsObj.roadmap = url;
          }
          if (rawData.pitch.projectLogo && isValidDocumentUrl(rawData.pitch.projectLogo)) {
            const url = extractDocumentUrl(rawData.pitch.projectLogo);
            if (url && !docsObj.projectLogo) docsObj.projectLogo = url;
          }
        }
        
        // Also check individual document fields in pitch.data (common structure)
        if (rawData?.pitch?.data) {
          const pitchData = rawData.pitch.data;
          // Check all common document field names in pitch.data
          const pitchDataDocFields = [
            'whitepaper', 'whitepaperUrl', 'pitchDeck', 'pitchDeckUrl', 'pitchdeck',
            'financials', 'financialProjections', 'auditReport', 'audit', 'auditLink',
            'tokenomics', 'tokenEconomics', 'legalOpinion', 'capTable', 'roadmap',
            'projectLogo', 'logo', 'image', 'document', 'documents'
          ];
          
          pitchDataDocFields.forEach((fieldName) => {
            if (pitchData[fieldName] && isValidDocumentUrl(pitchData[fieldName])) {
              const url = extractDocumentUrl(pitchData[fieldName]);
              if (url) {
                // Map field names to standard document keys
                let docKey = fieldName;
                if (fieldName === 'whitepaperUrl') docKey = 'whitepaper';
                else if (fieldName === 'pitchDeckUrl' || fieldName === 'pitchdeck') docKey = 'pitchDeck';
                else if (fieldName === 'financialProjections') docKey = 'financials';
                else if (fieldName === 'audit' || fieldName === 'auditLink') docKey = 'auditReport';
                else if (fieldName === 'tokenEconomics') docKey = 'tokenomics';
                else if (fieldName === 'logo' || fieldName === 'image') docKey = 'projectLogo';
                
                // Only add if not already present (higher priority sources take precedence)
                if (!docsObj[docKey]) {
                  docsObj[docKey] = url;
                  console.log(`✅ [DOCUMENTS] Added from pitch.data.${fieldName} as ${docKey}:`, url.substring(0, 100));
                }
              }
            }
          });
        }
        
        // AGGRESSIVE: Also check document-like keys found in aggressive search (including nested paths)
        if (documentLikeKeys.length > 0) {
          console.log('🔍 [DOCUMENTS] Checking document-like keys from aggressive search:', documentLikeKeys);
          documentLikeKeys.forEach((key) => {
            // Handle both top-level and nested paths
            const value = key.includes('.') ? getNestedValue(rawData, key) : rawData[key];
            if (value && isValidDocumentUrl(value)) {
              const url = extractDocumentUrl(value);
              if (url && !docsObj[key]) {
                // Use the last part of the key as the document key
                const docKey = key.includes('.') ? key.split('.').pop() || key : key;
                if (!docsObj[docKey]) {
                  docsObj[docKey] = url;
                  console.log(`✅ [DOCUMENTS] Added from aggressive search key "${key}" as "${docKey}":`, url.substring(0, 100));
                }
              }
            }
            // Also check if it's an object with nested document fields
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              Object.entries(value).forEach(([nestedKey, nestedValue]: [string, any]) => {
                if (isValidDocumentUrl(nestedValue)) {
                  const url = extractDocumentUrl(nestedValue);
                  if (url && !docsObj[nestedKey]) {
                    docsObj[nestedKey] = url;
                    console.log(`✅ [DOCUMENTS] Added from aggressive search nested "${key}.${nestedKey}":`, url.substring(0, 100));
                  }
                }
              });
            }
          });
        }
        
        // Filter out any invalid entries (File objects, metadata objects without URLs)
        const filteredDocsObj: any = {};
        Object.entries(docsObj).forEach(([key, value]: [string, any]) => {
          // Skip File objects (they have type, size, name but no URL)
          if (value instanceof File) {
            console.warn(`📄 [NORMALIZE] Skipping File object for ${key}:`, value.name);
            return;
          }
          
          // Skip if it's a metadata object without a URL
          if (typeof value === 'object' && value !== null && value.type && value.size && value.name && !value.url && !value.downloadURL && !value.fileUrl) {
            console.warn(`📄 [NORMALIZE] Skipping metadata object without URL for ${key}:`, value);
            return;
          }
          
          if (isValidDocumentUrl(value)) {
            const url = extractDocumentUrl(value);
            if (url) {
              filteredDocsObj[key] = url;
              console.log(`✅ [NORMALIZE] Added document ${key}:`, url);
            } else {
              console.warn(`📄 [NORMALIZE] Could not extract URL for ${key}:`, value);
            }
          } else {
            console.warn(`📄 [NORMALIZE] Filtered out invalid document ${key}:`, value);
          }
        });
        
        // Always set documents (even if empty) to ensure UI updates
        // Ensure documents is always an object (not null/undefined)
        // CRITICAL: If we found documents in aggressive search but filteredDocsObj is empty, 
        // try to extract them directly from the aggressive search results
        if (Object.keys(filteredDocsObj).length === 0 && documentLikeKeys.length > 0) {
          console.log('🔍 [DOCUMENTS] No documents found in standard locations, trying aggressive extraction from document-like keys...');
          documentLikeKeys.forEach((key) => {
            try {
              const value = key.includes('.') ? getNestedValue(rawData, key) : rawData[key];
              if (value) {
                // Try to extract URL from value
                let extractedUrl: string | null = null;
                if (typeof value === 'string' && value.trim().length > 0) {
                  extractedUrl = value.trim();
                } else if (typeof value === 'object' && value !== null) {
                  extractedUrl = value.downloadURL || value.fileUrl || value.url || value.downloadUrl || value.fileURL || value.href || value.path || null;
                  if (!extractedUrl) {
                    // Try to find any string property
                    const urlProps = Object.values(value).find((val: any) => 
                      typeof val === 'string' && val.trim().length > 0
                    );
                    if (urlProps && typeof urlProps === 'string') {
                      extractedUrl = urlProps.trim();
                    }
                  }
                }
                if (extractedUrl && extractedUrl.length > 0) {
                  // Use the last part of the key as the document key, or infer from the key name
                  let docKey = key.includes('.') ? key.split('.').pop() || key : key;
                  // Normalize key name
                  const keyLower = docKey.toLowerCase();
                  if (keyLower.includes('whitepaper') || keyLower.includes('white')) docKey = 'whitepaper';
                  else if (keyLower.includes('pitch') || keyLower.includes('deck')) docKey = 'pitchDeck';
                  else if (keyLower.includes('financial')) docKey = 'financials';
                  else if (keyLower.includes('audit')) docKey = 'auditReport';
                  else if (keyLower.includes('token')) docKey = 'tokenomics';
                  else if (keyLower.includes('legal')) docKey = 'legalOpinion';
                  else if (keyLower.includes('cap')) docKey = 'capTable';
                  else if (keyLower.includes('roadmap')) docKey = 'roadmap';
                  else if (keyLower.includes('logo') || keyLower === 'image') docKey = 'projectLogo';
                  
                  if (!filteredDocsObj[docKey]) {
                    filteredDocsObj[docKey] = extractedUrl;
                    console.log(`✅ [DOCUMENTS] Extracted from aggressive search "${key}" as "${docKey}":`, extractedUrl.substring(0, 100));
                  }
                }
              }
            } catch (e) {
              console.warn(`⚠️ [DOCUMENTS] Error extracting from key "${key}":`, e);
            }
          });
        }
        
        // CRITICAL: Always ensure documents is an object (never null/undefined)
        // This prevents errors when accessing project.documents later
        projectData.documents = filteredDocsObj && typeof filteredDocsObj === 'object' ? filteredDocsObj : {};
        console.log('📄 [DOCUMENTS] Documents normalized:', {
          count: Object.keys(projectData.documents).length,
          keys: Object.keys(projectData.documents),
          documents: projectData.documents,
          // Also log raw document values for debugging
          rawDocumentsCount: rawData?.documents ? (typeof rawData.documents === 'object' && !Array.isArray(rawData.documents) ? Object.keys(rawData.documents).length : 0) : 0,
          rawPitchDataDocumentsCount: rawData?.pitch?.data?.documents ? (typeof rawData.pitch.data.documents === 'object' && !Array.isArray(rawData.pitch.data.documents) ? Object.keys(rawData.pitch.data.documents).length : 0) : 0,
          // Log sample document URLs for debugging
          sampleUrls: Object.entries(projectData.documents).slice(0, 3).map(([key, url]) => ({ key, url: typeof url === 'string' ? url.substring(0, 100) : String(url).substring(0, 100) }))
        });
        
        // Normalize team - check multiple possible structures (ALWAYS check for updates)
        // First, log what we're working with - comprehensive logging
        console.log('👥 [TEAM] Raw data check:', {
          hasTeam: !!rawData?.team,
          teamType: typeof rawData?.team,
          teamIsArray: Array.isArray(rawData?.team),
          teamValue: rawData?.team ? (Array.isArray(rawData.team) ? `Array(${rawData.team.length})` : typeof rawData.team === 'string' ? rawData.team.substring(0, 100) : 'object') : null,
          hasTeamMembers: !!rawData?.teamMembers,
          teamMembersType: typeof rawData?.teamMembers,
          teamMembersValue: rawData?.teamMembers ? (typeof rawData.teamMembers === 'string' ? rawData.teamMembers.substring(0, 200) : Array.isArray(rawData.teamMembers) ? `Array(${rawData.teamMembers.length})` : 'object') : null,
          hasPitch: !!rawData?.pitch,
          hasPitchTeam: !!rawData?.pitch?.team,
          hasPitchData: !!rawData?.pitch?.data,
          hasPitchDataTeamMembers: !!rawData?.pitch?.data?.teamMembers,
          pitchDataTeamMembersValue: rawData?.pitch?.data?.teamMembers ? (typeof rawData.pitch.data.teamMembers === 'string' ? rawData.pitch.data.teamMembers.substring(0, 200) : Array.isArray(rawData.pitch.data.teamMembers) ? `Array(${rawData.pitch.data.teamMembers.length})` : 'object') : null,
          hasMembers: !!rawData?.members,
          hasAdvisors: !!rawData?.advisors,
          advisorsValue: rawData?.advisors ? (typeof rawData.advisors === 'string' ? rawData.advisors.substring(0, 100) : 'object') : null
        });
        
        let teamData: any[] | null = null;
        
        // FIRST: Try root-level teamMembers (most common structure from pitch submission)
        if (rawData?.teamMembers) {
          console.log('👥 [TEAM] Checking root-level teamMembers');
          if (typeof rawData.teamMembers === 'string') {
            try {
              // Try parsing as JSON first
              const parsed = JSON.parse(rawData.teamMembers);
              if (Array.isArray(parsed)) {
                teamData = parsed;
                console.log('👥 [TEAM] Found in root teamMembers (JSON string, array)');
              } else if (typeof parsed === 'object' && parsed !== null) {
                teamData = Object.values(parsed).filter((item: any) => item && typeof item === 'object');
                console.log('👥 [TEAM] Found in root teamMembers (JSON string, object), converted to array');
              }
            } catch (e) {
              // If parsing fails, check if it's comma-separated
              if (rawData.teamMembers.includes(',')) {
                teamData = rawData.teamMembers.split(',').map((name: string) => ({ name: name.trim(), role: 'Team Member' }));
                console.log('👥 [TEAM] Parsed root teamMembers as comma-separated string');
              } else if (rawData.teamMembers.trim() !== '') {
                // Single name
                teamData = [{ name: rawData.teamMembers.trim(), role: 'Team Member' }];
                console.log('👥 [TEAM] Parsed root teamMembers as single name');
              }
            }
          } else if (Array.isArray(rawData.teamMembers)) {
            teamData = rawData.teamMembers;
            console.log('👥 [TEAM] Found in root teamMembers (array)');
          } else if (typeof rawData.teamMembers === 'object' && rawData.teamMembers !== null) {
            teamData = Object.values(rawData.teamMembers).filter((item: any) => item && typeof item === 'object');
            console.log('👥 [TEAM] Found in root teamMembers (object), converted to array');
          }
        }
        
        // SECOND: Try pitch.data.teamMembers (original pitch submission data) - only if not found above
        if (!teamData && rawData?.pitch?.data?.teamMembers) {
          console.log('👥 [TEAM] Checking pitch.data.teamMembers');
          if (typeof rawData.pitch.data.teamMembers === 'string') {
            try {
              const parsed = JSON.parse(rawData.pitch.data.teamMembers);
              if (Array.isArray(parsed)) {
                teamData = parsed;
                console.log('👥 [TEAM] Found in pitch.data.teamMembers (JSON string, array)');
              } else if (typeof parsed === 'object' && parsed !== null) {
                teamData = Object.values(parsed).filter((item: any) => item && typeof item === 'object');
                console.log('👥 [TEAM] Found in pitch.data.teamMembers (JSON string, object), converted to array');
              }
            } catch (e) {
              console.warn('⚠️ [TEAM] Could not parse pitch.data.teamMembers as JSON:', e);
              // If parsing fails, try to see if it's a comma-separated string
              if (rawData.pitch.data.teamMembers.includes(',')) {
                teamData = rawData.pitch.data.teamMembers.split(',').map((name: string) => ({ name: name.trim(), role: 'Team Member' }));
                console.log('👥 [TEAM] Parsed pitch.data.teamMembers as comma-separated string');
              }
            }
          } else if (Array.isArray(rawData.pitch.data.teamMembers)) {
            teamData = rawData.pitch.data.teamMembers;
            console.log('👥 [TEAM] Found in pitch.data.teamMembers (array)');
          } else if (typeof rawData.pitch.data.teamMembers === 'object' && rawData.pitch.data.teamMembers !== null) {
            teamData = Object.values(rawData.pitch.data.teamMembers).filter((item: any) => item && typeof item === 'object');
            console.log('👥 [TEAM] Found in pitch.data.teamMembers (object), converted to array');
          }
        }
        
        // Try pitch.data.team (alternative field name)
        if (!teamData && rawData?.pitch?.data?.team) {
          console.log('👥 [TEAM] Checking pitch.data.team');
          if (Array.isArray(rawData.pitch.data.team)) {
            teamData = rawData.pitch.data.team;
            console.log('👥 [TEAM] Found in pitch.data.team (array)');
          } else if (typeof rawData.pitch.data.team === 'object' && rawData.pitch.data.team !== null) {
            teamData = Object.values(rawData.pitch.data.team).filter((item: any) => item && typeof item === 'object');
            console.log('👥 [TEAM] Found in pitch.data.team (object), converted to array');
          } else if (typeof rawData.pitch.data.team === 'string') {
            try {
              const parsed = JSON.parse(rawData.pitch.data.team);
              if (Array.isArray(parsed)) {
                teamData = parsed;
                console.log('👥 [TEAM] Found in pitch.data.team (JSON string, array)');
              } else if (typeof parsed === 'object' && parsed !== null) {
                teamData = Object.values(parsed).filter((item: any) => item && typeof item === 'object');
                console.log('👥 [TEAM] Found in pitch.data.team (JSON string, object), converted to array');
              }
            } catch (e) {
              console.warn('⚠️ [TEAM] Could not parse pitch.data.team as JSON:', e);
            }
          }
        }
        
        // Try pitch.team
        if (!teamData && rawData?.pitch?.team) {
          if (Array.isArray(rawData.pitch.team)) {
            teamData = rawData.pitch.team;
            console.log('👥 [TEAM] Found in pitch.team (array)');
          } else if (typeof rawData.pitch.team === 'object' && rawData.pitch.team !== null) {
            // If it's an object, try to convert to array
            teamData = Object.values(rawData.pitch.team).filter((item: any) => item && typeof item === 'object');
            console.log('👥 [TEAM] Found in pitch.team (object), converted to array');
          }
        }
        // Try teamMembers string (JSON)
        if (!teamData && rawData?.teamMembers) {
          if (typeof rawData.teamMembers === 'string') {
            try {
              const parsed = JSON.parse(rawData.teamMembers);
              if (Array.isArray(parsed)) {
                teamData = parsed;
                console.log('👥 [TEAM] Found in teamMembers (JSON string)');
              } else if (typeof parsed === 'object' && parsed !== null) {
                teamData = Object.values(parsed).filter((item: any) => item && typeof item === 'object');
                console.log('👥 [TEAM] Found in teamMembers (JSON object), converted to array');
              }
            } catch (e) {
              console.warn('⚠️ [TEAM] Could not parse teamMembers as JSON:', e);
              // If parsing fails, try to see if it's a comma-separated string
              if (rawData.teamMembers.includes(',')) {
                teamData = rawData.teamMembers.split(',').map((name: string) => ({ name: name.trim(), role: 'Team Member' }));
                console.log('👥 [TEAM] Parsed teamMembers as comma-separated string');
              }
            }
          } else if (Array.isArray(rawData.teamMembers)) {
            teamData = rawData.teamMembers;
            console.log('👥 [TEAM] Found in teamMembers (array)');
          } else if (typeof rawData.teamMembers === 'object' && rawData.teamMembers !== null) {
            teamData = Object.values(rawData.teamMembers).filter((item: any) => item && typeof item === 'object');
            console.log('👥 [TEAM] Found in teamMembers (object), converted to array');
          }
        }
        // Try team array directly
        if (!teamData && rawData?.team) {
          if (Array.isArray(rawData.team)) {
            teamData = rawData.team;
            console.log('👥 [TEAM] Found in team (array)');
          } else if (typeof rawData.team === 'object' && rawData.team !== null) {
            teamData = Object.values(rawData.team).filter((item: any) => item && typeof item === 'object');
            console.log('👥 [TEAM] Found in team (object), converted to array');
          }
        }
        // Try members array
        if (!teamData && rawData?.members) {
          if (Array.isArray(rawData.members)) {
            teamData = rawData.members;
            console.log('👥 [TEAM] Found in members (array)');
          } else if (typeof rawData.members === 'object' && rawData.members !== null) {
            teamData = Object.values(rawData.members).filter((item: any) => item && typeof item === 'object');
            console.log('👥 [TEAM] Found in members (object), converted to array');
          }
        }
        // Try advisors (sometimes team is stored as advisors)
        if (!teamData && rawData?.advisors) {
          if (Array.isArray(rawData.advisors)) {
            teamData = rawData.advisors;
            console.log('👥 [TEAM] Found in advisors (array)');
          }
        }
        
        // AGGRESSIVE: Also check team-like keys found in aggressive search (including nested paths)
        if (!teamData && teamLikeKeys.length > 0) {
          console.log('🔍 [TEAM] Checking team-like keys from aggressive search:', teamLikeKeys);
          for (const key of teamLikeKeys) {
            // Handle both top-level and nested paths
            const value = key.includes('.') ? getNestedValue(rawData, key) : rawData[key];
            if (value) {
              if (Array.isArray(value) && value.length > 0) {
                teamData = value;
                console.log(`✅ [TEAM] Found in aggressive search key "${key}" (array)`);
                break;
              } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const values = Object.values(value).filter((item: any) => item && typeof item === 'object');
                if (values.length > 0) {
                  teamData = values;
                  console.log(`✅ [TEAM] Found in aggressive search key "${key}" (object, converted to array)`);
                  break;
                }
              } else if (typeof value === 'string' && value.trim() !== '') {
                try {
                  const parsed = JSON.parse(value);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    teamData = parsed;
                    console.log(`✅ [TEAM] Found in aggressive search key "${key}" (JSON string, parsed)`);
                    break;
                  }
                } catch (e) {
                  // Not JSON, try comma-separated
                  if (value.includes(',')) {
                    teamData = value.split(',').map((name: string) => ({ name: name.trim(), role: 'Team Member' }));
                    console.log(`✅ [TEAM] Found in aggressive search key "${key}" (comma-separated string)`);
                    break;
                  }
                }
              }
            }
          }
        }
        
        // Set team data if we found any
        // CRITICAL: Always ensure team is an array (never null/undefined)
        if (teamData && Array.isArray(teamData) && teamData.length > 0) {
          // Normalize each team member to ensure consistent structure
          projectData.team = teamData.map((member: any) => {
            if (typeof member === 'string') {
              // If it's just a string, create a basic member object
              return { name: member, role: 'Team Member' };
            }
            // Ensure member has at least name and role
            return {
              name: member.name || member.fullName || member.memberName || member.displayName || 'Team Member',
              role: member.role || member.position || member.title || 'Team Member',
              bio: member.bio || member.description || member.about || '',
              linkedin: member.linkedin || member.linkedIn || member.linkedInUrl || '',
              image: member.image || member.photo || member.photoURL || member.avatar || null
            };
          });
          console.log('👥 [TEAM] Team data loaded:', {
            count: projectData.team.length,
            members: projectData.team.map((m: any) => ({ name: m.name, role: m.role })),
            // Log first member's full structure for debugging
            firstMember: projectData.team[0] || null
          });
        } else {
          // Ensure team is always an array (even if empty)
          projectData.team = [];
          console.warn('⚠️ [TEAM] No team data found, setting empty array');
        }
        
        // FIRST: Check for founder logo in project document itself (may already be stored there)
        // CRITICAL: Only accept valid HTTPS URLs - never set to Firebase Storage paths
        // IMPORTANT: Always set to null initially to prevent 404 errors from Firebase Storage paths
        projectData.founderLogo = null;
        if (projectData.founderId) {
          // Try to get founder logo from project document fields
          let rawFounderLogo = rawData?.founderLogo || rawData?.founderPhoto || rawData?.founderPhotoURL || null;
          // Validate that it's a valid HTTPS URL (not a Firebase Storage path or relative path)
          if (rawFounderLogo && typeof rawFounderLogo === 'string' && rawFounderLogo.startsWith('https://')) {
            // Additional validation: reject Firebase Storage paths that look like URLs
            if (!rawFounderLogo.includes('firebasestorage.googleapis.com') || rawFounderLogo.includes('?alt=media')) {
              projectData.founderLogo = rawFounderLogo;
              console.log('✅ [FOUNDER LOGO] Found in project document (valid HTTPS URL):', rawFounderLogo.substring(0, 100));
            } else {
              console.log('⚠️ [FOUNDER LOGO] Found in project document but appears to be a Firebase Storage path (rejecting):', rawFounderLogo.substring(0, 100));
              projectData.founderLogo = null;
            }
          } else if (rawFounderLogo) {
            // Reject non-HTTPS URLs (Firebase Storage paths, relative paths, etc.)
            console.log('⚠️ [FOUNDER LOGO] Found in project document but not a valid HTTPS URL (rejecting):', rawFounderLogo.substring(0, 100));
            projectData.founderLogo = null;
          }
        }
        
        // Load founder data if founderId exists - use real-time listener for founder updates
        // Set up founder listener for real-time updates
        if (projectData.founderId) {
          // Clean up previous founder listener
          if (founderUnsubscribeRef.current) {
            founderUnsubscribeRef.current();
            founderUnsubscribeRef.current = null;
          }
          
          const founderRef = doc(dbInstance, 'users', projectData.founderId);
          founderUnsubscribeRef.current = onSnapshot(founderRef, async (founderDoc) => {
            if (founderDoc.exists()) {
              const founderData = founderDoc.data();
              console.log('👤 [FOUNDER] Loaded founder data (real-time):', { 
                id: projectData.founderId, 
                name: founderData?.displayName || founderData?.name,
                photoURL: founderData?.photoURL,
                profilePhotoUrl: founderData?.profilePhotoUrl,
                profile_image_url: founderData?.profile_image_url
              });
              
              // Merge founder data into project
              projectData.founderName = projectData.founderName || founderData?.displayName || founderData?.name || founderData?.companyName || 'Not specified';
              projectData.founderEmail = projectData.founderEmail || founderData?.email || 'Not specified';
              
              // Normalize founder logo - check multiple fields and handle different URL formats
              // Use existing projectData.founderLogo if already set, otherwise try founder document fields
              let founderLogo = projectData.founderLogo || founderData?.photoURL || founderData?.profilePhotoUrl || founderData?.profile_image_url || founderData?.logo || founderData?.avatar || founderData?.profileImageUrl || null;
              
              console.log('🖼️ [FOUNDER LOGO] Initial logo value:', founderLogo);
              
              // Only process if we have a logo value
              let logoLoaded = false;
              if (founderLogo && typeof founderLogo === 'string') {
                // If it's already a full HTTPS URL, use it as is (most common case)
                if (founderLogo.startsWith('https://')) {
                  console.log('✅ [FOUNDER LOGO] Using existing HTTPS URL');
                  logoLoaded = true;
                }
                // If it's HTTP, upgrade to HTTPS or set to null for security
                else if (founderLogo.startsWith('http://')) {
                  // Try to upgrade to HTTPS
                  founderLogo = founderLogo.replace('http://', 'https://');
                  logoLoaded = true;
                  console.log('✅ [FOUNDER LOGO] Upgraded HTTP to HTTPS');
                }
                // If it's a Firebase Storage path or relative path, try to convert to download URL
                // BUT: Only try if we have a reasonable path (not just a filename)
                else if (founderLogo.includes('/') && founderLogo.length > 10) {
                  // Extract the storage path (remove leading slashes)
                  let storagePath = founderLogo.replace(/^\/+/, '').replace(/^vc\/uploads\//, '').replace(/^uploads\//, '');
                  
                  // If it's still a relative path, try common locations
                  if (!storagePath.startsWith('profiles/') && !storagePath.startsWith('avatars/') && !storagePath.startsWith('users/')) {
                    const filename = storagePath.split('/').pop() || 'avatar.png';
                    // Try the most common path first (only one attempt to minimize 404s)
                    storagePath = `profiles/${projectData.founderId}/${filename}`;
                  }
                  
                  // Only make ONE attempt to get download URL to minimize 404 errors
                  try {
                    const { ref, getDownloadURL } = await import('firebase/storage');
                    const { ensureStorage } = await import('@/lib/firebase-utils');
                    const storage = ensureStorage();
                    if (storage) {
                      const storageRef = ref(storage, storagePath);
                      const downloadURL = await getDownloadURL(storageRef);
                      // Verify it's a valid HTTPS URL
                      if (downloadURL && typeof downloadURL === 'string' && downloadURL.startsWith('https://')) {
                        founderLogo = downloadURL;
                        logoLoaded = true;
                        console.log('✅ [FOUNDER LOGO] Successfully loaded from Firebase Storage:', storagePath);
                      }
                    }
                  } catch (storageError: any) {
                    // File doesn't exist - this is expected and fine
                    // Don't log 404 errors to avoid console noise
                    if (storageError?.code !== 'storage/object-not-found' && storageError?.code !== 'storage/unauthorized') {
                      // Only log unexpected errors
                      console.warn('⚠️ [FOUNDER LOGO] Error loading from Firebase Storage:', storageError?.code || storageError?.message);
                    }
                    // Set to null since file doesn't exist
                    founderLogo = null;
                    logoLoaded = false;
                  }
                }
                // If it's just a filename or very short, don't try Firebase Storage (likely doesn't exist)
                else {
                  console.log('⚠️ [FOUNDER LOGO] Invalid path format, setting to null');
                  founderLogo = null;
                  logoLoaded = false;
                }
              }
              
              // CRITICAL: Only accept valid HTTPS URLs - never set to Firebase Storage paths
              // This prevents 404 errors in the browser
              // Firebase Storage download URLs are valid (they start with https://firebasestorage.googleapis.com)
              // But Firebase Storage paths (like "uploads/profiles/...") are NOT valid and should be rejected
              if (!logoLoaded || !founderLogo || typeof founderLogo !== 'string') {
                founderLogo = null;
                console.log('✅ [FOUNDER LOGO] Set to null (not loaded or invalid type)');
              } else if (!founderLogo.startsWith('https://')) {
                // Reject any non-HTTPS URLs (including Firebase Storage paths like "uploads/profiles/...", relative paths, etc.)
                console.log('⚠️ [FOUNDER LOGO] Rejecting non-HTTPS URL:', founderLogo.substring(0, 100));
                founderLogo = null;
              } else {
                // It's an HTTPS URL - check if it's a valid Firebase Storage download URL or any other HTTPS URL
                // Firebase Storage download URLs look like: https://firebasestorage.googleapis.com/v0/b/.../o/...?alt=media&token=...
                // These are valid and should be accepted
                if (founderLogo.includes('firebasestorage.googleapis.com')) {
                  console.log('✅ [FOUNDER LOGO] Valid Firebase Storage download URL');
                } else {
                  console.log('✅ [FOUNDER LOGO] Valid HTTPS URL:', founderLogo.substring(0, 100));
                }
              }
              
              // FINAL SAFETY CHECK: Ensure founderLogo is either null or a valid HTTPS URL
              // Never set to Firebase Storage paths, relative paths, or any non-HTTPS URL
              if (founderLogo && typeof founderLogo === 'string' && !founderLogo.startsWith('https://')) {
                console.warn('⚠️ [FOUNDER LOGO] Final safety check: Rejecting non-HTTPS URL');
                founderLogo = null;
              }
              
              projectData.founderLogo = founderLogo;
              console.log('✅ [FOUNDER LOGO] Final logo value:', founderLogo ? founderLogo.substring(0, 100) : 'null');
              
              // Update project state with new founder data (preserve all existing data)
              setProject((prev: any) => {
                if (!prev) return null;
                return { 
                  ...prev, 
                  founderLogo, 
                  founderName: projectData.founderName || prev.founderName, 
                  founderEmail: projectData.founderEmail || prev.founderEmail 
                };
              });
            } else {
              console.warn('⚠️ [FOUNDER] Founder document not found for ID:', projectData.founderId);
            }
          }, (founderError) => {
            console.error('❌ [FOUNDER] Error in founder listener:', founderError);
          });
        } else {
          console.warn('⚠️ [FOUNDER] No founderId found in project data');
        }
        
        // Normalize RaftAI data - check multiple possible field names (ALWAYS check for updates in real-time)
        // Priority order: raftai > raftAI > aiAnalysis > pitch.raftai > pitch.raftAI
        // Also check nested structures and handle various data formats
        console.log('🤖 [RAFTAI] Checking for RaftAI data in project:', {
          hasRaftai: !!rawData?.raftai,
          hasRaftAI: !!rawData?.raftAI,
          hasAiAnalysis: !!rawData?.aiAnalysis,
          hasPitchRaftai: !!rawData?.pitch?.raftai,
          hasPitchRaftAI: !!rawData?.pitch?.raftAI,
          hasPitchDataRaftai: !!rawData?.pitch?.data?.raftai,
          hasPitchDataRaftAI: !!rawData?.pitch?.data?.raftAI,
          hasPitch: !!rawData?.pitch,
          hasPitchData: !!rawData?.pitch?.data,
          raftaiKeys: rawData?.raftai ? Object.keys(rawData.raftai) : [],
          raftaiType: rawData?.raftai ? typeof rawData.raftai : null,
          pitchKeys: rawData?.pitch ? Object.keys(rawData.pitch) : [],
          pitchDataKeys: rawData?.pitch?.data ? Object.keys(rawData.pitch.data) : [],
          rawDataKeys: Object.keys(rawData || {}),
          raftaiValue: rawData?.raftai ? JSON.stringify(rawData.raftai).substring(0, 500) : null,
          pitchRaftaiValue: rawData?.pitch?.raftai ? JSON.stringify(rawData.pitch.raftai).substring(0, 500) : null,
          pitchDataRaftaiValue: rawData?.pitch?.data?.raftai ? JSON.stringify(rawData.pitch.data.raftai).substring(0, 500) : null
        });
        
        let raftaiData = null;
        
        // Helper function to check if RaftAI data is valid
        // Made EXTREMELY lenient to accept any object that might contain RaftAI data
        const isValidRaftAIData = (data: any): boolean => {
          if (!data) return false;
          // Accept any object (including arrays converted to objects)
          if (typeof data === 'object' && data !== null) {
            // If it's an array, check if it has any objects inside OR any non-empty values
            if (Array.isArray(data)) {
              return data.length > 0 && (
                data.some((item: any) => typeof item === 'object' && item !== null) ||
                data.some((item: any) => item !== null && item !== undefined && item !== '')
              );
            }
            // Accept ANY object with at least one property (extremely lenient)
            // This catches all possible RaftAI data structures, even if they're just metadata
            if (Object.keys(data).length > 0) {
              return true;
            }
          }
          // Also accept strings that might be JSON (will be parsed later if needed)
          if (typeof data === 'string' && data.trim().length > 0) {
            // Accept any non-empty string (might be JSON or plain text)
            if (data.trim().length > 3) {
              try {
                const parsed = JSON.parse(data);
                return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0;
              } catch {
                // Even if not JSON, accept it if it's long enough (might be a summary or analysis text)
                return data.trim().length > 10;
              }
            }
          }
          // Also accept numbers (might be a score)
          if (typeof data === 'number' && !isNaN(data)) {
            return true;
          }
          return false;
        };
        
        // Check all possible locations and use the first one found (priority order)
        // FIRST: Check root-level raftai (most common structure)
        // Also try to parse if it's a string
        if (rawData?.raftai) {
          let parsedRaftai = rawData.raftai;
          if (typeof parsedRaftai === 'string' && parsedRaftai.trim().length > 0) {
            try {
              parsedRaftai = JSON.parse(parsedRaftai);
            } catch (e) {
              // Not JSON, use as is
            }
          }
          if (isValidRaftAIData(parsedRaftai)) {
            raftaiData = parsedRaftai;
            console.log('✅ [RAFTAI] Found in root raftai field:', { score: raftaiData?.score, rating: raftaiData?.rating, keys: Object.keys(raftaiData || {}) });
          }
        }
        if (!raftaiData && rawData?.raftAI) {
          let parsedRaftAI = rawData.raftAI;
          if (typeof parsedRaftAI === 'string' && parsedRaftAI.trim().length > 0) {
            try {
              parsedRaftAI = JSON.parse(parsedRaftAI);
            } catch (e) {
              // Not JSON, use as is
            }
          }
          if (isValidRaftAIData(parsedRaftAI)) {
            raftaiData = parsedRaftAI;
            console.log('✅ [RAFTAI] Found in root raftAI field:', { score: raftaiData?.score, rating: raftaiData?.rating, keys: Object.keys(raftaiData || {}) });
          }
        }
        if (!raftaiData && rawData?.aiAnalysis) {
          let parsedAiAnalysis = rawData.aiAnalysis;
          if (typeof parsedAiAnalysis === 'string' && parsedAiAnalysis.trim().length > 0) {
            try {
              parsedAiAnalysis = JSON.parse(parsedAiAnalysis);
            } catch (e) {
              // Not JSON, use as is
            }
          }
          if (isValidRaftAIData(parsedAiAnalysis)) {
            raftaiData = parsedAiAnalysis;
            console.log('✅ [RAFTAI] Found in root aiAnalysis field:', { score: raftaiData?.score, rating: raftaiData?.rating, keys: Object.keys(raftaiData || {}) });
          }
        }
        
        // SECOND: Check pitch.raftai (only if not found above)
        if (!raftaiData && rawData?.pitch?.raftai && isValidRaftAIData(rawData.pitch.raftai)) {
          raftaiData = rawData.pitch.raftai;
          console.log('✅ [RAFTAI] Found in pitch.raftai field:', { score: raftaiData.score, rating: raftaiData.rating, keys: Object.keys(raftaiData) });
        }
        if (!raftaiData && rawData?.pitch?.raftAI && isValidRaftAIData(rawData.pitch.raftAI)) {
          raftaiData = rawData.pitch.raftAI;
          console.log('✅ [RAFTAI] Found in pitch.raftAI field:', { score: raftaiData.score, rating: raftaiData.rating, keys: Object.keys(raftaiData) });
        }
        if (!raftaiData && rawData?.pitch?.analysis && isValidRaftAIData(rawData.pitch.analysis)) {
          raftaiData = rawData.pitch.analysis;
          console.log('✅ [RAFTAI] Found in pitch.analysis field:', { score: raftaiData.score, rating: raftaiData.rating, keys: Object.keys(raftaiData) });
        }
        
        // THIRD: Check pitch.data.raftai (only if not found above)
        if (!raftaiData && rawData?.pitch?.data?.raftai && isValidRaftAIData(rawData.pitch.data.raftai)) {
          raftaiData = rawData.pitch.data.raftai;
          console.log('✅ [RAFTAI] Found in pitch.data.raftai field:', { score: raftaiData.score, rating: raftaiData.rating, keys: Object.keys(raftaiData) });
        }
        if (!raftaiData && rawData?.pitch?.data?.raftAI && isValidRaftAIData(rawData.pitch.data.raftAI)) {
          raftaiData = rawData.pitch.data.raftAI;
          console.log('✅ [RAFTAI] Found in pitch.data.raftAI field:', { score: raftaiData.score, rating: raftaiData.rating, keys: Object.keys(raftaiData) });
        }
        
        // FOURTH: Deep check if still not found
        if (!raftaiData) {
          // Deep check: look for any nested object that might contain RaftAI data
          const deepCheck = (obj: any, path: string = '', depth: number = 0): any => {
            if (depth > 5) return null; // Prevent infinite recursion
            if (!obj || typeof obj !== 'object') return null;
            if (isValidRaftAIData(obj)) return obj;
            for (const [key, value] of Object.entries(obj)) {
              if (typeof value === 'object' && value !== null) {
                const found = deepCheck(value, `${path}.${key}`, depth + 1);
                if (found) {
                  console.log(`✅ [RAFTAI] Found in nested path: ${path}.${key}`);
                  return found;
                }
              }
            }
            return null;
          };
          const deepFound = deepCheck(rawData);
          if (deepFound) {
            raftaiData = deepFound;
          } else {
            console.warn('⚠️ [RAFTAI] No valid RaftAI data found in any expected location');
            // Log the actual raftai value if it exists but is invalid
            if (rawData?.raftai) {
              console.warn('⚠️ [RAFTAI] raftai field exists but is invalid:', rawData.raftai);
            }
          }
        }
        
        // AGGRESSIVE: Also check RaftAI-like keys found in aggressive search (including nested paths)
        if (!raftaiData && raftaiLikeKeys.length > 0) {
          console.log('🔍 [RAFTAI] Checking RaftAI-like keys from aggressive search:', raftaiLikeKeys);
          for (const key of raftaiLikeKeys) {
            // Handle both top-level and nested paths
            const value = key.includes('.') ? getNestedValue(rawData, key) : rawData[key];
            if (value && isValidRaftAIData(value)) {
              raftaiData = value;
              console.log(`✅ [RAFTAI] Found in aggressive search key "${key}"`);
              break;
            }
            // Also check nested structures
            if (value && typeof value === 'object' && value !== null) {
              const nestedFound = deepCheck(value, key, 0);
              if (nestedFound) {
                raftaiData = nestedFound;
                console.log(`✅ [RAFTAI] Found in aggressive search nested key "${key}"`);
                break;
              }
            }
            // Also try parsing if it's a string
            if (value && typeof value === 'string' && value.trim().length > 0) {
              try {
                const parsed = JSON.parse(value);
                if (isValidRaftAIData(parsed)) {
                  raftaiData = parsed;
                  console.log(`✅ [RAFTAI] Found in aggressive search key "${key}" (parsed from string)`);
                  break;
                }
              } catch (e) {
                // Not JSON, continue
              }
            }
          }
        }
        
        // FINAL AGGRESSIVE CHECK: Look for ANY field that might contain analysis data
        // This is a last resort to catch RaftAI data stored in completely unexpected fields
        if (!raftaiData) {
          console.log('🔍 [RAFTAI] Performing final aggressive check - searching all fields...');
          const searchAllFields = (obj: any, path: string = '', depth: number = 0): any => {
            if (depth > 6 || !obj || typeof obj !== 'object') return null;
            
            // Check if this object itself looks like RaftAI data
            if (isValidRaftAIData(obj)) {
              return obj;
            }
            
            // Check all properties
            for (const [key, value] of Object.entries(obj)) {
              if (value && typeof value === 'object' && value !== null) {
                const found = searchAllFields(value, path ? `${path}.${key}` : key, depth + 1);
                if (found) {
                  console.log(`✅ [RAFTAI] Found in unexpected location: ${path ? `${path}.${key}` : key}`);
                  return found;
                }
              } else if (value && typeof value === 'string' && value.trim().length > 20) {
                // Check if string might be JSON containing RaftAI data
                try {
                  const parsed = JSON.parse(value);
                  if (isValidRaftAIData(parsed)) {
                    console.log(`✅ [RAFTAI] Found in string field "${path ? `${path}.${key}` : key}" (parsed)`);
                    return parsed;
                  }
                } catch (e) {
                  // Not JSON, continue
                }
              }
            }
            return null;
          };
          
          const finalFound = searchAllFields(rawData);
          if (finalFound) {
            raftaiData = finalFound;
          }
        }
        
        // If we found RaftAI data, normalize it to ensure score/rating are accessible
        // CRITICAL: Always set raftai (even if null) to ensure state updates work correctly
        if (raftaiData) {
          // Normalize RaftAI data structure - extract score/rating from nested structures
          // Use a deep extraction function to find score/rating anywhere in the structure
          const extractValue = (obj: any, keys: string[]): any => {
            if (!obj || typeof obj !== 'object') return null;
            for (const key of keys) {
              if (obj[key] !== null && obj[key] !== undefined) {
                return obj[key];
              }
            }
            // Also check nested objects
            for (const value of Object.values(obj)) {
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                const found = extractValue(value, keys);
                if (found !== null) return found;
              }
            }
            return null;
          };
          
          const normalizedRaftai: any = { ...raftaiData };
          
          // Deep extraction of score from anywhere in the structure
          const scoreKeys = ['score', 'overallScore', 'totalScore', 'riskScore', 'assessmentScore', 'finalScore', 'ratingScore'];
          normalizedRaftai.score = normalizedRaftai.score || extractValue(raftaiData, scoreKeys);
          
          // Deep extraction of rating from anywhere in the structure
          const ratingKeys = ['rating', 'riskRating', 'level', 'riskLevel', 'assessmentRating', 'finalRating', 'overallRating'];
          normalizedRaftai.rating = normalizedRaftai.rating || extractValue(raftaiData, ratingKeys);
          
          // Deep extraction of other fields
          normalizedRaftai.summary = normalizedRaftai.summary || extractValue(raftaiData, ['summary', 'overview', 'analysis', 'description']);
          normalizedRaftai.insights = normalizedRaftai.insights || extractValue(raftaiData, ['insights', 'keyInsights', 'findings', 'observations']);
          normalizedRaftai.risks = normalizedRaftai.risks || extractValue(raftaiData, ['risks', 'riskFactors', 'concerns', 'warnings']);
          normalizedRaftai.recommendations = normalizedRaftai.recommendations || extractValue(raftaiData, ['recommendations', 'suggestions', 'advice', 'nextSteps']);
          
          // Check for nested structures (e.g., data.score, results.score) - prioritize these
          if (raftaiData.data) {
            normalizedRaftai.score = normalizedRaftai.score || raftaiData.data.score || raftaiData.data.overallScore || raftaiData.data.totalScore || null;
            normalizedRaftai.rating = normalizedRaftai.rating || raftaiData.data.rating || raftaiData.data.riskRating || raftaiData.data.level || null;
            normalizedRaftai.summary = normalizedRaftai.summary || raftaiData.data.summary || null;
            normalizedRaftai.insights = normalizedRaftai.insights || raftaiData.data.insights || null;
            normalizedRaftai.risks = normalizedRaftai.risks || raftaiData.data.risks || null;
            normalizedRaftai.recommendations = normalizedRaftai.recommendations || raftaiData.data.recommendations || null;
          }
          
          if (raftaiData.results) {
            normalizedRaftai.score = normalizedRaftai.score || raftaiData.results.score || raftaiData.results.overallScore || raftaiData.results.totalScore || null;
            normalizedRaftai.rating = normalizedRaftai.rating || raftaiData.results.rating || raftaiData.results.riskRating || raftaiData.results.level || null;
            normalizedRaftai.summary = normalizedRaftai.summary || raftaiData.results.summary || null;
            normalizedRaftai.insights = normalizedRaftai.insights || raftaiData.results.insights || null;
            normalizedRaftai.risks = normalizedRaftai.risks || raftaiData.results.risks || null;
            normalizedRaftai.recommendations = normalizedRaftai.recommendations || raftaiData.results.recommendations || null;
          }
          
          // Check for alternative field names for score (root level)
          if (!normalizedRaftai.score) {
            normalizedRaftai.score = raftaiData.overallScore || raftaiData.totalScore || raftaiData.riskScore || raftaiData.assessmentScore || null;
          }
          
          // Check for alternative field names for rating (root level)
          if (!normalizedRaftai.rating) {
            normalizedRaftai.rating = raftaiData.riskRating || raftaiData.level || raftaiData.riskLevel || raftaiData.assessmentRating || null;
          }
          
          // Ensure score is a number if it exists
          if (normalizedRaftai.score !== null && normalizedRaftai.score !== undefined) {
            const scoreNum = typeof normalizedRaftai.score === 'string' ? parseFloat(normalizedRaftai.score) : Number(normalizedRaftai.score);
            normalizedRaftai.score = !isNaN(scoreNum) ? scoreNum : null;
          }
          
          // Normalize rating to standard values (High/Normal/Low)
          // Rating represents INVESTMENT POTENTIAL, not risk level
          // High score = High rating (good investment potential)
          // Low score = Low rating (poor investment potential)
          if (normalizedRaftai.rating && typeof normalizedRaftai.rating === 'string') {
            const ratingLower = normalizedRaftai.rating.toLowerCase();
            // If rating contains "high" (high potential), keep as High
            if (ratingLower.includes('high') && !ratingLower.includes('risk')) {
              normalizedRaftai.rating = 'High';
            } 
            // If rating contains "low risk", it means low risk = high potential = High rating
            else if (ratingLower.includes('low risk')) {
              normalizedRaftai.rating = 'High';
            }
            // If rating contains "high risk", it means high risk = low potential = Low rating
            else if (ratingLower.includes('high risk')) {
              normalizedRaftai.rating = 'Low';
            }
            // Normal/Medium/Moderate = Normal
            else if (ratingLower.includes('medium') || ratingLower.includes('med') || ratingLower.includes('normal') || ratingLower.includes('moderate')) {
              normalizedRaftai.rating = 'Normal';
            }
            // If just "low" (without "risk"), it means low potential = Low rating
            else if (ratingLower.includes('low') && !ratingLower.includes('risk')) {
              normalizedRaftai.rating = 'Low';
            }
          }
          
          // If we have a score but no rating, infer rating from score
          // High score (80+) = High rating (good investment potential)
          // Medium score (60-79) = Normal rating
          // Low score (<60) = Low rating (poor investment potential)
          if (normalizedRaftai.score !== null && !normalizedRaftai.rating) {
            if (normalizedRaftai.score >= 80) {
              normalizedRaftai.rating = 'High'; // High score = High potential
            } else if (normalizedRaftai.score >= 60) {
              normalizedRaftai.rating = 'Normal';
            } else {
              normalizedRaftai.rating = 'Low'; // Low score = Low potential
            }
          }
          
          // Ensure rating matches score if they're inconsistent
          if (normalizedRaftai.score !== null && normalizedRaftai.rating) {
            const scoreNum = typeof normalizedRaftai.score === 'number' ? normalizedRaftai.score : parseFloat(String(normalizedRaftai.score));
            if (!isNaN(scoreNum)) {
              // If score is high but rating is low (or vice versa), fix it
              if (scoreNum >= 80 && normalizedRaftai.rating === 'Low') {
                normalizedRaftai.rating = 'High';
              } else if (scoreNum < 60 && normalizedRaftai.rating === 'High') {
                normalizedRaftai.rating = 'Low';
              }
            }
          }
          
          projectData.raftai = normalizedRaftai;
          console.log('✅ [RAFTAI] RaftAI data loaded/updated (normalized):', { 
            score: normalizedRaftai.score, 
            rating: normalizedRaftai.rating,
            hasSummary: !!normalizedRaftai.summary,
            hasInsights: Array.isArray(normalizedRaftai.insights) && normalizedRaftai.insights.length > 0,
            hasRisks: Array.isArray(normalizedRaftai.risks) && normalizedRaftai.risks.length > 0,
            hasRecommendations: Array.isArray(normalizedRaftai.recommendations) && normalizedRaftai.recommendations.length > 0,
            // Log all keys to help debug
            allKeys: Object.keys(normalizedRaftai),
            // Log original structure for debugging
            originalKeys: Object.keys(raftaiData),
            // Log sample data
            sampleData: JSON.stringify(normalizedRaftai).substring(0, 500)
          });
        } else {
          // Clear raftai data if not found (don't keep stale data)
          projectData.raftai = null;
          console.warn('⚠️ [RAFTAI] No RaftAI data available for this project');
          // Log what we checked to help debug
          console.warn('⚠️ [RAFTAI] Checked locations:', {
            hasRootRaftai: !!rawData?.raftai,
            hasRootRaftAI: !!rawData?.raftAI,
            hasRootAiAnalysis: !!rawData?.aiAnalysis,
            hasPitchRaftai: !!rawData?.pitch?.raftai,
            hasPitchRaftAI: !!rawData?.pitch?.raftAI,
            hasPitchDataRaftai: !!rawData?.pitch?.data?.raftai,
            hasPitchDataRaftAI: !!rawData?.pitch?.data?.raftAI,
            raftaiLikeKeysFound: raftaiLikeKeys.length
          });
        }
        
        // Load pipeline milestones if project is accepted by this VC
        if (projectData.status === 'accepted' && projectData.acceptedBy === user.uid) {
          try {
            const pipelineRef = doc(dbInstance, 'pipeline', `${user.uid}_${projectId}`);
            const pipelineDoc = await getDoc(pipelineRef);
            if (pipelineDoc.exists()) {
              const pipelineData = pipelineDoc.data();
              projectData.pipelineMilestones = pipelineData?.milestones || {};
            }
          } catch (pipelineError) {
            console.warn('Could not load pipeline milestones:', pipelineError);
          }
        }
        
        // Log final project data state for debugging
        console.log('📊 [PROJECT] Final project data:', {
          id: projectData.id,
          title: projectData.title || projectData.name,
          hasFounderLogo: !!projectData.founderLogo,
          founderLogo: projectData.founderLogo,
          hasRaftai: !!projectData.raftai,
          raftaiScore: projectData.raftai?.score,
          documentsCount: projectData.documents ? Object.keys(projectData.documents).length : 0,
          teamCount: projectData.team ? projectData.team.length : 0
        });
        
        // Use functional update to preserve existing data (like founderLogo from founder listener)
        // CRITICAL: Ensure all normalized data (documents, team, RaftAI) is included
        setProject((prev: any) => {
          // Merge with existing data to preserve founder logo and other real-time updates
          const updatedProject = {
            ...projectData,
            // CRITICAL: Always include normalized documents, team, and RaftAI data
            // Prioritize current normalized data over previous state
            // IMPORTANT: Merge documents to ensure we don't lose any documents
            documents: (() => {
              const currentDocs = projectData.documents && typeof projectData.documents === 'object' && !Array.isArray(projectData.documents) ? projectData.documents : {};
              const prevDocs = prev?.documents && typeof prev.documents === 'object' && !Array.isArray(prev.documents) ? prev.documents : {};
              // Merge both, with current taking precedence
              const merged = { ...prevDocs, ...currentDocs };
              console.log('📄 [STATE UPDATE] Merging documents:', {
                currentKeys: Object.keys(currentDocs),
                prevKeys: Object.keys(prevDocs),
                mergedKeys: Object.keys(merged),
                mergedCount: Object.keys(merged).length
              });
              return merged;
            })(),
            team: (Array.isArray(projectData.team) && projectData.team.length > 0) 
              ? projectData.team 
              : (Array.isArray(prev?.team) && prev.team.length > 0 ? prev.team : []),
            // CRITICAL: Preserve RaftAI data if it exists, even if score/rating are null
            // This ensures the UI can display RaftAI data even if only some fields are present
            raftai: (projectData.raftai && projectData.raftai !== null && typeof projectData.raftai === 'object' && Object.keys(projectData.raftai).length > 0)
              ? projectData.raftai
              : (prev?.raftai && prev.raftai !== null && typeof prev.raftai === 'object' && Object.keys(prev.raftai).length > 0 ? prev.raftai : null),
            // Preserve founder logo if it was set by the founder listener and is valid
            founderLogo: prev?.founderLogo && typeof prev.founderLogo === 'string' && prev.founderLogo.startsWith('https://') 
              ? prev.founderLogo 
              : (projectData.founderLogo && typeof projectData.founderLogo === 'string' && projectData.founderLogo.startsWith('https://') 
                  ? projectData.founderLogo 
                  : null),
            // Preserve founder name/email if they were set by the founder listener
            founderName: projectData.founderName || prev?.founderName || null,
            founderEmail: projectData.founderEmail || prev?.founderEmail || null
          };
          
          // Log the final state for debugging
          console.log('📊 [STATE UPDATE] Setting project state:', {
            documentsCount: updatedProject.documents ? Object.keys(updatedProject.documents).length : 0,
            documentsKeys: updatedProject.documents ? Object.keys(updatedProject.documents) : [],
            teamCount: Array.isArray(updatedProject.team) ? updatedProject.team.length : 0,
            hasRaftai: !!updatedProject.raftai,
            raftaiScore: updatedProject.raftai?.score,
            raftaiRating: updatedProject.raftai?.rating,
            hasFounderLogo: !!updatedProject.founderLogo,
            founderLogo: updatedProject.founderLogo ? updatedProject.founderLogo.substring(0, 100) : null
          });
          
          return updatedProject;
        });
        setLoading(false);
      }, (err: any) => {
      console.error('Error loading project:', err);
        setError(err.message || 'Failed to load project');
        setLoading(false);
      });
      
      // Return cleanup function that also cleans up founder listener
      return () => {
        unsubscribe();
        if (founderUnsubscribeRef.current) {
          founderUnsubscribeRef.current();
          founderUnsubscribeRef.current = null;
        }
      };
    } catch (err: any) {
      console.error('Error setting up project listener:', err);
      setError(err.message || 'Failed to load project');
      setLoading(false);
    }
  };

  const handleAcceptProject = async () => {
    if (!project || !user) return;

    try {
      setActionLoading(true);
      
      console.log('✅ [ACCEPT] Starting project acceptance using acceptProjectClientSide...');
      
      // Get orgId from claims or user document
      let orgId = claims?.orgId;
      if (!orgId) {
        try {
          const { ensureDb, waitForFirebase } = await import('@/lib/firebase-utils');
          await waitForFirebase(5000);
          const dbInstance = ensureDb();
          if (dbInstance) {
            const { doc, getDoc } = await import('firebase/firestore');
            const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              orgId = userData.orgId || userData.organization?.id || null;
            }
          }
        } catch (err) {
          console.warn('Could not fetch orgId:', err);
        }
      }
      
      // Use the existing acceptProjectClientSide function which handles all the logic
      const result = await acceptProjectClientSide({
        projectId,
        userId: user.uid,
        userEmail: user.email || '',
        roleType: 'vc',
        orgId: orgId || undefined
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept project');
      }

      // Add to pipeline with milestones (wrap in try-catch to prevent failure)
      try {
        const { waitForFirebase, ensureDb } = await import('@/lib/firebase-utils');
        const dbInstance = ensureDb();
        if (dbInstance) {
          const { doc, setDoc, Timestamp } = await import('firebase/firestore');
          
          // Add to pipeline - filter out undefined values
          const pipelineData: any = {
            userId: user.uid,
            projectId,
            projectName: project.title || project.name || 'Untitled',
            projectDescription: project.description || project.tagline || '',
            stage: 'screening',
            milestones: {
              kyb_check: false,
              dd_started: false,
              company_check: false,
              docs_verified: false,
              token_audit: false,
              ic_approval: false,
              term_sheet_sent: false,
              term_sheet_signed: false,
              payment_sent: false,
              tokens_received: false,
              portfolio_added: false
            },
            notes: '',
            addedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          
          // Only add fields that are not undefined
          if (project.sector !== undefined && project.sector !== null) {
            pipelineData.sector = project.sector;
          }
          if (project.fundingGoal !== undefined && project.fundingGoal !== null) {
            pipelineData.fundingGoal = project.fundingGoal;
          }
          if (project.founderName !== undefined && project.founderName !== null) {
            pipelineData.founderName = project.founderName;
          }
          if (project.raftai !== undefined && project.raftai !== null) {
            pipelineData.raftai = project.raftai;
          }
          
          await setDoc(doc(dbInstance, 'pipeline', `${user.uid}_${projectId}`), pipelineData, { merge: true });
          console.log('✅ [ACCEPT] Pipeline entry created');
        }
      } catch (pipelineError: any) {
        console.warn('⚠️ [ACCEPT] Pipeline entry creation failed (non-critical):', pipelineError.message);
        // Don't throw - pipeline creation is not critical for acceptance
      }

      // Create initial investment record (wrap in try-catch to prevent failure)
      try {
        const { waitForFirebase, ensureDb } = await import('@/lib/firebase-utils');
        const dbInstance = ensureDb();
        if (dbInstance) {
          const { doc, setDoc, Timestamp } = await import('firebase/firestore');
          
          const investmentId = `${user.uid}_${projectId}`;
          const investmentData: any = {
            investorId: user.uid,
            projectId,
            projectName: project.title || project.name || 'Untitled',
            description: project.description || project.tagline || '',
            investmentAmount: 0,
            currentValue: 0,
            status: 'pending',
            dateInvested: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          
          // Only add fields that are not undefined
          if (project.stage !== undefined && project.stage !== null) {
            investmentData.stage = project.stage;
          } else {
            investmentData.stage = 'Pre-Seed';
          }
          if (project.sector !== undefined && project.sector !== null) {
            investmentData.sector = project.sector;
          }
          if (project.logoUrl || project.logo || project.image) {
            investmentData.logo = project.logoUrl || project.logo || project.image;
          }
          
          await setDoc(doc(dbInstance, 'investments', investmentId), investmentData, { merge: true });
          console.log('✅ [ACCEPT] Investment record created');
        }
      } catch (investmentError: any) {
        console.warn('⚠️ [ACCEPT] Investment record creation failed (non-critical):', investmentError.message);
        // Don't throw - investment record creation is not critical for acceptance
      }

      // Show success message and redirect
      console.log('✅ [ACCEPT] Project accepted successfully!');
      
      // Redirect to chat room
      if (result.roomUrl) {
        setTimeout(() => {
          router.push(result.roomUrl!);
        }, 500);
      } else {
        router.refresh();
      }
      
    } catch (error: any) {
      console.error('❌ [ACCEPT] Error accepting project:', error);
      alert(`❌ Failed to accept: ${error.message || 'Unknown error'}`);
      setActionLoading(false);
    }
  };

  const handleRejectProject = async () => {
    if (!project || !user) return;

    try {
      setActionLoading(true);
      
      const { waitForFirebase, ensureDb } = await import('@/lib/firebase-utils');
      const dbInstance = ensureDb();
      if (!dbInstance) {
        throw new Error('Database not available');
      }
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(dbInstance, 'projects', projectId), {
        status: 'declined',
        vcAction: 'declined',
        declinedBy: user.uid,
        rejectedBy: user.uid,
        declinedAt: Date.now(),
        rejectedAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });
      
      alert('✅ Project declined');
      router.push('/vc/dealflow');
      
    } catch (error: any) {
      console.error('❌ Error declining project:', error);
      alert(`❌ Failed to decline: ${error.message || 'Unknown error'}`);
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center neo-blue-background">
        <LoadingSpinner size="lg" message="Loading project..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center neo-blue-background">
        <div className="text-center">
          <NeonCyanIcon type="shield" size={64} className="text-red-500" />
          <p className="text-white text-lg mb-4">{error || 'Project not found'}</p>
          <AnimatedButton variant="primary" onClick={() => router.push('/vc/dealflow')}>
            Back to Dealflow
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neo-blue-background pt-28">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-28 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/vc/dealflow')}
            className="flex items-center text-white/60 hover:text-white mb-4 transition-colors"
          >
            <NeonCyanIcon type="analytics" size={20} className="text-current" />
            Back to Dealflow
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* Project Logo */}
              {(project.logoUrl || project.logo || project.image) ? (
                <img 
                  src={project.logoUrl || project.logo || project.image} 
                  alt={project.title || project.name || 'Project'} 
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-white/10"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Show fallback
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl items-center justify-center flex-shrink-0 border border-cyan-400/30 shadow-lg shadow-cyan-500/20 ${(project.logoUrl || project.logo || project.image) ? 'hidden' : 'flex'}`}>
                <span className="text-white font-bold text-2xl">
                  {(project.title || project.name || project.tagline || 'P').charAt(0).toUpperCase()}
                </span>
              </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {project.title || project.name || 'Untitled Project'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-white/70">
                <span>{project.sector || 'Sector not specified'}</span>
                <span>·</span>
                <span>{project.chain || 'Chain not specified'}</span>
                {project.stage && (
                  <>
                    <span>·</span>
                    <span className="capitalize">{project.stage}</span>
                  </>
                )}
                </div>
              </div>
            </div>
            
            {project.raftai?.rating && (
              <div className={`px-4 py-2 rounded-full text-sm font-bold border ${
                project.raftai.rating === 'High' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                project.raftai.rating === 'Normal' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {project.raftai.rating} Potential
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10 sticky top-[196px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: createIconWrapper('dashboard') },
              { id: 'docs', label: 'Documents', icon: createIconWrapper('document') },
              { id: 'team', label: 'Team', icon: createIconWrapper('team') },
              { id: 'milestones', label: 'Milestones', icon: createIconWrapper('check') },
              { id: 'risks', label: 'Risks', icon: createIconWrapper('exclamation') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {typeof tab.icon === 'function' ? (
                  <tab.icon className="h-5 w-5" />
                ) : (
                <tab.icon className="h-5 w-5" />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">Project Description</h2>
                  <p className="text-white/80 leading-relaxed text-lg whitespace-pre-wrap">
                    {project.description || project.tagline || project.valueProposition || project.valuePropOneLine || 'No description available'}
                  </p>
                </div>

                <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-6">Key Metrics</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Stage</p>
                      <p className="text-white font-semibold text-xl capitalize">{project.stage || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Funding Goal</p>
                      <p className="text-white font-semibold text-xl">
                        ${project.fundingGoal ? project.fundingGoal.toLocaleString() : (project.funding?.target ? project.funding.target.toLocaleString() : 'Not specified')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Team Size</p>
                      <p className="text-white font-semibold text-xl">{project.teamSize || (project.team?.length || 'Not specified')}</p>
                    </div>
                    {project.website && (
                      <div className="col-span-2">
                        <p className="text-white/60 text-sm mb-1">Website</p>
                        <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                          <NeonCyanIcon type="globe" size={20} className="text-current" />
                          {project.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents Preview in Overview */}
                {(() => {
                  // Debug: Log documents for troubleshooting
                  console.log('📄 [OVERVIEW] Project documents:', project.documents);
                  console.log('📄 [OVERVIEW] Documents type:', typeof project.documents);
                  console.log('📄 [OVERVIEW] Documents keys:', project.documents ? Object.keys(project.documents) : []);
                  console.log('📄 [OVERVIEW] Documents entries:', project.documents ? Object.entries(project.documents) : []);
                  
                  // Ensure documents is an object (handle null/undefined)
                  const documentsObj = project.documents && typeof project.documents === 'object' && !Array.isArray(project.documents) ? project.documents : {};
                  
                  // CRITICAL: Log the actual documents object structure for debugging
                  console.log('📄 [OVERVIEW] Documents object structure:', {
                    type: typeof project.documents,
                    isArray: Array.isArray(project.documents),
                    isObject: typeof project.documents === 'object' && project.documents !== null,
                    keys: documentsObj ? Object.keys(documentsObj) : [],
                    entries: documentsObj ? Object.entries(documentsObj).map(([k, v]) => [k, typeof v, v ? (typeof v === 'string' ? v.substring(0, 50) : 'object') : 'null']) : []
                  });
                  
                  // Filter out metadata fields that shouldn't be shown as documents
                  const metadataFields = ['type', 'name', 'downloadURL', 'url', 'size', 'uploadedAt', 'createdAt', 'updatedAt'];
                  
                  // Valid document keys that should be displayed
                  const validDocumentKeys = ['pitchDeck', 'whitepaper', 'tokenomics', 'roadmap', 'projectLogo', 'financialProjections', 
                    'smartContractAudit', 'legalOpinion', 'capTable', 'teamPhoto', 'advisors', 'partners'];
                  
                  // Documents should already be normalized to strings, but handle edge cases
                  const validDocuments = Object.entries(documentsObj)
                    .map(([key, url]: [string, any]) => {
                      // Skip metadata fields
                      if (metadataFields.includes(key.toLowerCase())) {
                        return null;
                      }
                      
                      // Skip null/undefined
                      if (!url && url !== 0 && url !== false) return null;
                      
                      // Extract URL if it's a string
                      let documentUrl: string | null = null;
                      if (typeof url === 'string' && url.trim() !== '') {
                        // Only accept URLs (http/https) or Firebase Storage paths
                        const trimmed = url.trim();
                        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('gs://') || trimmed.includes('firebasestorage')) {
                          documentUrl = trimmed;
                        }
                      } else if (typeof url === 'object' && url !== null) {
                        // Try to extract URL from object - check all possible URL properties
                        documentUrl = url.downloadURL || url.fileUrl || url.url || url.downloadUrl || url.fileURL || url.href || null;
                        if (documentUrl && typeof documentUrl === 'string' && documentUrl.trim() !== '') {
                          documentUrl = documentUrl.trim();
                        }
                      }
                      
                      // Only accept valid document URLs (must be HTTP/HTTPS or Firebase Storage)
                      if (documentUrl && typeof documentUrl === 'string' && 
                          (documentUrl.startsWith('http://') || documentUrl.startsWith('https://') || 
                           documentUrl.startsWith('gs://') || documentUrl.includes('firebasestorage'))) {
                        console.log(`✅ [OVERVIEW] Valid document found: ${key} = ${documentUrl.substring(0, 100)}`);
                        return [key, documentUrl.trim()];
                      }
                      console.log(`⚠️ [OVERVIEW] Invalid document skipped: ${key} = ${typeof url}`, url);
                      return null;
                    })
                    .filter((entry): entry is [string, string] => entry !== null);
                  
                  // Also check if documentsObj has any keys that weren't processed
                  // This catches cases where documents might be stored with non-standard keys
                  if (validDocuments.length === 0 && documentsObj && Object.keys(documentsObj).length > 0) {
                    console.log('🔍 [OVERVIEW] No valid documents found, checking all keys:', Object.keys(documentsObj));
                    // Try to extract documents from all keys, even if they don't look like standard document keys
                    Object.entries(documentsObj).forEach(([key, value]: [string, any]) => {
                      if (value && typeof value === 'string' && value.trim().length >= 3) {
                        validDocuments.push([key, value.trim()]);
                        console.log(`✅ [OVERVIEW] Added document from non-standard key "${key}":`, value.substring(0, 100));
                      } else if (value && typeof value === 'object' && value !== null) {
                        // Try to extract any string value from the object
                        const stringValue = Object.values(value).find((val: any) => typeof val === 'string' && val.trim().length >= 3);
                        if (stringValue && typeof stringValue === 'string') {
                          validDocuments.push([key, stringValue.trim()]);
                          console.log(`✅ [OVERVIEW] Added document from object key "${key}":`, stringValue.substring(0, 100));
                        }
                      }
                    });
                  }
                  
                  console.log('📄 [OVERVIEW] Valid documents after filtering:', validDocuments.length, validDocuments);
                  
                  // Also check if documents exist but weren't filtered correctly
                  if (validDocuments.length === 0 && documentsObj && Object.keys(documentsObj).length > 0) {
                    console.warn('⚠️ [OVERVIEW] Documents exist but were filtered out:', documentsObj);
                  }
                  
                  return validDocuments.length > 0 ? (
                    <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                      <h2 className="text-2xl font-bold text-white mb-6">Available Documents</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {validDocuments.map(([key, documentUrl]: [string, string]) => {
                          // Ensure documentUrl is a valid string before using it
                          const safeUrl = typeof documentUrl === 'string' ? documentUrl : String(documentUrl || '');
                          const docNames: Record<string, string> = {
                            whitepaper: 'Whitepaper',
                            pitchdeck: 'Pitch Deck',
                            pitchDeck: 'Pitch Deck',
                            financials: 'Financial Projections',
                            auditreport: 'Smart Contract Audit',
                            auditReport: 'Smart Contract Audit',
                            tokenomics: 'Token Economics',
                            legalopinion: 'Legal Opinion',
                            legalOpinion: 'Legal Opinion',
                            captable: 'Cap Table',
                            capTable: 'Cap Table',
                            pitch: 'Pitch Deck',
                            whitepaperurl: 'Whitepaper',
                            model: 'Token Model',
                            audits: 'Audit Reports',
                            projectlogo: 'Project Logo',
                            projectLogo: 'Project Logo',
                            roadmap: 'Roadmap'
                          };
                          
                          return (
                            <a
                              key={key}
                              href={safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all group"
                            >
                              <NeonCyanIcon type="document" size={20} className="text-blue-400 group-hover:text-blue-300" />
                              <span className="text-white font-medium group-hover:text-blue-300">{docNames[key] || key.charAt(0).toUpperCase() + key.slice(1)}</span>
                              <span className="ml-auto text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </a>
                          );
                        })}
                      </div>
                  </div>
                  ) : (
                    <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                      <h2 className="text-2xl font-bold text-white mb-4">Available Documents</h2>
                      <p className="text-white/60">No documents available for this project yet.</p>
                      {documentsObj && Object.keys(documentsObj).length > 0 && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-400 text-sm font-medium mb-1">
                            Debug: Found {Object.keys(documentsObj).length} document key(s) but none passed validation.
                          </p>
                          <p className="text-yellow-400/70 text-xs">
                            Keys: {Object.keys(documentsObj).join(', ')}
                          </p>
                          <p className="text-yellow-400/70 text-xs mt-1">
                            Check browser console for detailed document normalization logs.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            {activeTab === 'docs' && (
              <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Documents Checklist</h2>
                {project.documents && Object.keys(project.documents).length > 0 ? (
                  <div className="space-y-3">
                    {[
                      { name: 'Whitepaper', key: 'whitepaper', altKeys: ['whitepaperurl'], required: true },
                      { name: 'Pitch Deck', key: 'pitchDeck', altKeys: ['pitchdeck', 'pitch'], required: true },
                      { name: 'Financial Projections', key: 'financials', altKeys: ['financial', 'financialprojections'], required: true },
                      { name: 'Smart Contract Audit', key: 'auditReport', altKeys: ['auditreport', 'audits', 'audit'], required: false },
                      { name: 'Token Economics', key: 'tokenomics', altKeys: ['model', 'tokenomicsfile', 'tokenomicsFile'], required: true },
                      { name: 'Legal Opinion', key: 'legalOpinion', altKeys: ['legalopinion', 'legal'], required: false },
                      { name: 'Cap Table', key: 'capTable', altKeys: ['captable', 'captable'], required: false }
                    ].map(docItem => {
                      // Check both primary key and alternative keys
                      let docUrl = project.documents?.[docItem.key];
                      
                      // If not found, try alternative keys
                      if (!docUrl) {
                        for (const altKey of docItem.altKeys) {
                          if (project.documents?.[altKey]) {
                            docUrl = project.documents[altKey];
                            break;
                          }
                        }
                      }
                      
                      // Also check nested structures (e.g., pitch.tokenomicsFile, pitch.documents.tokenomics)
                      if (!docUrl && project.pitch) {
                        const pitch = project.pitch as any;
                        // Check pitch.tokenomicsFile
                        if (docItem.key === 'tokenomics' && pitch.tokenomicsFile) {
                          docUrl = pitch.tokenomicsFile.url || pitch.tokenomicsFile.downloadURL || pitch.tokenomicsFile;
                        }
                        // Check pitch.documents[docItem.key]
                        if (!docUrl && pitch.documents && pitch.documents[docItem.key]) {
                          docUrl = pitch.documents[docItem.key];
                        }
                      }
                      
                      // Normalize URL - handle both string URLs and objects with various URL properties
                      if (docUrl && typeof docUrl === 'object' && docUrl !== null) {
                        // Try multiple possible URL properties
                        docUrl = docUrl.downloadURL || docUrl.fileUrl || docUrl.url || docUrl.downloadUrl || docUrl.fileURL || docUrl.href || null;
                        
                        // If still an object, try to get any string property that looks like a URL
                        if (docUrl && typeof docUrl === 'object') {
                          const urlProps = Object.values(docUrl).find((val: any) => 
                            typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'))
                          );
                          if (urlProps) {
                            docUrl = urlProps;
                          } else {
                            docUrl = null;
                          }
                        }
                      }
                      
                      // Ensure docUrl is a valid string if it exists
                      const isValidUrl = docUrl && (typeof docUrl === 'string' ? (docUrl.trim() !== '' && (docUrl.startsWith('http://') || docUrl.startsWith('https://') || docUrl.startsWith('gs://') || docUrl.includes('firebasestorage'))) : false);
                      
                      return (
                        <div key={docItem.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                            {isValidUrl ? (
                              <NeonCyanIcon type="check" size={20} className="text-green-400" />
                            ) : (
                              <NeonCyanIcon type="shield" size={20} className="text-cyan-400/50" />
                            )}
                            <span className="text-white font-medium">{docItem.name}</span>
                            {docItem.required && <span className="text-xs text-red-400">(Required)</span>}
                          </div>
                          {isValidUrl && (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 text-sm hover:text-blue-300 font-medium flex items-center gap-1"
                            >
                              <NeonCyanIcon type="document" size={16} className="text-current" />
                              View →
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <NeonCyanIcon type="document" size={48} className="text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">No documents available for this project yet.</p>
                    <p className="text-white/40 text-sm mt-2">Documents will appear here once uploaded by the founder</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Team Members</h2>
                {project.team && Array.isArray(project.team) && project.team.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.team.map((member: any, index: number) => {
                      // Handle different team member structures
                      const memberName = member.name || member.fullName || member.memberName || 'Team Member';
                      const memberRole = member.role || member.position || member.title || 'Role not specified';
                      const memberBio = member.bio || member.description || member.about || '';
                      const memberLinkedIn = member.linkedin || member.linkedIn || member.linkedInUrl || '';
                      const memberImage = member.image || member.photo || member.photoURL || member.avatar || null;
                      
                      return (
                        <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-blue-500/30 transition-all">
                          <div className="flex items-start gap-3">
                            {memberImage ? (
                              <img 
                                src={memberImage} 
                                alt={memberName}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-400/30">
                                <span className="text-white font-bold text-sm">
                                  {memberName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-white font-bold text-lg">{memberName}</p>
                              <p className="text-white/60 text-sm mb-1">{memberRole}</p>
                              {memberBio && (
                                <p className="text-white/50 text-xs mb-2 line-clamp-2">{memberBio}</p>
                              )}
                              {memberLinkedIn && (
                                <a 
                                  href={memberLinkedIn.startsWith('http') ? memberLinkedIn : `https://linkedin.com/in/${memberLinkedIn}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-400 text-sm hover:text-blue-300 inline-flex items-center gap-1"
                                >
                                  <NeonCyanIcon type="users" size={14} className="text-current" />
                                  LinkedIn →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <NeonCyanIcon type="users" size={48} className="text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">No team information available</p>
                    <p className="text-white/40 text-sm mt-2">Team details will appear here once provided by the founder</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Investment Milestones</h2>
                  {project.status === 'accepted' && project.acceptedBy === user?.uid && (
                    <Link
                      href={`/vc/pipeline?project=${projectId}`}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                    >
                      Manage in Pipeline →
                    </Link>
                  )}
                </div>
                <p className="text-white/60 mb-6">Track progress through the investment process</p>
                <div className="space-y-3">
                  {MILESTONES.map(milestone => {
                    const MilestoneIcon = milestone.icon;
                    const isCompleted = project.pipelineMilestones?.[milestone.id] === true;
                    return (
                      <button
                        key={milestone.id}
                        onClick={() => {
                          if (project.status === 'accepted' && project.acceptedBy === user?.uid) {
                            router.push(`/vc/pipeline?project=${projectId}&milestone=${milestone.id}`);
                          }
                        }}
                        disabled={project.status !== 'accepted' || project.acceptedBy !== user?.uid}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-white/5 border-white/10'
                        } ${
                          project.status === 'accepted' && project.acceptedBy === user?.uid
                            ? 'hover:bg-white/10 hover:border-blue-500/50 cursor-pointer'
                            : 'cursor-default'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-white/30 bg-white/5'
                        }`}>
                          {isCompleted ? (
                            <NeonCyanIcon type="check" size={20} className="text-green-400" />
                          ) : (
                            <NeonCyanIcon type="shield" size={16} className="text-white/60" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                            {milestone.label}
                          </p>
                          <p className={`text-xs ${isCompleted ? 'text-green-400/70' : 'text-white/50'}`}>
                            {isCompleted ? 'Completed' : 'Pending'}
                          </p>
                        </div>
                        {project.status === 'accepted' && project.acceptedBy === user?.uid && (
                          <NeonCyanIcon type="analytics" size={16} className="text-white/40 rotate-180" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {project.status !== 'accepted' && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-blue-400 text-sm text-center">
                    💡 These milestones will be tracked in the Pipeline after you accept this project
                  </p>
                </div>
                )}
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Risk Analysis</h2>
                {project.raftai?.risks && project.raftai.risks.length > 0 ? (
                  <div className="space-y-3">
                    {project.raftai.risks.map((risk: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <NeonCyanIcon type="exclamation" size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white/80">{risk}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60">No risks identified by RaftAI</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RaftAI Analysis */}
            <div className="neo-glass-card rounded-xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 max-h-[600px] overflow-y-auto overflow-x-hidden raftai-scroll">
              <div className="flex items-center gap-2 mb-4">
                <NeonCyanIcon type="cpu" size={24} className="text-purple-400" />
                <h2 className="text-xl font-bold text-white">RaftAI Analysis</h2>
              </div>
              
              {project.raftai && project.raftai !== null && typeof project.raftai === 'object' && Object.keys(project.raftai).length > 0 && (project.raftai.score || project.raftai.rating || project.raftai.summary || (Array.isArray(project.raftai.insights) && project.raftai.insights.length > 0) || (Array.isArray(project.raftai.risks) && project.raftai.risks.length > 0) || (Array.isArray(project.raftai.recommendations) && project.raftai.recommendations.length > 0) || project.raftai.status || project.raftai.analysis || project.raftai.assessment) ? (
                <>
                  {(project.raftai.score || project.raftai.rating) && (
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
                          {project.raftai.riskScore !== undefined ? (
                            // Use riskScore if available (1-100, lower is better)
                            project.raftai.riskScore <= 30 ? 'Low' : 
                            project.raftai.riskScore <= 60 ? 'Med' : 'High'
                          ) : project.raftai.score ? (
                            // Infer risk from score (high score = low risk)
                            project.raftai.score >= 80 ? 'Low' : 
                            project.raftai.score >= 60 ? 'Med' : 'High'
                          ) : (
                            // Infer risk from rating (High rating = Low risk, Low rating = High risk)
                            project.raftai.rating === 'High' ? 'Low' :
                            project.raftai.rating === 'Normal' ? 'Med' : 'High'
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.raftai?.summary && (
                    <div className="mb-4">
                      <p className="text-white/70 text-sm leading-relaxed">{project.raftai.summary}</p>
                    </div>
                  )}

                  {project.raftai?.insights && Array.isArray(project.raftai.insights) && project.raftai.insights.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <h3 className="text-white font-semibold text-sm mb-2">Key Insights</h3>
                      {project.raftai.insights.map((insight: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-white/80 text-xs">{insight}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {project.raftai?.risks && Array.isArray(project.raftai.risks) && project.raftai.risks.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <h3 className="text-white font-semibold text-sm mb-2">Risks</h3>
                      {project.raftai.risks.map((risk: any, idx: number) => (
                        <div key={idx} className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                          <p className="text-red-300 text-xs">{risk}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {project.raftai?.recommendations && Array.isArray(project.raftai.recommendations) && project.raftai.recommendations.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <h3 className="text-white font-semibold text-sm mb-2">Recommendations</h3>
                      {project.raftai.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-blue-300 text-xs">{rec}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-xs text-center">
                      ⚠️ Preliminary assessment. Conduct full due diligence.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <NeonCyanIcon type="cpu" size={48} className="text-white/30 mx-auto mb-4" />
                  <p className="text-white/60 text-sm mb-2">No RaftAI Analysis Available</p>
                  <p className="text-white/40 text-xs">Analysis will appear here once the project is analyzed by RaftAI</p>
                </div>
              )}
            </div>

            {/* Chain & Social Links */}
            <div className="neo-glass-card rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <NeonCyanIcon type="globe" size={20} className="text-cyan-400" />
                Chain & Socials
              </h3>
              <div className="space-y-3">
                {project.chain && (
                  <div>
                    <p className="text-white/60 text-sm mb-1">Blockchain</p>
                    <p className="text-white font-semibold">{project.chain}</p>
                  </div>
                )}
                {project.social && (
                  <div className="space-y-2">
                    {project.social.website && (
                      <a href={project.social.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm">
                        <NeonCyanIcon type="globe" size={16} className="text-current" />
                        Website
                      </a>
                    )}
                    {project.social.twitter && (
                      <a href={project.social.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm">
                        <NeonCyanIcon type="users" size={16} className="text-current" />
                        Twitter
                      </a>
                    )}
                    {project.social.telegram && (
                      <a href={project.social.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm">
                        <NeonCyanIcon type="users" size={16} className="text-current" />
                        Telegram
                      </a>
                    )}
                    {project.social.discord && (
                      <a href={project.social.discord} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm">
                        <NeonCyanIcon type="users" size={16} className="text-current" />
                        Discord
                      </a>
                    )}
                    {project.social.linkedin && (
                      <a href={project.social.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm">
                        <NeonCyanIcon type="users" size={16} className="text-current" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Project Bio */}
            {project.bio && (
              <div className="neo-glass-card rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <NeonCyanIcon type="document" size={20} className="text-cyan-400" />
                  About
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">{project.bio}</p>
              </div>
            )}

            {/* Founder Info */}
            <div className="neo-glass-card rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <NeonCyanIcon type="user" size={20} className="text-cyan-400" />
                Founder
              </h3>
              <div className="space-y-3">
                <div className="flex justify-center mb-3">
                  {/* Only render img if founderLogo is a valid HTTPS URL to prevent 404 errors */}
                  {project.founderLogo && typeof project.founderLogo === 'string' && project.founderLogo.startsWith('https://') ? (
                    <img 
                      src={project.founderLogo} 
                      alt={project.founderName || 'Founder'}
                      className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400/30"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        // Show fallback
                        const fallback = img.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Always show fallback if no valid logo */}
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center border-2 border-cyan-400/30 ${(project.founderLogo && typeof project.founderLogo === 'string' && project.founderLogo.startsWith('https://')) ? 'hidden' : ''}`}>
                    <span className="text-white font-bold text-2xl">
                      {(project.founderName || 'F').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Name</p>
                  <p className="text-white font-semibold">{project.founderName || 'Not specified'}</p>
                </div>
                {project.founderEmail && (
                  <div>
                    <p className="text-white/60 text-sm">Email</p>
                    <p className="text-white font-semibold text-sm">{project.founderEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {project.status === 'pending' && (
              <div className="space-y-3">
                <AnimatedButton
                  variant="success"
                  onClick={handleAcceptProject}
                  loading={actionLoading}
                  icon={<NeonCyanIcon type="check" size={24} className="text-current" />}
                  fullWidth
                >
                  Accept & Start Milestones
                </AnimatedButton>
                <AnimatedButton
                  variant="secondary"
                  onClick={() => router.push(`/messages?projectId=${projectId}`)}
                  icon={<NeonCyanIcon type="users" size={20} className="text-current" />}
                  fullWidth
                >
                  Message Founder
                </AnimatedButton>
                <AnimatedButton
                  variant="danger"
                  onClick={handleRejectProject}
                  loading={actionLoading}
                  icon={<NeonCyanIcon type="exclamation" size={24} className="text-current" />}
                  fullWidth
                >
                  Decline Project
                </AnimatedButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
