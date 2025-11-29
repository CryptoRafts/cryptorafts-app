"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { pitchManager, PitchData } from '@/lib/pitch-manager';
import { globalRules } from '@/lib/global-rules';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  UsersIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface PitchStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export default function FounderPitchWizardLocked() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [existingPitch, setExistingPitch] = useState<any>(null);
  
  const [formData, setFormData] = useState<PitchData>({
    projectName: '',
    sector: '',
    chain: '',
    stage: '',
    valueProposition: '',
    problem: '',
    solution: '',
    evidence: '',
    productDescription: '',
    users: '',
    growthMetrics: '',
    totalSupply: '',
    allocations: '',
    vesting: '',
    auditLinks: '',
    teamMembers: '',
    advisors: '',
    timeline: '',
    documents: {},
    targetRaise: '',
    repoLinks: '',
    videoUrl: '',
    geography: '',
    tags: []
  });

  const [documents, setDocuments] = useState({
    pitchDeck: null as File | null,
    whitepaper: null as File | null,
    tokenModel: null as File | null,
    audits: null as File | null,
  });

  const [documentUrls, setDocumentUrls] = useState({
    pitchDeck: '',
    whitepaper: '',
    tokenModel: '',
    audits: '',
  });

  const fileInputRefs = {
    pitchDeck: useRef<HTMLInputElement>(null),
    whitepaper: useRef<HTMLInputElement>(null),
    tokenModel: useRef<HTMLInputElement>(null),
    audits: useRef<HTMLInputElement>(null),
  };

  const steps: PitchStep[] = [
    {
      id: 'basics',
      title: 'Project Basics',
      description: 'Tell us about your project\'s core identity',
      icon: <LightBulbIcon className="h-8 w-8" />,
      completed: !!formData.projectName && !!formData.sector && !!formData.chain && !!formData.stage && !!formData.valueProposition
    },
    {
      id: 'problem-solution',
      title: 'Problem & Solution',
      description: 'Clearly define the problem you\'re solving',
      icon: <RocketLaunchIcon className="h-8 w-8" />,
      completed: !!formData.problem && !!formData.solution && !!formData.evidence
    },
    {
      id: 'product-traction',
      title: 'Product & Traction',
      description: 'Showcase your product and market adoption',
      icon: <BookOpenIcon className="h-8 w-8" />,
      completed: !!formData.productDescription && !!formData.users && !!formData.growthMetrics
    },
    {
      id: 'tokenomics',
      title: 'Tokenomics',
      description: 'Detail your token\'s economic model',
      icon: <CurrencyDollarIcon className="h-8 w-8" />,
      completed: !!formData.totalSupply && !!formData.allocations && !!formData.vesting
    },
    {
      id: 'team-roadmap',
      title: 'Team & Roadmap',
      description: 'Introduce your team and future plans',
      icon: <UsersIcon className="h-8 w-8" />,
      completed: !!formData.teamMembers && !!formData.timeline
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Upload your essential project documents',
      icon: <DocumentTextIcon className="h-8 w-8" />,
      completed: !!documents.pitchDeck && !!documents.whitepaper
    }
  ];

  const checkExistingPitch = useCallback(async () => {
    try {
      const existing = await pitchManager.getExistingPitch();
      if (existing) {
        setExistingPitch(existing);
        setReviewResult(existing.aiDecision);
      }
    } catch (error) {
      console.error('Error checking existing pitch:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkExistingPitch();
    }
  }, [user, checkExistingPitch]);

  const getDocumentTypeFromStepId = (stepId: string): keyof typeof documents => {
    switch (stepId) {
      case 'documents-pitchDeck': return 'pitchDeck';
      case 'documents-whitepaper': return 'whitepaper';
      case 'documents-tokenModel': return 'tokenModel';
      case 'documents-audits': return 'audits';
      default: return 'pitchDeck';
    }
  };

  const getRefFromStepId = (stepId: string) => {
    switch (stepId) {
      case 'documents-pitchDeck': return fileInputRefs.pitchDeck;
      case 'documents-whitepaper': return fileInputRefs.whitepaper;
      case 'documents-tokenModel': return fileInputRefs.tokenModel;
      case 'documents-audits': return fileInputRefs.audits;
      default: return fileInputRefs.pitchDeck;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileUpload = (type: keyof typeof documents, file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File must be less than 50MB');
      return;
    }

    if (type === 'pitchDeck' || type === 'whitepaper' || type === 'audits') {
      if (!file.type.startsWith('application/pdf')) {
        setError('Please upload a PDF file for ' + type);
        return;
      }
    } else if (type === 'tokenModel') {
      if (!file.type.includes('spreadsheet') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Please upload an Excel file (XLSX/XLS) for Token Model');
        return;
      }
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
  };

  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    switch (step.id) {
      case 'basics':
        return !!formData.projectName && !!formData.sector && !!formData.chain && !!formData.stage && !!formData.valueProposition;
      case 'problem-solution':
        return !!formData.problem && !!formData.solution && !!formData.evidence;
      case 'product-traction':
        return !!formData.productDescription && !!formData.users && !!formData.growthMetrics;
      case 'tokenomics':
        return !!formData.totalSupply && !!formData.allocations && !!formData.vesting;
      case 'team-roadmap':
        return !!formData.teamMembers && !!formData.timeline;
      case 'documents':
        return !!documents.pitchDeck && !!documents.whitepaper;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please complete all required fields for this step.');
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setError('');
    setIsSubmitting(true);
    setIsReviewing(true);

    try {
      // Prepare pitch data with documents
      const pitchData: PitchData = {
        ...formData,
        documents: {
          pitchDeck: documents.pitchDeck?.name || '',
          whitepaper: documents.whitepaper?.name || '',
          tokenModel: documents.tokenModel?.name || '',
          audits: documents.audits?.name || ''
        }
      };

      // Submit pitch (one-time only)
      const pitchId = await pitchManager.submitPitch(pitchData);
      
      // Wait for AI review and status update
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds max wait
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const pitch = await pitchManager.getPitch(pitchId);
        
        if (pitch?.aiDecision && pitch.status !== 'UNDER_REVIEW') {
          setReviewResult(pitch.aiDecision);
          
          // If the pitch was rejected, also update the existing pitch state
          if (pitch.status === 'REJECTED') {
            setExistingPitch(pitch);
          }
          break;
        }
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        setError('AI review is taking longer than expected. Please check back later.');
        setIsReviewing(false);
      }
      
      setIsSubmitting(false);

      // Only redirect to dashboard for PASS/CONDITIONAL decisions
      if (reviewResult?.decision !== 'FAIL') {
        setTimeout(() => {
          router.push('/founder/dashboard');
        }, 5000);
      }

    } catch (err: any) {
      console.error('Pitch submission failed:', err);
      setError(err?.message || 'Failed to submit pitch. Please try again.');
      setIsSubmitting(false);
      setIsReviewing(false);
    }
  };

  // If pitch already exists, show read-only view
  if (existingPitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-6 shadow-lg shadow-green-500/25">
              <CheckCircleIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
              Pitch Already Submitted
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Your pitch has been submitted and reviewed. Only one pitch per founder is allowed.
            </p>
          </div>

          {/* Pitch Summary */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Pitch Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Project Details</h3>
                <p className="text-gray-300"><strong>Name:</strong> {existingPitch.data.projectName}</p>
                <p className="text-gray-300"><strong>Sector:</strong> {existingPitch.data.sector}</p>
                <p className="text-gray-300"><strong>Chain:</strong> {existingPitch.data.chain}</p>
                <p className="text-gray-300"><strong>Stage:</strong> {existingPitch.data.stage}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Review Results</h3>
                {existingPitch.aiDecision ? (
                  <>
                    <p className="text-gray-300"><strong>Decision:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        existingPitch.aiDecision.decision === 'PASS' ? 'bg-green-500/20 text-green-400' :
                        existingPitch.aiDecision.decision === 'CONDITIONAL' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {existingPitch.aiDecision.decision}
                      </span>
                    </p>
                    <p className="text-gray-300"><strong>Score:</strong> {existingPitch.aiDecision.score}/100</p>
                    <p className="text-gray-300"><strong>Confidence:</strong> {(existingPitch.aiDecision.confidence * 100).toFixed(1)}%</p>
                  </>
                ) : (
                  <p className="text-gray-300">Review in progress...</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/founder/dashboard')}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              Go to Dashboard
            </button>
            
            {existingPitch?.status === 'REJECTED' && (
              <button
                onClick={() => {
                  setExistingPitch(null);
                  setCurrentStep(0);
                  setFormData({
                    projectName: '',
                    sector: '',
                    chain: '',
                    stage: '',
                    valueProposition: '',
                    problem: '',
                    solution: '',
                    evidence: '',
                    productDescription: '',
                    users: '',
                    growthMetrics: '',
                    totalSupply: '',
                    allocations: '',
                    vesting: '',
                    auditLinks: '',
                    teamMembers: '',
                    advisors: '',
                    timeline: ''
                  });
                  setDocuments({});
                  setDocumentUrls({});
                  setError('');
                }}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
              >
                Re-Pitch
              </button>
            )}
            <button
              onClick={() => router.push('/founder/settings')}
              className="px-8 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white font-semibold rounded-xl transition-colors"
            >
              View in Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    const step = steps[currentStep];

    if (isReviewing) {
      return (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheckIcon className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">RaftAI Reviewing Your Pitch</h3>
          <p className="text-gray-300">
            This usually takes 5-10 seconds. We'll analyze your project and provide recommendations.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-sm text-gray-300 mt-2">Analyzing your project...</p>
          </div>
        </div>
      );
    }

    if (reviewResult) {
      return (
        <div className="text-center space-y-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
            reviewResult.decision === 'PASS' ? 'bg-green-500' :
            reviewResult.decision === 'CONDITIONAL' ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
            <CheckCircleIcon className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {reviewResult.decision === 'PASS' ? 'Pitch Approved!' :
             reviewResult.decision === 'CONDITIONAL' ? 'Pitch Conditionally Approved' : 'Pitch Needs Work'}
          </h3>
          <p className="text-gray-300">
            {reviewResult.decision === 'FAIL' 
              ? 'Your pitch needs improvement. You can re-submit with changes.'
              : 'RaftAI has completed the review. Redirecting to dashboard...'}
          </p>
          <div className={`border rounded-lg p-4 ${
            reviewResult.decision === 'PASS' ? 'bg-green-500/10 border-green-500/20' :
            reviewResult.decision === 'CONDITIONAL' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}>
            <p className={`font-medium ${
              reviewResult.decision === 'PASS' ? 'text-green-400' :
              reviewResult.decision === 'CONDITIONAL' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              RaftAI Score: {reviewResult.score}/100
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Decision: {reviewResult.decision} | Confidence: {(reviewResult.confidence * 100).toFixed(1)}%
            </p>
          </div>
          
          {/* Action buttons for FAIL decisions */}
          {reviewResult.decision === 'FAIL' && (
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => {
                  // Reset the review state and go back to form
                  setReviewResult(null);
                  setIsReviewing(false);
                  setCurrentStep(0);
                  setFormData({
                    projectName: '',
                    sector: '',
                    chain: '',
                    stage: '',
                    valueProposition: '',
                    problem: '',
                    solution: '',
                    evidence: '',
                    productDescription: '',
                    users: '',
                    growthMetrics: '',
                    totalSupply: '',
                    allocations: '',
                    vesting: '',
                    auditLinks: '',
                    teamMembers: '',
                    advisors: '',
                    timeline: ''
                  });
                  setDocuments({});
                  setDocumentUrls({});
                  setError('');
                }}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
              >
                Re-Pitch
              </button>
              <button
                onClick={() => router.push('/founder/dashboard')}
                className="px-8 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white font-semibold rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
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
          {/* Step content based on current step */}
          {step.id === 'basics' && (
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input type="text" className="form-input" value={formData.projectName} onChange={(e) => handleInputChange('projectName', e.target.value)} required />
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Sector *</label>
                  <input type="text" className="form-input" value={formData.sector} onChange={(e) => handleInputChange('sector', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Blockchain / Chain *</label>
                  <input type="text" className="form-input" value={formData.chain} onChange={(e) => handleInputChange('chain', e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Stage *</label>
                <input type="text" className="form-input" value={formData.stage} onChange={(e) => handleInputChange('stage', e.target.value)} placeholder="e.g., Seed, Series A, Public Sale" required />
              </div>
              <div className="form-group">
                <label className="form-label">Value Proposition * <span className="text-muted">({formData.valueProposition.length}/280 characters)</span></label>
                <textarea className="form-input" rows={3} maxLength={280} value={formData.valueProposition} onChange={(e) => handleInputChange('valueProposition', e.target.value)} placeholder="A concise statement of your project's unique value..." required />
              </div>
            </div>
          )}

          {step.id === 'problem-solution' && (
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Problem Statement *</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={formData.problem} 
                  onChange={(e) => handleInputChange('problem', e.target.value)} 
                  placeholder="Describe the specific problem your project solves..."
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Solution *</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={formData.solution} 
                  onChange={(e) => handleInputChange('solution', e.target.value)} 
                  placeholder="Explain how your project solves this problem..."
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Evidence / Proof of Concept *</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  value={formData.evidence} 
                  onChange={(e) => handleInputChange('evidence', e.target.value)} 
                  placeholder="Provide evidence that your solution works (metrics, testimonials, demos, etc.)..."
                  required 
                />
              </div>
            </div>
          )}

          {step.id === 'product-traction' && (
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Product Description *</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={formData.productDescription} 
                  onChange={(e) => handleInputChange('productDescription', e.target.value)} 
                  placeholder="Describe your product in detail..."
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Users *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.users} 
                  onChange={(e) => handleInputChange('users', e.target.value)} 
                  placeholder="e.g., 10,000 active users, 500 beta testers"
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Growth Metrics *</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  value={formData.growthMetrics} 
                  onChange={(e) => handleInputChange('growthMetrics', e.target.value)} 
                  placeholder="Share key growth metrics (user growth, revenue, engagement, etc.)..."
                  required 
                />
              </div>
            </div>
          )}

          {step.id === 'tokenomics' && (
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Total Token Supply *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.totalSupply} 
                  onChange={(e) => handleInputChange('totalSupply', e.target.value)} 
                  placeholder="e.g., 1,000,000,000 tokens"
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Token Allocations *</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={formData.allocations} 
                  onChange={(e) => handleInputChange('allocations', e.target.value)} 
                  placeholder="Break down token allocation (team, public sale, treasury, etc.)..."
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vesting Schedule *</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  value={formData.vesting} 
                  onChange={(e) => handleInputChange('vesting', e.target.value)} 
                  placeholder="Describe vesting schedules for team, advisors, etc..."
                  required 
                />
              </div>
            </div>
          )}

          {step.id === 'team-roadmap' && (
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Team Members *</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={formData.teamMembers} 
                  onChange={(e) => handleInputChange('teamMembers', e.target.value)} 
                  placeholder="Introduce your team members and their backgrounds..."
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project Timeline *</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={formData.timeline} 
                  onChange={(e) => handleInputChange('timeline', e.target.value)} 
                  placeholder="Outline your project roadmap and key milestones..."
                  required 
                />
              </div>
            </div>
          )}

          {step.id === 'documents' && (
            <div className="space-y-8">
              {['pitchDeck', 'whitepaper', 'tokenModel', 'audits'].map((docType) => {
                const file = documents[docType as keyof typeof documents];
                const url = documentUrls[docType as keyof typeof documents];
                const title = docType === 'pitchDeck' ? 'Pitch Deck (PDF)' :
                              docType === 'whitepaper' ? 'Whitepaper (PDF)' :
                              docType === 'tokenModel' ? 'Token Model (XLSX/XLS)' :
                              'Audit Reports (PDF)';
                const required = docType === 'pitchDeck' || docType === 'whitepaper';

                return (
                  <div key={docType} className="card bg-white/5 border border-white/10 p-6 rounded-xl">
                    <div className="card-header flex justify-between items-center mb-4">
                      <h4 className="card-title text-xl font-semibold text-white">{title} {required && '*'}</h4>
                      {url && (
                        <span className="text-green-400 text-sm font-medium flex items-center space-x-1">
                          <CheckCircleIcon className="h-4 w-4" /> <span>Uploaded</span>
                        </span>
                      )}
                    </div>
                    <div className="card-body">
                      {url ? (
                        <div className="space-y-4 text-center">
                          <p className="text-gray-300">File: <span className="font-medium">{file?.name}</span></p>
                          <button
                            onClick={() => getRefFromStepId(`documents-${docType}`).current?.click()}
                            className="btn btn-secondary btn-sm"
                          >
                            Change File
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-32 h-32 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mx-auto hover:border-blue-400/50 transition-colors duration-300">
                            <CloudArrowUpIcon className="h-16 w-16 text-gray-400" />
                          </div>
                          <button
                            onClick={() => getRefFromStepId(`documents-${docType}`).current?.click()}
                            className="btn btn-primary"
                          >
                            Upload {title.split(' ')[0]}
                          </button>
                          <p className="text-sm text-gray-400">Max 50MB. {docType === 'tokenModel' ? 'XLSX/XLS' : 'PDF'} format.</p>
                        </div>
                      )}
                      <input
                        ref={getRefFromStepId(`documents-${docType}`)}
                        type="file"
                        accept={docType === 'tokenModel' ? '.xlsx,.xls' : '.pdf'}
                        onChange={(e) => {
                          const uploadedFile = e.target.files?.[0];
                          if (uploadedFile) {
                            handleFileUpload(docType as keyof typeof documents, uploadedFile);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 0 && (
            <button onClick={handlePrev} className="btn btn-secondary">
              Previous
            </button>
          )}
          {currentStep < steps.length - 1 && (
            <button onClick={handleNext} className="btn btn-primary ml-auto" disabled={!validateStep(currentStep)}>
              Next
            </button>
          )}
          {currentStep === steps.length - 1 && (
            <button
              onClick={handleSubmit}
              className="btn btn-success ml-auto"
              disabled={!validateStep(currentStep) || isSubmitting}
            >
              {isSubmitting ? 'Submitting Pitch...' : 'Submit Pitch (One-Time)'}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}
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
            <LightBulbIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Project Pitch Wizard
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Submit your project pitch for RaftAI analysis. This is a one-time submission.
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
        </div>
      </div>
    </div>
  );
}
