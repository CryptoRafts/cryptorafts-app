'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface FounderProfile {
  displayName: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  company?: string;
  experience?: string;
  education?: string;
  kycVerified: boolean;
  notifications: {
    email: boolean;
    deals: boolean;
    projects: boolean;
    marketing: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

export default function FounderSettingsPage() {
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<FounderProfile>({
    displayName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: '',
    company: '',
    experience: '',
    education: '',
    kycVerified: false,
    notifications: {
      email: true,
      deals: true,
      projects: true,
      marketing: false,
    },
    privacy: {
      profilePublic: true,
      showEmail: false,
      showPhone: false,
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'notifications' | 'privacy' | 'security'>('profile');

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      try {
        const dbInstance = ensureDb();
        if (!dbInstance) {
          setLoading(false);
          return;
        }

        // Real-time listener for user profile
        const userDocRef = doc(dbInstance, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            setProfile(prev => ({
              ...prev,
              displayName: userData.displayName || user.displayName || '',
              email: userData.email || user.email || '',
              phone: userData.phone || '',
              bio: userData.bio || '',
              location: userData.location || '',
              website: userData.website || '',
              linkedin: userData.linkedin || '',
              twitter: userData.twitter || '',
              company: userData.company || '',
              experience: userData.experience || '',
              education: userData.education || '',
              kycVerified: userData.kycVerified || false,
              notifications: userData.notifications || prev.notifications,
              privacy: userData.privacy || prev.privacy,
            }));
          } else {
            // Create initial profile
            setDoc(userDocRef, {
              displayName: user.displayName || '',
              email: user.email || '',
              role: 'founder',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          setLoading(false);
        }, createSnapshotErrorHandler('founder settings profile'));

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up profile listener:', error);
        setLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setSaveStatus('error');
        setSaving(false);
        return;
      }
      const userDocRef = doc(dbInstance, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...profile,
        updatedAt: new Date(),
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', iconType: 'user' },
    { id: 'team', name: 'Team', iconType: 'users' },
    { id: 'notifications', name: 'Notifications', iconType: 'bell' },
    { id: 'privacy', name: 'Privacy', iconType: 'shield' },
    { id: 'security', name: 'Security', iconType: 'shield' },
  ];

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black"
      >
        {/* Main Content */}
        {/* Spacer for fixed header */}
        <div className="h-20 sm:h-24 md:h-28 flex-shrink-0"></div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-8 mb-8 border-2 border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <NeonCyanIcon type="settings" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-white/80 text-lg">Manage your account preferences and profile</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30'
                          : 'text-cyan-400/70 hover:text-white hover:bg-black/60 border border-transparent'
                      }`}
                    >
                      <NeonCyanIcon type={tab.iconType as any} size={20} className="text-current" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-8 border-2 border-cyan-400/20 shadow-lg shadow-cyan-500/10">
                {/* Save Status */}
                {saveStatus === 'success' && (
                  <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl mb-6 flex items-center">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    Settings saved successfully!
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✗</span>
                    </div>
                    Failed to save settings. Please try again.
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <NeonCyanIcon type="user" size={24} className="text-cyan-400 mr-3" />
                      Profile Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-semibold mb-2">Display Name *</label>
                        <input
                          type="text"
                          value={profile.displayName}
                          onChange={(e) => handleInputChange('displayName', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="Your display name"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2">Email *</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="your.email@example.com"
                        />
                        <p className="text-cyan-400/70 text-xs mt-1">Note: Changing email will require verification</p>
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2">Phone</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2">Location</label>
                        <input
                          type="text"
                          value={profile.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all resize-none"
                        placeholder="Tell us about yourself and your experience in crypto..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-semibold mb-2">Company</label>
                        <input
                          type="text"
                          value={profile.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="Your company name"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2">Experience</label>
                        <input
                          type="text"
                          value={profile.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="e.g., 5+ years in DeFi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Education</label>
                      <input
                        type="text"
                        value={profile.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                        placeholder="Your educational background"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-white font-semibold mb-2">Website</label>
                        <input
                          type="url"
                          value={profile.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2">LinkedIn</label>
                        <input
                          type="url"
                          value={profile.linkedin}
                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2">Twitter</label>
                        <input
                          type="url"
                          value={profile.twitter}
                          onChange={(e) => handleInputChange('twitter', e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border-2 border-cyan-400/20 rounded-xl text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400/50 transition-all"
                          placeholder="https://twitter.com/yourhandle"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Management Tab */}
                {activeTab === 'team' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <NeonCyanIcon type="users" size={24} className="text-blue-400 mr-3" />
                      Team Management
                    </h3>

                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Team Members</h4>
                        <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
                          + Add Team Member
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm mb-6">
                        Manage your team members and their roles. Team members can help with project management and collaboration.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="neo-glass-card rounded-xl p-4 border border-cyan-400/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center text-white font-semibold border border-cyan-400/30 shadow-lg shadow-cyan-500/20">
                                {profile.displayName?.charAt(0) || 'Y'}
                              </div>
                              <div>
                                <h5 className="text-white font-semibold">{profile.displayName || 'You'}</h5>
                                <p className="text-gray-400 text-sm">Founder & CEO</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                              Owner
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
                            <NeonCyanIcon type="users" size={32} className="text-cyan-400/70" />
                          </div>
                          <h5 className="text-white font-semibold mb-2">No Team Members Yet</h5>
                          <p className="text-gray-400 text-sm mb-4">
                            Add team members to collaborate on your projects and manage your startup together.
                          </p>
                          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
                            Invite Team Members
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Team Benefits</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <div>
                            <h5 className="text-white font-semibold text-sm">Collaborative Project Management</h5>
                            <p className="text-gray-300 text-xs">Work together on pitch decks and project planning</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <div>
                            <h5 className="text-white font-semibold text-sm">Shared Access</h5>
                            <p className="text-gray-300 text-xs">Team members can view and edit project details</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <div>
                            <h5 className="text-white font-semibold text-sm">Role-Based Permissions</h5>
                            <p className="text-gray-300 text-xs">Control what each team member can access</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <div>
                            <h5 className="text-white font-semibold text-sm">Real-time Notifications</h5>
                            <p className="text-gray-300 text-xs">Stay updated on team activities and changes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <NeonCyanIcon type="bell" size={24} className="text-blue-400 mr-3" />
                      Notification Preferences
                    </h3>

                    <div className="space-y-6">
                      {Object.entries(profile.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
                          <div>
                            <h4 className="text-white font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                            <p className="text-gray-400 text-sm">
                              {key === 'email' && 'Receive email notifications'}
                              {key === 'deals' && 'Get notified about new deal rooms and investor interest'}
                              {key === 'projects' && 'Updates about your project submissions'}
                              {key === 'marketing' && 'Marketing emails and platform updates'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleInputChange(`notifications.${key}`, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-black/60 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <NeonCyanIcon type="shield" size={24} className="text-green-400 mr-3" />
                      Privacy Settings
                    </h3>

                    <div className="space-y-6">
                      {Object.entries(profile.privacy).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
                          <div>
                            <h4 className="text-white font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                            <p className="text-gray-400 text-sm">
                              {key === 'profilePublic' && 'Make your profile visible to other users'}
                              {key === 'showEmail' && 'Display your email address on your profile'}
                              {key === 'showPhone' && 'Display your phone number on your profile'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleInputChange(`privacy.${key}`, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-black/60 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <NeonCyanIcon type="shield" size={24} className="text-red-400 mr-3" />
                      Security Settings
                    </h3>

                    <div className="space-y-6">
                      <div className="p-6 neo-glass-card rounded-xl border border-cyan-400/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-semibold">KYC Verification</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            profile.kycVerified 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {profile.kycVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                          Complete KYC verification to increase trust with investors and unlock additional features.
                        </p>
                        <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
                          {profile.kycVerified ? 'Update KYC' : 'Start KYC Verification'}
                        </button>
                      </div>

                      <div className="p-6 neo-glass-card rounded-xl border border-cyan-400/20">
                        <h4 className="text-white font-semibold mb-2">Change Password</h4>
                        <p className="text-gray-400 text-sm mb-4">
                          Update your password to keep your account secure.
                        </p>
                        <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
                          Change Password
                        </button>
                      </div>

                      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <h4 className="text-red-400 font-semibold mb-2">Delete Account</h4>
                        <p className="text-gray-400 text-sm mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-8 border-t border-gray-600">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
