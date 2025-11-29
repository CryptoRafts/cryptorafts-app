"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { ensureDb, waitForFirebase, createSnapshotErrorHandler } from '@/lib/firebase-utils';
import {
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface SpotlightApplication {
  id: string;
  projectName: string;
  projectDescription: string;
  projectLogo?: string;
  projectTwitter?: string;
  projectTelegram?: string;
  selectedPlan: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  applicationStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  founderName: string;
  founderEmail: string;
  paymentId?: string;
}

export default function AdminSpotlightPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState<SpotlightApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });

  const spotlightPlans = [
    {
      id: 'basic',
      name: 'Basic Spotlight',
      price: 1000,
      duration: 7,
      features: ['Homepage placement', 'Social media mention', 'Email blast']
    },
    {
      id: 'premium',
      name: 'Premium Spotlight',
      price: 2500,
      duration: 14,
      features: ['Hero section placement', 'Dedicated blog post', 'Social media campaign', 'Email blast']
    },
    {
      id: 'enterprise',
      name: 'Enterprise Spotlight',
      price: 5000,
      duration: 30,
      features: ['Top banner placement', 'Dedicated landing page', 'Full marketing campaign', 'Priority support']
    }
  ];

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/admin/login');
        return;
      }
      
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'admin') {
        router.push('/admin/login');
        return;
      }
      
      loadApplications();
    }
  }, [user, isLoading, router]);

  const loadApplications = async () => {
    try {
      console.log('📊 Loading spotlight applications...');
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('Firebase not initialized');
        setIsLoading(false);
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('Database not available');
        setIsLoading(false);
        return;
      }
      
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      
      const applicationsQuery = query(
        collection(dbInstance, 'spotlightApplications'),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(applicationsQuery);
      const applicationsData: SpotlightApplication[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        applicationsData.push({
          id: doc.id,
          projectName: data.projectName || 'Unknown Project',
          projectDescription: data.projectDescription || '',
          projectLogo: data.projectLogo,
          projectTwitter: data.projectTwitter,
          projectTelegram: data.projectTelegram,
          selectedPlan: data.selectedPlan || 'basic',
          totalAmount: data.totalAmount || 0,
          paymentStatus: data.paymentStatus || 'pending',
          applicationStatus: data.applicationStatus || 'pending',
          submittedAt: data.submittedAt,
          founderName: data.founderName || 'Unknown Founder',
          founderEmail: data.founderEmail || 'N/A',
          paymentId: data.paymentId
        });
      });

      setApplications(applicationsData);
      
      // Calculate stats
      const total = applicationsData.length;
      const pending = applicationsData.filter(app => app.applicationStatus === 'pending').length;
      const approved = applicationsData.filter(app => app.applicationStatus === 'approved').length;
      const rejected = applicationsData.filter(app => app.applicationStatus === 'rejected').length;
      const totalRevenue = applicationsData.reduce((sum, app) => sum + app.totalAmount, 0);
      
      setStats({ total, pending, approved, rejected, totalRevenue });
      
      console.log('✅ Spotlight applications loaded successfully');
    } catch (error) {
      console.error('❌ Error loading spotlight applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      console.log('✅ Approving spotlight application:', applicationId);
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not available. Please refresh and try again.');
        return;
      }
      
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      await updateDoc(doc(dbInstance, 'spotlightApplications', applicationId), {
        applicationStatus: 'approved',
        updatedAt: serverTimestamp()
      });
      
      // Reload applications
      loadApplications();
      
      console.log('✅ Spotlight application approved successfully');
    } catch (error) {
      console.error('❌ Error approving spotlight application:', error);
      alert('Failed to approve application. Please try again.');
    }
  };

  const handleReject = async (applicationId: string, reason: string) => {
    try {
      console.log('❌ Rejecting spotlight application:', applicationId, 'Reason:', reason);
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        alert('Firebase not initialized. Please refresh and try again.');
        return;
      }

      const dbInstance = ensureDb();
      if (!dbInstance) {
        alert('Database not available. Please refresh and try again.');
        return;
      }

      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(dbInstance, 'spotlightApplications', applicationId), {
        applicationStatus: 'rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
      
      // Reload applications
      loadApplications();
      
      console.log('✅ Spotlight application rejected successfully');
    } catch (error) {
      console.error('❌ Error rejecting spotlight application:', error);
      alert('Failed to reject application. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading spotlight applications..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <StarIcon className="w-8 h-8 text-yellow-400" />
              Spotlight Management
            </h1>
            <p className="text-gray-400 mt-2">Manage project spotlight applications and approvals</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Applications</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Pending</p>
                <p className="text-white text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Approved</p>
                <p className="text-white text-2xl font-bold">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Rejected</p>
                <p className="text-white text-2xl font-bold">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircleIcon className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
                <p className="text-white text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Spotlight Applications</h2>
          
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <StarIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Applications</h3>
              <p className="text-gray-500">No spotlight applications have been submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => {
                const plan = spotlightPlans.find(p => p.id === app.selectedPlan);
                
                return (
                  <div key={app.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {app.projectLogo ? (
                          <img
                            src={app.projectLogo}
                            alt={app.projectName}
                            className="w-16 h-16 rounded-xl object-cover mr-4"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                            <StarIcon className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-white">{app.projectName}</h3>
                          <p className="text-gray-400">{app.projectDescription}</p>
                          <p className="text-gray-500 text-sm">by {app.founderName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.applicationStatus)}`}>
                          {app.applicationStatus.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(app.paymentStatus)}`}>
                          {app.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Selected Plan</p>
                        <p className="text-white font-medium">{plan?.name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm">${plan?.price || 0} for {plan?.duration || 0} days</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Amount</p>
                        <p className="text-white font-medium">${app.totalAmount.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">Payment ID: {app.paymentId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Submitted</p>
                        <p className="text-white font-medium">
                          {app.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {app.projectTwitter && (
                          <a href={`https://twitter.com/${app.projectTwitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                            Twitter
                          </a>
                        )}
                        {app.projectTelegram && (
                          <a href={`https://t.me/${app.projectTelegram}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                            Telegram
                          </a>
                        )}
                      </div>

                      {app.applicationStatus === 'pending' && (
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) {
                                handleReject(app.id, reason);
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircleIcon className="w-4 h-4 mr-2" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
