"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { useRouter } from 'next/navigation';
import { kycVendorManager, KYCDocument } from '@/lib/kyc-vendor';
import { authClaimsManager } from '@/lib/auth-claims';
import { 
  DocumentTextIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';

interface KYCStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  required: boolean;
}

export default function FounderKYCWizardEnhanced() {
  const { user } = useFounderAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [vendorRef, setVendorRef] = useState<string>('');
  
  const [documents, setDocuments] = useState<KYCDocument>({
    idFront: null as any,
    idBack: null as any,
    proofOfAddress: null as any,
    selfie: null as any
  });
  
  const [documentUrls, setDocumentUrls] = useState({
    idFront: '',
    idBack: '',
    proofOfAddress: '',
    selfie: ''
  });

  const fileInputRefs = {
    idFront: useRef<HTMLInputElement>(null),
    idBack: useRef<HTMLInputElement>(null),
    proofOfAddress: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null)
  };

  const steps: KYCStep[] = [
    {
      id: 'id-front',
      title: 'ID Document (Front)',
      description: 'Upload the front of your government-issued ID',
      icon: <DocumentTextIcon className="h-8 w-8" />,
      completed: !!documents.idFront,
      required: true
    },
    {
      id: 'id-back',
      title: 'ID Document (Back)',
      description: 'Upload the back of your government-issued ID',
      icon: <DocumentTextIcon className="h-8 w-8" />,
      completed: !!documents.idBack,
      required: true
    },
    {
      id: 'proof-of-address',
      title: 'Proof of Address',
      description: 'Upload a recent utility bill or bank statement',
      icon: <DocumentTextIcon className="h-8 w-8" />,
      completed: !!documents.proofOfAddress,
      required: true
    },
    {
      id: 'selfie',
      title: 'Selfie Verification',
      description: 'Take a selfie for liveness detection',
      icon: <CameraIcon className="h-8 w-8" />,
      completed: !!documents.selfie,
      required: true
    }
  ];

  // Map step IDs to document types and refs
  const getDocumentTypeFromStepId = (stepId: string): keyof KYCDocument => {
    switch (stepId) {
      case 'id-front': return 'idFront';
      case 'id-back': return 'idBack';
      case 'proof-of-address': return 'proofOfAddress';
      case 'selfie': return 'selfie';
      default: return 'idFront';
    }
  };

  const getRefFromStepId = (stepId: string) => {
    switch (stepId) {
      case 'id-front': return fileInputRefs.idFront;
      case 'id-back': return fileInputRefs.idBack;
      case 'proof-of-address': return fileInputRefs.proofOfAddress;
      case 'selfie': return fileInputRefs.selfie;
      default: return fileInputRefs.idFront;
    }
  };

  const handleFileUpload = (type: keyof KYCDocument, file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File must be less than 10MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    setDocuments(prev => ({
      ...prev,
      [type]: file
    }));
    
    const url = URL.createObjectURL(file);
    setDocumentUrls(prev => ({
      ...prev,
      [type]: url
    }));
    
    setError('');
    
    // Auto-advance to next step
    if (currentStep < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1000);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setError('');
    setIsProcessing(true);
    
    try {
      // Start KYC session with vendor
      const vendorRef = await kycVendorManager.startKYCSession(user.uid);
      setVendorRef(vendorRef);
      
      // Upload documents to vendor
      await kycVendorManager.uploadDocuments(vendorRef, documents);
      
      setIsProcessing(false);
      setIsAnalyzing(true);
      
      // Simulate vendor processing and RaftAI analysis
      const vendorResponse = await kycVendorManager.simulateVendorProcessing(vendorRef);
      await kycVendorManager.processVendorWebhook(vendorRef, vendorResponse);
      
      setAnalysisResult(vendorResponse);
      setIsAnalyzing(false);

      if (vendorResponse.status === 'approved') {
        // Redirect to KYB decision
        router.push('/founder/kyb-decision');
      } else if (vendorResponse.status === 'rejected') {
        // Show rejection reasons
        setError(`KYC rejected: ${vendorResponse.reasons.join(', ')}`);
      }
      
    } catch (err: any) {
      setError(err?.message || 'KYC processing failed');
      setIsProcessing(false);
      setIsAnalyzing(false);
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
              <h3 className="text-2xl font-bold text-green-400">KYC Approved!</h3>
              <p className="text-gray-300">
                Your identity has been successfully verified. You can now proceed to the next step.
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
              <h3 className="text-2xl font-bold text-red-400">KYC Rejected</h3>
              <p className="text-gray-300">
                We found some issues with your verification. Please review and try again.
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
        </div>
      );
    }
    
    if (isAnalyzing) {
      return (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheckIcon className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">Verifying Your Identity</h3>
          <p className="text-gray-300">
            RaftAI is analyzing your documents and performing security checks. This usually takes 5-10 seconds.
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
          {documentUrls[getDocumentTypeFromStepId(step.id)] ? (
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={documentUrls[getDocumentTypeFromStepId(step.id)]}
                  alt={step.title}
                  className="w-full max-w-lg mx-auto rounded-xl border border-white/20 shadow-lg"
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Uploaded
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => getRefFromStepId(step.id).current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  Upload Different File
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-40 h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center mx-auto hover:border-blue-400/50 transition-colors duration-300">
                <div className="text-center">
                  {step.id === 'selfie' ? (
                    <FaceSmileIcon className="h-20 w-20 text-gray-400 mx-auto mb-2" />
                  ) : (
                    <DocumentTextIcon className="h-20 w-20 text-gray-400 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-gray-400">Drop your file here</p>
                </div>
              </div>
              <button
                onClick={() => getRefFromStepId(step.id).current?.click()}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload {step.title}</span>
                </span>
              </button>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300 font-medium mb-1">Supported formats:</p>
                <p className="text-sm text-gray-400">JPG, PNG, PDF (Maximum 10MB)</p>
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={getRefFromStepId(step.id)}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const documentType = getDocumentTypeFromStepId(step.id);
              handleFileUpload(documentType, file);
            }
          }}
          className="hidden"
        />
      </div>
    );
  };

  const allStepsCompleted = steps.every(step => step.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Identity Verification (KYC)
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Complete your identity verification to unlock all platform features and start building your project
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
          
          {/* Submit Button */}
          {allStepsCompleted && !isProcessing && !isAnalyzing && !analysisResult && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting Verification...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span>Submit for Verification</span>
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
