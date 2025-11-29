"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase.client";
import { collection, getDocs, addDoc, query, where, limit as firestoreLimit, orderBy, serverTimestamp, doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { 
  CalendarIcon, 
  ClockIcon, 
  EyeIcon, 
  HeartIcon, 
  ShareIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { 
  ShareIcon as ShareIconSolid 
} from "@heroicons/react/24/solid";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  featuredImage?: string;
  createdAt: string;
  publishedAt?: string;
  views: number;
  likes: number;
  shares: number;
  readingTime?: number;
  commentEnabled?: boolean;
}

interface Comment {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: any;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentForm, setCommentForm] = useState({ name: "", email: "", content: "" });
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
      checkLikedStatus();
    }
  }, [slug]);

  // Real-time listener for post updates (likes, shares, views)
  useEffect(() => {
    if (!post?.id || !db) return;

    console.log('🔍 Setting up real-time listener for post:', post.id);
    const postRef = doc(db!, 'blog_posts', post.id);
    
    const unsubscribe = onSnapshot(
      postRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('✅ Real-time update received:', { views: data.views, likes: data.likes, shares: data.shares });
          setPost((prevPost) => {
            if (!prevPost) return null;
            return {
              ...prevPost,
              views: data.views || 0,
              likes: data.likes || 0,
              shares: data.shares || 0,
            };
          });
        }
      },
      (error) => {
        console.error("Error in real-time post listener:", error);
      }
    );

    return () => unsubscribe();
  }, [post?.id, db]);

  // Real-time listener for comments
  useEffect(() => {
    if (!post?.id || !db) return;

    try {
      setLoadingComments(true);
      const commentsRef = collection(db!, 'blog_comments');
      // Remove orderBy to avoid index requirement - we'll sort client-side
      const q = query(
        commentsRef,
        where('postId', '==', post.id)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const fetchedComments = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to ISO string
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              };
            }) as Comment[];
            
            // Sort by createdAt descending (newest first) client-side
            fetchedComments.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
            
            console.log('✅ Comments loaded:', fetchedComments.length);
            setComments(fetchedComments);
            setLoadingComments(false);
          } catch (error) {
            console.error("Error processing comments:", error);
            setLoadingComments(false);
          }
        },
        (error) => {
          console.error("Error in real-time comments listener:", error);
          console.log("Post ID:", post.id);
          setLoadingComments(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up comments listener:", error);
      setLoadingComments(false);
    }
  }, [post?.id, db]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu && event.target) {
        const target = event.target as HTMLElement;
        if (!target.closest('.share-menu-container')) {
          setShowShareMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  const fetchPost = async () => {
    try {
      console.log('🔍 Fetching post by slug:', slug);
      
      if (!db) {
        console.error('❌ Firebase not initialized');
        setLoading(false);
        return;
      }
      
      const postsRef = collection(db!, 'blog_posts');
      const q = query(
        postsRef,
        where('slug', '==', slug),
        firestoreLimit(1)
      );
      
      const snapshot = await getDocs(q);
      console.log('✅ Got', snapshot.size, 'posts with slug:', slug);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        const foundPost: BlogPost = {
          id: doc.id,
          title: data.title,
          slug: data.slug,
          content: data.content || '',
          excerpt: data.excerpt || '',
          category: data.category,
          tags: data.tags || [],
          author: data.author,
          featuredImage: data.featuredImage,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          publishedAt: data.publishedAt?.toDate?.()?.toISOString(),
          views: data.views || 0,
          likes: data.likes || 0,
          shares: data.shares || 0,
          readingTime: data.readingTime || 1,
          commentEnabled: data.commentEnabled || false,
        };
        
        console.log('✅ Post found:', foundPost.title);
        setPost(foundPost);
        // Increment view count
        incrementViews(foundPost.id);
      } else {
        console.error('❌ No post found with slug:', slug);
      }
    } catch (error) {
      console.error("❌ Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (postId: string) => {
    if (!db) return;
    
    try {
      const postRef = doc(db!, 'blog_posts', postId);
      const postSnapshot = await getDoc(postRef);
      if (postSnapshot.exists()) {
        const currentViews = postSnapshot.data().views || 0;
        await updateDoc(postRef, {
          views: currentViews + 1,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const checkLikedStatus = () => {
    if (typeof window !== "undefined" && post?.id) {
      const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
      setLiked(likedPosts.includes(post.id));
    }
  };

  useEffect(() => {
    if (post?.id) {
      checkLikedStatus();
    }
  }, [post?.id]);

  const handleLike = async () => {
    if (!post || !db) return;
    
    console.log('🔍 handleLike called:', { postId: post.id, currentLiked: liked });
    
    try {
      const postRef = doc(db!, 'blog_posts', post.id);
      const currentLikes = post.likes || 0;
      
      if (liked) {
        // Unlike - decrement
        console.log('💔 Unliking post...');
        await updateDoc(postRef, {
          likes: Math.max(0, currentLikes - 1),
          updatedAt: new Date(),
        });
        
        setLiked(false);
        
        // Remove from localStorage
        const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
        const updated = likedPosts.filter((id: string) => id !== post.id);
        localStorage.setItem("likedPosts", JSON.stringify(updated));
        
        // Real-time listener will update the count
      } else {
        // Like - increment
        console.log('❤️ Liking post...');
        await updateDoc(postRef, {
          likes: currentLikes + 1,
          updatedAt: new Date(),
        });
        
        setLiked(true);
        
        // Save to localStorage
        const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
        if (!likedPosts.includes(post.id)) {
          likedPosts.push(post.id);
          localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
        }
        
        // Real-time listener will update the count
      }
    } catch (error) {
      console.error("❌ Error liking post:", error);
      // Revert optimistic update on error
      setLiked(!liked);
    }
  };

  const fetchComments = async () => {
    if (!post?.id || !db) return;
    
    setLoadingComments(true);
    try {
      const commentsRef = collection(db!, 'blog_comments');
      // Remove orderBy to avoid index requirement - we'll sort client-side
      const q = query(
        commentsRef,
        where('postId', '==', post.id)
      );
      
      const snapshot = await getDocs(q);
      const fetchedComments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamp to ISO string
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      }) as Comment[];
      
      // Sort by createdAt descending (newest first) client-side
      fetchedComments.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setComments(fetchedComments);
      // Note: Real-time listener will handle updates, so we just set initial state
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post?.id || !db || !commentForm.name || !commentForm.email || !commentForm.content) {
      alert("Please fill in all fields");
      return;
    }
    
    console.log('🔍 Submitting comment:', { postId: post.id, name: commentForm.name });
    setSubmittingComment(true);
    try {
      const commentsRef = collection(db!, 'blog_comments');
      console.log('🔍 Adding document to blog_comments collection');
      const docRef = await addDoc(commentsRef, {
        postId: post.id,
        name: commentForm.name,
        email: commentForm.email,
        content: commentForm.content,
        createdAt: serverTimestamp(),
      });
      console.log('✅ Comment added with ID:', docRef.id);
      
      // Reset form
      setCommentForm({ name: "", email: "", content: "" });
      
      // Real-time listener will automatically update comments, so no need to fetch again
      alert("Comment submitted successfully!");
    } catch (error: any) {
      console.error("❌ Error submitting comment:", error);
      console.error("Error details:", error.code, error.message);
      alert(`Error submitting comment: ${error.message}. Please try again.`);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async (platform: string) => {
    if (!post) return;

    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = post.title;
    const description = post.excerpt || post.title;
    
    try {
      let shareTracked = false;

      switch (platform) {
        case "copy":
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            alert("✅ Link copied to clipboard!");
          } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            alert("✅ Link copied to clipboard!");
          }
          // Don't track copy shares
          break;
        case "twitter":
        case "x":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            "_blank",
            "width=550,height=420"
          );
          shareTracked = true;
          break;
        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            "_blank",
            "width=550,height=420"
          );
          shareTracked = true;
          break;
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
            "_blank",
            "width=550,height=420"
          );
          shareTracked = true;
          break;
        case "whatsapp":
          window.open(
            `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
            "_blank",
            "width=550,height=420"
          );
          shareTracked = true;
          break;
        case "telegram":
          window.open(
            `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
            "_blank",
            "width=550,height=420"
          );
          shareTracked = true;
          break;
        case "reddit":
          window.open(
            `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
            "_blank",
            "width=550,height=420"
          );
          shareTracked = true;
          break;
        case "email":
          window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`;
          // Don't track email shares
          break;
        default:
          // Use Web Share API if available
          if (navigator.share) {
            try {
              await navigator.share({
                title: text,
                text: description,
                url: url,
              });
              shareTracked = true;
            } catch (err) {
              // User cancelled or error occurred
              return;
            }
          } else {
            // Fallback to copy
            await navigator.clipboard.writeText(url);
            alert("✅ Link copied to clipboard!");
          }
      }

      // Track share (only for non-email/copy shares)
      if (shareTracked && db) {
        console.log('🔗 Tracking share on Firebase...');
        try {
          const postRef = doc(db!, 'blog_posts', post.id);
          const currentShares = post.shares || 0;
          await updateDoc(postRef, {
            shares: currentShares + 1,
            updatedAt: new Date(),
          });
          console.log('✅ Share tracked successfully');
          // Real-time listener will update the count automatically
        } catch (error) {
          console.error("❌ Error tracking share:", error);
        }
      }
      
      setShowShareMenu(false);
    } catch (error) {
      console.error("Error sharing:", error);
      alert("Error sharing. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      crypto: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      ai: "bg-green-500/20 text-green-400 border-green-500/30",
      tokenomics: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      web3: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      defi: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      guides: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      startups: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      investing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center pt-20 sm:pt-24 md:pt-28">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center pt-20 sm:pt-24 md:pt-28">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Post Not Found</h1>
          <p className="text-white/70">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog" className="btn btn-primary inline-block">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 sm:mb-8 md:mb-10 mt-8 transition-colors group"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Blog
        </Link>

        {/* Featured Image with Overlay Content */}
        {post.featuredImage && (
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden mb-8 sm:mb-12 border-2 border-white/20 shadow-2xl">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              quality={90}
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-slate-900/90" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-start justify-end p-4 sm:p-6 md:p-8 lg:p-12">
              {/* Category and Meta */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-full border-2 backdrop-blur-sm ${getCategoryColor(post.category)}`}>
                  {post.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/90 backdrop-blur-sm bg-black/20 px-2 sm:px-3 py-1 rounded-full">
                  <span className="flex items-center gap-1 sm:gap-2">
                    <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="hidden sm:inline">{formatDate(post.publishedAt || post.createdAt)}</span>
                    <span className="sm:hidden">{formatDate(post.publishedAt || post.createdAt).split(',')[0]}</span>
                  </span>
                  {post.readingTime && (
                    <span className="flex items-center gap-1 sm:gap-2">
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                      <span>{post.readingTime} min</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 sm:gap-2">
                    <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span>{post.views}</span>
                  </span>
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-2 sm:mb-4 leading-tight tracking-tight break-words drop-shadow-2xl">
                {post.title}
              </h1>
              
              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 leading-relaxed font-normal max-w-4xl drop-shadow-lg">
                  {post.excerpt}
                </p>
              )}
              
              {/* Author and Social Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 pt-4 sm:pt-8 border-t-2 border-white/30 mt-4 sm:mt-6">
                {/* Author Section */}
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/30 shadow-xl">
                    <Image
                      src="/logopart to.png"
                      alt="Cryptorafts Logo"
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm sm:text-base md:text-lg">{post.author}</p>
                    <p className="text-white/90 text-xs sm:text-sm">Cryptorafts Team</p>
                  </div>
                </div>
                
                {/* Social Actions */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <button
                    onClick={handleLike}
                    className={`group flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg sm:rounded-xl border-2 transition-all backdrop-blur-sm ${
                      liked 
                        ? "bg-red-500/30 text-red-400 border-red-500/60 shadow-lg shadow-red-500/20" 
                        : "bg-white/10 text-white/90 border-white/30 hover:bg-white/20 hover:border-white/40 hover:shadow-lg"
                    }`}
                  >
                    <HeartIcon className={`w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform ${liked ? "fill-current scale-110" : "group-hover:scale-110"}`} />
                    <span className="font-bold text-base sm:text-lg">{post.likes}</span>
                  </button>
                  
                  <div className="relative share-menu-container">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg sm:rounded-xl bg-white/10 text-white/90 border-2 border-white/30 hover:bg-white/20 hover:border-white/40 hover:shadow-lg transition-all backdrop-blur-sm"
                    >
                      <ShareIcon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      <span className="font-bold text-base sm:text-lg">{post.shares}</span>
                      <span className="font-semibold text-xs sm:text-sm md:text-base">Share</span>
                    </button>
                    
                    {showShareMenu && (
                      <div className="absolute right-0 bottom-full mb-2 glass rounded-xl p-2 border border-white/10 shadow-xl min-w-[180px] sm:min-w-[220px] z-50">
                    <div className="grid grid-cols-2 gap-1 sm:gap-2">
                      <button
                        onClick={() => handleShare("twitter")}
                        className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                        title="Share on X (Twitter)"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="text-xs">X</span>
                      </button>
                      <button
                        onClick={() => handleShare("facebook")}
                        className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                        title="Share on Facebook"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span className="text-xs">Facebook</span>
                      </button>
                      <button
                        onClick={() => handleShare("linkedin")}
                        className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                        title="Share on LinkedIn"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span className="text-xs">LinkedIn</span>
                      </button>
                      <button
                        onClick={() => handleShare("whatsapp")}
                        className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                        title="Share on WhatsApp"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        <span className="text-xs">WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleShare("telegram")}
                        className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                        title="Share on Telegram"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        <span className="text-xs">Telegram</span>
                      </button>
                      <button
                        onClick={() => handleShare("reddit")}
                        className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                        title="Share on Reddit"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.687-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                        </svg>
                        <span className="text-xs">Reddit</span>
                      </button>
                      <button
                        onClick={() => handleShare("email")}
                        className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                        title="Share via Email"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Email</span>
                      </button>
                      <button
                        onClick={() => handleShare("copy")}
                        className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                        title="Copy Link"
                      >
                        <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-xs">Copy Link</span>
                      </button>
                    </div>
                      </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback Header for posts without featured image */}
        {!post.featuredImage && (
          <header className="mb-8 sm:mb-12">
            {/* Category and Meta */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
              <span className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-full border-2 ${getCategoryColor(post.category)}`}>
                {post.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/70">
                <span className="flex items-center gap-1 sm:gap-2">
                  <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="hidden sm:inline">{formatDate(post.publishedAt || post.createdAt)}</span>
                  <span className="sm:hidden">{formatDate(post.publishedAt || post.createdAt).split(',')[0]}</span>
                </span>
                {post.readingTime && (
                  <span className="flex items-center gap-1 sm:gap-2">
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                    <span>{post.readingTime} min</span>
                  </span>
                )}
                <span className="flex items-center gap-1 sm:gap-2">
                  <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                  <span>{post.views}</span>
                </span>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-4 sm:mb-6 md:mb-8 leading-tight tracking-tight break-words">
              {post.title}
            </h1>
            
            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 mb-6 sm:mb-8 md:mb-12 leading-relaxed font-normal max-w-4xl border-l-4 border-blue-500 pl-4 sm:pl-6 pt-2">
                {post.excerpt}
              </p>
            )}
            
            {/* Author and Social Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 md:pt-10 border-t-2 border-white/20 mt-4 sm:mt-6 md:mt-8">
              {/* Author Section */}
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/30 shadow-xl">
                  <Image
                    src="/logopart to.png"
                    alt="Cryptorafts Logo"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-white font-bold text-sm sm:text-base md:text-lg">{post.author}</p>
                  <p className="text-white/60 text-xs sm:text-sm">Cryptorafts Team</p>
                </div>
              </div>
              
              {/* Social Actions */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <button
                  onClick={handleLike}
                  className={`group flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg sm:rounded-xl border-2 transition-all ${
                    liked 
                      ? "bg-red-500/30 text-red-400 border-red-500/60 shadow-lg shadow-red-500/20" 
                      : "bg-white/5 text-white/80 border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg"
                  }`}
                >
                  <HeartIcon className={`w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform ${liked ? "fill-current scale-110" : "group-hover:scale-110"}`} />
                  <span className="font-bold text-base sm:text-lg">{post.likes}</span>
                </button>
                
                <div className="relative share-menu-container">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg sm:rounded-xl bg-white/5 text-white/80 border-2 border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg transition-all"
                  >
                    <ShareIcon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    <span className="font-bold text-base sm:text-lg">{post.shares}</span>
                    <span className="font-semibold text-xs sm:text-sm md:text-base">Share</span>
                  </button>
                  
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-2 glass rounded-xl p-2 border border-white/10 shadow-xl min-w-[180px] sm:min-w-[220px] z-50">
                      <div className="grid grid-cols-2 gap-1 sm:gap-2">
                        <button
                          onClick={() => handleShare("twitter")}
                          className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                          title="Share on X (Twitter)"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <span className="text-xs">X</span>
                        </button>
                        <button
                          onClick={() => handleShare("facebook")}
                          className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                          title="Share on Facebook"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          <span className="text-xs">Facebook</span>
                        </button>
                        <button
                          onClick={() => handleShare("linkedin")}
                          className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                          title="Share on LinkedIn"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          <span className="text-xs">LinkedIn</span>
                        </button>
                        <button
                          onClick={() => handleShare("copy")}
                          className="flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-white/10 transition-colors text-white/90"
                          title="Copy Link"
                        >
                          <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-xs">Copy Link</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <div 
          className="prose prose-invert prose-sm sm:prose-lg max-w-none mb-12 prose-headings:text-white prose-p:text-white/90 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 prose-strong:text-white prose-ul:text-white/90 prose-ol:text-white/90"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {post.tags.map((tag, index) => (
              <Link
                key={index}
                href={`/blog?search=${tag}`}
                className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded-lg transition-all"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Comment Section */}
        {post.commentEnabled && (
          <div className="mt-12 glass rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              Comments ({comments.length})
            </h2>
            
            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-8 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="comment-name" className="block text-sm font-medium text-white/70 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="comment-name"
                    required
                    value={commentForm.name}
                    onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="comment-email" className="block text-sm font-medium text-white/70 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="comment-email"
                    required
                    value={commentForm.email}
                    onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="comment-content" className="block text-sm font-medium text-white/70 mb-2">
                  Comment *
                </label>
                <textarea
                  id="comment-content"
                  required
                  rows={4}
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all resize-none"
                  placeholder="Share your thoughts..."
                />
              </div>
              <button
                type="submit"
                disabled={submittingComment}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                {submittingComment ? "Submitting..." : "Post Comment"}
              </button>
            </form>

            {/* Comments List */}
            {loadingComments ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-white/70 text-sm">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 border-t border-white/10">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-white/20 mb-3" />
                <p className="text-white/70">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-6 border-t border-white/10 pt-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold">{comment.name}</p>
                        <span className="text-white/50 text-xs">
                          {comment.createdAt?.toDate 
                            ? formatDate(comment.createdAt.toDate().toISOString())
                            : "Recently"}
                        </span>
                      </div>
                      <p className="text-white/80 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  );
}

