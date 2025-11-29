"use client";
import React, { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRoleFlags } from '@/lib/guards';
import { chatService } from '@/lib/chat.service';
import { RoomType, RoomCreationContext } from '@/lib/chat.types';
import { 
  X, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Megaphone, 
  FileText, 
  Settings,
  Plus,
  Search
} from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
  context?: {
    projectId?: string;
    orgId?: string;
    participants?: string[];
  };
}

export default function CreateRoomModal({ 
  isOpen, 
  onClose, 
  onRoomCreated, 
  context 
}: CreateRoomModalProps) {
  const { user } = useAuth();
  const { role } = useRoleFlags();
  const [selectedType, setSelectedType] = useState<RoomType | null>(null);
  const [roomName, setRoomName] = useState('');
  const [participants, setParticipants] = useState<string[]>(context?.participants || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Get available room types based on role
  const getAvailableRoomTypes = (): Array<{ type: RoomType; label: string; icon: any; description: string }> => {
    const roomTypes = {
      deal: { type: 'deal' as RoomType, label: 'Deal Room', icon: DollarSign, description: 'For VC investment discussions' },
      listing: { type: 'listing' as RoomType, label: 'Listing Room', icon: TrendingUp, description: 'For exchange listing coordination' },
      ido: { type: 'ido' as RoomType, label: 'IDO Room', icon: Zap, description: 'For IDO platform coordination' },
      campaign: { type: 'campaign' as RoomType, label: 'Campaign Room', icon: Megaphone, description: 'For influencer campaign management' },
      proposal: { type: 'proposal' as RoomType, label: 'Proposal Room', icon: FileText, description: 'For agency proposal discussions' },
      team: { type: 'team' as RoomType, label: 'Team Room', icon: Users, description: 'For internal team coordination' },
      ops: { type: 'ops' as RoomType, label: 'Operations Room', icon: Settings, description: 'For operational discussions' }
    };

    // Filter based on role
    switch (role) {
      case 'founder':
        return [
          roomTypes.team,
          // Other types would be created automatically when others accept/express interest
        ];
      case 'vc':
        return [roomTypes.ops];
      case 'exchange':
        return [roomTypes.ops];
      case 'ido':
        return [roomTypes.ops];
      case 'influencer':
        return []; // Campaign rooms are created by founders
      case 'agency':
        return []; // Proposal rooms are created by founders
      case 'admin':
        return Object.values(roomTypes);
      default:
        return [];
    }
  };

  const availableTypes = getAvailableRoomTypes();

  // Handle room creation
  const handleCreateRoom = async () => {
    if (!selectedType || !user) return;

    setLoading(true);
    try {
      const roomContext: RoomCreationContext = {
        type: selectedType,
        projectId: context?.projectId,
        orgId: context?.orgId,
        participants,
        metadata: {
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        }
      };

      const roomId = await chatService.createRoom(roomContext, user.uid);
      onRoomCreated(roomId);
      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  // Add participant
  const addParticipant = (userId: string) => {
    if (!participants.includes(userId)) {
      setParticipants([...participants, userId]);
    }
    setSearchQuery('');
  };

  // Remove participant
  const removeParticipant = (userId: string) => {
    setParticipants(participants.filter(id => id !== userId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Room
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Room Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Room Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-4 text-left border rounded-lg transition-colors ${
                    selectedType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Participants
            </label>
            
            {/* Search for users */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Selected participants */}
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {participants.map((userId) => (
                  <div
                    key={userId}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    <span>{userId}</span>
                    <button
                      onClick={() => removeParticipant(userId)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search results would go here */}
            {searchQuery && (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User search functionality would be implemented here
                </p>
              </div>
            )}
          </div>

          {/* Context info */}
          {context && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Room Context
              </h3>
              {context.projectId && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Project: {context.projectId}
                </p>
              )}
              {context.orgId && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Organization: {context.orgId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateRoom}
            disabled={!selectedType || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
}
