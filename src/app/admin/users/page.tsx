"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  kycStatus: string;
  kybStatus: string;
  createdAt: any;
  lastLoginAt?: any;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [mounted, setMounted] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [kycDetails, setKycDetails] = useState<any>(null);
  const [kybDetails, setKybDetails] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [pitches, setPitches] = useState<any[]>([]);
  const [realtimeListener, setRealtimeListener] = useState<(() => void) | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pendingKYC: 0,
    verified: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
              loadUsers();
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

  const loadUsers = async () => {
    if (!user) {
      console.log('⏳ Waiting for user authentication...');
      return;
    }

    try {
      console.log('⚡ Loading users (initial load)...');

      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }
      
      const firestoreDb = ensureDb();
      if (!firestoreDb) {
        console.error('❌ Firebase database not initialized');
        return;
      }
      
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      
      console.log('📊 Fetching users from Firebase...');
      const usersQuery = query(
        collection(firestoreDb, 'users'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(usersQuery);
      console.log('📊 Found', snapshot.size, 'users in Firebase');
      
      const usersData: User[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
        id: doc.id,
          email: data.email || 'N/A',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          role: data.role || 'user',
          kycStatus: data.kycStatus || 'pending',
          kybStatus: data.kybStatus || 'pending',
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
          isActive: data.isActive !== false
        });
      });
      
      // Force update with new array references
      const newUsersData = [...usersData];
      setUsers(newUsersData);
      setFilteredUsers(newUsersData);
      
      console.log('✅ Setting state with', usersData.length, 'users');
      console.log('📊 First user preview:', usersData[0] ? { id: usersData[0].id, email: usersData[0].email } : 'none');

      // Update stats
      const stats = {
        total: usersData.length,
        active: usersData.filter(u => u.isActive).length,
        pendingKYC: usersData.filter(u => u.kycStatus === 'pending').length,
        verified: usersData.filter(u => u.kycStatus === 'verified' || u.kycStatus === 'approved').length
      };
      setStats(stats);

      console.log('✅ Users loaded successfully:', stats);
    } catch (error) {
      console.error('❌ Error loading users:', error);
    }
  };

  // Setup real-time updates for users
  const setupRealtimeUpdates = async () => {
    if (!user) return;

    try {
      console.log('🔄 Setting up real-time user updates...');
      
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
      
      const { onSnapshot, collection, query, orderBy } = await import('firebase/firestore');
      
      // Listen for user changes
      const usersUnsubscribe = onSnapshot(
        query(collection(firestoreDb, 'users'), orderBy('createdAt', 'desc')), 
        (snapshot) => {
          console.log('📊 Users updated in real-time:', snapshot.size, 'users');
          
          const usersData: User[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            usersData.push({
              id: doc.id,
              email: data.email || 'N/A',
              firstName: data.firstName || data.displayName?.split(' ')[0] || '',
              lastName: data.lastName || data.displayName?.split(' ')[1] || '',
              role: data.role || 'user',
              kycStatus: data.kycStatus || 'pending',
              kybStatus: data.kybStatus || 'pending',
              createdAt: data.createdAt,
              lastLoginAt: data.lastLoginAt,
              isActive: data.isActive !== false
            });
          });

          // Force re-render by creating new array references
          const newUsersData = [...usersData];
          setUsers(newUsersData);
          setFilteredUsers(newUsersData);

          // Update stats
          const stats = {
            total: usersData.length,
            active: usersData.filter(u => u.isActive).length,
            pendingKYC: usersData.filter(u => u.kycStatus === 'pending').length,
            verified: usersData.filter(u => u.kycStatus === 'verified' || u.kycStatus === 'approved').length
          };
          setStats(stats);
          
          console.log('✅ Real-time user updates active -', usersData.length, 'users');
          console.log('🔄 State updated - triggering re-render with', usersData.length, 'users');
        },
        createSnapshotErrorHandler('admin users')
      );

      return usersUnsubscribe;
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
        console.log('🔄 Cleaning up user real-time updates...');
        unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    console.log('🔍 Filter effect triggered - users:', users.length, 'searchTerm:', searchTerm, 'filters:', { roleFilter, statusFilter });
    
    // Create a new array to ensure React detects the change
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length, 'users');
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
      console.log('🔍 After role filter:', filtered.length, 'users');
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.kycStatus === statusFilter);
      console.log('🔍 After status filter:', filtered.length, 'users');
    }

    console.log('✅ Setting filteredUsers to', filtered.length, 'users');
    // Force update by creating new array reference
    setFilteredUsers([...filtered]);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-cyan-400/70';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <NeonCyanIcon type="check" size={16} className="text-green-400" />;
      case 'pending': return <NeonCyanIcon type="clock" size={16} className="text-yellow-400" />;
      case 'rejected': return <NeonCyanIcon type="x-circle" size={16} className="text-red-400" />;
      default: return <NeonCyanIcon type="user" size={16} className="text-cyan-400/70" />;
    }
  };

  const handleOverview = async (userData: User) => {
    console.log('🔍 Opening overview for user:', userData);
    setSelectedUser(userData);
    setShowUserModal(true);
    
    // Prevent body scroll when modal is open
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }

    // Load detailed user information
    await loadUserDetails(userData.id);
    
    // Setup real-time listener for this user
    setupUserRealtimeListener(userData.id);
  };

  const loadUserDetails = async (userId: string) => {
    try {
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
      
      const { doc, getDoc, collection, query, where, getDocs, orderBy } = await import('firebase/firestore');

      // Load full user document
      const userDoc = await getDoc(doc(dbInstance, 'users', userId));
      if (userDoc.exists()) {
        setUserDetails(userDoc.data());
      }

      // Load KYC details - Try multiple sources
      try {
        // Try subcollection first
        const kycDoc = await getDoc(doc(dbInstance, 'users', userId, 'kyc', 'verification'));
        if (kycDoc.exists()) {
          setKycDetails(kycDoc.data());
        } else {
          // Try kyc_documents collection
          const kycQuery = query(
            collection(dbInstance, 'kyc_documents'),
            where('userId', '==', userId)
          );
          const kycSnapshot = await getDocs(kycQuery);
          if (!kycSnapshot.empty) {
            const kycData = kycSnapshot.docs[0].data();
            setKycDetails(kycData);
            console.log('✅ KYC details loaded from kyc_documents:', Object.keys(kycData));
          }
        }
      } catch (error) {
        console.error('❌ Error loading KYC:', error);
      }

      // Load KYB details - Try organizations collection
      try {
        const kybQuery = query(
          collection(dbInstance, 'organizations'),
          where('userId', '==', userId)
        );
        const kybSnapshot = await getDocs(kybQuery);
        if (!kybSnapshot.empty) {
          const kybData = kybSnapshot.docs[0].data();
          setKybDetails(kybData);
          console.log('✅ KYB details loaded from organizations:', Object.keys(kybData));
        }
      } catch (error) {
        console.error('❌ Error loading KYB:', error);
      }

      // Load user projects
      const projectsQuery = query(
        collection(dbInstance, 'projects'),
        where('founderId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      setProjects(projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load user pitches
      const pitchesQuery = query(
        collection(dbInstance, 'pitches'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const pitchesSnapshot = await getDocs(pitchesQuery);
      setPitches(pitchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      console.log('✅ User details loaded:', { projects: projectsSnapshot.size, pitches: pitchesSnapshot.size });
    } catch (error) {
      console.error('❌ Error loading user details:', error);
    }
  };

  const setupUserRealtimeListener = (userId: string) => {
    // Cleanup previous listener
    if (realtimeListener) {
      realtimeListener();
    }

    const setup = async () => {
      try {
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
        
        const { doc, onSnapshot, collection, query, where, orderBy } = await import('firebase/firestore');

        // Listen for user document changes
        const userUnsubscribe = onSnapshot(doc(dbInstance, 'users', userId), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserDetails(data);
            // Update selectedUser with latest data
            setSelectedUser(prev => prev ? { ...prev, ...data } : null);
            console.log('🔄 User details updated in real-time');
          }
        });

        // Listen for KYC changes
        const kycUnsubscribe = onSnapshot(
          query(collection(dbInstance, 'kyc_documents'), where('userId', '==', userId)),
          (snapshot) => {
            if (!snapshot.empty) {
              const kycData = snapshot.docs[0].data();
              setKycDetails(kycData);
              console.log('🔄 KYC details updated in real-time:', Object.keys(kycData));
            }
          }
        );

        // Listen for KYB changes
        const kybUnsubscribe = onSnapshot(
          query(collection(dbInstance, 'organizations'), where('userId', '==', userId)),
          (snapshot) => {
            if (!snapshot.empty) {
              const kybData = snapshot.docs[0].data();
              setKybDetails(kybData);
              console.log('🔄 KYB details updated in real-time:', Object.keys(kybData));
            }
          }
        );

        // Listen for project changes
        const projectsUnsubscribe = onSnapshot(
          query(
            collection(dbInstance, 'projects'),
            where('founderId', '==', userId),
            orderBy('createdAt', 'desc')
          ),
          (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            console.log('🔄 Projects updated in real-time:', snapshot.size);
          }
        );

        // Listen for pitch changes
        const pitchesUnsubscribe = onSnapshot(
          query(
            collection(dbInstance, 'pitches'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          ),
          (snapshot) => {
            setPitches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            console.log('🔄 Pitches updated in real-time:', snapshot.size);
          }
        );

        // Return cleanup function
        const cleanup = () => {
          userUnsubscribe();
          kycUnsubscribe();
          kybUnsubscribe();
          projectsUnsubscribe();
          pitchesUnsubscribe();
        };

        setRealtimeListener(() => cleanup);
        return cleanup;
      } catch (error) {
        console.error('❌ Error setting up real-time listener:', error);
      }
    };

    setup();
  };

  const closeModal = () => {
    console.log('❌ Closing modal');
    
    // Cleanup real-time listener
    if (realtimeListener) {
      realtimeListener();
      setRealtimeListener(null);
    }
    
    // Clear loaded data
    setUserDetails(null);
    setKycDetails(null);
    setKybDetails(null);
    setProjects([]);
    setPitches([]);
    
      setShowUserModal(false);
    setSelectedUser(null);
    
    // Restore body scroll when modal is closed
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
  };

  const handleApprove = async (userId: string, userEmail: string) => {
    if (!confirm(`Approve user ${userEmail}?`)) return;
    
    try {
      setIsProcessing(true);
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setIsProcessing(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ Database not available');
        setIsProcessing(false);
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const userRef = doc(dbInstance, 'users', userId);
      await updateDoc(userRef, {
        kycStatus: 'verified',
        isActive: true,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      alert('✅ User approved successfully!');
      console.log('✅ User approved:', userEmail);
    } catch (error) {
      console.error('❌ Error approving user:', error);
      alert('Error approving user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (userId: string, userEmail: string) => {
    const reason = prompt(`Reject user ${userEmail}?\nPlease provide a reason:`);
    if (!reason) return;
    
    try {
      setIsProcessing(true);
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setIsProcessing(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ Database not available');
        setIsProcessing(false);
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const userRef = doc(dbInstance, 'users', userId);
      await updateDoc(userRef, {
        kycStatus: 'rejected',
        isActive: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      alert('❌ User rejected');
      console.log('❌ User rejected:', userEmail, 'Reason:', reason);
    } catch (error) {
      console.error('❌ Error rejecting user:', error);
      alert('Error rejecting user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecheck = async (userId: string, userEmail: string) => {
    if (!confirm(`Mark ${userEmail} for recheck?`)) return;
    
    try {
      setIsProcessing(true);
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        setIsProcessing(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ Database not available');
        setIsProcessing(false);
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const userRef = doc(dbInstance, 'users', userId);
      await updateDoc(userRef, {
        kycStatus: 'pending',
        needsRecheck: true,
        recheckRequestedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      alert('🔄 User marked for recheck');
      console.log('🔄 User marked for recheck:', userEmail);
    } catch (error) {
      console.error('❌ Error marking user for recheck:', error);
      alert('Error marking user for recheck');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading users..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <div>
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/admin-dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <NeonCyanIcon type="users" size={32} className="text-blue-400" />
                User Management
              </h1>
            </div>
          <p className="text-white/60">Manage platform users and their verification status</p>
              </div>
            </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
                <NeonCyanIcon type="users" size={32} className="text-blue-400" />
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <NeonCyanIcon type="shield" size={32} className="text-green-400" />
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Pending KYC</p>
              <p className="text-2xl font-bold text-white">{stats.pendingKYC}</p>
            </div>
            <NeonCyanIcon type="clock" size={32} className="text-yellow-400" />
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Verified Users</p>
              <p className="text-2xl font-bold text-white">{stats.verified}</p>
            </div>
            <NeonCyanIcon type="check" size={32} className="text-green-400" />
          </div>
          </div>
        </div>

        {/* Filters */}
      <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <NeonCyanIcon type="search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400/70" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50"
              />
            </div>
          </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50"
            >
              <option value="all">All Roles</option>
            <option value="founder">Founders</option>
            <option value="vc">VCs</option>
            <option value="exchange">Exchanges</option>
            <option value="ido">IDOs</option>
            <option value="influencer">Influencers</option>
              <option value="agency">Agencies</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
      <div className="bg-gray-800 border border-gray-600 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ display: 'table' }}>
            {/* Debug Header */}
            {process.env.NODE_ENV === 'development' && (
              <thead>
                <tr>
                  <td colSpan={6} className="p-2 bg-yellow-900/20 text-yellow-300 text-xs">
                    Showing {filteredUsers.length} of {users.length} users | 
                    Search: "{searchTerm}" | Filters: {roleFilter}/{statusFilter}
                  </td>
                </tr>
              </thead>
            )}
            <thead className="bg-black/40 border-b border-cyan-400/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">KYC Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">KYB Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-700" style={{ display: 'table-row-group' }}>
              {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => {
                console.log('🖥️ Rendering user in table:', user.id, user.email);
                return (
                <tr 
                  key={user.id} 
                  className="hover:bg-black/40"
                  style={{ display: 'table-row', visibility: 'visible' }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <NeonCyanIcon type="user" size={20} className="text-gray-300" />
                        </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {user.role}
                      </span>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(user.kycStatus)}
                      <span className={`ml-2 text-sm ${getStatusColor(user.kycStatus)}`}>
                        {user.kycStatus}
                      </span>
                    </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(user.kybStatus)}
                      <span className={`ml-2 text-sm ${getStatusColor(user.kybStatus)}`}>
                        {user.kybStatus}
                        </span>
                      </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.createdAt ? (
                      typeof user.createdAt.toDate === 'function' ? 
                        user.createdAt.toDate().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) :
                        new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                    ) : 'N/A'}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                      {/* Overview Button */}
                        <button
                        onClick={() => handleOverview(user)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        title="Overview"
                        >
                          <NeonCyanIcon type="eye" size={16} className="text-current" />
                        </button>
                      
                      {/* Approve Button */}
                      {user.kycStatus === 'pending' && (
                        <button
                          onClick={() => handleApprove(user.id, user.email)}
                          disabled={isProcessing}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <NeonCyanIcon type="check" size={16} className="text-current" />
                        </button>
                      )}
                      
                      {/* Recheck Button */}
                      {user.kycStatus !== 'pending' && (
                        <button
                          onClick={() => handleRecheck(user.id, user.email)}
                          disabled={isProcessing}
                          className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Recheck"
                        >
                          <NeonCyanIcon type="arrow-right" size={16} className="text-current" />
                        </button>
                      )}
                      
                      {/* Reject Button */}
                      <button
                        onClick={() => handleReject(user.id, user.email)}
                        disabled={isProcessing || user.kycStatus === 'rejected'}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <NeonCyanIcon type="x-circle" size={16} className="text-current" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        </div>

      {/* Pagination */}
      {filteredUsers.length > itemsPerPage && (
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-white">
                  Page {currentPage} of {Math.ceil(filteredUsers.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredUsers.length / itemsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(filteredUsers.length / itemsPerPage)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

      {/* User Overview Modal - Fixed Positioning with Portal */}
      {mounted && showUserModal && selectedUser && typeof window !== 'undefined' ? createPortal(
        <div 
          className="user-overview-modal-wrapper"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            pointerEvents: 'auto'
          }}
        >
          {/* Backdrop */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(4px)',
              zIndex: 1
            }}
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div 
            style={{
              position: 'relative',
              backgroundColor: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '12px',
              maxWidth: '42rem',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              zIndex: 2
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-800 border-b border-gray-600 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">User Overview</h2>
                <span className="px-2 py-1 text-xs font-semibold bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  LIVE
                </span>
                  </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <NeonCyanIcon type="x-circle" size={24} className="text-current" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* User Profile Header */}
              <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg p-6">
                <div className="flex items-start gap-6">
                  {/* User Avatar with Picture */}
                  <div className="relative">
                    {userDetails?.profile_image_url || userDetails?.photoURL || selectedUser.email ? (
                      <img 
                        src={userDetails?.profile_image_url || userDetails?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.email || 'User')}&background=6366f1&color=fff&size=128`}
                        alt="User Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-cyan-400/30 shadow-lg shadow-cyan-500/20" style={{ display: userDetails?.profile_image_url || userDetails?.photoURL ? 'none' : 'flex' }}>
                      {(selectedUser.firstName?.[0] || userDetails?.displayName?.[0] || selectedUser.email?.[0] || 'U').toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {selectedUser.firstName && selectedUser.lastName 
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : userDetails?.displayName 
                          ? userDetails.displayName
                          : userDetails?.display_name
                          ? userDetails.display_name
                          : selectedUser.email?.split('@')[0] || 'Unknown User'}
                      </h3>
                      <span className={`px-4 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedUser.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <NeonCyanIcon type="envelope" size={16} className="text-current" />
                        <span>{selectedUser.email || userDetails?.email || 'N/A'}</span>
                      </div>
                      {(userDetails?.phone || userDetails?.telephone || kycDetails?.phone) && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <NeonCyanIcon type="phone" size={16} className="text-current" />
                          <span>{userDetails?.phone || userDetails?.telephone || kycDetails?.phone}</span>
                        </div>
                      )}
                      {(userDetails?.country || kycDetails?.kyc_nationality || kycDetails?.nationality) && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <NeonCyanIcon type="globe" size={16} className="text-current" />
                          <span>{userDetails?.country || kycDetails?.kyc_nationality || kycDetails?.nationality}</span>
                        </div>
                      )}
                      {(userDetails?.address || kycDetails?.kyc_address || kycDetails?.address) && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <NeonCyanIcon type="building" size={16} className="text-current" />
                          <span className="text-xs">{userDetails?.address || kycDetails?.kyc_address || kycDetails?.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span className="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                          {selectedUser.role?.toUpperCase() || 'USER'}
                        </span>
                        {userDetails?.department && (
                          <span className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
                            {userDetails.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <NeonCyanIcon type="document" size={20} className="text-blue-400" />
                    <span className="text-gray-400 text-sm font-medium">KYC Status</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(selectedUser.kycStatus)}
                    <span className={`font-bold text-lg ${getStatusColor(selectedUser.kycStatus)}`}>
                      {selectedUser.kycStatus?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  {kycDetails && (
                    <div className="space-y-1 text-xs text-gray-400">
                      {kycDetails.risk_score && (
                        <div className="flex justify-between">
                          <span>Risk Score:</span>
                          <span className={kycDetails.risk_score > 70 ? 'text-green-400' : kycDetails.risk_score > 40 ? 'text-yellow-400' : 'text-red-400'}>
                            {kycDetails.risk_score}%
                          </span>
                        </div>
                      )}
                      {kycDetails.submitted_at && (
                        <div className="flex justify-between">
                          <span>Submitted:</span>
                          <span>{kycDetails.submitted_at?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <NeonCyanIcon type="shield" size={20} className="text-green-400" />
                    <span className="text-gray-400 text-sm font-medium">KYB Status</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(selectedUser.kybStatus || kybDetails?.kybStatus)}
                    <span className={`font-bold text-lg ${getStatusColor(selectedUser.kybStatus || kybDetails?.kybStatus || 'pending')}`}>
                      {(selectedUser.kybStatus || kybDetails?.kybStatus || 'PENDING').toUpperCase()}
                    </span>
                  </div>
                  {kybDetails && (
                    <div className="space-y-1 text-xs text-gray-400">
                      {kybDetails.risk_score !== undefined && (
                        <div className="flex justify-between">
                          <span>Risk Score:</span>
                          <span className={kybDetails.risk_score > 70 ? 'text-green-400' : kybDetails.risk_score > 40 ? 'text-yellow-400' : 'text-red-400'}>
                            {kybDetails.risk_score}%
                          </span>
                        </div>
                      )}
                      {kybDetails.createdAt && (
                        <div className="flex justify-between">
                          <span>Submitted:</span>
                          <span>{kybDetails.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(userDetails?.company_name || kybDetails?.organizationName || kybDetails?.company_name) && (
                    <div className="text-xs text-gray-400 mt-2">
                      <div className="flex items-center gap-1">
                        <NeonCyanIcon type="building" size={12} className="text-current" />
                        <span className="truncate">{kybDetails?.organizationName || kybDetails?.company_name || userDetails?.company_name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RaftAI Verification Details */}
              {kycDetails && (
                <div className="bg-gradient-to-r from-purple-700/30 to-blue-700/30 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <NeonCyanIcon type="sparkles" size={24} className="text-purple-400" />
                    <h4 className="text-white font-semibold">RaftAI Verification</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {kycDetails.decision && (
                  <div>
                        <span className="text-gray-400">Decision:</span>
                        <span className={`ml-2 font-semibold ${
                          kycDetails.decision === 'APPROVED' ? 'text-green-400' :
                          kycDetails.decision === 'REJECTED' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {kycDetails.decision}
                        </span>
                  </div>
                    )}
                    {kycDetails.risk_score !== undefined && (
                  <div>
                        <span className="text-gray-400">Risk Score:</span>
                        <span className={`ml-2 font-semibold ${
                          kycDetails.risk_score > 70 ? 'text-green-400' :
                          kycDetails.risk_score > 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {kycDetails.risk_score}%
                        </span>
                  </div>
                    )}
                    {kycDetails.verified_at && (
                      <div>
                        <span className="text-gray-400">Verified:</span>
                        <span className="ml-2 text-white">
                          {kycDetails.verified_at?.toDate?.()?.toLocaleString() || 'N/A'}
                        </span>
                </div>
                    )}
                    {kycDetails.reasons && kycDetails.reasons.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Reasons:</span>
                        <ul className="mt-1 space-y-1">
                          {kycDetails.reasons.map((reason: string, idx: number) => (
                            <li key={idx} className="text-white text-xs">• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {projects.length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <NeonCyanIcon type="rocket" size={20} className="text-blue-400" />
                      <h4 className="text-white font-semibold">Projects ({projects.length})</h4>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {projects.slice(0, 5).map((project: any) => (
                      <div key={project.id} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{project.name || 'Unnamed Project'}</p>
                          <p className="text-gray-400 text-xs">{project.status || 'pending'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {project.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    ))}
                    {projects.length > 5 && (
                      <p className="text-xs text-gray-400 text-center">+{projects.length - 5} more projects</p>
                    )}
                  </div>
                </div>
              )}

              {/* Pitches Section */}
              {pitches.length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <NeonCyanIcon type="chart" size={20} className="text-purple-400" />
                      <h4 className="text-white font-semibold">Pitches ({pitches.length})</h4>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pitches.slice(0, 5).map((pitch: any) => (
                      <div key={pitch.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">
                              {pitch.projectName || pitch.project_name || pitch.title || 'Unnamed Pitch'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {pitch.sector || pitch.chain || pitch.category || 'N/A'}
                              {pitch.stage && ` • ${pitch.stage}`}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ml-2 ${
                            pitch.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            pitch.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            pitch.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {pitch.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                        {pitch.valueProposition && (
                          <p className="text-gray-300 text-xs mt-2 line-clamp-2">
                            {pitch.valueProposition}
                          </p>
                        )}
                        {pitch.createdAt && (
                          <p className="text-gray-500 text-xs mt-2">
                            Submitted: {pitch.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </p>
                        )}
                      </div>
                    ))}
                    {pitches.length > 5 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        +{pitches.length - 5} more pitches
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <NeonCyanIcon type="user" size={20} className="text-blue-400" />
                  <h4 className="text-white font-semibold">Account Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-400 mb-1">Joined</span>
                    <span className="text-white font-medium">
                      {selectedUser.createdAt?.toDate?.()?.toLocaleDateString() || 
                       userDetails?.createdAt?.toDate?.()?.toLocaleDateString() || 
                       userDetails?.created_at?.toDate?.()?.toLocaleDateString() || 
                       'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 mb-1">Last Login</span>
                    <span className="text-white font-medium">
                      {selectedUser.lastLoginAt?.toDate?.()?.toLocaleDateString() || 
                       userDetails?.lastLogin?.toDate?.()?.toLocaleDateString() || 
                       userDetails?.last_login_at?.toDate?.()?.toLocaleDateString() || 
                       'Never'}
                    </span>
                  </div>
                  {userDetails?.loginCount !== undefined && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 mb-1">Login Count</span>
                      <span className="text-white font-medium">{userDetails.loginCount || 0}</span>
                    </div>
                  )}
                  {userDetails?.emailVerified !== undefined && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 mb-1">Email Verified</span>
                      <span className={`font-medium ${userDetails.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                        {userDetails.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {userDetails?.onboarding_state && (
                    <div className="flex flex-col col-span-2">
                      <span className="text-gray-400 mb-1">Onboarding State</span>
                      <span className="text-white font-medium">{userDetails.onboarding_state.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete KYC Details */}
              {kycDetails && Object.keys(kycDetails).length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <NeonCyanIcon type="document" size={20} className="text-blue-400" />
                    <h4 className="text-white font-semibold">Complete KYC Information</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Personal Information */}
                    {(kycDetails.kyc_legal_name || kycDetails.personalInfo?.firstName || kycDetails.firstName) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Full Name</span>
                        <span className="text-white font-medium">
                          {kycDetails.kyc_legal_name || 
                           `${kycDetails.personalInfo?.firstName || kycDetails.firstName || ''} ${kycDetails.personalInfo?.lastName || kycDetails.lastName || ''}`.trim()}
                        </span>
                      </div>
                    )}
                    {(kycDetails.kyc_date_of_birth || kycDetails.personalInfo?.dateOfBirth || kycDetails.dateOfBirth) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Date of Birth</span>
                        <span className="text-white font-medium">
                          {kycDetails.kyc_date_of_birth || kycDetails.personalInfo?.dateOfBirth || kycDetails.dateOfBirth}
                        </span>
                      </div>
                    )}
                    {(kycDetails.kyc_nationality || kycDetails.personalInfo?.nationality || kycDetails.nationality) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Nationality</span>
                        <span className="text-white font-medium">
                          {kycDetails.kyc_nationality || kycDetails.personalInfo?.nationality || kycDetails.nationality}
                        </span>
                      </div>
                    )}
                    {(kycDetails.personalInfo?.phoneNumber || kycDetails.phone || kycDetails.personalInfo?.phone) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Phone</span>
                        <span className="text-white font-medium">
                          {kycDetails.personalInfo?.phoneNumber || kycDetails.phone || kycDetails.personalInfo?.phone}
                        </span>
                      </div>
                    )}
                    {(kycDetails.kyc_address || kycDetails.personalInfo?.address || kycDetails.address) && (
                      <div className="flex flex-col col-span-2">
                        <span className="text-gray-400 mb-1">Address</span>
                        <span className="text-white font-medium text-xs">
                          {typeof (kycDetails.personalInfo?.address) === 'object' 
                            ? `${kycDetails.personalInfo.address.street || ''}, ${kycDetails.personalInfo.address.city || ''}, ${kycDetails.personalInfo.address.country || ''}`.replace(/^,\s*|,\s*$/g, '')
                            : kycDetails.kyc_address || kycDetails.address}
                        </span>
                      </div>
                    )}
                    
                    {/* ID Information */}
                    {(kycDetails.kyc_id_type || kycDetails.documents?.identityDocument?.type) && (
                      <div className="flex flex-col col-span-2 border-t border-gray-600 pt-2 mt-2">
                        <span className="text-gray-400 mb-2 font-medium">ID Document</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-1">Type</span>
                            <span className="text-white text-xs">
                              {(kycDetails.kyc_id_type || kycDetails.documents?.identityDocument?.type || '').replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          {(kycDetails.kyc_id_number_masked || kycDetails.documents?.identityDocument?.number) && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Number</span>
                              <span className="text-white text-xs font-mono">
                                {kycDetails.kyc_id_number_masked || 
                                 kycDetails.kyc_id_number_last4 ? `****${kycDetails.kyc_id_number_last4}` :
                                 kycDetails.documents?.identityDocument?.number || 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Document Images */}
                    {(kycDetails.kyc_selfie_url || kycDetails.documents?.selfie || kycDetails.selfieUrl) && (
                      <div className="flex flex-col col-span-2 border-t border-gray-600 pt-2 mt-2">
                        <span className="text-gray-400 mb-2 font-medium">Verification Images</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-500 text-xs mb-2 block">Selfie</span>
                            <img 
                              src={kycDetails.kyc_selfie_url || kycDetails.documents?.selfie || kycDetails.selfieUrl} 
                              alt="KYC Selfie"
                              className="w-full h-32 object-cover rounded-lg border border-gray-600"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                    />
                  </div>
                          {(kycDetails.kyc_id_image_url || kycDetails.documents?.identityDocument?.frontImage) && (
                  <div>
                              <span className="text-gray-500 text-xs mb-2 block">ID Document</span>
                              <img 
                                src={kycDetails.kyc_id_image_url || kycDetails.documents?.identityDocument?.frontImage} 
                                alt="ID Document"
                                className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                    />
                  </div>
                          )}
                </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Complete KYB Details */}
              {kybDetails && Object.keys(kybDetails).length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BuildingOfficeIcon className="w-5 h-5 text-green-400" />
                    <h4 className="text-white font-semibold">Complete KYB Information</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {(kybDetails.organizationName || kybDetails.company_name || kybDetails.name) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Organization Name</span>
                        <span className="text-white font-medium">
                          {kybDetails.organizationName || kybDetails.company_name || kybDetails.name}
                        </span>
                      </div>
                    )}
                    {(kybDetails.registrationNumber || kybDetails.kyb_reg_number) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Registration Number</span>
                        <span className="text-white font-medium font-mono text-xs">
                          {kybDetails.registrationNumber || kybDetails.kyb_reg_number}
                        </span>
                      </div>
                    )}
                    {(kybDetails.jurisdiction || kybDetails.kyb_jurisdiction || kybDetails.country) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Jurisdiction/Country</span>
                        <span className="text-white font-medium">
                          {kybDetails.jurisdiction || kybDetails.kyb_jurisdiction || kybDetails.country}
                        </span>
                      </div>
                    )}
                    {(kybDetails.businessAddress || kybDetails.address) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Business Address</span>
                        <span className="text-white font-medium text-xs">
                          {kybDetails.businessAddress || kybDetails.address}
                        </span>
                      </div>
                    )}
                    {(kybDetails.email || kybDetails.contactEmail) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Contact Email</span>
                        <span className="text-white font-medium text-xs">
                          {kybDetails.email || kybDetails.contactEmail}
                        </span>
                      </div>
                    )}
                    {(kybDetails.website || kybDetails.websiteUrl) && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 mb-1">Website</span>
                        <span className="text-blue-400 font-medium text-xs hover:underline">
                          <a href={kybDetails.website || kybDetails.websiteUrl} target="_blank" rel="noopener noreferrer">
                            {kybDetails.website || kybDetails.websiteUrl}
                          </a>
                        </span>
                      </div>
                    )}
                    {kybDetails.kyb && kybDetails.kyb.raftai && (
                      <div className="flex flex-col col-span-2 border-t border-gray-600 pt-2 mt-2">
                        <span className="text-gray-400 mb-2 font-medium">RaftAI KYB Analysis</span>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                            <span className="text-gray-500">Business Legitimacy:</span>
                            <span className="ml-2 text-white">{kybDetails.kyb.raftai.analysis?.businessLegitimacy || 'N/A'}%</span>
                  </div>
                  <div>
                            <span className="text-gray-500">Compliance Score:</span>
                            <span className="ml-2 text-white">{kybDetails.kyb.raftai.analysis?.complianceScore || 'N/A'}%</span>
                  </div>
                </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-600">
                  <button
                  onClick={() => {
                    handleApprove(selectedUser.id, selectedUser.email);
                    closeModal();
                  }}
                  disabled={isProcessing || selectedUser.kycStatus === 'verified'}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 border border-green-400/30"
                >
                  <NeonCyanIcon type="check" size={20} className="text-current" />
                  Approve
                  </button>
                
                  <button
                  onClick={() => {
                    handleRecheck(selectedUser.id, selectedUser.email);
                    closeModal();
                  }}
                  disabled={isProcessing || selectedUser.kycStatus === 'pending'}
                  className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <NeonCyanIcon type="arrow-right" size={20} className="text-current" />
                  Recheck
                  </button>
                
                  <button
                  onClick={() => {
                    handleReject(selectedUser.id, selectedUser.email);
                    closeModal();
                  }}
                  disabled={isProcessing || selectedUser.kycStatus === 'rejected'}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 border border-red-400/30"
                >
                  <XCircleIcon className="w-5 h-5" />
                  Reject
                  </button>
                </div>
              </div>
            </div>
        </div>,
        document.body
      ) : null}

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-gray-800 border border-gray-600 rounded-xl">
          <NeonCyanIcon type="users" size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
          <p className="text-gray-400">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No users in the system yet'}
          </p>
          </div>
        )}
      
      {/* Display Count Info */}
      {filteredUsers.length > 0 && (
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <p className="text-sm text-gray-400">
            Displaying {filteredUsers.length} of {users.length} total users
            {filteredUsers.length < users.length && (
              <span className="text-yellow-400 ml-2">
                ({users.length - filteredUsers.length} filtered out)
              </span>
            )}
          </p>
      </div>
      )}
    </div>
  );
}