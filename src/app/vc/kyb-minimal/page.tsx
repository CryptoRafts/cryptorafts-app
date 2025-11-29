"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db, doc, getDoc, setDoc, storage, ref, uploadBytes, getDownloadURL } from '@/lib/firebase.client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function VCKYBMinimal() {
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
  const [kybStatus, setKybStatus] = useState('not_submitted');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && db) {
      const checkKYBStatus = async () => {
        try {
          if (!db) return;
          const userDocRef = doc(db!, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setFormData(prev => ({
              ...prev,
              companyName: userData.companyName || '',
              companyEmail: userData.companyEmail || '',
              website: userData.website || '',
              phoneNumber: userData.phoneNumber || '',
              linkedin: userData.linkedin || '',
              twitter: userData.twitter || '',
              telegram: userData.telegram || ''
            }));
            setKybStatus(userData.kybStatus || 'not_submitted');
            
            if (userData.kybStatus === 'approved' || userData.kybStatus === 'verified') {
              router.push('/vc/dashboard-minimal');
            }
          }
        } catch (error) {
          console.error('Error checking KYB status:', error);
        } finally {
          setLoading(false);
        }
      };
      checkKYBStatus();
    }
  }, [user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    setSubmitting(true);
    try {
      if (!db) return;
      await setDoc(doc(db!, 'users', user.uid), {
        ...formData,
        kybStatus: 'pending',
        kybSubmittedAt: new Date(),
        lastUpdated: new Date(),
      }, { merge: true });
      
      alert('KYB application submitted successfully! You will be notified once approved.');
      router.push('/vc/kyb-waiting-minimal');
    } catch (error) {
      console.error('Error submitting KYB:', error);
      alert('Failed to submit KYB application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return <LoadingSpinner />;
  }

  const getStatusDisplay = () => {
    switch (kybStatus.toLowerCase()) {
      case 'approved':
      case 'verified':
        return {
          icon: '✅',
          title: 'KYB Approved!',
          description: 'Your business has been successfully verified.',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
        };
      case 'pending':
        return {
          icon: '⏳',
          title: 'KYB Under Review',
          description: 'Your KYB submission is currently under review.',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
        };
      case 'rejected':
        return {
          icon: '❌',
          title: 'KYB Rejected',
          description: 'Your KYB submission was rejected. Please review and resubmit.',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
        };
      default:
        return {
          icon: '🏢',
          title: 'Start KYB Verification',
          description: 'Verify your business identity to unlock full platform features.',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const isCompleted = kybStatus === 'approved' || kybStatus === 'verified';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center border border-gray-700">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
          <div className="text-4xl">{statusDisplay.icon}</div>
        </div>
        
        <h1 className="text-4xl font-extrabold text-white mb-4">
          {statusDisplay.title}
        </h1>
        
        <p className="text-lg text-gray-300 mb-8">
          {statusDisplay.description}
        </p>

        <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} rounded-xl p-6 mb-8`}>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="text-2xl">{statusDisplay.icon}</div>
            <h3 className={`text-2xl font-semibold ${statusDisplay.color}`}>
              {statusDisplay.title}
            </h3>
          </div>
          <p className="text-gray-300 mb-6">
            {statusDisplay.description}
          </p>
        </div>

        {!isCompleted ? (
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                placeholder="e.g., CryptoRafts Inc."
              />
            </div>

            <div>
              <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-300 mb-2">
                Company Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="companyEmail"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                placeholder="contact@cryptorafts.com"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                placeholder="https://www.cryptorafts.com"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-300 mb-2">LinkedIn Profile URL</label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                placeholder="https://linkedin.com/company/cryptorafts"
              />
            </div>

            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-2">Twitter Profile URL</label>
              <input
                type="url"
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                placeholder="https://twitter.com/cryptorafts"
              />
            </div>

            <div>
              <label htmlFor="telegram" className="block text-sm font-medium text-gray-300 mb-2">Telegram Channel/Group URL</label>
              <input
                type="url"
                id="telegram"
                name="telegram"
                value={formData.telegram}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-gray-400"
                placeholder="https://t.me/cryptoraftscommunity"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.companyName || !formData.companyEmail}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-lg font-semibold rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit KYB Application'}
            </button>
          </form>
        ) : (
          <button
            onClick={() => router.push('/vc/dashboard-minimal')}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-lg font-semibold rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
          >
            Go to Dashboard
          </button>
        )}

        <div className="mt-8 bg-gray-700/30 border border-gray-600 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="text-2xl">✨</div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Business Verification</h3>
              <p className="text-gray-300 text-sm">
                Our AI system streamlines your business verification, ensuring a fast and secure process for all registered entities.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Your business information is encrypted and secure. We never share your data with third parties.
        </p>
      </div>
    </div>
  );
}
