"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, doc, getDoc, setDoc, storage, ref, uploadBytes, getDownloadURL } from '@/lib/firebase.client';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

function SimpleVCKYB() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    website: '',
    phoneNumber: '',
    linkedin: '',
    twitter: '',
    telegram: ''
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user) {
      setLoading(false);
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    setSubmitting(true);
    try {
      await setDoc(doc(db!, 'users', user.uid), {
        ...formData,
        kybStatus: 'pending',
        kybSubmittedAt: new Date(),
        lastUpdated: new Date(),
      }, { merge: true });
      
      alert('KYB application submitted successfully! You will be notified once approved.');
      router.push('/vc/kyb-waiting');
    } catch (error) {
      console.error('Error submitting KYB:', error);
      alert('Failed to submit KYB application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Complete Your KYB Verification
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
              placeholder="Enter your company name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Email *
            </label>
            <input
              type="email"
              required
              value={formData.companyEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
              placeholder="Enter your company email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
              placeholder="https://yourcompany.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              LinkedIn
            </label>
            <input
              type="url"
              value={formData.linkedin}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Twitter
            </label>
            <input
              type="url"
              value={formData.twitter}
              onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
              placeholder="https://twitter.com/yourcompany"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telegram
            </label>
            <input
              type="url"
              value={formData.telegram}
              onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
              placeholder="https://t.me/yourcompany"
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting || !formData.companyName || !formData.companyEmail}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit KYB Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VCKYBSimple() {
  return (
    <ErrorBoundary>
      <SimpleVCKYB />
    </ErrorBoundary>
  );
}
