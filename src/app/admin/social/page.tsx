"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ShareIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  SparklesIcon,
  LinkIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  accountId?: string;
  accountName?: string;
  lastSync?: Date;
}

interface BrandDNA {
  brandName: string;
  voice: string;
  audience: string;
  description: string;
}

interface SocialPost {
  id: string;
  platform: string;
  contentType: 'IMAGE' | 'VIDEO';
  title: string;
  content: string;
  visualDescription?: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedAt?: Date;
  engagement?: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
}

export default function AdminSocialPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'platforms' | 'create' | 'posts' | 'raftai'>('platforms');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'blue', connected: false },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'pink', connected: false },
    { id: 'twitter', name: 'X (Twitter)', icon: '🐦', color: 'black', connected: false },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'black', connected: false },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'blue', connected: false },
    { id: 'threads', name: 'Threads', icon: '🧵', color: 'black', connected: false },
  ]);
  const [brandDNA, setBrandDNA] = useState<BrandDNA>({
    brandName: '',
    voice: '',
    audience: '',
    description: ''
  });
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [showRaftAIModal, setShowRaftAIModal] = useState(false);
  const [raftAIMode, setRaftAIMode] = useState<'caption' | 'content' | 'strategy'>('caption');
  const [raftAIQuery, setRaftAIQuery] = useState('');
  const [raftAIResult, setRaftAIResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
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
                loadData();
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

  const loadData = async () => {
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('Firebase not ready');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('Database not available');
        return;
      }

      const { collection, getDocs, doc, getDoc } = await import('firebase/firestore');

      // Load connected platforms
      const platformsRef = collection(dbInstance, 'social_platforms');
      const platformsSnapshot = await getDocs(platformsRef);
      const connectedPlatforms = platformsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SocialPlatform));

      setPlatforms(prev => prev.map(p => {
        const connected = connectedPlatforms.find(cp => cp.id === p.id);
        return connected ? { ...p, ...connected, connected: true } : p;
      }));

      // Load Brand DNA
      const brandDoc = await getDoc(doc(dbInstance, 'brand_dna', 'default'));
      if (brandDoc.exists()) {
        setBrandDNA(brandDoc.data() as BrandDNA);
      }

      // Load posts
      const postsRef = collection(dbInstance, 'social_posts');
      const postsSnapshot = await getDocs(postsRef);
      const loadedPosts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SocialPost));
      setPosts(loadedPosts);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleConnectPlatform = async (platformId: string) => {
    // In a real implementation, this would open OAuth flow
    alert(`Connecting to ${platforms.find(p => p.id === platformId)?.name}...\n\nIn production, this would open OAuth authentication flow.`);
    
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) return;

      const dbInstance = ensureDb();
      if (!dbInstance) return;

      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      await setDoc(doc(dbInstance, 'social_platforms', platformId), {
        id: platformId,
        name: platforms.find(p => p.id === platformId)?.name,
        connected: true,
        connectedAt: serverTimestamp(),
        accountName: 'Demo Account',
        lastSync: serverTimestamp()
      }, { merge: true });

      await loadData();
    } catch (error) {
      console.error('Error connecting platform:', error);
    }
  };

  const handleDisconnectPlatform = async (platformId: string) => {
    if (!confirm('Are you sure you want to disconnect this platform?')) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) return;

      const dbInstance = ensureDb();
      if (!dbInstance) return;

      const { doc, updateDoc } = await import('firebase/firestore');
      
      await updateDoc(doc(dbInstance, 'social_platforms', platformId), {
        connected: false,
        accessToken: null,
        refreshToken: null
      });

      await loadData();
    } catch (error) {
      console.error('Error disconnecting platform:', error);
    }
  };

  const generateRaftAI = async () => {
    if (!raftAIQuery.trim()) {
      alert('Please enter a topic or query');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate AI generation - In production, this would call Gemini API
      await new Promise(resolve => setTimeout(resolve, 2000));

      let result: any = {};

      if (raftAIMode === 'caption') {
        result = {
          captions: [
            {
              text: `🚀 ${raftAIQuery} - This is your moment to shine! ${brandDNA.voice || 'Engaging'} content that speaks directly to ${brandDNA.audience || 'your audience'}. #${raftAIQuery.replace(/\s+/g, '')} #Viral #Marketing`,
              hashtags: [`#${raftAIQuery.replace(/\s+/g, '')}`, '#Viral', '#Marketing', '#Growth', '#SocialMedia', '#Engagement', '#Trending']
            },
            {
              text: `💡 Thinking about ${raftAIQuery}? Here's what you need to know. ${brandDNA.description || 'Expert insights'} delivered straight to your feed. #${raftAIQuery.replace(/\s+/g, '')} #Insights #Expert`,
              hashtags: [`#${raftAIQuery.replace(/\s+/g, '')}`, '#Insights', '#Expert', '#Knowledge', '#Learn', '#Growth', '#Tips']
            },
            {
              text: `✨ ${raftAIQuery} - The future is here! Join ${brandDNA.audience || 'thousands'} who are already ahead of the curve. ${brandDNA.voice || 'Join us'} today! #${raftAIQuery.replace(/\s+/g, '')} #Future #Innovation`,
              hashtags: [`#${raftAIQuery.replace(/\s+/g, '')}`, '#Future', '#Innovation', '#Tech', '#Trending', '#JoinUs', '#Community']
            }
          ]
        };
      } else if (raftAIMode === 'content') {
        result = {
          contentType: 'IMAGE',
          title: `${raftAIQuery} - Expert Guide`,
          platform: 'Instagram / LinkedIn',
          visualDescription: `A professional, 4K HDR marketing image featuring ${raftAIQuery}. Modern design with vibrant colors, clean typography, and engaging visuals that appeal to ${brandDNA.audience || 'target audience'}. Include ${brandDNA.brandName || 'brand'} colors and style.`,
          marketingText: `🎯 ${raftAIQuery} - Everything you need to know!\n\n${brandDNA.description || 'Expert insights and actionable tips'}.\n\n${brandDNA.voice || 'Join thousands'} who are already succeeding.\n\n👉 Swipe to learn more!\n\n#${raftAIQuery.replace(/\s+/g, '')} #Marketing #Growth #SocialMedia #Viral #Engagement #Trending`
        };
      } else if (raftAIMode === 'strategy') {
        result = {
          plan: [
            {
              day: 'Day 1: The Hook',
              platforms: ['TikTok', 'Instagram Reels'],
              postType: 'Viral Video',
              contentIdea: `Create a 15-second hook video about ${raftAIQuery} that stops the scroll`,
              strategy: 'Hook videos get 3x more engagement. This builds immediate interest.'
            },
            {
              day: 'Day 2: Educational Content',
              platforms: ['LinkedIn', 'X (Twitter)'],
              postType: 'Educational Carousel',
              contentIdea: `Share 5 key insights about ${raftAIQuery}`,
              strategy: 'Educational content builds credibility with your target audience'
            },
            {
              day: 'Day 3: User Engagement',
              platforms: ['Instagram', 'Facebook'],
              postType: 'Poll / Question',
              contentIdea: `Ask your audience: "What's your biggest challenge with ${raftAIQuery}?"`,
              strategy: 'Questions drive comments and engagement, boosting algorithm visibility'
            },
            {
              day: 'Day 4: Behind the Scenes',
              platforms: ['Instagram Stories', 'TikTok'],
              postType: 'Behind the Scenes Video',
              contentIdea: `Show the process behind ${raftAIQuery}`,
              strategy: 'Authentic content builds trust and connection'
            },
            {
              day: 'Day 5: Expert Tips',
              platforms: ['LinkedIn', 'X'],
              postType: 'Blog Post / Thread',
              contentIdea: `Share expert tips and strategies for ${raftAIQuery}`,
              strategy: 'Long-form content establishes thought leadership'
            },
            {
              day: 'Day 6: User Generated Content',
              platforms: ['Instagram', 'TikTok'],
              postType: 'Repost / Feature',
              contentIdea: `Feature user content related to ${raftAIQuery}`,
              strategy: 'UGC increases engagement and builds community'
            },
            {
              day: 'Day 7: Call to Action',
              platforms: ['All Platforms'],
              postType: 'Promotional Post',
              contentIdea: `Launch special offer or campaign around ${raftAIQuery}`,
              strategy: 'End the week with a strong CTA to convert engaged followers'
            }
          ]
        };
      }

      setRaftAIResult(result);
    } catch (error) {
      console.error('Error generating RaftAI content:', error);
      alert('Error generating content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading social media management..." />
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
              <ShareIcon className="w-8 h-8 text-blue-400" />
              Social Media Management
            </h1>
            <p className="text-gray-400 mt-2">Manage social media platforms, create posts, and use RaftsAI</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <div className="flex gap-4">
            {[
              { id: 'platforms', label: 'Platforms', icon: ShareIcon },
              { id: 'create', label: 'Create Post', icon: PlusIcon },
              { id: 'posts', label: 'Posts', icon: DocumentTextIcon },
              { id: 'raftai', label: 'RaftsAI', icon: SparklesIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5 inline-block mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Platforms Tab */}
        {activeTab === 'platforms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map(platform => (
              <div key={platform.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                      {platform.connected && platform.accountName && (
                        <p className="text-gray-400 text-sm">{platform.accountName}</p>
                      )}
                    </div>
                  </div>
                  {platform.connected ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                      Connected
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-semibold">
                      Not Connected
                    </span>
                  )}
                </div>
                {platform.connected ? (
                  <div className="space-y-2">
                    {platform.lastSync && (
                      <p className="text-gray-400 text-xs">Last sync: {new Date(platform.lastSync.seconds * 1000).toLocaleDateString()}</p>
                    )}
                    <button
                      onClick={() => handleDisconnectPlatform(platform.id)}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnectPlatform(platform.id)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
                  >
                    Connect Platform
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Post Tab */}
        {activeTab === 'create' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Post</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Platforms</label>
                <div className="flex flex-wrap gap-3">
                  {platforms.filter(p => p.connected).map(platform => (
                    <label key={platform.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span>{platform.icon} {platform.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5" />
                    Image
                  </button>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2">
                    <VideoCameraIcon className="w-5 h-5" />
                    Video
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Post Content</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Write your post content here..."
                />
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                  Publish Now
                </button>
                <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors">
                  Schedule Post
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('raftai');
                    setRaftAIMode('content');
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Use RaftsAI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No posts yet</h3>
                <p className="text-gray-400">Create your first post to get started</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{platforms.find(p => p.id === post.platform)?.icon}</span>
                        <h3 className="text-xl font-bold text-white">{post.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                          post.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                          post.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-4">{post.content}</p>
                      {post.engagement && (
                        <div className="flex gap-6 text-sm text-gray-400">
                          <span>❤️ {post.engagement.likes}</span>
                          <span>💬 {post.engagement.comments}</span>
                          <span>🔁 {post.engagement.shares}</span>
                          <span>👁️ {post.engagement.views}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <PencilIcon className="w-5 h-5 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <TrashIcon className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* RaftsAI Tab */}
        {activeTab === 'raftai' && (
          <div className="space-y-6">
            {/* Brand DNA Setup */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Brand DNA Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Brand Name</label>
                  <input
                    type="text"
                    value={brandDNA.brandName}
                    onChange={(e) => setBrandDNA({ ...brandDNA, brandName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Your Brand Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Brand Voice</label>
                  <input
                    type="text"
                    value={brandDNA.voice}
                    onChange={(e) => setBrandDNA({ ...brandDNA, voice: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Professional, Friendly, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={brandDNA.audience}
                    onChange={(e) => setBrandDNA({ ...brandDNA, audience: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Entrepreneurs, Marketers, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Brand Description</label>
                  <input
                    type="text"
                    value={brandDNA.description}
                    onChange={(e) => setBrandDNA({ ...brandDNA, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="What your brand does"
                  />
                </div>
              </div>
            </div>

            {/* RaftsAI Tools */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <SparklesIcon className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">AI Caption Generator</h3>
                <p className="text-gray-400 text-sm mb-4">Generate 3 viral captions for any topic</p>
                <button
                  onClick={() => {
                    setRaftAIMode('caption');
                    setShowRaftAIModal(true);
                  }}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Generate Captions
                </button>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <SparklesIcon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">A-to-Z Content Gen</h3>
                <p className="text-gray-400 text-sm mb-4">Complete content package with visuals</p>
                <button
                  onClick={() => {
                    setRaftAIMode('content');
                    setShowRaftAIModal(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Generate Content
                </button>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <SparklesIcon className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">AI Strategy Plan</h3>
                <p className="text-gray-400 text-sm mb-4">7-day marketing campaign plan</p>
                <button
                  onClick={() => {
                    setRaftAIMode('strategy');
                    setShowRaftAIModal(true);
                  }}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Generate Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RaftsAI Modal */}
        {showRaftAIModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" style={{ zIndex: 100 }}>
            <div className="bg-gray-900 border-2 border-gray-600 rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {raftAIMode === 'caption' ? 'AI Caption Generator' :
                   raftAIMode === 'content' ? 'A-to-Z Content Generator' :
                   'AI Strategy Plan'}
                </h2>
                <button
                  onClick={() => {
                    setShowRaftAIModal(false);
                    setRaftAIResult(null);
                    setRaftAIQuery('');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {raftAIMode === 'caption' ? 'Topic for Captions' :
                     raftAIMode === 'content' ? 'Topic for Content' :
                     'Campaign Topic'}
                  </label>
                  <input
                    type="text"
                    value={raftAIQuery}
                    onChange={(e) => setRaftAIQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter topic..."
                  />
                </div>

                <button
                  onClick={generateRaftAI}
                  disabled={isGenerating || !raftAIQuery.trim()}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </button>

                {raftAIResult && (
                  <div className="mt-6 bg-gray-800 rounded-lg p-6">
                    {raftAIMode === 'caption' && raftAIResult.captions && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4">Generated Captions</h3>
                        {raftAIResult.captions.map((caption: any, idx: number) => (
                          <div key={idx} className="bg-gray-700 rounded-lg p-4">
                            <p className="text-white mb-2">{caption.text}</p>
                            <div className="flex flex-wrap gap-2">
                              {caption.hashtags?.map((tag: string, tagIdx: number) => (
                                <span key={tagIdx} className="text-blue-400 text-sm">{tag}</span>
                              ))}
                            </div>
                            <button className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                              Copy Caption
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {raftAIMode === 'content' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4">Generated Content Package</h3>
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-300 text-sm mb-2"><strong>Content Type:</strong> {raftAIResult.contentType}</p>
                          <p className="text-gray-300 text-sm mb-2"><strong>Platform:</strong> {raftAIResult.platform}</p>
                          <p className="text-white mb-4"><strong>Title:</strong> {raftAIResult.title}</p>
                          <p className="text-white mb-4"><strong>Marketing Text:</strong></p>
                          <p className="text-gray-300 whitespace-pre-wrap">{raftAIResult.marketingText}</p>
                          {raftAIResult.visualDescription && (
                            <div className="mt-4">
                              <p className="text-white mb-2"><strong>Visual Description:</strong></p>
                              <p className="text-gray-300">{raftAIResult.visualDescription}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {raftAIMode === 'strategy' && raftAIResult.plan && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4">7-Day Marketing Plan</h3>
                        {raftAIResult.plan.map((day: any, idx: number) => (
                          <div key={idx} className="bg-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-white mb-2">{day.day}</h4>
                            <p className="text-gray-300 text-sm mb-1"><strong>Platforms:</strong> {day.platforms.join(', ')}</p>
                            <p className="text-gray-300 text-sm mb-1"><strong>Post Type:</strong> {day.postType}</p>
                            <p className="text-white mb-2"><strong>Content Idea:</strong> {day.contentIdea}</p>
                            <p className="text-gray-300 text-sm"><strong>Strategy:</strong> {day.strategy}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

