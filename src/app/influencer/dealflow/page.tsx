'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { extractProjectLogoUrl } from '@/lib/project-utils';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Project {
  id: string;
  name: string;
  title?: string;
  description: string;
  stage: string;
  sector?: string;
  chain?: string;
  status?: string;
  reviewStatus?: string;
  visibility?: {
    discoverable?: boolean;
  };
  influencerAction?: string;
  influencerActionBy?: string;
  seekingMarketing?: boolean;
  targetRoles?: string[];
  fundingGoal: number;
  currentFunding: number;
  logo?: string;
  createdAt: any;
  adminApproved?: boolean;
  adminStatus?: string;
  raftai?: {
    rating?: string;
    score?: number;
    summary?: string;
  };
  isDoxxed?: boolean;
  isAudited?: boolean;
  badges?: {
    doxxed?: boolean;
    audit?: boolean;
  };
}

export default function InfluencerDealflowPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]); // Store all projects for stats
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    stage: [] as string[],
    sector: [] as string[],
    chain: [] as string[],
    geography: [] as string[],
    doxxed: null as boolean | null,
    audit: null as boolean | null,
    raftaiRating: [] as string[]
  });

  // Check KYC status
  useEffect(() => {
    if (!user) return;

    const checkKYCStatus = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) return;
        
        const dbInstance = ensureDb();
        if (!dbInstance) return;
        const userDocRef = doc(dbInstance, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const status = data.kycStatus || data.kyc?.status || 'pending';
          setKycStatus(status);

          if (status !== 'verified' && status !== 'approved') {
            router.push('/influencer/pending-approval');
          }
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
      }
    };

    checkKYCStatus();
  }, [user, router]);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          console.error('❌ Firebase not initialized');
          setLoading(false);
          return;
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }

        console.log('🔴 [INFLUENCER-DEALFLOW] Setting up REAL-TIME project listener');

        // Real-time listener for all projects - no orderBy to avoid index requirements
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          // Store ALL projects (before any filtering) for stats calculation
          const allProjectsRaw = snapshot.docs.map(doc => {
            const rawData = doc.data();
            const projectData: any = { id: doc.id, ...rawData };
            
            // Normalize RaftAI data - check multiple possible field names
            if (!projectData.raftai || !projectData.raftai.score) {
              if (rawData?.raftAI) {
                projectData.raftai = rawData.raftAI;
              } else if (rawData?.aiAnalysis) {
                projectData.raftai = rawData.aiAnalysis;
              } else if (rawData?.pitch?.raftai) {
                projectData.raftai = rawData.pitch.raftai;
              } else if (rawData?.pitch?.raftAI) {
                projectData.raftai = rawData.pitch.raftAI;
              }
            }
            
            return projectData;
          }) as Project[];

          // Store all projects for stats BEFORE filtering
          setAllProjects(allProjectsRaw);
          
          let projectsData = [...allProjectsRaw];

          // CRITICAL: Match VC role filtering logic
          // Only show approved projects that are discoverable AND not already accepted by this user
          projectsData = projectsData.filter(p => {
            const status = (p.status || '').toLowerCase();
            const reviewStatus = (p.reviewStatus || '').toLowerCase();
            
            // Must be approved by admin
            const isApproved = status === 'approved' || reviewStatus === 'approved' || 
                              p.adminApproved === true || p.adminStatus === 'approved';
            
            // Must have visibility set to discoverable (set by admin on approval)
            const isDiscoverable = p.visibility?.discoverable === true;
            
            // EXCLUDE if this influencer already accepted it (check influencerAction field)
            if (p.influencerAction === 'accepted' && p.influencerActionBy === user.uid) {
              return false; // Should be in campaigns/pipeline, not dealflow
            }
            
            // EXCLUDE rejected projects
            if (status === 'rejected' || reviewStatus === 'rejected') {
              return false;
            }
            
            // Must be seeking marketing (check multiple possible flags)
            const isSeekingMarketing = p.seekingMarketing === true ||
                                      (p.targetRoles && Array.isArray(p.targetRoles) && p.targetRoles.includes('influencer'));
            
            // Only show if approved AND discoverable AND seeking marketing AND not accepted by this user
            return isApproved && isDiscoverable && isSeekingMarketing;
          });

          // Sort by createdAt descending (most recent first) - client-side
          projectsData.sort((a, b) => {
            let timeA = 0;
            if (a.createdAt) {
              if (a.createdAt.toMillis) {
                timeA = a.createdAt.toMillis();
              } else if (a.createdAt.seconds) {
                timeA = a.createdAt.seconds * 1000;
              } else if (typeof a.createdAt === 'number') {
                timeA = a.createdAt;
              } else if (a.createdAt instanceof Date) {
                timeA = a.createdAt.getTime();
              } else {
                timeA = new Date(a.createdAt).getTime() || 0;
              }
            }
            
            let timeB = 0;
            if (b.createdAt) {
              if (b.createdAt.toMillis) {
                timeB = b.createdAt.toMillis();
              } else if (b.createdAt.seconds) {
                timeB = b.createdAt.seconds * 1000;
              } else if (typeof b.createdAt === 'number') {
                timeB = b.createdAt;
              } else if (b.createdAt instanceof Date) {
                timeB = b.createdAt.getTime();
              } else {
                timeB = new Date(b.createdAt).getTime() || 0;
              }
            }
            
            return timeB - timeA; // Descending order (newest first)
          });

          console.log('🔴 [INFLUENCER-DEALFLOW] Real-time update:', projectsData.length, 'filtered projects from', allProjectsRaw.length, 'total');
          setProjects(projectsData);
          setLoading(false);
        }, createSnapshotErrorHandler('influencer dealflow projects'));

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up projects listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  // Calculate stats based on ALL projects (not just filtered ones)
  const totalProjects = allProjects.length;
  const approvedProjects = allProjects.filter(p => {
    const status = (p.status || '').toLowerCase();
    const reviewStatus = (p.reviewStatus || '').toLowerCase();
    return status === 'approved' || reviewStatus === 'approved' || p.adminApproved === true || p.adminStatus === 'approved';
  });
  const pendingProjects = allProjects.filter(p => {
    const status = (p.status || '').toLowerCase();
    const reviewStatus = (p.reviewStatus || '').toLowerCase();
    return (status === 'pending' || reviewStatus === 'pending') && status !== 'approved' && reviewStatus !== 'approved';
  });
  const rejectedProjects = allProjects.filter(p => {
    const status = (p.status || '').toLowerCase();
    const reviewStatus = (p.reviewStatus || '').toLowerCase();
    return status === 'rejected' || reviewStatus === 'rejected';
  });

  const filteredProjects = useMemo(() => {
    try {
      if (!projects || projects.length === 0) return [];
      
      return projects.filter(project => {
        // Safely normalize basic string fields
        const name = typeof project.name === 'string' ? project.name : '';
        const title = typeof project.title === 'string' ? project.title : '';
        const description = typeof project.description === 'string' ? project.description : '';
        const sector = typeof project.sector === 'string' ? project.sector : '';
        const chain = typeof project.chain === 'string' ? project.chain : '';

        // Search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            name.toLowerCase().includes(searchLower) ||
            title.toLowerCase().includes(searchLower) ||
            description.toLowerCase().includes(searchLower) ||
            sector.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Stage filter - case-insensitive matching
        if (filters.stage.length > 0) {
          const projectStage = typeof project.stage === 'string' ? project.stage.toLowerCase() : '';
          if (!filters.stage.some(s => projectStage === s.toLowerCase())) {
            return false;
          }
        }

        // Sector filter - case-insensitive matching
        if (filters.sector.length > 0) {
          const projectSector = sector.toLowerCase();
          if (!filters.sector.some(s => projectSector === s.toLowerCase())) {
            return false;
          }
        }

        // Chain filter - case-insensitive matching
        if (filters.chain.length > 0) {
          const projectChain = chain.toLowerCase();
          if (!filters.chain.some(c => projectChain === c.toLowerCase())) {
            return false;
          }
        }

        // Geography filter - partial matching
        if (filters.geography.length > 0) {
          const geoSource = (project as any).geography || (project as any).location || '';
          const projectGeo = typeof geoSource === 'string' ? geoSource.toLowerCase() : '';
          if (!filters.geography.some(g => projectGeo.includes(g.toLowerCase()))) {
            return false;
          }
        }

        // Doxxed filter - check multiple fields
        if (filters.doxxed !== null) {
          const team = (project as any).team;
          const hasDoxxedTeamMember = Array.isArray(team) && team.some((m: any) => m?.doxxed === true);
          const isDoxxed = project.isDoxxed || project.badges?.doxxed || hasDoxxedTeamMember || false;
          if (isDoxxed !== filters.doxxed) {
            return false;
          }
        }

        // Audit filter - check multiple fields
        if (filters.audit !== null) {
          const auditInfo = (project as any).audit;
          const isAudited = project.isAudited || project.badges?.audit || auditInfo?.completed || false;
          if (isAudited !== filters.audit) {
            return false;
          }
        }

        // RaftAI rating filter
        if (filters.raftaiRating.length > 0) {
          const rating = project.raftai?.rating || '';
          if (!filters.raftaiRating.includes(rating)) {
            return false;
          }
        }

        return true;
      });
    } catch (err) {
      console.error('❌ [INFLUENCER-DEALFLOW] Error in filteredProjects useMemo:', err);
      // Fail-safe: if something goes wrong, return the unfiltered list so the page still renders
      return projects || [];
    }
  }, [
    projects,
    searchQuery,
    filters.stage,
    filters.sector,
    filters.chain,
    filters.geography,
    filters.doxxed,
    filters.audit,
    filters.raftaiRating,
  ]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Dealflow</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">
                  {projects.length} projects available for promotion
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                  {projects.filter(p => p.raftai?.rating === 'High').length} High Rated
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Total Projects</p>
                  <p className="text-2xl font-bold text-white">{totalProjects}</p>
                </div>
                <NeonCyanIcon type="chart" className="text-cyan-400" size={32} />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Pending Review</p>
                  <p className="text-2xl font-bold text-white">{pendingProjects.length}</p>
                </div>
                <NeonCyanIcon type="clock" className="text-yellow-400" size={32} />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-white">{approvedProjects.length}</p>
                </div>
                <NeonCyanIcon type="check" className="text-green-400" size={32} />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Rejected</p>
                  <p className="text-2xl font-bold text-white">{rejectedProjects.length}</p>
                </div>
                <NeonCyanIcon type="close" className="text-red-400" size={32} />
              </div>
            </div>
            <div className="neo-glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400/70 text-sm">Available</p>
                  <p className="text-2xl font-bold text-white">{filteredProjects.length}</p>
                </div>
                <NeonCyanIcon type="globe" className="text-cyan-400" size={32} />
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="neo-glass-card rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <NeonCyanIcon type="search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400/70" />
                <input
                  type="text"
                  placeholder="Search projects, sectors, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-cyan-400/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/40"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 bg-white/5 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-all flex items-center gap-2 font-medium text-white"
              >
                <NeonCyanIcon type="funnel" size={20} className="text-current" />
                <span>Filters</span>
                {(filters.stage.length + filters.sector.length + filters.chain.length + filters.geography.length + filters.raftaiRating.length + (filters.doxxed !== null ? 1 : 0) + (filters.audit !== null ? 1 : 0)) > 0 && (
                  <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-0.5">
                    {filters.stage.length + filters.sector.length + filters.chain.length + filters.geography.length + filters.raftaiRating.length + (filters.doxxed !== null ? 1 : 0) + (filters.audit !== null ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 neo-glass-card rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Stage</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Late Stage', 'Grants', 'Private OTC', 'Public ICO'].map(stage => (
                        <label key={stage} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.stage.includes(stage)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({ ...filters, stage: [...filters.stage, stage] });
                              } else {
                                setFilters({ ...filters, stage: filters.stage.filter(s => s !== stage) });
                              }
                            }}
                            className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                          />
                          <span className="text-sm text-white/70">{stage}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Sector</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Privacy', 'AI/ML', 'Social', 'DAO', 'Metaverse', 'Web3', 'Enterprise', 'Consumer'].map(sector => (
                        <label key={sector} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.sector.includes(sector)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({ ...filters, sector: [...filters.sector, sector] });
                              } else {
                                setFilters({ ...filters, sector: filters.sector.filter(s => s !== sector) });
                              }
                            }}
                            className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                          />
                          <span className="text-sm text-white/70">{sector}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Chain</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {['Ethereum', 'Polygon', 'BNB Chain', 'Solana', 'Avalanche', 'Arbitrum', 'Optimism', 'Base', 'Cosmos', 'Polkadot', 'Bitcoin', 'Cardano', 'Algorand', 'Near', 'Aptos', 'Sui', 'Fantom', 'Harmony', 'Cronos', 'Klaytn', 'Hedera', 'Tezos', 'Flow', 'Stellar', 'XRP', 'Litecoin', 'Multi-chain'].map(chain => (
                        <label key={chain} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.chain.includes(chain)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({ ...filters, chain: [...filters.chain, chain] });
                              } else {
                                setFilters({ ...filters, chain: filters.chain.filter(c => c !== chain) });
                              }
                            }}
                            className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                          />
                          <span className="text-sm text-white/70">{chain}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Geography</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'].map(geo => (
                        <label key={geo} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.geography.includes(geo)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({ ...filters, geography: [...filters.geography, geo] });
                              } else {
                                setFilters({ ...filters, geography: filters.geography.filter(g => g !== geo) });
                              }
                            }}
                            className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                          />
                          <span className="text-sm text-white/70">{geo}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Doxxed</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="doxxed"
                          checked={filters.doxxed === true}
                          onChange={() => setFilters({ ...filters, doxxed: true })}
                          className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                        />
                        <span className="text-sm text-white/70">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="doxxed"
                          checked={filters.doxxed === false}
                          onChange={() => setFilters({ ...filters, doxxed: false })}
                          className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                        />
                        <span className="text-sm text-white/70">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="doxxed"
                          checked={filters.doxxed === null}
                          onChange={() => setFilters({ ...filters, doxxed: null })}
                          className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                        />
                        <span className="text-sm text-white/70">Any</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Audited</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="audit"
                          checked={filters.audit === true}
                          onChange={() => setFilters({ ...filters, audit: true })}
                          className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                        />
                        <span className="text-sm text-white/70">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="audit"
                          checked={filters.audit === false}
                          onChange={() => setFilters({ ...filters, audit: false })}
                          className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                        />
                        <span className="text-sm text-white/70">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="audit"
                          checked={filters.audit === null}
                          onChange={() => setFilters({ ...filters, audit: null })}
                          className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                        />
                        <span className="text-sm text-white/70">Any</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">AI Rating</label>
                    <div className="space-y-2">
                      {['High', 'Normal', 'Low'].map(rating => (
                        <label key={rating} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.raftaiRating.includes(rating)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({ ...filters, raftaiRating: [...filters.raftaiRating, rating] });
                              } else {
                                setFilters({ ...filters, raftaiRating: filters.raftaiRating.filter(r => r !== rating) });
                              }
                            }}
                            className="rounded border-cyan-400/30 bg-white/5 text-cyan-400 focus:ring-cyan-400/50"
                          />
                          <span className={`text-sm font-medium ${
                            rating === 'High' ? 'text-green-400' :
                            rating === 'Normal' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading projects...</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 neo-glass-card rounded-xl p-8">
              <NeonCyanIcon type="document" size={64} className="text-gray-500 mx-auto mb-4" />
              <div className="text-white/60 text-lg mb-2">No projects match your filters</div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ stage: [], sector: [], chain: [], raftaiRating: [] });
                }}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all"
              >
                Clear Filters
              </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProjects.map((project) => (
                  <div 
                    key={project.id} 
                  className="neo-glass-card rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 group hover:shadow-xl hover:shadow-cyan-500/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {(() => {
                        const logoUrl = extractProjectLogoUrl(project);
                        return logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={project.name || project.title || 'Project'} 
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null;
                      })()}
                      <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center flex-shrink-0 border border-cyan-400/30 shadow-lg shadow-cyan-500/20 ${extractProjectLogoUrl(project) ? 'hidden' : 'flex'}`}>
                        <span className="text-white font-bold text-lg">
                          {(project.name || project.title || 'P').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg group-hover:text-cyan-400 transition-colors line-clamp-1">
                          {project.name || project.title || "Untitled Project"}
                        </h3>
                        <div className="text-cyan-400/70 text-sm mt-1">
                          {project.sector || "N/A"} • {project.chain || "N/A"}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-1 border font-medium ${
                      project.raftai?.rating === 'High' ? 'border-green-500/30 bg-green-500/20 text-green-400' :
                      project.raftai?.rating === 'Normal' ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400' :
                      project.raftai?.rating === 'Low' ? 'border-red-500/30 bg-red-500/20 text-red-400' :
                      'border-white/15 bg-white/5 text-white/80'
                    }`}>
                      {project.raftai?.rating || "Pending"}
                    </span>
                  </div>

                  <p className="text-white/60 text-sm line-clamp-3 mb-4 leading-relaxed">
                    {project.raftai?.summary || project.description || "No description available"}
                  </p>

                  {project.raftai?.score && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                        <span>AI Score</span>
                        <span className="font-medium text-white">{project.raftai.score}/100</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-cyan-400/20">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.raftai.score >= 75 ? 'bg-green-500' :
                            project.raftai.score >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${project.raftai.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.stage && (
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full border border-cyan-500/30">
                          {project.stage}
                        </span>
                    )}
                    {(project.isDoxxed || project.badges?.doxxed) && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                        Doxxed
                      </span>
                    )}
                    {(project.isAudited || project.badges?.audit) && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
                        Audited
                      </span>
                    )}
                      </div>

                  <div className="flex items-center justify-between text-xs text-cyan-400/70 mb-4 pt-3 border-t border-cyan-400/20">
                    <span>
                      {project.createdAt ? (project.createdAt.toMillis ? new Date(project.createdAt.toMillis()).toLocaleDateString() : new Date(project.createdAt.seconds * 1000).toLocaleDateString()) : "Recently added"}
                    </span>
                    {project.fundingGoal && (
                      <span className="font-medium text-white">
                        ${(project.fundingGoal / 1000).toFixed(0)}K goal
                      </span>
                    )}
                    </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => router.push(`/influencer/project/${project.id}`)}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                    >
                      <NeonCyanIcon type="eye" size={16} className="text-current" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/influencer/project/${project.id}?action=accept`);
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-green-500/20 border border-green-400/30"
                    >
                      <NeonCyanIcon type="check" size={16} className="text-current" />
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/influencer/messages?projectId=${project.id}`);
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                    >
                      <NeonCyanIcon type="chat" size={16} className="text-current" />
                      Message
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/influencer/project/${project.id}?action=reject`);
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-red-500/20 border border-red-400/30"
                    >
                      <NeonCyanIcon type="close" size={16} className="text-current" />
                      Reject
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

