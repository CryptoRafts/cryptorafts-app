"use client";

import { useAuth } from "@/providers/SimpleAuthProvider";
import { db, collection, query, where, onSnapshot, doc, setDoc, addDoc, getDoc } from "@/lib/firebase.client";
import { ensureDb, waitForFirebase } from "@/lib/firebase-utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface FilterState {
  stage: string[];
  sector: string[];
  chain: string[];
  geography: string[];
  ticketSize: string[];
  doxxed: boolean | null;
  audit: boolean | null;
  raftaiRating: string[];
  search: string;
}

export default function VCDealflow() {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    stage: [],
    sector: [],
    chain: [],
    geography: [],
    ticketSize: [],
    doxxed: null,
    audit: null,
    raftaiRating: [],
    search: ""
  });

  // Load projects
  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      // Enhanced Firebase initialization with retry
      let isReady = await waitForFirebase(10000);
      if (!isReady) {
        console.warn('⚠️ Firebase not ready, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        isReady = await waitForFirebase(10000);
      }
      
      if (!isReady) {
        console.error('❌ Firebase not initialized after retries');
        setLoading(false);
        return;
      }

      try {
        const dbInstance = ensureDb();
        if (!dbInstance) {
          console.error('❌ Database instance not available');
          setLoading(false);
          return;
        }
        
        // FIXED: Query all projects (not just pending) - filter client-side for better results
        // This ensures projects show even if status field is missing or different
        const projectsQuery = query(
          collection(dbInstance, 'projects')
        );

        const unsubscribe = onSnapshot(projectsQuery, async (snapshot) => {
          const projectsData = await Promise.all(snapshot.docs.map(async (projectDoc) => {
            const data = { id: projectDoc.id, ...projectDoc.data() };
            
            // Load founder data if founderId exists
            if (data.founderId) {
              try {
                const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
                const founderRef = firestoreDoc(dbInstance, 'users', data.founderId);
                const founderDoc = await getDoc(founderRef);
                if (founderDoc.exists()) {
                  const founderData = founderDoc.data();
                  data.founderName = data.founderName || founderData?.displayName || founderData?.name || founderData?.companyName || null;
                  
                  // Normalize founder logo - check multiple fields and handle different URL formats
                  let founderLogo = data.founderLogo || founderData?.photoURL || founderData?.profilePhotoUrl || founderData?.profile_image_url || founderData?.logo || founderData?.avatar || founderData?.profileImageUrl || null;
                  
                  // Only process if we have a logo value
                  let logoLoaded = false;
                  if (founderLogo && typeof founderLogo === 'string') {
                    // If it's already a full HTTPS URL, use it as is (most common case)
                    if (founderLogo.startsWith('https://')) {
                      logoLoaded = true;
                    }
                    // If it's HTTP, upgrade to HTTPS
                    else if (founderLogo.startsWith('http://')) {
                      founderLogo = founderLogo.replace('http://', 'https://');
                      logoLoaded = true;
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
                        storagePath = `profiles/${data.founderId}/${filename}`;
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
                          }
                        }
                      } catch (storageError: any) {
                        // File doesn't exist - this is expected and fine
                        // Don't log 404 errors to avoid console noise
                        if (storageError?.code !== 'storage/object-not-found' && storageError?.code !== 'storage/unauthorized') {
                          // Only log unexpected errors
                          console.warn('⚠️ [DEALFLOW] Error loading founder logo:', storageError?.code || storageError?.message);
                        }
                        // Set to null since file doesn't exist
                        founderLogo = null;
                        logoLoaded = false;
                      }
                    }
                    // If it's just a filename or very short, don't try Firebase Storage (likely doesn't exist)
                    else {
                      founderLogo = null;
                      logoLoaded = false;
                    }
                  }
                  
                  // CRITICAL: Only accept valid HTTPS URLs - never set to Firebase Storage paths
                  // This prevents 404 errors in the browser
                  if (!logoLoaded || !founderLogo || (typeof founderLogo === 'string' && !founderLogo.startsWith('https://'))) {
                    founderLogo = null;
                  }
                  
                  data.founderLogo = founderLogo;
                }
              } catch (err) {
                console.warn('Could not load founder data for project:', projectDoc.id, err);
              }
            }
            
            return data;
          }));
          
          // CRITICAL: Only show approved projects in dealflow
          // Projects must be approved by admin AND not already accepted by this VC or any role
          const availableProjects = projectsData.filter(p => {
            const status = (p.status || '').toLowerCase();
            const reviewStatus = (p.reviewStatus || '').toLowerCase();
            
            // Must be approved by admin
            const isApproved = status === 'approved' || reviewStatus === 'approved';
            
            // Must have visibility set to discoverable (set by admin on approval)
            const isDiscoverable = p.visibility?.discoverable === true;
            
            // EXCLUDE if this VC already accepted it (check vcAction field)
            if (p.vcAction === 'accepted' && p.vcActionBy === user.uid) {
              return false;
            }
            
            // EXCLUDE if project status is 'accepted' and this VC accepted it
            if (status === 'accepted' && p.acceptedBy === user.uid) {
              return false;
            }
            
            // EXCLUDE if any role action shows it was accepted by this user
            if (p.vcAction === 'accepted' || 
                p.exchangeAction === 'accepted' || 
                p.idoAction === 'accepted' || 
                p.influencerAction === 'accepted' || 
                p.agencyAction === 'accepted') {
              // Check if this user accepted it
              if ((p.vcActionBy === user.uid && p.vcAction === 'accepted') ||
                  (p.exchangeActionBy === user.uid && p.exchangeAction === 'accepted') ||
                  (p.idoActionBy === user.uid && p.idoAction === 'accepted') ||
                  (p.influencerActionBy === user.uid && p.influencerAction === 'accepted') ||
                  (p.agencyActionBy === user.uid && p.agencyAction === 'accepted')) {
                return false; // This user already accepted it - should be in pipeline, not dealflow
              }
            }
            
            // Only show if approved AND discoverable AND not accepted by this user
            return isApproved && isDiscoverable;
          });
          
          // Sort by createdAt descending (most recent first) - client-side
          availableProjects.sort((a, b) => {
            // Handle Firestore Timestamp objects
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
          
          console.log('✅ [DEALFLOW] Loaded', availableProjects.length, 'available projects (from', projectsData.length, 'total)');
          setProjects(availableProjects);
          setLoading(false);
        }, (error: any) => {
          // Suppress Firestore internal assertion errors
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes('FIRESTORE') && 
              errorMessage.includes('INTERNAL ASSERTION FAILED') && 
              (errorMessage.includes('Unexpected state') || 
               errorMessage.includes('ID: ca9') || 
               errorMessage.includes('ID: b815'))) {
            // Silently suppress - these are internal SDK errors
            setLoading(false);
            return;
          }
          // Suppress "Target ID already exists" errors
          if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
            console.log('⚠️ Project listener already exists, skipping...');
            setLoading(false);
            return;
          }
          // Handle index errors gracefully - already using simple query
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.warn('⚠️ Index error (should not happen with simple query):', error);
            setLoading(false);
            return;
          }
          console.warn('Error loading projects:', error);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user]);

  // Load watchlist
  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        return;
      }

      try {
        const dbInstance = ensureDb();
        const watchlistQuery = query(
          collection(dbInstance, 'watchlist'),
          where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(watchlistQuery, (snapshot) => {
          const watchlistIds = new Set(snapshot.docs.map(doc => doc.data().projectId));
          setWatchlist(watchlistIds);
        }, (error: any) => {
          // Suppress Firestore internal assertion errors
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes('FIRESTORE') && 
              errorMessage.includes('INTERNAL ASSERTION FAILED') &&
              (errorMessage.includes('Unexpected state') || 
               errorMessage.includes('ID: ca9') || 
               errorMessage.includes('ID: b815'))) {
            // Silently suppress - these are internal SDK errors
            return;
          }
          // Suppress "Target ID already exists" errors
          if (error?.code === 'failed-precondition' && error?.message?.includes('Target ID already exists')) {
            console.log('⚠️ Watchlist listener already exists, skipping...');
            return;
          }
          console.warn('Error loading watchlist:', error);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up watchlist listener:', error);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user]);

  // Filter projects - MUST be before any conditional returns (React Rules of Hooks)
  const filteredProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    return projects.filter(project => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          project.title?.toLowerCase().includes(searchLower) ||
          project.name?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.tagline?.toLowerCase().includes(searchLower) ||
          project.sector?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Stage filter - case-insensitive matching
      if (filters.stage.length > 0) {
        const projectStage = (project.stage || '').toLowerCase();
        if (!filters.stage.some(s => projectStage === s.toLowerCase())) {
          return false;
        }
      }

      // Sector filter - case-insensitive matching
      if (filters.sector.length > 0) {
        const projectSector = (project.sector || '').toLowerCase();
        if (!filters.sector.some(s => projectSector === s.toLowerCase())) {
          return false;
        }
      }

      // Chain filter - case-insensitive matching
      if (filters.chain.length > 0) {
        const projectChain = (project.chain || '').toLowerCase();
        if (!filters.chain.some(c => projectChain === c.toLowerCase())) {
          return false;
        }
      }

      // Geography filter - partial matching
      if (filters.geography.length > 0) {
        const projectGeo = (project.geography || project.location || '').toLowerCase();
        if (!filters.geography.some(g => projectGeo.includes(g.toLowerCase()))) {
          return false;
        }
      }

      // Doxxed filter - check multiple fields
      if (filters.doxxed !== null) {
        const isDoxxed = project.isDoxxed || project.badges?.doxxed || project.team?.some((m: any) => m.doxxed) || false;
        if (isDoxxed !== filters.doxxed) {
          return false;
        }
      }

      // Audit filter - check multiple fields
      if (filters.audit !== null) {
        const isAudited = project.isAudited || project.badges?.audit || project.audit?.completed || false;
        if (isAudited !== filters.audit) {
          return false;
        }
      }

      // RaftAI rating filter - check multiple field names
      if (filters.raftaiRating.length > 0) {
        const rating = project.raftai?.rating || project.raftAI?.rating || '';
        if (!filters.raftaiRating.includes(rating)) {
          return false;
        }
      }

      return true;
    });
  }, [projects, filters, user]);

  // Toggle watchlist
  const toggleWatchlist = async (projectId: string) => {
    if (!user) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) return;

      if (watchlist.has(projectId)) {
        // Remove from watchlist
        const watchlistQuery = query(
          collection(dbInstance, 'watchlist'),
          where('userId', '==', user.uid),
          where('projectId', '==', projectId)
        );
        const snapshot = await getDoc(doc(dbInstance, 'watchlist', `${user.uid}_${projectId}`));
        if (snapshot.exists()) {
          await setDoc(doc(dbInstance, 'watchlist', snapshot.id), { deleted: true }, { merge: true });
        }
      } else {
        // Add to watchlist
        const project = projects.find(p => p.id === projectId);
        await setDoc(doc(dbInstance, 'watchlist', `${user.uid}_${projectId}`), {
          userId: user.uid,
          projectId,
          projectName: project?.title || project?.name || 'Untitled',
          projectDescription: project?.description || project?.tagline || '',
          stage: project?.stage || '',
          sector: project?.sector || '',
          fundingRaised: project?.fundingRaised || 0,
          teamSize: project?.teamSize || 0,
          status: 'watching',
          addedAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  // Accept project
  const handleAcceptProject = async (projectId: string) => {
    if (!user) return;
    router.push(`/vc/project/${projectId}?action=accept`);
  };

  // Request documents
  const handleRequestDocs = async (projectId: string) => {
    if (!user) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) return;

      const project = projects.find(p => p.id === projectId);
      await addDoc(collection(dbInstance, 'notifications'), {
        userId: project.founderId,
        type: 'document_request',
        title: 'Document Request',
        message: `A VC has requested additional documents for "${project.title || project.name}"`,
        projectId,
        requestedBy: user.uid,
        read: false,
        createdAt: Date.now()
      });
      alert('Document request sent to founder!');
    } catch (error) {
      console.error('Error requesting documents:', error);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      stage: [],
      sector: [],
      chain: [],
      geography: [],
      ticketSize: [],
      doxxed: null,
      audit: null,
      raftaiRating: [],
      search: ""
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!isLoading && (!user || claims?.role !== 'vc')) {
      router.push('/login');
    }
  }, [user, claims, isLoading, router]);

  if (!user || claims?.role !== 'vc') {
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-black pt-24 pb-12 px-4"
    >
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="neo-glass-card rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Dealflow</h1>
              <p className="text-gray-300 mt-1 text-sm sm:text-base">
                {filteredProjects.length} of {projects.length} projects available
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                {projects.filter(p => p.raftai?.rating === 'High').length} High Rated
              </div>
              <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-500/30">
                {watchlist.size} Watched
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="neo-glass-card rounded-xl p-4 mb-6">
          <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <NeonCyanIcon type="search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400/70" />
              <input
                type="text"
                placeholder="Search projects, sectors, descriptions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-cyan-400/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/40"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white/5 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-all flex items-center gap-2 font-medium text-white"
            >
              <NeonCyanIcon type="funnel" size={20} className="text-current" />
              <span>Filters</span>
              {(filters.stage.length + filters.sector.length + filters.chain.length + filters.raftaiRating.length) > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {filters.stage.length + filters.sector.length + filters.chain.length + filters.raftaiRating.length}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {(filters.search || filters.stage.length > 0 || filters.sector.length > 0 || filters.chain.length > 0 || filters.raftaiRating.length > 0) && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-all flex items-center gap-2 font-medium"
              >
                <NeonCyanIcon type="close" size={20} className="text-current" />
                Clear
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 neo-glass-card rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stage Filter */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Stage</label>
                  <div className="space-y-2">
                    {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'].map(stage => (
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

                {/* Sector Filter */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Sector</label>
                  <div className="space-y-2">
                    {['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'Metaverse'].map(sector => (
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

                {/* RaftAI Rating Filter */}
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
      </div>

        {/* Projects Grid */}
        <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading projects...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 neo-glass-card rounded-xl p-8">
            <NeonCyanIcon type="document" size={64} className="text-gray-500 mx-auto mb-4" />
            <div className="text-white/60 text-lg mb-2">No projects available</div>
            <p className="text-white/40 text-sm mt-2">Projects will appear here as founders submit pitches</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 neo-glass-card rounded-xl p-8">
            <NeonCyanIcon type="funnel" size={64} className="text-gray-500 mx-auto mb-4" />
            <div className="text-white/60 text-lg mb-2">No projects match your filters</div>
            <p className="text-white/40 text-sm mt-2">Found {projects.length} projects, but none match your current filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className="neo-glass-card rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 group hover:shadow-xl hover:shadow-cyan-500/20"
              >
                {/* Header with Logo and Watchlist */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Project Logo */}
                    {(() => {
                      const logoUrl = extractProjectLogoUrl(project);
                      return logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt={project.title || project.name || 'Project'} 
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-cyan-400/20"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show fallback
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null;
                    })()}
                    <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg items-center justify-center flex-shrink-0 border border-cyan-400/30 shadow-lg shadow-cyan-500/20 ${extractProjectLogoUrl(project) ? 'hidden' : 'flex'}`}>
                      <span className="text-white font-bold text-lg">
                        {(project.title || project.name || project.tagline || 'P').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {project.title || project.name || "Untitled Project"}
                      </h3>
                      <div className="text-cyan-400/70 text-sm mt-1">
                        {project.sector || "N/A"} • {project.chain || "N/A"}
                      </div>
                      {/* Founder Info */}
                      {project.founderName && (
                        <div className="flex items-center gap-2 mt-2">
                          {/* Only render img if founderLogo is a valid HTTPS URL to prevent 404 errors */}
                          {project.founderLogo && typeof project.founderLogo === 'string' && project.founderLogo.startsWith('https://') ? (
                            <img 
                              src={project.founderLogo} 
                              alt={project.founderName}
                              className="w-5 h-5 rounded-full object-cover border border-cyan-400/30"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <span className="text-white/50 text-xs">{project.founderName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Watchlist Star */}
                    <button
                      onClick={() => toggleWatchlist(project.id)}
                      className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors border border-transparent hover:border-cyan-400/30"
                    >
                      {watchlist.has(project.id) ? (
                        <NeonCyanIcon type="star" size={20} className="text-yellow-400" />
                      ) : (
                        <NeonCyanIcon type="star" size={20} className="text-cyan-400/70 hover:text-yellow-400" />
                      )}
                    </button>
                    
                    {/* RaftAI Rating Badge */}
                    <span className={`text-xs rounded-full px-2 py-1 border font-medium ${
                      project.raftai?.rating === 'High' ? 'border-green-500/30 bg-green-500/20 text-green-400' :
                      project.raftai?.rating === 'Normal' ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400' :
                      project.raftai?.rating === 'Low' ? 'border-red-500/30 bg-red-500/20 text-red-400' :
                      'border-white/15 bg-white/5 text-white/80'
                    }`}>
                      {project.raftai?.rating || "Pending"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/60 text-sm line-clamp-3 mb-4 leading-relaxed">
                  {project.raftai?.summary || project.description || project.tagline || "No description available"}
                </p>

                {/* AI Score Progress */}
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

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.stage && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/30">
                      {project.stage}
                    </span>
                  )}
                  {project.isDoxxed && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                      Doxxed
                    </span>
                  )}
                  {project.isAudited && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
                      Audited
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center justify-between text-xs text-cyan-400/70 mb-4 pt-3 border-t border-cyan-400/20">
                  <span>
                    {project.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : "Recently added"}
                  </span>
                  {project.fundingGoal && (
                    <span className="font-medium text-white">
                      ${(project.fundingGoal / 1000).toFixed(0)}K goal
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push(`/vc/project/${project.id}`)}
                    className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                  >
                    <NeonCyanIcon type="eye" size={16} className="text-current" />
                    Deep Dive
                  </button>
                  <button
                    onClick={() => handleAcceptProject(project.id)}
                    className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-green-500/20 border border-green-400/30"
                  >
                    <NeonCyanIcon type="check" size={16} className="text-current" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequestDocs(project.id)}
                    className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-orange-500/20 border border-orange-400/30"
                  >
                    <NeonCyanIcon type="document" size={16} className="text-current" />
                    Request Docs
                  </button>
                  <button
                    onClick={() => router.push(`/messages?projectId=${project.id}`)}
                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-purple-500/20 border border-purple-400/30"
                  >
                    <NeonCyanIcon type="chat" size={16} className="text-current" />
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
