/**
 * RaftAI Badge Component
 * Shows verification status and scores inline
 */

'use client';

import type { DecisionStatus, PitchRating, RiskLevel } from '@/lib/raftai/types';

interface RaftAIBadgeProps {
  type: 'kyc' | 'kyb' | 'pitch' | 'risk' | 'verification';
  status?: DecisionStatus | PitchRating | RiskLevel | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export function RaftAIBadge({ type, status, score, size = 'md', showScore = false }: RaftAIBadgeProps) {
  const getColors = () => {
    switch (status) {
      case 'approved':
      case 'verified':
      case 'high':
      case 'low': // low risk
        return 'bg-green-100 text-green-800 border-green-200';
      
      case 'pending':
      case 'normal':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      
      case 'rejected':
      case 'suspicious':
      case 'fake':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'kyc': return '🔐';
      case 'kyb': return '🏢';
      case 'pitch': return '📊';
      case 'risk': return '⚖️';
      case 'verification': return '✓';
      default: return '•';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-0.5';
      case 'lg': return 'text-base px-4 py-2';
      default: return 'text-sm px-3 py-1';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${getColors()} ${getSizeClasses()}`}>
      <span>{getIcon()}</span>
      <span className="capitalize">{status || 'Unknown'}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 font-bold">{score}</span>
      )}
    </span>
  );
}

export function RaftAIScoreDisplay({ score, label }: { score: number; label?: string }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-600">{label}:</span>}
      <div className="flex items-center gap-1">
        <div className="relative w-12 h-12">
          <svg className="transform -rotate-90" width="48" height="48">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - score / 100)}`}
              className={getColor()}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${getColor()}`}>
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}

