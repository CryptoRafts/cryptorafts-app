"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { 
  ArrowLeftIcon, 
  EyeIcon, 
  CalendarIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewBlogPostPage() {
  const { user, claims } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'crypto-news',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft',
    featuredImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check admin access - wait for auth to load
  useEffect(() => {
    const checkAdmin = setTimeout(() => {
      if (!user) {
        console.log('❌ No user found, redirecting to login...');
        router.push('/login');
        setAuthLoading(false);
        return;
      }

      // Check multiple admin indicators
      const userRole = localStorage.getItem('userRole');
      const isAdmin = 
        (claims as any)?.admin?.super === true ||
        (claims as any)?.role === 'admin' ||
        userRole === 'admin' ||
        (user as any)?.customClaims?.admin?.super === true ||
        (user as any)?.customClaims?.role === 'admin';
      
      if (!isAdmin) {
        console.log('❌ Not admin, redirecting to 403...');
        router.push('/403');
      } else {
        console.log('✅ Admin access confirmed');
      }
      
      setAuthLoading(false);
    }, 1000); // Wait 1 second for auth to load

    return () => clearTimeout(checkAdmin);
  }, [user, claims, router]);

  const categories = [
    { value: 'crypto', label: 'Crypto News' },
    { value: 'ai', label: 'AI & Automation' },
    { value: 'tokenomics', label: 'Tokenomics' },
    { value: 'web3', label: 'Web3' },
    { value: 'defi', label: 'DeFi' },
    { value: 'guides', label: 'Guides' },
    { value: 'startups', label: 'Startups' },
    { value: 'investing', label: 'Investing' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);

      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
          author: user?.displayName || user?.email || 'Admin',
          authorId: user?.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/blog');
      } else {
        alert('Failed to create post: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setSaving(false);
    }
  };

  const generateExcerpt = () => {
    const text = formData.content.replace(/<[^>]*>/g, ''); // Remove HTML
    const excerpt = text.substring(0, 160).trim();
    setFormData({ ...formData, excerpt: excerpt + (text.length > 160 ? '...' : '') });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70 mt-4">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Post</h1>
        </div>

        {/* Main Content */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white/5 border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <EyeIcon className="w-5 h-5" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-blue-400"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
              
              <button
                type="submit"
                form="post-form"
                disabled={saving}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="post-form" onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder="Enter post title..."
                />
              </div>

              {/* Category and Featured Image */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Excerpt
                </label>
                <div className="flex gap-2 mb-2">
                  <textarea
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder="Brief description of the post..."
                  />
                  <button
                    type="button"
                    onClick={generateExcerpt}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all whitespace-nowrap"
                  >
                    Auto-generate
                  </button>
                </div>
                <p className="text-xs text-white/50">{formData.excerpt.length} / 160 characters</p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Content * (HTML supported)
                </label>
                {previewMode ? (
                  <div
                    className="w-full min-h-[500px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                ) : (
                  <textarea
                    required
                    rows={20}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 font-mono text-sm"
                    placeholder="Write your content here... (HTML supported)"
                  />
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder="crypto, web3, defi"
                />
                <p className="text-xs text-white/50 mt-1">Separate tags with commas</p>
              </div>

              {/* SEO */}
              <div className="border-t border-white/10 pt-6">
                <h2 className="text-lg font-semibold text-white mb-4">SEO Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                      placeholder="SEO title for search engines"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Meta Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                      placeholder="Brief description for search engines"
                    />
                    <p className="text-xs text-white/50 mt-1">{formData.metaDescription.length} / 160 characters</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
    </div>
  );
}

