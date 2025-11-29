"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircleIcon, 
  SparklesIcon, 
  RocketLaunchIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  verificationType: 'kyc' | 'kyb';
  status: 'approved' | 'verified';
}

export default function CongratulationsModal({ 
  isOpen, 
  onClose, 
  role, 
  verificationType, 
  status 
}: CongratulationsModalProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
        // Redirect to dashboard
        switch (role) {
          case 'founder':
            router.push('/founder/dashboard');
            break;
          case 'vc':
            router.push('/vc/dashboard');
            break;
          case 'exchange':
            router.push('/exchange/dashboard');
            break;
          case 'ido':
            router.push('/ido/dashboard');
            break;
          case 'influencer':
            router.push('/influencer/dashboard');
            break;
          case 'agency':
            router.push('/agency/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, role, router]);

  if (!isOpen) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'founder': return 'Founder';
      case 'vc': return 'Venture Capitalist';
      case 'exchange': return 'Exchange';
      case 'ido': return 'IDO Platform';
      case 'influencer': return 'Influencer';
      case 'agency': return 'Agency';
      default: return 'User';
    }
  };

  const getVerificationMessage = (verificationType: string, status: string) => {
    if (verificationType === 'kyc') {
      return status === 'approved' 
        ? 'Your identity has been verified and approved!'
        : 'Your identity verification is complete!';
    } else {
      return status === 'approved'
        ? 'Your business verification has been approved!'
        : 'Your business verification is complete!';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-md w-full mx-4 border border-blue-500/20 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <CheckCircleIcon className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            🎉 Congratulations!
          </h2>
          
          <p className="text-gray-300 text-lg">
            {getVerificationMessage(verificationType, status)}
          </p>
        </div>

        {/* Role-specific message */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-4 border border-blue-500/30">
            <div className="flex items-center justify-center mb-2">
              <TrophyIcon className="w-6 h-6 text-yellow-400 mr-2" />
              <span className="text-white font-semibold text-lg">
                Welcome, {getRoleDisplayName(role)}!
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              You now have full access to your {getRoleDisplayName(role).toLowerCase()} dashboard and all platform features.
            </p>
          </div>
        </div>

        {/* Features unlocked */}
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <SparklesIcon className="w-5 h-5 text-yellow-400 mr-2" />
            Features Unlocked:
          </h3>
          <div className="space-y-2">
            {role === 'founder' && (
              <>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Create and manage your startup profile
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Pitch to investors and VCs
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Access funding opportunities
                </div>
              </>
            )}
            {role === 'vc' && (
              <>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Discover and evaluate startups
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Access detailed pitch decks
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Make investment decisions
                </div>
              </>
            )}
            {role === 'exchange' && (
              <>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  List and trade digital assets
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Manage trading operations
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Access compliance tools
                </div>
              </>
            )}
            {role === 'ido' && (
              <>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Launch token offerings
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Manage IDO campaigns
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Track token sales
                </div>
              </>
            )}
            {role === 'influencer' && (
              <>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Promote crypto projects
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Earn rewards and commissions
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Access exclusive campaigns
                </div>
              </>
            )}
            {role === 'agency' && (
              <>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Provide marketing services
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Manage client campaigns
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  Access business tools
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              switch (role) {
                case 'founder':
                  router.push('/founder/dashboard');
                  break;
                case 'vc':
                  router.push('/vc/dashboard');
                  break;
                case 'exchange':
                  router.push('/exchange/dashboard');
                  break;
                case 'ido':
                  router.push('/ido/dashboard');
                  break;
                case 'influencer':
                  router.push('/influencer/dashboard');
                  break;
                case 'agency':
                  router.push('/agency/dashboard');
                  break;
                default:
                  router.push('/dashboard');
              }
            }}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <RocketLaunchIcon className="w-5 h-5 mr-2" />
            Go to Dashboard
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Auto-redirect countdown */}
        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Redirecting to dashboard in <span className="text-blue-400 font-semibold">5</span> seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
