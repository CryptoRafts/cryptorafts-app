"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { auth, db, doc, onSnapshot } from "@/lib/firebase.client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function AuthMenu(){
  const [uid,setUid] = useState<string|undefined>(undefined);
  const [role,setRole] = useState<string|undefined>(undefined);
  const [kyc,setKyc] = useState<string|undefined>(undefined);
  const [kyb,setKyb] = useState<string|undefined>(undefined);
  const [userName, setUserName] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(()=> onAuthStateChanged(auth, u=> {
    setUid(u?.uid||null||undefined);
    setUserEmail(u?.email || '');
  }),[]);
  
  useEffect(()=>{
    if(!uid || !db){ 
      setRole(undefined); 
      setKyc(undefined); 
      setKyb(undefined);
      setUserName('');
      setProfilePicture('');
      return; 
    }
    
    const off = onSnapshot(
      doc(db!,"users",uid), 
      snap=>{
        const d = snap.data()||{};
        setRole(d.role); 
        setKyc(d.kyc?.status); 
        setKyb(d.kyb?.status);
        
        // Get user profile data
        setUserName(d.name || d.displayName || d.fullName || '');
        setProfilePicture(d.profilePicture || d.photoURL || '');
      },
      error => {
        console.error('AuthMenu: Firestore error:', error);
        setRole(undefined); setKyc(undefined); setKyb(undefined);
      }
    );
    return ()=>{ try{ off(); }catch{} };
  }, [uid]);

  if (uid === undefined) return null;

  if (!uid) return (
    <div className="flex items-center gap-3">
      <Link href="/role" className="hover:underline">Choose role</Link>
      <Link href="/login" className="hover:underline">Log in</Link>
      <Link href="/signup" className="hover:underline">Create account</Link>
    </div>
  );

  const isVerified = kyc === 'verified' || kyc === 'approved' || kyb === 'verified' || kyb === 'approved';
  const isPending = kyc === 'pending' || kyc === 'submitted' || kyb === 'pending' || kyb === 'submitted';

  const roleDisplayNames: Record<string, string> = {
    founder: 'Founder',
    vc: 'VC',
    exchange: 'Exchange',
    ido: 'IDO Platform',
    agency: 'Marketing Agency',
    influencer: 'Influencer',
    admin: 'Admin'
  };

  const displayName = userName || userEmail?.split('@')[0] || 'User';
  const displayRole = role ? roleDisplayNames[role] : '';

  return (
    <div className="flex items-center gap-3">
      {/* User Profile Section */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-white/10">
        {/* Profile Picture */}
        {profilePicture ? (
          <Image
            src={profilePicture}
            alt={displayName}
            width={32}
            height={32}
            className="rounded-full border-2 border-cyan-500/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* User Info */}
        <div className="hidden md:flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-medium text-sm">{displayName}</span>
            {isVerified && <CheckBadgeIcon className="w-4 h-4 text-green-400" />}
            {isPending && <ClockIcon className="w-4 h-4 text-yellow-400" />}
          </div>
          {displayRole && (
            <span className="text-white/60 text-xs">{displayRole}</span>
          )}
        </div>
      </div>
      {role==="founder" && (
        <>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {kyc==="verified" && <Link href="/pitch" className="hover:underline">Pitch</Link>}
          <Link href="/messages" className="hover:underline">Messages</Link>
        </>
      )}

      {role==="vc" && (
        <>
          <Link href="/vc/register" className="hover:underline">Register</Link>
          <Link href="/vc/dealflow" className="hover:underline">Dealflow</Link>
          <Link href="/messages" className="hover:underline">Messages</Link>
        </>
      )}

      {role==="exchange" && (
        <>
          <Link href="/exchange/register" className="hover:underline">Register</Link>
          <Link href="/exchange/dealflow" className="hover:underline">Dealflow</Link>
          <Link href="/messages" className="hover:underline">Messages</Link>
        </>
      )}

      {role==="ido" && (
        <>
          <Link href="/ido/register" className="hover:underline">Register</Link>
          <Link href="/ido/dealflow" className="hover:underline">Dealflow</Link>
          <Link href="/messages" className="hover:underline">Messages</Link>
        </>
      )}

      {role==="agency" && (
        <>
          <Link href="/agency/register" className="hover:underline">Register</Link>
          <Link href="/agency/dealflow" className="hover:underline">Dealflow</Link>
          <Link href="/messages" className="hover:underline">Messages</Link>
        </>
      )}

      {role==="influencer" && (
        <>
          <Link href="/influencer/register" className="hover:underline">Register</Link>
          <Link href="/influencer/dealflow" className="hover:underline">Campaigns</Link>
          <Link href="/messages" className="hover:underline">Messages</Link>
        </>
      )}

      <button onClick={()=>signOut(auth)} className="btn btn-outline px-4 py-2 text-sm">Log out</button>
    </div>
  );
}
