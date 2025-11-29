"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { useRouter } from "next/navigation";
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from "@/lib/firebase-utils";
import { collection, onSnapshot, query, where, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EyeSlashIcon,
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ShareIcon,
  SparklesIcon,
  PlayIcon,
  StopIcon,
  LinkIcon,
  XCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: 'draft' | 'published' | 'scheduled';
  author: string;
  createdAt: string;
  views: number;
  likes: number;
  featured: boolean;
}

export default function AdminBlogPage() {
  const { user, claims } = useAuth();
  const router = useRouter();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [autoPostingEnabled, setAutoPostingEnabled] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Check admin access - wait for auth to load
  useEffect(() => {
    // Give auth time to load
    const checkAdmin = setTimeout(() => {
      if (!user) {
        console.log('❌ No user found, redirecting to login...');
        router.push('/admin/login');
        setAuthLoading(false);
        return;
      }

      // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
      const userEmail = (user as any)?.email?.toLowerCase() || '';
      if (userEmail !== 'anasshamsiggc@gmail.com') {
        console.log('❌ Access denied. Only anasshamsiggc@gmail.com can access admin panel.');
        alert('Access Denied: Only authorized admin can access this panel.');
        router.push('/admin/login');
        setAuthLoading(false);
        return;
      }

      // Check multiple admin indicators
      const userRole = localStorage.getItem('userRole');
      const isAdmin = 
        userEmail === 'anasshamsiggc@gmail.com' ||
        (claims as any)?.admin?.super === true ||
        (claims as any)?.role === 'admin' ||
        userRole === 'admin' ||
        (user as any)?.customClaims?.admin?.super === true ||
        (user as any)?.customClaims?.role === 'admin';
      
      console.log('🔍 Admin check:', {
        user: !!user,
        userEmail: userEmail,
        claims: claims,
        userRole: userRole,
        isAdmin: isAdmin
      });
      
      if (!isAdmin) {
        console.log('❌ Not admin, redirecting to login...');
        router.push('/admin/login');
      } else {
        console.log('✅ Admin access confirmed');
      }
      
      setAuthLoading(false);
    }, 1000); // Wait 1 second for auth to load

    return () => clearTimeout(checkAdmin);
  }, [user, claims, router]);

  // Load platform connections and auto-posting status
  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) return;

        const dbInstance = ensureDb();
        if (!dbInstance) return;

        // Load platform connections
        const platformsRef = collection(dbInstance, 'blog_platforms');
        const platformsSnapshot = await getDocs(platformsRef);
        const platformsData = platformsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPlatforms([
          { id: 'buffer', name: 'Buffer (X + Medium)', icon: '📊', connected: platformsData.find(p => p.id === 'buffer')?.connected || !!process.env.NEXT_PUBLIC_BUFFER_ENABLED },
          { id: 'medium', name: 'Medium', icon: '📝', connected: platformsData.find(p => p.id === 'medium')?.connected || false },
          { id: 'facebook', name: 'Facebook', icon: '📘', connected: platformsData.find(p => p.id === 'facebook')?.connected || false },
          { id: 'instagram', name: 'Instagram', icon: '📷', connected: platformsData.find(p => p.id === 'instagram')?.connected || false },
          { id: 'x', name: 'X (Twitter)', icon: '🐦', connected: platformsData.find(p => p.id === 'x')?.connected || false },
          { id: 'linkedin', name: 'LinkedIn', icon: '💼', connected: platformsData.find(p => p.id === 'linkedin')?.connected || false },
        ]);

        // Load auto-posting status
        const autoPostDoc = await getDoc(doc(dbInstance, 'blog_settings', 'auto_posting'));
        if (autoPostDoc.exists()) {
          setAutoPostingEnabled(autoPostDoc.data().enabled || false);
        }
      } catch (error) {
        console.error('Error loading platforms:', error);
      }
    };

    if (!authLoading) {
      loadPlatforms();
    }
  }, [authLoading]);

  // Handle OAuth callback success/error messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const message = urlParams.get('message');

    if (success) {
      if (success === 'medium_connected') {
        alert('✅ Successfully connected to Medium!');
        // Reload platforms
        window.location.search = '';
      } else if (success === 'x_connected') {
        alert('✅ Successfully connected to X (Twitter)!');
        // Reload platforms
        window.location.search = '';
      }
    }

    if (error) {
      alert(`❌ Connection failed: ${message || error}`);
      window.location.search = '';
    }
  }, []);

  // Real-time listener for admin blog posts
  useEffect(() => {
    const setupListener = async () => {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        setLoading(false);
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) {
        setLoading(false);
        return;
      }
      
      console.log('🔍 Setting up real-time listener for admin blog posts...');
      
      const postsRef = collection(dbInstance, 'blog_posts');
      let q;
      
      if (filter === 'all') {
        q = query(postsRef);
      } else {
        q = query(postsRef, where('status', '==', filter));
      }
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('✅ Real-time admin update received:', snapshot.size, 'posts');
          
          const fetchedPosts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              slug: data.slug,
              category: data.category,
              status: data.status,
              author: data.author,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              views: data.views || 0,
              likes: data.likes || 0,
              featured: data.featured || false,
            };
          });
          
          console.log('✅ Admin posts updated:', fetchedPosts.length);
          setPosts(fetchedPosts);
          setLoading(false);
        },
        createSnapshotErrorHandler('admin blog posts')
      );
      
      return () => unsubscribe();
    };

    if (!authLoading) {
      setupListener();
    }
  }, [filter, authLoading]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

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

      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(dbInstance, 'blog_posts', postId));
      
      // Real-time listener will automatically update
      console.log('✅ Blog post deleted successfully');
    } catch (error: any) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post: " + (error?.message || 'Unknown error'));
    }
  };

  const handlePublish = async (postId: string) => {
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
      await updateDoc(doc(dbInstance, 'blog_posts', postId), {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Real-time listener will automatically update
      console.log('✅ Blog post published successfully');
    } catch (error: any) {
      console.error("Error publishing post:", error);
      alert("Failed to publish post: " + (error?.message || 'Unknown error'));
    }
  };

  const handleUnpublish = async (postId: string) => {
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
      await updateDoc(doc(dbInstance, 'blog_posts', postId), {
        status: 'draft',
        updatedAt: serverTimestamp()
      });
      
      // Real-time listener will automatically update
      console.log('✅ Blog post unpublished successfully');
    } catch (error: any) {
      console.error("Error unpublishing post:", error);
      alert("Failed to unpublish post: " + (error?.message || 'Unknown error'));
    }
  };

  const handleConnectPlatform = async (platformId: string) => {
    try {
      // For X and Medium, initiate OAuth flow
      if (platformId === 'x' || platformId === 'medium') {
        const oauthPlatform = platformId === 'x' ? 'x' : 'medium';
        
        try {
          const response = await fetch(`/api/blog/oauth/${oauthPlatform}/authorize`);
          const data = await response.json();
          
          if (data.success && data.authUrl) {
            // Redirect to OAuth URL
            window.location.href = data.authUrl;
            return;
          } else {
            throw new Error(data.error || 'Failed to get OAuth URL');
          }
        } catch (error: any) {
          console.error('OAuth error:', error);
          alert(`Failed to connect ${platforms.find(p => p.id === platformId)?.name}: ${error.message}`);
          return;
        }
      }

      // For other platforms, show modal for manual connection
      setSelectedPlatform(platformId);
      setShowPlatformModal(true);
    } catch (error) {
      console.error('Error connecting platform:', error);
      alert('Failed to connect platform. Please try again.');
    }
  };

  const handleDisconnectPlatform = async (platformId: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platforms.find(p => p.id === platformId)?.name}?`)) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) return;

      const dbInstance = ensureDb();
      if (!dbInstance) return;

      await updateDoc(doc(dbInstance, 'blog_platforms', platformId), {
        connected: false,
        accessToken: null,
        disconnectedAt: serverTimestamp()
      });

      setPlatforms(prev => prev.map(p => 
        p.id === platformId ? { ...p, connected: false } : p
      ));

      alert('Platform disconnected successfully!');
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      alert('Failed to disconnect platform.');
    }
  };

  const handleToggleAutoPosting = async () => {
    const newStatus = !autoPostingEnabled;
    
    console.log('🔄 Toggling auto-posting to:', newStatus);
    
    try {
      // Try API route first (uses Admin SDK if available)
      const response = await fetch('/api/blog/admin/toggle-auto-posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus })
      });
      
      const data = await response.json();
      console.log('📋 API response:', data);
      
      if (data.success) {
        setAutoPostingEnabled(newStatus);
        if (newStatus) {
          alert('✅ Auto-posting started! Blogs will be posted daily to connected platforms.');
        } else {
          alert('⏸️ Auto-posting stopped.');
        }
        return;
      }
      
      // If API route failed due to Admin SDK not being configured, use client-side Firestore
      if (data.error?.includes('Firebase Admin') || response.status === 503) {
        console.log('🔄 Admin SDK not available, using client-side Firestore...');
        
        const isReady = await waitForFirebase(5000);
        if (!isReady) {
          throw new Error('Firebase not initialized. Please refresh and try again.');
        }

        const dbInstance = ensureDb();
        if (!dbInstance) {
          throw new Error('Database not available. Please refresh and try again.');
        }

        await setDoc(doc(dbInstance, 'blog_settings', 'auto_posting'), {
          enabled: newStatus,
          updatedAt: serverTimestamp(),
          startedAt: newStatus ? serverTimestamp() : null,
          stoppedAt: newStatus ? null : serverTimestamp(),
          updatedBy: user?.email || user?.uid || 'admin'
        }, { merge: true });

        setAutoPostingEnabled(newStatus);
        
        if (newStatus) {
          alert('✅ Auto-posting started! Blogs will be posted daily to connected platforms.');
        } else {
          alert('⏸️ Auto-posting stopped.');
        }
        return;
      }
      
      // Other API errors
      throw new Error(data.error || 'API route failed');
      
    } catch (error: any) {
      console.error('❌ Error toggling auto-posting:', error);
      
      // If it's a Firestore permission error, provide helpful message
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        alert('❌ Permission denied. Please ensure you are logged in as admin and Firestore rules allow writes to blog_settings collection.');
      } else {
        const errorMsg = error?.message || 'Unknown error';
        alert(`Failed to toggle auto-posting: ${errorMsg}\n\nPlease check the browser console for more details.`);
      }
    }
  };

  const handleArchiveAllPublished = async () => {
    const publishedCount = posts.filter(p => p.status === 'published').length;
    
    if (!confirm(`⚠️ This will move ${publishedCount} published posts to draft. Continue?`)) return;
    
    try {
      console.log('📦 Archiving all published posts...');
      
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
      
      const { serverTimestamp } = await import('firebase/firestore');
      
      let archived = 0;
      for (const post of posts) {
        if (post.status === 'published') {
          await updateDoc(doc(dbInstance, 'blog_posts', post.id), {
            status: 'draft',
            updatedAt: serverTimestamp()
          });
          archived++;
          console.log(`✅ Archived: ${post.title}`);
        }
      }
      
      console.log(`✅ Archived ${archived} posts to draft!`);
      alert(`✅ Archived ${archived} posts! They are now drafts and won't show on the public blog.`);
    } catch (error: any) {
      console.error("❌ Error archiving posts:", error);
      alert(`Failed to archive posts: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      published: "bg-green-500/20 text-green-400 border-green-500/50",
      draft: "bg-gray-500/20 text-gray-400 border-gray-500/50",
      scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    };
    
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Show loading while checking auth or loading posts
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70 mt-4">
            {authLoading ? 'Verifying admin access...' : 'Loading posts...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Blog Management</h1>
            <p className="text-white/70">Manage all blog posts and content</p>
          </div>
          <div className="flex gap-3">
            {posts.filter(p => p.status === 'published').length > 0 && (
              <button 
                onClick={handleArchiveAllPublished}
                className="btn bg-orange-600 hover:bg-orange-700 text-white"
              >
                <ArchiveBoxIcon className="w-5 h-5 mr-2" />
                Archive All Published
              </button>
            )}
            <Link href="/admin/blog/social" className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <ShareIcon className="w-5 h-5 mr-2" />
              Social Post
            </Link>
            <Link href="/admin/blog/new" className="btn btn-primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Post
            </Link>
          </div>
        </div>

        {/* Platform Connections & Auto-Posting */}
        <div className="glass rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Platform Connections</h2>
              <p className="text-white/70">Connect your social media accounts to auto-post blogs</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                autoPostingEnabled 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${autoPostingEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                {autoPostingEnabled ? 'Auto-Posting Active' : 'Auto-Posting Inactive'}
              </div>
              <button
                onClick={async () => {
                  if (confirm('Generate and post a blog post right now?\n\nThis will create a new blog post using AI and post it to all connected platforms.')) {
                    try {
                      const response = await fetch('/api/blog/generate-auto', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const data = await response.json();
                      
                      if (data.success) {
                        // If client-side creation is required (Admin SDK not configured)
                        if (data.requiresClientSideCreation && data.postData) {
                          console.log('🔄 Creating post via client-side Firestore...');
                          
                          const isReady = await waitForFirebase(5000);
                          if (!isReady) {
                            throw new Error('Firebase not initialized. Please refresh and try again.');
                          }

                          const dbInstance = ensureDb();
                          if (!dbInstance) {
                            throw new Error('Database not available. Please refresh and try again.');
                          }

                          // Prepare post data for Firestore
                          const postData = {
                            ...data.postData,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                          };

                          // Remove undefined values
                          Object.keys(postData).forEach(key => {
                            if (postData[key] === undefined) {
                              delete postData[key];
                            }
                          });

                          // Create post using client-side Firestore
                          const docRef = await addDoc(collection(dbInstance, 'blog_posts'), postData);
                          
                          console.log('✅ Post created via client-side Firestore:', docRef.id);
                          
                          // Auto-post to connected platforms
                          try {
                            // Get connected platforms
                            const platformsRef = collection(dbInstance, 'blog_platforms');
                            const platformsSnapshot = await getDocs(platformsRef);
                            const connectedPlatforms = platformsSnapshot.docs
                              .filter(doc => doc.data().connected === true)
                              .map(doc => doc.id);
                            
                            console.log('📱 Connected platforms:', connectedPlatforms);
                            
                            // Post to connected platforms if any
                            if (connectedPlatforms.length > 0) {
                              const publishResponse = await fetch('/api/blog/admin/publish', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  postId: docRef.id,
                                  platforms: connectedPlatforms,
                                }),
                              });
                              
                              if (publishResponse.ok) {
                                const publishData = await publishResponse.json();
                                console.log('✅ Posted to platforms:', publishData.platforms || connectedPlatforms);
                                alert(`✅ Blog post created successfully!\n\nTitle: ${data.title}\nPost ID: ${docRef.id}\n\nPosted to: ${(publishData.platforms || connectedPlatforms).join(', ')}`);
                              } else {
                                console.error('❌ Failed to post to platforms');
                                alert(`✅ Blog post created successfully!\n\nTitle: ${data.title}\nPost ID: ${docRef.id}\n\nNote: Could not auto-post to social platforms.`);
                              }
                            } else {
                              alert(`✅ Blog post created successfully!\n\nTitle: ${data.title}\nPost ID: ${docRef.id}`);
                            }
                          } catch (publishError) {
                            console.error('❌ Error posting to platforms:', publishError);
                            alert(`✅ Blog post created successfully!\n\nTitle: ${data.title}\nPost ID: ${docRef.id}\n\nNote: Could not auto-post to social platforms.`);
                          }
                          
                          // Reload page to show new post
                          window.location.reload();
                        } else if (data.postId) {
                          // Normal flow - post was created server-side
                          alert(`✅ Blog post created!\n\nTitle: ${data.title}\nPost ID: ${data.postId}\n\nPosted to: ${data.crossPosted ? Object.keys(data.crossPosted).filter(k => data.crossPosted[k]).join(', ') : 'Website only'}`);
                          // Reload page to show new post
                          window.location.reload();
                        } else {
                          alert(`⚠️ Blog post generated but not saved. Please check console for details.`);
                        }
                      } else {
                        alert(`❌ Error: ${data.error || 'Failed to generate post'}`);
                      }
                    } catch (error: any) {
                      console.error('❌ Error generating post:', error);
                      alert(`❌ Error: ${error.message || 'Failed to generate post. Please check console for details.'}`);
                    }
                  }
                }}
                className="px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                title="Generate and post a blog post immediately"
              >
                <SparklesIcon className="w-5 h-5" />
                Post Now
              </button>
              <button
                onClick={handleToggleAutoPosting}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  autoPostingEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {autoPostingEnabled ? (
                  <>
                    <StopIcon className="w-5 h-5" />
                    Stop Posting
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    Start Posting
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  platform.connected
                    ? 'bg-green-500/10 border-green-500/50'
                    : 'bg-white/5 border-white/10 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="text-white font-semibold">{platform.name}</span>
                  </div>
                  {platform.connected ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {platform.connected ? (
                  <div className="space-y-2">
                    <p className="text-green-400 text-xs">Connected</p>
                    <button
                      onClick={() => handleDisconnectPlatform(platform.id)}
                      className="w-full px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnectPlatform(platform.id)}
                    className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-2">{posts.length}</div>
            <div className="text-white/70">Total Posts</div>
          </div>
          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {posts.filter(p => p.status === 'published').length}
            </div>
            <div className="text-white/70">Published</div>
          </div>
          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-gray-400 mb-2">
              {posts.filter(p => p.status === 'draft').length}
            </div>
            <div className="text-white/70">Drafts</div>
          </div>
          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {posts.filter(p => p.status === 'scheduled').length}
            </div>
            <div className="text-white/70">Scheduled</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass rounded-2xl p-6 border border-white/10 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Filter by Status
              </label>
              <div className="flex gap-2">
                {(['all', 'published', 'draft', 'scheduled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      filter === status
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Search Posts
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="glass rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="w-16 h-16 mx-auto text-white/20 mb-4" />
                      <p className="text-white/70">No posts found</p>
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {post.featured && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded">
                              Featured
                            </span>
                          )}
                          <span className="text-white font-medium">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/70 capitalize">{post.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusBadge(post.status)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/70">{post.author}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span className="flex items-center gap-1">
                            <EyeIcon className="w-4 h-4" />
                            {post.views}
                          </span>
                          <span>{post.likes} ❤️</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {post.status === 'published' ? (
                            <>
                              <Link
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="View"
                              >
                                <EyeIcon className="w-5 h-5 text-white/70" />
                              </Link>
                              <button
                                onClick={() => handleUnpublish(post.id)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Unpublish"
                              >
                                <EyeSlashIcon className="w-5 h-5 text-white/70" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handlePublish(post.id)}
                                className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                                title="Publish"
                              >
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                              </button>
                            </>
                          )}
                          <Link
                            href={`/admin/blog/edit/${post.id}`}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit"
                            prefetch={false}
                          >
                            <PencilIcon className="w-5 h-5 text-white/70" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Connection Modal */}
        {showPlatformModal && selectedPlatform && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" style={{ zIndex: 100 }}>
            <div className="bg-gray-900 border-2 border-gray-600 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Connect {platforms.find(p => p.id === selectedPlatform)?.name}
                </h2>
                <button
                  onClick={() => {
                    setShowPlatformModal(false);
                    setSelectedPlatform(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300">
                  Click the button below to authorize {platforms.find(p => p.id === selectedPlatform)?.name} access.
                  You'll be redirected to {platforms.find(p => p.id === selectedPlatform)?.name} to complete the connection.
                </p>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Required Permissions:</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Read your profile</li>
                    <li>• Post content on your behalf</li>
                    <li>• Manage your posts</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPlatformModal(false);
                      setSelectedPlatform(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleConnectPlatform(selectedPlatform);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Authorize & Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

