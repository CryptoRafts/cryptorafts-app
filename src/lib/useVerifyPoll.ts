"use client";
import { useEffect, useState } from "react";
import { db, doc, onSnapshot } from "@/lib/firebase.client";

export function useVerifyPoll(uid?:string){
  const [kyc,setKyc] = useState<any>(null);
  const [kyb,setKyb] = useState<any>(null);

  useEffect(()=>{
    if (!uid) return;
    const off = onSnapshot(doc(db!,"users", uid), (snap:any)=>{
      const d = snap.exists()? snap.data(): {};
      setKyc(d.kyc||null);
      setKyb(d.kyb||null);
    });
    return ()=>{ try{ off(); }catch{} };
  }, [uid]);

  return { kyc, kyb };
}
