"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlusIcon, 
  XMarkIcon, 
  EnvelopeIcon,
  ShieldCheckIcon,
  UserIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import BlockchainCard from './ui/BlockchainCard';
import AnimatedButton from './ui/AnimatedButton';

interface MemberInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: 'admin' | 'member' | 'viewer') => Promise<void>;
  dealRoomName: string;
}

export default function MemberInviteModal({
  isOpen,
  onClose,
  onInvite,
  dealRoomName
}: MemberInviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    setError('');
    setSuccess('');

    try {
      await onInvite(email.trim(), role);
      setSuccess('Invitation sent successfully!');
      setEmail('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (error) {
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const roleDescriptions = {
    admin: 'Full access - can manage members, settings, and all chat features',
    member: 'Standard access - can send messages, share files, and participate in discussions',
    viewer: 'Read-only access - can view messages and files but cannot send messages'
  };

  const roleIcons = {
    admin: ShieldCheckIcon,
    member: UserIcon,
    viewer: EyeIcon
  };

  const roleColors = {
    admin: 'text-red-400',
    member: 'text-blue-400',
    viewer: 'text-gray-400'
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-md"
        >
          <BlockchainCard variant="glass" size="lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <UserPlusIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Invite Member</h3>
                  <p className="text-white/60 text-sm">{dealRoomName}</p>
                </div>
              </div>
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={onClose}
                icon={<XMarkIcon className="w-4 h-4" />}
              >
                Close
              </AnimatedButton>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">
                  Role
                </label>
                <div className="space-y-3">
                  {(['admin', 'member', 'viewer'] as const).map((roleOption) => {
                    const IconComponent = roleIcons[roleOption];
                    return (
                      <div
                        key={roleOption}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          role === roleOption
                            ? 'border-blue-400/50 bg-blue-500/10'
                            : 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500/50'
                        }`}
                        onClick={() => setRole(roleOption)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            role === roleOption ? 'bg-blue-500/20' : 'bg-gray-700/50'
                          }`}>
                            <IconComponent className={`w-4 h-4 ${roleColors[roleOption]}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`font-medium capitalize ${
                                role === roleOption ? 'text-white' : 'text-white/80'
                              }`}>
                                {roleOption}
                              </span>
                              {role === roleOption && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                              )}
                            </div>
                            <p className="text-white/60 text-xs mt-1">
                              {roleDescriptions[roleOption]}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  onClick={handleInvite}
                  disabled={isInviting || !email.trim()}
                  className="flex-1"
                  icon={<UserPlusIcon className="w-4 h-4" />}
                >
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  onClick={onClose}
                  disabled={isInviting}
                >
                  Cancel
                </AnimatedButton>
              </div>
            </div>
          </BlockchainCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
