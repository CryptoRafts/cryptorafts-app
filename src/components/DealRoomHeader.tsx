"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface DealRoomHeaderProps {
  groupName: string;
  memberCount: number;
  activeTab: 'chat' | 'notes' | 'members' | 'milestones';
  onTabChange: (tab: 'chat' | 'notes' | 'members' | 'milestones') => void;
  onBack: () => void;
  onSearch?: (query: string) => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onRenameGroup?: (newName: string) => void;
  onAddMembers?: () => void;
  onMuteToggle?: () => void;
  onPinRoom?: () => void;
  onExportNotes?: () => void;
  onLeaveGroup?: () => void;
  isMuted?: boolean;
  isPinned?: boolean;
  callStatus?: {
    type: 'voice' | 'video' | null;
    timeRemaining: number;
  };
}

const DealRoomHeader: React.FC<DealRoomHeaderProps> = ({
  groupName,
  memberCount,
  activeTab,
  onTabChange,
  onBack,
  onSearch,
  onVoiceCall,
  onVideoCall,
  onRenameGroup,
  onAddMembers,
  onMuteToggle,
  onPinRoom,
  onExportNotes,
  onLeaveGroup,
  isMuted = false,
  isPinned = false,
  callStatus
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOverflow, setShowOverflow] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupName);

  const formatCallTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    onRenameGroup?.(newGroupName);
    setShowRename(false);
  };

  const handleLeave = () => {
    onLeaveGroup?.();
    setShowLeaveConfirm(false);
  };

  const tabs = [
    { id: 'chat', label: 'Chat', iconType: 'chat' as const },
    { id: 'notes', label: 'Note Points', iconType: 'document' as const },
    { id: 'members', label: 'Members', iconType: 'users' as const },
    { id: 'milestones', label: 'Milestones', iconType: 'flag' as const }
  ];

  return (
    <div className="bg-black/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      {/* Main Header */}
      <div className="container-perfect">
        <div className="header-perfect">
        {/* Left Cluster */}
        <div className="flex items-center space-x-3">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <NeonCyanIcon type="arrow-left" size={16} className="text-white" />
          </button>

          {/* Group Avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <NeonCyanIcon type="users" size={20} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">V</span>
            </div>
          </div>

          {/* Group Info */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <h2 className="text-white font-semibold text-sm truncate max-w-32" title={groupName}>
                {groupName}
              </h2>
              {isPinned && (
                <NeonCyanIcon type="star" size={12} className="text-yellow-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-white/60 text-xs">
              · {memberCount} members (live)
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="hidden md:flex items-center space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <NeonCyanIcon type={tab.iconType} size={16} className="text-current" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="w-1 h-1 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <NeonCyanIcon type="search" size={16} className="text-white" />
          </button>

          {/* Size Toggle */}
          <div className="hidden lg:flex items-center space-x-1 bg-white/10 rounded-lg p-1">
            <button className="px-2 py-1 text-xs text-white/60 hover:text-white rounded transition-colors">
              Small
            </button>
            <button className="px-2 py-1 text-xs bg-white/20 text-white rounded transition-colors">
              Large
            </button>
          </div>


          {/* Video Call */}
          <div className="relative">
            <button
              onClick={onVideoCall}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors group relative"
              title="Video Call (COMING SOON)"
            >
              <NeonCyanIcon type="video" size={16} className="text-white" />
            </button>
            {callStatus?.type === 'video' && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                Video • {formatCallTime(callStatus.timeRemaining)}
              </div>
            )}
            {/* Coming Soon Tooltip */}
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Video Call (COMING SOON)
            </div>
          </div>

          {/* Overflow Menu */}
          <div className="relative">
            <button
              onClick={() => setShowOverflow(!showOverflow)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <NeonCyanIcon type="ellipsis" size={16} className="text-white" />
            </button>

            {/* Overflow Menu Dropdown */}
            <AnimatePresence>
              {showOverflow && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-10 right-0 w-48 bg-black/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-50"
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowRename(true);
                        setShowOverflow(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                    >
                      <NeonCyanIcon type="document" size={16} className="text-current" />
                      <span>Rename Group</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddMembers?.();
                        setShowOverflow(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                    >
                      <NeonCyanIcon type="user-plus" size={16} className="text-current" />
                      <span>Add Members</span>
                    </button>
                    <button
                      onClick={() => {
                        onMuteToggle?.();
                        setShowOverflow(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                    >
                      {isMuted ? <NeonCyanIcon type="microphone" size={16} className="text-current" /> : <NeonCyanIcon type="microphone" size={16} className="text-current opacity-50" />}
                      <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onPinRoom?.();
                        setShowOverflow(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                    >
                      <NeonCyanIcon type="star" size={16} className="text-current" />
                      <span>Pin Room</span>
                    </button>
                    <button
                      onClick={() => {
                        onExportNotes?.();
                        setShowOverflow(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 transition-colors text-sm"
                    >
                      <NeonCyanIcon type="paper-clip" size={16} className="text-current" />
                      <span>Export Note Points</span>
                    </button>
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={() => {
                        setShowLeaveConfirm(true);
                        setShowOverflow(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                    >
                      <NeonCyanIcon type="logout" size={16} className="text-current" />
                      <span>Leave Group</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden border-t border-white/10">
        <div className="container-perfect">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <NeonCyanIcon type={tab.iconType} size={16} className="text-current" />
              <span>{tab.label}</span>
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Inline Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 px-4 py-3"
          >
            <form onSubmit={handleSearch} className="flex items-center space-x-3">
              <NeonCyanIcon type="search" size={16} className="text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent text-white placeholder-white/50 border-none outline-none text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <NeonCyanIcon type="close" size={12} className="text-white" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Rename */}
      <AnimatePresence>
        {showRename && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 px-4 py-3"
          >
            <form onSubmit={handleRename} className="flex items-center space-x-3">
              <NeonCyanIcon type="document" size={16} className="text-white/60" />
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 bg-transparent text-white border-none outline-none text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
              >
                <NeonCyanIcon type="check" size={12} className="text-current" />
              </button>
              <button
                type="button"
                onClick={() => setShowRename(false)}
                className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <NeonCyanIcon type="close" size={12} className="text-white" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Leave Confirmation */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 px-4 py-3 bg-red-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-400" />
                <span className="text-white text-sm">Are you sure you want to leave this group?</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLeave}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                >
                  Leave
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DealRoomHeader;
