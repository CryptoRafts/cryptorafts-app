"use client";
import React, { useState, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { db, doc, setDoc, storage, ref, uploadBytes, getDownloadURL } from '@/lib/firebase.client';

interface KYCData {
  documents: {
    idFront?: string;
    idBack?: string;
    proofOfAddress?: string;
    selfie?: string;
  };
  livenessScore?: number;
  faceMatchScore?: number;
  vendorRef?: string;
  clientToken?: string;
}

interface KYCStep {
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

// Document Upload Step
function DocumentUploadStep({ data, onDataUpdate, onNext }: any) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  const handleFileUpload = async (file: File, docType: string) => {
    if (!file || file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Please select a file under 10MB');
      return;
    }

    if (!file.type.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      alert('Please select a valid image or PDF file');
      return;
    }

    setUploading(docType);
    try {
      if (!storage) {
        throw new Error('Storage not initialized');
      }
      const fileName = `kyc-documents/${docType}-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const newData = {
        ...data,
        documents: {
          ...data.documents,
          [docType]: downloadURL
        }
      };
      
      setUploadedDocs(prev => new Set([...prev, docType]));
      onDataUpdate(newData);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const canProceed = uploadedDocs.size >= 3; // At least 3 documents required

  const documents = [
    {
      type: 'idFront',
      title: 'Government ID Front',
      description: 'Upload the front side of your passport, driver\'s license, or national ID',
      icon: '🆔'
    },
    {
      type: 'idBack',
      title: 'Government ID Back',
      description: 'Upload the back side of your government-issued ID',
      icon: '🆔'
    },
    {
      type: 'proofOfAddress',
      title: 'Proof of Address',
      description: 'Upload a utility bill, bank statement, or government document showing your address (dated within 3 months)',
      icon: '🏠'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Required Documents</h3>
        <p className="text-white/70">Upload clear photos of your identity documents</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.type} className="bg-white/5 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{doc.icon}</div>
                <h4 className="text-white font-medium">{doc.title}</h4>
                <p className="text-white/60 text-sm mt-2">{doc.description}</p>
              </div>
              
              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/40 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0], doc.type);
                    }
                  }}
                  className="hidden"
                  id={`upload-${doc.type}`}
                  disabled={uploading === doc.type}
                />
                <label
                  htmlFor={`upload-${doc.type}`}
                  className={`cursor-pointer block ${uploading === doc.type ? 'opacity-50' : ''}`}
                >
                  {uploadedDocs.has(doc.type) ? (
                    <div className="text-green-400">
                      <div className="text-2xl mb-2">✓</div>
                      <div className="text-sm">Document uploaded</div>
                    </div>
                  ) : (
                    <div className="text-white/60">
                      <div className="text-lg mb-2">
                        {uploading === doc.type ? 'Uploading...' : 'Click to upload'}
                      </div>
                      <div className="text-xs">JPG, PNG, or PDF (max 10MB)</div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed || uploading !== null}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed && uploading === null
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {uploading ? 'Uploading...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// Selfie and Liveness Step
function SelfieStep({ data, onDataUpdate, onNext }: any) {
  const [uploading, setUploading] = useState(false);
  const [livenessScore, setLivenessScore] = useState<number | null>(null);
  const [faceMatchScore, setFaceMatchScore] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Camera access is required for identity verification. Please allow camera access and try again.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
  };

  const uploadSelfie = async () => {
    if (!capturedImage) return;

    setUploading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

      // Upload to Firebase Storage
      if (!storage) {
        throw new Error('Storage not initialized');
      }
      const fileName = `kyc-documents/selfie-${Date.now()}.jpg`;        
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Simulate AI analysis (in real implementation, this would call RaftAI service)
      const mockLivenessScore = Math.random() * 0.3 + 0.7; // 0.7-1.0
      const mockFaceMatchScore = Math.random() * 0.3 + 0.8; // 0.8-1.0

      setLivenessScore(mockLivenessScore);
      setFaceMatchScore(mockFaceMatchScore);

      const newData = {
        ...data,
        documents: {
          ...data.documents,
          selfie: downloadURL
        },
        livenessScore: mockLivenessScore,
        faceMatchScore: mockFaceMatchScore
      };

      onDataUpdate(newData);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload selfie. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const canProceed = capturedImage && livenessScore && faceMatchScore;

  // Cleanup stream on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Identity Verification</h3>
        <p className="text-white/70">Take a selfie for identity verification and liveness detection</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4">Camera Preview</h4>
              
              {!stream ? (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">📷</div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Start Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border border-white/20"
                  />
                  <button
                    onClick={capturePhoto}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Capture Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {capturedImage && (
              <div className="bg-white/5 rounded-lg p-6">
                <h4 className="text-white font-medium mb-4">Captured Photo</h4>
                <img
                  src={capturedImage}
                  alt="Captured selfie"
                  className="w-full rounded-lg border border-white/20"
                />
                
                {livenessScore && faceMatchScore ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Liveness Score:</span>
                      <span className={`font-mono ${livenessScore >= 0.75 ? 'text-green-400' : 'text-red-400'}`}>
                        {(livenessScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Face Match Score:</span>
                      <span className={`font-mono ${faceMatchScore >= 0.82 ? 'text-green-400' : 'text-red-400'}`}>
                        {(faceMatchScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={uploadSelfie}
                    disabled={uploading}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Processing...' : 'Verify Identity'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-medium mb-2">Instructions</h4>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Make sure you have good lighting</li>
            <li>• Look directly at the camera</li>
            <li>• Keep your face centered in the frame</li>
            <li>• Remove any face coverings</li>
          </ul>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

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

// Review and Submit Step
function ReviewSubmitStep({ data, onSubmit, onPrevious, isProcessing }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Review & Submit</h3>
        <p className="text-white/70">Please review your documents before submitting for verification</p>
        
        <div className="bg-white/5 rounded-lg p-6 space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Uploaded Documents</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className={`flex items-center ${data.documents.idFront ? 'text-green-400' : 'text-red-400'}`}>
                <span className="mr-2">{data.documents.idFront ? '✓' : '✗'}</span>
                Government ID Front
              </div>
              <div className={`flex items-center ${data.documents.idBack ? 'text-green-400' : 'text-red-400'}`}>
                <span className="mr-2">{data.documents.idBack ? '✓' : '✗'}</span>
                Government ID Back
              </div>
              <div className={`flex items-center ${data.documents.proofOfAddress ? 'text-green-400' : 'text-red-400'}`}>
                <span className="mr-2">{data.documents.proofOfAddress ? '✓' : '✗'}</span>
                Proof of Address
              </div>
              <div className={`flex items-center ${data.documents.selfie ? 'text-green-400' : 'text-red-400'}`}>
                <span className="mr-2">{data.documents.selfie ? '✓' : '✗'}</span>
                Selfie with Liveness
              </div>
            </div>
          </div>
          
          {data.livenessScore && data.faceMatchScore && (
            <div>
              <h4 className="text-white font-medium mb-2">Verification Scores</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Liveness Score:</span>
                  <span className={`ml-2 font-mono ${data.livenessScore >= 0.75 ? 'text-green-400' : 'text-red-400'}`}>
                    {(data.livenessScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-white/70">Face Match Score:</span>
                  <span className={`ml-2 font-mono ${data.faceMatchScore >= 0.82 ? 'text-green-400' : 'text-red-400'}`}>
                    {(data.faceMatchScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
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
          {isProcessing ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
}

// AI Verification Results Step
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
            Your KYC verification has been approved. You can now proceed to submit your pitch.
          </p>
        </div>
      )}
    </div>
  );
}

export default function FounderKYC() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [kycData, setKycData] = useState<KYCData>({
    documents: {},
    livenessScore: undefined,
    faceMatchScore: undefined
  });
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps: KYCStep[] = [
    {
      id: 'documents',
      title: 'Upload Documents',
      description: 'Upload your identity documents',
      component: DocumentUploadStep,
      required: true
    },
    {
      id: 'selfie',
      title: 'Identity Verification',
      description: 'Take a selfie for liveness detection',
      component: SelfieStep,
      required: true
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your information and submit for verification',
      component: ReviewSubmitStep,
      required: true
    }
  ];

  const handleDataUpdate = (data: KYCData) => {
    setKycData(data);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // Start KYC session
      const sessionResponse = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          documents: kycData.documents,
          livenessScore: kycData.livenessScore,
          faceMatchScore: kycData.faceMatchScore
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to start KYC session');
      }

      const sessionData = await sessionResponse.json();

      // Submit to RaftAI for verification
      const verificationResponse = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          vendorRef: sessionData.vendorRef,
          livenessScore: kycData.livenessScore,
          faceMatchScore: kycData.faceMatchScore,
          documents: kycData.documents
        })
      });

      if (!verificationResponse.ok) {
        throw new Error('Failed to verify documents');
      }

      const verificationResult = await verificationResponse.json();
      setResult(verificationResult);
      setCurrentStep(steps.length); // Move to results step

      // Update user document with KYC status
      if (!db) {
        throw new Error('Database not initialized');
      }
      await setDoc(doc(db!, 'users', user.uid), {
        kyc: {
          status: verificationResult.status,
          riskScore: verificationResult.riskScore,
          reasons: verificationResult.reasons,
          vendorRef: sessionData.vendorRef,
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      }, { merge: true });

    } catch (error) {
      console.error('KYC submission failed:', error);
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
    setKycData({
      documents: {},
      livenessScore: undefined,
      faceMatchScore: undefined
    });
  };

  const getCompletionPercentage = () => {
    if (currentStep >= steps.length) return 100;
    return ((currentStep + 1) / steps.length) * 100;
  };

  const CurrentStepComponent = steps[currentStep]?.component;

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please sign in to access KYC verification.</p>
        </div>
      </div>
    );
  }

  if (currentStep >= steps.length) {
    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">KYC Verification Results</h1>
            <p className="text-white/70">Your verification has been processed</p>
          </div>

          <div className="bg-white/5 rounded-xl p-8">
            <AIVerificationStep result={result} onRetry={handleRetry} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">KYC Verification</h1>
          <p className="text-white/70">Complete your identity verification to access all platform features</p>
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
            data={kycData}
            onDataUpdate={handleDataUpdate}
            onNext={() => setCurrentStep(currentStep + 1)}
            onPrevious={() => setCurrentStep(currentStep - 1)}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}
