"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db } from '@/lib/firebase.client';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  StarIcon,
  SparklesIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface SpotlightApplication {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectLogo?: string;
  projectWebsite?: string;
  projectTwitter?: string;
  projectTelegram?: string;
  projectDiscord?: string;
  selectedPlan: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  applicationStatus: 'pending' | 'approved' | 'rejected' | 'live' | 'expired';
  submittedAt: any;
  approvedAt?: any;
  liveAt?: any;
  expiresAt?: any;
  paymentId?: string;
  totalAmount: number;
  duration: number;
}

const spotlightPlans = [
  {
    id: 'basic',
    name: 'Basic Spotlight',
    duration: 7,
    price: 99,
    color: 'from-blue-500 to-blue-600',
    icon: StarIcon
  },
  {
    id: 'premium',
    name: 'Premium Spotlight',
    duration: 14,
    price: 179,
    color: 'from-purple-500 to-purple-600',
    icon: SparklesIcon
  },
  {
    id: 'enterprise',
    name: 'Enterprise Spotlight',
    duration: 30,
    price: 299,
    color: 'from-gold-500 to-gold-600',
    icon: TrophyIcon
  }
];

export default function SpotlightPaymentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [application, setApplication] = useState<SpotlightApplication | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (applicationId && user) {
      loadApplication();
    }
  }, [applicationId, user, authLoading, router]);

  const loadApplication = async () => {
    if (!applicationId || !user || !db) return;

    try {
      setLoading(true);

      const appDoc = await getDoc(doc(db!, 'spotlightApplications', applicationId));
      
      if (!appDoc.exists()) {
        setError('Application not found');
        setLoading(false);
        return;
      }

      const appData = appDoc.data() as SpotlightApplication;
      
      // Verify ownership
      if (appData.userId !== user.uid) {
        setError('Unauthorized access');
        setLoading(false);
        return;
      }

      setApplication(appData);
      
      // Find the selected plan
      const plan = spotlightPlans.find(p => p.id === appData.selectedPlan);
      setSelectedPlan(plan);

      setLoading(false);
    } catch (error) {
      console.error('Error loading application:', error);
      setError('Failed to load application');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!application || !user || !db) return;

    setProcessing(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock payment ID
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update application with payment details
      await updateDoc(doc(db!, 'spotlightApplications', application.id), {
        paymentStatus: 'completed',
        paymentId: paymentId,
        applicationStatus: 'approved',
        approvedAt: serverTimestamp(),
        liveAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000)
      });

      // Create spotlight entry
      await updateDoc(doc(db!, 'spotlights', application.projectId), {
        projectId: application.projectId,
        projectName: application.projectName,
        projectDescription: application.projectDescription,
        projectLogo: application.projectLogo,
        projectWebsite: application.projectWebsite,
        projectTwitter: application.projectTwitter,
        projectTelegram: application.projectTelegram,
        projectDiscord: application.projectDiscord,
        plan: application.selectedPlan,
        status: 'live',
        startDate: serverTimestamp(),
        endDate: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccess('Payment successful! Your project is now live in the spotlight.');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/founder/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return date.toDate ? date.toDate().toLocaleDateString() : new Date(date).toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading payment details..." />
      </div>
    );
  }

  if (!user || !application) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/worldmap.png")',
          filter: 'brightness(0.1) contrast(1.2) saturate(1.1)'
        }}
      >
        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full">
                <CreditCardIcon className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Complete Your <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Spotlight</span> Payment
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Secure payment processing for your spotlight application. Your project will go live immediately after payment.
            </p>
          </div>

          {/* Payment Status Alert */}
          {application.paymentStatus === 'completed' && (
            <div className="mb-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-400 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Payment Completed Successfully!
                  </h3>
                  <p className="text-gray-300">
                    Your project "{application.projectName}" is now live in the spotlight.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Details */}
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <StarIcon className="w-6 h-6 mr-3 text-yellow-400" />
                Project Details
              </h2>

              <div className="space-y-6">
                <div className="flex items-center">
                  {application.projectLogo ? (
                    <img
                      src={application.projectLogo}
                      alt={application.projectName}
                      className="w-16 h-16 rounded-xl object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <StarIcon className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-white">{application.projectName}</h3>
                    <p className="text-gray-400">Project Spotlight Application</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                  <p className="text-gray-300">{application.projectDescription}</p>
                </div>

                {(application.projectWebsite || application.projectTwitter || application.projectTelegram || application.projectDiscord) && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Links</h4>
                    <div className="space-y-2">
                      {application.projectWebsite && (
                        <p className="text-blue-400 text-sm">{application.projectWebsite}</p>
                      )}
                      {application.projectTwitter && (
                        <p className="text-blue-400 text-sm">Twitter: {application.projectTwitter}</p>
                      )}
                      {application.projectTelegram && (
                        <p className="text-blue-400 text-sm">Telegram: {application.projectTelegram}</p>
                      )}
                      {application.projectDiscord && (
                        <p className="text-blue-400 text-sm">Discord: {application.projectDiscord}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <CurrencyDollarIcon className="w-6 h-6 mr-3 text-green-400" />
                Payment Summary
              </h2>

              {selectedPlan && (
                <div className="space-y-6">
                  {/* Plan Details */}
                  <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-600">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${selectedPlan.color} mr-4`}>
                        <selectedPlan.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{selectedPlan.name}</h3>
                        <p className="text-sm text-gray-400">{selectedPlan.duration} days</p>
                      </div>
                    </div>
                    
                    <div className="text-3xl font-bold text-white mb-4">
                      ${selectedPlan.price}
                      <span className="text-lg text-gray-400 ml-2">one-time</span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-600">
                      <span className="text-gray-300">Spotlight Duration</span>
                      <span className="text-white font-medium">{selectedPlan.duration} days</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-600">
                      <span className="text-gray-300">Plan Price</span>
                      <span className="text-white font-medium">${selectedPlan.price}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-600">
                      <span className="text-gray-300">Processing Fee</span>
                      <span className="text-white font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="text-xl font-semibold text-white">Total</span>
                      <span className="text-2xl font-bold text-white">${selectedPlan.price}</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2 text-blue-400" />
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
                        <div>
                          <p className="text-white font-medium">Application Submitted</p>
                          <p className="text-gray-400 text-sm">{formatDate(application.submittedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-5 h-5 text-yellow-400 mr-3" />
                        <div>
                          <p className="text-white font-medium">Payment Pending</p>
                          <p className="text-gray-400 text-sm">Complete payment to activate</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <StarIcon className="w-5 h-5 text-blue-400 mr-3" />
                        <div>
                          <p className="text-white font-medium">Spotlight Goes Live</p>
                          <p className="text-gray-400 text-sm">Immediately after payment</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  {application.paymentStatus !== 'completed' && (
                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          Processing Payment...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CreditCardIcon className="w-6 h-6 mr-3" />
                          Pay ${selectedPlan.price} Now
                        </div>
                      )}
                    </button>
                  )}

                  {/* Security Info */}
                  <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-600">
                    <div className="flex items-center mb-2">
                      <ShieldCheckIcon className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-sm font-medium text-white">Secure Payment</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Your payment is processed securely. We use industry-standard encryption to protect your information.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-8 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400 mr-3" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-8 bg-green-500/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="w-6 h-6 text-green-400 mr-3" />
                <p className="text-green-400">{success}</p>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/spotlight/apply')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Spotlight Application
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
