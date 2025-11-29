"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db, doc, getDoc, setDoc, onSnapshot } from "@/lib/firebase.client";
import { UserDocumentManager } from "@/lib/userDocumentManager";
import { trackUser, updateUserActivity, markUserOffline } from "@/lib/user-tracking";
import { AdminCache, AdminSession } from "@/lib/cache/adminCache";

interface AuthContextType {
  user: User | null;
  claims: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const userDocUnsubscribeRef = useRef<(() => void) | null>(null);

  // Simplified auth state management to prevent React 482
  const [authState, setAuthState] = useState<{
    user: User | null;
    claims: any;
    isLoading: boolean;
  }>({
    user: null,
    claims: null,
    isLoading: true
  });

  // Function to load user role from Firestore
  const loadUserRole = async (firebaseUser: User) => {
    try {
      console.log('📖 Loading user role from Firestore for:', firebaseUser.email);
      
      // Check if we have cached role first
      const cachedRole = localStorage.getItem('userRole');
      if (cachedRole) {
        console.log('⚡ Using cached role:', cachedRole);
        return cachedRole;
      }
      
      // Ensure user document exists with proper structure
      await UserDocumentManager.ensureUserDocument(firebaseUser);
      
      const userDoc = await getDoc(doc(db!, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role) {
          console.log('✅ Role found in Firestore:', userData.role);
          return userData.role;
        }
      }
      
      // If no role found, create/update user document with default role
      console.log('🔧 Creating/updating user document with default role');
      await setDoc(doc(db!, 'users', firebaseUser.uid), {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        role: 'user', // Default role
        createdAt: new Date(),
        emailVerified: firebaseUser.emailVerified || false,
        lastLogin: new Date(),
        profileCompleted: false,
        onboardingStep: 'role_selection',
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('✅ User document created/updated with default role');
      return 'user';
    } catch (error) {
      console.error('❌ Error loading user role:', error);
      // If network error, try to use cached role
      const cachedRole = localStorage.getItem('userRole');
      if (cachedRole) {
        console.log('🔄 Using cached role due to network error:', cachedRole);
        return cachedRole;
      }
      return 'user'; // Default fallback
    }
  };

  // Refresh auth state
  const refreshAuth = async () => {
    if (!user) return;
    
    try {
      const tokenResult = await user.getIdTokenResult(true);
      let userClaims = tokenResult.claims;
      
      // Always check Firestore for the latest role
      const role = await loadUserRole(user);
      if (role) {
        userClaims = { ...userClaims, role };
        localStorage.setItem('userRole', role);
        localStorage.setItem('userClaims', JSON.stringify(userClaims));
        AdminCache.set(`user_claims_${user.uid}`, userClaims, 5 * 60 * 1000);
      }
      
      setClaims(userClaims);
      console.log('✅ Auth refreshed - Role:', userClaims.role || 'none');
    } catch (error) {
      console.error('❌ Error refreshing auth:', error);
    }
  };

  // Expose refreshAuth globally for role selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshAuth = refreshAuth;
    }
  }, [refreshAuth]);

  useEffect(() => {
    // Prevent duplicate listeners
    if (isInitialized.current || unsubscribeRef.current) {
      return;
    }

    // Check if auth is available (client-side only)
    if (!auth) {
      console.error('❌ Firebase Auth is not initialized');
      console.error('📋 Please check:');
      console.error('   1. .env.local file exists in the root directory');
      console.error('   2. Firebase credentials are correct');
      console.error('   3. Restart dev server after creating .env.local');
      setUser(null);
      setClaims(null);
      setIsLoading(false);
      return;
    }

    isInitialized.current = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('✅ Firebase user authenticated:', firebaseUser.email);
        
        try {
          // Check cache first for faster load, but always verify role from Firestore
          const cachedClaims = AdminCache.get<any>(`user_claims_${firebaseUser.uid}`);
          if (cachedClaims) {
            console.log('⚡ Using cached claims for faster load');
            
            // Always check Firestore for the latest role, even with cached claims
            const role = await loadUserRole(firebaseUser);
            if (role && role !== cachedClaims.role) {
              console.log('🔄 Role updated from Firestore:', role);
              const newClaims = { ...cachedClaims, role };
              setUser(firebaseUser);
              setClaims(newClaims);
              setIsLoading(false);
              localStorage.setItem('userRole', role);
              localStorage.setItem('userClaims', JSON.stringify(newClaims));
              AdminCache.set(`user_claims_${firebaseUser.uid}`, newClaims, 5 * 60 * 1000);
              console.log('💾 Updated role set in localStorage:', role);
            } else if (role === 'user') {
              // If Firestore role is 'user', set user role but don't clear everything
              console.log('🔄 User has "user" role, setting default role');
              
              setUser(firebaseUser);
              setClaims({ role: 'user' });
              setIsLoading(false);
              localStorage.setItem('userRole', 'user');
            } else {
              setUser(firebaseUser);
              setClaims(cachedClaims);
              setIsLoading(false);
              
              // Ensure role is properly set in localStorage for notification system
              if (cachedClaims.role) {
                localStorage.setItem('userRole', cachedClaims.role);
                console.log('💾 Cached role set in localStorage:', cachedClaims.role);
              }
            }
            
            return; // Skip the rest of the auth flow for cached users
          }

          // Get custom claims (force refresh only if cache is expired)
          let tokenResult;
          let userClaims = {};
          try {
            tokenResult = await firebaseUser.getIdTokenResult(!cachedClaims);
            userClaims = tokenResult.claims;
          } catch (error) {
            console.warn('⚠️ Token refresh failed, using cached claims:', error);
            // Use cached claims if token refresh fails (offline mode)
            if (cachedClaims) {
              userClaims = cachedClaims;
            }
          }
          
          // Always check Firestore for role (real-time)
          let role = null;
          try {
            role = await loadUserRole(firebaseUser);
          } catch (error) {
            console.warn('⚠️ Failed to load user role, using cached:', error);
            role = localStorage.getItem('userRole');
          }
          
          if (role) {
            userClaims = { ...userClaims, role };
            localStorage.setItem('userRole', role);
            localStorage.setItem('userClaims', JSON.stringify(userClaims));
            
            // Cache claims for super-fast subsequent loads
            AdminCache.set(`user_claims_${firebaseUser.uid}`, userClaims, 5 * 60 * 1000); // 5 min cache
            
            // Save admin session if admin
            if (role === 'admin') {
              AdminSession.save(firebaseUser.uid, firebaseUser.email || '', role);
            }
          } else {
            // Clear localStorage if no role found
            localStorage.removeItem('userRole');
            localStorage.removeItem('userClaims');
          }
          
          setUser(firebaseUser);
          setClaims(userClaims);
          setIsLoading(false);
          
          // Track user with comprehensive data
          try {
            await trackUser(firebaseUser, {
              role: userClaims.role || 'user',
              profileCompleted: false,
              onboardingStep: 'role_selection'
            });
            console.log('✅ User tracking completed');
          } catch (error) {
            console.error('❌ Error tracking user:', error);
          }
          
          console.log('✅ Authentication complete');
          console.log('   Email:', firebaseUser.email);
          console.log('   Role:', userClaims.role || 'No role assigned');
          console.log('   UID:', firebaseUser.uid);
          
          // Set up real-time listener for user document changes
          if (userDocUnsubscribeRef.current) {
            userDocUnsubscribeRef.current();
          }
          
          userDocUnsubscribeRef.current = onSnapshot(
            doc(db!, 'users', firebaseUser.uid),
            (doc) => {
              if (doc.exists()) {
                const userData = doc.data();
                if (userData.role && userData.role !== userClaims.role) {
                  console.log('🔄 Role updated in real-time:', userData.role);
                  const newClaims = { ...userClaims, role: userData.role };
                  setClaims(newClaims);
                  localStorage.setItem('userRole', userData.role);
                  localStorage.setItem('userClaims', JSON.stringify(newClaims));
                }
              }
            },
            (error) => {
              console.error('❌ Error listening to user document:', error);
            }
          );
          
        } catch (error) {
          console.error('❌ Error during authentication:', error);
          setUser(firebaseUser);
          setClaims(null);
          setIsLoading(false);
        }
      } else {
        // No Firebase user logged in
        console.log('ℹ️ No user logged in - Please signup or login');
        setUser(null);
        setClaims(null);
        setIsLoading(false);
        
        // Clear stored data
        localStorage.removeItem('userRole');
        localStorage.removeItem('userClaims');
        
        // Clean up user document listener
        if (userDocUnsubscribeRef.current) {
          userDocUnsubscribeRef.current();
          userDocUnsubscribeRef.current = null;
        }
      }
    });

    // Store unsubscribe function in ref
    unsubscribeRef.current = unsubscribe;

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (userDocUnsubscribeRef.current) {
        userDocUnsubscribeRef.current();
        userDocUnsubscribeRef.current = null;
      }
      isInitialized.current = false;
    };
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setClaims(null);
      
      // Clear session data but keep user preferences
      sessionStorage.clear();
      
      // Clear admin cache and session
      AdminCache.clearAll();
      AdminSession.clear();
      
      // Clear auth-related localStorage only
      const keysToRemove = ['userRole', 'userClaims', 'lastLoginEmail'];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('✅ Signed out successfully - all cache cleared');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    claims,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
