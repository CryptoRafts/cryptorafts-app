"use client";
import { db, doc, setDoc } from "@/lib/firebase.client";

/** Set role once; never overwrite if already set */
export async function setRoleOnce(uid:string, role:string){
  await setDoc(doc(db!,"users", uid), {
    role,
    onboarding: { roleSelectedAt: Date.now() }
  }, { merge: true });
}
