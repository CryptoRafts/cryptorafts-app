"use client";
import React from 'react';
import Link from 'next/link';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import WalletMenuButton from '@/components/WalletMenuButton';

interface RoleNavigationProps {
  user?: { 
    role?: "founder"|"vc"|"exchange"|"ido"|"influencer"|"agency"|"admin";
    kycApproved?: boolean;
    email?: string;
  };
  onClose?: () => void;
}

export default function RoleNavigation({ user, onClose }: RoleNavigationProps) {
  const isFounderWithKYC = user?.role === 'founder' && user?.kycApproved;
  const isVerifiedUser = user?.kycApproved;

  // Role-specific navigation items
  const getRoleNavigation = () => {
    if (!user?.role) return [];

    switch (user.role) {
      case 'founder':
        return [
          {
            name: 'Overview',
            href: '/founder/dashboard',
            icon: 'dashboard',
            description: 'Dashboard and project overview'
          },
          {
            name: 'Pitch Your Project',
            href: isFounderWithKYC ? '/founder/pitch' : '#',
            icon: 'rocket',
            description: 'Submit your project pitch',
            disabled: !isFounderWithKYC,
            disabledReason: 'Complete KYC verification first'
          },
          {
            name: 'My Projects',
            href: '/founder/projects',
            icon: 'document',
            description: 'Manage your submitted projects',
            disabled: !isFounderWithKYC
          },
          {
            name: 'Messages',
            href: '/founder/messages',
            icon: 'chat',
            description: 'Chat with investors and partners',
            disabled: !isFounderWithKYC
          },
          {
            name: 'Settings',
            href: '/founder/settings',
            icon: 'settings',
            description: 'Profile and account settings'
          },
          {
            name: 'Wallet',
            href: '#',
            icon: 'credit-card',
            description: 'Connect and manage your wallet',
            isWallet: true
          }
        ];

      case 'vc':
        return [
          {
            name: 'Pipeline',
            href: '/vc/dealflow',
            icon: 'pipeline',
            description: 'Investment pipeline and dealflow',
            disabled: !isVerifiedUser
          },
          {
            name: 'Watchlist',
            href: '/vc/watchlist',
            icon: 'dealflow',
            description: 'Tracked projects and favorites',
            disabled: !isVerifiedUser
          },
          {
            name: 'Chat',
            href: '/messages',
            icon: 'messages',
            description: 'Communicate with founders',
            disabled: !isVerifiedUser
          },
          {
            name: 'Analytics',
            href: '/vc/analytics',
            icon: 'analytics',
            description: 'Investment performance metrics',
            disabled: !isVerifiedUser
          },
          {
            name: 'Settings',
            href: '/vc/settings',
            icon: 'settings',
            description: 'Organization and account settings'
          },
          {
            name: 'Wallet',
            href: '#',
            icon: 'credit-card',
            description: 'Connect and manage your wallet',
            isWallet: true
          }
        ];

      case 'influencer':
        return [
          {
            name: 'Dashboard',
            href: '/influencer/dashboard',
            icon: 'dashboard',
            description: 'Overview and statistics'
          },
          {
            name: 'Profile',
            href: '/influencer/profile',
            icon: 'user',
            description: 'View and edit your profile'
          },
          {
            name: 'Campaigns',
            href: '/influencer/dealflow',
            icon: 'campaigns',
            description: 'Available campaigns and projects',
            disabled: !isVerifiedUser
          },
          {
            name: 'Messages',
            href: '/influencer/rooms',
            icon: 'messages',
            description: 'Project conversations',
            disabled: !isVerifiedUser
          },
          {
            name: 'Analytics',
            href: '/influencer/analytics',
            icon: 'analytics',
            description: 'Performance and engagement metrics',
            disabled: !isVerifiedUser
          },
          {
            name: 'Settings',
            href: '/influencer/settings',
            icon: 'settings',
            description: 'Account settings and preferences'
          },
          {
            name: 'Wallet',
            href: '#',
            icon: 'credit-card',
            description: 'Connect and manage your wallet',
            isWallet: true
          }
        ];

      case 'ido':
        return [
          {
            name: 'Dashboard',
            href: '/ido/dashboard',
            icon: 'dashboard',
            description: 'Dashboard and overview',
            disabled: !isVerifiedUser
          },
          {
            name: 'Projects',
            href: '/ido/projects',
            icon: 'document',
            description: 'Accepted projects with milestone tracking',
            disabled: !isVerifiedUser
          },
          {
            name: 'Dealflow',
            href: '/ido/dealflow',
            icon: 'dealflow',
            description: 'Verified projects ready for IDO launch',
            disabled: !isVerifiedUser
          },
          {
            name: 'Portfolio',
            href: '/ido/reviews',
            icon: 'portfolio',
            description: 'Your launched IDO portfolio',
            disabled: !isVerifiedUser
          },
          {
            name: 'Messages',
            href: '/messages',
            icon: 'messages',
            description: 'Deal rooms and project conversations',
            disabled: !isVerifiedUser
          },
          {
            name: 'Settings',
            href: '/ido/settings',
            icon: 'settings',
            description: 'Platform settings and team'
          },
          {
            name: 'Wallet',
            href: '#',
            icon: 'credit-card',
            description: 'Connect and manage your wallet',
            isWallet: true
          }
        ];

      case 'exchange':
        return [
          {
            name: 'Dashboard',
            href: '/exchange/dashboard',
            icon: 'dashboard',
            description: 'Overview and statistics'
          },
          {
            name: 'Project Listings',
            href: '/exchange/listings',
            icon: 'listings',
            description: 'Discover AI-rated projects for listing'
          },
          {
            name: 'Listing Pipeline',
            href: '/exchange/pipeline',
            icon: 'pipeline',
            description: 'Manage your listing pipeline'
          },
          {
            name: 'Messages',
            href: '/exchange/messages',
            icon: 'messages',
            description: 'Communication and collaboration'
          },
          {
            name: 'Compliance',
            href: '/exchange/compliance',
            icon: 'shield',
            description: 'Compliance and regulatory'
          },
          {
            name: 'Settings',
            href: '/exchange/settings',
            icon: 'settings',
            description: 'Organization and account settings'
          },
          {
            name: 'Wallet',
            href: '#',
            icon: 'credit-card',
            description: 'Connect and manage your wallet',
            isWallet: true
          }
        ];

      case 'agency':
        return [
          {
            name: 'Dashboard',
            href: '/agency/dashboard',
            icon: 'dashboard',
            description: 'Overview and statistics'
          },
          {
            name: 'Campaigns',
            href: '/agency/campaigns',
            icon: 'campaigns',
            description: 'Manage your campaigns'
          },
          {
            name: 'Clients',
            href: '/agency/clients',
            icon: 'clients',
            description: 'Manage your clients'
          },
          {
            name: 'Messages',
            href: '/agency/messages',
            icon: 'messages',
            description: 'Communication and collaboration'
          },
          {
            name: 'Settings',
            href: '/agency/settings',
            icon: 'settings',
            description: 'Account settings and preferences'
          },
          {
            name: 'Wallet',
            href: '#',
            icon: 'credit-card',
            description: 'Connect and manage your wallet',
            isWallet: true
          }
        ];
      
      case 'admin':
        return [
          {
            name: 'Dashboard',
            href: '/admin/dashboard',
            icon: 'dashboard',
            description: 'Admin dashboard and overview'
          },
          {
            name: 'KYC',
            href: '/admin/kyc',
            icon: 'shield',
            description: 'Review KYC documents'
          },
          {
            name: 'KYB',
            href: '/admin/kyb',
            icon: 'shield',
            description: 'Review KYB documents'
          },
          {
            name: 'Users',
            href: '/admin/users',
            icon: 'users',
            description: 'Manage users'
          },
          {
            name: 'Projects',
            href: '/admin/projects',
            icon: 'document',
            description: 'Manage projects'
          },
          {
            name: 'Settings',
            href: '/admin/settings',
            icon: 'settings',
            description: 'Admin settings'
          },
          {
            name: 'Wallet',
            href: '#',
            icon: 'credit-card',
            description: 'Connect and manage your wallet',
            isWallet: true
          }
        ];

      default:
        return [];
    }
  };

  const navigationItems = getRoleNavigation();

  return (
    <div className="space-y-1">
      {navigationItems.map((item) => {
        // Special handling for Wallet menu item
        if ((item as any).isWallet) {
          return (
            <div
              key={item.name}
              className="flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors group hover:bg-white/5"
              title={item.description}
            >
              <NeonCyanIcon type={item.icon as any} size={20} className="flex-shrink-0 text-slate-400 group-hover:text-white mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-slate-200 group-hover:text-white">{item.name}</span>
                </div>
                <WalletMenuButton className="w-full" />
              </div>
            </div>
          );
        }

        // Regular navigation items
        return (
          <Link
            key={item.name}
            href={item.disabled ? "#" : item.href}
            onClick={(e) => {
              if (item.disabled) {
                e.preventDefault();
              } else {
                onClose?.();
              }
            }}
            className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors group ${
              item.disabled 
                ? 'text-slate-500 cursor-not-allowed' 
                : 'hover:bg-white/5 text-slate-200 hover:text-white'
            }`}
            title={item.disabled ? item.disabledReason : item.description}
          >
            <NeonCyanIcon type={item.icon as any} size={20} className={`flex-shrink-0 ${
              item.disabled ? 'text-slate-500' : 'text-slate-400 group-hover:text-white'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                {item.disabled && (
                  <span className="text-xs text-slate-500 bg-slate-500/20 px-2 py-0.5 rounded">
                    Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
