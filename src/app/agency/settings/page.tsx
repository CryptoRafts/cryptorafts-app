'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, ensureStorage } from '@/lib/firebase-utils';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AgencyProfile {
  name: string;
  website: string;
  country: string;
  logoUrl?: string;
  contactEmail: string;
  description?: string;
  services?: string[];
  specialties?: string[];
}

export default function AgencySettings() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState<AgencyProfile | null>(null);

  const services = ['Social Media Marketing', 'Content Creation', 'Community Management', 'PR & Media', 'Influencer Outreach', 'SEO & Analytics'];
  const specialties = ['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'Metaverse', 'Web3', 'Enterprise'];

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const isReady = await waitForFirebase(5000);
        if (!isReady) return;
        
        const dbInstance = ensureDb();
        if (!dbInstance) return;
        
        const userDocRef = doc(dbInstance, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.agency || data.organization) {
            const agencyData = data.agency || data.organization;
            setProfile({
              name: agencyData.name || user.displayName || 'Marketing Agency',
              website: agencyData.website || '',
              country: agencyData.country || '',
              logoUrl: agencyData.logoUrl || null,
              contactEmail: agencyData.contactEmail || user.email || '',
              description: agencyData.description || '',
              services: agencyData.services || [],
              specialties: agencyData.specialties || []
            });
            if (agencyData.logoUrl) {
              setLogoPreview(agencyData.logoUrl);
            }
          } else {
            setProfile({
              name: user.displayName || 'Marketing Agency',
              website: '',
              country: '',
              contactEmail: user.email || '',
              services: [],
              specialties: []
            });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleInputChange = (field: keyof AgencyProfile, value: any) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setSaving(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const storageInstance = ensureStorage();
      const storageRef = ref(storageInstance, `agency-logos/${user.uid}/${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setProfile(prev => prev ? { ...prev, logoUrl: downloadURL } : null);
      setSuccess('Logo uploaded successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to upload logo');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      setError(null);
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        setError('Firebase not initialized. Please refresh and try again.');
        setSaving(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database not available. Please refresh and try again.');
        setSaving(false);
        return;
      }

      await updateDoc(doc(dbInstance, 'users', user.uid), {
        agency: profile,
        updatedAt: serverTimestamp()
      });

      setSuccess('✅ Agency profile updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Agency Settings</h2>
                <p className="text-white/90 text-lg">Manage your marketing agency profile and settings</p>
              </div>
              <Link href="/agency/dashboard" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2">
                <NeonCyanIcon type="analytics" size={20} className="text-current" />
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'profile', label: 'Agency Profile', iconType: 'building' },
              { id: 'preferences', label: 'Preferences', iconType: 'settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <NeonCyanIcon type={tab.iconType as any} size={20} className="text-current" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {error && (
                <div className="bg-black/60 backdrop-blur-lg rounded-xl p-4 border-2 border-red-500/30 bg-red-500/10">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-black/60 backdrop-blur-lg rounded-xl p-4 border-2 border-green-500/30 bg-green-500/10">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <div className="bg-black/60 backdrop-blur-lg rounded-xl p-8 border-2 border-cyan-400/20">
                <h3 className="text-xl font-semibold text-white mb-6">Agency Information</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Agency Logo</label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-lg object-cover border border-cyan-400/30" />
                      )}
                      <label className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg cursor-pointer hover:from-cyan-600 hover:to-blue-600 transition-all">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Agency Name *</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Your agency name"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://your-agency.com"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={profile.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe your agency..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Services Offered</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {services.map(service => (
                        <label key={service} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                          <input
                            type="checkbox"
                            checked={profile.services?.includes(service) || false}
                            onChange={(e) => {
                              const svcs = profile.services || [];
                              if (e.target.checked) {
                                handleInputChange('services', [...svcs, service]);
                              } else {
                                handleInputChange('services', svcs.filter(s => s !== service));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-white/80 text-sm">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Specialties</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {specialties.map(specialty => (
                        <label key={specialty} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                          <input
                            type="checkbox"
                            checked={profile.specialties?.includes(specialty) || false}
                            onChange={(e) => {
                              const specs = profile.specialties || [];
                              if (e.target.checked) {
                                handleInputChange('specialties', [...specs, specialty]);
                              } else {
                                handleInputChange('specialties', specs.filter(s => s !== specialty));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-white/80 text-sm">{specialty}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-black/60 backdrop-blur-lg rounded-xl p-8 border-2 border-cyan-400/20">
              <h3 className="text-xl font-semibold text-white mb-6">Preferences</h3>
              <p className="text-cyan-400/70">Preference settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
