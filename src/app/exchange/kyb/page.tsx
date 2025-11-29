"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, ensureStorage, safeFirebaseOperation } from '@/lib/firebase-utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function ExchangeKYB() {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();
  const [kybStatus, setKybStatus] = useState<string>('not_submitted');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    website: '',
    phone: '',
    linkedin: '',
    twitter: '',
    telegram: '',
    logo: null as File | null
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkKybStatus = async () => {
      try {
        // OPTIMIZED: Reduced timeout for faster loading
        const isReady = await waitForFirebase(3000);
        if (!isReady) {
          setLoading(false);
          return;
        }
        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }
        const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const status = userData.kybStatus || userData.kyb?.status || 'not_submitted';
          setKybStatus(status);
          
          // Pre-fill form if data exists
          if (userData.companyName) {
            setFormData(prev => ({
              ...prev,
              companyName: userData.companyName || '',
              companyEmail: userData.companyEmail || userData.email || '',
              website: userData.website || '',
              phone: userData.phone || '',
              linkedin: userData.linkedin || '',
              twitter: userData.twitter || '',
              telegram: userData.telegram || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error checking KYB status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkKybStatus();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        setError('Firebase not initialized. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      let logoUrl = '';
      
      // Upload logo if provided
      if (formData.logo) {
        const storageInstance = ensureStorage();
        if (!storageInstance) {
          setError('Storage not available. Please refresh and try again.');
          setSubmitting(false);
          return;
        }
        const logoRef = ref(storageInstance, `company-logos/${user.uid}/${Date.now()}_${formData.logo.name}`);
        await uploadBytes(logoRef, formData.logo);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Update user document with KYB data
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database not available. Please refresh and try again.');
        setSubmitting(false);
        return;
      }
      
      const { serverTimestamp, collection, query, where, getDocs } = await import('firebase/firestore');
      
      // Update user document
      await setDoc(doc(dbInstance, 'users', user.uid), {
        kybStatus: 'pending',
        kybSubmittedAt: new Date(),
        lastUpdated: new Date(),
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        website: formData.website,
        phone: formData.phone,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        telegram: formData.telegram,
        companyLogo: logoUrl,
        kyb: {
          status: 'pending',
          submittedAt: new Date(),
          companyName: formData.companyName,
          companyEmail: formData.companyEmail,
          website: formData.website,
          phone: formData.phone,
          socials: {
            linkedin: formData.linkedin,
            twitter: formData.twitter,
            telegram: formData.telegram
          },
          logo: logoUrl
        }
      }, { merge: true });
      
      // Also create/update organization document for admin visibility
      try {
        const orgsQuery = query(collection(dbInstance, 'organizations'), where('userId', '==', user.uid));
        const orgsSnapshot = await getDocs(orgsQuery);
        
        const orgData = {
          userId: user.uid,
          organizationName: formData.companyName,
          organizationType: 'N/A',
          registrationNumber: 'N/A',
          taxId: 'N/A',
          address: 'N/A',
          country: 'N/A',
          contactPerson: user.displayName || user.email || 'N/A',
          email: formData.companyEmail || user.email || 'N/A',
          phone: formData.phone || 'N/A',
          website: formData.website || '',
          businessDescription: 'N/A',
          documents: {},
          kybStatus: 'pending',
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        if (orgsSnapshot.empty) {
          // Create new organization
          const newOrgRef = doc(collection(dbInstance, 'organizations'));
          await setDoc(newOrgRef, orgData);
          console.log('✅ Created organization document for KYB');
        } else {
          // Update existing organization - use updateDoc to ensure status is overwritten
          const orgDoc = orgsSnapshot.docs[0];
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(dbInstance, 'organizations', orgDoc.id), {
            ...orgData,
            createdAt: orgDoc.data().createdAt || serverTimestamp()
          });
          console.log('✅ Updated organization document for KYB - Status set to pending');
        }
      } catch (orgError) {
        console.error('⚠️ Could not create/update organization document:', orgError);
        // Don't fail the whole submission if org update fails
      }

      setKybStatus('pending');
      router.push('/exchange/pending-approval');

    } catch (error) {
      console.error('Error submitting KYB:', error);
      setError('Failed to submit KYB verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    switch (kybStatus) {
      case 'approved':
      case 'verified':
        return {
          icon: <NeonCyanIcon type="check" className="text-green-400" size={32} />,
          title: "KYB Verified",
          description: "Your exchange has been successfully verified.",
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30"
        };
      case 'pending':
        return {
          icon: <NeonCyanIcon type="clock" className="text-yellow-400" size={32} />,
          title: "KYB Pending",
          description: "Your exchange verification is being reviewed.",
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30"
        };
      case 'rejected':
        return {
          icon: <NeonCyanIcon type="close" className="text-red-400" size={32} />,
          title: "KYB Rejected",
          description: "Your exchange verification was rejected. Please try again.",
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30"
        };
      default:
        return {
          icon: <NeonCyanIcon type="building" className="text-blue-400" size={32} />,
          title: "KYB Required",
          description: "Complete exchange verification to access all features.",
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30"
        };
    }
  };

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div
        className="min-h-screen bg-black flex items-center justify-center pt-24"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in</h1>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();
  const isCompleted = kybStatus === 'approved' || kybStatus === 'verified';

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Exchange Verification
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Complete your KYB verification to unlock all exchange features and access the full platform
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12">
            {/* Status Display */}
            <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-2xl p-6 mb-8`}>
              <div className="flex items-center justify-center mb-4">
                {statusDisplay.icon}
              </div>
              <h2 className={`text-2xl font-bold ${statusDisplay.color} text-center mb-2`}>
                {statusDisplay.title}
              </h2>
              <p className="text-white/70 text-center">
                {statusDisplay.description}
              </p>
            </div>

            {/* AI-Powered Verification Info */}
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center">
                    <NeonCyanIcon type="sparkles" className="text-white" size={24} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">AI-Powered Exchange Verification</h3>
                  <p className="text-white/70 mb-4">
                    Our AI system verifies your exchange information in real-time with advanced company data validation.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <NeonCyanIcon type="check" className="text-green-400" size={20} />
                      <span className="text-white/80 text-sm">Exchange Validation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <NeonCyanIcon type="check" className="text-green-400" size={20} />
                      <span className="text-white/80 text-sm">Website Verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <NeonCyanIcon type="check" className="text-green-400" size={20} />
                      <span className="text-white/80 text-sm">Social Media Check</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KYB Form */}
            {!isCompleted && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Exchange Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Enter your exchange name"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Exchange Email *
                    </label>
                    <input
                      type="email"
                      name="companyEmail"
                      value={formData.companyEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="exchange@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="https://yourexchange.com"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Social Media */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="https://linkedin.com/company/yourexchange"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Twitter
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="https://twitter.com/yourexchange"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Telegram
                    </label>
                    <input
                      type="url"
                      name="telegram"
                      value={formData.telegram}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="https://t.me/yourexchange"
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Exchange Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer hover:bg-white/20 transition-all duration-200"
                    >
                      <NeonCyanIcon type="photo" className="text-current" size={20} />
                      <span>Choose Logo</span>
                    </label>
                    {formData.logo && (
                      <span className="text-green-400 text-sm">
                        {formData.logo.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center space-x-2">
                    <NeonCyanIcon type="close" className="text-current" size={20} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <NeonCyanIcon type="shield" className="text-current" size={20} />
                      <span>Submit KYB Verification</span>
                      <NeonCyanIcon type="arrow-right" className="text-current" size={20} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Action Buttons for Completed Status */}
            {isCompleted && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/exchange/dashboard')}
                  className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 transform hover:scale-105"
                >
                  <NeonCyanIcon type="check" className="text-current" size={20} />
                  <span>Continue to Dashboard</span>
                  <NeonCyanIcon type="arrow-right" className="text-current" size={20} />
                </button>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-8 text-center">
              <p className="text-white/50 text-sm">
                Your exchange information is encrypted and secure. We never share your data with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
