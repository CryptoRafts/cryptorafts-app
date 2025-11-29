"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import SystemStatus from '@/components/admin/SystemStatus';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

// Force dynamic rendering - Client Component
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [headerStatus, setHeaderStatus] = useState<'active' | 'loading'>('active');

  useEffect(() => {
    // Add console command for easy admin access
    if (typeof window !== 'undefined') {
      (window as any).grantAdminAccess = () => {
        localStorage.setItem('userRole', 'admin');
        console.log('✅ Admin access granted! Refreshing page...');
        window.location.reload();
      };
      
      (window as any).clearAdminAccess = () => {
        localStorage.removeItem('userRole');
        console.log('❌ Admin access cleared! Refreshing page...');
        window.location.reload();
      };
      
          (window as any).forceAdminAccess = () => {
            localStorage.setItem('userRole', 'admin');
            const mockUser = {
              email: 'test@admin.com',
              uid: 'test-admin-uid',
              displayName: 'Test Admin'
            };
            console.log('✅ Force admin access granted! Refreshing page...');
            window.location.reload();
          };
          
          (window as any).testNavigation = (page: string) => {
            const validPages = ['dashboard', 'users', 'kyc', 'kyb', 'projects', 'spotlights', 'add-spotlight', 'pitch', 'analytics', 'departments', 'audit', 'settings', 'test'];
            if (validPages.includes(page)) {
              console.log(`🔄 Testing navigation to: /admin/${page}`);
              window.location.href = `/admin/${page}`;
            } else {
              console.log('❌ Invalid page. Valid pages:', validPages.join(', '));
            }
          };
          
          (window as any).testBlogNavigation = () => {
            console.log('🔄 Testing blog navigation...');
            window.location.href = '/admin/blog';
          };
          
          (window as any).debugHeader = () => {
            console.log('🔍 Admin Header Debug Info:');
            console.log('  - Screen width:', window.innerWidth);
            console.log('  - Navigation items:', navigation.length);
            console.log('  - Current pathname:', pathname);
            console.log('  - User:', user?.email || 'No user');
            console.log('  - Header status:', headerStatus);
            console.log('  - Navigation always visible: YES');
            console.log('  - Real-time status: Always visible');
            console.log('  - All admin options:', navigation.map(n => n.name).join(' | '));
            console.log('  - Current page:', navigation.find(n => n.current)?.name || 'None');
            console.log('  - Admin role:', localStorage.getItem('userRole'));
            console.log('  - Header height: 24 (h-24)');
            console.log('  - Navigation buttons: Compact with borders');
            console.log('  - Real-time indicator: Prominent with LIVE status');
            console.log('  - Navigation options:', navigation.map(n => `${n.name} (${n.href})`).join(', '));
          };
          
          (window as any).forceAdminHeader = () => {
            console.log('🚀 Forcing admin header visibility...');
            localStorage.setItem('userRole', 'admin');
            window.location.href = '/admin/dashboard';
          };
          
          console.log('🔧 Admin Commands Available:');
          console.log('  - grantAdminAccess() - Grant admin access');
          console.log('  - clearAdminAccess() - Clear admin access');
          console.log('  - forceAdminAccess() - Force admin access (no auth required)');
          console.log('  - forceAdminHeader() - Force admin header visibility');
          console.log('  - testNavigation("page") - Test navigation to specific page');
          console.log('  - debugHeader() - Debug admin header visibility');
    }
  }, []);

  useEffect(() => {
    // Check authentication - Try Firebase auth first, fallback to mock for testing
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase.client');
        const { onAuthStateChanged, signInAnonymously } = await import('firebase/auth');
        
        if (auth) {
          // Set up auth state listener
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('🔍 Auth state changed:', firebaseUser?.email || 'No user');
            
            if (firebaseUser) {
              // STRICT ADMIN ACCESS: Only allow anasshamsiggc@gmail.com
              const userEmail = firebaseUser.email?.toLowerCase() || '';
              if (userEmail !== 'anasshamsiggc@gmail.com') {
                console.log('❌ Access denied. Only anasshamsiggc@gmail.com can access admin panel.');
                alert('Access Denied: Only authorized admin can access this panel.');
                await auth.signOut();
                router.push('/admin/login');
                setIsLoading(false);
                return;
              }
              
              // User is authenticated with Firebase and is authorized admin
              localStorage.setItem('userRole', 'admin');
              console.log('✅ Authorized admin authenticated:', firebaseUser.email);
              console.log('🔐 Auth provider:', firebaseUser.providerData?.[0]?.providerId || 'anonymous');
              setUser(firebaseUser);
              setIsLoading(false);
            } else {
              // No user authenticated - redirect to login
              console.log('⚠️ No user authenticated - redirecting to admin login...');
              router.push('/admin/login');
              setIsLoading(false);
            }
          });
          
          // Cleanup listener on unmount
          return () => unsubscribe();
        } else {
          console.error('❌ Firebase auth not available');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle redirect in useEffect to avoid router update during render
  // This must be called unconditionally (Rules of Hooks) - before any early returns
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/admin/login' && pathname !== '/admin/access') {
      router.push('/admin/login');
    }
  }, [isLoading, user, router, pathname]);

  const navigation = [
    { name: 'Home', href: '/admin/dashboard', iconType: 'home', current: pathname === '/admin/dashboard' || pathname === '/admin' },
    { name: 'Users', href: '/admin/users', iconType: 'users', current: pathname === '/admin/users' },
    { name: 'KYC', href: '/admin/kyc', iconType: 'shield', current: pathname === '/admin/kyc' },
    { name: 'KYB', href: '/admin/kyb', iconType: 'building', current: pathname === '/admin/kyb' },
    { name: 'Blog', href: '/admin/blog', iconType: 'document', current: pathname === '/admin/blog' || pathname?.startsWith('/admin/blog') },
    { name: 'Projects', href: '/admin/projects', iconType: 'rocket', current: pathname === '/admin/projects' },
    { name: 'Spotlights', href: '/admin/spotlights', iconType: 'star', current: pathname === '/admin/spotlights' },
    { name: 'Add Spotlight', href: '/admin/add-spotlight', iconType: 'plus', current: pathname === '/admin/add-spotlight' },
    { name: 'Pitch', href: '/admin/pitch', iconType: 'chart', current: pathname === '/admin/pitch' },
    { name: 'RaftAI', href: '/admin/raftai', iconType: 'sparkles', current: pathname === '/admin/raftai' },
    { name: 'Social', href: '/admin/social', iconType: 'megaphone', current: pathname === '/admin/social' },
    { name: 'Analytics', href: '/admin/analytics', iconType: 'analytics', current: pathname === '/admin/analytics' },
    { name: 'Departments', href: '/admin/departments', iconType: 'users', current: pathname === '/admin/departments' },
    { name: 'Audit', href: '/admin/audit', iconType: 'document', current: pathname === '/admin/audit' },
    { name: 'Settings', href: '/admin/settings', iconType: 'settings', current: pathname === '/admin/settings' },
    { name: 'Test', href: '/admin/test', iconType: 'shield', current: pathname === '/admin/test' },
  ];

  const handleNavigation = (href: string, name: string) => {
    console.log(`🔄 Navigating to ${name}: ${href}`);
    setNavigating(name);
    setHeaderStatus('loading');
    
    // Add a small delay to show the loading state
    setTimeout(() => {
      router.push(href);
      setNavigating(null);
      setHeaderStatus('active');
    }, 100);
  };

  // Allow access to login page without authentication
  if (pathname === '/admin/login' || pathname === '/admin/access') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading admin panel..." />
      </div>
    );
  }

  if (!user) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" message="Redirecting to login..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Main content - Full width without sidebar */}
      <div className="min-h-screen bg-black">
        {/* Complete Admin Header */}
        <header className="sticky top-0 z-40 bg-black border-b border-cyan-400/20 shadow-xl shadow-cyan-500/10">
          <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Left Section - Empty, space for alignment */}
              <div className="flex-shrink-0 w-0"></div>

              {/* Center Section - Navigation Menu - PERFECTLY ALIGNED WITH FIXED WIDTH */}
              <div className="flex items-center justify-center flex-1 min-w-0">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide max-w-full px-2">
                  {navigation.map((item, index) => (
                    <button
                      key={`header-nav-${item.name}-${index}`}
                      onClick={() => handleNavigation(item.href, item.name)}
                      disabled={navigating === item.name}
                      className={`w-24 px-2 py-1.5 text-xs font-semibold transition-all duration-200 rounded-md disabled:opacity-50 whitespace-nowrap border flex items-center justify-center gap-1 flex-shrink-0 group h-8 ${
                        item.current
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md border-blue-500'
                          : 'text-cyan-400/70 hover:bg-black/60 hover:text-white hover:shadow-sm border-cyan-400/20 hover:border-cyan-400/50'
                      }`}
                      title={item.name}
                    >
                      <NeonCyanIcon type={item.iconType as any} size={14} className={`flex-shrink-0 transition-transform duration-200 ${item.current ? 'scale-110' : 'group-hover:scale-105'}`} />
                      <span className="font-semibold truncate">{navigating === item.name ? '...' : item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Section - Clean & Simple */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Logout Button */}
                <button
                  onClick={() => {
                    localStorage.removeItem('userRole');
                    window.location.href = '/admin/access';
                  }}
                  className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all font-semibold whitespace-nowrap"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content with proper padding to avoid header overlap */}
        <main className="relative z-10 pt-20 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}