'use client';

import React, { useState } from 'react';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { db } from '@/lib/firebase.client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/providers/SimpleAuthProvider';

interface SpotlightApplicationProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function SpotlightApplication({ onClose, onSuccess }: SpotlightApplicationProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    tokenSymbol: '',
    website: '',
    socialLinks: {
      twitter: '',
      telegram: '',
      discord: '',
      linkedin: ''
    },
    fundingGoal: '',
    launchDate: '',
    whySpotlight: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

      if (!db) {
        throw new Error('Firebase not initialized');
      }
      
      await addDoc(collection(db!, 'spotlightApplications'), {
        ...formData,
        projectId: `project-${Date.now()}`,
        founderId: user.uid,
        founderName: user.displayName || user.email,
        founderEmail: user.email,
        slotType: 'premium',
        status: 'pending',
        
        // Add required spotlight fields
        bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1600&h=500&fit=crop',
        logoUrl: 'https://via.placeholder.com/200/06b6d4/ffffff?text=Logo',
        tagline: formData.projectDescription.substring(0, 100) + '...',
        description: formData.projectDescription,
        website: formData.website,
        
        kycVerified: false,
        kybVerified: false,
        verificationBadges: [],
        
        monthlyPrice: 5000,
        startDate: now,
        endDate: endDate,
        
        paymentStatus: 'pending',
        paymentMethod: 'stripe',
        
        // Analytics
        impressions: 0,
        profileViews: 0,
        clicks: 0,
        investmentRaised: 0,
        
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        adminNotes: ''
      });

      alert('✅ Spotlight application submitted successfully! Admin will review it shortly.');
      onSuccess();
    } catch (error) {
      console.error('Error submitting spotlight application:', error);
      alert('❌ Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-black/30 backdrop-blur-sm border-b border-white/10 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <NeonCyanIcon type="star" size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Apply for Spotlight</h2>
                <p className="text-white/60">Get your project featured on our platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <NeonCyanIcon type="close" size={24} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <NeonCyanIcon type="document" size={20} className="text-purple-400" />
              Project Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="Enter your project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Token Symbol *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tokenSymbol}
                  onChange={(e) => handleInputChange('tokenSymbol', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="e.g., CRF"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Project Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.projectDescription}
                onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                placeholder="Describe your project, its goals, and what makes it unique..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="https://yourproject.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Funding Goal
                </label>
                <input
                  type="text"
                  value={formData.fundingGoal}
                  onChange={(e) => handleInputChange('fundingGoal', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="e.g., $500,000"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Social Media Links</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="https://twitter.com/yourproject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Telegram
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.telegram}
                  onChange={(e) => handleInputChange('socialLinks.telegram', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="https://t.me/yourproject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Discord
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.discord}
                  onChange={(e) => handleInputChange('socialLinks.discord', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="https://discord.gg/yourproject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="https://linkedin.com/company/yourproject"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Why should your project be featured in Spotlight? *
              </label>
              <textarea
                required
                rows={4}
                value={formData.whySpotlight}
                onChange={(e) => handleInputChange('whySpotlight', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                placeholder="Explain why your project deserves to be featured in our Spotlight section..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Additional Information
              </label>
              <textarea
                rows={3}
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                placeholder="Any additional information you'd like to share..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <NeonCyanIcon type="star" size={16} className="text-current" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
