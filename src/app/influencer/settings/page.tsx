'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase } from '@/lib/firebase-utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function InfluencerSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    niche: '',
    followerCount: '',
    country: '',
    city: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const isReady = await waitForFirebase(5000);
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
          setFormData({
            name: userData.name || '',
            bio: userData.bio || '',
            niche: userData.niche || '',
            followerCount: userData.followerCount?.toString() || '',
            country: userData.country || '',
            city: userData.city || '',
            email: userData.email || user.email || '',
            phone: userData.phone || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database not available. Please refresh and try again.');
        setSaving(false);
        return;
      }
      await setDoc(doc(dbInstance, 'users', user.uid), {
        ...formData,
        followerCount: parseInt(formData.followerCount) || 0,
        updatedAt: Date.now()
      }, { merge: true });

      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
      >
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="neo-glass-card rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
            <p className="text-white/90 text-lg">Manage your influencer profile and preferences</p>
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-sm flex items-center gap-2">
                <NeonCyanIcon type="info" size={16} className="text-yellow-400" />
                <span>You can update your profile information below. For major changes or verification updates, please contact support.</span>
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-center">
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 border-2 border-cyan-400/20">
              <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Niche</label>
                  <input
                    type="text"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                    placeholder="e.g., Crypto, DeFi, NFT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Follower Count</label>
                  <input
                    type="number"
                    value={formData.followerCount}
                    onChange={(e) => setFormData({ ...formData, followerCount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                    placeholder="Enter your follower count"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                    placeholder="Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-white/80">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/30 focus:outline-none text-white placeholder-white/40"
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary px-8 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
}
