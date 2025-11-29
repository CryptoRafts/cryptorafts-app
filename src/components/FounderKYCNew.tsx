"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { onboardingStateManager, OnboardingState } from '@/lib/onboarding-state';
import { 
  UserIcon,
  CameraIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface KYCData {
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  selfieFile?: File;
  idImageFile?: File;
  consentGiven: boolean;
}

export default function FounderKYCNew() {
  const { user } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [formData, setFormData] = useState<KYCData>({
    fullName: '',
    nationality: '',
    dateOfBirth: '',
    idType: '',
    idNumber: '',
    consentGiven: false,
  });
  
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [idImageUrl, setIdImageUrl] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  // Load onboarding state
  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const state = await onboardingStateManager.getOnboardingState();
      setOnboardingState(state);
      
      if (state?.kycData) {
        setFormData(prev => ({
          ...prev,
          fullName: state.kycData?.fullName || '',
          nationality: state.kycData?.nationality || '',
          dateOfBirth: state.kycData?.dateOfBirth || '',
          idType: state.kycData?.idType || '',
          idNumber: state.kycData?.idNumber || '',
        }));
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }
  };

  const handleInputChange = (field: keyof KYCData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileUpload = (type: 'selfie' | 'id', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      
      const url = URL.createObjectURL(file);
      
      if (type === 'selfie') {
        setSelfieFile(file);
        setSelfieUrl(url);
      } else {
        setIdImageFile(file);
        setIdImageUrl(url);
      }
      
      setError('');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.nationality) {
      setError('Nationality is required');
      return false;
    }
    if (!formData.dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }
    if (!formData.idType) {
      setError('ID type is required');
      return false;
    }
    if (!formData.idNumber.trim()) {
      setError('ID number is required');
      return false;
    }
    if (!selfieFile) {
      setError('Selfie photo is required');
      return false;
    }
    if (!idImageFile) {
      setError('Government ID image is required');
      return false;
    }
    if (!formData.consentGiven) {
      setError('You must agree to the terms and privacy policy');
      return false;
    }
    return true;
  };

  const simulateRaftAIKYC = async (kycData: KYCData): Promise<{decision: string, reasons?: string[]}> => {
    // Simulate RaftAI processing (≤5s SLA)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate approval (in production, this would be real AI analysis)
    const isApproved = Math.random() > 0.2; // 80% approval rate
    
    if (isApproved) {
      return { decision: 'approved' };
    } else {
      return { 
        decision: 'rejected',
        reasons: [
          'ID document image quality is insufficient',
          'Selfie does not match ID document',
          'Please ensure all text is clearly visible'
        ]
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Start KYC process
      await onboardingStateManager.startKYC({
        ...formData,
        selfieFile: selfieFile,
        idImageFile: idImageFile,
      });

      setSuccess('KYC submitted successfully! Processing your documents...');

      // Simulate RaftAI processing
      const result = await simulateRaftAIKYC(formData);

      if (result.decision === 'approved') {
        await onboardingStateManager.completeKYC();
        setSuccess('KYC approved! Redirecting to pitch access...');
      } else {
        await onboardingStateManager.rejectKYC(result.reasons || []);
        setError(`KYC rejected: ${result.reasons?.join(', ')}`);
      }
      
      // Reload state
      await loadOnboardingState();
      
    } catch (error: any) {
      console.error('KYC submission error:', error);
      setError(error.message || 'KYC submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show waiting state if KYC is in progress
  if (onboardingState?.kyc === 'in_progress' || onboardingState?.kyc === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-full mb-6">
              <ClockIcon className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Verification in Progress</h1>
            <p className="text-gray-400 mb-6">
              Your documents are being reviewed by our AI system. This usually takes less than 5 minutes.
            </p>
            <div className="w-full bg-gray-700/50 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-gray-500">Processing your verification...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show rejected state if KYC was rejected
  if (onboardingState?.kyc === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6">
                <XCircleIcon className="h-10 w-10 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Verification Failed</h1>
              <p className="text-gray-400 mb-6">
                Your KYC verification was not approved. Please review the issues below and resubmit.
              </p>
            </div>

            {onboardingState.kycData?.rejectionReasons && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <h3 className="text-red-400 font-semibold mb-2">Issues to fix:</h3>
                <ul className="text-red-300 text-sm space-y-1">
                  {onboardingState.kycData.rejectionReasons.map((reason, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                // Reset KYC state to allow resubmission
                onboardingStateManager.updateOnboardingState({ kyc: 'not_started' });
                loadOnboardingState();
              }}
              className="w-full btn btn-primary"
            >
              Fix Issues & Resubmit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
              <UserIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Identity Verification
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Verify your identity to access the platform
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Personal Information</h2>
              
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-white">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full legal name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="nationality" className="block text-sm font-medium text-white">
                  Nationality *
                </label>
                <select
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select your nationality</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="SG">Singapore</option>
                  <option value="CH">Switzerland</option>
                  <option value="NL">Netherlands</option>
                  <option value="SE">Sweden</option>
                  <option value="NO">Norway</option>
                  <option value="DK">Denmark</option>
                  <option value="FI">Finland</option>
                  <option value="IE">Ireland</option>
                  <option value="AT">Austria</option>
                  <option value="BE">Belgium</option>
                  <option value="LU">Luxembourg</option>
                  <option value="NZ">New Zealand</option>
                  <option value="HK">Hong Kong</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-white">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="idType" className="block text-sm font-medium text-white">
                    ID Type *
                  </label>
                  <select
                    id="idType"
                    value={formData.idType}
                    onChange={(e) => handleInputChange('idType', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select ID type</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="idNumber" className="block text-sm font-medium text-white">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    placeholder="Enter ID number"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Document Upload</h2>
              
              {/* Selfie Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Selfie Photo *
                </label>
                <div className="border-2 border-dashed border-gray-500 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                     onClick={() => selfieInputRef.current?.click()}>
                  {selfieUrl ? (
                    <div className="space-y-4">
                      <img src={selfieUrl} alt="Selfie" className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white/20" />
                      <p className="text-green-400 text-sm">Selfie uploaded successfully</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CameraIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-white font-medium">Upload a clear selfie</p>
                        <p className="text-gray-400 text-sm">Look directly at the camera</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('selfie', e)}
                  className="hidden"
                />
              </div>

              {/* ID Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Government ID Image *
                </label>
                <div className="border-2 border-dashed border-gray-500 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                     onClick={() => idInputRef.current?.click()}>
                  {idImageUrl ? (
                    <div className="space-y-4">
                      <img src={idImageUrl} alt="ID" className="w-48 h-32 rounded-lg object-cover mx-auto border-4 border-white/20" />
                      <p className="text-green-400 text-sm">ID document uploaded successfully</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-white font-medium">Upload your government ID</p>
                        <p className="text-gray-400 text-sm">Front/back or MRZ page</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('id', e)}
                  className="hidden"
                />
              </div>
            </div>

            {/* Consent */}
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/20 rounded bg-white/5"
                  checked={formData.consentGiven}
                  onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
                  required
                />
                <span className="text-sm text-gray-300">
                  I consent to KYC verification and agree to the{' '}
                  <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Verification...</span>
                  </div>
                ) : (
                  'Submit for Verification'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
