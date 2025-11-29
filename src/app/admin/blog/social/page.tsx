"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { 
  ArrowLeftIcon, 
  PhotoIcon,
  VideoCameraIcon,
  SparklesIcon,
  GlobeAltIcon,
  ShareIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { ensureDb, ensureStorage, waitForFirebase } from "@/lib/firebase-utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Platform {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
  optimalTime: string;
}

interface HashtagSuggestion {
  hashtag: string;
  score: number;
  reason: string;
  category: string;
}

export default function SocialPostingPage() {
  const { user, claims } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'crypto',
    tags: '',
    featuredImage: '',
    videoUrl: '',
    status: 'draft',
    scheduledDate: '',
  });

  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', selected: false, optimalTime: '09:00' },
    { id: 'x', name: 'X (Twitter)', icon: '🐦', selected: false, optimalTime: '12:00' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', selected: false, optimalTime: '18:00' },
    { id: 'devto', name: 'Dev.to', icon: '💻', selected: false, optimalTime: '10:00' },
    { id: 'blogger', name: 'Blogger', icon: '📝', selected: false, optimalTime: '14:00' },
    { id: 'buffer', name: 'Buffer', icon: '📊', selected: false, optimalTime: '11:00' },
    { id: 'website', name: 'Website Blog', icon: '🌐', selected: true, optimalTime: '09:00' },
  ]);

  const [hashtags, setHashtags] = useState<string[]>([]);
  const [suggestedHashtags, setSuggestedHashtags] = useState<HashtagSuggestion[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check admin access
  useEffect(() => {
    const checkAdmin = setTimeout(() => {
      if (!user) {
        router.push('/login');
        setAuthLoading(false);
        return;
      }

      const userRole = localStorage.getItem('userRole');
      const isAdmin = 
        (claims as any)?.admin?.super === true ||
        (claims as any)?.role === 'admin' ||
        userRole === 'admin';

      if (!isAdmin) {
        router.push('/403');
      } else {
        setAuthLoading(false);
      }
    }, 1000);

    return () => clearTimeout(checkAdmin);
  }, [user, claims, router]);

  // Get AI hashtag suggestions
  const getHashtagSuggestions = async () => {
    if (!formData.content && !formData.title) {
      alert('Please add content or title first');
      return;
    }

    setLoadingHashtags(true);
    try {
      const response = await fetch('/api/blog/admin/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content || formData.title,
          category: formData.category,
          count: 15,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuggestedHashtags(data.suggestions);
      }
    } catch (error) {
      console.error('Error getting hashtags:', error);
    } finally {
      setLoadingHashtags(false);
    }
  };

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      alert('Video file too large. Maximum 100MB.');
      return;
    }

    setUploading(true);
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setUploading(false);
        return;
      }

      const storageInstance = ensureStorage();
      if (!storageInstance) {
        alert('Storage not available. Please refresh and try again.');
        setUploading(false);
        return;
      }

      const videoRef = ref(storageInstance, `blog/videos/${Date.now()}-${file.name}`);
      await uploadBytes(videoRef, file);
      const url = await getDownloadURL(videoRef);
      setFormData({ ...formData, videoUrl: url });
      alert('✅ Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('❌ Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        setUploading(false);
        return;
      }

      const storageInstance = ensureStorage();
      if (!storageInstance) {
        alert('Storage not available. Please refresh and try again.');
        setUploading(false);
        return;
      }

      const imageRef = ref(storageInstance, `blog/images/${Date.now()}-${file.name}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      setFormData({ ...formData, featuredImage: url });
      alert('✅ Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Toggle platform selection
  const togglePlatform = (platformId: string) => {
    setPlatforms(platforms.map(p => 
      p.id === platformId ? { ...p, selected: !p.selected } : p
    ));
  };

  // Add hashtag
  const addHashtag = (hashtag: string) => {
    if (!hashtags.includes(hashtag)) {
      setHashtags([...hashtags, hashtag]);
    }
  };

  // Remove hashtag
  const removeHashtag = (hashtag: string) => {
    setHashtags(hashtags.filter(h => h !== hashtag));
  };

  // Submit post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const selectedPlatforms = platforms.filter(p => p.selected).map(p => p.id);
      
      const response = await fetch('/api/blog/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          category: formData.category,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          featuredImage: formData.featuredImage,
          status: formData.scheduledDate ? 'scheduled' : formData.status,
          scheduledDate: formData.scheduledDate || undefined,
          platformSelection: {
            linkedin: selectedPlatforms.includes('linkedin'),
            x: selectedPlatforms.includes('x'),
            telegram: selectedPlatforms.includes('telegram'),
            devto: selectedPlatforms.includes('devto'),
            blogger: selectedPlatforms.includes('blogger'),
            buffer: selectedPlatforms.includes('buffer'),
            website: selectedPlatforms.includes('website'),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        // If publishing now, trigger publish endpoint
        if (formData.status === 'published' && !formData.scheduledDate) {
          await fetch('/api/blog/admin/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId: data.postId,
              platforms: selectedPlatforms,
            }),
          });
        }

        alert('✅ Post created successfully!');
        router.push('/admin/blog');
      } else {
        alert('❌ Failed to create post: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('❌ Failed to create post');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/blog" className="flex items-center text-white hover:text-cyan-400">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Blog
          </Link>
          <h1 className="text-3xl font-bold text-white">Create Social Post</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <label className="block text-white font-semibold mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter post title..."
                  required
                />
              </div>

              {/* Content */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <label className="block text-white font-semibold mb-2">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Write your post content (HTML supported)..."
                  required
                />
              </div>

              {/* Media Upload */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <label className="block text-white font-semibold mb-4">Media</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-cyan-400 transition">
                      <div className="text-center">
                        <PhotoIcon className="w-8 h-8 text-white mx-auto mb-2" />
                        <span className="text-white text-sm">Upload Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {formData.featuredImage && (
                      <img src={formData.featuredImage} alt="Featured" className="mt-2 w-full h-32 object-cover rounded" />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-cyan-400 transition">
                      <div className="text-center">
                        <VideoCameraIcon className="w-8 h-8 text-white mx-auto mb-2" />
                        <span className="text-white text-sm">Upload Video</span>
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {formData.videoUrl && (
                      <video src={formData.videoUrl} controls className="mt-2 w-full h-32 rounded" />
                    )}
                  </div>
                </div>
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                  <label className="block text-white font-semibold mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="crypto">Crypto</option>
                    <option value="ai">AI & Automation</option>
                    <option value="web3">Web3</option>
                    <option value="defi">DeFi</option>
                    <option value="tokenomics">Tokenomics</option>
                    <option value="guides">Guides</option>
                  </select>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                  <label className="block text-white font-semibold mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="crypto, blockchain, defi"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Platform Selection & Hashtags */}
            <div className="space-y-6">
              {/* Platform Selection */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <ShareIcon className="w-5 h-5 mr-2" />
                  Select Platforms
                </h3>
                <div className="space-y-2">
                  {platforms.map((platform) => (
                    <label
                      key={platform.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                        platform.selected
                          ? 'bg-cyan-500/20 border-2 border-cyan-400'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={platform.selected}
                          onChange={() => togglePlatform(platform.id)}
                          className="mr-3 w-4 h-4"
                        />
                        <span className="text-2xl mr-2">{platform.icon}</span>
                        <div>
                          <div className="text-white font-medium">{platform.name}</div>
                          <div className="text-gray-400 text-xs">Optimal: {platform.optimalTime}</div>
                        </div>
                      </div>
                      {platform.selected && (
                        <CheckCircleIcon className="w-5 h-5 text-cyan-400" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Hashtag Suggestions */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Hashtags
                  </h3>
                  <button
                    type="button"
                    onClick={getHashtagSuggestions}
                    disabled={loadingHashtags}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition disabled:opacity-50"
                  >
                    {loadingHashtags ? 'Loading...' : 'AI Suggest'}
                  </button>
                </div>

                {/* Selected Hashtags */}
                {hashtags.length > 0 && (
                  <div className="mb-4">
                    <div className="text-white text-sm mb-2">Selected:</div>
                    <div className="flex flex-wrap gap-2">
                      {hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeHashtag(tag)}
                            className="ml-2 hover:text-red-400"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Hashtags */}
                {suggestedHashtags.length > 0 && (
                  <div>
                    <div className="text-white text-sm mb-2">AI Suggestions:</div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {suggestedHashtags.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                          onClick={() => addHashtag(suggestion.hashtag)}
                        >
                          <div>
                            <div className="text-white font-medium">{suggestion.hashtag}</div>
                            <div className="text-gray-400 text-xs">{suggestion.reason}</div>
                          </div>
                          <div className="text-cyan-400 font-semibold">{suggestion.score}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Schedule
                </h3>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full mt-3 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Publish Now</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create & Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

