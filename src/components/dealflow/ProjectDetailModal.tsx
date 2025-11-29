"use client";

import { XMarkIcon, CheckCircleIcon, ShieldCheckIcon, ArrowTopRightOnSquareIcon, DocumentIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { extractProjectLogoUrl } from '@/lib/project-utils';

interface Project {
  id: string;
  title?: string;
  name?: string;
  sector?: string;
  chain?: string;
  description?: string;
  valueProposition?: string;
  valuePropOneLine?: string;
  problem?: string;
  solution?: string;
  logo?: string;
  logoUrl?: string;
  image?: string;
  badges?: {
    kyc?: boolean;
    kyb?: boolean;
    audit?: boolean;
    doxxed?: boolean;
  };
  funding?: {
    target?: number;
    raised?: number;
    currency?: string;
    investorCount?: number;
  };
  ido?: {
    status?: 'upcoming' | 'live' | 'completed';
    startDate?: any;
    endDate?: any;
    exchange?: string;
    platform?: string;
  };
  compliance?: {
    status?: 'compliant' | 'under_review' | 'pending';
    certikLink?: string;
    kycStatus?: 'verified' | 'pending' | 'not_submitted';
    kybStatus?: 'verified' | 'pending' | 'not_submitted';
  };
  social?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  interest?: {
    vcs?: number;
    exchanges?: number;
    idos?: number;
    influencers?: number;
    agencies?: number;
  };
  team?: any[];
  roadmap?: any[];
  createdAt?: any;
}

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  userRole?: string; // 'vc' | 'ido' | 'exchange' | 'influencer' | 'agency' | 'market'
}

export default function ProjectDetailModal({ project, onClose, userRole }: ProjectDetailModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const progress = project.funding?.target 
    ? ((project.funding?.raised || 0) / project.funding.target) * 100 
    : 0;

  const isVerified = project.badges?.kyc || project.badges?.kyb || project.compliance?.kycStatus === 'verified';

  // Role-based visibility rules
  const showAllDocs = ['vc', 'ido', 'exchange'].includes(userRole || ''); // VC, IDO, Exchange see all docs
  const showLimitedDocs = ['agency', 'market', 'influencer'].includes(userRole || ''); // Agency, Market, Influencer see only whitepaper + roadmap
  const showLogo = true; // All roles can see logo
  const showTeam = true; // All roles can see team

  // Helper to get document URL
  const getDocumentUrl = (doc: any): string | null => {
    if (!doc) return null;
    if (typeof doc === 'string') return doc;
    if (doc.url) return doc.url;
    if (doc.downloadURL) return doc.downloadURL;
    return null;
  };

  // Get documents from project data
  const documents = project.pitch?.documents || project.documents || {};
  const team = project.pitch?.teamMembers || project.team || [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" style={{ zIndex: 9999 }}>
      <div className="neo-glass-card rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-lg border-b border-white/10 p-6 flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            {showLogo && (() => {
              const logoUrl = extractProjectLogoUrl(project);
              return logoUrl ? (
                <img
                  src={logoUrl}
                  alt={project.title || project.name || 'Project'}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null;
            })()}
            {(!showLogo || !extractProjectLogoUrl(project)) && (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">
                  {(project.title || project.name || 'P').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {project.title || project.name || 'Untitled Project'}
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-white/60">{project.sector || 'N/A'}</span>
                {project.chain && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">{project.chain}</span>
                  </>
                )}
                {isVerified && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                      <ShieldCheckIcon className="w-3 h-3" />
                      Verified
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-white/80 leading-relaxed">
              {project.description || project.valueProposition || project.valuePropOneLine || 'No description available'}
            </p>
          </div>

          {/* Funding Information */}
          {project.funding && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Funding</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">Raised / Target</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(project.funding.raised || 0)} / {formatCurrency(project.funding.target || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="text-right text-white/60 text-sm mt-1">
                    {progress.toFixed(1)}% Complete
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/60 text-sm mb-1">Investors</div>
                    <div className="text-white text-xl font-semibold">
                      {project.funding.investorCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm mb-1">Currency</div>
                    <div className="text-white text-xl font-semibold">
                      {project.funding.currency || 'USD'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IDO Information */}
          {project.ido && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">IDO Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-white/60 text-sm mb-1">Status</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                    project.ido.status === 'live' ? 'bg-green-500/20 text-green-400' :
                    project.ido.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {project.ido.status?.charAt(0).toUpperCase() + project.ido.status?.slice(1)}
                  </div>
                </div>
                <div>
                  <div className="text-white/60 text-sm mb-1">Exchange/Platform</div>
                  <div className="text-white font-semibold">
                    {project.ido.exchange || project.ido.platform || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-white/60 text-sm mb-1">Start Date</div>
                  <div className="text-white">
                    {formatDate(project.ido.startDate)}
                  </div>
                </div>
                <div>
                  <div className="text-white/60 text-sm mb-1">End Date</div>
                  <div className="text-white">
                    {formatDate(project.ido.endDate)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interest Stats */}
          {project.interest && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Interest & Engagement</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.interest.vcs !== undefined && (
                  <div className="neo-glass-card rounded-lg p-4 border border-white/10">
                    <div className="text-white/60 text-sm mb-1">VCs Interested</div>
                    <div className="text-2xl font-bold text-blue-400">{project.interest.vcs || 0}</div>
                  </div>
                )}
                {project.interest.exchanges !== undefined && (
                  <div className="neo-glass-card rounded-lg p-4 border border-white/10">
                    <div className="text-white/60 text-sm mb-1">Exchanges</div>
                    <div className="text-2xl font-bold text-green-400">{project.interest.exchanges || 0}</div>
                  </div>
                )}
                {project.interest.influencers !== undefined && (
                  <div className="neo-glass-card rounded-lg p-4 border border-white/10">
                    <div className="text-white/60 text-sm mb-1">Influencers</div>
                    <div className="text-2xl font-bold text-purple-400">{project.interest.influencers || 0}</div>
                  </div>
                )}
                {project.interest.agencies !== undefined && (
                  <div className="neo-glass-card rounded-lg p-4 border border-white/10">
                    <div className="text-white/60 text-sm mb-1">Agencies</div>
                    <div className="text-2xl font-bold text-orange-400">{project.interest.agencies || 0}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compliance */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Compliance & Verification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-white/60 text-sm mb-2">KYC Status</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                  project.compliance?.kycStatus === 'verified' || project.badges?.kyc
                    ? 'bg-green-500/20 text-green-400'
                    : project.compliance?.kycStatus === 'pending'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {project.compliance?.kycStatus === 'verified' || project.badges?.kyc ? 'Verified' :
                   project.compliance?.kycStatus === 'pending' ? 'Pending' : 'Not Submitted'}
                </div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-2">KYB Status</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                  project.compliance?.kybStatus === 'verified' || project.badges?.kyb
                    ? 'bg-green-500/20 text-green-400'
                    : project.compliance?.kybStatus === 'pending'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {project.compliance?.kybStatus === 'verified' || project.badges?.kyb ? 'Verified' :
                   project.compliance?.kybStatus === 'pending' ? 'Pending' : 'Not Submitted'}
                </div>
              </div>
              {project.compliance?.certikLink && (
                <div className="col-span-2">
                  <div className="text-white/60 text-sm mb-2">Certik Audit</div>
                  <a
                    href={project.compliance.certikLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Certik Report
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {project.social && (project.social.website || project.social.twitter || project.social.telegram || project.social.discord) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Links</h3>
              <div className="flex flex-wrap gap-3">
                {project.social.website && (
                  <a
                    href={project.social.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Website
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                )}
                {project.social.twitter && (
                  <a
                    href={project.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Twitter
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                )}
                {project.social.telegram && (
                  <a
                    href={project.social.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Telegram
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                )}
                {project.social.discord && (
                  <a
                    href={project.social.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Discord
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Problem & Solution */}
          {(project.problem || project.solution) && (
            <div className="space-y-4">
              {project.problem && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Problem</h3>
                  <p className="text-white/80 leading-relaxed">{project.problem}</p>
                </div>
              )}
              {project.solution && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Solution</h3>
                  <p className="text-white/80 leading-relaxed">{project.solution}</p>
                </div>
              )}
            </div>
          )}

          {/* Documents Section - Role-based visibility */}
          {((showAllDocs && (documents.pitchDeck || documents.whitepaper || documents.tokenomics || documents.roadmap)) ||
            (showLimitedDocs && (documents.whitepaper || documents.roadmap))) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DocumentIcon className="w-5 h-5 text-blue-400" />
                Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pitch Deck - Only for VC/IDO/Exchange/Influencer */}
                {showAllDocs && documents.pitchDeck && getDocumentUrl(documents.pitchDeck) && (
                  <a
                    href={getDocumentUrl(documents.pitchDeck)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-glass-card rounded-lg p-4 border border-white/10 hover:border-blue-400/50 transition-colors flex items-center gap-3"
                  >
                    <DocumentIcon className="w-8 h-8 text-blue-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white font-semibold">Pitch Deck</div>
                      <div className="text-white/60 text-sm">View document</div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-white/40" />
                  </a>
                )}
                
                {/* Whitepaper - All roles that can see docs */}
                {(showAllDocs || showLimitedDocs) && documents.whitepaper && getDocumentUrl(documents.whitepaper) && (
                  <a
                    href={getDocumentUrl(documents.whitepaper)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-glass-card rounded-lg p-4 border border-white/10 hover:border-blue-400/50 transition-colors flex items-center gap-3"
                  >
                    <DocumentIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white font-semibold">Whitepaper</div>
                      <div className="text-white/60 text-sm">View document</div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-white/40" />
                  </a>
                )}
                
                {/* Tokenomics - Only for VC/IDO/Exchange/Influencer */}
                {showAllDocs && documents.tokenomics && getDocumentUrl(documents.tokenomics) && (
                  <a
                    href={getDocumentUrl(documents.tokenomics)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-glass-card rounded-lg p-4 border border-white/10 hover:border-blue-400/50 transition-colors flex items-center gap-3"
                  >
                    <DocumentIcon className="w-8 h-8 text-purple-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white font-semibold">Tokenomics</div>
                      <div className="text-white/60 text-sm">View document</div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-white/40" />
                  </a>
                )}
                
                {/* Roadmap - All roles that can see docs */}
                {(showAllDocs || showLimitedDocs) && documents.roadmap && getDocumentUrl(documents.roadmap) && (
                  <a
                    href={getDocumentUrl(documents.roadmap)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-glass-card rounded-lg p-4 border border-white/10 hover:border-blue-400/50 transition-colors flex items-center gap-3"
                  >
                    <DocumentIcon className="w-8 h-8 text-orange-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white font-semibold">Roadmap</div>
                      <div className="text-white/60 text-sm">View document</div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-white/40" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Team Section - All roles can see team */}
          {showTeam && team.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-purple-400" />
                Team
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.map((member: any, index: number) => {
                  const memberName = member.name || member.fullName || 'Team Member';
                  const memberRole = member.role || member.position || member.title || 'Role not specified';
                  const memberBio = member.bio || member.description || '';
                  const memberPhoto = member.photo || member.photoUrl || member.image || member.avatar || null;
                  const memberLinkedIn = member.linkedin || member.linkedIn || '';
                  
                  return (
                    <div key={index} className="neo-glass-card rounded-lg p-4 border border-white/10">
                      <div className="flex items-start gap-3">
                        {memberPhoto && typeof memberPhoto === 'string' && memberPhoto.startsWith('http') ? (
                          <img
                            src={memberPhoto}
                            alt={memberName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {memberName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold mb-1">{memberName}</h4>
                          <p className="text-purple-400 text-sm mb-2">{memberRole}</p>
                          {memberBio && (
                            <p className="text-white/70 text-sm line-clamp-2 mb-2">{memberBio}</p>
                          )}
                          {memberLinkedIn && (
                            <a
                              href={memberLinkedIn}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                            >
                              LinkedIn
                              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

