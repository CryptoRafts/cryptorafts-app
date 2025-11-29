"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

const roles = [
  {
    id: 'founder',
    name: 'Founder',
    description: 'Launch your crypto project and connect with investors',
    iconType: 'rocket',
    color: 'from-blue-500 to-cyan-500',
    isIndividual: true
  },
  {
    id: 'vc',
    name: 'VC',
    description: 'Discover and invest in promising crypto startups',
    iconType: 'dollar',
    color: 'from-green-500 to-emerald-500',
    isIndividual: false
  },
  {
    id: 'exchange',
    name: 'Exchange',
    description: 'List and manage crypto trading pairs',
    iconType: 'globe',
    color: 'from-purple-500 to-violet-500',
    isIndividual: false
  },
  {
    id: 'ido',
    name: 'IDO Launchpad',
    description: 'Launch token sales and manage whitelists',
    iconType: 'lightbulb',
    color: 'from-orange-500 to-red-500',
    isIndividual: false
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Create crypto marketing campaigns and content',
    iconType: 'users',
    color: 'from-pink-500 to-rose-500',
    isIndividual: true
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'Provide marketing services to crypto projects',
    iconType: 'settings',
    color: 'from-indigo-500 to-blue-500',
    isIndividual: false
  }
];

export default function RegistrationFlow() {
  const [step, setStep] = useState<'auth' | 'role' | 'profile'>('auth');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    displayName: '',
    bio: '',
    website: '',
    socials: {
      twitter: '',
      linkedin: '',
      telegram: ''
    },
    // Organization fields
    legalName: '',
    country: '',
    primaryContact: {
      name: '',
      email: ''
    },
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const router = useRouter();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      // Set basic user data
      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
        onboardingStep: 'role_selection'
      });

      setStep('role');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      // Set basic user data
      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        onboardingStep: 'role_selection'
      });

      setStep('role');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (roleId: string) => {
    setSelectedRole(roleId);
    setFormData(prev => ({ ...prev, role: roleId }));
    setStep('profile');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!auth.currentUser) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      const roleData = roles.find(r => r.id === selectedRole);
      
      const userData = {
        email: user.email,
        displayName: formData.displayName,
        role: selectedRole,
        profileCompleted: true,
        onboardingStep: 'verification',
        createdAt: new Date(),
        // Individual fields
        ...(roleData?.isIndividual && {
          bio: formData.bio,
          website: formData.website,
          socials: formData.socials
        }),
        // Organization fields
        ...(!roleData?.isIndividual && {
          legalName: formData.legalName,
          country: formData.country,
          primaryContact: formData.primaryContact,
          description: formData.description
        })
      };

      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      await setDoc(doc(firestore, 'users', user.uid), userData);

      // Redirect to verification
      router.push(`/${selectedRole}/verification`);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-white">Create Account</h2>
            <p className="mt-2 text-sm text-white/60">
              Join the crypto ecosystem
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleAuthSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-neon-primary disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-white/60">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full btn-neon-ghost disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="text-center">
            <p className="text-white/60">
              Already have an account?{' '}
              <a href="/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Role</h2>
            <p className="text-white/60">
              Select the role that best describes your position in the crypto ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelection(role.id)}
                  className="p-6 rounded-xl border-2 border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${role.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <NeonCyanIcon type={role.iconType as any} size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{role.name}</h3>
                  <p className="text-sm text-white/70">{role.description}</p>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setStep('auth')}
              className="text-white/60 hover:text-white/80 text-sm"
            >
              ← Back to registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Complete Your Profile</h2>
            <p className="text-white/60">
              {selectedRoleData?.isIndividual 
                ? 'Add your personal information and profile photo'
                : 'Add your organization information and logo'
              }
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <NeonCyanIcon type="photo" size={20} className="text-current" />
                {selectedRoleData?.isIndividual ? 'Profile Photo' : 'Company Logo'}
              </h3>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                <NeonCyanIcon type="photo" size={48} className="text-white/40 mx-auto mb-4" />
                <p className="text-white/60 mb-2">
                  Upload a PNG {selectedRoleData?.isIndividual ? 'profile photo' : 'company logo'}
                </p>
                <p className="text-sm text-white/40">Max 5MB, PNG format required</p>
                <button
                  type="button"
                  className="mt-4 btn-neon-secondary text-sm"
                >
                  Choose File
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {selectedRoleData?.isIndividual ? 'Full Name' : 'Legal Company Name'}
                </label>
                <input
                  type="text"
                  required
                  value={selectedRoleData?.isIndividual ? formData.displayName : formData.legalName}
                  onChange={(e) => setFormData({
                    ...formData, 
                    [selectedRoleData?.isIndividual ? 'displayName' : 'legalName']: e.target.value
                  })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={selectedRoleData?.isIndividual ? 'Enter your full name' : 'Enter legal company name'}
                />
              </div>

              {selectedRoleData?.isIndividual ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Short Bio (max 280 characters)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={280}
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                    <p className="text-xs text-white/40 mt-1">{formData.bio.length}/280</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Country
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="SG">Singapore</option>
                      <option value="CH">Switzerland</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                      <option value="KR">South Korea</option>
                      <option value="AE">United Arab Emirates</option>
                      <option value="HK">Hong Kong</option>
                      <option value="NL">Netherlands</option>
                      <option value="LU">Luxembourg</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      One-line Description
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of your organization"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Primary Contact Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.primaryContact.name}
                        onChange={(e) => setFormData({
                          ...formData, 
                          primaryContact: {...formData.primaryContact, name: e.target.value}
                        })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Primary Contact Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.primaryContact.email}
                        onChange={(e) => setFormData({
                          ...formData, 
                          primaryContact: {...formData.primaryContact, email: e.target.value}
                        })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('role')}
                className="flex-1 btn-neon-ghost"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-neon-primary disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    Complete Profile
                    <NeonCyanIcon type="arrow-right" size={16} className="text-current ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
