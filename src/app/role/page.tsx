"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { RoleButton } from "./RoleButton";

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple checks - use ref to persist across renders
    if (hasCheckedRef.current || isCheckingRef.current) {
      return;
    }
    
    // Wait for auth to finish loading
    if (isLoading) {
      return;
    }
    
    // Check if role selection is in progress
    const roleSelectionInProgress = sessionStorage.getItem('roleSelectionInProgress');
    const selectedRole = sessionStorage.getItem('selectedRole');
    
    if (roleSelectionInProgress && selectedRole) {
      console.log('🎯 Role selection in progress, redirecting to:', `/${selectedRole}/register`);
      hasCheckedRef.current = true;
      router.push(`/${selectedRole}/register`);
      return;
    }
    
    if (!user) {
      // No user, redirect to login
      console.log('🛡️ No user, redirecting to login');
      hasCheckedRef.current = true;
      router.push('/login');
      return;
    }
    
    // Mark as checking to prevent duplicate calls
    isCheckingRef.current = true;
    
    // Check if user already has a role - if so, redirect to dashboard
    const checkUserRole = async () => {
      try {
        // Quick check localStorage first (fastest)
        const localRole = localStorage.getItem('userRole');
        if (localRole && localRole !== 'user') {
          console.log('✅ Found role in localStorage:', localRole);
          hasCheckedRef.current = true;
          isCheckingRef.current = false;
          router.push(`/${localRole}/dashboard`);
          return;
        }
        
        // Then check Firestore
        const { ensureDb, waitForFirebase, getUserDocument } = await import('@/lib/firebase-utils');
        const isReady = await waitForFirebase(2000); // Reduced timeout
        
        if (isReady) {
          const userData = await getUserDocument(user.uid);
          if (userData?.role && userData.role !== 'user') {
            // User already has a role, redirect to their dashboard
            console.log('✅ User already has role:', userData.role);
            hasCheckedRef.current = true;
            isCheckingRef.current = false;
            router.push(`/${userData.role}/dashboard`);
            return;
          }
        }
        
        // No role found, show role selection page
        setLoading(false);
        hasCheckedRef.current = true;
        isCheckingRef.current = false;
      } catch (error) {
        console.error('Error checking user role:', error);
        setLoading(false);
        hasCheckedRef.current = true;
        isCheckingRef.current = false;
      }
    };
    
    checkUserRole();
  }, [user, isLoading, router]);

  // Show loading only if auth is still loading OR we haven't finished checking yet
  // Once hasCheckedRef is true, we've either redirected or should show the page
  if (isLoading || (!hasCheckedRef.current && loading)) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        style={{
          backgroundColor: '#000000',
          background: '#000000'
        }}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4 animate-pulse">
            <span className="text-2xl">🚀</span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        style={{
          backgroundColor: '#000000',
          background: '#000000'
        }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in first</h1>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black pt-20 sm:pt-24 md:pt-28 text-white"
    >
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center px-4 py-2 mb-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full border border-cyan-500/20">
            <span className="text-sm font-medium text-cyan-400">Role Selection</span>
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
            Choose Your Role
          </h1>
          <p className="text-white/80 text-xl max-w-3xl mx-auto leading-relaxed">
            Select the role that best describes your position in the crypto ecosystem. 
            Each role has unique features and capabilities tailored to your needs.
          </p>
        </div>

        {/* Role Cards */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RoleButton
              role="vc"
              title="Venture Capital"
              description="Invest in promising crypto projects and manage your portfolio"
              icon="💼"
              features={[
                "Access to deal flow",
                "Portfolio management", 
                "Due diligence tools",
                "Investment tracking",
                "Real-time analytics"
              ]}
              color="from-blue-500 to-cyan-500"
            />
            
            <RoleButton
              role="founder"
              title="Project Founder"
              description="Launch and grow your crypto project with investor connections"
              icon="🚀"
              features={[
                "Project pitching",
                "Investor connections",
                "Funding opportunities",
                "Growth tracking",
                "Team collaboration"
              ]}
              color="from-green-500 to-emerald-500"
            />
            
            <RoleButton
              role="agency"
              title="Marketing Agency"
              description="Help projects with marketing and growth strategies"
              icon="📈"
              features={[
                "Client management",
                "Campaign tracking",
                "Performance analytics",
                "Growth tools",
                "Content creation"
              ]}
              color="from-purple-500 to-pink-500"
            />
            
            <RoleButton
              role="exchange"
              title="Exchange"
              description="List and manage token trading on your platform"
              icon="🏛️"
              features={[
                "Token listings",
                "Trading management",
                "Compliance tools",
                "Market analytics",
                "Liquidity management"
              ]}
              color="from-orange-500 to-red-500"
            />
            
            <RoleButton
              role="ido"
              title="IDO Platform"
              description="Launch and manage token sales for projects"
              icon="🎯"
              features={[
                "Launch management",
                "Token sales",
                "Investor tracking",
                "Compliance tools",
                "Revenue sharing"
              ]}
              color="from-yellow-500 to-orange-500"
            />
            
            <RoleButton
              role="influencer"
              title="Influencer"
              description="Promote projects and earn through campaigns"
              icon="🌟"
              features={[
                "Campaign management",
                "Earnings tracking",
                "Audience analytics",
                "Content tools",
                "Performance metrics"
              ]}
              color="from-pink-500 to-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
