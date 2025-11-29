"use client";

import React, { useState } from 'react';
import { 
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

interface ProjectPitchWizardProps {
  onComplete?: (data: any) => void;
}

const ProjectPitchWizard: React.FC<ProjectPitchWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Project
    projectName: '',
    projectDescription: '',
    sector: '',
    chain: '',
    stage: '',
    linkedin: '',
    twitter: '',
    website: '',
    
    // Step 2: Problem
    problem: '',
    targetAudience: '',
    marketSize: '',
    
    // Step 3: Product
    solution: '',
    keyFeatures: '',
    competitiveAdvantage: '',
    
    // Step 4: Tokenomics
    tokenName: '',
    totalSupply: '',
    fundingGoal: '',
    targetRaise: '',
    tokenomicsFile: null as File | null,
    tokenomicsUrl: '',
    
    // Step 5: Team
    teamMembers: [] as any[],
    teamCount: '1',
    advisors: [] as string[],
    experience: '',
    
    // Step 6: Documents
    projectLogo: null as File | null,
    pitchDeck: null as File | null,
    whitepaper: null as File | null,
    tokenomics: null as File | null,
    roadmap: null as File | null
  });

  const steps = [
    { id: 1, name: 'Project', icon: LightBulbIcon },
    { id: 2, name: 'Problem', icon: DocumentTextIcon },
    { id: 3, name: 'Product', icon: ChartBarIcon },
    { id: 4, name: 'Tokenomics', icon: ChartBarIcon },
    { id: 5, name: 'Team', icon: UserGroupIcon },
    { id: 6, name: 'Documents', icon: PaperClipIcon }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    // Handle file upload logic here
    handleInputChange(field, file);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LightBulbIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Project Basics</h2>
              <p className="text-white/60">Tell us about your project</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Project Name</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Project Description</label>
                <textarea
                  value={formData.projectDescription}
                  onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your project in detail"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Sector</label>
                  <input
                    type="text"
                    value={formData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., DeFi, NFT, Gaming, Infrastructure"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Blockchain</label>
                  <input
                    type="text"
                    value={formData.chain}
                    onChange={(e) => handleInputChange('chain', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Ethereum, Polygon, BSC, Solana"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Development Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white/15 hover:border-blue-400/50 transition-all duration-200 cursor-pointer"
                  >
                    <option value="">Select Development Stage</option>
                    <option value="Concept">💡 Concept - Just an idea</option>
                    <option value="Research">🔬 Research - Market research phase</option>
                    <option value="Prototype">🔧 Prototype - Early prototype</option>
                    <option value="Alpha">⚡ Alpha - Internal testing</option>
                    <option value="Pre-Beta">🚀 Pre-Beta - Limited testing</option>
                    <option value="Beta">🧪 Beta - Public testing</option>
                    <option value="MVP">⭐ MVP - Minimum Viable Product</option>
                    <option value="Soft Launch">🎯 Soft Launch - Limited release</option>
                    <option value="Live">🌐 Live - Fully launched</option>
                    <option value="Scaling">📈 Scaling - Growing user base</option>
                    <option value="Mature">🏆 Mature - Established product</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://yourproject.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/company/yourproject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">X (Twitter) Profile</label>
                  <input
                    type="url"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://x.com/yourproject"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Problem & Market</h2>
              <p className="text-white/60">Define the problem you're solving</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Problem Statement</label>
                <textarea
                  value={formData.problem}
                  onChange={(e) => handleInputChange('problem', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What problem does your project solve?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Target Audience</label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Who is your target audience?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Market Size</label>
                <input
                  type="text"
                  value={formData.marketSize}
                  onChange={(e) => handleInputChange('marketSize', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What is the total addressable market?"
                />
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Product & Solution</h2>
              <p className="text-white/60">Describe your product and competitive advantage</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Solution</label>
                <textarea
                  rows={4}
                  value={formData.solution}
                  onChange={(e) => handleInputChange('solution', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How does your product solve the problem?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Key Features</label>
                <textarea
                  rows={3}
                  value={formData.keyFeatures}
                  onChange={(e) => handleInputChange('keyFeatures', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What are the main features of your product?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Competitive Advantage</label>
                <textarea
                  rows={3}
                  value={formData.competitiveAdvantage}
                  onChange={(e) => handleInputChange('competitiveAdvantage', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What makes you different from competitors?"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tokenomics</h2>
              <p className="text-white/60">Define your token economics</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Token Name</label>
                <input
                  type="text"
                  value={formData.tokenName}
                  onChange={(e) => handleInputChange('tokenName', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., CRYPTO, DEFI, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Total Supply</label>
                <input
                  type="text"
                  value={formData.totalSupply}
                  onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1,000,000,000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Funding Goal / Target Raise (USD)</label>
                <input
                  type="number"
                  value={formData.fundingGoal || formData.targetRaise}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('fundingGoal', value);
                    handleInputChange('targetRaise', value);
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000000 (for $1M)"
                  min="0"
                  step="1000"
                />
                <p className="text-white/60 text-sm mt-1">Enter the total amount you're seeking to raise in USD</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tokenomics Document</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Upload Tokenomics File (PDF, Excel, etc.)</label>
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.doc,.docx"
                      onChange={(e) => handleFileUpload('tokenomicsFile', e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-white/60 text-sm mt-1">Supported formats: PDF, Excel (.xlsx, .xls), Word (.doc, .docx)</p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-white/60 text-sm">OR</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Tokenomics URL (Optional)</label>
                    <input
                      type="url"
                      value={formData.tokenomicsUrl ?? ''}
                      onChange={(e) => handleInputChange('tokenomicsUrl', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/tokenomics"
                    />
                    <p className="text-white/60 text-sm mt-1">Link to your tokenomics document online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Team & Experience</h2>
              <p className="text-white/60">Tell us about your team</p>
            </div>
            
            <div className="space-y-6">
              {/* Team Count */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Number of Team Members</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.teamCount ?? '1'}
                  onChange={(e) => handleInputChange('teamCount', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5"
                />
              </div>

              {/* Team Members */}
              <div>
                <label className="block text-sm font-medium text-white mb-4">Team Members</label>
                <div className="space-y-4">
                  {Array.from({ length: Math.max(1, parseInt(formData.teamCount ?? '1') || 1) }, (_, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Team Member {index + 1}</h4>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newMembers = [...(formData.teamMembers ?? [])];
                              newMembers.splice(index, 1);
                              handleInputChange('teamMembers', newMembers);
                              handleInputChange('teamCount', Math.max(1, parseInt(formData.teamCount ?? '1') - 1).toString());
                            }}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={formData.teamMembers[index]?.name ?? ''}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers ?? [])];
                              if (!newMembers[index]) newMembers[index] = { name: '', position: '', bio: '', linkedin: '', twitter: '', photo: null };
                              newMembers[index].name = e.target.value;
                              handleInputChange('teamMembers', newMembers);
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., John Smith"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Position</label>
                          <input
                            type="text"
                            value={formData.teamMembers[index]?.position ?? ''}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers ?? [])];
                              if (!newMembers[index]) newMembers[index] = { name: '', position: '', bio: '', linkedin: '', twitter: '', photo: null };
                              newMembers[index].position = e.target.value;
                              handleInputChange('teamMembers', newMembers);
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., CEO, CTO, Lead Developer"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Profile Photo</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers ?? [])];
                              if (!newMembers[index]) newMembers[index] = { name: '', position: '', bio: '', linkedin: '', twitter: '', photo: null };
                              newMembers[index].photo = e.target.files?.[0] || null;
                              handleInputChange('teamMembers', newMembers);
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">LinkedIn URL</label>
                          <input
                            type="url"
                            value={formData.teamMembers[index]?.linkedin ?? ''}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers ?? [])];
                              if (!newMembers[index]) newMembers[index] = { name: '', position: '', bio: '', linkedin: '', twitter: '', photo: null };
                              newMembers[index].linkedin = e.target.value;
                              handleInputChange('teamMembers', newMembers);
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">X (Twitter) URL</label>
                          <input
                            type="url"
                            value={formData.teamMembers[index]?.twitter ?? ''}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers ?? [])];
                              if (!newMembers[index]) newMembers[index] = { name: '', position: '', bio: '', linkedin: '', twitter: '', photo: null };
                              newMembers[index].twitter = e.target.value;
                              handleInputChange('teamMembers', newMembers);
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://x.com/username"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-white/80 mb-2">Bio/Experience</label>
                          <textarea
                            rows={3}
                            value={formData.teamMembers[index]?.bio ?? ''}
                            onChange={(e) => {
                              const newMembers = [...(formData.teamMembers ?? [])];
                              if (!newMembers[index]) newMembers[index] = { name: '', position: '', bio: '', linkedin: '', twitter: '', photo: null };
                              newMembers[index].bio = e.target.value;
                              handleInputChange('teamMembers', newMembers);
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Brief description of their experience and expertise..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange('teamCount', (parseInt(formData.teamCount ?? '1') + 1).toString());
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-semibold"
                    >
                      + Add Team Member
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Advisors</label>
                <textarea
                  rows={4}
                  value={formData.advisors?.join('\n') ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow "not yet" or LinkedIn URLs
                    if (value.toLowerCase().trim() === 'not yet' || value.toLowerCase().trim() === 'not yet.') {
                      handleInputChange('advisors', ['not yet']);
                    } else {
                      handleInputChange('advisors', value.split('\n').filter(advisor => advisor.trim()));
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add advisor LinkedIn URLs (one per line) or write 'not yet' if you don't have advisors"
                />
                <p className="text-white/60 text-sm mt-1">
                  Enter LinkedIn profile URLs (e.g., https://linkedin.com/in/advisor-name) or write "not yet" if you don't have advisors
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Team Experience Summary</label>
                <textarea
                  rows={5}
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your team's collective experience, achievements, and why you're qualified to execute this project. You can also add team LinkedIn URLs or write 'not yet' if still building the team."
                />
                <p className="text-white/60 text-sm mt-1">
                  Describe your team's experience or add team LinkedIn URLs. Write "not yet" if you're still building the team.
                </p>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PaperClipIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Documents</h2>
              <p className="text-white/60">Upload supporting documents (optional)</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Project Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('projectLogo', e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-white/60 text-sm mt-1">Upload your project logo (PNG, JPG, SVG)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Pitch Deck</label>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => handleFileUpload('pitchDeck', e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Whitepaper</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('whitepaper', e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tokenomics Document</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('tokenomics', e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Roadmap</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => handleFileUpload('roadmap', e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Step content coming soon...</div>;
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <LightBulbIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Project Pitch Wizard</h1>
          <p className="text-white/60 text-lg">Submit your project pitch for RaftAI analysis. This is a one-time submission.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const Icon = step.icon;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25' 
                        : isCompleted 
                        ? 'bg-green-500' 
                        : 'bg-white/10 border-2 border-white/20'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/60'}`}>
                          {step.id}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-medium mt-2 ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-white/20'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            Previous
          </button>
          
          <button
            onClick={currentStep === steps.length ? () => onComplete?.(formData) : nextStep}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            {currentStep === steps.length ? 'Submit Pitch' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPitchWizard;
