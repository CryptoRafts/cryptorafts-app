"use client";
import React, { useState, useEffect } from 'react';
import { useSimpleAuth, useSimpleAuthActions } from '@/lib/auth-simple';
import { useRouter } from 'next/navigation';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { raftai } from '@/lib/raftai';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  required: boolean;
}

interface ProfileData {
  displayName: string;
  bio: string;
  website: string;
  socials: {
    twitter: string;
    linkedin: string;
    telegram: string;
    github: string;
  };
  profilePhoto?: File;
}

interface KYCData {
  vendorRef?: string;
  clientToken?: string;
  status: 'pending' | 'approved' | 'rejected';
  riskScore?: number;
  reasons?: string[];
  cooldownUntil?: number;
}

interface KYBData {
  organizationName: string;
  registrationNumber: string;
  country: string;
  website: string;
  documents: File[];
  members: Array<{
    name: string;
    email: string;
    role: string;
    ownership: string;
  }>;
}

// Profile Completion Step
function ProfileStep({ data, onDataUpdate, onNext, onPrevious }: any) {
  const [formData, setFormData] = useState<ProfileData>({
    displayName: data.displayName || '',
    bio: data.bio || '',
    website: data.website || '',
    socials: data.socials || {
      twitter: '',
      linkedin: '',
      telegram: '',
      github: ''
    },
    profilePhoto: data.profilePhoto
  });

  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('socials.')) {
      const [, socialField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        socials: { ...prev.socials, [socialField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    onDataUpdate(formData);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profile-photos/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      onDataUpdate({ ...formData, profilePhotoUrl: downloadURL });
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const canProceed = formData.displayName.trim().length > 0 && 
                    formData.bio.trim().length > 0 && 
                    formData.bio.length <= 280;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
        <p className="text-white/70">Tell us about yourself and your project</p>
      </div>

      {/* Profile Photo Upload */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
            {formData.profilePhoto ? (
              <img 
                src={URL.createObjectURL(formData.profilePhoto)} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white/60 text-4xl">👤</span>
            )}
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Display Name *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="Your display name"
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">Bio * (≤280 characters)</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              maxLength={280}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Tell us about yourself and your project..."
            />
            <div className="text-right text-white/50 text-sm mt-1">
              {formData.bio.length}/280
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="https://yourproject.com"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-medium mb-4">Social Links</h3>
          
          <div>
            <label className="block text-white font-medium mb-2">Twitter</label>
            <input
              type="text"
              value={formData.socials.twitter}
              onChange={(e) => handleInputChange('socials.twitter', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="@yourhandle"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">LinkedIn</label>
            <input
              type="url"
              value={formData.socials.linkedin}
              onChange={(e) => handleInputChange('socials.linkedin', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Telegram</label>
            <input
              type="text"
              value={formData.socials.telegram}
              onChange={(e) => handleInputChange('socials.telegram', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="@yourhandle"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">GitHub</label>
            <input
              type="text"
              value={formData.socials.github}
              onChange={(e) => handleInputChange('socials.github', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="yourusername"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed || uploading}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed && !uploading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {uploading ? 'Uploading...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// KYC Step
function KYCStep({ data, onDataUpdate, onNext, onPrevious }: any) {
  const [kycData, setKycData] = useState<KYCData>(data || { status: 'pending' });
  const [processing, setProcessing] = useState(false);

  const startKYC = async () => {
    setProcessing(true);
    try {
      // Create vendor session token
      const response = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.userId })
      });

      if (!response.ok) throw new Error('Failed to start KYC');

      const { vendorRef, clientToken } = await response.json();
      
      setKycData(prev => ({ ...prev, vendorRef, clientToken }));
      onDataUpdate({ ...kycData, vendorRef, clientToken });
    } catch (error) {
      console.error('KYC start failed:', error);
      alert('Failed to start KYC verification. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Identity Verification (KYC)</h2>
        <p className="text-white/70">Complete your identity verification to access all features</p>
      </div>

      <div className="bg-white/5 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-400 text-2xl">🆔</span>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-4">Required Documents</h3>
        <ul className="text-white/70 space-y-2 mb-6">
          <li>• Government-issued ID (front and back)</li>
          <li>• Proof of address (utility bill, bank statement)</li>
          <li>• Selfie with liveness verification</li>
        </ul>

        <button
          onClick={startKYC}
          disabled={processing || kycData.vendorRef}
          className={`px-8 py-4 rounded-lg font-medium transition-all ${
            processing || kycData.vendorRef
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {processing ? 'Starting...' : kycData.vendorRef ? 'KYC Session Started' : 'Start KYC Verification'}
        </button>

        {kycData.vendorRef && (
          <p className="text-green-400 text-sm mt-4">
            ✅ KYC session created. Check your email for verification link.
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!kycData.vendorRef}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            kycData.vendorRef
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// KYB Decision Step
function KYBDecisionStep({ data, onDataUpdate, onNext, onPrevious }: any) {
  const [decision, setDecision] = useState<'complete' | 'skip' | null>(null);

  const handleDecision = (choice: 'complete' | 'skip') => {
    setDecision(choice);
    onDataUpdate({ kybDecision: choice });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Business Verification (KYB)</h2>
        <p className="text-white/70">Optional: Verify your business entity for enhanced credibility</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-400 text-2xl">✅</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">Complete KYB Now</h3>
          <p className="text-white/70 mb-6">
            Verify your business entity with registration documents, bylaws, and team information.
            This enhances your credibility with investors and partners.
          </p>
          <button
            onClick={() => handleDecision('complete')}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
              decision === 'complete'
                ? 'bg-green-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            Complete KYB Now
          </button>
        </div>

        <div className="bg-white/5 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-400 text-2xl">⏭️</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">Skip for Now</h3>
          <p className="text-white/70 mb-6">
            You can complete KYB verification later from your settings. 
            This won't block you from submitting your pitch.
          </p>
          <button
            onClick={() => handleDecision('skip')}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
              decision === 'skip'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            Skip KYB
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!decision}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            decision
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// KYB Completion Step (reuse existing KYBVerification component)
function KYBStep({ data, onDataUpdate, onNext, onPrevious }: any) {
  // This would integrate with the existing KYBVerification component
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Business Verification (KYB)</h2>
        <p className="text-white/70">Complete your business entity verification</p>
      </div>

      <div className="bg-white/5 rounded-xl p-8">
        <p className="text-white/70 text-center">
          KYB verification component would be integrated here.
          For now, this is a placeholder.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all"
        >
          Continue (Placeholder)
        </button>
      </div>
    </div>
  );
}

// Pitch Step
function PitchStep({ data, onDataUpdate, onNext, onPrevious }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Submit Your Pitch</h2>
        <p className="text-white/70">Create your project pitch and submit for AI analysis</p>
      </div>

      <div className="bg-white/5 rounded-xl p-8">
        <p className="text-white/70 text-center">
          Pitch submission component would be integrated here.
          This would redirect to the existing pitch page.
        </p>
        
        <div className="text-center mt-6">
          <button
            onClick={() => window.location.href = '/founder/pitch'}
            className="px-8 py-4 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            Go to Pitch Submission
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-all"
        >
          Complete Onboarding
        </button>
      </div>
    </div>
  );
}

export default function FounderOnboarding() {
  const { user, profile, loading } = useSimpleAuth();
  const { updateProfile, updateOnboardingStep } = useSimpleAuthActions();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Complete your profile information',
      component: ProfileStep,
      required: true
    },
    {
      id: 'kyc',
      title: 'Identity Verification',
      description: 'Complete KYC verification',
      component: KYCStep,
      required: true
    },
    {
      id: 'kyb_decision',
      title: 'Business Verification',
      description: 'Decide whether to complete KYB',
      component: KYBDecisionStep,
      required: true
    },
    {
      id: 'kyb',
      title: 'KYB Completion',
      description: 'Complete business verification',
      component: KYBStep,
      required: false
    },
    {
      id: 'pitch',
      title: 'Pitch Submission',
      description: 'Submit your project pitch',
      component: PitchStep,
      required: true
    }
  ];

  // Filter steps based on KYB decision
  const activeSteps = steps.filter(step => {
    if (step.id === 'kyb') {
      return onboardingData.kybDecision === 'complete';
    }
    return true;
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (profile?.role !== 'founder') {
      router.push('/role');
    }
  }, [profile, router]);

  const handleDataUpdate = (stepId: string, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [stepId]: data
    }));
  };

  const handleNext = async () => {
    const currentStepData = onboardingData[activeSteps[currentStep].id];
    
    if (activeSteps[currentStep].id === 'profile') {
      setSaving(true);
      try {
        await updateProfile({
          ...currentStepData,
          profileCompleted: true
        });
        await updateOnboardingStep('kyc');
      } catch (error) {
        console.error('Failed to save profile:', error);
        alert('Failed to save profile. Please try again.');
      } finally {
        setSaving(false);
      }
    } else if (activeSteps[currentStep].id === 'kyc') {
      await updateOnboardingStep('kyb_decision');
    } else if (activeSteps[currentStep].id === 'kyb_decision') {
      if (currentStepData?.kybDecision === 'skip') {
        await updateProfile({ kybSkipped: true });
        await updateOnboardingStep('pitch');
        router.push('/founder/pitch');
        return;
      } else {
        await updateOnboardingStep('kyb');
      }
    } else if (activeSteps[currentStep].id === 'kyb') {
      await updateOnboardingStep('pitch');
      router.push('/founder/pitch');
      return;
    } else if (activeSteps[currentStep].id === 'pitch') {
      await updateOnboardingStep('complete');
      router.push('/founder/dashboard');
      return;
    }

    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCompletionPercentage = () => {
    return Math.round(((currentStep + 1) / activeSteps.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || profile?.role !== 'founder') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>Please select founder role to access this page.</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = activeSteps[currentStep]?.component;

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Founder Onboarding</h1>
          <p className="text-white/70">Complete your setup to start connecting with investors and partners</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>Step {currentStep + 1} of {activeSteps.length}</span>
            <span>{getCompletionPercentage()}% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white/5 rounded-xl p-8">
          <CurrentStepComponent
            data={onboardingData[activeSteps[currentStep]?.id] || {}}
            onDataUpdate={(data: any) => handleDataUpdate(activeSteps[currentStep]?.id, data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            userId={user.uid}
          />
        </div>
      </div>
    </div>
  );
}
