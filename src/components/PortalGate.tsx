"use client";
import Link from "next/link";
import { verifiedBadges } from "@/lib/guards";

/** Small UI block that shows KYC/KYB status + CTA for the CURRENT role page. */
export default function PortalGate({ udoc, needsKYB, roleLabel }:{
  udoc:any; needsKYB:boolean; roleLabel:string;
}){
  const { kycOk, kybOk } = verifiedBadges(udoc||{});
  const ok = needsKYB ? kybOk : kycOk;

  if (ok) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm">
        {roleLabel} verified ? — portal unlocked.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
      <div className="font-medium text-sm">{roleLabel} verification required</div>
      <div className="text-white/70 text-xs mt-1">
        {needsKYB ? "Complete KYB (organization + representative KYC)." : "Complete KYC (personal, with liveness)."}
      </div>
      <div className="mt-3 flex gap-2">
        {!needsKYB && <Link href="/kyc" className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-sm">Open KYC</Link>}
        {needsKYB && <Link href="/kyb" className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-sm">Open KYB</Link>}
      </div>
    </div>
  );
}
