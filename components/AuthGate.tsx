"use client"
import { ReactNode, useEffect, useState } from "react"
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth"
import { auth } from "@/lib/firebase.client"

export function SignInGoogleBtn(){
  return <button className="btn" onClick={async()=>{
    if (!auth) return;
    const prov = new GoogleAuthProvider()
    await signInWithPopup(auth, prov)
  }}>Sign in with Google</button>
}

export function SignOutBtn(){ return <button className="btn" onClick={()=>auth && signOut(auth)}>Sign out</button> }

export default function AuthGate({ children }: { children: ReactNode }){
  const [u,setU] = useState<User|null>(null)
  const [ready,setReady] = useState(false)
  useEffect(()=> {
    if (!auth) return;
    return onAuthStateChanged(auth,(user)=>{ setU(user); setReady(true) });
  },[])
  if(!ready) return <div className="card">Loading…</div>
  return <>{children}</>
}
