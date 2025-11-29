"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db, doc, onSnapshot } from "@/lib/firebase.client";
import { onAuthStateChanged, User } from "firebase/auth";
import { useClaims } from "@/lib/claims";

export const ADMIN_EMAIL = "anasshamsiggc@gmail.com";

/** Auth user */
export function useAuthUser(){
  const [user,setUser] = useState<User|null>(null);
  const [loading,setLoading] = useState(true);
  useEffect(()=> onAuthStateChanged(auth, u=>{ setUser(u); setLoading(false); }),[]);
  return { user, loading, isAuthed: !!user };
}

/** Live user doc */
export function useUserDoc(uid?: string|null){
  const [data,setData] = useState<any|undefined>(undefined);
  useEffect(()=>{
    if(!uid){ setData(undefined); return; }
    const ref = doc(db!,"users", uid);
    const off = onSnapshot(ref, snap=> setData(snap.exists()? snap.data(): null));
    return ()=>{ try{ off(); }catch{} };
  }, [uid]);
  return data;
}

/** Enhanced Role & verification flags with strict isolation */
export function useRoleFlags(){
  const { user, loading } = useAuthUser();
  const { claims } = useClaims();
  const profile = useUserDoc(user?.uid);

  // Get role from claims first (most up-to-date), then profile
  const roleFromClaims = (claims as any)?.role as string|undefined;
  const roleFromDoc = (profile as any)?.role as string|undefined;
  const role = roleFromClaims || roleFromDoc;

  // Strict role isolation flags
  const isFounder = role === "founder";
  const isVC = role === "vc";
  const isExchange = role === "exchange";
  const isIDO = role === "ido";
  const isAgency = role === "agency";
  const isInfluencer = role === "influencer";

  // KYC/KYB status from claims or profile
  const kycFromClaims = (claims as any)?.kyc_verified;
  const kybFromClaims = (claims as any)?.kyb_verified;
  const kycFromProfile = (profile as any)?.kycStatus;
  const kybFromProfile = (profile as any)?.kybStatus;
  
  const kyc = kycFromClaims !== undefined ? (kycFromClaims ? 'verified' : 'pending') : kycFromProfile;
  const kyb = kybFromClaims !== undefined ? (kybFromClaims ? 'verified' : 'pending') : kybFromProfile;

      // Admin access - super admin or allowlisted email
      const adminAllowlist = ["anasshamsiggc@gmail.com", "ceo@cryptorafts.com", "anasshamsi@cryptorafts.com", "admin@cryptorafts.com", "support@cryptorafts.com"];
      const isAdmin = !!user && (
        (claims as any)?.admin?.super === true ||
        (profile as any)?.isSuperAdmin === true ||
        adminAllowlist.includes(user.email?.toLowerCase() || "") ||
        role === 'admin'
      );

  // Onboarding step
  const onboardingStep = (claims as any)?.onboardingStep || (profile as any)?.onboardingStep;

  // Department access
  const department = (claims as any)?.department || (profile as any)?.department;
  const permissions = (claims as any)?.permissions || (profile as any)?.permissions || [];

  return {
    user, loading, isAuthed: !!user,
    claims, profile, role,
    isFounder, isVC, isExchange, isIDO, isAgency, isInfluencer,
    kyc, kyb, isAdmin, onboardingStep, department, permissions,
    // Helper booleans
    isKycVerified: kyc === 'verified',
    isKybVerified: kyb === 'verified',
    isOnboardingComplete: onboardingStep === 'complete',
    hasPermission: (permission: string) => permissions.includes(permission) || permissions.includes('all')
  };
}

/** Require a specific role to render (no redirect; just a gate) */
export function useRoleGate(requiredRole?: string){
  const { user, loading, profile, role } = useRoleFlags();
  const ready = useMemo(()=>{
    if (loading) return false;
    if (!user) return false;
    if (profile === undefined) return false;
    if (requiredRole && role !== requiredRole) return false;
    return true;
  }, [loading, user, profile, requiredRole, role]);
  return { user, profile, role, ready };
}

/** One-shot navigate helper */
export function useOneShotNavigate(){
  const ranRef = useRef(false);
  return (fn: ()=>void)=>{
    if (ranRef.current) return;
    ranRef.current = true;
    fn();
  };
}

/** Hidden Admin gate (super claim OR allowlisted email) */
export function useAdminGate(){
  const { user, loading, profile, isAuthed, claims } = useRoleFlags();
  const adminAllowlist = ["anasshamsiggc@gmail.com", "ceo@cryptorafts.com", "anasshamsi@cryptorafts.com", "admin@cryptorafts.com", "support@cryptorafts.com"];
  const isAdmin = !!user && (
    (claims as any)?.admin?.super === true ||
    (profile as any)?.admin?.super === true ||
    adminAllowlist.includes(user.email?.toLowerCase() || "")
  );
  const ready = useMemo(()=> !loading && (user !== null) && profile !== undefined, [loading, user, profile]);
  return { user, ready, isAuthed, isAdmin };
}

/** Compute KYC/KYB booleans from a user/org like document */
export function verifiedBadges(profile: any){
  // Check direct status fields FIRST (they have the correct approved values)
  const kycStatus = profile?.kycStatus || profile?.kyc?.status;
  const kybStatus = profile?.kybStatus || profile?.kyb?.status;
  const kycStatusLower = String(kycStatus||"").toLowerCase();
  const kybStatusLower = String(kybStatus||"").toLowerCase();
  // Accept both "approved" and "verified" as valid verification statuses
  const kycOk = kycStatusLower === "verified" || kycStatusLower === "approved";
  const kybOk = kybStatusLower === "verified" || kybStatusLower === "approved";
  return { kycOk, kybOk, allOk: kycOk && kybOk };
}

type GateOptions = {
  requireLogin?: boolean;
  requireFounderKycVerified?: boolean;
};

/** Simple client-side gate hook for pages */
export function useGate(opts: GateOptions = {}){
  const { user, loading, profile, role } = useRoleFlags();
  const { kycOk } = verifiedBadges(profile||{});
  const ready = useMemo(()=>{
    if (loading) return false;
    if (opts.requireLogin && !user) return false;
    if (opts.requireFounderKycVerified && role === "founder" && !kycOk) return false;
    return profile !== undefined;
  }, [loading, user, profile, role, kycOk, opts.requireLogin, opts.requireFounderKycVerified]);
  return { user, profile, role, ready };
}

/** Minimal protected route hook (login required) */
export function useProtected(){
  const { user, loading, profile } = useRoleFlags();
  const ready = useMemo(()=> !loading && !!user && profile !== undefined, [loading, user, profile]);
  return { user, ready };
}
