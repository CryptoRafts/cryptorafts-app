"use client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase.client";

/** Upload a File to Firebase Storage with progress callback.
 *  @param path storage path, e.g. `uploads/<uid>/projects/...`
 *  @param file File object
 *  @param onProgress (0-100)
 *  @returns public download URL (still protected by your rules since the URL requires auth in app)
 */
export async function uploadToStorage(path: string, file: File, onProgress?: (p:number)=>void){
  return new Promise<string>((resolve, reject)=>{
    try {
      console.log('?? Starting upload to path:', path);
      
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }
      
      const task = uploadBytesResumable(ref(storage, path), file);
      task.on("state_changed", (snap)=>{
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        console.log(`?? Upload progress: ${pct}%`);
        onProgress?.(pct);
      }, (error) => {
        console.error('? Upload failed:', error);
        reject(error);
      }, async ()=>{
        try {
          console.log('? Upload completed, getting download URL...');
          const url = await getDownloadURL(task.snapshot.ref);
          console.log('?? Generated download URL:', url);
          console.log('?? URL contains token:', url.includes('token='));
          console.log('?? URL contains alt=media:', url.includes('alt=media'));
          resolve(url);
        } catch (error) {
          console.error('? Failed to get download URL:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('? Upload setup failed:', error);
      reject(error);
    }
  });
}
