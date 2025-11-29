'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { dealRoomManager } from '@/lib/deal-room-manager';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';

interface InvitationHandlerProps {
  invitationCode?: string;
  userEmail?: string;
  onSuccess?: (dealRoomId: string) => void;
  onError?: (error: string) => void;
}

const InvitationHandler: React.FC<InvitationHandlerProps> = ({
  invitationCode,
  userEmail,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Check invitation when component mounts
  useEffect(() => {
    if (invitationCode && userEmail) {
      checkInvitation();
    }
  }, [invitationCode, userEmail]);

  const checkInvitation = async () => {
    if (!invitationCode) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // In a real implementation, you would check the invitation here
      // For now, we'll simulate checking
      const mockInvitation = {
        code: invitationCode,
        email: userEmail,
        roomName: 'Demo Deal Room',
        inviterName: 'Demo VC',
        teamType: 'vc',
        role: 'member',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      
      setInvitationInfo(mockInvitation);
    } catch (error) {
      setError('Failed to verify invitation code');
    } finally {
      setIsProcessing(false);
    }
  };

  const acceptInvitation = async () => {
    if (!user || !invitationCode) return;
    
    setIsProcessing(true);
    
    try {
      const result = await dealRoomManager.acceptTeamInvitation(
        invitationCode,
        user.uid,
        user.email || '',
        user.displayName || user.email?.split('@')[0] || 'User'
      );
      
      if (result.success) {
        onSuccess?.(result.dealRoomId || '');
        // Redirect to the deal room
        if (result.dealRoomId) {
          router.push(`/chat?room=${result.dealRoomId}`);
        }
      } else {
        setError(result.error || 'Failed to accept invitation');
        onError?.(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      const errorMessage = 'Failed to accept invitation';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!invitationCode) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-black/40 backdrop-blur-lg border border-white/10 rounded-xl p-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserGroupIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Team Invitation</h2>
        <p className="text-white/60">You've been invited to join a private deal room</p>
      </div>

      {isProcessing && !invitationInfo ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Verifying invitation...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      ) : invitationInfo ? (
        <div className="space-y-4">
          {/* Invitation Details */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">{invitationInfo.roomName}</p>
                <p className="text-white/60 text-sm">Invited by {invitationInfo.inviterName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white font-medium">Team Type: {invitationInfo.teamType.toUpperCase()}</p>
                <p className="text-white/60 text-sm">Role: {invitationInfo.role}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white/60 text-sm">
                  Expires: {invitationInfo.expiresAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={acceptInvitation}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Joining Team...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Accept Invitation</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Decline & Continue
            </button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default InvitationHandler;
