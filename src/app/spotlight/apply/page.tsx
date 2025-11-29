"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { db } from '@/lib/firebase.client';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  StarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  CreditCardIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface SpotlightPlan {
  id: string;
  name: string;
  duration: number; // days
  price: number;
  features: string[];
  popular?: boolean;
  color: string;
  icon: React.ComponentType<any>;
}

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

const spotlightPlans: SpotlightPlan[] = [
  {
    id: 'basic',
    name: 'Basic Spotlight',
    duration: 7,
    price: 99,
    features: [
      '7 days featured placement',
      'Homepage banner display',
      'Project profile enhancement',
      'Basic analytics',
      'Email support'
    ],
    color: 'from-blue-500 to-blue-600',
    icon: StarIcon
  },
  {
    id: 'premium',
    name: 'Premium Spotlight',
    duration: 14,
    price: 179,
    popular: true,
    features: [
      '14 days featured placement',
      'Premium homepage position',
      'Enhanced project profile',
      'Advanced analytics',
      'Social media promotion',
      'Priority support',
      'Custom banner design'
    ],
    color: 'from-purple-500 to-purple-600',
    icon: SparklesIcon
  },
  {
    id: 'enterprise',
    name: 'Enterprise Spotlight',
    duration: 30,
    price: 299,
    features: [
      '30 days featured placement',
      'Top homepage position',
      'Full project showcase',
      'Comprehensive analytics',
      'Multi-platform promotion',
      'Dedicated account manager',
      'Custom marketing materials',
      'Press release inclusion'
    ],
    color: 'from-gold-500 to-gold-600',
    icon: TrophyIcon
  }
];

export default function SpotlightApplyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    projectId: '',
    projectName: '',
    projectDescription: '',
    projectLogo: '',
    projectWebsite: '',
    projectTwitter: '',
    projectTelegram: '',
    projectDiscord: '',
    selectedPlan: 'premium'
  });
  
  // User's projects
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // Spotlight applications
  const [applications, setApplications] = useState<SpotlightApplication[]>([]);
  const [activeApplication, setActiveApplication] = useState<SpotlightApplication | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [user, authLoading, router]);

  const loadUserData = async () => {
    if (!user || !db) return;

    try {
      setLoading(true);

      // Load user's projects - include pending_review so founders can apply for spotlight
      const projectsQuery = query(
        collection(db!, 'projects'),
        where('founderId', '==', user.uid),
        where('status', 'in', ['approved', 'active', 'pending_review', 'under_review'])
      );

      const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserProjects(projects);
        console.log('📊 [SPOTLIGHT] User projects loaded:', projects.length);
      });

      // Load user's spotlight applications - handle index error gracefully
      let unsubscribeApplications: (() => void) | undefined;
      
      try {
        const applicationsQuery = query(
          collection(db!, 'spotlightApplications'),
          where('userId', '==', user.uid),
          orderBy('submittedAt', 'desc')
        );

        unsubscribeApplications = onSnapshot(applicationsQuery, (snapshot) => {
          const apps = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as SpotlightApplication[];
          
          setApplications(apps);
          
          // Check for active spotlight
          const active = apps.find(app => 
            app.applicationStatus === 'live' && 
            app.expiresAt && 
            new Date(app.expiresAt.toDate()) > new Date()
          );
          setActiveApplication(active || null);
          
          console.log('🌟 [SPOTLIGHT] Applications loaded:', apps.length);
        }, (error: any) => {
          // Handle index error gracefully - fallback to query without orderBy
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            console.log('⚠️ [SPOTLIGHT] Index not found, using fallback query without orderBy');
            try {
              const fallbackQuery = query(
                collection(db!, 'spotlightApplications'),
                where('userId', '==', user.uid)
              );
              
              unsubscribeApplications = onSnapshot(fallbackQuery, (snapshot) => {
                const apps = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as SpotlightApplication[];
                
                // Sort client-side
                apps.sort((a, b) => {
                  const aTime = a.submittedAt?.toDate?.()?.getTime() || a.submittedAt || 0;
                  const bTime = b.submittedAt?.toDate?.()?.getTime() || b.submittedAt || 0;
                  return bTime - aTime;
                });
                
                setApplications(apps);
                
                // Check for active spotlight
                const active = apps.find(app => 
                  app.applicationStatus === 'live' && 
                  app.expiresAt && 
                  new Date(app.expiresAt.toDate()) > new Date()
                );
                setActiveApplication(active || null);
                
                console.log('🌟 [SPOTLIGHT] Applications loaded (fallback):', apps.length);
              }, (fallbackError: any) => {
                console.error('❌ [SPOTLIGHT] Fallback query also failed:', fallbackError);
                setApplications([]);
              });
            } catch (fallbackError) {
              console.error('❌ [SPOTLIGHT] Error setting up fallback:', fallbackError);
              setApplications([]);
            }
          } else {
            console.error('❌ [SPOTLIGHT] Error loading applications:', error);
            setApplications([]);
          }
        });
      } catch (setupError) {
        console.error('❌ [SPOTLIGHT] Error setting up listener:', setupError);
        setApplications([]);
      }

      setLoading(false);

      return () => {
        unsubscribeProjects();
        if (unsubscribeApplications) unsubscribeApplications();
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load data. Please try again.');
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setFormData(prev => ({
      ...prev,
      projectId: project.id,
      projectName: project.name,
      projectDescription: project.description,
      projectLogo: project.logo || '',
      projectWebsite: project.website || '',
      projectTwitter: project.twitter || '',
      projectTelegram: project.telegram || '',
      projectDiscord: project.discord || ''
    }));
  };

  const handlePlanSelect = (planId: string) => {
    setFormData(prev => ({ ...prev, selectedPlan: planId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!user || !db) {
      setError('User not authenticated');
      setSubmitting(false);
      return;
    }

    if (!selectedProject) {
      setError('Please select a project');
      setSubmitting(false);
      return;
    }

    try {
      const selectedPlan = spotlightPlans.find(p => p.id === formData.selectedPlan);
      if (!selectedPlan) {
        setError('Invalid plan selected');
        setSubmitting(false);
        return;
      }

      // Create spotlight application
      const applicationData = {
        userId: user.uid,
        projectId: formData.projectId,
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        projectLogo: formData.projectLogo,
        projectWebsite: formData.projectWebsite,
        projectTwitter: formData.projectTwitter,
        projectTelegram: formData.projectTelegram,
        projectDiscord: formData.projectDiscord,
        selectedPlan: formData.selectedPlan,
        paymentStatus: 'pending',
        applicationStatus: 'pending',
        submittedAt: serverTimestamp(),
        totalAmount: selectedPlan.price,
        duration: selectedPlan.duration
      };

      const docRef = await addDoc(collection(db!, 'spotlightApplications'), applicationData);
      
      console.log('✅ [SPOTLIGHT] Application submitted:', docRef.id);
      
      setSuccess('Spotlight application submitted successfully! You will be redirected to payment.');
      
      // Redirect to payment page
      setTimeout(() => {
        router.push(`/spotlight/payment/${docRef.id}`);
      }, 2000);

    } catch (error) {
      console.error('Error submitting spotlight application:', error);
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading spotlight application..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/worldmap.png")',
          filter: 'brightness(0.3) contrast(1.2) saturate(1.1)'
        }}
      >
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                <StarIcon className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Apply for <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Spotlight</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get your project featured on our homepage and reach thousands of crypto enthusiasts. 
              Choose from our flexible spotlight plans and boost your project's visibility.
            </p>
          </div>

          {/* Active Spotlight Alert */}
          {activeApplication && (
            <div className="mb-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-400 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Your project is currently in the spotlight!
                  </h3>
                  <p className="text-gray-300">
                    "{activeApplication.projectName}" is featured until{' '}
                    {activeApplication.expiresAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Application Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Selection */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <RocketLaunchIcon className="w-6 h-6 mr-3 text-blue-400" />
                  Select Your Project
                </h2>

                {userProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <RocketLaunchIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Approved Projects</h3>
                    <p className="text-gray-500 mb-6">
                      You need to have at least one approved project to apply for spotlight.
                    </p>
                    <button
                      onClick={() => router.push('/founder/projects')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Create Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedProject?.id === project.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center mb-4">
                          {project.logo ? (
                            <img
                              src={project.logo}
                              alt={project.name}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                              <RocketLaunchIcon className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                            <p className="text-sm text-gray-400">{project.category}</p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2">
                          {project.description}
                        </p>
                        {project.website && (
                          <p className="text-blue-400 text-sm mt-2 truncate">
                            {project.website}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <CurrencyDollarIcon className="w-6 h-6 mr-3 text-green-400" />
                  Choose Your Plan
                </h2>

                <div className="space-y-4">
                  {spotlightPlans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.selectedPlan === plan.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                        } ${plan.popular ? 'ring-2 ring-purple-500/50' : ''}`}
                      >
                        {plan.popular && (
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                            Most Popular
                          </div>
                        )}
                        
                        <div className="flex items-center mb-4">
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${plan.color} mr-4`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                            <p className="text-sm text-gray-400">{plan.duration} days</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="text-3xl font-bold text-white">${plan.price}</span>
                          <span className="text-gray-400 ml-2">one-time</span>
                        </div>

                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-300">
                              <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Payment Info */}
                <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-400" />
                    Payment Security
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                      Secure payment processing
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                      Money-back guarantee
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                      Instant activation
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {selectedProject && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedProject}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CreditCardIcon className="w-6 h-6 mr-3" />
                    Apply for Spotlight - ${spotlightPlans.find(p => p.id === formData.selectedPlan)?.price}
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 bg-green-500/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400">{success}</p>
            </div>
          )}

          {/* Previous Applications */}
          {applications.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-6">Previous Applications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map((app) => (
                  <div key={app.id} className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{app.projectName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.applicationStatus === 'live' ? 'bg-green-500/20 text-green-400' :
                        app.applicationStatus === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                        app.applicationStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        app.applicationStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {app.applicationStatus}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{app.projectDescription}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {app.submittedAt?.toDate().toLocaleDateString()}
                      </span>
                      <span className="text-white font-medium">
                        ${app.totalAmount} - {app.duration} days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}