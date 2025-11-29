"use client";
import { auth } from "@/lib/firebase.client";

export async function fetchWithIdToken(input: RequestInfo | URL, init?: RequestInit){
  const u = auth.currentUser;
  const t = u ? await u.getIdToken(/*force*/ true) : "";
  const headers = new Headers(init?.headers || {});
  if (t) headers.set("authorization", `Bearer ${t}`);
  return fetch(input, { ...init, headers });
}

export async function syncRoleFromClaims(){
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    const idToken = await user.getIdToken(true);
    const response = await fetch("/api/role-sync", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${idToken}`
      }
    });
    
    if (response.ok) {
      // The API will set the cookies automatically
      return true;
    }
  } catch (error) {
    console.error("Failed to sync role:", error);
  }
  return false;
}
