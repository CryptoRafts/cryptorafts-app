"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase.client';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  required: boolean;
  estimatedTime: number; // in minutes
}

interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  totalTime: number;
  estimatedRemaining: number;
}

export default function SmartOnboarding() {
  const { user, claims } = useAuth();
  const pathname = usePathname();
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 'role',
    completedSteps: [],
    totalTime: 0,
    estimatedRemaining: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOnboardingProgress();
    } else {
      // If no user, don't show onboarding
      setIsLoading(false);
    }
  }, [user]);

  const loadOnboardingProgress = async () => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    }

    try {
      const dbInstance = db;
      const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData?.onboarding) {
        setProgress(userData.onboarding);
      } else {
        // Check if user already has role and profile - if so, mark onboarding as completed
        if (userData?.role && userData?.displayName) {
          const completedProgress = {
            currentStep: 'completed',
            completedSteps: ['role', 'profile', 'verification'],
            totalTime: 0,
            estimatedRemaining: 0
          };
          
          await setDoc(doc(dbInstance, 'users', user.uid), {
            onboarding: completedProgress
          }, { merge: true });
          
          setProgress(completedProgress);
        } else {
          // Initialize onboarding only for new users
          const initialProgress = {
            currentStep: 'role',
            completedSteps: [],
            totalTime: 0,
            estimatedRemaining: getEstimatedTotalTime()
          };
          
          await setDoc(doc(dbInstance, 'users', user.uid), {
            onboarding: initialProgress
          }, { merge: true });
          
          setProgress(initialProgress);
        }
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEstimatedTotalTime = (): number => {
    const baseTime = 15; // Base onboarding time
    const roleTime = 5; // Role selection
    const profileTime = 10; // Profile completion
    const verificationTime = claims?.role && ['vc', 'exchange', 'ido', 'agency'].includes(claims.role) ? 20 : 15;
    
    return baseTime + roleTime + profileTime + verificationTime;
  };

  const updateProgress = async (stepId: string, completed: boolean = true) => {
    if (!user || !db) return;

    const updatedProgress = {
      ...progress,
      currentStep: completed ? getNextStep(stepId) : stepId,
      completedSteps: completed 
        ? [...progress.completedSteps, stepId]
        : progress.completedSteps,
      totalTime: progress.totalTime + getStepTime(stepId),
      estimatedRemaining: getEstimatedRemainingTime()
    };

    setProgress(updatedProgress);

    try {
      const dbInstance = db;
      await updateDoc(doc(dbInstance, 'users', user.uid), {
        onboarding: updatedProgress,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
    }
  };

  const getNextStep = (currentStep: string): string => {
    const steps = ['role', 'profile', 'verification'];
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : 'completed';
  };

  const getStepTime = (stepId: string): number => {
    const stepTimes = {
      role: 2,
      profile: 8,
      verification: claims?.role && ['vc', 'exchange', 'ido', 'agency'].includes(claims.role) ? 15 : 10
    };
    return stepTimes[stepId as keyof typeof stepTimes] || 5;
  };

  const getEstimatedRemainingTime = (): number => {
    const remainingSteps = ['role', 'profile', 'verification'].filter(
      step => !progress.completedSteps.includes(step)
    );
    
    return remainingSteps.reduce((total, step) => total + getStepTime(step), 0);
  };

  const getCompletionPercentage = (): number => {
    const totalSteps = 3;
    return Math.round((progress.completedSteps.length / totalSteps) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't show onboarding on signup/login pages
  if (pathname === '/signup' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  if (progress.currentStep === 'completed' || !user) {
    return null; // Onboarding completed or no user
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
            <span className="text-sm font-medium text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
              {getCompletionPercentage()}% Complete
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
          
          {/* Time Estimate */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <span className="text-blue-400">⏱️</span>
              <span>Estimated time remaining: {progress.estimatedRemaining} minutes</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-purple-400">📊</span>
              <span>Total time: {progress.totalTime} minutes</span>
            </span>
          </div>
        </div>

        {/* Current Step */}
        <AnimatePresence mode="wait">
          {progress.currentStep === 'role' && (
            <RoleSelectionStep 
              user={user}
              onComplete={(role) => updateProgress('role')}
            />
          )}
          
          {progress.currentStep === 'profile' && (
            <ProfileCompletionStep 
              user={user}
              role={claims?.role}
              onComplete={() => updateProgress('profile')}
            />
          )}
          
          {progress.currentStep === 'verification' && (
            <VerificationStep 
              user={user}
              role={claims?.role}
              onComplete={() => updateProgress('verification')}
            />
          )}
        </AnimatePresence>

        {/* Skip Option */}
        <div className="mt-8 text-center">
          <button
            onClick={() => updateProgress(progress.currentStep, false)}
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800/50"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Role Selection Component
function RoleSelectionStep({ user, onComplete }: { user: any; onComplete: (role: string) => void }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: 'founder',
      name: 'Founder',
      description: 'Launch and manage your crypto project',
      icon: '🚀',
      requirements: ['Profile photo (PNG)', 'Project documentation', 'Business plan'],
      estimatedTime: '5 min'
    },
    {
      id: 'vc',
      name: 'Venture Capital',
      description: 'Invest in promising crypto startups',
      icon: '💰',
      requirements: ['Company logo (PNG)', 'Legal documentation', 'Investment thesis'],
      estimatedTime: '10 min'
    },
    {
      id: 'exchange',
      name: 'Exchange',
      description: 'Manage listings and trading partnerships',
      icon: '🏛️',
      requirements: ['Company logo (PNG)', 'Regulatory compliance', 'Trading infrastructure'],
      estimatedTime: '10 min'
    },
    {
      id: 'ido',
      name: 'IDO Launchpad',
      description: 'Launch and manage token offerings',
      icon: '🎯',
      requirements: ['Company logo (PNG)', 'Launch procedures', 'Compliance framework'],
      estimatedTime: '10 min'
    },
    {
      id: 'influencer',
      name: 'Influencer',
      description: 'Create campaigns and partnerships',
      icon: '📢',
      requirements: ['Profile photo (PNG)', 'Social media links', 'Audience metrics'],
      estimatedTime: '5 min'
    },
    {
      id: 'agency',
      name: 'Agency',
      description: 'Provide marketing and consulting services',
      icon: '🏢',
      requirements: ['Company logo (PNG)', 'Service portfolio', 'Client references'],
      estimatedTime: '10 min'
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    // Update user role in database
    updateUserRole(roleId);
    onComplete(roleId);
  };

  const updateUserRole = async (roleId: string) => {
    if (!user || !db) return;
    
    try {
      const dbInstance = db;
      await updateDoc(doc(dbInstance, 'users', user.uid), {
        role: roleId,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Choose Your Role</h3>
        <p className="text-slate-400">Select the role that best describes your involvement in the crypto ecosystem.</p>
      </div>
      
      <div className="space-y-4">
        {roles.map((role) => (
          <motion.button
            key={role.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleRoleSelect(role.id)}
            className={`w-full p-6 rounded-xl border-2 transition-all text-left group ${
              selectedRole === role.id
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : 'border-white/20 bg-slate-800/50 hover:border-white/40 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">{role.icon}</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white text-lg group-hover:text-blue-300 transition-colors">{role.name}</h4>
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                    {role.estimatedTime}
                  </span>
                </div>
                
                <p className="text-sm text-slate-300 mb-3 leading-relaxed line-clamp-2">
                  {role.description}
                </p>
                
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Requirements:
                  </h5>
                  <div className="grid grid-cols-1 gap-1">
                    {role.requirements.slice(0, 3).map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="text-blue-400 flex-shrink-0">•</span>
                        <span className="truncate">{req}</span>
                      </div>
                    ))}
                    {role.requirements.length > 3 && (
                      <div className="text-xs text-slate-400">
                        +{role.requirements.length - 3} more requirements
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Selection indicator */}
              {selectedRole === role.id && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">✓</span>
                  </div>
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Profile Completion Component
function ProfileCompletionStep({ user, role, onComplete }: { user: any; role?: string; onComplete: () => void }) {
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    website: '',
    socials: {
      twitter: '',
      linkedin: '',
      telegram: ''
    }
  });
  const [isUploading, setIsUploading] = useState(false);

  const isOrgRole = role && ['vc', 'exchange', 'ido', 'agency'].includes(role);
  const requiresPNG = isOrgRole ? 'Company logo' : 'Profile photo';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'image/png') {
      alert('Please upload a PNG file only.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Here you would typically upload to Firebase Storage
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('File uploaded:', file.name);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socials: {
        ...prev.socials,
        [platform]: value
      }
    }));
  };

  const handleComplete = async () => {
    if (!formData.displayName.trim()) {
      alert('Please enter your name.');
      return;
    }

    if (!db) {
      alert('Database not available. Please try again later.');
      return;
    }

    try {
      // Save profile data to Firestore
      const dbInstance = db;
      await updateDoc(doc(dbInstance, 'users', user.uid), {
        displayName: formData.displayName,
        bio: formData.bio,
        website: formData.website,
        socials: formData.socials,
        profileCompleted: true,
        lastUpdated: Date.now()
      });

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Complete Your Profile</h3>
        <p className="text-slate-400">
          {isOrgRole ? 'Tell us about your organization' : 'Tell us about yourself'}
        </p>
      </div>
      
      <div className="space-y-6">
        {/* PNG Upload Requirement */}
        <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-blue-400 text-xl">📷</span>
            <h4 className="font-semibold text-white">Required: {requiresPNG}</h4>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Upload a PNG file (max 5MB) for your {isOrgRole ? 'company logo' : 'profile photo'}
          </p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/png"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload PNG File'}
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              {isOrgRole ? 'Organization Name' : 'Full Name'} *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={isOrgRole ? 'Your organization name' : 'Your full name'}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            {isOrgRole ? 'Organization Description' : 'Bio'} (max 280 characters)
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            maxLength={280}
            rows={4}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder={isOrgRole ? 'Brief description of your organization and services' : 'Tell us about yourself and your background'}
          />
          <div className="flex justify-end">
            <p className="text-xs text-slate-400">{formData.bio.length}/280</p>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white">Social Media Links (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Twitter/X</label>
              <input
                type="url"
                value={formData.socials.twitter}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                placeholder="https://twitter.com/username"
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">LinkedIn</label>
              <input
                type="url"
                value={formData.socials.linkedin}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Telegram</label>
              <input
                type="url"
                value={formData.socials.telegram}
                onChange={(e) => handleSocialChange('telegram', e.target.value)}
                placeholder="https://t.me/username"
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <button
          onClick={handleComplete}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Complete Profile
        </button>
      </div>
    </motion.div>
  );
}

// Verification Step Component
function VerificationStep({ user, role, onComplete }: { user: any; role?: string; onComplete: () => void }) {
  const router = useRouter();
  const isOrgRole = role && ['vc', 'exchange', 'ido', 'agency'].includes(role);
  const verificationType = isOrgRole ? 'KYB (Know Your Business)' : 'KYC (Know Your Customer)';

  const handleStartVerification = async () => {
    if (!db) {
      alert('Database not available. Please try again later.');
      return;
    }

    try {
      // Update user verification status
      const dbInstance = db;
      await updateDoc(doc(dbInstance, 'users', user.uid), {
        verificationStarted: true,
        verificationType: verificationType,
        lastUpdated: Date.now()
      });

      // Mark verification step as completed
      onComplete();

      // Redirect to verification page using Next.js router
      router.push(isOrgRole ? '/kyb' : '/kyc');
    } catch (error) {
      console.error('Error starting verification:', error);
      alert('Failed to start verification. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Identity Verification</h3>
        <p className="text-slate-400">
          Complete {verificationType} verification to unlock all platform features.
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Verification Info */}
        <div className="p-5 bg-slate-800/50 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-orange-400 text-2xl">🔐</span>
            <div>
              <h4 className="font-semibold text-white text-lg">{verificationType}</h4>
              <p className="text-sm text-slate-400">AI-powered verification process</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-semibold text-white">What you'll need:</h5>
              <ul className="space-y-2 text-sm text-slate-300">
                {isOrgRole ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Company registration documents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Director identification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Proof of business address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Organization structure</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Government-issued ID</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Proof of address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Selfie with liveness check</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Face match verification</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-semibold text-white">AI Processing:</h5>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>OCR document reading</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Face liveness detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Sanctions/PEP screening</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Risk assessment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white text-lg">Verification Process:</h4>
          
          <div className="space-y-3">
            {isOrgRole ? (
              <>
                <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-xl">📄</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Upload Company Documents</p>
                    <p className="text-sm text-slate-400">Registration, articles of incorporation</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-orange-400 text-xl">👥</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Director Information</p>
                    <p className="text-sm text-slate-400">List of directors and key personnel</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xl">🏢</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Business Address Verification</p>
                    <p className="text-sm text-slate-400">Proof of business location</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-xl">🆔</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">ID Document Upload</p>
                    <p className="text-sm text-slate-400">Front and back of government ID</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-orange-400 text-xl">🏠</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Proof of Address</p>
                    <p className="text-sm text-slate-400">Utility bill or bank statement</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xl">📸</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Selfie & Liveness Check</p>
                    <p className="text-sm text-slate-400">Live photo with face verification</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Start Verification Button */}
        <button
          onClick={handleStartVerification}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Start {verificationType} Verification
        </button>
        
        <div className="text-center">
          <p className="text-xs text-slate-400">
            Verification typically takes 2-5 minutes with AI processing
          </p>
        </div>
      </div>
    </motion.div>
  );
}
