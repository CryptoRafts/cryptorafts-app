"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import UnifiedLoader from './UnifiedLoader';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  organization: string;
  role: string;
  timezone: string;
  lastSaved?: Date;
}

interface NotificationSettings {
  mentions: boolean;
  allMessages: boolean;
  muted: boolean;
  emailDigests: boolean;
  testNotificationSent: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: Date;
    current: boolean;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    created: Date;
    lastUsed?: Date;
    enabled: boolean;
  }>;
}

interface OrganizationSettings {
  billingEmail: string;
  invoiceHistory: Array<{
    id: string;
    date: Date;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    downloadUrl: string;
  }>;
  legalDocs: {
    termsOfService: string;
    privacyPolicy: string;
    dataProcessing: string;
  };
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'organization'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@company.com',
    avatar: '/cryptorafts.logo.png',
    organization: 'Crypto Ventures',
    role: 'VC Partner',
    timezone: 'UTC-8',
    lastSaved: new Date()
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    mentions: true,
    allMessages: true,
    muted: false,
    emailDigests: true,
    testNotificationSent: false
  });

  // Security State
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessions: [
      {
        id: '1',
        device: 'Chrome on Windows',
        location: 'San Francisco, CA',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        current: true
      },
      {
        id: '2',
        device: 'Safari on iPhone',
        location: 'Los Angeles, CA',
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
        current: false
      }
    ],
    apiKeys: [
      {
        id: '1',
        name: 'Production API Key',
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        enabled: true
      }
    ]
  });

  // Organization State
  const [organization, setOrganization] = useState<OrganizationSettings>({
    billingEmail: 'billing@cryptoventures.com',
    invoiceHistory: [
      {
        id: 'INV-001',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        amount: 299.00,
        status: 'paid',
        downloadUrl: '#'
      },
      {
        id: 'INV-002',
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        amount: 299.00,
        status: 'paid',
        downloadUrl: '#'
      }
    ],
    legalDocs: {
      termsOfService: 'https://example.com/terms',
      privacyPolicy: 'https://example.com/privacy',
      dataProcessing: 'https://example.com/dpa'
    }
  });

  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  const saveProfile = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProfile(prev => ({ ...prev, lastSaved: new Date() }));
    setSaveStatus('saved');
    setIsLoading(false);
    
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const sendTestNotification = async () => {
    setNotifications(prev => ({ ...prev, testNotificationSent: true }));
    setTimeout(() => {
      setNotifications(prev => ({ ...prev, testNotificationSent: false }));
    }, 3000);
  };

  const revokeSession = (sessionId: string) => {
    setSecurity(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId)
    }));
  };

  const createApiKey = () => {
    if (!newApiKeyName.trim()) return;
    
    const newKey = {
      id: Date.now().toString(),
      name: newApiKeyName,
      created: new Date(),
      enabled: true
    };
    
    setSecurity(prev => ({
      ...prev,
      apiKeys: [...prev.apiKeys, newKey]
    }));
    
    setNewApiKeyName('');
    setShowApiKeyForm(false);
  };

  const toggleApiKey = (keyId: string) => {
    setSecurity(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key =>
        key.id === keyId ? { ...key, enabled: !key.enabled } : key
      )
    }));
  };

  const deleteApiKey = (keyId: string) => {
    setSecurity(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter(key => key.id !== keyId)
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', iconType: 'user' },
    { id: 'notifications', label: 'Notifications', iconType: 'bell' },
    { id: 'security', label: 'Privacy & Security', iconType: 'shield' },
    { id: 'organization', label: 'Organization', iconType: 'building' }
  ];

  const timezones = [
    'UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6', 'UTC-5',
    'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1', 'UTC+0', 'UTC+1', 'UTC+2', 'UTC+3',
    'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12'
  ];

  return (
    <div className="min-h-screen bg-black/95">
      <div className="container-perfect">
        {/* Header */}
        <div className="header-perfect">
          <h1 className="text-white text-2xl font-bold">Settings</h1>
          <p className="text-white/60">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <NeonCyanIcon type={tab.iconType as any} size={20} className="text-current" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 rounded-xl p-6">
              <AnimatePresence mode="wait">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-white text-xl font-semibold">Profile Settings</h2>
                      {saveStatus && (
                        <div className="flex items-center space-x-2">
                          {saveStatus === 'saving' && <UnifiedLoader type="text" size="sm" message="Saving..." />}
                          {saveStatus === 'saved' && (
                            <div className="flex items-center space-x-2 text-green-400">
                              <NeonCyanIcon type="check" size={16} className="text-current" />
                              <span className="text-sm">Saved</span>
                            </div>
                          )}
                          {saveStatus === 'error' && (
                            <div className="flex items-center space-x-2 text-red-400">
                              <NeonCyanIcon type="close" size={16} className="text-current" />
                              <span className="text-sm">Error</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {profile.lastSaved && (
                      <p className="text-white/60 text-sm">
                        Last saved: {profile.lastSaved.toLocaleString()}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Avatar */}
                      <div className="space-y-4">
                        <label className="block text-white font-medium">Avatar</label>
                        <div className="flex items-center space-x-4">
                          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <NeonCyanIcon type="user" size={40} className="text-white" />
                          </div>
                          <div className="space-y-2">
                            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors">
                              Change Avatar
                            </button>
                            <p className="text-white/60 text-xs">PNG, JPG up to 500KB</p>
                          </div>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white font-medium mb-2">Full Name</label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                          />
                        </div>

                        <div>
                          <label className="block text-white font-medium mb-2">Email</label>
                          <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                          />
                        </div>

                        <div>
                          <label className="block text-white font-medium mb-2">Organization</label>
                          <input
                            type="text"
                            value={profile.organization}
                            onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                          />
                        </div>

                        <div>
                          <label className="block text-white font-medium mb-2">Role</label>
                          <input
                            type="text"
                            value={profile.role}
                            onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                          />
                        </div>

                        <div>
                          <label className="block text-white font-medium mb-2">Time Zone</label>
                          <select
                            value={profile.timezone}
                            onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                          >
                            {timezones.map(tz => (
                              <option key={tz} value={tz} className="bg-black text-white">{tz}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={saveProfile}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <h2 className="text-white text-xl font-semibold">Notification Settings</h2>

                    <div className="space-y-6">
                      {/* Chat Notifications */}
                      <div className="space-y-4">
                        <h3 className="text-white font-medium">Chat Notifications</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-white">All Messages</span>
                            <input
                              type="checkbox"
                              checked={notifications.allMessages}
                              onChange={(e) => setNotifications(prev => ({ ...prev, allMessages: e.target.checked }))}
                              className="w-4 h-4 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-cyan-500"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-white">Mentions Only</span>
                            <input
                              type="checkbox"
                              checked={notifications.mentions}
                              onChange={(e) => setNotifications(prev => ({ ...prev, mentions: e.target.checked }))}
                              className="w-4 h-4 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-cyan-500"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-white">Muted</span>
                            <input
                              type="checkbox"
                              checked={notifications.muted}
                              onChange={(e) => setNotifications(prev => ({ ...prev, muted: e.target.checked }))}
                              className="w-4 h-4 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-cyan-500"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Email Notifications */}
                      <div className="space-y-4">
                        <h3 className="text-white font-medium">Email Notifications</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-white">Email Digests</span>
                            <input
                              type="checkbox"
                              checked={notifications.emailDigests}
                              onChange={(e) => setNotifications(prev => ({ ...prev, emailDigests: e.target.checked }))}
                              className="w-4 h-4 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-cyan-500"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Test Notification */}
                      <div className="space-y-4">
                        <h3 className="text-white font-medium">Test Notification</h3>
                        <button
                          onClick={sendTestNotification}
                          disabled={notifications.testNotificationSent}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
                        >
                          {notifications.testNotificationSent ? 'Test Sent!' : 'Send Test Notification'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <h2 className="text-white text-xl font-semibold">Privacy & Security</h2>

                    {/* 2FA */}
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Authenticator App</p>
                          <p className="text-white/60 text-sm">Add an extra layer of security</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={security.twoFactorEnabled}
                            onChange={(e) => setSecurity(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">Active Sessions</h3>
                      <div className="space-y-3">
                        {security.sessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <NeonCyanIcon type="phone" size={20} className="text-white/60" />
                              <div>
                                <p className="text-white font-medium">{session.device}</p>
                                <div className="flex items-center space-x-2 text-white/60 text-sm">
                                  <NeonCyanIcon type="globe" size={16} className="text-current" />
                                  <span>{session.location}</span>
                                  <NeonCyanIcon type="clock" size={16} className="text-current ml-2" />
                                  <span>Last active: {session.lastActive.toLocaleDateString()}</span>
                                  {session.current && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Current</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {!session.current && (
                              <button
                                onClick={() => revokeSession(session.id)}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* API Keys */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">API Keys</h3>
                        <button
                          onClick={() => setShowApiKeyForm(true)}
                          className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                        >
                          <NeonCyanIcon type="plus" size={16} className="text-current" />
                          <span>Create Key</span>
                        </button>
                      </div>

                      {showApiKeyForm && (
                        <div className="p-4 bg-white/5 rounded-lg space-y-3">
                          <input
                            type="text"
                            value={newApiKeyName}
                            onChange={(e) => setNewApiKeyName(e.target.value)}
                            placeholder="API Key Name"
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={createApiKey}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white text-sm transition-all"
                            >
                              Create
                            </button>
                            <button
                              onClick={() => {
                                setShowApiKeyForm(false);
                                setNewApiKeyName('');
                              }}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {security.apiKeys.map((key) => (
                          <div key={key.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div>
                              <p className="text-white font-medium">{key.name}</p>
                              <div className="flex items-center space-x-2 text-white/60 text-sm">
                                <NeonCyanIcon type="shield" size={16} className="text-current" />
                                <span>Created: {key.created.toLocaleDateString()}</span>
                                {key.lastUsed && (
                                  <>
                                    <span>•</span>
                                    <span>Last used: {key.lastUsed.toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleApiKey(key.id)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                  key.enabled
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {key.enabled ? 'Enabled' : 'Disabled'}
                              </button>
                              <button
                                onClick={() => deleteApiKey(key.id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                              >
                                <NeonCyanIcon type="close" size={16} className="text-current" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Organization Tab */}
                {activeTab === 'organization' && (
                  <motion.div
                    key="organization"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <h2 className="text-white text-xl font-semibold">Organization Settings</h2>

                    {/* Billing */}
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">Billing Information</h3>
                      <div>
                        <label className="block text-white font-medium mb-2">Billing Email</label>
                        <input
                          type="email"
                          value={organization.billingEmail}
                          onChange={(e) => setOrganization(prev => ({ ...prev, billingEmail: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                        />
                      </div>
                    </div>

                    {/* Invoice History */}
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">Invoice History</h3>
                      <div className="space-y-3">
                        {organization.invoiceHistory.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div>
                              <p className="text-white font-medium">{invoice.id}</p>
                              <div className="flex items-center space-x-2 text-white/60 text-sm">
                                <span>{invoice.date.toLocaleDateString()}</span>
                                <span>•</span>
                                <span>${invoice.amount.toFixed(2)}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                  invoice.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {invoice.status}
                                </span>
                              </div>
                            </div>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors">
                              <NeonCyanIcon type="arrow-down" size={16} className="text-current" />
                              <span>Download</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legal Documents */}
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">Legal Documents</h3>
                      <div className="space-y-3">
                        <a
                          href={organization.legalDocs.termsOfService}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-4 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                        >
                          <NeonCyanIcon type="globe" size={20} className="text-current" />
                          <span>Terms of Service</span>
                        </a>
                        <a
                          href={organization.legalDocs.privacyPolicy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-4 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                        >
                          <NeonCyanIcon type="globe" size={20} className="text-current" />
                          <span>Privacy Policy</span>
                        </a>
                        <a
                          href={organization.legalDocs.dataProcessing}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-4 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                        >
                          <NeonCyanIcon type="globe" size={20} className="text-current" />
                          <span>Data Processing Agreement</span>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
