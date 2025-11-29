"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  ShieldCheckIcon, 
  MagnifyingGlassIcon, 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserGroupIcon,
  XMarkIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  UsersIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  StarIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Department {
  id: string;
  name: string;
  description: string;
  headId: string;
  headName: string;
  headEmail: string;
  memberCount: number;
  budget: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: any;
  updatedAt: any;
  permissions: string[];
  members: {
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    joinedAt: any;
    status: 'active' | 'pending' | 'suspended';
  }[];
  departmentType: 'kyc' | 'kyb' | 'pitch' | 'spotlight' | 'user' | 'vc' | 'founder' | 'exchange' | 'project' | 'finance' | 'analytics' | 'audit' | 'social' | 'other';
  icon: string;
  color: string;
  accessLevel: 'read' | 'write' | 'admin';
}

export default function AdminDepartmentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalMembers: 0,
    totalBudget: 0
  });

  // Predefined departments with their configurations
  const predefinedDepartments = [
    {
      name: 'KYC Department',
      description: 'Know Your Customer verification and compliance management',
      departmentType: 'kyc' as const,
      icon: 'ShieldCheckIcon',
      color: 'blue',
      permissions: ['kyc_read', 'kyc_approve', 'kyc_reject', 'kyc_manage'],
      budget: 50000,
      accessLevel: 'admin' as const
    },
    {
      name: 'KYB Department',
      description: 'Know Your Business verification and compliance management',
      departmentType: 'kyb' as const,
      icon: 'BuildingOffice2Icon',
      color: 'green',
      permissions: ['kyb_read', 'kyb_approve', 'kyb_reject', 'kyb_manage'],
      budget: 50000,
      accessLevel: 'admin' as const
    },
    {
      name: 'Pitch Department',
      description: 'Project pitch review and evaluation management',
      departmentType: 'pitch' as const,
      icon: 'RocketLaunchIcon',
      color: 'purple',
      permissions: ['pitch_read', 'pitch_review', 'pitch_approve', 'pitch_manage'],
      budget: 75000,
      accessLevel: 'write' as const
    },
    {
      name: 'Spotlight Department',
      description: 'Project spotlight and marketing placement management',
      departmentType: 'spotlight' as const,
      icon: 'StarIcon',
      color: 'yellow',
      permissions: ['spotlight_read', 'spotlight_create', 'spotlight_manage', 'placement_control'],
      budget: 100000,
      accessLevel: 'write' as const
    },
    {
      name: 'User Department',
      description: 'User management and account administration',
      departmentType: 'user' as const,
      icon: 'UsersIcon',
      color: 'indigo',
      permissions: ['user_read', 'user_manage', 'user_suspend', 'user_delete'],
      budget: 30000,
      accessLevel: 'admin' as const
    },
    {
      name: 'VC Department',
      description: 'Venture Capital and investor relationship management',
      departmentType: 'vc' as const,
      icon: 'BriefcaseIcon',
      color: 'emerald',
      permissions: ['vc_read', 'vc_manage', 'investment_tracking', 'deal_management'],
      budget: 200000,
      accessLevel: 'write' as const
    },
    {
      name: 'Founder Department',
      description: 'Founder onboarding and support management',
      departmentType: 'founder' as const,
      icon: 'UserGroupIcon',
      color: 'orange',
      permissions: ['founder_read', 'founder_support', 'onboarding_manage'],
      budget: 40000,
      accessLevel: 'write' as const
    },
    {
      name: 'Exchange Department',
      description: 'Exchange partnerships and listing management',
      departmentType: 'exchange' as const,
      icon: 'GlobeAltIcon',
      color: 'cyan',
      permissions: ['exchange_read', 'exchange_manage', 'listing_control'],
      budget: 150000,
      accessLevel: 'write' as const
    },
    {
      name: 'Project Department',
      description: 'Project lifecycle and development management',
      departmentType: 'project' as const,
      icon: 'DocumentTextIcon',
      color: 'pink',
      permissions: ['project_read', 'project_manage', 'project_track'],
      budget: 80000,
      accessLevel: 'write' as const
    },
    {
      name: 'Finance Department',
      description: 'Financial operations and budget management',
      departmentType: 'finance' as const,
      icon: 'BanknotesIcon',
      color: 'green',
      permissions: ['finance_read', 'finance_manage', 'budget_control', 'payment_process'],
      budget: 500000,
      accessLevel: 'admin' as const
    },
    {
      name: 'Analytics Department',
      description: 'Data analytics and reporting management',
      departmentType: 'analytics' as const,
      icon: 'ChartBarIcon',
      color: 'purple',
      permissions: ['analytics_read', 'analytics_create', 'report_generate'],
      budget: 60000,
      accessLevel: 'read' as const
    },
    {
      name: 'Audit Department',
      description: 'System audit and compliance monitoring',
      departmentType: 'audit' as const,
      icon: 'ClipboardDocumentCheckIcon',
      color: 'red',
      permissions: ['audit_read', 'audit_create', 'compliance_monitor'],
      budget: 70000,
      accessLevel: 'read' as const
    },
    {
      name: 'Facebook Department',
      description: 'Facebook page management and content posting',
      departmentType: 'social' as const,
      icon: 'ShareIcon',
      color: 'blue',
      permissions: ['social_read', 'social_post', 'social_manage'],
      budget: 30000,
      accessLevel: 'admin' as const
    },
    {
      name: 'Instagram Department',
      description: 'Instagram account management and visual content creation',
      departmentType: 'social' as const,
      icon: 'ShareIcon',
      color: 'pink',
      permissions: ['social_read', 'social_post', 'social_manage'],
      budget: 35000,
      accessLevel: 'admin' as const
    },
    {
      name: 'X (Twitter) Department',
      description: 'X (Twitter) account management and real-time engagement',
      departmentType: 'social' as const,
      icon: 'ShareIcon',
      color: 'black',
      permissions: ['social_read', 'social_post', 'social_manage'],
      budget: 25000,
      accessLevel: 'admin' as const
    },
    {
      name: 'TikTok Department',
      description: 'TikTok content creation and viral video strategy',
      departmentType: 'social' as const,
      icon: 'ShareIcon',
      color: 'black',
      permissions: ['social_read', 'social_post', 'social_manage'],
      budget: 40000,
      accessLevel: 'admin' as const
    },
    {
      name: 'LinkedIn Department',
      description: 'LinkedIn professional networking and B2B content',
      departmentType: 'social' as const,
      icon: 'ShareIcon',
      color: 'blue',
      permissions: ['social_read', 'social_post', 'social_manage'],
      budget: 30000,
      accessLevel: 'admin' as const
    },
    {
      name: 'Threads Department',
      description: 'Threads platform management and text-based content',
      departmentType: 'social' as const,
      icon: 'ShareIcon',
      color: 'black',
      permissions: ['social_read', 'social_post', 'social_manage'],
      budget: 20000,
      accessLevel: 'admin' as const
    }
  ];

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase.client');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        if (auth) {
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
                // Real-time updates are handled in separate useEffect
              } else {
                router.replace('/admin/login');
              }
            } else {
              router.replace('/admin/login');
            }
            setIsLoading(false);
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...departments];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.departmentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(dept => dept.status === statusFilter);
    }

    setFilteredDepartments(filtered);
  }, [departments, searchTerm, statusFilter]);

  // Setup real-time updates with proper cleanup
  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | undefined;

    const setupRealtimeUpdates = async () => {
      try {
        console.log('🔄 Setting up real-time department updates...');
        
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          console.error('❌ Firebase not initialized');
          setIsLoading(false);
          return;
        }
        
        const dbInstance = ensureDb();
        if (!dbInstance) {
          console.error('❌ Database not available');
          setIsLoading(false);
          return;
        }
        
        const { onSnapshot, collection, query, orderBy } = await import('firebase/firestore');
        
        const departmentsUnsubscribe = onSnapshot(
          query(collection(dbInstance, 'departments'), orderBy('createdAt', 'desc')), 
          (snapshot) => {
            console.log('📊 [DEPARTMENT] Real-time update received:', snapshot.docs.length, 'documents');
            
            const departmentsData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || 'Unknown Department',
                description: data.description || '',
                headId: data.headId || '',
                headName: data.headName || 'No Head Assigned',
                headEmail: data.headEmail || 'N/A',
                memberCount: data.memberCount || 0,
                budget: data.budget || 0,
                status: data.status || 'pending',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                permissions: data.permissions || [],
                members: data.members || [],
                departmentType: (data.departmentType || 'other') as Department['departmentType'],
                icon: data.icon || 'BuildingOffice2Icon',
                color: data.color || 'gray',
                accessLevel: data.accessLevel || 'read'
              } as Department;
            });
            
            setDepartments(departmentsData);
            setIsLoading(false);
            
            // Update stats
            const total = departmentsData.length;
            const active = departmentsData.filter(d => d.status === 'active').length;
            const pending = departmentsData.filter(d => d.status === 'pending').length;
            const totalMembers = departmentsData.reduce((sum, d) => sum + d.memberCount, 0);
            const totalBudget = departmentsData.reduce((sum, d) => sum + d.budget, 0);
            
            setStats({ 
              total, 
              active, 
              pending,
              totalMembers,
              totalBudget
            });
            
            console.log('✅ [DEPARTMENT] Real-time updates active -', total, 'departments loaded');
          },
          createSnapshotErrorHandler('admin departments')
        );

        unsubscribe = departmentsUnsubscribe;
      } catch (error) {
        console.error('❌ Error setting up real-time updates:', error);
        setIsLoading(false);
      }
    };

    setupRealtimeUpdates();

    return () => {
      if (unsubscribe) {
        console.log('🔄 Cleaning up department real-time listeners...');
        unsubscribe();
      }
    };
  }, [user]);

  const createPredefinedDepartments = async () => {
    setIsSaving(true);
    try {
      console.log('🏢 Creating predefined departments...');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setIsSaving(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not initialized. Please refresh and try again.');
        setIsSaving(false);
        return;
      }
      
      const { collection, addDoc, serverTimestamp, getDocs, query, where } = await import('firebase/firestore');
      
      // Check which departments already exist
      const existingDeptsSnapshot = await getDocs(collection(dbInstance, 'departments'));
      const existingDeptNames = new Set(existingDeptsSnapshot.docs.map(doc => doc.data().name));
      
      let createdCount = 0;
      let skippedCount = 0;
      
      for (const dept of predefinedDepartments) {
        // Skip if department already exists
        if (existingDeptNames.has(dept.name)) {
          console.log(`⏭️ Skipping ${dept.name} - already exists`);
          skippedCount++;
          continue;
        }
        
        const departmentData = {
          ...dept,
          headId: '',
          headName: 'No Head Assigned',
          headEmail: 'N/A',
          memberCount: 0,
          status: 'active' as const,
          members: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(dbInstance, 'departments'), departmentData);
        createdCount++;
        console.log(`✅ Created department: ${dept.name}`);
      }
      
      console.log(`✅ Created ${createdCount} departments, skipped ${skippedCount} existing`);
      if (createdCount > 0) {
        alert(`${createdCount} department(s) created successfully!${skippedCount > 0 ? ` ${skippedCount} already existed.` : ''}`);
      } else {
        alert('All departments already exist!');
      }
    } catch (error) {
      console.error('❌ Error creating departments:', error);
      alert('Error creating departments. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (departmentId: string, newStatus: string) => {
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not initialized. Please refresh and try again.');
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      await updateDoc(doc(dbInstance, 'departments', departmentId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Department ${departmentId} status updated to ${newStatus}`);
      // Real-time listener will automatically update the UI
    } catch (error) {
      console.error('❌ Error updating department status:', error);
      alert('Error updating department status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'inactive': return <XMarkIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'write': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'read': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDepartmentIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      ShieldCheckIcon,
      BuildingOffice2Icon,
      RocketLaunchIcon,
      StarIcon,
      UsersIcon,
      BriefcaseIcon,
      UserGroupIcon,
      GlobeAltIcon,
      DocumentTextIcon,
      BanknotesIcon,
      ChartBarIcon,
      ClipboardDocumentCheckIcon,
      ShareIcon
    };
    return icons[iconName] || BuildingOffice2Icon;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading department management..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative w-full text-white">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BuildingOffice2Icon className="w-8 h-8 text-blue-400" />
              Department Management
            </h1>
            <p className="text-gray-400 mt-2">Manage all platform departments and access controls</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Budget</p>
              <p className="text-2xl font-bold text-white">${(stats.totalBudget / 1000).toFixed(0)}K</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
            </div>
            <button
              onClick={createPredefinedDepartments}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5" />
                  Create All Departments
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Departments</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BuildingOffice2Icon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active</p>
                <p className="text-white text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Pending</p>
                <p className="text-white text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Members</p>
                <p className="text-white text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments by name, description, or head..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {searchTerm && (
            <p className="mt-3 text-sm text-gray-400">
              Showing {filteredDepartments.length} of {departments.length} departments
            </p>
          )}
        </div>

        {/* Departments List */}
        <div className="space-y-4">
          {filteredDepartments.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
              <BuildingOffice2Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm ? 'No departments match your search' : 'No departments found'}
              </h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try adjusting your search criteria' : 'Create departments to get started.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={createPredefinedDepartments}
                  className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Create All Departments
                </button>
              )}
            </div>
          ) : (
            filteredDepartments.map((department) => {
              const IconComponent = getDepartmentIcon(department.icon);
              return (
                <div key={department.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 bg-${department.color}-500/20 rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`w-6 h-6 text-${department.color}-400`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{department.name}</h3>
                          <p className="text-gray-400">{department.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(department.status)}`}>
                          {getStatusIcon(department.status)}
                          {department.status.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getAccessLevelColor(department.accessLevel)}`}>
                          {department.accessLevel.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">Department Head</p>
                          <p className="text-white font-medium">{department.headName}</p>
                          <p className="text-gray-400 text-sm">{department.headEmail}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Members</p>
                          <p className="text-white font-medium">{department.memberCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Budget</p>
                          <p className="text-white font-medium">${department.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Type</p>
                          <p className="text-white font-medium capitalize">{department.departmentType}</p>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">Permissions</p>
                        <div className="flex flex-wrap gap-2">
                          {department.permissions.map((permission, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => {
                          setSelectedDepartment(department);
                          setShowMembersModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <UsersIcon className="w-4 h-4" />
                        Manage Members
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedDepartment(department);
                          setShowEditModal(true);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit Department
                      </button>
                      
                      {department.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(department.id, 'active')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleStatusChange(department.id, 'inactive')}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Deactivate
                          </button>
                        </div>
                      )}

                      {department.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(department.id, 'inactive')}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Members Management Modal */}
      {showMembersModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" style={{ zIndex: 100 }}>
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <UsersIcon className="w-6 h-6 text-blue-400" />
                  Manage Members - {selectedDepartment.name}
                </h2>
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Members */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Current Members ({selectedDepartment.members.length})</h3>
                {selectedDepartment.members.length === 0 ? (
                  <p className="text-gray-400">No members yet. Add members below.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDepartment.members.map((member, idx) => (
                      <div key={idx} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{member.userName}</p>
                          <p className="text-gray-400 text-sm">{member.userEmail}</p>
                          <p className="text-gray-500 text-xs">Role: {member.role} | Status: {member.status}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(`Remove ${member.userName} from ${selectedDepartment.name}?`)) return;
                            try {
                              const isReady = await waitForFirebase(5000);
                              if (!isReady) {
                                alert('Firebase not initialized. Please refresh and try again.');
                                return;
                              }
                              
                              const dbInstance = ensureDb();
                              if (!dbInstance) {
                                alert('Database not available. Please refresh and try again.');
                                return;
                              }
                              
                              const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                              const updatedMembers = selectedDepartment.members.filter((m, i) => i !== idx);
                              
                              await updateDoc(doc(dbInstance, 'departments', selectedDepartment.id), {
                                members: updatedMembers,
                                memberCount: updatedMembers.length,
                                updatedAt: serverTimestamp()
                              });
                              
                              alert('Member removed successfully!');
                            } catch (error: any) {
                              console.error('Error removing member:', error);
                              alert(`Error removing member: ${error?.message || 'Unknown error'}`);
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Member Form */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Member</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const memberEmail = formData.get('memberEmail') as string;
                    const memberName = formData.get('memberName') as string;
                    const memberRole = formData.get('memberRole') as string;

                    if (!memberEmail || !memberName) {
                      alert('Please fill in all required fields');
                      return;
                    }

                    try {
                      const isReady = await waitForFirebase(5000);
                      if (!isReady) {
                        alert('Firebase not initialized. Please refresh and try again.');
                        return;
                      }
                      
                      const dbInstance = ensureDb();
                      if (!dbInstance) {
                        alert('Database not available. Please refresh and try again.');
                        return;
                      }
                      
                      const { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } = await import('firebase/firestore');
                      
                      // Check if user exists
                      const usersQuery = query(collection(dbInstance, 'users'), where('email', '==', memberEmail));
                      const usersSnapshot = await getDocs(usersQuery);
                      
                      let userId = '';
                      if (!usersSnapshot.empty) {
                        userId = usersSnapshot.docs[0].id;
                      } else {
                        // User doesn't exist - create invitation
                        alert('User not found. An invitation will be sent to their email.');
                        // In a real implementation, you would send an invitation email here
                      }

                      const newMember = {
                        userId: userId || `invite-${Date.now()}`,
                        userName: memberName,
                        userEmail: memberEmail,
                        role: memberRole || 'member',
                        joinedAt: serverTimestamp(),
                        status: userId ? 'active' : 'pending'
                      };

                      const updatedMembers = [...selectedDepartment.members, newMember];
                      
                      await updateDoc(doc(dbInstance, 'departments', selectedDepartment.id), {
                        members: updatedMembers,
                        memberCount: updatedMembers.length,
                        updatedAt: serverTimestamp()
                      });
                      
                      alert('Member added successfully!');
                      (e.target as HTMLFormElement).reset();
                    } catch (error: any) {
                      console.error('Error adding member:', error);
                      alert(`Error adding member: ${error?.message || 'Unknown error'}`);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Member Name *</label>
                    <input
                      type="text"
                      name="memberName"
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Member Email *</label>
                    <input
                      type="email"
                      name="memberEmail"
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Member Role</label>
                    <select
                      name="memberRole"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="member"
                    >
                      <option value="member">Member</option>
                      <option value="lead">Lead</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Add Member
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMembersModal(false);
                        setSelectedDepartment(null);
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" style={{ zIndex: 100 }}>
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Department</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  const description = formData.get('description') as string;
                  const budget = parseFloat(formData.get('budget') as string);

                  try {
                    setIsSaving(true);
                    const isReady = await waitForFirebase(5000);
                    if (!isReady) {
                      alert('Firebase not initialized. Please refresh and try again.');
                      setIsSaving(false);
                      return;
                    }
                    
                    const dbInstance = ensureDb();
                    if (!dbInstance) {
                      alert('Database not available. Please refresh and try again.');
                      setIsSaving(false);
                      return;
                    }
                    
                    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                    
                    await updateDoc(doc(dbInstance, 'departments', selectedDepartment.id), {
                      name,
                      description,
                      budget,
                      updatedAt: serverTimestamp()
                    });
                    
                    alert('Department updated successfully!');
                    setShowEditModal(false);
                    setSelectedDepartment(null);
                  } catch (error: any) {
                    console.error('Error updating department:', error);
                    alert(`Error updating department: ${error?.message || 'Unknown error'}`);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={selectedDepartment.name}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    name="description"
                    required
                    defaultValue={selectedDepartment.description}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Budget *</label>
                  <input
                    type="number"
                    name="budget"
                    required
                    defaultValue={selectedDepartment.budget}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedDepartment(null);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}