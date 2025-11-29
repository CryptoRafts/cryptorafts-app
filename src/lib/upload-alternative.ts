"use client";

import { db, doc, setDoc } from "@/lib/firebase.client";

/**
 * Alternative upload method that stores files as base64 in Firestore
 * This bypasses Firebase Storage rules completely
 */
export async function uploadToFirestore(
  file: File,
  collectionPath: string,
  documentId: string,
  fieldName: string = 'logo'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        
        // Store in Firestore
        await setDoc(doc(db!, collectionPath, documentId), {
          [fieldName]: base64Data,
          [fieldName + '_metadata']: {
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          }
        }, { merge: true });
        
        // Return a reference ID instead of URL
        resolve(`firestore:${collectionPath}/${documentId}/${fieldName}`);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Retrieve file from Firestore
 */
export async function getFromFirestore(
  collectionPath: string,
  documentId: string,
  fieldName: string = 'logo'
): Promise<string | null> {
  try {
    const docRef = doc(db!, collectionPath, documentId);
    const docSnap = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef));
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data[fieldName] || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving from Firestore:', error);
    return null;
  }
}
