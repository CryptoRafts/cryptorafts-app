"use client";

import React, { useState, useRef } from 'react';
import { useFounderAuth } from '@/providers/FounderAuthProvider';
import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  StarIcon,
  LightBulbIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface PitchStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface PitchData {
  // Basics
  projectName: string;
  sector: string;
  chain: string;
  stage: string;
  valueProposition: string;
  
  // Problem & Solution
  problem: string;
  solution: string;
  evidence: string;
  
  // Product & Traction
  productDescription: string;
  users: string;
  growthMetrics: string;
  
  // Tokenomics
  totalSupply: string;
  allocations: string;
  vesting: string;
  auditLinks: string;
  
  // Team & Roadmap
  teamMembers: string;
  advisors: string;
  timeline: string;
  
  // Documents
  pitchDeck: File | null;
  whitepaper: File | null;
  tokenModel: File | null;
  audits: File | null;
}

export default function FounderPitchWizard() {
  const { completePitch, analyzePitch } = useFounderAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  const [pitchData, setPitchData] = useState<PitchData>({
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
    pitchDeck: null,
    whitepaper: null,
    tokenModel: null,
    audits: null
  });

  const fileInputRefs = {
    pitchDeck: useRef<HTMLInputElement>(null),
    whitepaper: useRef<HTMLInputElement>(null),
    tokenModel: useRef<HTMLInputElement>(null),
    audits: useRef<HTMLInputElement>(null)
  };

  const steps: PitchStep[] = [
    {
      id: 'basics',
      title: 'Project Basics',
      description: 'Core information about your project',
      icon: <RocketLaunchIcon className="h-8 w-8" />,
      completed: !!(pitchData.projectName && pitchData.sector && pitchData.chain && pitchData.stage && pitchData.valueProposition)
    },
    {
      id: 'problem-solution',
      title: 'Problem & Solution',
      description: 'Define the problem and your solution',
      icon: <LightBulbIcon className="h-8 w-8" />,
      completed: !!(pitchData.problem && pitchData.solution && pitchData.evidence)
    },
    {
      id: 'product-traction',
      title: 'Product & Traction',
      description: 'Show your product and growth metrics',
      icon: <ChartBarIcon className="h-8 w-8" />,
      completed: !!(pitchData.productDescription && pitchData.users && pitchData.growthMetrics)
    },
    {
      id: 'tokenomics',
      title: 'Tokenomics',
      description: 'Token supply, allocations, and vesting',
      icon: <CurrencyDollarIcon className="h-8 w-8" />,
      completed: !!(pitchData.totalSupply && pitchData.allocations && pitchData.vesting)
    },
    {
      id: 'team-roadmap',
      title: 'Team & Roadmap',
      description: 'Team members, advisors, and timeline',
      icon: <UserGroupIcon className="h-8 w-8" />,
      completed: !!(pitchData.teamMembers && pitchData.timeline)
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Upload pitch deck, whitepaper, and audits',
      icon: <DocumentTextIcon className="h-8 w-8" />,
      completed: !!(pitchData.pitchDeck && pitchData.whitepaper)
    }
  ];

  const handleInputChange = (field: keyof PitchData, value: string) => {
    setPitchData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileUpload = (type: keyof typeof fileInputRefs, file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File must be less than 50MB');
      return;
    }
    
    setPitchData(prev => ({ ...prev, [type]: file }));
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
    const result = await analyzePitch({
      projectName: pitchData.projectName,
      sector: pitchData.sector,
      chain: pitchData.chain,
      stage: pitchData.stage,
      valueProposition: pitchData.valueProposition,
      problem: pitchData.problem,
      solution: pitchData.solution,
      evidence: pitchData.evidence,
      productDescription: pitchData.productDescription,
      users: pitchData.users,
      growthMetrics: pitchData.growthMetrics,
      totalSupply: pitchData.totalSupply,
      allocations: pitchData.allocations,
      vesting: pitchData.vesting,
      auditLinks: pitchData.auditLinks,
      teamMembers: pitchData.teamMembers,
      advisors: pitchData.advisors,
      timeline: pitchData.timeline,
      documents: {
        pitchDeck: pitchData.pitchDeck?.name,
        whitepaper: pitchData.whitepaper?.name,
        tokenModel: pitchData.tokenModel?.name,
        audits: pitchData.audits?.name
      }
    });
    
    setAnalysisResult(result);
    setIsAnalyzing(false);

    if (result.status === 'approved') {
      await completePitch({
        ...pitchData,
        rating: result.rating,
        summary: result.summary,
        risks: result.risks,
        recommendations: result.recommendations,
        status: 'approved'
      });
      router.push('/founder/dashboard');
    } else if (result.status === 'rejected') {
      await completePitch({
        ...pitchData,
        rating: result.rating,
        summary: result.summary,
        risks: result.risks,
        recommendations: result.recommendations,
        status: 'rejected'
      });
    } else {
      await completePitch({
        ...pitchData,
        rating: result.rating,
        summary: result.summary,
        risks: result.risks,
        recommendations: result.recommendations,
        status: 'pending'
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
              <h3 className="text-2xl font-bold text-green-400">Pitch Approved!</h3>
              <p className="text-gray-300">
                Your pitch has been successfully analyzed and approved. You can now access your founder dashboard.
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-green-400 font-medium">Rating: {analysisResult.rating}</span>
                </div>
                <p className="text-sm text-gray-300">Excellent pitch quality</p>
              </div>
            </div>
          )}
          
          {analysisResult.status === 'rejected' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <ExclamationTriangleIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-red-400">Pitch Needs Improvement</h3>
              <p className="text-gray-300">
                We found some areas that need attention. Please review the feedback and improve your pitch.
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
                <p className="text-red-400 font-medium mb-2">Areas for improvement:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  {analysisResult.risks.map((risk: string, index: number) => (
                    <li key={index}>• {risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {analysisResult.status === 'pending' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <ClockIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400">Pitch Under Review</h3>
              <p className="text-gray-300">
                Your pitch is being analyzed by our AI system. This usually takes 2-5 minutes.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-400 font-medium">Status: Analyzing</p>
                <p className="text-sm text-gray-300 mt-1">We'll notify you once the analysis is complete</p>
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
            <RocketLaunchIcon className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">Analyzing Your Pitch</h3>
          <p className="text-gray-300">
            RaftAI is evaluating your project pitch. This usually takes 2-5 minutes.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-sm text-gray-300 mt-2">Processing your pitch...</p>
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
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                value={pitchData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="form-input"
                placeholder="Enter your project name"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Sector *</label>
                <select
                  value={pitchData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select sector</option>
                  <option value="DeFi">DeFi</option>
                  <option value="NFT">NFT</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Social">Social</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Blockchain *</label>
                <select
                  value={pitchData.chain}
                  onChange={(e) => handleInputChange('chain', e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select blockchain</option>
                  <option value="Ethereum">Ethereum</option>
                  <option value="Solana">Solana</option>
                  <option value="Polygon">Polygon</option>
                  <option value="BSC">BSC</option>
                  <option value="Avalanche">Avalanche</option>
                  <option value="Arbitrum">Arbitrum</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Development Stage *</label>
              <select
                value={pitchData.stage}
                onChange={(e) => handleInputChange('stage', e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select stage</option>
                <option value="Idea">Idea</option>
                <option value="MVP">MVP</option>
                <option value="Beta">Beta</option>
                <option value="Live">Live</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">One-Line Value Proposition *</label>
              <textarea
                value={pitchData.valueProposition}
                onChange={(e) => handleInputChange('valueProposition', e.target.value)}
                rows={3}
                maxLength={280}
                className="form-input"
                placeholder="Describe your project in one compelling sentence..."
                required
              />
              <p className="text-sm text-gray-400 mt-1">{pitchData.valueProposition.length}/280 characters</p>
            </div>
          </div>
        );
        
      case 'problem-solution':
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Problem Statement *</label>
              <textarea
                value={pitchData.problem}
                onChange={(e) => handleInputChange('problem', e.target.value)}
                rows={4}
                className="form-input"
                placeholder="What problem does your project solve?"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Solution *</label>
              <textarea
                value={pitchData.solution}
                onChange={(e) => handleInputChange('solution', e.target.value)}
                rows={4}
                className="form-input"
                placeholder="How does your project solve this problem?"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Evidence/Validation *</label>
              <textarea
                value={pitchData.evidence}
                onChange={(e) => handleInputChange('evidence', e.target.value)}
                rows={4}
                className="form-input"
                placeholder="What evidence do you have that this solution works?"
                required
              />
            </div>
          </div>
        );
        
      case 'product-traction':
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Product Description *</label>
              <textarea
                value={pitchData.productDescription}
                onChange={(e) => handleInputChange('productDescription', e.target.value)}
                rows={4}
                className="form-input"
                placeholder="Describe your product and its key features"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Current Users *</label>
              <input
                type="text"
                value={pitchData.users}
                onChange={(e) => handleInputChange('users', e.target.value)}
                className="form-input"
                placeholder="e.g., 1,000 active users, 10,000 signups"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Growth Metrics *</label>
              <textarea
                value={pitchData.growthMetrics}
                onChange={(e) => handleInputChange('growthMetrics', e.target.value)}
                rows={3}
                className="form-input"
                placeholder="e.g., 20% monthly growth, $50K monthly revenue"
                required
              />
            </div>
          </div>
        );
        
      case 'tokenomics':
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Total Token Supply *</label>
              <input
                type="text"
                value={pitchData.totalSupply}
                onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                className="form-input"
                placeholder="e.g., 1,000,000,000 tokens"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Token Allocations *</label>
              <textarea
                value={pitchData.allocations}
                onChange={(e) => handleInputChange('allocations', e.target.value)}
                rows={4}
                className="form-input"
                placeholder="e.g., 40% Public Sale, 20% Team, 15% Advisors, 25% Treasury"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Vesting Schedule *</label>
              <textarea
                value={pitchData.vesting}
                onChange={(e) => handleInputChange('vesting', e.target.value)}
                rows={3}
                className="form-input"
                placeholder="e.g., Team: 2 year cliff, 4 year linear vesting"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Audit Links</label>
              <input
                type="url"
                value={pitchData.auditLinks}
                onChange={(e) => handleInputChange('auditLinks', e.target.value)}
                className="form-input"
                placeholder="https://audit-link.com"
              />
            </div>
          </div>
        );
        
      case 'team-roadmap':
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Team Members *</label>
              <textarea
                value={pitchData.teamMembers}
                onChange={(e) => handleInputChange('teamMembers', e.target.value)}
                rows={4}
                className="form-input"
                placeholder="List key team members and their backgrounds"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Advisors</label>
              <textarea
                value={pitchData.advisors}
                onChange={(e) => handleInputChange('advisors', e.target.value)}
                rows={3}
                className="form-input"
                placeholder="List advisors and their expertise"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Timeline & Roadmap *</label>
              <textarea
                value={pitchData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                rows={4}
                className="form-input"
                placeholder="Key milestones and timeline"
                required
              />
            </div>
          </div>
        );
        
      case 'documents':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Pitch Deck (PDF) *</label>
                <input
                  ref={fileInputRefs.pitchDeck}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('pitchDeck', file);
                  }}
                  className="form-input"
                  required
                />
                {pitchData.pitchDeck && (
                  <p className="text-sm text-green-400 mt-1">✓ {pitchData.pitchDeck.name}</p>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Whitepaper (PDF) *</label>
                <input
                  ref={fileInputRefs.whitepaper}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('whitepaper', file);
                  }}
                  className="form-input"
                  required
                />
                {pitchData.whitepaper && (
                  <p className="text-sm text-green-400 mt-1">✓ {pitchData.whitepaper.name}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Token Model (Excel)</label>
                <input
                  ref={fileInputRefs.tokenModel}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('tokenModel', file);
                  }}
                  className="form-input"
                />
                {pitchData.tokenModel && (
                  <p className="text-sm text-green-400 mt-1">✓ {pitchData.tokenModel.name}</p>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Audits (PDF)</label>
                <input
                  ref={fileInputRefs.audits}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('audits', file);
                  }}
                  className="form-input"
                />
                {pitchData.audits && (
                  <p className="text-sm text-green-400 mt-1">✓ {pitchData.audits.name}</p>
                )}
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-300 font-medium mb-1">Document Security</p>
                  <p className="text-sm text-gray-300">
                    All documents are encrypted and stored securely. Only authorized parties can access them.
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
            <RocketLaunchIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Pitch Your Project
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create your one-time project pitch to unlock all platform features and connect with investors
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center space-y-2 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    step.completed ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25' : 
                    index === currentStep ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25 scale-110' : 'bg-gray-700/50 border border-gray-600/50'
                  }`}>
                    {step.completed ? (
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center max-w-20 ${
                    step.completed ? 'text-green-400' : 
                    index === currentStep ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.title.split(' ')[0]}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-1 rounded-full transition-all duration-500 ${
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
                    <RocketLaunchIcon className="w-5 h-5" />
                    <span>Submit Pitch</span>
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