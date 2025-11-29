"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase.client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { checkOnboardingCompletion, getNextOnboardingStep } from "@/lib/access-control";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.push("/login");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!redirecting) {
          console.log("? User authenticated, checking role:", user.email);
        }
        
        try {
          // Check user's role in Firestore
          if (!db) {
            if (!redirecting) {
              console.log("? Database not available, redirecting to role selection");
            }
            setRedirecting(true);
            window.location.href = "/role";
            return;
          }
          const userDoc = await getDoc(doc(db!, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role || 'user';
            if (!redirecting) {
              console.log("?? User role from Firestore:", userRole);
            }
            
            // Check complete onboarding flow
            const accessResult = checkOnboardingCompletion(userData as any);
            
            if (!accessResult.allowed) {
              if (!redirecting) {
                console.log("?? Access denied:", accessResult.reason);
                console.log("?? Redirecting to:", accessResult.redirectTo);
              }
              setRedirecting(true);
              
              if (accessResult.redirectTo) {
                window.location.href = accessResult.redirectTo;
                return;
              }
            }
            
            // Check localStorage for recently updated role FIRST
            const localRole = localStorage.getItem('userRole');
            const roleSelected = localStorage.getItem('userRoleSelected');
            
            if (localRole && localRole !== 'user' && roleSelected === 'true') {
              if (!redirecting) {
                console.log("?? Found specific role in localStorage:", localRole, "vs Firestore:", userRole);
                console.log("?? Role was recently selected, redirecting to dashboard");
              }
              setRedirecting(true);
              window.location.href = `/${localRole}/dashboard`;
              return;
            }
            
            // If user has role "user", redirect to role selection IMMEDIATELY
            if (userRole === 'user') {
              if (!redirecting) {
                console.log("?? User has 'user' role, redirecting to role selection");
                console.log("?? Current path:", window.location.pathname);
              }
              setRedirecting(true);
              // Use immediate redirect to prevent any delays
              setTimeout(() => {
                window.location.href = "/role";
              }, 100);
              return;
            }
            
            // If user has completed onboarding, redirect to their dashboard
            if (userRole && userRole !== 'user') {
              if (!redirecting) {
                console.log("?? User has specific role:", userRole, "redirecting to dashboard");
              }
              setRedirecting(true);
              window.location.href = `/${userRole}/dashboard`;
              return;
            }
            
                // This section is now handled above with immediate redirects
          } else {
            if (!redirecting) {
              console.log("? No user document found, redirecting to role selection");
            }
            setRedirecting(true);
            window.location.href = "/role";
          }
        } catch (error) {
          if (!redirecting) {
            console.error("? Error checking user role:", error);
          }
          setRedirecting(true);
          window.location.href = "/role";
        }
      } else {
        if (!redirecting) {
          console.log("? No user, redirecting to login");
        }
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading || redirecting) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `
          linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
          url('/homapage (3).png')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            borderRadius: '16px',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 16px -4px rgba(0, 212, 255, 0.4)'
          }}>
            {redirecting ? '??' : '?'}
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {redirecting ? 'Redirecting to Role Selection...' : 'Loading Dashboard...'}
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px'
          }}>
            {redirecting ? 'Please select your role to continue' : 'Checking your role and redirecting'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
