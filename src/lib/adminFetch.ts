"use client";
import { auth } from "@/lib/firebase.client";
export async function adminAuthedPost(url: string, body: any){
  const u = auth.currentUser;
  if(!u) throw new Error("Not signed in");
  const idToken = await u.getIdToken(/* forceRefresh */ false);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify(body)
  });
  if(!res.ok){
    const j = await res.json().catch(()=> ({}));
    throw new Error(j?.error || `HTTP ${res.status}`);
  }
  return res.json();
}
