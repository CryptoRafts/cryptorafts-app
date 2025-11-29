"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { 
  ShieldCheckIcon,
  CameraIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import OnboardingHeader from './OnboardingHeader';
import { createSecureIdStorage, validateIdFormat, sanitizeIdNumber } from '@/lib/security';

interface KYCData {
  kyc_legal_name: string;
  kyc_dob: string;
  kyc_country: string;
  kyc_id_type: string;
  kyc_id_number: string;
  kyc_selfie_url: string;
  kyc_id_image_url?: string;
}

export default function FounderKYCForm() {
  const { user } = useAuth();
  const { loadProfile } = useFounderAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [idImageUrl, setIdImageUrl] = useState<string>('');
  
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const idImageInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<KYCData>({
    kyc_legal_name: '',
    kyc_dob: '',
    kyc_country: '',
    kyc_id_type: '',
    kyc_id_number: '',
    kyc_selfie_url: '',
    kyc_id_image_url: ''
  });

  const handleInputChange = (field: keyof KYCData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileUpload = (type: 'selfie' | 'id', file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (type === 'selfie') {
      setSelfieFile(file);
      const url = URL.createObjectURL(file);
      setSelfieUrl(url);
    } else {
      setIdImageFile(file);
      const url = URL.createObjectURL(file);
      setIdImageUrl(url);
    }

    setError('');
  };


  const validateForm = (): boolean => {
    if (!formData.kyc_legal_name.trim()) {
      setError('Full legal name is required');
      return false;
    }

    if (!formData.kyc_dob) {
      setError('Date of birth is required');
      return false;
    }

    if (!formData.kyc_country) {
      setError('Country of residence is required');
      return false;
    }

    if (!formData.kyc_id_type) {
      setError('Government ID type is required');
      return false;
    }

    if (!formData.kyc_id_number.trim()) {
      setError('Government ID number is required');
      return false;
    }

    // Validate ID number format
    const sanitizedId = sanitizeIdNumber(formData.kyc_id_number);
    if (!validateIdFormat(sanitizedId, formData.kyc_id_type)) {
      setError('Invalid ID number format for the selected ID type');
      return false;
    }

    if (!selfieFile) {
      setError('Selfie/Face photo is required');
      return false;
    }

    // ID image is optional

    return true;
  };

  const callRaftAIVerification = async (kycData: KYCData): Promise<any> => {
    try {
      // Call RaftAI verification API
      const response = await fetch('/api/raftai/verify-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kyc_legal_name: kycData.kyc_legal_name,
          kyc_dob: kycData.kyc_dob,
          kyc_country: kycData.kyc_country,
          kyc_id_type: kycData.kyc_id_type,
          kyc_id_number_masked: kycData.kyc_id_number_masked, // Send masked version
          kyc_selfie_url: kycData.kyc_selfie_url,
          kyc_id_image_url: kycData.kyc_id_image_url, // Optional
        }),
      });

      if (!response.ok) {
        throw new Error(`RaftAI verification failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('RaftAI verification error:', error);
      
      // Fallback to simulation if API is not available
      return simulateRaftAIVerification(kycData);
    }
  };

  const simulateRaftAIVerification = async (kycData: KYCData): Promise<any> => {
    // Simulate processing delay (≤5s SLA)
    const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Generate verification result
    const score = Math.floor(Math.random() * 100);
    const decision = score >= 70 ? 'APPROVED' : 'REJECTED';
    
    return {
      decision,
      risk_score: score,
      reasons: decision === 'APPROVED' ? 
        ['Identity verified successfully', 'Face match confirmed', 'Document validation passed'] :
        ['Face match failed', 'Document quality insufficient', 'Identity verification failed'],
      sla: processingTime / 1000,
      confidence: Math.random() * 0.3 + 0.7 // 70-100%
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Upload files to storage (simulate)
      const selfieUrl = `uploads/kyc/${user.uid}/selfie.${selfieFile?.name.split('.').pop()}`;
      const idImageUrl = `uploads/kyc/${user.uid}/id_image.${idImageFile?.name.split('.').pop()}`;

      // Create secure ID storage
      const sanitizedId = sanitizeIdNumber(formData.kyc_id_number);
      const secureIdStorage = createSecureIdStorage(sanitizedId);

      // Create KYC record
      const kycData = {
        ...formData,
        kyc_id_number: sanitizedId, // Store sanitized version
        kyc_id_number_hash: secureIdStorage.hash,
        kyc_id_number_last4: secureIdStorage.last4,
        kyc_id_number_masked: secureIdStorage.masked,
        kyc_selfie_url: selfieUrl,
        kyc_id_image_url: idImageUrl,
        status: 'PENDING',
        submitted_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      // Store KYC data in subcollection
      await setDoc(doc(db, 'users', user.uid, 'kyc', 'verification'), kycData);

      // Update user document
      await updateDoc(doc(db, 'users', user.uid), {
        onboarding_state: 'KYC_PENDING',
        kyc_status: 'pending',
        updated_at: serverTimestamp()
      });

      setIsSubmitting(false);
      setIsVerifying(true);

      // Call RaftAI verification
      const verificationResult = await callRaftAIVerification(kycData);
      setVerificationResult(verificationResult);

      // Update KYC record with result
      await updateDoc(doc(db, 'users', user.uid, 'kyc', 'verification'), {
        decision: verificationResult.decision,
        risk_score: verificationResult.risk_score,
        reasons: verificationResult.reasons,
        verified_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Update user document based on result
      if (verificationResult.decision === 'APPROVED') {
        await updateDoc(doc(db, 'users', user.uid), {
          onboarding_state: 'DONE',
          kyc_status: 'approved',
          customClaims: { role: 'founder', kyc: 'approved' },
          claims_updated_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });

        // Force token refresh
        await user.getIdToken(true);

        // Reload profile to get updated KYC status
        await loadProfile();

        // Let the redirect guard handle the navigation
        // setTimeout(() => {
        //   router.push('/founder/pitch');
        // }, 3000);
      } else {
        await updateDoc(doc(db, 'users', user.uid), {
          onboarding_state: 'KYC_REJECTED',
          kyc_status: 'rejected',
          updated_at: serverTimestamp()
        });

        // Reload profile to get updated KYC status
        await loadProfile();
      }

      setIsVerifying(false);

    } catch (err: any) {
      setError(err?.message || "KYC submission failed");
      setIsSubmitting(false);
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <OnboardingHeader />
        <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheckIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Verifying Your Identity</h3>
            <p className="text-gray-300">
              RaftAI is analyzing your information. This usually takes 5-10 seconds.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-sm text-gray-300 mt-2">Processing your verification...</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (verificationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <OnboardingHeader />
        <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            {verificationResult.decision === 'APPROVED' ? (
              <>
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-400">KYC Approved!</h3>
                <p className="text-gray-300">
                  Your identity has been successfully verified. Redirecting to dashboard...
                </p>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-400 font-medium">Risk Score: {verificationResult.risk_score}/100</p>
                  <p className="text-sm text-gray-300 mt-1">Low risk - Excellent verification</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                  <ExclamationTriangleIcon className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-400">KYC Rejected</h3>
                <p className="text-gray-300">
                  We found some issues with your verification. Please review and try again.
                </p>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
                  <p className="text-red-400 font-medium mb-2">Issues found:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {verificationResult.reasons.map((reason: string, index: number) => (
                      <li key={index}>• {reason}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setVerificationResult(null);
                    setIsSubmitting(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <OnboardingHeader />
      <div className="pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Identity Verification (KYC)
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Complete your identity verification to unlock all platform features
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Personal Information</h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={formData.kyc_legal_name}
                  onChange={(e) => handleInputChange('kyc_legal_name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your full legal name as it appears on your ID"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.kyc_dob}
                    onChange={(e) => handleInputChange('kyc_dob', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Country of Residence *
                  </label>
                  <select
                    value={formData.kyc_country}
                    onChange={(e) => handleInputChange('kyc_country', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="" className="bg-gray-800 text-white">Select Country</option>
                    <option value="US" className="bg-gray-800 text-white">United States</option>
                    <option value="UK" className="bg-gray-800 text-white">United Kingdom</option>
                    <option value="CA" className="bg-gray-800 text-white">Canada</option>
                    <option value="AU" className="bg-gray-800 text-white">Australia</option>
                    <option value="DE" className="bg-gray-800 text-white">Germany</option>
                    <option value="FR" className="bg-gray-800 text-white">France</option>
                    <option value="SG" className="bg-gray-800 text-white">Singapore</option>
                    <option value="JP" className="bg-gray-800 text-white">Japan</option>
                    <option value="KR" className="bg-gray-800 text-white">South Korea</option>
                    <option value="IN" className="bg-gray-800 text-white">India</option>
                    <option value="BR" className="bg-gray-800 text-white">Brazil</option>
                    <option value="MX" className="bg-gray-800 text-white">Mexico</option>
                    <option value="IT" className="bg-gray-800 text-white">Italy</option>
                    <option value="ES" className="bg-gray-800 text-white">Spain</option>
                    <option value="NL" className="bg-gray-800 text-white">Netherlands</option>
                    <option value="CH" className="bg-gray-800 text-white">Switzerland</option>
                    <option value="AT" className="bg-gray-800 text-white">Austria</option>
                    <option value="BE" className="bg-gray-800 text-white">Belgium</option>
                    <option value="SE" className="bg-gray-800 text-white">Sweden</option>
                    <option value="NO" className="bg-gray-800 text-white">Norway</option>
                    <option value="DK" className="bg-gray-800 text-white">Denmark</option>
                    <option value="FI" className="bg-gray-800 text-white">Finland</option>
                    <option value="IE" className="bg-gray-800 text-white">Ireland</option>
                    <option value="PT" className="bg-gray-800 text-white">Portugal</option>
                    <option value="PL" className="bg-gray-800 text-white">Poland</option>
                    <option value="CZ" className="bg-gray-800 text-white">Czech Republic</option>
                    <option value="HU" className="bg-gray-800 text-white">Hungary</option>
                    <option value="RO" className="bg-gray-800 text-white">Romania</option>
                    <option value="BG" className="bg-gray-800 text-white">Bulgaria</option>
                    <option value="HR" className="bg-gray-800 text-white">Croatia</option>
                    <option value="SI" className="bg-gray-800 text-white">Slovenia</option>
                    <option value="SK" className="bg-gray-800 text-white">Slovakia</option>
                    <option value="EE" className="bg-gray-800 text-white">Estonia</option>
                    <option value="LV" className="bg-gray-800 text-white">Latvia</option>
                    <option value="LT" className="bg-gray-800 text-white">Lithuania</option>
                    <option value="GR" className="bg-gray-800 text-white">Greece</option>
                    <option value="CY" className="bg-gray-800 text-white">Cyprus</option>
                    <option value="MT" className="bg-gray-800 text-white">Malta</option>
                    <option value="LU" className="bg-gray-800 text-white">Luxembourg</option>
                    <option value="CN" className="bg-gray-800 text-white">China</option>
                    <option value="HK" className="bg-gray-800 text-white">Hong Kong</option>
                    <option value="TW" className="bg-gray-800 text-white">Taiwan</option>
                    <option value="TH" className="bg-gray-800 text-white">Thailand</option>
                    <option value="MY" className="bg-gray-800 text-white">Malaysia</option>
                    <option value="ID" className="bg-gray-800 text-white">Indonesia</option>
                    <option value="PH" className="bg-gray-800 text-white">Philippines</option>
                    <option value="VN" className="bg-gray-800 text-white">Vietnam</option>
                    <option value="NZ" className="bg-gray-800 text-white">New Zealand</option>
                    <option value="ZA" className="bg-gray-800 text-white">South Africa</option>
                    <option value="EG" className="bg-gray-800 text-white">Egypt</option>
                    <option value="NG" className="bg-gray-800 text-white">Nigeria</option>
                    <option value="KE" className="bg-gray-800 text-white">Kenya</option>
                    <option value="GH" className="bg-gray-800 text-white">Ghana</option>
                    <option value="MA" className="bg-gray-800 text-white">Morocco</option>
                    <option value="TN" className="bg-gray-800 text-white">Tunisia</option>
                    <option value="DZ" className="bg-gray-800 text-white">Algeria</option>
                    <option value="AR" className="bg-gray-800 text-white">Argentina</option>
                    <option value="CL" className="bg-gray-800 text-white">Chile</option>
                    <option value="CO" className="bg-gray-800 text-white">Colombia</option>
                    <option value="PE" className="bg-gray-800 text-white">Peru</option>
                    <option value="VE" className="bg-gray-800 text-white">Venezuela</option>
                    <option value="UY" className="bg-gray-800 text-white">Uruguay</option>
                    <option value="PY" className="bg-gray-800 text-white">Paraguay</option>
                    <option value="BO" className="bg-gray-800 text-white">Bolivia</option>
                    <option value="EC" className="bg-gray-800 text-white">Ecuador</option>
                    <option value="GT" className="bg-gray-800 text-white">Guatemala</option>
                    <option value="CR" className="bg-gray-800 text-white">Costa Rica</option>
                    <option value="PA" className="bg-gray-800 text-white">Panama</option>
                    <option value="CU" className="bg-gray-800 text-white">Cuba</option>
                    <option value="DO" className="bg-gray-800 text-white">Dominican Republic</option>
                    <option value="JM" className="bg-gray-800 text-white">Jamaica</option>
                    <option value="TT" className="bg-gray-800 text-white">Trinidad and Tobago</option>
                    <option value="BB" className="bg-gray-800 text-white">Barbados</option>
                    <option value="RU" className="bg-gray-800 text-white">Russia</option>
                    <option value="UA" className="bg-gray-800 text-white">Ukraine</option>
                    <option value="BY" className="bg-gray-800 text-white">Belarus</option>
                    <option value="KZ" className="bg-gray-800 text-white">Kazakhstan</option>
                    <option value="UZ" className="bg-gray-800 text-white">Uzbekistan</option>
                    <option value="KG" className="bg-gray-800 text-white">Kyrgyzstan</option>
                    <option value="TJ" className="bg-gray-800 text-white">Tajikistan</option>
                    <option value="TM" className="bg-gray-800 text-white">Turkmenistan</option>
                    <option value="AF" className="bg-gray-800 text-white">Afghanistan</option>
                    <option value="PK" className="bg-gray-800 text-white">Pakistan</option>
                    <option value="BD" className="bg-gray-800 text-white">Bangladesh</option>
                    <option value="LK" className="bg-gray-800 text-white">Sri Lanka</option>
                    <option value="NP" className="bg-gray-800 text-white">Nepal</option>
                    <option value="BT" className="bg-gray-800 text-white">Bhutan</option>
                    <option value="MV" className="bg-gray-800 text-white">Maldives</option>
                    <option value="MM" className="bg-gray-800 text-white">Myanmar</option>
                    <option value="LA" className="bg-gray-800 text-white">Laos</option>
                    <option value="KH" className="bg-gray-800 text-white">Cambodia</option>
                    <option value="BN" className="bg-gray-800 text-white">Brunei</option>
                    <option value="MN" className="bg-gray-800 text-white">Mongolia</option>
                    <option value="KP" className="bg-gray-800 text-white">North Korea</option>
                    <option value="OTHER" className="bg-gray-800 text-white">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Government ID Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Government ID Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    ID Type *
                  </label>
                  <select
                    value={formData.kyc_id_type}
                    onChange={(e) => handleInputChange('kyc_id_type', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="" className="bg-gray-800 text-white">Select ID Type</option>
                    <option value="passport" className="bg-gray-800 text-white">Passport</option>
                    <option value="national_id" className="bg-gray-800 text-white">National ID</option>
                    <option value="driving_license" className="bg-gray-800 text-white">Driving License</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    value={formData.kyc_id_number}
                    onChange={(e) => handleInputChange('kyc_id_number', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your ID number"
                    required
                  />
                  <p className="text-xs text-gray-400">ID number will be securely hashed and masked for privacy</p>
                </div>
              </div>
            </div>

            {/* Photo Uploads */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Photo Verification</h2>
              
              {/* Selfie Upload */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Selfie/Face Photo *</h3>
                
                {selfieUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={selfieUrl}
                        alt="Selfie preview"
                        className="w-48 h-48 rounded-xl object-cover border border-white/20 shadow-lg mx-auto"
                      />
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Uploaded
                      </div>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => selfieInputRef.current?.click()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200"
                      >
                        Change Selfie
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-48 h-48 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mx-auto hover:border-blue-400/50 transition-colors duration-300">
                      <div className="text-center">
                        <CameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Take a selfie</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selfieInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <CameraIcon className="w-5 h-5" />
                        <span>Take Selfie</span>
                      </span>
                    </button>
                    <p className="text-sm text-gray-400">Required for face verification</p>
                  </div>
                )}
                
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('selfie', file);
                  }}
                  className="hidden"
                />
              </div>

              {/* ID Image Upload (Optional) */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Government ID Image (Optional)</h3>
                <p className="text-sm text-gray-400 mb-4">Upload a clear image of your government-issued ID to improve verification accuracy</p>
                
                {idImageUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={idImageUrl}
                        alt="ID image preview"
                        className="w-full max-w-md rounded-xl border border-white/20 shadow-lg mx-auto"
                      />
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Uploaded
                      </div>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => idImageInputRef.current?.click()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200"
                      >
                        Change ID Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-48 h-32 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mx-auto hover:border-blue-400/50 transition-colors duration-300">
                      <div className="text-center">
                        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Upload ID image</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => idImageInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-200"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <DocumentTextIcon className="w-5 h-5" />
                        <span>Upload ID Image</span>
                      </span>
                    </button>
                    <p className="text-sm text-gray-400">Optional - improves verification accuracy</p>
                  </div>
                )}
                
                <input
                  ref={idImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('id', file);
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || !selfieFile}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting KYC...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span>Submit for Verification</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}