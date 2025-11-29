"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface ApprovalSuccessProps {
  role: string;
  userName?: string;
  onContinue: () => void;
}

export default function ApprovalSuccess({ role, userName, onContinue }: ApprovalSuccessProps) {
  const router = useRouter();

  const roleConfig: Record<string, {
    title: string;
    iconType: string;
    features: string[];
    nextSteps: { text: string; link: string }[];
  }> = {
    founder: {
      title: 'Founder',
      iconType: 'rocket',
      features: [
        'Submit and manage your project pitches',
        'Access RaftAI analysis and insights',
        'Connect with VCs and investors',
        'Track project performance and metrics',
      ],
      nextSteps: [
        { text: 'Go to Dashboard', link: '/founder/dashboard' },
        { text: 'Submit Your First Pitch', link: '/founder/pitch' },
      ],
    },
    vc: {
      title: 'VC',
      iconType: 'chart',
      features: [
        'Browse and evaluate project pitches',
        'Access deal flow and analytics',
        'Connect with founders',
        'Manage your investment portfolio',
      ],
      nextSteps: [
        { text: 'Go to Dashboard', link: '/vc/dashboard' },
        { text: 'Explore Deals', link: '/vc/deals' },
      ],
    },
    exchange: {
      title: 'Exchange',
      iconType: 'chart',
      features: [
        'List tokens on your exchange',
        'Manage trading pairs and fees',
        'Access liquidity insights',
        'Connect with projects',
      ],
      nextSteps: [
        { text: 'Go to Dashboard', link: '/exchange/dashboard' },
        { text: 'Manage Listings', link: '/exchange/listings' },
      ],
    },
    ido: {
      title: 'IDO Platform',
      iconType: 'rocket',
      features: [
        'Host token launches',
        'Manage IDO campaigns',
        'Track participant metrics',
        'Access analytics dashboard',
      ],
      nextSteps: [
        { text: 'Go to Dashboard', link: '/ido/dashboard' },
        { text: 'Create IDO', link: '/ido/create' },
      ],
    },
    agency: {
      title: 'Marketing Agency',
      iconType: 'sparkles',
      features: [
        'Access marketing tools',
        'Manage client campaigns',
        'Track campaign performance',
        'Connect with projects',
      ],
      nextSteps: [
        { text: 'Go to Dashboard', link: '/agency/dashboard' },
        { text: 'Browse Opportunities', link: '/agency/opportunities' },
      ],
    },
    influencer: {
      title: 'Influencer',
      iconType: 'user',
      features: [
        'Discover promotion opportunities',
        'Track campaign performance',
        'Manage your profile and portfolio',
        'Connect with brands',
      ],
      nextSteps: [
        { text: 'Go to Dashboard', link: '/influencer/dashboard' },
        { text: 'Browse Campaigns', link: '/influencer/campaigns' },
      ],
    },
  };

  const config = roleConfig[role] || roleConfig.founder;
  const Icon = config.icon;

  useEffect(() => {
    // Trigger in-app notification (to be implemented)
    console.log('🎉 Approval success notification triggered');

    // Redirect to dashboard after 5 seconds if user doesn't click
    const timer = setTimeout(() => {
      onContinue();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat pt-24 pb-12 px-4"
      style={{
        backgroundImage: 'url("/worldmap.png")'
      }}
    >
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/20 shadow-2xl animate-fade-in">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-6 w-28 h-28 mx-auto flex items-center justify-center shadow-lg shadow-green-500/50 animate-bounce-slow">
                <NeonCyanIcon type="check" size={64} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <NeonCyanIcon type="sparkles" size={32} className="text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Congratulations! 🎉
            </h1>
            {userName && (
              <p className="text-xl text-white/90 mb-2">
                {userName}
              </p>
            )}
            <p className="text-lg text-white/70">
              Your {config.title} account has been approved!
            </p>
          </div>

          {/* Features Unlocked */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-green-500/20">
            <div className="flex items-center mb-4">
              <NeonCyanIcon type={config.iconType as any} size={24} className="text-green-400 mr-3" />
              <h3 className="text-white font-semibold text-lg">Features Unlocked</h3>
            </div>
            <ul className="space-y-3">
              {config.features.map((feature, index) => (
                <li key={index} className="flex items-start text-white/80 text-sm">
                  <NeonCyanIcon type="check" size={20} className="text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 mb-6 border border-cyan-500/20">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <NeonCyanIcon type="sparkles" size={20} className="text-cyan-400 mr-2" />
              Ready to Get Started?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.nextSteps.map((step, index) => (
                <Link
                  key={index}
                  href={step.link}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 text-center transform hover:scale-105"
                  onClick={onContinue}
                >
                  {step.text}
                </Link>
              ))}
            </div>
          </div>

          {/* Notification Info */}
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <p className="text-white/70 text-sm text-center">
              📧 A confirmation email has been sent to your registered email address with welcome information and next steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
