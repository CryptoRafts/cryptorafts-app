"use client";

import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
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
  logo?: string;
  logoUrl?: string;
  image?: string;
  founderId?: string;
  founderName?: string;
  founderLogo?: string;
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
  interest?: {
    vcs?: number;
    exchanges?: number;
    idos?: number;
    influencers?: number;
    agencies?: number;
  };
  raftai?: {
    score?: number;
    rating?: string;
    summary?: string;
    insights?: string[];
    risks?: string[];
    recommendations?: string[];
  };
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const progress = project.funding?.target 
    ? ((project.funding?.raised || 0) / project.funding.target) * 100 
    : 0;

  const isVerified = project.badges?.kyc || project.badges?.kyb || project.compliance?.kycStatus === 'verified';
  const hasCertik = project.compliance?.certikLink;

  const getStatusColor = () => {
    switch (project.ido?.status) {
      case 'live':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
  };

  const getStatusIcon = () => {
    switch (project.ido?.status) {
      case 'live':
        return <NeonCyanIcon type="check" size={16} className="text-current" />;
      case 'completed':
        return <NeonCyanIcon type="check" size={16} className="text-current" />;
      default:
        return <NeonCyanIcon type="clock" size={16} className="text-current" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="neo-glass-card rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/40 cursor-pointer transition-all duration-300 hover:scale-[1.02] group shadow-lg shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {(() => {
            const logoUrl = extractProjectLogoUrl(project);
            return logoUrl ? (
              <img
                src={logoUrl}
                alt={project.title || project.name || 'Project'}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null;
          })()}
          {!extractProjectLogoUrl(project) && (
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-400/30 shadow-lg shadow-cyan-500/20">
              <span className="text-cyan-400 font-bold text-lg">
                {(project.title || project.name || 'P').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate group-hover:text-cyan-400 transition-colors">
              {project.title || project.name || 'Untitled Project'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-cyan-400/70 text-sm">{project.sector || 'N/A'}</span>
              {project.chain && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-cyan-400/70 text-sm">{project.chain}</span>
                </>
              )}
            </div>
            {/* Founder Info */}
            {project.founderName && (
              <div className="flex items-center gap-2 mt-2">
                {/* Only render img if founderLogo is a valid HTTPS URL to prevent 404 errors */}
                {project.founderLogo && typeof project.founderLogo === 'string' && project.founderLogo.startsWith('https://') ? (
                  <img 
                    src={project.founderLogo} 
                    alt={project.founderName}
                    className="w-5 h-5 rounded-full object-cover border border-cyan-400/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <span className="text-white/50 text-xs">{project.founderName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-white/70 text-sm mb-4 line-clamp-2">
        {project.description || project.valueProposition || project.valuePropOneLine || 'No description available'}
      </p>

      {/* Funding Progress */}
      {project.funding && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white/80 text-sm">
              {formatCurrency(project.funding.raised || 0)} / {formatCurrency(project.funding.target || 0)}
            </div>
            <div className="text-white/60 text-xs">
              {progress.toFixed(1)}%
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-cyan-400/20">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/30"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {project.funding?.investorCount !== undefined && (
            <div className="flex items-center gap-1 text-cyan-400/70 text-sm">
              <NeonCyanIcon type="users" size={16} className="text-current" />
              {project.funding.investorCount}
            </div>
          )}
          {project.ido?.exchange && (
            <div className="text-cyan-400/70 text-sm truncate max-w-[120px]">
              {project.ido.exchange}
            </div>
          )}
        </div>
      </div>

      {/* Interest Stats */}
      {project.interest && (
        <div className="mb-4 pt-3 border-t border-cyan-400/20">
          <div className="flex items-center gap-3 flex-wrap">
            {project.interest.vcs !== undefined && project.interest.vcs > 0 && (
              <div className="flex items-center gap-1 text-blue-400 text-xs">
                <NeonCyanIcon type="users" size={12} className="text-current" />
                {project.interest.vcs} VC{project.interest.vcs !== 1 ? 's' : ''}
              </div>
            )}
            {project.interest.exchanges !== undefined && project.interest.exchanges > 0 && (
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <NeonCyanIcon type="globe" size={12} className="text-current" />
                {project.interest.exchanges} Exchange{project.interest.exchanges !== 1 ? 's' : ''}
              </div>
            )}
            {project.interest.influencers !== undefined && project.interest.influencers > 0 && (
              <div className="flex items-center gap-1 text-purple-400 text-xs">
                <NeonCyanIcon type="users" size={12} className="text-current" />
                {project.interest.influencers} Influencer{project.interest.influencers !== 1 ? 's' : ''}
              </div>
            )}
            {project.interest.agencies !== undefined && project.interest.agencies > 0 && (
              <div className="flex items-center gap-1 text-orange-400 text-xs">
                <NeonCyanIcon type="building" size={12} className="text-current" />
                {project.interest.agencies} Agenc{project.interest.agencies !== 1 ? 'ies' : 'y'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RaftAI Score */}
      {project.raftai?.score && (
        <div className="mb-3 p-2 bg-white/5 rounded-lg border border-cyan-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <NeonCyanIcon type="cpu" size={14} className="text-cyan-400" />
              <span className="text-white/60 text-xs">RaftAI Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{project.raftai.score}/100</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                project.raftai.score >= 80 ? 'bg-green-500/20 text-green-400' :
                project.raftai.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {project.raftai.score >= 80 ? 'Low Risk' : project.raftai.score >= 60 ? 'Med Risk' : 'High Risk'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Badges & Status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Verification Badge */}
          {isVerified && (
            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
              <NeonCyanIcon type="shield" size={12} className="text-current" />
              Verified
            </span>
          )}
          
          {/* Certik Badge */}
          {hasCertik && (
            <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
              Certik
            </span>
          )}

          {/* KYC/KYB Status */}
          {!isVerified && (
            <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400">
              {project.compliance?.kycStatus === 'pending' ? 'Pending' : 'Not Verified'}
            </span>
          )}
        </div>

        {/* IDO Status */}
        {project.ido?.status && (
          <span className={`px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            {project.ido.status.charAt(0).toUpperCase() + project.ido.status.slice(1)}
          </span>
        )}
      </div>
    </div>
  );
}

