'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export default function CompleteNavigation() {
  const { user, claims, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getRoleNavigation = () => {
    if (!claims?.role) return [];

    switch (claims.role) {
      case 'founder':
        return [
          { name: 'Dashboard', href: '/founder/dashboard', icon: 'dashboard' },
          { name: 'Pitch Project', href: '/founder/pitch', icon: 'rocket' },
          { name: 'My Projects', href: '/founder/projects', icon: 'document' },
          { name: 'Messages', href: '/founder/messages', icon: 'chat' },
          { name: 'Settings', href: '/founder/settings', icon: 'settings' }
        ];
      
      case 'vc':
        return [
          { name: 'Dashboard', href: '/vc/dashboard', icon: 'dashboard' },
          { name: 'Dealflow', href: '/vc/dealflow', icon: 'dealflow' },
          { name: 'Portfolio', href: '/vc/portfolio', icon: 'portfolio' },
          { name: 'Pipeline', href: '/vc/pipeline', icon: 'pipeline' },
          { name: 'Team', href: '/vc/team', icon: 'team' },
          { name: 'Settings', href: '/vc/settings', icon: 'settings' }
        ];
      
      case 'exchange':
        return [
          { name: 'Dashboard', href: '/exchange/dashboard', icon: 'dashboard' },
          { name: 'Dealflow', href: '/exchange/dealflow', icon: 'dealflow' },
          { name: 'Listings', href: '/exchange/listings', icon: 'listings' },
          { name: 'Messages', href: '/exchange/messages', icon: 'messages' },
          { name: 'Settings', href: '/exchange/settings', icon: 'settings' }
        ];
      
      case 'ido':
        return [
          { name: 'Dashboard', href: '/ido/dashboard', icon: 'dashboard' },
          { name: 'Dealflow', href: '/ido/dealflow', icon: 'dealflow' },
          { name: 'Launchpad', href: '/ido/launchpad', icon: 'launchpad' },
          { name: 'Messages', href: '/ido/messages', icon: 'messages' },
          { name: 'Settings', href: '/ido/settings', icon: 'settings' }
        ];
      
      case 'influencer':
        return [
          { name: 'Dashboard', href: '/influencer/dashboard', icon: 'dashboard' },
          { name: 'Campaigns', href: '/influencer/campaigns', icon: 'campaigns' },
          { name: 'Messages', href: '/influencer/messages', icon: 'messages' },
          { name: 'Analytics', href: '/influencer/analytics', icon: 'analytics' },
          { name: 'Settings', href: '/influencer/settings', icon: 'settings' }
        ];
      
      case 'agency':
        return [
          { name: 'Dashboard', href: '/agency/dashboard', icon: 'dashboard' },
          { name: 'Campaigns', href: '/agency/campaigns', icon: 'campaigns' },
          { name: 'Clients', href: '/agency/clients', icon: 'clients' },
          { name: 'Messages', href: '/agency/messages', icon: 'messages' },
          { name: 'Settings', href: '/agency/settings', icon: 'settings' }
        ];
      
      default:
        return [];
    }
  };

  const roleNavigation = getRoleNavigation();

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                CryptoRafts
              </Link>
            </div>
            <div className="text-white/80 text-sm">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              CryptoRafts
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user && claims?.role ? (
              <>
                {/* Role-specific navigation */}
                {roleNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors"
                  >
                    <NeonCyanIcon type={item.icon as any} size={16} className="text-current" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
                
                {/* User info and logout */}
                <div className="flex items-center space-x-4 pl-4 border-l border-gray-700">
                  <span className="text-white/80 text-sm">
                    {user.email}
                  </span>
                  <Link 
                    href="/logout"
                    className="text-white/80 hover:text-white text-sm transition-colors"
                  >
                    Logout
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/role"
                  className="text-white/80 hover:text-white text-sm transition-colors"
                >
                  Choose Role
                </Link>
                <Link 
                  href="/login"
                  className="text-white/80 hover:text-white text-sm transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isMenuOpen ? (
                <NeonCyanIcon type="close" size={24} className="text-current" />
              ) : (
                <NeonCyanIcon type="menu" size={24} className="text-current" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-gray-800">
            <div className="px-4 py-4 space-y-3">
              {user && claims?.role ? (
                <>
                  {/* Role-specific navigation */}
                  {roleNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 text-white/80 hover:text-white transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <NeonCyanIcon type={item.icon as any} size={20} className="text-current" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                  
                  {/* User info */}
                  <div className="pt-3 border-t border-gray-700">
                    <p className="text-white/80 text-sm mb-2">{user.email}</p>
                    <Link 
                      href="/logout"
                      className="text-white/80 hover:text-white text-sm transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Logout
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    href="/role"
                    className="block text-white/80 hover:text-white transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Choose Role
                  </Link>
                  <Link 
                    href="/login"
                    className="block text-white/80 hover:text-white transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup"
                    className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
