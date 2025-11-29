"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { useRouter } from "next/navigation";
import { db, doc, getDoc, updateDoc, serverTimestamp } from "@/lib/firebase.client";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import Image from "next/image";
import BlockchainCard from "@/components/ui/BlockchainCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import VCTeamManagement from "@/components/VCTeamManagement";
import StandardLoading from "@/components/ui/StandardLoading";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface OrgProfileData {
  name: string;
  website: string;
  country: string;
  logoUrl?: string;
  thesis: {
    stages: string[];
    sectors: string[];
    chains: string[];
  };
  aum?: number;
  contactEmail: string;
}

export default function VCSettings() {
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [orgData, setOrgData] = useState<OrgProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'security'>('profile');

  const availableStages = [
    "Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Late Stage", "Grants", "Private OTC"
  ];

  const availableSectors = [
    "DeFi", "NFT", "Gaming", "Infrastructure", "Privacy", "AI/ML", 
    "Social", "DAO", "Metaverse", "Web3", "Enterprise", "Consumer"
  ];

  const availableChains = [
    "Ethereum", "Polygon", "Solana", "BSC", "Avalanche", "Arbitrum", 
    "Optimism", "Base", "Cosmos", "Polkadot", "Bitcoin", "Cardano",
    "Algorand", "Near", "Aptos", "Sui", "Fantom", "Harmony", "Cronos",
    "Klaytn", "Hedera", "Tezos", "Flow", "Stellar", "XRP", "Litecoin",
    "Dogecoin", "Shiba Inu", "Chainlink", "Uniswap", "Aave", "Compound",
    "MakerDAO", "Curve", "1inch", "SushiSwap", "PancakeSwap", "Multi-chain"
  ];

  useEffect(() => {
    if (user?.uid) {
      loadOrgData();
    }
  }, [user]);

  const loadOrgData = async () => {
    if (!user?.uid) return;

    try {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        console.error('❌ Database not available');
        return;
      }
      
      const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.organization) {
          setOrgData(data.organization);
          if (data.organization.logoUrl) {
            setLogoPreview(data.organization.logoUrl);
          }
        } else {
          // Set default organization data if none exists
          const defaultOrgData: OrgProfileData = {
            name: user.displayName || 'VC Organization',
            website: '',
            country: '',
            contactEmail: user.email || '',
            thesis: {
              stages: [],
              sectors: [],
              chains: []
            }
          };
          setOrgData(defaultOrgData);
        }
      } else {
        // Set default organization data if user document doesn't exist
        const defaultOrgData: OrgProfileData = {
          name: user.displayName || 'VC Organization',
          website: '',
          country: '',
          contactEmail: user.email || '',
          thesis: {
            stages: [],
            sectors: [],
            chains: []
          }
        };
        setOrgData(defaultOrgData);
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
      // Set default organization data on error
      const defaultOrgData: OrgProfileData = {
        name: user.displayName || 'VC Organization',
        website: '',
        country: '',
        contactEmail: user.email || '',
        thesis: {
          stages: [],
          sectors: [],
          chains: []
        }
      };
      setOrgData(defaultOrgData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!orgData) return;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setOrgData(prev => {
        if (!prev) return null;
        const parentValue = prev[parent as keyof OrgProfileData];
        if (typeof parentValue !== 'object' || parentValue === null) return prev;
        
        return {
          ...prev,
          [parent]: {
            ...parentValue as any,
            [child]: value
          }
        };
      });
    } else {
      setOrgData(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBusy(true);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const storageInstance = ensureStorage();
      const storageRef = ref(storageInstance, `org-logos/${user?.uid}/${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update org data
      setOrgData(prev => prev ? {
        ...prev,
        logoUrl: downloadURL
      } : null);

      setSuccess('Logo uploaded successfully!');
    } catch (err: any) {
      setError(err?.message || "Failed to upload logo");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.uid || !orgData) return;

    try {
      setBusy(true);
      setError(null);
      
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        setError('Firebase not initialized. Please refresh and try again.');
        setBusy(false);
        return;
      }
      
      const dbInstance = ensureDb();
      if (!dbInstance) {
        setError('Database not available. Please refresh and try again.');
        setBusy(false);
        return;
      }

      await updateDoc(doc(dbInstance, 'users', user.uid), {
        organization: orgData,
        updatedAt: serverTimestamp()
      });

      setSuccess('✅ Organization profile updated successfully!');
    } catch (err: any) {
      setError(err?.message || "Failed to update organization profile");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return <StandardLoading title="Loading Settings" message="Loading your organization data..." />;
  }

  if (!isAuthenticated || claims?.role !== 'vc') {
    return null;
  }

  if (!orgData) {
    return <StandardLoading title="Loading Organization Data" message="Please wait while we load your organization information..." />;
  }

  return (
    <div className="min-h-screen relative neo-blue-background">
      <div className="container-perfect relative z-10">
        {/* Header */}
        <div className="neo-glass-card rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">VC Settings</h1>
              <p className="text-white/60 text-lg">Manage your organization profile and settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={() => router.push('/vc/dashboard')}
                icon={<NeonCyanIcon type="building" size={16} className="text-current" />}
              >
                Back to Dashboard
              </AnimatedButton>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'profile', label: 'Organization Profile', iconType: 'building' },
            { id: 'team', label: 'Team Management', iconType: 'users' },
            { id: 'security', label: 'Security', iconType: 'shield' }
          ].map(tab => (
            <AnimatedButton
              key={tab.id}
              variant="primary"
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              icon={<NeonCyanIcon type={tab.iconType as any} size={16} className="text-current" />}
              className={activeTab === tab.id ? 'opacity-100' : 'opacity-70'}
            >
              {tab.label}
            </AnimatedButton>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="neo-glass-card rounded-2xl p-6 mb-6 border border-red-500/30">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Error</h3>
                    <p className="text-white/60 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="neo-glass-card rounded-2xl p-6 mb-6 border border-green-500/30">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Success</h3>
                    <p className="text-white/60 text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="neo-glass-card rounded-2xl p-8">
              {/* Organization Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Organization Name *</label>
                  <input
                    type="text"
                    value={orgData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your organization name"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={orgData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Country *</label>
                  <select
                    value={orgData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Country</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Germany">Germany</option>
                    <option value="Japan">Japan</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Contact Email *</label>
                  <input
                    type="email"
                    value={orgData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@example.com"
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-white font-medium mb-2">Organization Logo</label>
                  <p className="text-white/60 text-sm mb-2">Upload your organization logo (PNG, JPG, SVG recommended).</p>
                  <div className="flex items-center space-x-4">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-16 h-16 rounded-lg object-cover border border-white/20"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                        <span className="text-white/40 text-xs">Logo</span>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <AnimatedButton
                        variant="primary"
                        size="sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        icon={<NeonCyanIcon type="photo" size={16} className="text-current" />}
                      >
                        Upload Logo
                      </AnimatedButton>
                    </div>
                  </div>
                </div>

                {/* Investment Thesis */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Investment Thesis</h3>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Investment Stages</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableStages.map(stage => (
                        <label key={stage} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={orgData.thesis.stages.includes(stage)}
                            onChange={(e) => {
                              const stages = e.target.checked
                                ? [...orgData.thesis.stages, stage]
                                : orgData.thesis.stages.filter(s => s !== stage);
                              handleInputChange('thesis.stages', stages);
                            }}
                            className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white/80 text-sm">{stage}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Sectors of Interest</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableSectors.map(sector => (
                        <label key={sector} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={orgData.thesis.sectors.includes(sector)}
                            onChange={(e) => {
                              const sectors = e.target.checked
                                ? [...orgData.thesis.sectors, sector]
                                : orgData.thesis.sectors.filter(s => s !== sector);
                              handleInputChange('thesis.sectors', sectors);
                            }}
                            className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white/80 text-sm">{sector}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Blockchain Networks</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {availableChains.map(chain => (
                        <label key={chain} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={orgData.thesis.chains.includes(chain)}
                            onChange={(e) => {
                              const chains = e.target.checked
                                ? [...orgData.thesis.chains, chain]
                                : orgData.thesis.chains.filter(c => c !== chain);
                              handleInputChange('thesis.chains', chains);
                            }}
                            className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white/80 text-sm">{chain}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Assets Under Management (AUM)</label>
                  <input
                    type="number"
                    value={orgData.aum || ''}
                    onChange={(e) => handleInputChange('aum', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter AUM in USD"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-end space-x-4">
                <AnimatedButton
                  variant="primary"
                  size="md"
                  onClick={() => router.push('/vc/dashboard')}
                >
                  Cancel
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  loading={busy}
                  disabled={busy}
                >
                  {busy ? 'Updating...' : 'Update Profile'}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}

        {/* Team Management Tab */}
        {activeTab === 'team' && (
          <div className="max-w-4xl mx-auto">
            <div className="neo-glass-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <NeonCyanIcon type="users" size={32} className="text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">Team Management</h2>
              <p className="text-white/60 mb-6">
                Manage your VC team members, invite new members, and control access permissions.
              </p>
              
              <AnimatedButton
                variant="primary"
                size="md"
                onClick={() => router.push('/vc/settings/team')}
                icon={<NeonCyanIcon type="users" size={20} className="text-current" />}
              >
                Go to Team Settings
              </AnimatedButton>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="max-w-4xl mx-auto">
            <div className="neo-glass-card rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Security Settings</h2>
              <p className="text-white/60">Security features coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
