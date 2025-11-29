"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { vcAuthManager } from '@/lib/vc-auth';
import { VCOrganization, VCUser } from '@/lib/vc-auth';
import { uploadToStorage } from '@/lib/upload';
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  BellIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function VCSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Data
  const [vcUser, setVCUser] = useState<VCUser | null>(null);
  const [organization, setOrganization] = useState<VCOrganization | null>(null);
  const [members, setMembers] = useState<VCUser[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'organization' | 'members' | 'notifications' | 'security' | 'account'>('organization');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form data
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    website: '',
    country: '',
    contactEmail: '',
    aum: '',
    thesis: {
      stages: [] as string[],
      sectors: [] as string[],
      chains: [] as string[]
    }
  });
  
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'viewer' as 'admin' | 'viewer'
  });

  useEffect(() => {
    if (user) {
      loadVCData();
    }
  }, [user]);

  const loadVCData = async () => {
    if (!user) return;
    
    try {
      const vcUserData = await vcAuthManager.getVCUser(user.uid);
      setVCUser(vcUserData);
      
      if (vcUserData?.orgId) {
        const orgData = await vcAuthManager.getVCOrganization(vcUserData.orgId);
        setOrganization(orgData);
        
        if (orgData) {
          setOrgFormData({
            name: orgData.name,
            website: orgData.website || '',
            country: orgData.country,
            contactEmail: orgData.contactEmail,
            aum: orgData.aum?.toString() || '',
            thesis: orgData.thesis
          });
          
          // Load members
          const membersData = await vcAuthManager.getVCMembers(vcUserData.orgId);
          setMembers(membersData);
        }
      }
    } catch (error) {
      console.error('Error loading VC data:', error);
      setError('Failed to load VC data');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Update organization
      const response = await fetch('/api/vc/update-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          orgId: organization.id,
          updates: {
            name: orgFormData.name,
            website: orgFormData.website,
            country: orgFormData.country,
            contactEmail: orgFormData.contactEmail,
            aum: orgFormData.aum ? Number(orgFormData.aum) : undefined,
            thesis: orgFormData.thesis
          }
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSuccess('Organization updated successfully');
      await loadVCData();
    } catch (error) {
      console.error('Error updating organization:', error);
      setError(error instanceof Error ? error.message : 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!user || !organization) return;
    
    try {
      const logoUrl = await uploadToStorage(
        `organizations/logos/${organization.id}_${Date.now()}.png`,
        file
      );
      
      // Update organization with new logo
      const response = await fetch('/api/vc/update-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          orgId: organization.id,
          updates: { logoUrl }
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSuccess('Logo updated successfully');
      await loadVCData();
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload logo');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/vc/invite-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          orgId: organization.id,
          email: inviteFormData.email,
          role: inviteFormData.role
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSuccess('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteFormData({ email: '', role: 'viewer' });
    } catch (error) {
      console.error('Error inviting member:', error);
      setError(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user || !organization) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/vc/remove-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          orgId: organization.id,
          memberId
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSuccess('Member removed successfully');
      await loadVCData();
    } catch (error) {
      console.error('Error removing member:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const renderOrganizationTab = () => (
    <div className="space-y-6">
      {/* Logo */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Organization Logo</h3>
        <div className="flex items-center space-x-4">
          {organization?.logoUrl ? (
            <img 
              src={organization.logoUrl} 
              alt="Organization logo"
              className="w-20 h-20 rounded-lg object-cover"
              width={80}
              height={80}
            />
          ) : (
            <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="h-8 w-8 text-white/40" />
            </div>
          )}
          
          <div>
            <input
              type="file"
              accept="image/png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors"
            >
              <PhotoIcon className="h-4 w-4" />
              <span>Upload Logo</span>
            </label>
            <p className="text-white/60 text-sm mt-1">PNG format, max 2MB</p>
          </div>
        </div>
      </div>

      {/* Organization Details */}
      <form onSubmit={handleOrgUpdate} className="space-y-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Organization Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={orgFormData.name}
                onChange={(e) => setOrgFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Website
              </label>
              <input
                type="url"
                value={orgFormData.website}
                onChange={(e) => setOrgFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Country *
              </label>
              <select
                required
                value={orgFormData.country}
                onChange={(e) => setOrgFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="SG">Singapore</option>
                <option value="CH">Switzerland</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
                <option value="AU">Australia</option>
                <option value="CA">Canada</option>
                <option value="NL">Netherlands</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={orgFormData.contactEmail}
                onChange={(e) => setOrgFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Assets Under Management (USD)
              </label>
              <input
                type="number"
                value={orgFormData.aum}
                onChange={(e) => setOrgFormData(prev => ({ ...prev, aum: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter AUM in USD"
              />
            </div>
          </div>
        </div>

        {/* Investment Thesis */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Investment Thesis</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Stages</label>
              <div className="flex flex-wrap gap-2">
                {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth'].map(stage => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => {
                      setOrgFormData(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          stages: prev.thesis.stages.includes(stage)
                            ? prev.thesis.stages.filter(s => s !== stage)
                            : [...prev.thesis.stages, stage]
                        }
                      }));
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      orgFormData.thesis.stages.includes(stage)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Sectors</label>
              <div className="flex flex-wrap gap-2">
                {['DeFi', 'NFTs', 'Gaming', 'Infrastructure', 'Social', 'Enterprise', 'AI/ML', 'IoT'].map(sector => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => {
                      setOrgFormData(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          sectors: prev.thesis.sectors.includes(sector)
                            ? prev.thesis.sectors.filter(s => s !== sector)
                            : [...prev.thesis.sectors, sector]
                        }
                      }));
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      orgFormData.thesis.sectors.includes(sector)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Chains</label>
              <div className="flex flex-wrap gap-2">
                {['Ethereum', 'Solana', 'Polygon', 'BSC', 'Avalanche', 'Arbitrum', 'Optimism', 'Base'].map(chain => (
                  <button
                    key={chain}
                    type="button"
                    onClick={() => {
                      setOrgFormData(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          chains: prev.thesis.chains.includes(chain)
                            ? prev.thesis.chains.filter(c => c !== chain)
                            : [...prev.thesis.chains, chain]
                        }
                      }));
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      orgFormData.thesis.chains.includes(chain)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {chain}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Updating...' : 'Update Organization'}
        </button>
      </form>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Organization Members</h3>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{member.uid}</p>
                  <p className="text-white/60 text-sm">
                    {organization?.members.find(m => m.uid === member.uid)?.role || 'Member'}
                  </p>
                </div>
              </div>
              
              {member.uid !== user?.uid && (
                <button
                  onClick={() => handleRemoveMember(member.uid)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
      
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <p className="text-white/60">Notification settings coming soon</p>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Security Settings</h3>
      
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <p className="text-white/60">Security settings coming soon</p>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Account Settings</h3>
      
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <p className="text-white/60">Account settings coming soon</p>
      </div>
    </div>
  );

  if (loading && !vcUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !vcUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'organization', label: 'Organization', icon: BuildingOfficeIcon },
    { id: 'members', label: 'Members', icon: UserGroupIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'account', label: 'Account', icon: Cog6ToothIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070B] to-[#0A1117] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">VC Settings</h1>
          <p className="text-white/60">Manage your organization and account settings</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'organization' && renderOrganizationTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'account' && renderAccountTab()}

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-[#05070B] to-[#0A1117] rounded-xl border border-white/10 w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Invite Member</h3>
                
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteFormData.email}
                      onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="member@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Role
                    </label>
                    <select
                      value={inviteFormData.role}
                      onChange={(e) => setInviteFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'viewer' }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors"
                    >
                      {loading ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
