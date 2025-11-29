"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSimpleAuth } from '@/lib/auth-simple';

interface RoleTab {
  id: string;
  name: string;
  href: string;
}

const roleTabs: Record<string, RoleTab[]> = {
  founder: [
    { id: 'overview', name: 'Overview', href: '/founder/dashboard' },
    { id: 'pitch', name: 'Pitch', href: '/founder/pitch' },
    { id: 'deal-rooms', name: 'Deal Rooms', href: '/founder/deal-rooms' },
    { id: 'docs', name: 'Docs', href: '/founder/docs' },
    { id: 'settings', name: 'Settings', href: '/founder/settings' }
  ],
  vc: [
    { id: 'pipeline', name: 'Pipeline', href: '/vc/dashboard' },
    { id: 'watchlist', name: 'Watchlist', href: '/vc/watchlist' },
    { id: 'rooms', name: 'Rooms', href: '/vc/rooms' },
    { id: 'notes', name: 'Notes', href: '/vc/notes' },
    { id: 'settings', name: 'Settings', href: '/vc/settings' }
  ],
  exchange: [
    { id: 'listings', name: 'Listings', href: '/exchange/dashboard' },
    { id: 'reviews', name: 'Reviews', href: '/exchange/reviews' },
    { id: 'compliance', name: 'Compliance', href: '/exchange/compliance' },
    { id: 'settings', name: 'Settings', href: '/exchange/settings' }
  ],
  ido: [
    { id: 'sales', name: 'Sales', href: '/ido/dashboard' },
    { id: 'whitelist', name: 'Whitelist', href: '/ido/whitelist' },
    { id: 'reports', name: 'Reports', href: '/ido/reports' },
    { id: 'settings', name: 'Settings', href: '/ido/settings' }
  ],
  influencer: [
    { id: 'campaigns', name: 'Campaigns', href: '/influencer/dashboard' },
    { id: 'analytics', name: 'Analytics', href: '/influencer/analytics' },
    { id: 'wallet', name: 'Wallet', href: '/influencer/wallet' },
    { id: 'settings', name: 'Settings', href: '/influencer/settings' }
  ],
  agency: [
    { id: 'leads', name: 'Leads', href: '/agency/dashboard' },
    { id: 'projects', name: 'Projects', href: '/agency/projects' },
    { id: 'billing', name: 'Billing', href: '/agency/billing' },
    { id: 'settings', name: 'Settings', href: '/agency/settings' }
  ],
  admin: [
    { id: 'users', name: 'Users', href: '/admin/users' },
    { id: 'orgs', name: 'Orgs', href: '/admin/orgs' },
    { id: 'roles', name: 'Roles', href: '/admin/roles' },
    { id: 'flags', name: 'Flags', href: '/admin/flags' },
    { id: 'audit', name: 'Audit', href: '/admin/audit' },
    { id: 'settings', name: 'Settings', href: '/admin/settings' }
  ]
};

export default function RoleSpecificHeader() {
  const { profile } = useSimpleAuth();
  const role = profile?.role;
  const pathname = usePathname();

  if (!role || !roleTabs[role]) {
    return null;
  }

  const tabs = roleTabs[role];

  return (
    <div className="bg-black border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || 
              (tab.id === 'overview' && pathname === `/${role}/dashboard`) ||
              (tab.id === 'pipeline' && pathname === `/${role}/dashboard`);
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`py-6 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded-t ${
                  isActive
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/40'
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
