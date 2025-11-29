"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Project {
  id: string;
  name: string;
  description: string;
  founderId: string;
  founderName: string;
  founderEmail: string;
  status: string;
  category: string;
  createdAt: any;
  updatedAt: any;
  fundingGoal?: number;
  currentFunding?: number;
  isActive: boolean;
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    approved: 0,
    rejected: 0
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
              loadProjects();
              setupRealtimeUpdates();
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

  const loadProjects = async () => {
    if (!user) return;

    try {
      console.log('⚡ Loading projects...');

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
      
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      
      const projectsQuery = query(
        collection(dbInstance, 'projects'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(projectsQuery);
      const projectsData: Project[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
          id: doc.id,
          name: data.name || 'Untitled Project',
          description: data.description || '',
          founderId: data.founderId || '',
          founderName: data.founderName || 'Unknown Founder',
          founderEmail: data.founderEmail || 'N/A',
          status: data.status || 'pending',
          category: data.category || 'Other',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          fundingGoal: data.fundingGoal,
          currentFunding: data.currentFunding,
          isActive: data.isActive !== false
        });
      });
      
      setProjects(projectsData);
      setFilteredProjects(projectsData);
      
      // Update stats
      const stats = {
        total: projectsData.length,
        active: projectsData.filter(p => p.isActive).length,
        pending: projectsData.filter(p => p.status === 'pending').length,
        approved: projectsData.filter(p => p.status === 'approved').length,
        rejected: projectsData.filter(p => p.status === 'rejected').length
      };
      setStats(stats);

      console.log('✅ Projects loaded successfully');
    } catch (error) {
      console.error('❌ Error loading projects:', error);
    }
  };

  // Setup real-time updates for projects
  const setupRealtimeUpdates = async () => {
    if (!user) return;

    try {
      console.log('🔄 Setting up real-time project updates...');
      
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
      
      const { onSnapshot, collection, query, orderBy } = await import('firebase/firestore');
      
      // Listen for project changes
      const projectsUnsubscribe = onSnapshot(
        query(collection(dbInstance, 'projects'), orderBy('createdAt', 'desc')), 
        (snapshot) => {
          const projectsData: Project[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            projectsData.push({
              id: doc.id,
              name: data.name || 'Untitled Project',
              description: data.description || '',
              founderId: data.founderId || '',
              founderName: data.founderName || 'Unknown Founder',
              founderEmail: data.founderEmail || 'N/A',
              status: data.status || 'pending',
              category: data.category || 'Other',
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              fundingGoal: data.fundingGoal,
              currentFunding: data.currentFunding,
              isActive: data.isActive !== false
            });
          });

          // Force re-render by creating new array references
          const newProjectsData = [...projectsData];
          setProjects(newProjectsData);
          setFilteredProjects(newProjectsData);

          // Update stats
          const stats = {
            total: projectsData.length,
            active: projectsData.filter(p => p.isActive).length,
            pending: projectsData.filter(p => p.status === 'pending').length,
            approved: projectsData.filter(p => p.status === 'approved').length,
            rejected: projectsData.filter(p => p.status === 'rejected').length
          };
          setStats(stats);
          
          console.log('✅ Real-time project updates active -', projectsData.length, 'projects');
          console.log('🔄 State updated - triggering re-render with', projectsData.length, 'projects');
        },
        createSnapshotErrorHandler('admin projects')
      );

      return projectsUnsubscribe;
    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
    }
  };

  useEffect(() => {
    console.log('🔍 Filter effect triggered - projects:', projects.length, 'searchTerm:', searchTerm, 'statusFilter:', statusFilter);
    
    // Create a new array to ensure React detects the change
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.founderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length, 'projects');
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
      console.log('🔍 After status filter:', filtered.length, 'projects');
    }

    console.log('✅ Setting filteredProjects to', filtered.length, 'projects');
    // Force update by creating new array reference
    setFilteredProjects([...filtered]);
  }, [projects, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-cyan-400/70';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <NeonCyanIcon type="check" size={16} className="text-green-400" />;
      case 'pending': return <NeonCyanIcon type="clock" size={16} className="text-yellow-400" />;
      case 'rejected': return <NeonCyanIcon type="x-circle" size={16} className="text-red-400" />;
      default: return <NeonCyanIcon type="rocket" size={16} className="text-cyan-400/70" />;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading projects..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-black/80 backdrop-blur-lg border-2 border-cyan-400/30 rounded-2xl p-8 shadow-2xl shadow-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/admin-dashboard')}
              className="flex items-center gap-3 px-6 py-3 bg-black/60 border-2 border-cyan-400/20 hover:border-cyan-400/50 text-white rounded-2xl transition-all duration-300 shadow-lg shadow-cyan-500/10 hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-bold">Back to Dashboard</span>
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Project Management</h1>
              <p className="text-gray-300 text-lg">Manage platform projects and their approval status</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-xl">
              <NeonCyanIcon type="clock" size={16} className="text-current" />
              <span>Last Updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-xl border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-semibold">Live Data</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Projects</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <NeonCyanIcon type="rocket" size={32} className="text-purple-400" />
          </div>
        </div>
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
              <div>
              <p className="text-white/70 text-sm">Active Projects</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <NeonCyanIcon type="star" size={32} className="text-green-400" />
          </div>
        </div>
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
              <div>
              <p className="text-white/70 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
            <NeonCyanIcon type="clock" size={32} className="text-yellow-400" />
          </div>
        </div>
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
              <div>
              <p className="text-white/70 text-sm">Approved</p>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
            </div>
            <NeonCyanIcon type="check" size={32} className="text-green-400" />
            </div>
          </div>
          <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-4 shadow-cyan-500/10">
          <div className="flex items-center justify-between">
              <div>
              <p className="text-white/70 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-white">{stats.rejected}</p>
            </div>
            <NeonCyanIcon type="x-circle" size={32} className="text-red-400" />
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
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50"
              />
            </div>
          </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-black/40 border-2 border-cyan-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
        </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
          <div key={project.id} className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-xl p-6 hover:bg-black/80 hover:border-cyan-400/50 transition-colors shadow-cyan-500/10">
              <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                  {getStatusIcon(project.status)}
                <span className={`ml-2 text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <Link href={`/admin/project/${project.id}`}>
                <button className="text-gray-400 hover:text-white">
                  <NeonCyanIcon type="eye" size={16} className="text-current" />
                </button>
              </Link>
              </div>

            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
              {project.name}
            </h3>
            
            <p className="text-gray-300 text-sm mb-4 line-clamp-3">
              {project.description}
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Founder:</span>
                <span className="text-white">{project.founderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-white">{project.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Funding Goal:</span>
                <span className="text-white">{formatCurrency(project.fundingGoal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current:</span>
                <span className="text-white">{formatCurrency(project.currentFunding)}</span>
              </div>
                </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Created: {project.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                <span>Updated: {project.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <NeonCyanIcon type="rocket" size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
      </div>
    </div>
  );
}