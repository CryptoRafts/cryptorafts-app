"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { vcDealflowManager } from '@/lib/vc-dealflow-manager';
import { Project } from '@/lib/vc-data-models';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface VCProjectDeepDiveProps {
  projectId: string;
  onBack: () => void;
}

export default function VCProjectDeepDive({ projectId, onBack }: VCProjectDeepDiveProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'tokenomics' | 'team' | 'risks' | 'cap_table' | 'community' | 'notes'>('overview');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const projectData = await vcDealflowManager.getProject(projectId);
      if (!projectData) {
        throw new Error('Project not found');
      }
      setProject(projectData);
    } catch (error) {
      console.error('Error loading project:', error);
      setError(error instanceof Error ? error.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDocumentAccess = async (documentType: string) => {
    if (!user) return;
    
    try {
      // Get orgId from user context
      const response = await fetch('/api/vc/get-org-id', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      const { orgId } = await response.json();
      
      await vcDealflowManager.requestDocumentAccess(orgId, projectId, user.uid, documentType);
      // Show success message or redirect to document
    } catch (error) {
      console.error('Error requesting document access:', error);
      setError(error instanceof Error ? error.message : 'Failed to request document access');
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="flex items-start space-x-4">
          {project?.logoUrl && (
            <img 
              src={project.logoUrl} 
              alt={project.title}
              className="w-20 h-20 rounded-lg object-cover"
              width={80}
              height={80}
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{project?.title}</h1>
            <p className="text-white/60 mb-4">{project?.valuePropOneLine}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                {project?.sector}
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                {project?.chain}
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">
                {project?.stage}
              </span>
            </div>

            {project?.raftai && (
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.raftai.rating === 'High' ? 'bg-green-500/20 text-green-400' :
                  project.raftai.rating === 'Normal' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  RaftAI: {project.raftai.rating} ({project.raftai.score}/100)
                </div>
                <div className="text-white/60 text-sm">
                  {project.raftai.summary}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {project?.description && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
          <p className="text-white/80 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Badges */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Verification Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            {project?.badges.kyc ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className="text-white/80 text-sm">KYC</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {project?.badges.kyb ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className="text-white/80 text-sm">KYB</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {project?.badges.audit ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className="text-white/80 text-sm">Audit</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {project?.badges.doxxed ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className="text-white/80 text-sm">Doxxed</span>
          </div>
        </div>
      </div>

      {/* Traction */}
      {project?.traction && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Traction</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.traction.users && (
              <div>
                <p className="text-white/60 text-sm">Users</p>
                <p className="text-2xl font-bold text-white">{project.traction.users.toLocaleString()}</p>
              </div>
            )}
            
            {project.traction.revenue && (
              <div>
                <p className="text-white/60 text-sm">Revenue</p>
                <p className="text-2xl font-bold text-white">${project.traction.revenue.toLocaleString()}</p>
              </div>
            )}
            
            {project.traction.partnerships && (
              <div>
                <p className="text-white/60 text-sm">Partnerships</p>
                <p className="text-2xl font-bold text-white">{project.traction.partnerships.length}</p>
              </div>
            )}
          </div>
          
          {project.traction.milestones && project.traction.milestones.length > 0 && (
            <div className="mt-6">
              <p className="text-white/60 text-sm mb-2">Milestones</p>
              <ul className="space-y-2">
                {project.traction.milestones.map((milestone, index) => (
                  <li key={index} className="flex items-center space-x-2 text-white/80">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span>{milestone}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDocsTab = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
        
        <div className="space-y-4">
          {project?.uploads?.pitchDeck && (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-white font-medium">Pitch Deck</p>
                  <p className="text-white/60 text-sm">Presentation slides</p>
                </div>
              </div>
              <button
                onClick={() => handleRequestDocumentAccess('pitchDeck')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                View
              </button>
            </div>
          )}

          {project?.uploads?.whitepaper && (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-white font-medium">Whitepaper</p>
                  <p className="text-white/60 text-sm">Technical documentation</p>
                </div>
              </div>
              <button
                onClick={() => handleRequestDocumentAccess('whitepaper')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                View
              </button>
            </div>
          )}

          {project?.uploads?.tokenModel && (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-white font-medium">Token Model</p>
                  <p className="text-white/60 text-sm">Economic model and tokenomics</p>
                </div>
              </div>
              <button
                onClick={() => handleRequestDocumentAccess('tokenModel')}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                View
              </button>
            </div>
          )}

          {project?.uploads?.audits && project.uploads.audits.length > 0 && (
            <div className="space-y-2">
              {project.uploads.audits.map((audit, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-white font-medium">Audit Report {index + 1}</p>
                      <p className="text-white/60 text-sm">Security audit report</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequestDocumentAccess(`audit_${index}`)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {!project?.uploads?.pitchDeck && !project?.uploads?.whitepaper && !project?.uploads?.tokenModel && (!project?.uploads?.audits || project.uploads.audits.length === 0) && (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No documents available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTokenomicsTab = () => (
    <div className="space-y-6">
      {project?.tokenomics ? (
        <>
          {/* Token Supply */}
          {project.tokenomics.totalSupply && (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Token Supply</h3>
              <p className="text-3xl font-bold text-white">
                {project.tokenomics.totalSupply.toLocaleString()}
              </p>
            </div>
          )}

          {/* Token Distribution */}
          {project.tokenomics.tokenDistribution && (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Token Distribution</h3>
              <div className="space-y-4">
                {project.tokenomics.tokenDistribution.map((distribution, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{distribution.category}</p>
                      {distribution.vesting && (
                        <p className="text-white/60 text-sm">Vesting: {distribution.vesting}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{distribution.percentage}%</p>
                      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${distribution.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {project.tokenomics.anomalies && project.tokenomics.anomalies.length > 0 && (
            <div className="bg-red-500/10 backdrop-blur-lg rounded-xl p-6 border border-red-500/20">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>RaftAI Anomalies</span>
              </h3>
              <ul className="space-y-2">
                {project.tokenomics.anomalies.map((anomaly, index) => (
                  <li key={index} className="text-red-300 text-sm">
                    • {anomaly}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <ChartBarIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No tokenomics data available</p>
        </div>
      )}
    </div>
  );

  const renderTeamTab = () => (
    <div className="space-y-6">
      {project?.team && project.team.length > 0 ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.team.map((member, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{member.name}</p>
                    <p className="text-white/60 text-sm">{member.role}</p>
                  </div>
                </div>
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    LinkedIn Profile
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No team information available</p>
        </div>
      )}
    </div>
  );

  const renderRisksTab = () => {
    const risks = (project?.raftai?.risks ?? []) as Array<any>;

    return (
      <div className="space-y-6">
        {risks.length > 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">RaftAI Risk Analysis</h3>
            <div className="space-y-4">
              {risks.map((rawRisk, index) => {
                const normalizedRisk = typeof rawRisk === 'string'
                  ? { severity: 'medium', description: rawRisk }
                  : rawRisk ?? {};

                const severity = (normalizedRisk.severity ?? 'medium') as 'high' | 'medium' | 'low';
                const description = normalizedRisk.description ?? (typeof rawRisk === 'string' ? rawRisk : '');

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      severity === 'high'
                        ? 'bg-red-500/10 border-red-500/20'
                        : severity === 'medium'
                          ? 'bg-yellow-500/10 border-yellow-500/20'
                          : 'bg-green-500/10 border-green-500/20'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon
                        className={`h-5 w-5 mt-0.5 ${
                          severity === 'high'
                            ? 'text-red-400'
                            : severity === 'medium'
                              ? 'text-yellow-400'
                              : 'text-green-400'
                        }`}
                      />
                      <div>
                        <p className="text-white font-medium capitalize mb-1">{severity} Risk</p>
                        <p className="text-white/80 text-sm">{description}</p>
                        {normalizedRisk.source && (
                          <p className="text-white/60 text-xs mt-2">Source: {normalizedRisk.source}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No risk analysis available</p>
          </div>
        )}
      </div>
    );
  };

  const renderCapTableTab = () => (
    <div className="text-center py-12">
      <BuildingOfficeIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
      <p className="text-white/60">Cap table information not shared</p>
      <p className="text-white/40 text-sm">This information is typically shared after initial interest</p>
    </div>
  );

  const renderCommunityTab = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Community Links</h3>
        
        <div className="space-y-4">
          {project?.website && (
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="h-5 w-5 text-blue-400" />
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {project.website}
              </a>
            </div>
          )}
          
          <div className="text-white/60 text-sm">
            Additional community links would be displayed here
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Private Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your private notes about this project..."
          className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
        />
        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Project Not Found</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: EyeIcon },
    { id: 'docs', label: 'Docs', icon: DocumentTextIcon },
    { id: 'tokenomics', label: 'Tokenomics', icon: ChartBarIcon },
    { id: 'team', label: 'Team', icon: UserGroupIcon },
    { id: 'risks', label: 'Risks', icon: ExclamationTriangleIcon },
    { id: 'cap_table', label: 'Cap Table', icon: BuildingOfficeIcon },
    { id: 'community', label: 'Community', icon: GlobeAltIcon },
    { id: 'notes', label: 'Notes', icon: DocumentTextIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070B] to-[#0A1117] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              <p className="text-white/60">{project.sector} • {project.chain}</p>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                <HeartIcon className="h-4 w-4" />
                <span>Watch</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Accept</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'docs' && renderDocsTab()}
        {activeTab === 'tokenomics' && renderTokenomicsTab()}
        {activeTab === 'team' && renderTeamTab()}
        {activeTab === 'risks' && renderRisksTab()}
        {activeTab === 'cap_table' && renderCapTableTab()}
        {activeTab === 'community' && renderCommunityTab()}
        {activeTab === 'notes' && renderNotesTab()}
      </div>
    </div>
  );
}
