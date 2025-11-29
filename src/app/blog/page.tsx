"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase.client";
import { collection, onSnapshot, query, where, limit as firestoreLimit } from "firebase/firestore";
import { MagnifyingGlassIcon, FunnelIcon, ClockIcon, CalendarIcon, EyeIcon, HeartIcon, ShareIcon } from "@heroicons/react/24/outline";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  featuredImage?: string;
  createdAt: string;
  views: number;
  likes: number;
  readingTime?: number;
  featured?: boolean;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  const categories = [
    "All",
    "Crypto News",
    "AI & Automation",
    "Tokenomics",
    "Web3",
    "DeFi",
    "Guides",
    "Startups",
    "Investing",
  ];

  // Real-time listener for blog posts
  useEffect(() => {
    if (!db) {
      console.error('❌ Firebase not initialized');
      setLoading(false);
      return;
    }
    
    console.log('🔍 Setting up real-time listener for blog posts...');
    
    // Set a timeout to stop loading after 10 seconds if no response
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout waiting for blog posts');
      setLoading(false);
    }, 10000);
    
    const postsRef = collection(db!, 'blog_posts');
    const q = query(
      postsRef,
      where('status', '==', 'published'),
      firestoreLimit(50)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        clearTimeout(timeoutId);
        console.log('✅ Real-time update received:', snapshot.size, 'posts');
        
        // Debug: Log all posts to see their status
        if (snapshot.size === 0) {
          console.log('⚠️ No published posts found. Checking all posts...');
          // Also query without status filter to see what posts exist
          const allPostsRef = collection(db!, 'blog_posts');
          const allPostsQuery = query(allPostsRef, firestoreLimit(10));
          onSnapshot(allPostsQuery, (allSnapshot) => {
            console.log('📊 Total posts in database:', allSnapshot.size);
            allSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              console.log(`📝 Post ${doc.id}: status="${data.status}", title="${data.title}"`);
            });
          });
        }
        
        const fetchedPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt || '',
            category: data.category,
            tags: data.tags || [],
            author: data.author,
            featuredImage: data.featuredImage,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            views: data.views || 0,
            likes: data.likes || 0,
            readingTime: data.readingTime || 1,
            featured: data.featured || false,
          };
        });
        
        console.log('✅ Posts updated:', fetchedPosts.length);
        setPosts(fetchedPosts);
        setLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error("❌ Error in real-time listener:", error);
        console.error("Error details:", error.code, error.message);
        setLoading(false);
      }
    );
    
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [db]);

  useEffect(() => {
    filterPosts();
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedCategory, posts]);

  const filterPosts = () => {
    let filtered = [...posts];

    // Filter by category
    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter((post) => post.category === selectedCategory.toLowerCase().replace(/\s+/g, '-'));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredPosts(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crypto: "bg-orange-500/20 text-orange-400",
      ai: "bg-green-500/20 text-green-400",
      tokenomics: "bg-indigo-500/20 text-indigo-400",
      web3: "bg-purple-500/20 text-purple-400",
      defi: "bg-pink-500/20 text-pink-400",
      guides: "bg-teal-500/20 text-teal-400",
      startups: "bg-amber-500/20 text-amber-400",
      investing: "bg-blue-500/20 text-blue-400",
    };
    return colors[category] || "bg-gray-500/20 text-gray-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center pt-20 sm:pt-24 md:pt-28">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70">Loading blog posts...</p>
          <p className="text-white/50 text-sm">If this takes too long, check browser console for errors</p>
        </div>
      </div>
    );
  }
  
  // Show empty state if no posts and not loading
  if (!loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 sm:pt-24 md:pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 mt-8 sm:mt-12 md:mt-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cryptorafts Blog
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-6">
              Insights, guides, and updates on crypto, Web3, AI, and more
            </p>
            <div className="glass rounded-xl p-4 border border-blue-500/30 bg-blue-500/10 max-w-3xl mx-auto">
              <p className="text-sm text-white/90 mb-2">
                <span className="font-semibold">📝 This blog is powered by Raft AI</span>
              </p>
              <p className="text-xs text-white/70">
                ⚠️ AI-generated content may contain errors. This content is for informational purposes only and is <span className="font-semibold">not financial advice</span>. Always do your own research and consult with a qualified financial adviser before making investment decisions.
              </p>
            </div>
          </div>
          
          <div className="glass rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-20 h-20 border-4 border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Blog Posts Yet</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              There are no published blog posts at the moment. Check back soon for updates!
            </p>
            <p className="text-white/50 text-sm">
              Admin: Create and publish posts at <code className="bg-white/10 px-2 py-1 rounded">/admin/blog</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const featuredPosts = filteredPosts.filter((post) => post.featured).slice(0, 3);
  const regularPosts = filteredPosts.filter((post) => !post.featured);
  
  // Pagination logic
  const totalPages = Math.ceil(regularPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = regularPosts.slice(indexOfFirstPost, indexOfLastPost);
  
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 sm:pt-24 md:pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12 mt-8 sm:mt-12 md:mt-16">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Cryptorafts Blog
                  </h1>
                  <p className="text-xl text-white/70 max-w-2xl mx-auto mb-6">
                    Insights, guides, and updates on crypto, Web3, AI, and more
                  </p>
                  <div className="glass rounded-xl p-4 border border-blue-500/30 bg-blue-500/10 max-w-3xl mx-auto">
                    <p className="text-sm text-white/90 mb-2">
                      <span className="font-semibold">📝 This blog is powered by Raft AI</span>
                    </p>
                    <p className="text-xs text-white/70">
                      ⚠️ AI-generated content may contain errors. This content is for informational purposes only and is <span className="font-semibold">not financial advice</span>. Always do your own research and consult with a qualified financial adviser before making investment decisions.
                    </p>
                  </div>
                </div>

        {/* Search and Filter */}
        <div className="glass rounded-2xl p-6 mb-12 border border-white/10">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <select
                value={selectedCategory || "All"}
                onChange={(e) => setSelectedCategory(e.target.value === "All" ? null : e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-white/60">
            Showing {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded" />
              Featured Posts
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  {post.featuredImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                          Featured
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-3 mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDate(post.createdAt)}
                      </span>
                      {post.readingTime && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {post.readingTime} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded" />
            All Posts
          </h2>

          {regularPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/70 text-lg">No posts found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  {post.featuredImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-3 mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <div className="flex items-center gap-3">
                        <span>{post.author}</span>
                        <span>•</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <HeartIcon className="w-4 h-4" />
                          {post.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2 sm:gap-3">
                {/* Previous Button */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    currentPage === 1
                      ? 'border-white/10 text-white/30 cursor-not-allowed'
                      : 'border-white/20 text-white hover:border-blue-400 hover:bg-blue-400/10'
                  }`}
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    number === 1 ||
                    number === totalPages ||
                    (number >= currentPage - 1 && number <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          currentPage === number
                            ? 'border-blue-400 bg-blue-400/20 text-blue-400 font-bold'
                            : 'border-white/20 text-white hover:border-blue-400 hover:bg-blue-400/10'
                        }`}
                      >
                        {number}
                      </button>
                    );
                  } else if (number === currentPage - 2 || number === currentPage + 2) {
                    return (
                      <span key={number} className="px-2 text-white/50">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                {/* Next Button */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    currentPage === totalPages
                      ? 'border-white/10 text-white/30 cursor-not-allowed'
                      : 'border-white/20 text-white hover:border-blue-400 hover:bg-blue-400/10'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

