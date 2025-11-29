"use client";

import React, { useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase.client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function VCRegisterOrg() {
  const { user, claims } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // Organization Info
    orgName: '',
    orgType: 'vc_firm',
    registrationNumber: '',
    foundedYear: '',
    
    // Contact Info
    email: '',
    phone: '',
    website: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    
    // Investment Info
    aum: '', // Assets Under Management
    investmentStage: [] as string[],
    sectors: [] as string[],
    ticketSize: '',
    
    // Team
    teamSize: '',
    partnerCount: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name as keyof typeof prev].includes(value)
        ? (prev[name as keyof typeof prev] as string[]).filter((item: string) => item !== value)
        : [...(prev[name as keyof typeof prev] as string[]), value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    try {
      setLoading(true);

      // Save organization to Firestore
      const orgId = `org_${user.uid}_${Date.now()}`;
      await setDoc(doc(db!, 'organizations', orgId), {
        ...formData,
        orgId,
        vcUserId: user.uid,
        vcEmail: user.email,
        status: 'pending_kyb',
        kybStatus: 'not_submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user profile with org reference
      await setDoc(doc(db!, 'users', user.uid), {
        organizationId: orgId,
        organizationName: formData.orgName,
        hasOrganization: true,
        kybStatus: 'not_submitted',
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Organization registered:', orgId);
      
      // Redirect to KYB submission
      router.push('/vc/kyb-submission');
    } catch (error) {
      console.error('Error registering organization:', error);
      alert('Failed to register organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || claims?.role !== 'vc') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Access denied. VC role required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Register Your VC Firm
          </h1>
          <p className="text-gray-300 text-lg">
            Complete your organization profile to access the full VC dashboard
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600' : 'bg-gray-700'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Organization Info</span>
            </div>
            <div className="w-16 h-1 bg-gray-700"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Investment Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-700"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600' : 'bg-gray-700'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          {/* Step 1: Organization Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <BuildingOfficeIcon className="w-8 h-8 mr-3 text-blue-400" />
                Organization Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="e.g., Acme Ventures"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Company registration number"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Founded Year *
                  </label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleChange}
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="e.g., 2020"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Organization Type *
                  </label>
                  <select
                    name="orgType"
                    value={formData.orgType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="vc_firm">VC Firm</option>
                    <option value="angel_network">Angel Network</option>
                    <option value="corporate_vc">Corporate VC</option>
                    <option value="family_office">Family Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="contact@vcfirm.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="https://www.vcfirm.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Country"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Next: Investment Details
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Investment Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <ChartBarIcon className="w-8 h-8 mr-3 text-blue-400" />
                Investment Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Assets Under Management (AUM) *
                  </label>
                  <select
                    name="aum"
                    value={formData.aum}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">Select AUM range</option>
                    <option value="under_10m">Under $10M</option>
                    <option value="10m_50m">$10M - $50M</option>
                    <option value="50m_100m">$50M - $100M</option>
                    <option value="100m_500m">$100M - $500M</option>
                    <option value="500m_1b">$500M - $1B</option>
                    <option value="over_1b">Over $1B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Typical Ticket Size *
                  </label>
                  <select
                    name="ticketSize"
                    value={formData.ticketSize}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">Select ticket size</option>
                    <option value="under_100k">Under $100K</option>
                    <option value="100k_500k">$100K - $500K</option>
                    <option value="500k_1m">$500K - $1M</option>
                    <option value="1m_5m">$1M - $5M</option>
                    <option value="5m_10m">$5M - $10M</option>
                    <option value="over_10m">Over $10M</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Team Size *
                  </label>
                  <input
                    type="number"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="e.g., 10"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Number of Partners *
                  </label>
                  <input
                    type="number"
                    name="partnerCount"
                    value={formData.partnerCount}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="e.g., 3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    Investment Stages * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Late Stage'].map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => handleMultiSelect('investmentStage', stage)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.investmentStage.includes(stage)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    Focus Sectors * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Blockchain', 'DeFi', 'NFT', 'Web3', 'Gaming', 'Metaverse', 'DAO', 'Infrastructure'].map((sector) => (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => handleMultiSelect('sectors', sector)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.sectors.includes(sector)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <CheckCircleIcon className="w-8 h-8 mr-3 text-blue-400" />
                Review & Submit
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Organization Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400">Name:</span> <span className="text-white ml-2">{formData.orgName}</span></div>
                    <div><span className="text-gray-400">Type:</span> <span className="text-white ml-2">{formData.orgType}</span></div>
                    <div><span className="text-gray-400">Founded:</span> <span className="text-white ml-2">{formData.foundedYear}</span></div>
                    <div><span className="text-gray-400">Email:</span> <span className="text-white ml-2">{formData.email}</span></div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Investment Profile</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400">AUM:</span> <span className="text-white ml-2">{formData.aum}</span></div>
                    <div><span className="text-gray-400">Ticket Size:</span> <span className="text-white ml-2">{formData.ticketSize}</span></div>
                    <div><span className="text-gray-400">Team Size:</span> <span className="text-white ml-2">{formData.teamSize}</span></div>
                    <div><span className="text-gray-400">Partners:</span> <span className="text-white ml-2">{formData.partnerCount}</span></div>
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-400">Stages:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.investmentStage.map(stage => (
                        <span key={stage} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">{stage}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-400">Sectors:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.sectors.map(sector => (
                        <span key={sector} className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">{sector}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mt-6">
                <p className="text-blue-200 text-sm">
                  <strong>Next Step:</strong> After registration, you'll be directed to submit KYB (Know Your Business) documents for verification.
                </p>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Register Organization</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

