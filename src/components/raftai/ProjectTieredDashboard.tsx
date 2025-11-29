/**
 * RaftAI Project Tiered Dashboard
 * Displays projects organized by High, Medium, Low tiers with real-time updates
 */

'use client';

import { useEffect, useState } from 'react';
import { useSimpleAuth } from '@/lib/auth-simple';
import { projectRanking } from '@/lib/raftai/project-ranking';
import type { ProjectsByTier, RankedProject, ProjectTier } from '@/lib/raftai/project-ranking';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

export function ProjectTieredDashboard() {
  const { user, profile, loading: authLoading } = useSimpleAuth();
  const role = profile?.role;
  const [projects, setProjects] = useState<ProjectsByTier>({
    high: [],
    medium: [],
    low: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<ProjectTier | 'all'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user || !role) return;

    // Don't show ranked dashboard for founders
    if (role === 'founder') {
      setLoading(false);
      return;
    }

    console.log(`📊 Loading tiered projects for ${role}`);

    // Subscribe to real-time ranked projects
    const unsubscribe = projectRanking.subscribeToRankedProjects(
      role,
      user.uid,
      (rankedProjects) => {
        setProjects(rankedProjects);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [authLoading, role, user]);

  if (!user || !role || role === 'founder') {
    return (
      <div className="text-center py-12 text-gray-500">
        Project ranking is not available for your role.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalProjects = projects.high.length + projects.medium.length + projects.low.length;

  if (totalProjects === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No projects available</div>
        <p className="text-gray-500 text-sm">Projects will appear here as they become available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <NeonCyanIcon type="analytics" size={28} className="text-white" />
          <h2 className="text-2xl font-bold">Project Rankings</h2>
        </div>
        <p className="text-blue-100 mb-4">
          AI-powered scoring based on traction, revenue, engagement, and verification
        </p>
        <div className="grid grid-cols-3 gap-4">
          <TierStat tier="high" count={projects.high.length} />
          <TierStat tier="medium" count={projects.medium.length} />
          <TierStat tier="low" count={projects.low.length} />
        </div>
      </div>

      {/* Tier Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <FilterButton
          active={selectedTier === 'all'}
          onClick={() => setSelectedTier('all')}
          count={totalProjects}
        >
          All Projects
        </FilterButton>
        <FilterButton
          active={selectedTier === 'high'}
          onClick={() => setSelectedTier('high')}
          count={projects.high.length}
          color="green"
        >
          🌟 High Potential
        </FilterButton>
        <FilterButton
          active={selectedTier === 'medium'}
          onClick={() => setSelectedTier('medium')}
          count={projects.medium.length}
          color="yellow"
        >
          📊 Medium Potential
        </FilterButton>
        <FilterButton
          active={selectedTier === 'low'}
          onClick={() => setSelectedTier('low')}
          count={projects.low.length}
          color="gray"
        >
          📈 Low Potential
        </FilterButton>
      </div>

      {/* High Tier Projects */}
      {(selectedTier === 'all' || selectedTier === 'high') && projects.high.length > 0 && (
        <ProjectTier
          tier="high"
          title="🌟 High Potential"
          subtitle="Score ≥ 80 - Top opportunities with strong metrics"
          projects={projects.high}
          color="green"
        />
      )}

      {/* Medium Tier Projects */}
      {(selectedTier === 'all' || selectedTier === 'medium') && projects.medium.length > 0 && (
        <ProjectTier
          tier="medium"
          title="📊 Medium Potential"
          subtitle="Score 50-79 - Good opportunities worth exploring"
          projects={projects.medium}
          color="yellow"
        />
      )}

      {/* Low Tier Projects */}
      {(selectedTier === 'all' || selectedTier === 'low') && projects.low.length > 0 && (
        <ProjectTier
          tier="low"
          title="📈 Low Potential"
          subtitle="Score < 50 - Early stage or needs improvement"
          projects={projects.low}
          color="gray"
        />
      )}
    </div>
  );
}

function TierStat({ tier, count }: { tier: 'high' | 'medium' | 'low'; count: number }) {
  const colors = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-gray-500',
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
      <div className={`w-3 h-3 rounded-full ${colors[tier]} mb-2`}></div>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm text-blue-100">{labels[tier]} Tier</div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  count,
  color = 'blue',
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  color?: 'blue' | 'green' | 'yellow' | 'gray';
  children: React.ReactNode;
}) {
  const colors = {
    blue: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    green: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
    yellow: active ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    gray: active ? 'bg-gray-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${colors[color]}`}
    >
      {children} <span className="ml-1.5 opacity-75">({count})</span>
    </button>
  );
}

function ProjectTier({
  tier,
  title,
  subtitle,
  projects,
  color,
}: {
  tier: ProjectTier;
  title: string;
  subtitle: string;
  projects: RankedProject[];
  color: 'green' | 'yellow' | 'gray';
}) {
  const borderColors = {
    green: 'border-green-200',
    yellow: 'border-yellow-200',
    gray: 'border-gray-200',
  };

  const bgColors = {
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    gray: 'bg-gray-50',
  };

  return (
    <div className={`border-2 ${borderColors[color]} rounded-lg overflow-hidden`}>
      {/* Tier Header */}
      <div className={`${bgColors[color]} border-b-2 ${borderColors[color]} p-4`}>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        <div className="text-xs text-gray-500 mt-2">{projects.length} projects</div>
      </div>

      {/* Projects List */}
      <div className="divide-y divide-gray-200">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} rank={index + 1} tier={tier} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  rank,
  tier,
}: {
  project: RankedProject;
  rank: number;
  tier: ProjectTier;
}) {
  const tierColors = {
    high: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-gray-600 bg-gray-50',
  };

  return (
    <div className="bg-white p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${tierColors[tier]} flex items-center justify-center font-bold text-lg`}>
          {rank}
        </div>

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-semibold text-gray-900 truncate">
                  {project.name}
                </h4>
                {project.isSpotlight && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    ⭐ Spotlight
                  </span>
                )}
                {project.isPremium && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    💎 Premium
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
            </div>

            {/* Potential Score */}
            <div className="flex-shrink-0 text-right">
              <div className="text-3xl font-bold text-gray-900">{project.potentialScore}</div>
              <div className="text-xs text-gray-500">Potential Score</div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            <ScoreFactor
              label="Traction"
              score={project.scoreFactors.traction}
              icon="🚀"
            />
            <ScoreFactor
              label="Revenue"
              score={project.scoreFactors.revenue}
              icon="💰"
            />
            <ScoreFactor
              label="Engagement"
              score={project.scoreFactors.userEngagement}
              icon="👥"
            />
            <ScoreFactor
              label="Verified"
              score={project.scoreFactors.verificationStatus}
              icon="✓"
            />
            <ScoreFactor
              label="Risk"
              score={100 - project.scoreFactors.riskScore}
              icon="🛡️"
              inverted
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              View Details
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              Contact Founder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreFactor({
  label,
  score,
  icon,
  inverted = false,
}: {
  label: string;
  score: number;
  icon: string;
  inverted?: boolean;
}) {
  const getColor = (value: number) => {
    if (value >= 80) return 'text-green-600 bg-green-50';
    if (value >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="text-center">
      <div className={`text-sm font-semibold ${getColor(score)} rounded-lg p-2`}>
        <div className="text-lg mb-1">{icon}</div>
        <div className="text-xs">{Math.round(score)}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

