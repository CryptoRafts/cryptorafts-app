"use client";
import { getAuth, onIdTokenChanged, getIdToken, User } from "firebase/auth";
import { app } from "@/lib/firebase.client";

let _lastForce = 0;

/** Force-refresh ID token after server updates custom claims */
export async function refreshClaims(user?: User|null){
  if (!app) return;
  const auth = getAuth(app);
  const u = user ?? auth.currentUser;
  if (!u) return;
  const now = Date.now();
  if (now - _lastForce < 1000) return; // debounce
  _lastForce = now;
  await getIdToken(u, true);
}

/** Hook once early to cause React subtree to re-render on claim change */
export function listenForClaimUpdates(){
  if (!app) return;
  const auth = getAuth(app);
  onIdTokenChanged(auth, () => {});
}
