"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { globalRules } from '@/lib/global-rules';
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface PortalSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  status: 'locked' | 'unlocked' | 'completed' | 'failed' | 'pending';
  route: string;
}

export default function FounderPortalGated() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [portalSections, setPortalSections] = useState<PortalSection[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      initializePortal();
    }
  }, [user, isLoading]);

  const initializePortal = async () => {
    try {
      await globalRules.initialize();
      
      const step = globalRules.getCurrentStep();
      setCurrentStep(step);
      
      // Define portal sections based on current state
      const sections: PortalSection[] = [
        {
          id: 'profile',
          title: 'Profile Setup',
          description: 'Complete your founder profile',
          icon: <UserIcon className="h-6 w-6" />,
          required: true,
          status: globalRules.isStepCompleted('profile') ? 'completed' : 
                  globalRules.canAccessStep('profile') ? 'unlocked' : 'locked',
          route: '/founder/profile-setup'
        },
        {
          id: 'kyc',
          title: 'KYC Verification',
          description: globalRules.isKYCRejected() ? 'KYC verification failed - retry required' : 
                      globalRules.isKYCPending() ? 'KYC verification pending review' :
                      'Verify your identity',
          icon: <ShieldCheckIcon className="h-6 w-6" />,
          required: true,
          status: globalRules.isStepCompleted('kyc') ? 'completed' : 
                  globalRules.isKYCRejected() ? 'failed' :
                  globalRules.isKYCPending() ? 'pending' :
                  globalRules.canAccessStep('kyc') ? 'unlocked' : 'locked',
          route: '/founder/kyc'
        },
        {
          id: 'kyb',
          title: 'KYB Verification',
          description: 'Verify your organization (optional)',
          icon: <DocumentTextIcon className="h-6 w-6" />,
          required: false,
          status: globalRules.isStepCompleted('kyb') ? 'completed' : 
                  globalRules.canAccessStep('kyb') ? 'unlocked' : 'locked',
          route: '/founder/kyb-decision'
        },
        {
          id: 'pitch',
          title: 'Pitch Submission',
          description: 'Submit your project pitch',
          icon: <DocumentTextIcon className="h-6 w-6" />,
          required: true,
          status: globalRules.hasPitchSubmitted() ? 'completed' : 
                  globalRules.canSubmitPitch() ? 'unlocked' : 'locked',
          route: '/founder/pitch'
        },
        {
          id: 'dashboard',
          title: 'Dashboard',
          description: 'View your projects and deals',
          icon: <ChartBarIcon className="h-6 w-6" />,
          required: true,
          status: globalRules.canAccessPortal() ? 'unlocked' : 'locked',
          route: '/founder/dashboard'
        },
        {
          id: 'chat',
          title: 'Chat Rooms',
          description: 'Communicate with partners',
          icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
          required: true,
          status: globalRules.canAccessPortal() ? 'unlocked' : 'locked',
          route: '/founder/chat'
        },
        {
          id: 'settings',
          title: 'Settings',
          description: 'Manage your account',
          icon: <Cog6ToothIcon className="h-6 w-6" />,
          required: false,
          status: 'unlocked',
          route: '/founder/settings'
        }
      ];
      
      setPortalSections(sections);
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Error initializing portal:', error);
    }
  };

  const handleSectionClick = (section: PortalSection) => {
    if (section.status === 'locked') {
      return; // Don't allow access to locked sections
    }
    
    router.push(section.route);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />;
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-400" />;
      case 'unlocked':
        return <div className="w-6 h-6 border-2 border-blue-400 rounded-full"></div>;
      case 'locked':
        return <div className="w-6 h-6 border-2 border-gray-500 rounded-full"></div>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/20 bg-green-500/5';
      case 'failed':
        return 'border-red-500/20 bg-red-500/5';
      case 'pending':
        return 'border-yellow-500/20 bg-yellow-500/5';
      case 'unlocked':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'locked':
        return 'border-gray-500/20 bg-gray-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Check if user is a founder
  if (globalRules.getCurrentRole() !== 'founder') {
    router.push('/role');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Founder Portal
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete the required steps to unlock all platform features
          </p>
        </div>

        {/* Current Step Indicator */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Current Step</h3>
              <p className="text-gray-300 capitalize">{currentStep.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Portal Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portalSections.map((section) => (
            <div
              key={section.id}
              onClick={() => handleSectionClick(section)}
              className={`relative bg-white/5 backdrop-blur-xl rounded-2xl border-2 transition-all duration-300 ${
                section.status === 'locked' 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'cursor-pointer hover:scale-105 hover:shadow-2xl'
              } ${getStatusColor(section.status)}`}
            >
              <div className="p-6">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      section.status === 'completed' ? 'bg-green-500/20' :
                      section.status === 'unlocked' ? 'bg-blue-500/20' : 'bg-gray-500/20'
                    }`}>
                      <div className={`${
                        section.status === 'completed' ? 'text-green-400' :
                        section.status === 'unlocked' ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {section.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                      {section.required && (
                        <span className="text-xs text-red-400 font-medium">Required</span>
                      )}
                    </div>
                  </div>
                  {getStatusIcon(section.status)}
                </div>

                {/* Section Description */}
                <p className="text-gray-300 text-sm mb-4">{section.description}</p>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    section.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    section.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    section.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    section.status === 'unlocked' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {section.status === 'completed' ? 'Done' :
                     section.status === 'failed' ? 'Failed' :
                     section.status === 'pending' ? 'Pending' :
                     section.status === 'unlocked' ? 'Available' : 'Locked'}
                  </span>
                  
                  {(section.status !== 'locked' && section.status !== 'completed') && (
                    <span className="text-blue-400 text-sm font-medium">
                      {section.status === 'failed' ? 'Retry KYC →' : 'Click to access →'}
                    </span>
                  )}
                </div>
              </div>

              {/* Locked Overlay */}
              {section.status === 'locked' && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm font-medium">Complete previous steps</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="mt-12 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Progress Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {portalSections.filter(s => s.status === 'completed').length}
              </div>
              <p className="text-gray-300 text-sm">Done</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {portalSections.filter(s => s.status === 'failed').length}
              </div>
              <p className="text-gray-300 text-sm">Failed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {portalSections.filter(s => s.status === 'pending').length}
              </div>
              <p className="text-gray-300 text-sm">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {portalSections.filter(s => s.status === 'unlocked').length}
              </div>
              <p className="text-gray-300 text-sm">Available</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {portalSections.filter(s => s.status === 'locked').length}
              </div>
              <p className="text-gray-300 text-sm">Locked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
