"use client";

import React, { useState, useRef } from 'react';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GlobeAltIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

interface KYBStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface KYBData {
  // Organization Details
  orgName: string;
  orgType: string;
  registrationNumber: string;
  country: string;
  address: string;
  website: string;
  
  // Documents
  registrationDoc: File | null;
  articlesOfIncorporation: File | null;
  proofOfAddress: File | null;
  orgLogo: File | null;
}

export default function FounderKYBWizard() {
  const { completeKYB, analyzeKYB } = useFounderAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  const [kybData, setKybData] = useState<KYBData>({
    orgName: '',
    orgType: '',
    registrationNumber: '',
    country: '',
    address: '',
    website: '',
    registrationDoc: null,
    articlesOfIncorporation: null,
    proofOfAddress: null,
    orgLogo: null
  });

  const fileInputRefs = {
    registrationDoc: useRef<HTMLInputElement>(null),
    articlesOfIncorporation: useRef<HTMLInputElement>(null),
    proofOfAddress: useRef<HTMLInputElement>(null),
    orgLogo: useRef<HTMLInputElement>(null)
  };

  const steps: KYBStep[] = [
    {
      id: 'organization-details',
      title: 'Organization Details',
      description: 'Basic information about your organization',
      icon: <BuildingOfficeIcon className="h-8 w-8" />,
      completed: !!(kybData.orgName && kybData.orgType && kybData.registrationNumber && kybData.country && kybData.address)
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Upload required organization documents',
      icon: <DocumentTextIcon className="h-8 w-8" />,
      completed: !!(kybData.registrationDoc && kybData.articlesOfIncorporation && kybData.proofOfAddress)
    }
  ];

  const handleInputChange = (field: keyof KYBData, value: string) => {
    setKybData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileUpload = (type: keyof typeof fileInputRefs, file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File must be less than 10MB');
      return;
    }
    
    setKybData(prev => ({ ...prev, [type]: file }));
    setError('');
    
    // Auto-advance to next step
    if (currentStep < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1000);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    const result = await analyzeKYB({
      orgName: kybData.orgName,
      orgType: kybData.orgType,
      registrationNumber: kybData.registrationNumber,
      country: kybData.country,
      address: kybData.address,
      website: kybData.website,
      documents: {
        registrationDoc: kybData.registrationDoc?.name,
        articlesOfIncorporation: kybData.articlesOfIncorporation?.name,
        proofOfAddress: kybData.proofOfAddress?.name,
        orgLogo: kybData.orgLogo?.name
      }
    });
    
    setAnalysisResult(result);
    setIsAnalyzing(false);

    if (result.status === 'approved') {
      await completeKYB({ 
        status: 'approved', 
        riskScore: result.riskScore,
        orgName: kybData.orgName,
        orgType: kybData.orgType,
        registrationNumber: kybData.registrationNumber,
        country: kybData.country,
        address: kybData.address,
        website: kybData.website
      });
      router.push('/founder/pitch');
    } else if (result.status === 'rejected') {
      await completeKYB({ 
        status: 'rejected', 
        reasons: result.reasons,
        orgName: kybData.orgName,
        orgType: kybData.orgType,
        registrationNumber: kybData.registrationNumber,
        country: kybData.country,
        address: kybData.address,
        website: kybData.website
      });
    } else {
      await completeKYB({ 
        status: 'pending',
        orgName: kybData.orgName,
        orgType: kybData.orgType,
        registrationNumber: kybData.registrationNumber,
        country: kybData.country,
        address: kybData.address,
        website: kybData.website
      });
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    if (analysisResult) {
      return (
        <div className="text-center space-y-6">
          {analysisResult.status === 'approved' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-400">KYB Approved!</h3>
              <p className="text-gray-300">
                Your organization has been successfully verified. You can now proceed to pitch your project.
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 font-medium">Risk Score: {analysisResult.riskScore.toFixed(1)}/100</p>
                <p className="text-sm text-gray-300 mt-1">Low risk - Excellent verification</p>
              </div>
            </div>
          )}
          
          {analysisResult.status === 'rejected' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <ExclamationTriangleIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-red-400">KYB Rejected</h3>
              <p className="text-gray-300">
                We found some issues with your organization verification. Please review and try again.
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
                <p className="text-red-400 font-medium mb-2">Issues found:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  {analysisResult.reasons.map((reason: string, index: number) => (
                    <li key={index}>• {reason}</li>
                  ))}
                </ul>
                <p className="text-sm text-gray-400 mt-3">
                  You can try again after the cooldown period.
                </p>
              </div>
            </div>
          )}
          
          {analysisResult.status === 'pending' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <ClockIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400">KYB Pending</h3>
              <p className="text-gray-300">
                Your organization documents are being reviewed. This usually takes 5-10 minutes.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-400 font-medium">Status: Under Review</p>
                <p className="text-sm text-gray-300 mt-1">We'll notify you once the review is complete</p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    if (isAnalyzing) {
      return (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <BuildingOfficeIcon className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">Analyzing Organization</h3>
          <p className="text-gray-300">
            RaftAI is verifying your organization. This usually takes 5-10 minutes.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-sm text-gray-300 mt-2">Processing your documents...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            {step.icon}
          </div>
          <h3 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{step.title}</h3>
          <p className="text-gray-300 text-lg max-w-md mx-auto">{step.description}</p>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          {renderStepForm()}
        </div>
      </div>
    );
  };

  const renderStepForm = () => {
    switch (steps[currentStep].id) {
      case 'organization-details':
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Organization Name *</label>
              <input
                type="text"
                value={kybData.orgName}
                onChange={(e) => handleInputChange('orgName', e.target.value)}
                className="form-input"
                placeholder="Enter your organization name"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Organization Type *</label>
                <select
                  value={kybData.orgType}
                  onChange={(e) => handleInputChange('orgType', e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Corporation">Corporation</option>
                  <option value="LLC">LLC</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Non-Profit">Non-Profit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Registration Number *</label>
                <input
                  type="text"
                  value={kybData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  className="form-input"
                  placeholder="Enter registration number"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Country *</label>
              <select
                value={kybData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select country</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Singapore">Singapore</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Business Address *</label>
              <textarea
                value={kybData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="form-input"
                placeholder="Enter complete business address"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                type="url"
                value={kybData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="form-input"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        );
        
      case 'documents':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Registration Document (PDF) *</label>
                <input
                  ref={fileInputRefs.registrationDoc}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('registrationDoc', file);
                  }}
                  className="form-input"
                  required
                />
                {kybData.registrationDoc && (
                  <p className="text-sm text-green-400 mt-1">✓ {kybData.registrationDoc.name}</p>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Articles of Incorporation (PDF) *</label>
                <input
                  ref={fileInputRefs.articlesOfIncorporation}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('articlesOfIncorporation', file);
                  }}
                  className="form-input"
                  required
                />
                {kybData.articlesOfIncorporation && (
                  <p className="text-sm text-green-400 mt-1">✓ {kybData.articlesOfIncorporation.name}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Proof of Business Address (PDF) *</label>
                <input
                  ref={fileInputRefs.proofOfAddress}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('proofOfAddress', file);
                  }}
                  className="form-input"
                  required
                />
                {kybData.proofOfAddress && (
                  <p className="text-sm text-green-400 mt-1">✓ {kybData.proofOfAddress.name}</p>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Organization Logo (PNG/JPG)</label>
                <input
                  ref={fileInputRefs.orgLogo}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('orgLogo', file);
                  }}
                  className="form-input"
                />
                {kybData.orgLogo && (
                  <p className="text-sm text-green-400 mt-1">✓ {kybData.orgLogo.name}</p>
                )}
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <IdentificationIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-300 font-medium mb-1">Document Requirements</p>
                  <p className="text-sm text-gray-300">
                    All documents must be clear, legible, and in PDF format. Documents should be recent (within 3 months) and show the complete document.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const allStepsCompleted = steps.every(step => step.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <BuildingOfficeIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Organization Verification (KYB)
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Verify your organization to build trust with investors and unlock premium features
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-6">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    step.completed ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25' : 
                    index === currentStep ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25 scale-110' : 'bg-gray-700/50 border border-gray-600/50'
                  }`}>
                    {step.completed ? (
                      <CheckCircleIcon className="h-6 w-6 text-white" />
                    ) : (
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm font-medium text-center max-w-24 ${
                    step.completed ? 'text-green-400' : 
                    index === currentStep ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.title.split(' ')[0]}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 rounded-full transition-all duration-500 ${
                    step.completed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-600/50'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          {renderStepContent()}
          
          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          {!isAnalyzing && !analysisResult && (
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200"
              >
                Previous
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={!steps[currentStep].completed}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allStepsCompleted}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <BuildingOfficeIcon className="w-5 h-5" />
                    <span>Submit KYB</span>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
