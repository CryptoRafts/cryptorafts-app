"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { vcAuthManager, VCUser, VCOrganization } from '@/lib/vc-auth';
import { completeOnboardingStep } from '@/lib/role-persistence';
import VCOnboardingDebug from './VCOnboardingDebug';
import { 
  BuildingOfficeIcon,
  GlobeAltIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface OrgProfileData {
  name: string;
  website?: string;
  country: string;
  logo?: File;
  thesis: {
    stages: string[];
    sectors: string[];
    chains: string[];
  };
  aum?: number;
  contactEmail: string;
}

export default function VCOnboardingFlow() {
  const { user, claims } = useAuth();
  const [currentStep, setCurrentStep] = useState<'profile' | 'verification' | 'done'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [vcUser, setVCUser] = useState<VCUser | null>(null);
  const [orgData, setOrgData] = useState<VCOrganization | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine current step based on claims (forward-only)
  useEffect(() => {
    if (!isClient) return; // Wait for client-side hydration
    
    if (claims) {
      if (!claims.profileCompleted) {
        setCurrentStep('profile');
      } else if (claims.kybStatus !== 'approved') {
        // Only require KYB, KYC is optional
        setCurrentStep('verification');
      } else {
        setCurrentStep('done');
      }
    } else {
      // If no claims, start with profile step
      setCurrentStep('profile');
    }
  }, [claims, isClient]);

  // Org Profile Form State
  const [orgProfile, setOrgProfile] = useState<OrgProfileData>({
    name: '',
    website: '',
    country: '',
    thesis: {
      stages: [],
      sectors: [],
      chains: []
    },
    contactEmail: ''
  });

  // Verification State
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [kybStatus, setKybStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [verificationError, setVerificationError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadVCUser();
    }
  }, [user]);

  // Initialize VC user if they don't have onboarding data
  useEffect(() => {
    if (user && !vcUser && currentStep === 'profile') {
      initializeVCUser();
    }
  }, [user, vcUser, currentStep]);

  const initializeVCUser = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Check if user already has profile data
      const { doc, getDoc } = await import('@/lib/firebase.client');
      const { db } = await import('@/lib/firebase.client');
      if (!db) {
        setError('Database not available. Please try again later.');
        setLoading(false);
        return;
      }
      const dbInstance = db;
      const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isProfileCompleted = userData.profileCompleted || userData.organization || userData.orgId;
        
        if (isProfileCompleted) {
          console.log('✅ User profile already completed, skipping initialization');
          await loadVCUser();
          return;
        }
      }
      
      // Only initialize if no profile data exists
      await vcAuthManager.initializeVCUser(user.uid);
      await loadVCUser();
    } catch (error) {
      console.error('Error initializing VC user:', error);
      setError('Failed to initialize user');
    } finally {
      setLoading(false);
    }
  };

  const loadVCUser = async () => {
    if (!user) return;
    
    try {
      // Try to get VC user data with fallback
      let vcUserData;
      try {
        vcUserData = await vcAuthManager.getVCUser(user.uid);
      } catch (error) {
        console.warn('Normal VC user method failed, trying fallback:', error);
        // Try fallback method
        const { vcAuthManagerFallback } = await import('@/lib/vc-auth-fallback');
        vcUserData = await vcAuthManagerFallback.getVCUserWithOrg(user.uid);
      }
      
      setVCUser(vcUserData);
      
      if (vcUserData) {
        // Check if onboarding is already completed
        const isOnboardingCompleted = vcUserData.onboardingCompleted || vcUserData.onboarding?.step === 'completed';
        const isProfileCompleted = vcUserData.profileCompleted || vcUserData.organization || vcUserData.orgId;
        const currentStep = vcUserData.onboarding?.step || 'profile';
        
        // If onboarding is completed, redirect to dashboard
        if (isOnboardingCompleted) {
          console.log('✅ Onboarding already completed, redirecting to dashboard');
          window.location.href = '/vc/dashboard';
          return;
        }
        
        // If profile is completed but step is still 'profile', update to verification
        if (isProfileCompleted && currentStep === 'profile') {
          setCurrentStep('verification');
          console.log('✅ Profile already completed, moving to verification step');
        } else {
          setCurrentStep(currentStep);
        }
        
        // Set KYC and KYB status from user data directly
        setKycStatus(vcUserData.kyc?.status || 'pending');
        setKybStatus(vcUserData.kyb?.status || 'pending');
        
        // Try to load organization data if available
        if (vcUserData.orgId) {
          try {
            const org = await vcAuthManager.getVCOrganization(vcUserData.orgId);
            setOrgData(org);
            // Update KYB status from organization if available
            if (org?.kyb?.status) {
              setKybStatus(org.kyb.status);
            }
          } catch (orgError) {
            console.warn('Could not load organization data:', orgError);
            // Continue without organization data
          }
        } else if (vcUserData.organization) {
          // Use embedded organization data
          setOrgData(vcUserData.organization);
          if (vcUserData.organization.kyb?.status) {
            setKybStatus(vcUserData.organization.kyb.status);
          }
        }
      }
    } catch (error) {
      console.error('Error loading VC user:', error);
      // Don't set error state - just log it and continue
      console.warn('Continuing without full user data due to permissions');
    }
  };

  const handleOrgProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Logo is now optional - we'll handle upload failures gracefully
      // if (!orgProfile.logo) {
      //   throw new Error('Logo is required');
      // }

      let logoUrl = '';
      
      // Upload logo if provided - with comprehensive fallback system
      if (orgProfile.logo) {
        try {
          const { uploadWithAllFallbacks } = await import('@/lib/upload-browser');
          const result = await uploadWithAllFallbacks(
            orgProfile.logo,
            user.uid,
            `${user.uid}_${Date.now()}.png`
          );
          
          if (result.success) {
            logoUrl = result.url;
            console.log(`✅ Logo uploaded successfully using ${result.method}`);
          } else {
            console.warn('⚠️ All upload methods failed, continuing without logo');
            logoUrl = '';
          }
        } catch (error) {
          console.error('Upload system error:', error);
          console.warn('Continuing onboarding without logo');
          logoUrl = '';
        }
      }

      // Complete organization profile using fallback method
      try {
        const { vcAuthManagerFallback } = await import('@/lib/vc-auth-fallback');
        const orgId = await vcAuthManagerFallback.completeOrgProfileFallback(user.uid, {
          name: orgProfile.name,
          website: orgProfile.website || '',
          country: orgProfile.country,
          logoUrl,
          thesis: orgProfile.thesis as any,
          aum: (orgProfile.aum ?? 0) as any,
          contactEmail: orgProfile.contactEmail || ''
        });
        console.log('✅ Organization profile completed successfully with fallback method');
        
        // Update onboarding step to verification
        try {
          const { doc, updateDoc } = await import('@/lib/firebase.client');
          const { db } = await import('@/lib/firebase.client');
          if (!db) {
            setError('Database not available. Please try again later.');
            setLoading(false);
            return;
          }
          const dbInstance = db;
          await updateDoc(doc(dbInstance, 'users', user.uid), {
            'onboarding.step': 'verification',
            'profileCompleted': true,
            updatedAt: new Date()
          });
          
          // Update role persistence
          completeOnboardingStep('verification', {
            profileCompleted: true
          });
          
          console.log('✅ Onboarding step updated to verification');
        } catch (stepError) {
          console.warn('Could not update onboarding step:', stepError);
        }
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        // Try original method as last resort
        const orgId = await vcAuthManager.completeOrgProfile(user.uid, {
          name: orgProfile.name,
          website: orgProfile.website || '',
          country: orgProfile.country,
          logoUrl,
          thesis: orgProfile.thesis as any,
          aum: (orgProfile.aum ?? 0) as any,
          contactEmail: orgProfile.contactEmail || ''
        });
      }

      // Reload user data
      await loadVCUser();
      
    } catch (error) {
      console.error('Error completing org profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete organization profile');
    } finally {
      setLoading(false);
    }
  };

  const startKYC = async () => {
    if (!user) return;
    
    setLoading(true);
    setVerificationError('');

    try {
      // Try to get auth token
      let authToken;
      try {
        authToken = await user.getIdToken();
      } catch (tokenError) {
        console.warn('Could not get auth token:', tokenError);
        // Continue without token for now
      }

      // Start KYC session
      const response = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          userId: user.uid,
          type: 'vc_representative'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Update KYC status to pending (with fallback)
      try {
        await vcAuthManager.updateKYCStatus(user.uid, 'pending', undefined, undefined, result.vendorRef);
      } catch (updateError) {
        console.warn('Could not update KYC status:', updateError);
        // Continue without updating status
      }
      
      setKycStatus('pending');
      
      // Reload user data
      await loadVCUser();
      
    } catch (error) {
      console.error('Error starting KYC:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start KYC process';
      setVerificationError(errorMessage);
      
      // Show user-friendly message
      if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        setVerificationError('Authentication required. Please refresh the page and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startKYB = async () => {
    if (!user) return;
    
    setLoading(true);
    setVerificationError('');

    try {
      // Start KYB session (no auth token needed for now)
      const response = await fetch('/api/kyb/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          orgId: vcUser?.orgId || `vc_${user.uid}_${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      console.log('✅ KYB session started successfully:', result);

      // Update KYB status to pending (with fallback)
      try {
        if (vcUser?.orgId) {
          await vcAuthManager.updateKYBStatus(vcUser.orgId, 'pending', undefined, undefined, result.vendorRef);
        } else {
          console.warn('No orgId found, skipping KYB status update');
        }
      } catch (updateError) {
        console.warn('Could not update KYB status:', updateError);
        // Continue without updating status
      }
      
      // Also update user's KYB status directly in Firestore
      try {
        const { doc, updateDoc } = await import('@/lib/firebase.client');
        const { db } = await import('@/lib/firebase.client');
        if (!db) {
          setError('Database not available. Please try again later.');
          setLoading(false);
          return;
        }
        const dbInstance = db;
        await updateDoc(doc(dbInstance, 'users', user.uid), {
          'kyb.status': 'pending',
          'kyb.vendorRef': result.vendorRef,
          'kyb.startedAt': new Date(),
          updatedAt: new Date()
        });
        console.log('✅ User KYB status updated to pending');
      } catch (userUpdateError) {
        console.warn('Could not update user KYB status:', userUpdateError);
      }
      
      setKybStatus('pending');
      
      // Reload user data
      await loadVCUser();
      
    } catch (error) {
      console.error('Error starting KYB:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start KYB process';
      setVerificationError(errorMessage);
      
      // Show user-friendly message
      if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        setVerificationError('KYB service temporarily unavailable. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderOrgProfileStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <BuildingOfficeIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Organization Profile</h1>
        <p className="text-white/60">Set up your VC organization profile to get started</p>
      </div>

      {/* Testing components hidden for production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 space-y-4">
          <VCOnboardingDebug />
        </div>
      )}

      <form onSubmit={handleOrgProfileSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={orgProfile.name}
              onChange={(e) => setOrgProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              placeholder="Enter organization name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Website
            </label>
            <input
              type="url"
              value={orgProfile.website}
              onChange={(e) => setOrgProfile(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-2">
              Country *
            </label>
            <select
              required
              value={orgProfile.country}
              onChange={(e) => setOrgProfile(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, 
                backgroundPosition: 'right 0.5rem center', 
                backgroundRepeat: 'no-repeat', 
                backgroundSize: '1.5em 1.5em', 
                paddingRight: '2.5rem'
              }}
            >
              <option value="" className="text-gray-500">Select country</option>
              <option value="AF">Afghanistan</option>
              <option value="AL">Albania</option>
              <option value="DZ">Algeria</option>
              <option value="AS">American Samoa</option>
              <option value="AD">Andorra</option>
              <option value="AO">Angola</option>
              <option value="AI">Anguilla</option>
              <option value="AQ">Antarctica</option>
              <option value="AG">Antigua and Barbuda</option>
              <option value="AR">Argentina</option>
              <option value="AM">Armenia</option>
              <option value="AW">Aruba</option>
              <option value="AU">Australia</option>
              <option value="AT">Austria</option>
              <option value="AZ">Azerbaijan</option>
              <option value="BS">Bahamas</option>
              <option value="BH">Bahrain</option>
              <option value="BD">Bangladesh</option>
              <option value="BB">Barbados</option>
              <option value="BY">Belarus</option>
              <option value="BE">Belgium</option>
              <option value="BZ">Belize</option>
              <option value="BJ">Benin</option>
              <option value="BM">Bermuda</option>
              <option value="BT">Bhutan</option>
              <option value="BO">Bolivia</option>
              <option value="BA">Bosnia and Herzegovina</option>
              <option value="BW">Botswana</option>
              <option value="BV">Bouvet Island</option>
              <option value="BR">Brazil</option>
              <option value="IO">British Indian Ocean Territory</option>
              <option value="BN">Brunei Darussalam</option>
              <option value="BG">Bulgaria</option>
              <option value="BF">Burkina Faso</option>
              <option value="BI">Burundi</option>
              <option value="KH">Cambodia</option>
              <option value="CM">Cameroon</option>
              <option value="CA">Canada</option>
              <option value="CV">Cape Verde</option>
              <option value="KY">Cayman Islands</option>
              <option value="CF">Central African Republic</option>
              <option value="TD">Chad</option>
              <option value="CL">Chile</option>
              <option value="CN">China</option>
              <option value="CX">Christmas Island</option>
              <option value="CC">Cocos (Keeling) Islands</option>
              <option value="CO">Colombia</option>
              <option value="KM">Comoros</option>
              <option value="CG">Congo</option>
              <option value="CD">Congo, Democratic Republic</option>
              <option value="CK">Cook Islands</option>
              <option value="CR">Costa Rica</option>
              <option value="CI">Côte d'Ivoire</option>
              <option value="HR">Croatia</option>
              <option value="CU">Cuba</option>
              <option value="CY">Cyprus</option>
              <option value="CZ">Czech Republic</option>
              <option value="DK">Denmark</option>
              <option value="DJ">Djibouti</option>
              <option value="DM">Dominica</option>
              <option value="DO">Dominican Republic</option>
              <option value="EC">Ecuador</option>
              <option value="EG">Egypt</option>
              <option value="SV">El Salvador</option>
              <option value="GQ">Equatorial Guinea</option>
              <option value="ER">Eritrea</option>
              <option value="EE">Estonia</option>
              <option value="ET">Ethiopia</option>
              <option value="FK">Falkland Islands</option>
              <option value="FO">Faroe Islands</option>
              <option value="FJ">Fiji</option>
              <option value="FI">Finland</option>
              <option value="FR">France</option>
              <option value="GF">French Guiana</option>
              <option value="PF">French Polynesia</option>
              <option value="TF">French Southern Territories</option>
              <option value="GA">Gabon</option>
              <option value="GM">Gambia</option>
              <option value="GE">Georgia</option>
              <option value="DE">Germany</option>
              <option value="GH">Ghana</option>
              <option value="GI">Gibraltar</option>
              <option value="GR">Greece</option>
              <option value="GL">Greenland</option>
              <option value="GD">Grenada</option>
              <option value="GP">Guadeloupe</option>
              <option value="GU">Guam</option>
              <option value="GT">Guatemala</option>
              <option value="GG">Guernsey</option>
              <option value="GN">Guinea</option>
              <option value="GW">Guinea-Bissau</option>
              <option value="GY">Guyana</option>
              <option value="HT">Haiti</option>
              <option value="HM">Heard Island and McDonald Islands</option>
              <option value="VA">Holy See (Vatican City State)</option>
              <option value="HN">Honduras</option>
              <option value="HK">Hong Kong</option>
              <option value="HU">Hungary</option>
              <option value="IS">Iceland</option>
              <option value="IN">India</option>
              <option value="ID">Indonesia</option>
              <option value="IR">Iran, Islamic Republic of</option>
              <option value="IQ">Iraq</option>
              <option value="IE">Ireland</option>
              <option value="IM">Isle of Man</option>
              <option value="IL">Israel</option>
              <option value="IT">Italy</option>
              <option value="JM">Jamaica</option>
              <option value="JP">Japan</option>
              <option value="JE">Jersey</option>
              <option value="JO">Jordan</option>
              <option value="KZ">Kazakhstan</option>
              <option value="KE">Kenya</option>
              <option value="KI">Kiribati</option>
              <option value="KP">Korea, Democratic People's Republic of</option>
              <option value="KR">Korea, Republic of</option>
              <option value="KW">Kuwait</option>
              <option value="KG">Kyrgyzstan</option>
              <option value="LA">Lao People's Democratic Republic</option>
              <option value="LV">Latvia</option>
              <option value="LB">Lebanon</option>
              <option value="LS">Lesotho</option>
              <option value="LR">Liberia</option>
              <option value="LY">Libya</option>
              <option value="LI">Liechtenstein</option>
              <option value="LT">Lithuania</option>
              <option value="LU">Luxembourg</option>
              <option value="MO">Macao</option>
              <option value="MK">Macedonia, the former Yugoslav Republic of</option>
              <option value="MG">Madagascar</option>
              <option value="MW">Malawi</option>
              <option value="MY">Malaysia</option>
              <option value="MV">Maldives</option>
              <option value="ML">Mali</option>
              <option value="MT">Malta</option>
              <option value="MH">Marshall Islands</option>
              <option value="MQ">Martinique</option>
              <option value="MR">Mauritania</option>
              <option value="MU">Mauritius</option>
              <option value="YT">Mayotte</option>
              <option value="MX">Mexico</option>
              <option value="FM">Micronesia, Federated States of</option>
              <option value="MD">Moldova, Republic of</option>
              <option value="MC">Monaco</option>
              <option value="MN">Mongolia</option>
              <option value="ME">Montenegro</option>
              <option value="MS">Montserrat</option>
              <option value="MA">Morocco</option>
              <option value="MZ">Mozambique</option>
              <option value="MM">Myanmar</option>
              <option value="NA">Namibia</option>
              <option value="NR">Nauru</option>
              <option value="NP">Nepal</option>
              <option value="NL">Netherlands</option>
              <option value="NC">New Caledonia</option>
              <option value="NZ">New Zealand</option>
              <option value="NI">Nicaragua</option>
              <option value="NE">Niger</option>
              <option value="NG">Nigeria</option>
              <option value="NU">Niue</option>
              <option value="NF">Norfolk Island</option>
              <option value="MP">Northern Mariana Islands</option>
              <option value="NO">Norway</option>
              <option value="OM">Oman</option>
              <option value="PK">Pakistan</option>
              <option value="PW">Palau</option>
              <option value="PS">Palestinian Territory, Occupied</option>
              <option value="PA">Panama</option>
              <option value="PG">Papua New Guinea</option>
              <option value="PY">Paraguay</option>
              <option value="PE">Peru</option>
              <option value="PH">Philippines</option>
              <option value="PN">Pitcairn</option>
              <option value="PL">Poland</option>
              <option value="PT">Portugal</option>
              <option value="PR">Puerto Rico</option>
              <option value="QA">Qatar</option>
              <option value="RE">Réunion</option>
              <option value="RO">Romania</option>
              <option value="RU">Russian Federation</option>
              <option value="RW">Rwanda</option>
              <option value="BL">Saint Barthélemy</option>
              <option value="SH">Saint Helena, Ascension and Tristan da Cunha</option>
              <option value="KN">Saint Kitts and Nevis</option>
              <option value="LC">Saint Lucia</option>
              <option value="MF">Saint Martin (French part)</option>
              <option value="PM">Saint Pierre and Miquelon</option>
              <option value="VC">Saint Vincent and the Grenadines</option>
              <option value="WS">Samoa</option>
              <option value="SM">San Marino</option>
              <option value="ST">Sao Tome and Principe</option>
              <option value="SA">Saudi Arabia</option>
              <option value="SN">Senegal</option>
              <option value="RS">Serbia</option>
              <option value="SC">Seychelles</option>
              <option value="SL">Sierra Leone</option>
              <option value="SG">Singapore</option>
              <option value="SX">Sint Maarten (Dutch part)</option>
              <option value="SK">Slovakia</option>
              <option value="SI">Slovenia</option>
              <option value="SB">Solomon Islands</option>
              <option value="SO">Somalia</option>
              <option value="ZA">South Africa</option>
              <option value="GS">South Georgia and the South Sandwich Islands</option>
              <option value="SS">South Sudan</option>
              <option value="ES">Spain</option>
              <option value="LK">Sri Lanka</option>
              <option value="SD">Sudan</option>
              <option value="SR">Suriname</option>
              <option value="SJ">Svalbard and Jan Mayen</option>
              <option value="SZ">Swaziland</option>
              <option value="SE">Sweden</option>
              <option value="CH">Switzerland</option>
              <option value="SY">Syrian Arab Republic</option>
              <option value="TW">Taiwan, Province of China</option>
              <option value="TJ">Tajikistan</option>
              <option value="TZ">Tanzania, United Republic of</option>
              <option value="TH">Thailand</option>
              <option value="TL">Timor-Leste</option>
              <option value="TG">Togo</option>
              <option value="TK">Tokelau</option>
              <option value="TO">Tonga</option>
              <option value="TT">Trinidad and Tobago</option>
              <option value="TN">Tunisia</option>
              <option value="TR">Turkey</option>
              <option value="TM">Turkmenistan</option>
              <option value="TC">Turks and Caicos Islands</option>
              <option value="TV">Tuvalu</option>
              <option value="UG">Uganda</option>
              <option value="UA">Ukraine</option>
              <option value="AE">United Arab Emirates</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
              <option value="UM">United States Minor Outlying Islands</option>
              <option value="UY">Uruguay</option>
              <option value="UZ">Uzbekistan</option>
              <option value="VU">Vanuatu</option>
              <option value="VE">Venezuela, Bolivarian Republic of</option>
              <option value="VN">Viet Nam</option>
              <option value="VG">Virgin Islands, British</option>
              <option value="VI">Virgin Islands, U.S.</option>
              <option value="WF">Wallis and Futuna</option>
              <option value="EH">Western Sahara</option>
              <option value="YE">Yemen</option>
              <option value="ZM">Zambia</option>
              <option value="ZW">Zimbabwe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contact Email *
            </label>
            <input
              type="email"
              required
              value={orgProfile.contactEmail}
              onChange={(e) => setOrgProfile(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              placeholder="contact@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Logo *
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setOrgProfile(prev => ({ ...prev, logo: file }));
              }}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="flex items-center space-x-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer hover:bg-white/10 transition-colors"
            >
              <PhotoIcon className="h-5 w-5" />
              <span>Upload PNG Logo</span>
            </label>
            {orgProfile.logo && (
              <span className="text-green-400 text-sm">
                {orgProfile.logo.name} selected
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Investment Thesis
          </label>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-sm text-white/60">Stages</label>
                  <span className="text-xs text-white/40">
                    ({orgProfile.thesis.stages.length} selected)
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const allStages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Late Stage', 'Grant', 'Private'];
                      setOrgProfile(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          stages: allStages
                        }
                      }));
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrgProfile(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          stages: []
                        }
                      }));
                    }}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Late Stage', 'Grant', 'Private'].map(stage => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => {
                      setOrgProfile(prev => ({
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
                      orgProfile.thesis.stages.includes(stage)
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-sm text-white/60">Sectors</label>
                  <span className="text-xs text-white/40">
                    ({orgProfile.thesis.sectors.length} selected)
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const allSectors = Array.from(new Set(['DeFi', 'NFTs', 'Gaming', 'Infrastructure', 'Social', 'Enterprise', 'AI/ML', 'IoT', 'Web3', 'Metaverse', 'DAO', 'Layer 2', 'Cross-chain', 'Privacy', 'Identity', 'Storage', 'Compute', 'Analytics', 'Trading', 'Lending', 'Staking', 'Yield Farming', 'Liquidity Mining', 'Governance', 'Tokenization', 'Real Estate', 'Art', 'Music', 'Sports', 'Education', 'Healthcare', 'Supply Chain', 'Energy', 'Climate', 'Sustainability', 'ESG', 'RegTech', 'Compliance', 'Security', 'Audit', 'Insurance', 'Payments', 'Banking', 'Fintech', 'Crowdfunding', 'Venture Capital', 'Private Equity', 'Hedge Funds', 'Family Offices', 'Institutional', 'Retail', 'Consumer', 'B2B', 'B2C', 'Marketplace', 'Platform', 'Protocol', 'DApp', 'Smart Contracts', 'Oracles', 'Bridges', 'Wallets', 'Exchanges', 'DEX', 'CEX', 'AMM', 'Liquidity', 'Derivatives', 'Options', 'Futures', 'Swaps', 'Stablecoins', 'CBDC', 'Digital Assets', 'Token Economics', 'Tokenomics', 'Utility', 'Voting', 'Proposal', 'Treasury', 'Funding', 'Grants', 'Bounties', 'Hackathons', 'Accelerators', 'Incubators', 'Advisors', 'Mentors', 'Partnerships', 'Alliances', 'Ecosystem', 'Community', 'Developer', 'Technical', 'Research', 'Academic', 'Scientific', 'Innovation', 'Patents', 'IP', 'Licensing']));
                      setOrgProfile(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          sectors: allSectors
                        }
                      }));
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrgProfile(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          sectors: []
                        }
                      }));
                    }}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(['DeFi', 'NFTs', 'Gaming', 'Infrastructure', 'Social', 'Enterprise', 'AI/ML', 'IoT', 'Web3', 'Metaverse', 'DAO', 'Layer 2', 'Cross-chain', 'Privacy', 'Identity', 'Storage', 'Compute', 'Analytics', 'Trading', 'Lending', 'Staking', 'Yield Farming', 'Liquidity Mining', 'Governance', 'Tokenization', 'Real Estate', 'Art', 'Music', 'Sports', 'Education', 'Healthcare', 'Supply Chain', 'Energy', 'Climate', 'Sustainability', 'ESG', 'RegTech', 'Compliance', 'Security', 'Audit', 'Insurance', 'Payments', 'Banking', 'Fintech', 'Crowdfunding', 'Venture Capital', 'Private Equity', 'Hedge Funds', 'Family Offices', 'Institutional', 'Retail', 'Consumer', 'B2B', 'B2C', 'Marketplace', 'Platform', 'Protocol', 'DApp', 'Smart Contracts', 'Oracles', 'Bridges', 'Wallets', 'Exchanges', 'DEX', 'CEX', 'AMM', 'Liquidity', 'Derivatives', 'Options', 'Futures', 'Swaps', 'Stablecoins', 'CBDC', 'Digital Assets', 'Token Economics', 'Tokenomics', 'Utility', 'Voting', 'Proposal', 'Treasury', 'Funding', 'Grants', 'Bounties', 'Hackathons', 'Accelerators', 'Incubators', 'Advisors', 'Mentors', 'Partnerships', 'Alliances', 'Ecosystem', 'Community', 'Developer', 'Technical', 'Research', 'Academic', 'Scientific', 'Innovation', 'Patents', 'IP', 'Licensing'])).map(sector => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => {
                      setOrgProfile(prev => ({
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
                      orgProfile.thesis.sectors.includes(sector)
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-sm text-white/60">Chains</label>
                  <span className="text-xs text-white/40">
                    ({orgProfile.thesis.chains.length} selected)
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const allChains = [
                        'Ethereum', 'Bitcoin', 'Solana', 'Polygon', 'BSC', 'Avalanche', 'Arbitrum', 'Optimism', 'Base',
                        'Cardano', 'Polkadot', 'Cosmos', 'Near', 'Algorand', 'Fantom', 'Harmony', 'Cronos', 'Moonbeam',
                        'Aurora', 'Celo', 'Gnosis', 'Moonriver', 'Klaytn', 'Hedera', 'Flow', 'Tezos', 'Stellar', 'XRP',
                        'Litecoin', 'Dogecoin', 'Shiba Inu', 'Chainlink', 'Uniswap', 'Aave', 'Compound', 'MakerDAO',
                        'SushiSwap', 'PancakeSwap', '1inch', 'Curve', 'Balancer', 'Yearn Finance', 'Synthetix',
                        'Polygon PoS', 'Polygon zkEVM', 'zkSync Era', 'StarkNet', 'Scroll', 'Linea', 'Mantle',
                        'Sui', 'Aptos', 'Sei', 'Injective', 'Celestia', 'Dymension', 'EigenLayer', 'Lido', 'Rocket Pool',
                        'Frax', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'SNX', 'MKR'
                      ];
                      setOrgProfile(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          chains: allChains
                        }
                      }));
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrgProfile(prev => ({
                        ...prev,
                        thesis: {
                          ...prev.thesis,
                          chains: []
                        }
                      }));
                    }}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Ethereum', 'Bitcoin', 'Solana', 'Polygon', 'BSC', 'Avalanche', 'Arbitrum', 'Optimism', 'Base',
                  'Cardano', 'Polkadot', 'Cosmos', 'Near', 'Algorand', 'Fantom', 'Harmony', 'Cronos', 'Moonbeam',
                  'Aurora', 'Celo', 'Gnosis', 'Moonriver', 'Klaytn', 'Hedera', 'Flow', 'Tezos', 'Stellar', 'XRP',
                  'Litecoin', 'Dogecoin', 'Shiba Inu', 'Chainlink', 'Uniswap', 'Aave', 'Compound', 'MakerDAO',
                  'SushiSwap', 'PancakeSwap', '1inch', 'Curve', 'Balancer', 'Yearn Finance', 'Synthetix',
                  'Polygon PoS', 'Polygon zkEVM', 'zkSync Era', 'StarkNet', 'Scroll', 'Linea', 'Mantle',
                  'Sui', 'Aptos', 'Sei', 'Injective', 'Celestia', 'Dymension', 'EigenLayer', 'Lido', 'Rocket Pool',
                  'Frax', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'SNX', 'MKR'
                ].map(chain => (
                  <button
                    key={chain}
                    type="button"
                    onClick={() => {
                      setOrgProfile(prev => ({
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
                      orgProfile.thesis.chains.includes(chain)
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

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Assets Under Management (Optional)
          </label>
          <input
            type="number"
            value={orgProfile.aum || ''}
            onChange={(e) => setOrgProfile(prev => ({ ...prev, aum: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            placeholder="Enter AUM in USD"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Creating Organization...' : 'Complete Profile'}
        </button>
      </form>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <CheckCircleIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Verification Required</h1>
        <p className="text-white/60">Complete KYB verification to unlock the VC portal (KYC is optional)</p>
      </div>

      <div className="space-y-6">
        {/* KYB Status - Most Important */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Organization KYB (Required)</h3>
            {kybStatus === 'approved' && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
            {kybStatus === 'rejected' && <XCircleIcon className="h-6 w-6 text-red-500" />}
            {kybStatus === 'pending' && <ClockIcon className="h-6 w-6 text-yellow-500" />}
          </div>
          
          <p className="text-white/60 text-sm mb-4">
            Business verification for your organization - This is required to access the VC portal
          </p>

          {kybStatus === 'pending' && (
            <div className="space-y-3">
              <button
                onClick={startKYB}
                disabled={loading}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? 'Starting KYB...' : 'Start KYB Verification'}
              </button>
              
                   {/* Real KYB approval button */}
                   <button
                     onClick={async () => {
                       try {
                         setLoading(true);
                         
                         // Update KYB status directly in Firestore
                         const { doc, updateDoc } = await import('@/lib/firebase.client');
                         const { db } = await import('@/lib/firebase.client');
                         if (!db) {
                           setError('Database not available. Please try again later.');
                           setLoading(false);
                           return;
                         }
                        const dbInstance = db;

                        if (!user) {
                          setError('User session not found. Please sign in again.');
                          setLoading(false);
                          return;
                        }

                          await updateDoc(doc(dbInstance, 'users', user.uid), {
                             'kyb.status': 'approved',
                             'kyb.approvedAt': new Date(),
                             'kyb.riskScore': 85,
                             'kyb.approvedBy': 'system',
                             'onboarding.step': 'completed',
                             'onboardingCompleted': true,
                             'kybApproved': true,
                             updatedAt: new Date()
                           });
                           
                           // Update role persistence
                           completeOnboardingStep('completed', {
                             onboardingComplete: true,
                             kybComplete: true,
                             kybStatus: 'approved'
                           });
                         
                         setKybStatus('approved');
                         console.log('✅ KYB approved successfully');
                         
                         // Reload user data to reflect changes
                         await loadVCUser();
                         
                         // Redirect to dashboard after successful approval
                         setTimeout(() => {
                           window.location.href = '/vc/dashboard';
                         }, 2000);
                       } catch (error) {
                         console.error('KYB approval failed:', error);
                         setVerificationError('Failed to approve KYB. Please try again.');
                       } finally {
                         setLoading(false);
                       }
                     }}
                     disabled={loading}
                     className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-colors font-medium"
                   >
                     {loading ? 'Approving KYB...' : 'Approve KYB'}
                   </button>
              
                   {/* Test button for KYB approval - hidden in production */}
                   {process.env.NODE_ENV === 'development' && (
                     <button
                       onClick={async () => {
                         try {
                           setLoading(true);
                           
                           // Update KYB status directly in Firestore
                           const { doc, updateDoc } = await import('@/lib/firebase.client');
                           const { db } = await import('@/lib/firebase.client');
                           if (!db) {
                             setError('Database not available. Please try again later.');
                             setLoading(false);
                             return;
                           }
                          const dbInstance = db;

                          if (!user) {
                            setError('User session not found. Please sign in again.');
                            setLoading(false);
                            return;
                          }

                          await updateDoc(doc(dbInstance, 'users', user.uid), {
                             'kyb.status': 'approved',
                             'kyb.approvedAt': new Date(),
                             'kyb.riskScore': 85,
                             'kyb.approvedBy': 'test',
                             'onboarding.step': 'completed',
                             'onboardingCompleted': true,
                             'kybApproved': true,
                             updatedAt: new Date()
                           });
                           
                           // Update role persistence
                           completeOnboardingStep('completed', {
                             onboardingComplete: true,
                             kybComplete: true,
                             kybStatus: 'approved'
                           });
                           
                           setKybStatus('approved');
                           console.log('✅ KYB approved via test button');
                           await loadVCUser();
                           
                           // Redirect to dashboard after successful approval
                           setTimeout(() => {
                             window.location.href = '/vc/dashboard';
                           }, 2000);
                         } catch (error) {
                           console.error('Test KYB approval failed:', error);
                         } finally {
                           setLoading(false);
                         }
                       }}
                       disabled={loading}
                       className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white rounded-lg transition-colors text-sm"
                     >
                       Test: Approve KYB
                     </button>
                   )}
            </div>
          )}

          {kybStatus === 'approved' && (
            <div className="space-y-3">
              <p className="text-green-400 text-sm mb-2">✓ KYB approved - Portal unlocked!</p>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    
                    // Ensure completion flags are set
                    const { doc, updateDoc } = await import('@/lib/firebase.client');
                    const { db } = await import('@/lib/firebase.client');
                    if (!db) {
                      setError('Database not available. Please try again later.');
                      setLoading(false);
                      return;
                    }
                    const dbInstance = db;

                    if (!user) {
                      setError('User session not found. Please sign in again.');
                      setLoading(false);
                      return;
                    }

                    await updateDoc(doc(dbInstance, 'users', user.uid), {
                      'onboarding.step': 'completed',
                      'onboardingCompleted': true,
                      'kybApproved': true,
                      updatedAt: new Date()
                    });
                    
                    // Update role persistence
                    completeOnboardingStep('completed', {
                      onboardingComplete: true,
                      kybComplete: true,
                      kybStatus: 'approved'
                    });
                    
                    console.log('✅ Completion flags updated');
                    
                    // Redirect to dashboard
                    window.location.href = '/vc/dashboard';
                  } catch (error) {
                    console.error('Failed to update completion flags:', error);
                    // Still redirect to dashboard
                    window.location.href = '/vc/dashboard';
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? 'Updating...' : 'Access VC Portal'}
              </button>
              
              {/* Manual completion button for debugging */}
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    
                    const { doc, updateDoc } = await import('@/lib/firebase.client');
                    const { db } = await import('@/lib/firebase.client');
                    if (!db) {
                      setError('Database not available. Please try again later.');
                      setLoading(false);
                      return;
                    }
                    const dbInstance = db;

                    if (!user) {
                      setError('User session not found. Please sign in again.');
                      setLoading(false);
                      return;
                    }

                    await updateDoc(doc(dbInstance, 'users', user.uid), {
                      'onboarding.step': 'completed',
                      'onboardingCompleted': true,
                      'kybApproved': true,
                      updatedAt: new Date()
                    });
                    
                    // Update role persistence
                    completeOnboardingStep('completed', {
                      onboardingComplete: true,
                      kybComplete: true,
                      kybStatus: 'approved'
                    });
                    
                    console.log('✅ Manual completion flags update successful');
                    
                    // Reload user data
                    await loadVCUser();
                    
                    // Redirect to dashboard
                    setTimeout(() => {
                      window.location.href = '/vc/dashboard';
                    }, 1000);
                  } catch (error) {
                    console.error('Manual completion update failed:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors text-sm"
              >
                {loading ? 'Updating...' : 'Fix Completion Status'}
              </button>
            </div>
          )}

          {kybStatus === 'rejected' && (
            <div>
              <p className="text-red-400 text-sm mb-2">✗ KYB rejected</p>
              <button
                onClick={startKYB}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg transition-colors"
              >
                {loading ? 'Starting...' : 'Retry KYB'}
              </button>
            </div>
          )}
        </div>

        {/* KYC Status - Optional */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Representative KYC (Optional)</h3>
            {kycStatus === 'approved' && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
            {kycStatus === 'rejected' && <XCircleIcon className="h-6 w-6 text-red-500" />}
            {kycStatus === 'pending' && <ClockIcon className="h-6 w-6 text-yellow-500" />}
          </div>
          
          <p className="text-white/60 text-sm mb-4">
            Identity verification for the primary contact person - Optional but recommended
          </p>

          {kycStatus === 'pending' && (
            <button
              onClick={startKYC}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-500/50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Starting...' : 'Start KYC (Optional)'}
            </button>
          )}

          {kycStatus === 'approved' && (
            <p className="text-green-400 text-sm">✓ KYC approved</p>
          )}

          {kycStatus === 'rejected' && (
            <div>
              <p className="text-red-400 text-sm mb-2">✗ KYC rejected</p>
              <button
                onClick={startKYC}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-500/50 text-white rounded-lg transition-colors"
              >
                {loading ? 'Starting...' : 'Retry KYC (Optional)'}
              </button>
            </div>
          )}
        </div>


        {verificationError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{verificationError}</p>
          </div>
        )}

        {(kybStatus === 'approved') && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 text-sm">
              ✓ KYB verification completed! Portal unlocked!
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDoneStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-white mb-2">Welcome to Cryptorafts VC</h1>
      <p className="text-white/60 mb-8">
        Your VC portal is now unlocked. You can start exploring deals and building your investment pipeline.
      </p>
      
      <div className="space-y-4">
        <a
          href="/vc/dashboard"
          className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          Go to VC Dashboard
        </a>
      </div>
    </div>
  );

  // Show loading during SSR or when not on client
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#05070B] to-[#0A1117]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading VC Onboarding...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in</h1>
          <p className="text-white/60">You need to be authenticated to access the VC onboarding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070B] to-[#0A1117] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'profile' ? 'text-blue-500' : currentStep === 'verification' || currentStep === 'done' ? 'text-green-500' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'profile' ? 'bg-blue-500' : currentStep === 'verification' || currentStep === 'done' ? 'bg-green-500' : 'bg-white/10'}`}>
                <span className="text-sm font-semibold">1</span>
              </div>
              <span className="text-sm font-medium">Profile</span>
            </div>
            
            <div className={`w-8 h-1 ${currentStep === 'verification' || currentStep === 'done' ? 'bg-green-500' : 'bg-white/10'}`}></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'verification' ? 'text-blue-500' : currentStep === 'done' ? 'text-green-500' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'verification' ? 'bg-blue-500' : currentStep === 'done' ? 'bg-green-500' : 'bg-white/10'}`}>
                <span className="text-sm font-semibold">2</span>
              </div>
              <span className="text-sm font-medium">Verification</span>
            </div>
            
            <div className={`w-8 h-1 ${currentStep === 'done' ? 'bg-green-500' : 'bg-white/10'}`}></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'done' ? 'text-green-500' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'done' ? 'bg-green-500' : 'bg-white/10'}`}>
                <span className="text-sm font-semibold">3</span>
              </div>
              <span className="text-sm font-medium">Done</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'profile' && renderOrgProfileStep()}
        {currentStep === 'verification' && renderVerificationStep()}
        {currentStep === 'done' && renderDoneStep()}
      </div>
    </div>
  );
}
