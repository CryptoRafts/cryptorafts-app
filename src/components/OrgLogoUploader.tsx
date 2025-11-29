"use client";
import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, doc, setDoc } from "@/lib/firebase.client";

export default function OrgLogoUploader({ uid }:{ uid:string }){
  const [busy,setBusy] = useState(false);
  const [url,setUrl] = useState<string|null>(null);
  const [err,setErr] = useState<string|null>(null);

  async function onPick(e:any){
    const f: File = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "image/png") { setErr("PNG only"); return; }
    if (f.size > 5*1024*1024) { setErr("Max 5MB"); return; }
    setErr(null); setBusy(true);
    try{
      const storage = getStorage();
      const key = `avatars/${uid}/org-logo.png`;
      const r = ref(storage, key);
      await uploadBytes(r, f, { contentType: "image/png" });
      const u = await getDownloadURL(r);
      setUrl(u);
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      await setDoc(doc(firestore,"users", uid), { org: { logoUrl: u } }, { merge:true });
    }catch(e:any){
      setErr(e?.message||"Upload failed");
    }finally{ setBusy(false); }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm">Organization Logo (PNG)</label>
      <input type="file" accept="image/png" onChange={onPick} />
      <div className="text-xs text-white/60">Recommended: square, = 256�256.</div>
      {busy && <div className="text-sm text-white/60">Uploading�</div>}
      {err && <div className="text-sm text-red-400">{err}</div>}
      {url && <img src={url} alt="Org logo" className="h-16 w-16 rounded-lg border border-white/10" />}
    </div>
  );
}
