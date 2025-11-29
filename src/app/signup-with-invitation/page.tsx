'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import BlockchainCard from "@/components/ui/BlockchainCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import StandardLoading from "@/components/ui/StandardLoading";
import { 
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  PhotoIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface InviteValidation {
  isValid: boolean;
  invite?: {
    code: string;
    email?: string;
    fullName?: string;
    role: string;
    roomScope: string;
    expiresAt: Date;
  };
  error?: string;
}

interface ProfileData {
  fullName: string;
  avatar?: File;
  timezone: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export default function SignupWithInvitation() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('code');
  
  const [validation, setValidation] = useState<InviteValidation | null>(null);
  const [validating, setValidating] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    acceptTerms: false,
    acceptPrivacy: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!inviteCode) {
      router.push('/signup');
      return;
    }

    // Simulate invite validation
    validateInviteCode(inviteCode);
  }, [inviteCode, router]);

  const validateInviteCode = async (code: string) => {
    setValidating(true);
    
    try {
      const response = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setValidation({
          isValid: true,
          invite: {
            code: data.invite.code,
            email: data.invite.email,
            fullName: data.invite.fullName || '',
            role: data.invite.role,
            roomScope: data.invite.roomScope,
            expiresAt: new Date(data.invite.expiresAt)
          }
        });
        
        // Pre-fill form if we have the name
        if (data.invite.fullName) {
          setProfileData(prev => ({
            ...prev,
            fullName: data.invite.fullName
          }));
        }
      } else {
        setValidation({
          isValid: false,
          error: data.error || 'Invalid invite code'
        });
      }
    } catch (error) {
      console.error('Error validating invite code:', error);
      setValidation({
        isValid: false,
        error: 'Failed to validate invite code. Please try again.'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      alert('Avatar file size must be 500KB or less');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setProfileData(prev => ({ ...prev, avatar: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    if (!profileData.acceptTerms || !profileData.acceptPrivacy) {
      alert('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    if (!validation?.invite) {
      alert('Invalid invite code');
      return;
    }

    setSubmitting(true);

    try {
      // Mark invite code as used
      await fetch('/api/validate-invite', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: validation.invite.code, 
          action: 'use' 
        }),
      });

      // User needs to complete real authentication
      alert(`✅ Invite accepted! Please sign up or log in to continue.`);
      
      // Redirect to signup with role pre-filled
      router.push(`/signup?role=${validation.invite.role}&invite=${validation.invite.code}`);
      setSubmitting(false);
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create account. Please try again.');
      setSubmitting(false);
    }
  };

  if (isLoading || validating) {
    return (
      <div className="min-h-screen relative neo-blue-background">
        <div className="container-perfect relative z-10 flex items-center justify-center">
          <StandardLoading 
            title="Validating Invite" 
            message="Checking your invite code..." 
          />
        </div>
      </div>
    );
  }

  if (!validation?.isValid) {
    return (
      <div className="min-h-screen relative neo-blue-background">
        <div className="container-perfect relative z-10 flex items-center justify-center">
          <div className="max-w-md w-full">
            <BlockchainCard variant="default" size="lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-4">Invalid Invite Code</h1>
                <p className="text-white/70 mb-6">{validation?.error}</p>
                
                <div className="space-y-3">
                  <AnimatedButton
                    variant="primary"
                    size="md"
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Go to Login
                  </AnimatedButton>
                  
                  <AnimatedButton
                    variant="secondary"
                    size="md"
                    onClick={() => router.push('/signup')}
                    className="w-full"
                  >
                    Create Account
                  </AnimatedButton>
                </div>
              </div>
            </BlockchainCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative neo-blue-background">
      <div className="container-perfect relative z-10 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Complete Your Profile</h1>
            <p className="text-white/60 text-lg">You've been invited to join a VC team</p>
          </div>

          {/* Invite Info */}
          <BlockchainCard variant="default" size="lg" className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Invite Validated</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Invite Code:</span>
                <code className="ml-2 text-white font-mono bg-black/40 px-2 py-1 rounded">
                  {validation.invite?.code}
                </code>
              </div>
              <div>
                <span className="text-white/60">Role:</span>
                <span className="ml-2 text-white capitalize">{validation.invite?.role}</span>
              </div>
              <div>
                <span className="text-white/60">Room Access:</span>
                <span className="ml-2 text-white capitalize">
                  {validation.invite?.roomScope.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-white/60">Expires:</span>
                <span className="ml-2 text-white">
                  {validation.invite?.expiresAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          </BlockchainCard>

          {/* Profile Form */}
          <BlockchainCard variant="default" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Avatar (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    {profileData.avatar ? (
                      <img 
                        src={URL.createObjectURL(profileData.avatar)} 
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatar"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-colors inline-flex items-center space-x-2"
                    >
                      <PhotoIcon className="w-4 h-4" />
                      <span>Upload Avatar</span>
                    </label>
                    <p className="text-white/40 text-xs mt-1">PNG, max 500KB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Time Zone
                </label>
                <div className="relative">
                  <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">EST (Eastern Time)</option>
                    <option value="America/Chicago">CST (Central Time)</option>
                    <option value="America/Denver">MST (Mountain Time)</option>
                    <option value="America/Los_Angeles">PST (Pacific Time)</option>
                    <option value="Europe/London">GMT (London)</option>
                    <option value="Europe/Paris">CET (Central European Time)</option>
                    <option value="Asia/Tokyo">JST (Japan Standard Time)</option>
                    <option value="Asia/Shanghai">CST (China Standard Time)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={profileData.acceptTerms}
                    onChange={(e) => setProfileData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="terms" className="text-white/80 text-sm">
                    I accept the <a href="#" className="text-blue-400 hover:text-blue-300 underline">Terms of Service</a>
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={profileData.acceptPrivacy}
                    onChange={(e) => setProfileData(prev => ({ ...prev, acceptPrivacy: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="privacy" className="text-white/80 text-sm">
                    I accept the <a href="#" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a>
                  </label>
                </div>
              </div>

                <div className="flex space-x-4">
                <AnimatedButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => router.push('/login')}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </AnimatedButton>
                
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting || !profileData.fullName.trim() || !profileData.acceptTerms || !profileData.acceptPrivacy}
                  className="flex-1"
                >
                  {submitting ? 'Creating Account...' : 'Join Team'}
                </AnimatedButton>
              </div>
            </form>
          </BlockchainCard>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-white/60 text-sm">
              <ClockIcon className="w-4 h-4" />
              <span>This invite expires on {validation.invite?.expiresAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
