"use client";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase.client";

/** Live decoded custom claims from the current ID token */
export function useClaims(){
  const [claims, setClaims] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const off = auth.onIdTokenChanged(async (u: User | null)=>{
      if(!u){ setClaims(null); setLoading(false); return; }
      const res = await u.getIdTokenResult(true).catch(()=>null);
      setClaims(res?.claims || null);
      setLoading(false);
    });
    return ()=>{ try{ off(); }catch{} };
  }, []);

  return { claims, loading };
}
