"use client";

import { useEffect, useState, useMemo } from "react";
import { ensureDb, createSnapshotErrorHandler } from "@/lib/firebase-utils";
import { collection, query, onSnapshot } from "firebase/firestore";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  FireIcon
} from "@heroicons/react/24/outline";
import ProjectCard from "@/components/dealflow/ProjectCard";
import ProjectDetailModal from "@/components/dealflow/ProjectDetailModal";
import DealflowAnalytics from "@/components/dealflow/DealflowAnalytics";
import LiveTicker from "@/components/dealflow/LiveTicker";
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface Project {
  id: string;
  title?: string;
  name?: string;
  sector?: string;
  chain?: string;
  stage?: string;
  valueProposition?: string;
  valuePropOneLine?: string;
  description?: string;
  logo?: string;
  logoUrl?: string;
  image?: string;
  badges?: {
    kyc?: boolean;
    kyb?: boolean;
    audit?: boolean;
    doxxed?: boolean;
  };
  funding?: {
    target?: number;
    raised?: number;
    currency?: string;
    investorCount?: number;
  };
  ido?: {
    status?: 'upcoming' | 'live' | 'completed';
    startDate?: any;
    endDate?: any;
    exchange?: string;
    platform?: string;
  };
  compliance?: {
    status?: 'compliant' | 'under_review' | 'pending';
    certikLink?: string;
    kycStatus?: 'verified' | 'pending' | 'not_submitted';
    kybStatus?: 'verified' | 'pending' | 'not_submitted';
  };
  social?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  interest?: {
    vcs?: number;
    exchanges?: number;
    idos?: number;
    influencers?: number;
    agencies?: number;
  };
  visibility?: {
    discoverable?: boolean;
    publicFields?: string[];
  };
  createdAt?: any;
  updatedAt?: any;
}

interface PlatformStats {
  totalProjects: number;
  totalFundsRaised: number;
  totalInvestors: number;
  verifiedProjects: number;
  idoCompleted: number;
  activeProjects: number;
}

// Helper function to convert Firestore timestamp to number
const getTimestamp = (date: any): number => {
  if (!date) return 0;
  if (date.toMillis) return date.toMillis();
  if (date.seconds) return date.seconds * 1000;
  if (typeof date === 'number') return date;
  if (date instanceof Date) return date.getTime();
  try {
    return new Date(date).getTime();
  } catch {
    return 0;
  }
};

export default function DealflowPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalProjects: 0,
    totalFundsRaised: 0,
    totalInvestors: 0,
    verifiedProjects: 0,
    idoCompleted: 0,
    activeProjects: 0
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: [] as string[],
    exchange: [] as string[],
    category: [] as string[],
    compliance: [] as string[],
    search: ''
  });
  
  // Sorting
  const [sortBy, setSortBy] = useState<'raised' | 'date' | 'investors' | 'progress'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load projects with real-time updates
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;
    
    const setupListener = async () => {
      try {
        // Enhanced Firebase initialization with retry
        const { waitForFirebase, ensureDb } = await import('@/lib/firebase-utils');
        let isReady = await waitForFirebase(10000);
        if (!isReady) {
          console.warn('⚠️ Firebase not ready, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          isReady = await waitForFirebase(10000);
        }
        
        if (!isReady || !isMounted) {
          if (!isReady) {
            console.error('❌ Firebase not initialized after retries');
          }
          setLoading(false);
          return;
        }
        
        const dbInstance = ensureDb();
        if (!dbInstance || !isMounted) {
          console.error('❌ Database instance not available');
          setLoading(false);
          return;
        }

        // Query without any orderBy to avoid index requirements - sort client-side
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          if (!isMounted) return;
          
          const allProjects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Project[];

          // CRITICAL: Only show approved projects in dealflow
          // Projects must be approved by admin AND have visibility flags set
          let projectsData = allProjects.filter(p => {
            const status = (p.status || '').toLowerCase();
            const reviewStatus = (p.reviewStatus || '').toLowerCase();
            
            // Must be approved
            const isApproved = status === 'approved' || reviewStatus === 'approved';
            
            // Must have visibility set to discoverable (set by admin on approval)
            const isDiscoverable = p.visibility?.discoverable === true;
            
            // Only show if both conditions are met
            return isApproved && isDiscoverable;
          });

          // Sort by createdAt client-side (newest first)
          projectsData.sort((a, b) => {
            const aTime = getTimestamp(a.createdAt);
            const bTime = getTimestamp(b.createdAt);
            return bTime - aTime; // Descending order
          });

          if (!isMounted) return;
          setProjects(projectsData);
          
          // Calculate platform stats
          const stats: PlatformStats = {
            totalProjects: projectsData.length,
            totalFundsRaised: projectsData.reduce((sum, p) => sum + (p.funding?.raised || 0), 0),
            totalInvestors: projectsData.reduce((sum, p) => sum + (p.funding?.investorCount || 0), 0),
            verifiedProjects: projectsData.filter(p => 
              p.badges?.kyc || p.badges?.kyb || p.compliance?.kycStatus === 'verified'
            ).length,
            idoCompleted: projectsData.filter(p => p.ido?.status === 'completed').length,
            activeProjects: projectsData.filter(p => 
              p.ido?.status === 'live' || p.ido?.status === 'upcoming'
            ).length
          };
          
          if (!isMounted) return;
          setPlatformStats(stats);
          setLoading(false);
        }, createSnapshotErrorHandler('dealflow projects'));
      } catch (error) {
        if (!isMounted) return;
        console.error('Error setting up projects listener:', error);
        setLoading(false);
      }
    };
    
    setupListener();
    
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const title = (project.title || project.name || '').toLowerCase();
        const sector = (project.sector || '').toLowerCase();
        const description = (project.description || project.valueProposition || project.valuePropOneLine || '').toLowerCase();
        
        if (!title.includes(searchLower) && !sector.includes(searchLower) && !description.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status.length > 0) {
        const projectStatus = project.ido?.status || 'upcoming';
        if (!filters.status.includes(projectStatus)) {
          return false;
        }
      }

      // Exchange filter
      if (filters.exchange.length > 0) {
        const exchange = project.ido?.exchange || project.ido?.platform || '';
        if (!filters.exchange.some(e => exchange.toLowerCase().includes(e.toLowerCase()))) {
          return false;
        }
      }

      // Category filter
      if (filters.category.length > 0) {
        const sector = (project.sector || '').toLowerCase();
        if (!filters.category.some(c => sector.includes(c.toLowerCase()))) {
          return false;
        }
      }

      // Compliance filter
      if (filters.compliance.length > 0) {
        const isVerified = project.badges?.kyc || project.badges?.kyb || project.compliance?.kycStatus === 'verified';
        if (filters.compliance.includes('verified') && !isVerified) {
          return false;
        }
        if (filters.compliance.includes('pending') && isVerified) {
          return false;
        }
      }

      return true;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: number = 0;
      let bValue: number = 0;

      switch (sortBy) {
        case 'raised':
          aValue = a.funding?.raised || 0;
          bValue = b.funding?.raised || 0;
          break;
        case 'investors':
          aValue = a.funding?.investorCount || 0;
          bValue = b.funding?.investorCount || 0;
          break;
        case 'progress':
          const aTarget = a.funding?.target || 1;
          const bTarget = b.funding?.target || 1;
          aValue = ((a.funding?.raised || 0) / aTarget) * 100;
          bValue = ((b.funding?.raised || 0) / bTarget) * 100;
          break;
        case 'date':
        default:
          aValue = getTimestamp(a.createdAt);
          bValue = getTimestamp(b.createdAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [projects, filters, sortBy, sortOrder]);

  const toggleFilter = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = prev[filterType] as string[];
      if (current.includes(value)) {
        return { ...prev, [filterType]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [filterType]: [...current, value] };
      }
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen neo-blue-background flex items-center justify-center">
        <div className="text-white text-xl">Loading dealflow...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neo-blue-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Dealflow Dashboard
          </h1>
          <p className="text-white/70 text-lg max-w-3xl mx-auto">
            Real-time transparent dashboard tracking verified projects, funding, and IDOs
          </p>
        </div>

        {/* Live Ticker */}
        <LiveTicker projects={projects} />

        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="neo-glass-card rounded-xl p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Total Projects</div>
            <div className="text-2xl font-bold text-white">{platformStats.totalProjects}</div>
          </div>
          <div className="neo-glass-card rounded-xl p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Funds Raised</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(platformStats.totalFundsRaised)}</div>
          </div>
          <div className="neo-glass-card rounded-xl p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Total Investors</div>
            <div className="text-2xl font-bold text-white">{platformStats.totalInvestors.toLocaleString()}</div>
          </div>
          <div className="neo-glass-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
              <CheckCircleIcon className="w-4 h-4 text-green-400" />
              Verified
            </div>
            <div className="text-2xl font-bold text-white">{platformStats.verifiedProjects}</div>
          </div>
          <div className="neo-glass-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
              <RocketLaunchIcon className="w-4 h-4 text-blue-400" />
              IDO Completed
            </div>
            <div className="text-2xl font-bold text-white">{platformStats.idoCompleted}</div>
          </div>
          <div className="neo-glass-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
              <FireIcon className="w-4 h-4 text-orange-400" />
              Active
            </div>
            <div className="text-2xl font-bold text-white">{platformStats.activeProjects}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showAnalytics
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <ChartBarIcon className="w-5 h-5" />
              Analytics
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="neo-glass-card rounded-xl p-6 border border-white/10 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-white/80 text-sm mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['upcoming', 'live', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => toggleFilter('status', status)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        filters.status.includes(status)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-white/80 text-sm mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {['DeFi', 'GameFi', 'NFT', 'Infrastructure', 'Metaverse'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleFilter('category', cat)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        filters.category.includes(cat)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exchange Filter */}
              <div>
                <label className="block text-white/80 text-sm mb-2">Exchange/Platform</label>
                <div className="flex flex-wrap gap-2">
                  {['Binance', 'Seedify', 'Cryptorafts', 'Other'].map(ex => (
                    <button
                      key={ex}
                      onClick={() => toggleFilter('exchange', ex)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        filters.exchange.includes(ex)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance Filter */}
              <div>
                <label className="block text-white/80 text-sm mb-2">Compliance</label>
                <div className="flex flex-wrap gap-2">
                  {['verified', 'pending'].map(comp => (
                    <button
                      key={comp}
                      onClick={() => toggleFilter('compliance', comp)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        filters.compliance.includes(comp)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {comp.charAt(0).toUpperCase() + comp.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <label className="block text-white/80 text-sm mb-2">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'date', label: 'Date Added' },
                  { value: 'raised', label: 'Funds Raised' },
                  { value: 'investors', label: 'Investor Count' },
                  { value: 'progress', label: 'Progress %' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (sortBy === option.value) {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy(option.value as any);
                        setSortOrder('desc');
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      sortBy === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                    {sortBy === option.value && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Panel */}
        {showAnalytics && (
          <div className="mb-6">
            <DealflowAnalytics projects={filteredAndSortedProjects} />
          </div>
        )}

        {/* Projects Grid/Table */}
        <div className="mb-8">
          {filteredAndSortedProjects.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => setSelectedProject(project)}
                  />
                ))}
              </div>
            ) : (
              <div className="neo-glass-card rounded-xl border border-white/10 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-white/80 font-semibold">Project</th>
                      <th className="text-left p-4 text-white/80 font-semibold">Category</th>
                      <th className="text-left p-4 text-white/80 font-semibold">Funding</th>
                      <th className="text-left p-4 text-white/80 font-semibold">Progress</th>
                      <th className="text-left p-4 text-white/80 font-semibold">Investors</th>
                      <th className="text-left p-4 text-white/80 font-semibold">Interest</th>
                      <th className="text-left p-4 text-white/80 font-semibold">Status</th>
                      <th className="text-left p-4 text-white/80 font-semibold">Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedProjects.map(project => (
                      <tr
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const logoUrl = extractProjectLogoUrl(project);
                              return logoUrl ? (
                                <img 
                                  src={logoUrl} 
                                  alt={project.title || project.name || 'Project'} 
                                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null;
                            })()}
                            {!extractProjectLogoUrl(project) && (
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-400/30 shadow-lg shadow-cyan-500/20">
                                <span className="text-white font-bold text-sm">
                                  {(project.title || project.name || 'P').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-white font-medium">{project.title || project.name}</div>
                              <div className="text-white/60 text-sm">{project.ido?.exchange || project.ido?.platform || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-white/80">{project.sector || 'N/A'}</td>
                        <td className="p-4 text-white/80">
                          {formatCurrency(project.funding?.raised || 0)} / {formatCurrency(project.funding?.target || 0)}
                        </td>
                        <td className="p-4">
                          <div className="w-24 bg-white/10 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, ((project.funding?.raised || 0) / (project.funding?.target || 1)) * 100)}%`
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-4 text-white/80">{project.funding?.investorCount || 0}</td>
                        <td className="p-4">
                          {project.interest && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {project.interest.vcs !== undefined && project.interest.vcs > 0 && (
                                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                                  {project.interest.vcs} VC{project.interest.vcs !== 1 ? 's' : ''}
                                </span>
                              )}
                              {project.interest.exchanges !== undefined && project.interest.exchanges > 0 && (
                                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                                  {project.interest.exchanges} Ex
                                </span>
                              )}
                              {project.interest.influencers !== undefined && project.interest.influencers > 0 && (
                                <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                                  {project.interest.influencers} Inf
                                </span>
                              )}
                              {project.interest.agencies !== undefined && project.interest.agencies > 0 && (
                                <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400">
                                  {project.interest.agencies} Ag
                                </span>
                              )}
                              {(!project.interest || (
                                (project.interest.vcs || 0) === 0 &&
                                (project.interest.exchanges || 0) === 0 &&
                                (project.interest.influencers || 0) === 0 &&
                                (project.interest.agencies || 0) === 0
                              )) && (
                                <span className="text-white/40 text-xs">No interest yet</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            project.ido?.status === 'live' ? 'bg-green-500/20 text-green-400' :
                            project.ido?.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {project.ido?.status || 'upcoming'}
                          </span>
                        </td>
                        <td className="p-4">
                          {(project.badges?.kyc || project.badges?.kyb) ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Verified</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="neo-glass-card rounded-xl p-12 text-center border border-white/10">
              <div className="text-white/60 text-lg mb-4">No projects found</div>
              <div className="text-white/40 text-sm">Try adjusting your filters</div>
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          userRole="market" // Public dealflow - market role
        />
      )}
    </div>
  );
}

