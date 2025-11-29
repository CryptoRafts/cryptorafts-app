"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { useRouter } from "next/navigation";
import { ensureStorage, waitForFirebase, getFirebaseServices, ensureDb, safeFirebaseOperation } from "@/lib/firebase-utils";
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage as getFirebaseStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';
import PNGUploader from "@/components/PNGUploader";
import { FirebaseConnectionManager } from "@/lib/firebase-connection-manager";

export default function VCRegister() {
  const { user, claims, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const [formData, setFormData] = useState({
    legalName: "",
    website: "",
    country: "",
    description: "",
    primaryContactName: "",
    primaryContactEmail: "",
    twitter: "",
    linkedin: ""
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Check role from localStorage first, then from claims
    const localRole = localStorage.getItem('userRole');
    const userRole = localRole || claims?.role;
    
    if (userRole && userRole !== 'vc') {
      console.log("?? User role mismatch. Expected: vc, Got:", userRole);
      router.push('/role');
      return;
    }

    // CRITICAL: Only check registration status if we're on the register page
    // Don't redirect if user is already on the correct page
    if (window.location.pathname === '/vc/register') {
      checkRegistrationStatus();
    }
  }, [authLoading, user, claims, router]);

  const checkRegistrationStatus = async () => {
    if (!user) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        return;
      }

      const dbInstance = ensureDb();
      const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        console.log('🔍 Registration Status Check:', {
          profileCompleted: userData.profileCompleted,
          kybStatus: userData.kybStatus,
          kybComplete: userData.kybComplete
        });
        
        // If profile is already completed, redirect to next step
        if (userData.profileCompleted) {
          const kybStatus = (userData.kybStatus || 'not_submitted').toLowerCase();
          
          if (kybStatus === 'approved' || kybStatus === 'verified') {
            console.log("✅ Profile and KYB completed, redirecting to dashboard");
            router.push('/vc/dashboard');
          } else if (kybStatus === 'pending' || kybStatus === 'submitted') {
            console.log("✅ Profile completed, KYB pending, redirecting to pending approval");
            router.push('/vc/pending-approval');
          } else {
            console.log("✅ Profile completed, redirecting to KYB page");
            router.push('/vc/kyb');
          }
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error checking registration status:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileSelect = (file: File | null) => {
    setCompanyLogo(file);
    setUploadError('');
  };

  const validateForm = (): boolean => {
    if (!companyLogo) {
      setError('Company logo is required');
      return false;
    }

    if (!formData.legalName.trim() || !formData.website.trim() || !formData.country.trim() || !formData.description.trim() || !formData.primaryContactName.trim() || !formData.primaryContactEmail.trim()) {
      setError('All required fields must be filled');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.primaryContactEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate website format
    const websiteRegex = /^https?:\/\/.+/;
    if (!websiteRegex.test(formData.website)) {
      setError('Please enter a valid website URL (must start with http:// or https://)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setSaving(true);
    setError(null);

    try {
      let logoUrl = '';
      
      // Upload logo to Firebase Storage with retry logic
      if (companyLogo) {
        console.log('📤 Uploading company logo...');
        
        // Wait for Firebase with multiple retry attempts
        let storageInstance = null;
        let retries = 0;
        const maxRetries = 20; // 20 retries * 500ms = 10 seconds
        
        while (!storageInstance && retries < maxRetries) {
          // Try to get storage instance
          try {
            // Method 1: Try ensureStorage() first (most reliable)
            try {
              storageInstance = ensureStorage();
              if (storageInstance) {
                console.log('✅ Storage from ensureStorage() on attempt', retries + 1);
                break;
              }
            } catch (e) {
              // Continue to next method
            }
            
            // Method 2: Try getFirebaseServices()
            try {
              const services = getFirebaseServices();
              if (services && services.storage) {
                storageInstance = services.storage;
                console.log('✅ Storage from getFirebaseServices() on attempt', retries + 1);
                break;
              }
            } catch (e) {
              // Continue to next method
            }
            
            // Method 3: Try getApp() and getFirebaseStorage()
            try {
              const app = getApp();
              if (app) {
                storageInstance = getFirebaseStorage(app);
                if (storageInstance) {
                  console.log('✅ Storage from getFirebaseStorage(app) on attempt', retries + 1);
                  break;
                }
              }
            } catch (e) {
              // Continue to next method
            }
            
            // Method 4: Try getStorageInstance()
            try {
              storageInstance = getStorageInstance();
              if (storageInstance) {
                console.log('✅ Storage from getStorageInstance() on attempt', retries + 1);
                break;
              }
            } catch (e) {
              // Continue to retry
            }
          } catch (error) {
            console.error(`❌ Storage initialization attempt ${retries + 1} failed:`, error);
          }
          
          // Wait before retrying
          if (!storageInstance && retries < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          retries++;
        }
        
        // Final validation
        if (!storageInstance) {
          console.error('❌ All storage initialization methods failed after', maxRetries, 'attempts');
          throw new Error('Storage not available. Please refresh the page and try again.');
        }
        
        // Validate storage instance is not null/undefined
        if (!storageInstance || typeof storageInstance !== 'object') {
          console.error('❌ Invalid storage instance:', storageInstance);
          throw new Error('Invalid storage instance. Please refresh the page and try again.');
        }
        
        // Additional check: ensure it's a Firebase Storage instance
        if (typeof ref !== 'function') {
          console.error('❌ ref function not available');
          throw new Error('Firebase Storage functions not available. Please refresh the page.');
        }
        
        console.log('✅ Storage instance validated, proceeding with upload...');
        
        // Capture storage instance in a const to ensure it's not lost
        const finalStorageInstance = storageInstance;
        
        if (!finalStorageInstance) {
          throw new Error('Storage instance is null after validation');
        }
        
        console.log('🔍 Final storage instance check:', {
          isNull: finalStorageInstance === null,
          isUndefined: finalStorageInstance === undefined,
          type: typeof finalStorageInstance,
          hasApp: finalStorageInstance?.app !== undefined
        });
        
        logoUrl = await FirebaseConnectionManager.executeWithRetry(
          async () => {
            // Re-validate storage instance inside retry
            if (!finalStorageInstance) {
              throw new Error('Storage instance is null in retry function');
            }
            
            // Double-check storage instance is valid before creating ref
            if (!finalStorageInstance) {
              console.error('❌ Storage instance is null in retry function');
              throw new Error('Storage instance is null');
            }
            
            // Verify storage instance has the required structure
            if (typeof finalStorageInstance !== 'object') {
              console.error('❌ Storage instance is not an object:', typeof finalStorageInstance);
              throw new Error('Invalid storage instance type');
            }
            
            // Try to create ref - if this fails, we'll know storage is the issue
            let storageRef;
            const filePath = `company-logos/${user.uid}/${Date.now()}_${companyLogo.name}`;
            
            console.log('🔍 Creating storage ref with:', {
              storageType: typeof finalStorageInstance,
              storageIsNull: finalStorageInstance === null,
              filePath: filePath
            });
            
            try {
              // Import ref dynamically to ensure it's available
              const { ref: refFn } = await import('firebase/storage');
              storageRef = refFn(finalStorageInstance, filePath);
              
              if (!storageRef) {
                throw new Error('ref() returned null');
              }
            } catch (refError: any) {
              console.error('❌ Error creating storage ref:', refError);
              console.error('❌ Storage instance details:', {
                type: typeof finalStorageInstance,
                isNull: finalStorageInstance === null,
                isUndefined: finalStorageInstance === undefined,
                constructor: finalStorageInstance?.constructor?.name,
                keys: finalStorageInstance ? Object.keys(finalStorageInstance) : []
              });
              throw new Error(`Failed to create storage reference: ${refError.message || refError}`);
            }
            
            if (!storageRef) {
              throw new Error('Storage reference is null after creation');
            }
            
            await uploadBytes(storageRef, companyLogo);
            return await getDownloadURL(storageRef);
          },
          'Logo Upload'
        );
        
        console.log('✅ Logo uploaded successfully:', logoUrl);
      }

      // Save to Firestore with retry logic
      console.log('💾 Saving VC registration data...');
      
      // Retry getting DB instance multiple times (similar to signup)
      let dbInstance = null;
      let retries = 0;
      const maxRetries = 20; // 20 retries * 250ms = 5 seconds
      
      while (!dbInstance && retries < maxRetries) {
        try {
          const isReady = await waitForFirebase(1000); // Quick check
          if (isReady) {
            dbInstance = ensureDb();
            if (dbInstance) break;
          }
        } catch (error) {
          // Continue retrying
        }
        await new Promise(resolve => setTimeout(resolve, 250));
        retries++;
      }
      
      if (!dbInstance) {
        console.warn('⚠️ Database not ready, but will retry saving user document.');
      }
      
      // Use safeFirebaseOperation which handles retries internally
      await safeFirebaseOperation(
        async () => {
          // Ensure DB is ready before each attempt
          const db = ensureDb();
          if (!db) {
            throw new Error('Database not ready');
          }
          return setDoc(doc(db, "users", user.uid), {
            ...formData,
            role: "vc",
            companyLogo: logoUrl,
            logo: logoUrl,
            logoUrl: logoUrl,
            onboardingStep: "kyb",
            profileCompleted: true,
            kycStatus: "not_submitted",
            kybStatus: "not_submitted",
            kyb_status: "not_submitted", // Support both naming conventions
            kybComplete: false,
            onboarding_state: 'KYB_PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }, { merge: true });
        },
        'VC Registration Save',
        5 // 5 retries
      );
      
      console.log('? VC registration complete!');
      console.log('?? Redirecting to KYB page...');
      
      // Clear role selection flag since profile is completed
      localStorage.removeItem('userRoleSelected');
      
      router.push('/vc/kyb');
      
    } catch (err: any) {
      console.error('? Registration error:', err);
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center pt-24"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center pt-24"
        style={{
          backgroundImage: 'url("/worldmap.png")'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat pt-24 pb-12 px-4"
      style={{
        backgroundImage: 'url("/worldmap.png")'
      }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="pt-20 sm:pt-28 pb-8 sm:pb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">VC Registration</h1>
            <p className="text-white/60 text-base sm:text-lg">Complete your venture capital firm profile</p>
          </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Company Logo */}
          <div className="neo-glass-card rounded-2xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Company Logo *</h2>
            <PNGUploader
              onFileSelect={handleFileSelect}
              onError={setUploadError}
              placeholder="Upload Company Logo"
              required
              className="max-w-xs mx-auto"
            />
            {uploadError && (
              <p className="text-red-400 text-sm mt-2 text-center">{uploadError}</p>
            )}
          </div>

          {/* Company Information */}
          <div className="neo-glass-card rounded-2xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Company Information</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Legal Name *</label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => handleInputChange('legalName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="Your company's legal name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Website *</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="https://yourcompany.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Country *</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="Country where your company is registered"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">One-line Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="Brief description of your VC firm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div className="neo-glass-card rounded-2xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Primary Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Contact Name *</label>
                <input
                  type="text"
                  value={formData.primaryContactName}
                  onChange={(e) => handleInputChange('primaryContactName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="Primary contact person"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Contact Email *</label>
                <input
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e) => handleInputChange('primaryContactEmail', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="contact@yourcompany.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="neo-glass-card rounded-2xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Social Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Twitter</label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="@yourcompany"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={saving || !companyLogo}
              className="btn btn-primary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
