"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { signOut as firebaseSignOut, auth } from '@/lib/firebase.client';
import { 
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function FounderHeader() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/founder/dashboard" className="flex items-center space-x-3">
              <Image
                src="/cryptorafts.logo.png"
                alt="Cryptorafts"
                width={48}
                height={48}
                sizes="48px"
                priority
                style={{ width: 'auto', height: 'auto' }}
              />
              <span className="hidden sm:block text-xl font-bold text-white">
                Cryptorafts
              </span>
            </Link>
          </div>

          {/* Center: Global Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search projects, deals, messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right: AI Assistant, Avatar, Menu */}
          <div className="flex items-center space-x-4">
            
            {/* AI Assistant Button */}
            <button
              onClick={() => setShowAIAssistant(true)}
              className="relative p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 group"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                RaftAI Assistant
              </div>
            </button>

            {/* User Avatar & Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                )}
                <span className="hidden sm:block text-white font-medium">
                  {user?.displayName || 'Founder'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/10 py-2 z-50">
                  
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-medium text-white">
                      {user?.displayName || 'Founder'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/founder/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <BuildingOfficeIcon className="h-5 w-5 mr-3" />
                      Founder Portal
                    </Link>
                    
                    <Link
                      href="/founder/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserCircleIcon className="h-5 w-5 mr-3" />
                      Profile
                    </Link>
                    
                    <Link
                      href="/founder/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Cog6ToothIcon className="h-5 w-5 mr-3" />
                      Settings
                    </Link>
                    
                    <Link
                      href="/founder/billing"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <CreditCardIcon className="h-5 w-5 mr-3" />
                      Billing
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-white/10 pt-2">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">RaftAI Assistant</h3>
                  <p className="text-sm text-gray-400">Your AI-powered founder companion</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-400 mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors duration-200">
                      <div className="text-sm font-medium text-white">Analyze Pitch</div>
                      <div className="text-xs text-gray-400">Get AI feedback</div>
                    </button>
                    <button className="p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors duration-200">
                      <div className="text-sm font-medium text-white">Find Investors</div>
                      <div className="text-xs text-gray-400">Match with VCs</div>
                    </button>
                    <button className="p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors duration-200">
                      <div className="text-sm font-medium text-white">Due Diligence</div>
                      <div className="text-xs text-gray-400">Prepare for DD</div>
                    </button>
                    <button className="p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors duration-200">
                      <div className="text-sm font-medium text-white">Market Research</div>
                      <div className="text-xs text-gray-400">Industry insights</div>
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Chat with RaftAI</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Ask me anything about your startup..."
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
