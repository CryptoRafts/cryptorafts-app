'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// OPTIMIZED: Lazy load heavy components with minimal loading states
const SpotlightDisplay = dynamic(() => import('@/components/SpotlightDisplay'), { 
  ssr: false,
  loading: () => null // No loading state - render immediately
});
const RealtimeStats = dynamic(() => import('@/components/RealtimeStats'), { 
  ssr: false,
  loading: () => null // No loading state - render immediately
});
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function HomePage() {
  // Removed useAuth - homepage should work without authentication
  const router = useRouter();
  
  const [isVisible, setIsVisible] = useState({
    hero: true,
    features: false,
    networkStats: false,
    cta: false
  });

  const [scrollProgress, setScrollProgress] = useState(0);
  // Initialize isMounted to true on client, false on server (prevents blocking)
  const [isMounted, setIsMounted] = useState(typeof window !== 'undefined');
  // CRITICAL: videoLoaded must start as false to match server-side rendering
  // This prevents hydration mismatch between server and client
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const networkStatsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // FIX 2: Universal Client-Side Render - isMounted check
  // CRITICAL: This hook must be called before any early returns to maintain hook order
  // Set isMounted immediately on client-side to bypass SSR failures
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true);
    }
  }, []);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email subscription
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Call email subscription API
      const response = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setEmail('');
      // Show success message
      if (data.alreadySubscribed) {
        alert('You are already subscribed!');
      } else {
        alert('Thank you for subscribing!');
      }
    } catch (error: any) {
      setEmailError(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll progress tracking - don't block on isClient
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for animations - don't block on isClient
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = entry.target.getAttribute('data-section');
        if (section) {
          setIsVisible(prev => ({ ...prev, [section]: entry.isIntersecting }));
        }
      });
    }, observerOptions);

    // Observe all sections - use setTimeout to ensure refs are ready
    setTimeout(() => {
      const sections = [
        { ref: heroRef, key: 'hero' },
        { ref: featuresRef, key: 'features' },
        { ref: networkStatsRef, key: 'networkStats' },
        { ref: ctaRef, key: 'cta' }
      ];

      sections.forEach(({ ref, key }) => {
        if (ref.current) {
          ref.current.setAttribute('data-section', key);
          observer.observe(ref.current);
        }
      });
    }, 100);

    return () => observer.disconnect();
  }, []);

  // FIXED: Initialize Firebase IMMEDIATELY on page load (no blocking)
  useEffect(() => {
    // FIXED: Trigger Firebase initialization IMMEDIATELY (no delay, no blocking)
    if (typeof window !== 'undefined') {
      // Import and initialize Firebase immediately in background
      Promise.all([
        import('@/lib/firebase.client'),
        import('@/lib/firebase-utils')
      ]).then(([firebaseClient, firebaseUtils]) => {
        // Force initialization immediately
        try {
          firebaseClient.getDb();
          firebaseClient.getAuth();
          firebaseClient.getStorage();
        } catch {
          // Will retry
        }
        
        // Also wait for Firebase to be ready (non-blocking)
        firebaseUtils.waitForFirebase(15000).then((isReady) => {
          if (isReady) {
            console.log('✅ Firebase initialized on homepage');
          } else {
            console.warn('⚠️ Firebase initialization timeout on homepage');
          }
        });
      }).catch(() => {
        // Silently fail - Firebase will initialize when needed
      });
    }
  }, []);

  // PHASE 3: Render full UI with proper structure and visibility
  return (
    <ErrorBoundary>
      <div 
        className="relative overflow-x-hidden overflow-y-scroll min-h-screen bg-black flex flex-col"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        suppressHydrationWarning
        key="homepage-content"
      >

      {/* PAGE 1 - HERO SECTION */}
      <section
        ref={heroRef}
        className="w-full flex items-center justify-center relative overflow-hidden h-screen pt-0"
        style={{ minHeight: '100vh', paddingTop: '0' }}
        aria-label="Hero section - Welcome to CryptoRafts"
        suppressHydrationWarning
      >
        {/* Video Background with Smart Optimization - NO GAP - BEHIND TEXT */}
        <div className="absolute inset-0 w-full h-full overflow-hidden hero-video-container" style={{ zIndex: 0 }}>
          {/* Primary: Video Background (optimized for fast loading) */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover hero-video-bg"
            style={{ zIndex: 0 }}
            preload="metadata"
            poster="/homapage (3).png"
            onLoadStart={() => {
              console.log('Sequence 01 video loading started');
              setVideoLoaded(false);
            }}
            onCanPlay={() => {
              console.log('Sequence 01 video can play');
              setVideoLoaded(true);
            }}
            onLoadedData={() => {
              console.log('Sequence 01 video data loaded');
              setVideoLoaded(true);
            }}
            onLoadedMetadata={() => {
              console.log('Sequence 01 video metadata loaded');
              setVideoLoaded(true);
            }}
            onPlay={() => {
              console.log('Sequence 01 video started playing');
              setVideoLoaded(true);
            }}
            onPlaying={() => {
              setVideoLoaded(true);
            }}
            onError={(e) => {
              // Handle video errors gracefully - hide video and show image
              const videoElement = videoRef.current || (e.target as HTMLVideoElement);
              if (videoElement) {
                console.log('Video failed to load, using background image');
                videoElement.style.display = 'none';
                setVideoLoaded(false);
              }
            }}
            suppressHydrationWarning
          >
            <source src="/Sequence 01.mp4" type="video/mp4" />
          </video>
          
          {/* Fallback Background Image - Always visible, video overlays it */}
          {/* CRITICAL: Use suppressHydrationWarning to prevent hydration mismatch */}
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat absolute inset-0 hero-fallback-bg opacity-100"
            style={{
              backgroundImage: 'url("/homapage (3).png")',
              filter: 'brightness(0.5) contrast(1.1) saturate(1.2)',
              zIndex: 0,
              opacity: videoLoaded ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out'
            }}
            id="fallback-bg"
            suppressHydrationWarning
          ></div>
          
          {/* Black overlay with 40% opacity on background video */}
          <div className="absolute inset-0 bg-black/40" style={{ zIndex: 1 }}></div>
        </div>

        {/* PHASE 3: Hero Content - IN FRONT OF VIDEO with enforced visibility */}
        <div 
          className="max-w-7xl mx-auto w-full h-full flex items-center justify-center hero-content"
          style={{ 
            zIndex: 1000, 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            visibility: 'visible',
            opacity: 1,
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '120px',
            marginTop: '0',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          <div 
            className="text-center px-4 sm:px-6 lg:px-8 w-full hero-inner-content"
            style={{
              zIndex: 1001,
              position: 'relative',
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              width: '100%'
            }}
          >
            <div 
              className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 w-full flex flex-col items-center justify-center hero-text-wrapper"
              style={{
                zIndex: 1002,
                position: 'relative',
                display: 'flex',
                visibility: 'visible',
                opacity: 1,
                width: '100%'
              }}
            >
              {/* Welcome Text - PHASE 3: Enforced visibility */}
              <div 
                className="welcome-text-container"
                style={{
                  zIndex: 1002,
                  position: 'relative',
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1,
                  width: '100%',
                  textAlign: 'center',
                  pointerEvents: 'auto'
                }}
              >
                <h2 
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold drop-shadow-2xl text-cyan-400 hero-text-cyan welcome-text-h2" 
                  style={{ 
                    zIndex: 1002, 
                    position: 'relative', 
                    display: 'block', 
                    visibility: 'visible', 
                    opacity: 1, 
                    color: '#22d3ee', 
                    width: '100%', 
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    margin: 0,
                    padding: 0,
                    lineHeight: '1.2'
                  }}
                >
                  WELCOME TO CRYPTORAFTS
                </h2>
              </div>

              {/* Main Headline - PHASE 3: Enforced visibility */}
              <div 
                style={{
                  zIndex: 500,
                  position: 'relative',
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1
                }}
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight drop-shadow-2xl text-white hero-text-white" style={{ zIndex: 500, position: 'relative', display: 'block', visibility: 'visible', opacity: 1, color: 'white' }}>
                  The AI-Powered Web3 Ecosystem
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl mt-3 sm:mt-4 md:mt-5 font-medium drop-shadow-xl text-white hero-text-white-sm" style={{ zIndex: 500, position: 'relative', display: 'block', visibility: 'visible', opacity: 1, color: 'white' }}>
                  Connecting Founders, VCs, Exchanges, IDOs, Influencers, and Innovators
                </p>
              </div>

              {/* Tagline - PHASE 3: Enforced visibility */}
              <div 
                style={{
                  zIndex: 500,
                  position: 'relative',
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1
                }}
              >
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black drop-shadow-2xl text-blue-400 hero-text-gradient" style={{ zIndex: 500, position: 'relative', display: 'block', visibility: 'visible', opacity: 1 }}>
                  BUILD. VERIFY. PITCH. INVEST.
                </h3>
              </div>

              {/* CTA Button - PHASE 3: Enforced visibility */}
              <div 
                className="pt-6 sm:pt-8 md:pt-10 w-full"
                style={{
                  zIndex: 500,
                  position: 'relative',
                  display: 'flex',
                  visibility: 'visible',
                  opacity: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                <Link href="/signup" style={{ zIndex: 500, position: 'relative', display: 'inline-flex' }}>
                  <button 
                    className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 hover:from-blue-300 hover:via-blue-400 hover:to-blue-600 text-white font-bold py-2 sm:py-2.5 md:py-3 px-6 sm:px-8 md:px-10 rounded-lg text-xs sm:text-sm md:text-base inline-flex items-center justify-center shadow-md hover:shadow-lg border-0 relative overflow-hidden group focus:outline-none focus:ring-4 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300"
                    onClick={() => console.log('GET STARTED clicked')}
                    aria-label="Get started with CryptoRafts - Sign up now"
                    style={{
                      zIndex: 500,
                      position: 'relative',
                      display: 'inline-flex',
                      visibility: 'visible',
                      opacity: 1
                    }}
                  >
                    <span className="relative z-10 whitespace-nowrap font-bold uppercase" style={{ zIndex: 500, position: 'relative', display: 'block', visibility: 'visible', opacity: 1 }}>GET STARTED</span>
                  </button>
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* PAGE 2 - PREMIUM SPOTLIGHT SECTION */}
      <section
        ref={featuresRef}
        className="w-full min-h-screen flex items-center justify-center relative px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat section-bg-1"
        aria-label="Premium spotlight section - Featured projects"
      >
        {/* Soft opacity wall - only on background, behind all content */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <div className="w-full max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Dynamic Spotlight Display */}
          <SpotlightDisplay 
            maxSpotlights={3}
            showControls={true}
            className="w-full"
          />
        </div>
      </section>

      {/* PAGE 3 - NETWORK STATISTICS */}
      <section
        ref={networkStatsRef}
        className="w-full min-h-screen flex items-center justify-center relative px-4 bg-cover bg-center bg-no-repeat section-bg-1"
        aria-label="Network statistics section"
      >
        {/* Soft opacity wall - only on background, behind all content */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full px-4 sm:px-6 lg:px-8">
          {/* Network Statistics Section */}
          <div className="mb-8 sm:mb-12 py-8 sm:py-12">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 px-2">
                Network Statistics
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white px-2">
                Live blockchain ecosystem metrics
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="w-full overflow-hidden">
              <RealtimeStats />
            </div>
          </div>
        </div>
      </section>
      {/* PAGE 5 - CONNECT WITH US */}
      <section
        ref={ctaRef}
        className="w-full min-h-screen flex flex-col items-center justify-start relative px-4 pb-8 bg-cover bg-center bg-no-repeat section-bg-2"
        aria-label="Connect with us section"
      >
        {/* Soft opacity wall - only on background, behind all content */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        
        <div className="max-w-7xl mx-auto relative z-20 w-full">
          <div className="text-center">
            <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-8 md:p-12 border-2 border-cyan-400/20 shadow-cyan-500/10">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Connect With Us
              </h3>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join the global crypto ecosystem. Stay updated with the latest news and connect with our community.
              </p>
              
              {/* Email Subscription */}
              <div className="mb-8">
                <div className="bg-black/30 rounded-xl p-6 border border-white/20">
                  <h4 className="text-xl font-bold text-white mb-2">Stay Updated</h4>
                  <p className="text-white/70 mb-4">Get the latest crypto market insights and platform updates delivered to your inbox.</p>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address" 
                        className={`w-full bg-black/40 border-2 rounded-lg px-4 py-3 text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                          emailError ? 'border-red-500' : 'border-cyan-400/20 focus:border-cyan-400/50'
                        }`}
                        aria-label="Email address"
                        aria-describedby={emailError ? "email-error" : undefined}
                        required
                      />
                      {emailError && (
                        <p id="email-error" className="text-red-400 text-sm mt-1" role="alert">
                          {emailError}
                        </p>
                      )}
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-black/40 disabled:to-black/40 text-white font-semibold py-3 px-6 rounded-lg disabled:cursor-not-allowed border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                      aria-label="Subscribe to newsletter"
                    >
                      {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                    </button>
                  </form>
                </div>
              </div>
              
              {/* Social Media Links */}
              <div className="flex flex-wrap justify-center gap-4" role="list" aria-label="Social media links">
                <a 
                  href="https://x.com/cryptorafts_?s=21" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white font-medium py-3 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Follow us on Twitter (opens in new tab)"
                  role="listitem"
                >
                  Twitter
                </a>
                <a 
                  href="https://www.linkedin.com/company/cryptorafts/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white font-medium py-3 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Follow us on LinkedIn (opens in new tab)"
                  role="listitem"
                >
                  LinkedIn
                </a>
                <a 
                  href="https://t.me/cryptorafts" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white font-medium py-3 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Join our Telegram channel (opens in new tab)"
                  role="listitem"
                >
                  Telegram
                </a>
                <a 
                  href="https://t.me/cryptoraftsannouncement" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white font-medium py-3 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Join our Telegram announcements channel (opens in new tab)"
                  role="listitem"
                >
                  Telegram Announcements
                </a>
                <a 
                  href="https://www.facebook.com/share/19uiqUt63A/?mibextid=wwXIfr" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white font-medium py-3 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Follow us on Facebook (opens in new tab)"
                  role="listitem"
                >
                  Facebook
                </a>
                <a 
                  href="https://www.instagram.com/cryptorafts?igsh=MXN4NmFqYzZtZ3ljNw==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white font-medium py-3 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Follow us on Instagram (opens in new tab)"
                  role="listitem"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Section with Black Background */}
        <div className="bg-black py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-black/60 backdrop-blur-lg rounded-lg p-8 border-2 border-cyan-400/20 shadow-cyan-500/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Cryptorafts Column */}
              <div className="text-center md:text-left">
                {/* Cryptorafts Logo */}
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <img 
                    src="/cryptorafts.logo (1).svg" 
                    alt="Cryptorafts Logo" 
                    className="w-16 h-16"
                  />
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  <span className="font-bold text-white">CRYPTORAFTS</span><br/>
                  The enterprise-grade, AI-verified Web3 ecosystem that brings founders, venture capital, exchanges, IDOs, influencers and marketing agencies and partners together securely and at scale.
                </p>
                {/* Social Media Icons */}
                <div className="flex justify-center md:justify-start space-x-4">
                  <a href="https://twitter.com/cryptorafts" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="https://linkedin.com/company/cryptorafts" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              {/* Quick Links Column */}
              <div className="text-center md:text-left">
                <h4 className="text-xl font-bold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><a href="/about" className="text-white/70 hover:text-white transition-colors text-sm">About Us</a></li>
                  <li><a href="/features" className="text-white/70 hover:text-white transition-colors text-sm">Features</a></li>
                  <li><a href="/contact" className="text-white/70 hover:text-white transition-colors text-sm">Contact</a></li>
                </ul>
              </div>
              
              {/* Support Column */}
              <div className="text-center md:text-left">
                <h4 className="text-xl font-bold text-white mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><a href="/help" className="text-white/70 hover:text-white transition-colors text-sm">Help Center</a></li>
                  <li><a href="/documentation" className="text-white/70 hover:text-white transition-colors text-sm">Documentation</a></li>
                </ul>
              </div>
        </div>
            
            {/* Bottom Section */}
            <div className="pt-6 border-t border-cyan-400/20">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <p className="text-white text-sm">© Cryptorafts. All rights reserved.</p>
                <div className="flex flex-wrap justify-center md:justify-end space-x-6 gap-2">
                  <a href="/privacy" className="text-white/70 hover:text-white transition-colors text-sm">Privacy Policy</a>
                  <a href="/terms" className="text-white/70 hover:text-white transition-colors text-sm">Terms of Service</a>
                  <a href="/cookies" className="text-white/70 hover:text-white transition-colors text-sm">Cookie Policy</a>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </ErrorBoundary>
  );
}
