"use client";

/**
 * Browser-based upload methods that don't require Firebase permissions
 * This completely bypasses Firebase Storage and Firestore rules
 */

/**
 * Upload to browser localStorage (completely bypasses Firebase)
 */
export async function uploadToLocalStorage(
  file: File,
  key: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const base64Data = reader.result as string;
        localStorage.setItem(key, base64Data);
        
        // Store metadata
        const metadata = {
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
        localStorage.setItem(key + '_metadata', JSON.stringify(metadata));
        
        resolve(`localStorage:${key}`);
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
 * Retrieve from browser localStorage
 */
export function getFromLocalStorage(key: string): string | null {
  return localStorage.getItem(key);
}

/**
 * Get metadata from localStorage
 */
export function getMetadataFromLocalStorage(key: string): any {
  const metadata = localStorage.getItem(key + '_metadata');
  return metadata ? JSON.parse(metadata) : null;
}

/**
 * Compress image file to reduce size
 */
function compressImage(file: File, maxSizeKB: number = 500): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const maxDimension = 800; // Max width or height
      
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback to original
        }
      }, 'image/jpeg', 0.8); // 80% quality
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload to user's own Firestore document (bypasses collection rules)
 */
export async function uploadToUserDocument(
  file: File,
  userId: string,
  fieldName: string = 'orgLogo'
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Compress image if it's too large
      let fileToUpload = file;
      if (file.size > 500 * 1024) { // 500KB limit
        console.log('🔄 Compressing image for User Document upload...');
        fileToUpload = await compressImage(file, 500);
        console.log(`✅ Image compressed: ${file.size} → ${fileToUpload.size} bytes`);
      }
      
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Check size limit (1MB for Firestore)
          if (base64Data.length > 1048487) {
            reject(new Error('File too large even after compression. Please use a smaller image.'));
            return;
          }
          
          // Import Firebase functions
          const { doc, setDoc, db } = await import('@/lib/firebase.client');
          
          // Store in user's own document (should have permission)
          await setDoc(doc(db!, "users", userId), {
            [fieldName]: base64Data,
            [`${fieldName}_metadata`]: {
              name: fileToUpload.name,
              type: fileToUpload.type,
              size: fileToUpload.size,
              originalSize: file.size,
              compressed: file.size !== fileToUpload.size,
              uploadedAt: new Date().toISOString()
            }
          }, { merge: true });
          
          resolve(`userDoc:${userId}/${fieldName}`);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(fileToUpload);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Complete fallback upload system
 */
export async function uploadWithAllFallbacks(
  file: File,
  userId: string,
  fileName: string
): Promise<{ success: boolean; method: string; url: string; error?: string }> {
  const methods = [
    {
      name: 'Firebase Storage',
      upload: async () => {
        const { uploadToStorage } = await import('@/lib/upload');
        return await uploadToStorage(`organizations/logos/${fileName}`, file);
      }
    },
    {
      name: 'User Document',
      upload: async () => {
        return await uploadToUserDocument(file, userId, 'orgLogo');
      }
    },
    {
      name: 'LocalStorage',
      upload: async () => {
        return await uploadToLocalStorage(file, `orgLogo_${userId}`);
      }
    }
  ];

  for (const method of methods) {
    try {
      console.log(`🔄 Trying ${method.name}...`);
      const result = await method.upload();
      console.log(`✅ ${method.name} succeeded!`);
      return { success: true, method: method.name, url: result };
    } catch (error: any) {
      console.error(`❌ ${method.name} failed:`, error.message);
    }
  }

  return {
    success: false,
    method: 'All methods failed',
    url: '',
    error: 'All upload methods failed'
  };
}
