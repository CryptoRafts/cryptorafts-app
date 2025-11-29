"use client";
import { useState } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { ensureDb, waitForFirebase, safeFirebaseOperation } from "@/lib/firebase-utils";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@heroicons/react/24/outline";

interface RoleButtonProps {
  role: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  color: string;
}

export function RoleButton({ role, title, description, icon, features, color }: RoleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshAuth } = useAuth();
  const router = useRouter();
  
  const handleRoleSelection = async () => {
    if (isLoading || !user) return;
    
    setIsLoading(true);
    console.log("🎯 Starting role selection for:", role);
    
    try {
      // Optimize: Try to get DB immediately first (faster path)
      let dbInstance = ensureDb();
      
      // If DB is not ready, wait for Firebase (with shorter timeout for faster UX)
      if (!dbInstance) {
        const isReady = await waitForFirebase(2000); // Reduced from 5000ms to 2000ms
        if (!isReady) {
          throw new Error('Firebase not initialized. Please refresh the page and try again.');
        }
        dbInstance = ensureDb();
        if (!dbInstance) {
          throw new Error('Database not ready. Please refresh the page and try again.');
        }
      }

      // Store in localStorage immediately for faster UI response
      localStorage.setItem('userRole', role);
      localStorage.setItem('userRoleSelected', 'true');

      // Update role in Firestore with retry logic (non-blocking for redirect)
      safeFirebaseOperation(
        async () => {
          const db = ensureDb();
          if (!db) {
            throw new Error('Database not ready');
          }
          return setDoc(doc(db, 'users', user.uid), {
            role: role,
            roleSelectedAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            profileCompleted: false,
            onboardingStep: 'profile'
          }, { merge: true });
        },
        'Set user role',
        3 // 3 retries
      ).then(() => {
        console.log("✅ Role updated successfully:", role);
      }).catch((error) => {
        console.error("⚠️ Role update error (non-blocking):", error);
        // Don't block redirect - localStorage is already set
      });
      
      // Set flag to prevent re-processing
      sessionStorage.setItem('roleSelectionInProgress', 'true');
      sessionStorage.setItem('selectedRole', role);
      
      // Redirect immediately after localStorage is set (don't wait for Firestore)
      const redirectUrl = `/${role}/register`;
      console.log("🎯 Redirecting to:", redirectUrl);
      
      // Use router.push for smooth navigation without full page refresh
      router.push(redirectUrl);
    } catch (error: any) {
      console.error("❌ Error setting role:", error);
      
      // User-friendly error messages
      let errorMessage = "Failed to set role. Please try again.";
      if (error.message && error.message.includes('not ready')) {
        errorMessage = "Service is initializing. Please wait a moment and try again.";
      } else if (error.message && error.message.includes('permission')) {
        errorMessage = "Permission denied. Please refresh the page and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="group relative">
      <div className="bg-black/60 backdrop-blur-lg border-2 border-cyan-400/20 rounded-3xl p-6 hover:border-cyan-400/50 transition-all duration-500 cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20">
        {/* Icon */}
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-cyan-500/50`}>
            <span className="text-3xl">{icon}</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">{title}</h3>
          <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        </div>
        
        {/* Features */}
        <div className="mb-6">
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-white/60 group-hover:text-cyan-300 transition-colors duration-300">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-3 flex-shrink-0 shadow-lg shadow-cyan-400/70"></div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Button */}
        <button
          onClick={handleRoleSelection}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 hover:shadow-xl hover:shadow-cyan-500/50 text-white font-semibold text-base rounded-xl transition-all duration-500 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Selecting...
            </div>
          ) : (
            <div className="flex items-center justify-center relative z-10">
              <span>Get Started</span>
              <span className="ml-2 group-hover:translate-x-2 transition-transform duration-500">→</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </button>
      </div>
    </div>
  );
}