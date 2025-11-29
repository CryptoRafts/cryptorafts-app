"use client";
import React from 'react';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface VerificationStatusProps {
  type: 'kyc' | 'kyb';
  status: 'pending' | 'approved' | 'rejected';
  riskScore?: number;
  reasons?: string[];
  cooldownUntil?: Date;
  onRetry?: () => void;
}

export default function VerificationStatus({ 
  type, 
  status, 
  riskScore, 
  reasons, 
  cooldownUntil,
  onRetry 
}: VerificationStatusProps) {
  const isKYC = type === 'kyc';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending';
  const canRetry = isRejected && (!cooldownUntil || new Date() > cooldownUntil);

  const getStatusIcon = () => {
    if (isApproved) return <NeonCyanIcon type="check" size={20} className="text-green-400" />;
    if (isRejected) return <NeonCyanIcon type="x-circle" size={20} className="text-red-400" />;
    return <NeonCyanIcon type="clock" size={20} className="text-yellow-400" />;
  };

  const getStatusColor = () => {
    if (isApproved) return 'border-green-400/20 bg-green-400/10';
    if (isRejected) return 'border-red-400/20 bg-red-400/10';
    return 'border-yellow-400/20 bg-yellow-400/10';
  };

  const getStatusText = () => {
    if (isApproved) return 'Approved';
    if (isRejected) return 'Rejected';
    return 'In Review';
  };

  const getRiskLevel = () => {
    if (!riskScore) return null;
    if (riskScore <= 30) return { level: 'Low', color: 'text-green-400' };
    if (riskScore <= 70) return { level: 'Medium', color: 'text-yellow-400' };
    return { level: 'High', color: 'text-red-400' };
  };

  const riskLevel = getRiskLevel();

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <div>
          <h3 className="font-medium text-white">
            {isKYC ? 'KYC' : 'KYB'} Verification
          </h3>
          <p className="text-sm text-slate-400">
            Status: <span className="font-medium">{getStatusText()}</span>
          </p>
        </div>
      </div>

      {riskLevel && (
        <div className="mb-3">
          <p className="text-sm text-slate-400">
            Risk Score: <span className={`font-medium ${riskLevel.color}`}>
              {riskLevel.level} ({riskScore}/100)
            </span>
          </p>
        </div>
      )}

      {isRejected && reasons && reasons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-red-400 mb-2">Rejection Reasons:</h4>
          <ul className="space-y-1">
            {reasons.map((reason, index) => (
              <li key={index} className="text-sm text-red-300 flex items-start gap-2">
                <NeonCyanIcon type="exclamation" size={16} className="text-current mt-0.5 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cooldownUntil && new Date() <= cooldownUntil && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-400">
            Cooldown period active. You can retry verification after{' '}
            <span className="font-medium text-white">
              {cooldownUntil.toLocaleDateString()}
            </span>
          </p>
        </div>
      )}

      {canRetry && onRetry && (
        <button
          onClick={onRetry}
          className="btn-neon-secondary text-sm"
        >
          Retry {isKYC ? 'KYC' : 'KYB'} Verification
        </button>
      )}

      {isApproved && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <NeonCyanIcon type="check" size={16} className="text-current" />
          <span>Verification completed successfully</span>
        </div>
      )}
    </div>
  );
}
