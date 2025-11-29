"use client";
import React, { useState } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { raftai } from '@/lib/raftai';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { useRouter } from 'next/navigation';
import OnboardingHeader from './OnboardingHeader';

interface KYBStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  required: boolean;
}

interface VerificationResult {
  status: 'processing' | 'approved' | 'rejected' | 'pending';
  riskScore?: number;
  reasons?: string[];
  cooldownUntil?: number;
  details?: any;
}

// Step Components
function EntityDetailsStep({ data, onDataUpdate, onNext }: any) {
  const [formData, setFormData] = useState({
    legalName: data.legalName || '',
    registrationNumber: data.registrationNumber || '',
    country: data.country || '',
    businessType: data.businessType || '',
    website: data.website || '',
    description: data.description || ''
  });

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataUpdate(newData);
  };

  const canProceed = formData.legalName && formData.registrationNumber && formData.country;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Legal Business Name *</label>
            <input
              type="text"
              value={formData.legalName}
              onChange={(e) => handleInputChange('legalName', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="Enter legal business name"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Registration Number *</label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="Enter registration number"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Country *</label>
            <select
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="SG">Singapore</option>
              <option value="CH">Switzerland</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="JP">Japan</option>
              <option value="HK">Hong Kong</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Business Type</label>
            <select
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Business Type</option>
              <option value="corporation">Corporation</option>
              <option value="llc">Limited Liability Company</option>
              <option value="partnership">Partnership</option>
              <option value="sole_proprietorship">Sole Proprietorship</option>
              <option value="non_profit">Non-Profit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Business Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              placeholder="Brief description of your business"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function RegistrationDocsStep({ data, onDataUpdate, onNext, onPrevious }: any) {
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `kyb-documents/registration-${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const newDoc = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        downloadURL: downloadURL,
        uploadedAt: new Date().toISOString()
      };

      setDocuments(prev => [...prev, file]);
      onDataUpdate({
        ...data,
        registrationDocs: [...(data.registrationDocs || []), newDoc]
      });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const canProceed = documents.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Registration Documents</h3>
        <p className="text-white/70">Upload your business registration documents (Certificate of Incorporation, Articles of Association, etc.)</p>
        
        <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                Array.from(e.target.files).forEach(file => handleFileUpload(file));
              }
            }}
            className="hidden"
            id="docs-upload"
            disabled={uploading}
          />
          <label htmlFor="docs-upload" className={`cursor-pointer block ${uploading ? 'opacity-50' : ''}`}>
            <div className="text-white/60 mb-4">
              {documents.length > 0 ? `${documents.length} document(s) uploaded` : 'Click to upload registration documents'}
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-green-400 text-xl">📄</span>
            </div>
          </label>
        </div>

        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-white font-medium">Uploaded Documents:</h4>
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/70 text-sm">{doc.name}</span>
                <span className="text-green-400 text-sm">✓</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <div className="text-center text-white/70">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          Uploading documents...
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed || uploading}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed && !uploading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function DirectorsStep({ data, onDataUpdate, onNext, onPrevious }: any) {
  const [directors, setDirectors] = useState(data.directors || [
    { name: '', email: '', position: '', ownership: '' }
  ]);

  const handleDirectorChange = (index: number, field: string, value: string) => {
    const newDirectors = [...directors];
    newDirectors[index] = { ...newDirectors[index], [field]: value };
    setDirectors(newDirectors);
    onDataUpdate({ ...data, directors: newDirectors });
  };

  const addDirector = () => {
    setDirectors([...directors, { name: '', email: '', position: '', ownership: '' }]);
  };

  const removeDirector = (index: number) => {
    if (directors.length > 1) {
      const newDirectors = directors.filter((_: any, i: number) => i !== index);
      setDirectors(newDirectors);
      onDataUpdate({ ...data, directors: newDirectors });
    }
  };

  const canProceed = directors.every((d: any) => d.name && d.email && d.position);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Directors & Key Personnel</h3>
        <p className="text-white/70">Provide information about your company's directors and key personnel</p>
        
        <div className="space-y-4">
          {directors.map((director: any, index: number) => (
            <div key={index} className="bg-white/5 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-medium">Director {index + 1}</h4>
                {directors.length > 1 && (
                  <button
                    onClick={() => removeDirector(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={director.name}
                    onChange={(e) => handleDirectorChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={director.email}
                    onChange={(e) => handleDirectorChange(index, 'email', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Position *</label>
                  <input
                    type="text"
                    value={director.position}
                    onChange={(e) => handleDirectorChange(index, 'position', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., CEO, Director, CFO"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Ownership %</label>
                  <input
                    type="text"
                    value={director.ownership}
                    onChange={(e) => handleDirectorChange(index, 'ownership', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 25%"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addDirector}
          className="w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-white/70 hover:border-white/40 hover:text-white transition-all"
        >
          + Add Another Director
        </button>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ReviewSubmitStep({ data, onSubmit, onPrevious, isProcessing }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Review & Submit</h3>
        <p className="text-white/70">Please review your information before submitting for verification</p>
        
        <div className="bg-white/5 rounded-lg p-6 space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Entity Details</h4>
            <div className="text-white/70 text-sm space-y-1">
              <div>Legal Name: {data.legalName || 'Not provided'}</div>
              <div>Registration Number: {data.registrationNumber || 'Not provided'}</div>
              <div>Country: {data.country || 'Not provided'}</div>
              <div>Business Type: {data.businessType || 'Not provided'}</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Registration Documents</h4>
            <div className="text-white/70 text-sm">
              {data.registrationDocs?.length > 0 
                ? `${data.registrationDocs.length} document(s) uploaded`
                : 'No documents uploaded'
              }
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Directors</h4>
            <div className="text-white/70 text-sm">
              {data.directors?.length > 0 
                ? `${data.directors.length} director(s) listed`
                : 'No directors listed'
              }
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          disabled={isProcessing}
          className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isProcessing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
}

// New step for AI verification and matching
function AIVerificationStep({ result, onRetry }: any) {
  if (!result) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '🔄';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}>
          <span className="mr-2">{getStatusIcon(result.status)}</span>
          {result.status.toUpperCase()}
        </div>
      </div>

      {result.riskScore && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-2">Risk Assessment</h4>
          <div className="text-white/70">
            Risk Score: <span className="font-mono">{result.riskScore}/100</span>
          </div>
        </div>
      )}

      {result.reasons && result.reasons.length > 0 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-2">Verification Details</h4>
          <ul className="space-y-2">
            {result.reasons.map((reason: string, index: number) => (
              <li key={index} className="text-white/70 text-sm">• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {result.cooldownUntil && (
        <div className="bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-6">
          <h4 className="text-yellow-400 font-medium mb-2">Cooldown Period</h4>
          <p className="text-yellow-300 text-sm">
            You can retry verification after: {new Date(result.cooldownUntil).toLocaleString()}
          </p>
        </div>
      )}

      {result.status === 'rejected' && result.cooldownUntil && new Date() > new Date(result.cooldownUntil) && (
        <div className="text-center">
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            Retry Verification
          </button>
        </div>
      )}

      {result.status === 'approved' && (
        <div className="text-center">
          <div className="text-green-400 text-lg font-medium mb-4">
            🎉 Verification Successful!
          </div>
          <p className="text-white/70">
            Your KYB verification has been approved. You can now access all platform features.
          </p>
        </div>
      )}
    </div>
  );
}

export default function KYBVerification() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState<any>({});
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  const steps: KYBStep[] = [
    {
      id: 'entity_details',
      title: 'Entity Details',
      description: 'Provide your business entity information',
      component: EntityDetailsStep,
      required: true
    },
    {
      id: 'registration_docs',
      title: 'Registration Documents',
      description: 'Upload your business registration documents',
      component: RegistrationDocsStep,
      required: true
    },
    {
      id: 'directors',
      title: 'Directors & Key Personnel',
      description: 'List your company directors and key personnel',
      component: DirectorsStep,
      required: true
    },
    {
      id: 'review_submit',
      title: 'Review & Submit',
      description: 'Review your information and submit for verification',
      component: ReviewSubmitStep,
      required: true
    }
  ];

  const handleDataUpdate = (stepId: string, data: any) => {
    setVerificationData((prev: any) => ({
      ...prev,
      [stepId]: data
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      // Simulate AI verification process
      const verificationResult = await raftai.processKYB(user?.uid || '', verificationData);

      setResult(verificationResult);
      setCurrentStep(steps.length); // Move to results step
    } catch (error) {
      console.error('Verification failed:', error);
      setResult({
        status: 'rejected',
        reasons: ['Verification failed due to technical error'],
        riskScore: 100
      });
      setCurrentStep(steps.length);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setCurrentStep(0);
    setVerificationData({});
  };

  const handleSkip = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // Update user document to mark KYB as skipped
      if (db) {
        await updateDoc(doc(db!, 'users', user.uid), {
          kyb_status: 'SKIPPED',
          updated_at: serverTimestamp()
        });
      }
      
      setIsSkipped(true);
      setIsProcessing(false);
      
      // Redirect to dashboard after showing skip confirmation
      setTimeout(() => {
        router.push('/founder/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error skipping KYB:', error);
      setIsProcessing(false);
    }
  };

  const getCompletionPercentage = () => {
    if (currentStep >= steps.length) return 100;
    return ((currentStep + 1) / steps.length) * 100;
  };

  const CurrentStepComponent = steps[currentStep]?.component;

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* World Map Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/world-map-background.png)',
            filter: 'brightness(0.6) contrast(1.0)'
          }}
        />
        
        {/* 50% Black Glass Wall - More Prominent */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 10
          }}
        />
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-purple-900/20" style={{ zIndex: 11 }} />
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please sign in to access KYB verification.</p>
        </div>
      </div>
    );
  }

  if (isSkipped) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* World Map Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/world-map-background.png)',
            filter: 'brightness(0.6) contrast(1.0)'
          }}
        />
        
        {/* 50% Black Glass Wall - More Prominent */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 10
          }}
        />
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-purple-900/20" style={{ zIndex: 11 }} />
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10">
          <OnboardingHeader />
          <div className="pt-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-2xl">⏭️</span>
                </div>
                <h3 className="text-2xl font-bold text-yellow-400">KYB Skipped</h3>
                <p className="text-gray-300">
                  You have skipped KYB verification. You can still access the platform and submit pitches.
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-400 font-medium">Note: KYB verification can be completed later in your settings.</p>
                </div>
                <p className="text-gray-300">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep >= steps.length) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* World Map Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/world-map-background.png)',
            filter: 'brightness(0.6) contrast(1.0)'
          }}
        />
        
        {/* 50% Black Glass Wall - More Prominent */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 10
          }}
        />
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-purple-900/20" style={{ zIndex: 11 }} />
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10">
          <OnboardingHeader />
          <div className="pt-16 py-8 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Success Header with Celebration */}
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Documents Submitted Successfully! ✓
                </h1>
                <p className="text-white/80 text-lg mb-2">Your KYB documents have been uploaded and submitted</p>
                <p className="text-green-400 font-semibold">Waiting for admin review and approval</p>
              </div>
              
              {/* Success Card */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-8 mb-8 border-2 border-green-500/30 shadow-2xl">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">What happens next?</h2>
                  <div className="space-y-3 text-left max-w-md mx-auto">
                    <div className="flex items-start gap-3 text-white/90">
                      <span className="text-green-400 font-bold text-xl">1.</span>
                      <span>Our admin team will review your documents</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/90">
                      <span className="text-green-400 font-bold text-xl">2.</span>
                      <span>RaftAI is analyzing your submission in real-time</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/90">
                      <span className="text-green-400 font-bold text-xl">3.</span>
                      <span>You'll receive a notification once approved</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/90">
                      <span className="text-green-400 font-bold text-xl">4.</span>
                      <span>Full platform access will be granted automatically</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 shadow-2xl">
                <AIVerificationStep result={result} onRetry={handleRetry} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* World Map Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/world-map-background.png)',
          filter: 'brightness(0.6) contrast(1.0)'
        }}
      />
      
      {/* 50% Black Glass Wall - More Prominent */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 10
        }}
      />
      
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-purple-900/20" style={{ zIndex: 11 }} />
      
      {/* Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10">
        <OnboardingHeader />
        <div className="pt-16 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">KYB Verification (Optional)</h1>
              <p className="text-white/70">Complete your business verification to access all platform features</p>
              <div className="mt-4">
                <button
                  onClick={handleSkip}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  {isProcessing ? 'Processing...' : 'Skip KYB for Now'}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(getCompletionPercentage())}% Complete</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getCompletionPercentage()}%` }}
                />
              </div>
            </div>

            {/* Current Step */}
            <div className="bg-white/5 rounded-xl p-8 mb-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">{steps[currentStep].title}</h2>
                <p className="text-white/70">{steps[currentStep].description}</p>
              </div>

              <CurrentStepComponent
                data={verificationData[steps[currentStep].id] || {}}
                onDataUpdate={(data: any) => handleDataUpdate(steps[currentStep].id, data)}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSubmit={handleSubmit}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
