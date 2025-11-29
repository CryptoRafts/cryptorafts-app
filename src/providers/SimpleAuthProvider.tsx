"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, getIdToken, signOut as firebaseSignOut } from "firebase/auth";
import { auth, getAuth } from "@/lib/firebase.client";
import { doc, getDoc } from "firebase/firestore";
import { ensureDb } from "@/lib/firebase-utils";
import { autoAssignUserToDepartment } from "@/lib/google-dept-assignment";
import { autoAssignUserToVCTeam } from "@/lib/vc-team-assignment";

interface Claims {
  role?: string;
  [key: string]: any;
}

interface SimpleAuthContextType {
  user: User | null;
  claims: Claims | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claims | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Small delay to ensure Firebase is initialized
    const initAuth = async () => {
      // Wait a bit for Firebase to initialize with retry logic
      let authInstance = null;
      let retries = 0;
      const maxRetries = 10;
      
      while (!authInstance && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        authInstance = getAuth();
        retries++;
        
        // Check if auth is available and valid
        if (authInstance && typeof authInstance.onAuthStateChanged === 'function') {
          break;
        }
        
        authInstance = null;
      }
      
      // Check if auth is available before subscribing
      if (!authInstance) {
        console.warn('⚠️ Firebase Auth not initialized after retries, skipping auth listener');
        setIsLoading(false);
        return;
      }

      // Ensure auth has the onAuthStateChanged method
      if (typeof authInstance.onAuthStateChanged !== 'function') {
        console.warn('⚠️ Firebase Auth instance is not valid, skipping auth listener');
        setIsLoading(false);
        return;
      }

      // FIXED: Clear loading state immediately (don't block homepage)
      // Set loading to false immediately to prevent white screen
      setIsLoading(false);
      
      // Set a timeout as backup (but don't block)
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 50); // Very short timeout as backup only

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      clearTimeout(loadingTimeout);
      setUser(user);
      
      if (user) {
        try {
          // Auto-assign Google user to department or VC team if applicable
          const providerData = user.providerData?.find(p => p.providerId === 'google.com');
          if (providerData) {
            console.log('🔍 Google user detected, checking assignments...');
            // Check VC team first, then department
            const vcAssigned = await autoAssignUserToVCTeam(user);
            if (!vcAssigned) {
              await autoAssignUserToDepartment(user);
            }
          }
          
          // Get Firebase custom claims
          const token = await getIdToken(user);
          const tokenClaims = JSON.parse(atob(token.split('.')[1]));
          
          // Get role from Firestore if not in custom claims
          let role = tokenClaims.role;
          if (!role) {
            // Wait for Firebase to be ready before accessing Firestore
            let dbInstance = null;
            let retries = 0;
            const maxRetries = 10;
            while (!dbInstance && retries < maxRetries) {
              try {
                dbInstance = ensureDb();
                if (dbInstance) break;
              } catch (error) {
                // Continue retrying
              }
              await new Promise(resolve => setTimeout(resolve, 100));
              retries++;
            }
            
            if (dbInstance) {
              try {
                const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  role = userData?.role;
                  
                  // Update localStorage with role from Firestore
                  if (role) {
                    localStorage.setItem('userRole', role);
                  }
                }
              } catch (error) {
                console.error('Error getting user document:', error);
                // Continue without role from Firestore
              }
            }
          }
          
          // Fallback to localStorage if Firestore doesn't have it
          if (!role) {
            role = localStorage.getItem('userRole');
          }
          
          setClaims({ ...tokenClaims, role });
        } catch (error) {
          console.error('Error getting user claims:', error);
          // Fallback to localStorage
          const role = localStorage.getItem('userRole');
          setClaims(role ? { role } : null);
        }
      } else {
        setClaims(null);
        // Clear localStorage when user logs out
        localStorage.removeItem('userRole');
        localStorage.removeItem('userRoleSelected');
      }
      
        setIsLoading(false);
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | null = null;
    
    initAuth().then(unsub => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const refreshAuth = async () => {
    if (user) {
      try {
        // Get Firebase custom claims
        const token = await getIdToken(user);
        const tokenClaims = JSON.parse(atob(token.split('.')[1]));
        
        // Get role from Firestore if not in custom claims
        let role = tokenClaims.role;
        if (!role) {
          // Ensure DB is ready before accessing Firestore
          const { ensureDb } = await import('@/lib/firebase-utils');
          let dbInstance = null;
          let retries = 0;
          const maxRetries = 10;
          while (!dbInstance && retries < maxRetries) {
            try {
              dbInstance = ensureDb();
              if (dbInstance) break;
            } catch (error) {
              // Continue retrying
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }
          
          if (dbInstance) {
            const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
            if (userDoc.exists()) {
              role = userDoc.data()?.role;
            }
          }
        }
        
        // Fallback to localStorage if Firestore doesn't have it
        if (!role) {
          role = localStorage.getItem('userRole');
        }
        
        setClaims({ ...tokenClaims, role });
      } catch (error) {
        console.error('Error refreshing auth:', error);
        // Fallback to localStorage
        const role = localStorage.getItem('userRole');
        setClaims(role ? { role } : null);
      }
    }
  };

  const signOut = async () => {
    try {
      // Ensure auth is initialized before signing out
      const { ensureAuth } = await import('@/lib/firebase-utils');
      let authInstance = null;
      let retries = 0;
      const maxRetries = 10;
      
      while (!authInstance && retries < maxRetries) {
        try {
          authInstance = ensureAuth();
          if (authInstance) break;
        } catch (error) {
          // Continue retrying
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      // Sign out from Firebase if auth is available
      if (authInstance) {
        await firebaseSignOut(authInstance);
      }
      
      // Clear local state
      setUser(null);
      setClaims(null);
      
      // Clear localStorage
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoleSelected');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userClaims');
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if Firebase signOut fails
      setUser(null);
      setClaims(null);
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoleSelected');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userClaims');
      sessionStorage.clear();
    }
  };

  const value = {
    user,
    claims,
    isLoading,
    isAuthenticated: !!user,
    refreshAuth,
    signOut,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SimpleAuthProvider");
  }
  return context;
}