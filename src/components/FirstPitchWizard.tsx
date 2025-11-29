"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { onboardingStateManager, OnboardingState } from '@/lib/onboarding-state';
import { 
  RocketLaunchIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface PitchData {
  projectName: string;
  sector: string;
  chain: string;
  stage: string;
  valueProposition: string;
  problem: string;
  solution: string;
  evidence: string;
  productDescription: string;
  users: string;
  growthMetrics: string;
  tokenomics: string;
  team: string;
  roadmap: string;
  targetRaise: string;
  website: string;
  whitepaper?: File;
  pitchDeck?: File;
  financialModel?: File;
}

interface PitchStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function FirstPitchWizard() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
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
    tokenomics: '',
    team: '',
    roadmap: '',
    targetRaise: '',
    website: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const whitepaperInputRef = useRef<HTMLInputElement>(null);
  const pitchDeckInputRef = useRef<HTMLInputElement>(null);
  const financialModelInputRef = useRef<HTMLInputElement>(null);

  const steps: PitchStep[] = [
    {
      id: 'basics',
      title: 'Project Basics',
      description: 'Tell us about your project fundamentals',
      icon: <RocketLaunchIcon className="h-6 w-6" />,
    },
    {
      id: 'problem',
      title: 'Problem & Solution',
      description: 'Define the problem and your solution',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'product',
      title: 'Product & Traction',
      description: 'Describe your product and growth metrics',
      icon: <ChartBarIcon className="h-6 w-6" />,
    },
    {
      id: 'tokenomics',
      title: 'Tokenomics',
      description: 'Explain your token economics',
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
    },
    {
      id: 'team',
      title: 'Team & Roadmap',
      description: 'Introduce your team and future plans',
      icon: <UsersIcon className="h-6 w-6" />,
    },
    {
      id: 'files',
      title: 'Documents',
      description: 'Upload supporting documents',
      icon: <CloudArrowUpIcon className="h-6 w-6" />,
    },
  ];

  const handleInputChange = (field: keyof PitchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileUpload = (type: 'whitepaper' | 'pitchDeck' | 'financialModel', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid PDF or Excel file');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File must be less than 10MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, [type]: file }));
      setError('');
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Basics
        if (!formData.projectName.trim()) {
          setError('Project name is required');
          return false;
        }
        if (!formData.sector) {
          setError('Sector is required');
          return false;
        }
        if (!formData.chain) {
          setError('Blockchain is required');
          return false;
        }
        if (!formData.stage) {
          setError('Stage is required');
          return false;
        }
        if (!formData.valueProposition.trim()) {
          setError('Value proposition is required');
          return false;
        }
        break;
      case 1: // Problem & Solution
        if (!formData.problem.trim()) {
          setError('Problem description is required');
          return false;
        }
        if (!formData.solution.trim()) {
          setError('Solution description is required');
          return false;
        }
        if (!formData.evidence.trim()) {
          setError('Evidence is required');
          return false;
        }
        break;
      case 2: // Product & Traction
        if (!formData.productDescription.trim()) {
          setError('Product description is required');
          return false;
        }
        if (!formData.users.trim()) {
          setError('User information is required');
          return false;
        }
        if (!formData.growthMetrics.trim()) {
          setError('Growth metrics are required');
          return false;
        }
        break;
      case 3: // Tokenomics
        if (!formData.tokenomics.trim()) {
          setError('Tokenomics description is required');
          return false;
        }
        if (!formData.targetRaise.trim()) {
          setError('Target raise amount is required');
          return false;
        }
        break;
      case 4: // Team & Roadmap
        if (!formData.team.trim()) {
          setError('Team information is required');
          return false;
        }
        if (!formData.roadmap.trim()) {
          setError('Roadmap is required');
          return false;
        }
        break;
      case 5: // Files (optional)
        // Files are optional, no validation needed
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const simulateRaftAIAnalysis = async (pitchData: PitchData): Promise<{decision: string, reasons?: string[]}> => {
    // Simulate RaftAI processing (≤5s SLA)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate approval (in production, this would be real AI analysis)
    const isApproved = Math.random() > 0.15; // 85% approval rate
    
    if (isApproved) {
      return { decision: 'approved' };
    } else {
      return { 
        decision: 'rejected',
        reasons: [
          'Insufficient detail in problem statement',
          'Tokenomics model needs clarification',
          'Team information is incomplete'
        ]
      };
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !user) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Start first pitch process
      await onboardingStateManager.startFirstPitch({
        ...formData,
        submittedAt: new Date(),
      });

      setSuccess('Pitch submitted successfully! Analyzing your submission...');

      // Simulate RaftAI analysis
      const result = await simulateRaftAIAnalysis(formData);

      if (result.decision === 'approved') {
        await onboardingStateManager.completeFirstPitch();
        setSuccess('Pitch approved! Welcome to your founder dashboard!');
      } else {
        await onboardingStateManager.updateOnboardingState({
          first_pitch: 'rejected',
          firstPitchData: {
            ...formData,
            rejectedAt: new Date(),
            rejectionReasons: result.reasons,
          },
        });
        setError(`Pitch rejected: ${result.reasons?.join(', ')}`);
      }
      
    } catch (error: any) {
      console.error('Pitch submission error:', error);
      setError(error.message || 'Pitch submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basics
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="projectName" className="block text-sm font-medium text-white">
                Project Name *
              </label>
              <input
                type="text"
                id="projectName"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Enter your project name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sector" className="block text-sm font-medium text-white">
                Sector *
              </label>
              <select
                id="sector"
                value={formData.sector}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Select sector</option>
                <option value="defi">DeFi</option>
                <option value="nft">NFT</option>
                <option value="gaming">Gaming</option>
                <option value="social">Social</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="dao">DAO</option>
                <option value="metaverse">Metaverse</option>
                <option value="ai">AI</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="chain" className="block text-sm font-medium text-white">
                  Blockchain *
                </label>
                <select
                  id="chain"
                  value={formData.chain}
                  onChange={(e) => handleInputChange('chain', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select blockchain</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="binance">Binance Smart Chain</option>
                  <option value="solana">Solana</option>
                  <option value="avalanche">Avalanche</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="optimism">Optimism</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="stage" className="block text-sm font-medium text-white">
                  Stage *
                </label>
                <select
                  id="stage"
                  value={formData.stage}
                  onChange={(e) => handleInputChange('stage', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select stage</option>
                  <option value="idea">Idea</option>
                  <option value="mvp">MVP</option>
                  <option value="beta">Beta</option>
                  <option value="live">Live</option>
                  <option value="scaling">Scaling</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="valueProposition" className="block text-sm font-medium text-white">
                Value Proposition *
              </label>
              <textarea
                id="valueProposition"
                rows={4}
                value={formData.valueProposition}
                onChange={(e) => handleInputChange('valueProposition', e.target.value)}
                placeholder="Describe your project's unique value proposition"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="website" className="block text-sm font-medium text-white">
                Website
              </label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourproject.com"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        );

      case 1: // Problem & Solution
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Problem Statement *</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.problem}
                onChange={(e) => handleInputChange('problem', e.target.value)}
                placeholder="Describe the problem your project solves"
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
                placeholder="Explain how your project solves this problem"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Evidence *</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.evidence}
                onChange={(e) => handleInputChange('evidence', e.target.value)}
                placeholder="Provide evidence that this problem exists and your solution works"
                required
              />
            </div>
          </div>
        );

      case 2: // Product & Traction
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Product Description *</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.productDescription}
                onChange={(e) => handleInputChange('productDescription', e.target.value)}
                placeholder="Describe your product in detail"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Users *</label>
              <textarea
                className="form-input"
                rows={3}
                value={formData.users}
                onChange={(e) => handleInputChange('users', e.target.value)}
                placeholder="Describe your target users and user acquisition strategy"
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
                placeholder="Share your current metrics and growth projections"
                required
              />
            </div>
          </div>
        );

      case 3: // Tokenomics
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Tokenomics *</label>
              <textarea
                className="form-input"
                rows={6}
                value={formData.tokenomics}
                onChange={(e) => handleInputChange('tokenomics', e.target.value)}
                placeholder="Explain your token economics, distribution, and utility"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Raise *</label>
              <input
                type="text"
                className="form-input"
                value={formData.targetRaise}
                onChange={(e) => handleInputChange('targetRaise', e.target.value)}
                placeholder="e.g., $500,000 USD"
                required
              />
            </div>
          </div>
        );

      case 4: // Team & Roadmap
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Team *</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.team}
                onChange={(e) => handleInputChange('team', e.target.value)}
                placeholder="Introduce your team members and their expertise"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Roadmap *</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.roadmap}
                onChange={(e) => handleInputChange('roadmap', e.target.value)}
                placeholder="Outline your project roadmap and milestones"
                required
              />
            </div>
          </div>
        );

      case 5: // Files
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Whitepaper (Optional)</label>
              <div className="border-2 border-dashed border-gray-500 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                   onClick={() => whitepaperInputRef.current?.click()}>
                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div>
                  <p className="text-white font-medium">Upload Whitepaper</p>
                  <p className="text-gray-400 text-sm">PDF format, max 10MB</p>
                </div>
              </div>
              <input
                ref={whitepaperInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload('whitepaper', e)}
                className="hidden"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pitch Deck (Optional)</label>
              <div className="border-2 border-dashed border-gray-500 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                   onClick={() => pitchDeckInputRef.current?.click()}>
                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div>
                  <p className="text-white font-medium">Upload Pitch Deck</p>
                  <p className="text-gray-400 text-sm">PDF format, max 10MB</p>
                </div>
              </div>
              <input
                ref={pitchDeckInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload('pitchDeck', e)}
                className="hidden"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Financial Model (Optional)</label>
              <div className="border-2 border-dashed border-gray-500 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                   onClick={() => financialModelInputRef.current?.click()}>
                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div>
                  <p className="text-white font-medium">Upload Financial Model</p>
                  <p className="text-gray-400 text-sm">Excel format, max 10MB</p>
                </div>
              </div>
              <input
                ref={financialModelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload('financialModel', e)}
                className="hidden"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-6 shadow-lg shadow-blue-500/25">
              <RocketLaunchIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Submit Your First Pitch
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create your initial project pitch to get started
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-sm text-gray-400">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              {steps[currentStep].icon}
              <div>
                <h2 className="text-xl font-semibold text-white">{steps[currentStep].title}</h2>
                <p className="text-gray-400 text-sm">{steps[currentStep].description}</p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 inline-flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 inline-flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Pitch</span>
                    <RocketLaunchIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
