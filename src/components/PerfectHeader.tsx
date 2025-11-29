'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useNotifications } from '@/providers/NotificationsProvider';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db, getDb } from '@/lib/firebase.client';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function PerfectHeader() {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  let notificationsContext;
  try {
    notificationsContext = useNotifications();
  } catch (e) {
    // NotificationsProvider not available
    notificationsContext = null;
  }
  const unreadCount = notificationsContext?.unreadCount || 0;
  const notifications = notificationsContext?.notifications || [];
  const markAllAsRead = notificationsContext?.markAllAsRead || (() => {});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Determine if user is authenticated and has a role
  const isAuthenticated = !isLoading && user !== null;
  const hasRole = isAuthenticated && claims?.role;
  
  // IMPORTANT: Always render PerfectHeader EXCEPT on admin routes
  // The header should show on:
  // - Homepage (/)
  // - All role routes (/founder/*, /vc/*, /exchange/*, /ido/*, /influencer/*, /agency/*)
  // - All public pages (/features, /contact, etc.)
  
  // Only check for admin routes if pathname exists and is a string
  const isAdminRoute = useMemo(() => {
    if (!pathname || typeof pathname !== 'string') return false;
    return (
      pathname === '/admin' || 
      pathname.startsWith('/admin/') || 
      pathname === '/admin-dashboard' ||
      pathname.startsWith('/admin-dashboard/')
    );
  }, [pathname]);
  
  // Debug: Log pathname to console
  useEffect(() => {
    console.log('🔍 PerfectHeader DEBUG:', {
      pathname,
      pathnameType: typeof pathname,
      isAdminRoute,
      shouldRender: !isAdminRoute
    });
  }, [pathname, isAdminRoute]);
  
  // Hide PerfectHeader ONLY on admin routes
  // Render for homepage, all roles, and all public pages
  
  // Hide header on admin routes only
  if (isAdminRoute === true) {
    return null;
  }

  // Load user profile data from Firestore - FIXED: No loading state, load in background
  const loadUserProfile = async () => {
    if (!user) return;
    
    // FIXED: Load in background without showing loading state
    try {
      const { ensureDb, waitForFirebase } = await import('@/lib/firebase-utils');
      const isReady = await waitForFirebase(5000);
      if (!isReady) return;
      
      const dbInstance = ensureDb();
    if (!dbInstance) return;
    
      const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        
        // Also try to load organization data for VC role
        if (claims?.role === 'vc') {
          try {
            const orgsQuery = query(collection(dbInstance, 'organizations'), where('userId', '==', user.uid));
            const orgsSnapshot = await getDocs(orgsQuery);
            if (!orgsSnapshot.empty) {
              const orgData = orgsSnapshot.docs[0].data();
              // Merge organization data (logo, name) into profile
              setUserProfile({
                ...profileData,
                logo: orgData.logo || profileData.logo,
                organizationName: orgData.organizationName || profileData.organizationName,
                companyName: orgData.companyName || profileData.companyName
              });
              console.log('✅ User profile loaded with org data:', { ...profileData, ...orgData });
              return;
            }
          } catch (orgError) {
            console.warn('⚠️ Could not load organization data:', orgError);
          }
        }
        
        setUserProfile(profileData);
        console.log('✅ User profile loaded:', profileData);
      }
    } catch (error) {
      // Silently fail - don't show errors
      console.error('❌ Error loading user profile:', error);
    }
  };

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      loadUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // Refresh profile data (can be called externally)
  const refreshProfile = () => {
    if (user) {
      loadUserProfile();
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Header auth state:', { 
      isLoading, 
      user: user?.email, 
      claims, 
      isAuthenticated, 
      hasRole,
      userProfile: userProfile ? { 
        name: userProfile.name, 
        displayName: userProfile.displayName, 
        photoURL: userProfile.photoURL,
        profile_image_url: userProfile.profile_image_url 
      } : null
    });
  }, [isLoading, user, claims, isAuthenticated, hasRole, userProfile]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, []);

  const getRoleNavigation = () => {
    if (!claims?.role) return [];

    switch (claims.role) {
      case 'founder':
        return [
          { name: 'Dashboard', href: '/founder/dashboard', icon: 'dashboard', color: 'purple' },
          { name: 'Pitch Project', href: '/founder/pitch', icon: 'rocket', color: 'pink' },
          { name: 'My Projects', href: '/founder/projects', icon: 'document', color: 'blue' },
          { name: 'Messages', href: '/founder/messages', icon: 'messages', color: 'cyan' },
          { name: 'Spotlight', href: '/spotlight/apply', icon: 'rocket', color: 'yellow' },
          { name: 'Settings', href: '/founder/settings', icon: 'settings', color: 'gray' }
        ];
      
      case 'vc':
        return [
          { name: 'Dashboard', href: '/vc/dashboard', icon: 'dashboard', color: 'blue' },
          { name: 'Dealflow', href: '/vc/dealflow', icon: 'dealflow', color: 'green' },
          { name: 'Portfolio', href: '/vc/portfolio', icon: 'portfolio', color: 'purple' },
          { name: 'Pipeline', href: '/vc/pipeline', icon: 'pipeline', color: 'orange' },
          { name: 'Messages', href: '/messages', icon: 'messages', color: 'cyan' },
          { name: 'Team', href: '/vc/team', icon: 'team', color: 'cyan' },
          { name: 'Settings', href: '/vc/settings', icon: 'settings', color: 'gray' }
        ];
      
      case 'exchange':
        return [
          { name: 'Dashboard', href: '/exchange/dashboard', icon: 'dashboard', color: 'green' },
          { name: 'Dealflow', href: '/exchange/dealflow', icon: 'dealflow', color: 'blue' },
          { name: 'Listings', href: '/exchange/listings', icon: 'listings', color: 'purple' },
          { name: 'Messages', href: '/exchange/messages', icon: 'messages', color: 'cyan' },
          { name: 'Team', href: '/exchange/team', icon: 'team', color: 'cyan' },
          { name: 'Analytics', href: '/exchange/analytics', icon: 'analytics', color: 'orange' },
          { name: 'Settings', href: '/exchange/settings', icon: 'settings', color: 'gray' }
        ];
      
      case 'ido':
        return [
          { name: 'Dashboard', href: '/ido/dashboard', icon: 'dashboard', color: 'orange' },
          { name: 'Dealflow', href: '/ido/dealflow', icon: 'dealflow', color: 'red' },
          { name: 'Launchpad', href: '/ido/launchpad', icon: 'launchpad', color: 'pink' },
          { name: 'Messages', href: '/ido/messages', icon: 'messages', color: 'cyan' },
          { name: 'Analytics', href: '/ido/analytics', icon: 'analytics', color: 'purple' },
          { name: 'Settings', href: '/ido/settings', icon: 'settings', color: 'gray' }
        ];
      
      case 'influencer':
        return [
          { name: 'Dashboard', href: '/influencer/dashboard', icon: 'dashboard', color: 'pink' },
          { name: 'Dealflow', href: '/influencer/dealflow', icon: 'dealflow', color: 'blue' },
          { name: 'Campaigns', href: '/influencer/campaigns', icon: 'campaigns', color: 'purple' },
          { name: 'Messages', href: '/influencer/messages', icon: 'messages', color: 'cyan' },
          { name: 'Analytics', href: '/influencer/analytics', icon: 'analytics', color: 'orange' },
          { name: 'Earnings', href: '/influencer/earnings', icon: 'earnings', color: 'green' },
          { name: 'Settings', href: '/influencer/settings', icon: 'settings', color: 'gray' }
        ];
      
      case 'agency':
        return [
          { name: 'Dashboard', href: '/agency/dashboard', icon: 'dashboard', color: 'indigo' },
          { name: 'Campaigns', href: '/agency/campaigns', icon: 'campaigns', color: 'purple' },
          { name: 'Clients', href: '/agency/clients', icon: 'clients', color: 'blue' },
          { name: 'Messages', href: '/agency/messages', icon: 'messages', color: 'cyan' },
          { name: 'Analytics', href: '/agency/analytics', icon: 'analytics', color: 'green' },
          { name: 'Settings', href: '/agency/settings', icon: 'settings', color: 'gray' }
        ];
      
      default:
        return [];
    }
  };

  const roleNavigation = getRoleNavigation();

  // Don't block on loading - always render full header immediately
  // The header should work even if auth is still loading

  return (
    <header 
      id="perfect-header"
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-md shadow-2xl' : 'bg-black shadow-xl'
      }`}
      style={{ 
        position: 'fixed' as const, 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100,
        display: 'block',
        visibility: 'visible' as const,
        width: '100%',
        opacity: 1,
        backgroundColor: 'rgba(0, 0, 0, 1)'
      }}
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 lg:h-28" style={{ position: 'relative', zIndex: 50 }}>
          {/* Logo Section */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <img 
                src="/cryptorafts.logo (1).svg" 
                alt="CryptoRafts Logo" 
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-32 lg:w-32 xl:h-40 xl:w-40 object-contain transition-transform duration-300 group-hover:scale-105 max-h-full"
                onError={(e) => {
                  e.currentTarget.src = '/logo.png';
                  e.currentTarget.onerror = () => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'flex';
                    }
                  };
                }}
              />
              <div className="hidden items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.5 0 2.9-.3 4.2-.8l-1.4-1.4c-.8.3-1.7.5-2.8.5-4.41 0-8-3.59-8-8s3.59-8 8-8c1.1 0 2 .2 2.8.5l1.4-1.4C14.9 2.3 13.5 2 12 2z"/>
                  </svg>
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-300 tracking-wide">
                  CRYPTORAFTS
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            <Link 
              href="/" 
              className="flex items-center space-x-1 px-3 py-2 text-gray-300 hover:text-white font-medium text-sm xl:text-base transition-all duration-200 hover:bg-gray-800/50 rounded-lg"
            >
              <NeonCyanIcon type="home" size={16} className="text-current" />
              <span>Home</span>
            </Link>
            <Link 
              href="/features" 
              className="flex items-center space-x-1 px-3 py-2 text-gray-300 hover:text-white font-medium text-sm xl:text-base transition-all duration-200 hover:bg-gray-800/50 rounded-lg"
            >
              <NeonCyanIcon type="features" size={16} className="text-current" />
              <span>Features</span>
            </Link>
            <Link 
              href="/blog" 
              className="flex items-center space-x-1 px-3 py-2 text-gray-300 hover:text-white font-medium text-sm xl:text-base transition-all duration-200 hover:bg-gray-800/50 rounded-lg"
            >
              <NeonCyanIcon type="blog" size={16} className="text-current" />
              <span>Blog</span>
            </Link>
            <Link 
              href="/contact" 
              className="flex items-center space-x-1 px-3 py-2 text-gray-300 hover:text-white font-medium text-sm xl:text-base transition-all duration-200 hover:bg-gray-800/50 rounded-lg"
            >
              <NeonCyanIcon type="phone" size={16} className="text-current" />
              <span>Contact</span>
            </Link>
            <Link 
              href="/dealflow" 
              className="flex items-center space-x-1 px-3 py-2 text-gray-300 hover:text-white font-medium text-sm xl:text-base transition-all duration-200 hover:bg-gray-800/50 rounded-lg"
            >
              <NeonCyanIcon type="dealflow" size={16} className="text-current" />
              <span>Dealflow</span>
            </Link>
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
            {hasRole ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 text-gray-300 hover:text-cyan-400 transition-colors duration-200"
                    aria-label="Notifications"
                  >
                    <NeonCyanIcon type="bell" size={20} className="text-current" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Modal */}
                  {isNotificationsOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setIsNotificationsOpen(false)}
                      />
                      
                      {/* Modal - Neon Blue Theme */}
                      <div className="fixed right-4 top-20 w-96 max-w-[calc(100vw-2rem)] bg-gray-900 border-2 border-cyan-500/50 rounded-xl shadow-2xl shadow-cyan-500/20 z-50 max-h-[600px] flex flex-col backdrop-blur-xl">
                        {/* Header */}
                        <div className="p-4 border-b border-cyan-500/30 flex-shrink-0 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                          <div className="flex items-center gap-2">
                            <NeonCyanIcon type="bell" size={20} className="text-cyan-400" />
                            <h3 className="text-white font-semibold text-lg">Notifications</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Close Button */}
                            <button
                              onClick={() => setIsNotificationsOpen(false)}
                              className="p-2 rounded-lg bg-gray-700/50 text-white hover:bg-gray-700 transition-colors border border-gray-600"
                              aria-label="Close notifications"
                            >
                              <NeonCyanIcon type="close" size={20} className="text-current" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-950">
                          {!notifications || notifications.length === 0 ? (
                            <div className="p-12 text-center">
                              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyan-500/30">
                                <NeonCyanIcon type="bell" size={40} className="text-cyan-400" />
                              </div>
                              <p className="text-gray-300 text-base font-medium mb-2">No notifications</p>
                              <p className="text-gray-500 text-sm">You're all caught up!</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-cyan-500/10">
                              {notifications.slice(0, 10).map((notification: any) => (
                                <div
                                  key={notification.id}
                                  className={`p-4 transition-all cursor-pointer ${
                                    notification.read 
                                      ? 'hover:bg-gray-800/50' 
                                      : 'hover:bg-cyan-500/10 border-l-2 border-l-cyan-500'
                                  }`}
                                  onClick={async () => {
                                    // Mark notification as read
                                    if (!notification.read && notification.id) {
                                      try {
                                        const { doc, updateDoc, db } = await import('@/lib/firebase.client');
                                        if (db) {
                                          await updateDoc(doc(db, 'notifications', notification.id), {
                                            read: true
                                          });
                                        }
                                      } catch (err) {
                                        console.error('Error marking notification as read:', err);
                                      }
                                    }
                                    
                                    // Navigate to link if available
                                    if (notification.link) {
                                      router.push(notification.link);
                                      setIsNotificationsOpen(false);
                                    }
                                  }}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                      {notification.type === 'chat' ? (
                                        <NeonCyanIcon type="chat" size={20} className="text-cyan-400" />
                                      ) : notification.type === 'project' ? (
                                        <NeonCyanIcon type="rocket" size={20} className="text-green-400" />
                                      ) : (
                                        <NeonCyanIcon type="bell" size={20} className={notification.read ? 'text-gray-500' : 'text-cyan-400'} />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm ${notification.read ? 'text-gray-400' : 'text-white font-medium'} truncate`}>
                                        {notification.title || notification.message || notification.text || 'New notification'}
                                      </p>
                                      {notification.message && notification.title && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                          {notification.message}
                                        </p>
                                      )}
                                      {notification.createdAt && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          {new Date(notification.createdAt.seconds ? notification.createdAt.seconds * 1000 : notification.createdAt).toLocaleTimeString()}
                                        </p>
                                      )}
                                    </div>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-2 animate-pulse"></div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Footer */}
                        <div className="p-4 border-t border-cyan-500/30 flex-shrink-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                          <div className="flex items-center justify-between">
                            {unreadCount > 0 && (
                              <button
                                onClick={() => {
                                  markAllAsRead();
                                }}
                                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                              >
                                Mark all read
                              </button>
                            )}
                            <Link
                              href="/notifications"
                              onClick={() => setIsNotificationsOpen(false)}
                              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors ml-auto font-medium flex items-center gap-1"
                            >
                              View all notifications
                              <span className="text-cyan-500">→</span>
                            </Link>
                      </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white transition-colors duration-200"
                    aria-label="User menu"
                  >
                    {/* Profile Picture / Logo */}
                    <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full overflow-hidden shadow-lg flex-shrink-0">
                      {userProfile?.logo || userProfile?.photoURL || userProfile?.profile_image_url ? (
                        <img 
                          src={userProfile.logo || userProfile.photoURL || userProfile.profile_image_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to gradient if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center ${userProfile?.logo || userProfile?.photoURL || userProfile?.profile_image_url ? 'hidden' : ''}`}>
                        <span className="text-white font-bold text-xs xl:text-sm">
                          {(userProfile?.name || userProfile?.displayName || userProfile?.organizationName || userProfile?.companyName || user?.displayName || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Name and Role */}
                    <div className="hidden xl:block text-left min-w-0 max-w-[120px]">
                      <p className="text-white font-medium text-sm truncate" title={userProfile?.name || userProfile?.displayName || userProfile?.display_name || user?.displayName || user?.email?.split('@')[0] || 'User'}>
                        {userProfile?.name || userProfile?.displayName || userProfile?.display_name || userProfile?.organizationName || userProfile?.companyName || user?.displayName || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-gray-400 text-xs capitalize truncate">
                        {claims?.role || 'user'}
                      </p>
                    </div>
                    
                    {/* Spacing */}
                    <div className="w-3"></div>
                    
                    {/* Hamburger Menu Icon */}
                    <div className="flex flex-col space-y-1">
                      <div className="w-4 h-0.5 bg-gray-300 rounded"></div>
                      <div className="w-4 h-0.5 bg-gray-300 rounded"></div>
                      <div className="w-4 h-0.5 bg-gray-300 rounded"></div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-black/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="py-2">
                        {roleNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors duration-200"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <NeonCyanIcon type={item.icon as any} size={16} className="text-current" />
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}
                        <div className="border-t border-gray-700 my-2"></div>
                        <Link
                          href="/logout"
                          className="flex items-center space-x-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <span className="text-sm">Logout</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white font-medium text-sm xl:text-base transition-all duration-200 hover:bg-gray-800/50 rounded-lg"
                  aria-label="Sign in to your account"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium text-sm xl:text-base rounded-lg transition-all duration-200 hover:shadow-lg"
                  aria-label="Create a new account"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button - ensure it's always visible on mobile */}
          <div className="lg:hidden flex-shrink-0 z-50">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-300 hover:text-cyan-400 transition-colors duration-200 relative z-50"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              {isMenuOpen ? (
                <NeonCyanIcon type="close" size={24} className="text-current" />
              ) : (
                <NeonCyanIcon type="menu" size={24} className="text-current" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-black/95 backdrop-blur-md border-t border-gray-800 max-h-[calc(100vh-80px)] overflow-y-auto overscroll-contain mobile-menu">
            <div className="px-4 py-4 space-y-4">
              {/* Navigation Links */}
              <nav className="space-y-2 mobile-scroll">
                <Link 
                  href="/" 
                  className="flex items-center space-x-3 p-3 text-white hover:text-cyan-400 font-medium rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <NeonCyanIcon type="home" size={20} className="text-current" />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/features" 
                  className="flex items-center space-x-3 p-3 text-white hover:text-cyan-400 font-medium rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <NeonCyanIcon type="features" size={20} className="text-current" />
                  <span>Features</span>
                </Link>
                <Link 
                  href="/blog" 
                  className="flex items-center space-x-3 p-3 text-white hover:text-cyan-400 font-medium rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <NeonCyanIcon type="blog" size={20} className="text-current" />
                  <span>Blog</span>
                </Link>
                <Link 
                  href="/contact" 
                  className="flex items-center space-x-3 p-3 text-white hover:text-cyan-400 font-medium rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <NeonCyanIcon type="phone" size={20} className="text-current" />
                  <span>Contact</span>
                </Link>
                <Link 
                  href="/dealflow" 
                  className="flex items-center space-x-3 p-3 text-white hover:text-cyan-400 font-medium rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <NeonCyanIcon type="dealflow" size={20} className="text-current" />
                  <span>Dealflow</span>
                </Link>
              </nav>
              
              {/* User Section */}
              {hasRole ? (
                <>
                  <div className="border-t border-gray-700 pt-4">
                    {/* User info */}
                    <div className="flex items-center space-x-3 p-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <NeonCyanIcon type="user" size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.displayName || user.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-gray-400 text-sm capitalize">{claims?.role || 'user'}</p>
                      </div>
                    </div>
                    
                    {/* Role Navigation */}
                    <div className="space-y-1">
                      {roleNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <NeonCyanIcon type={item.icon as any} size={20} className="text-current" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>
                    
                    {/* Notifications */}
                    <button 
                      className="flex items-center space-x-3 p-3 text-gray-300 hover:text-cyan-400 w-full font-medium rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                      aria-label="View notifications"
                    >
                      <NeonCyanIcon type="bell" size={20} className="text-current" />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Logout */}
                    <Link 
                      href="/logout"
                      className="flex items-center space-x-3 p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Sign out"
                    >
                      <span>Logout</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-700 pt-4 space-y-2">
                  <Link 
                    href="/login"
                    className="block p-3 text-gray-300 hover:text-cyan-400 font-medium rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Sign in to your account"
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/signup"
                    className="block p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-center font-medium transition-all duration-200 hover:shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Create a new account"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
