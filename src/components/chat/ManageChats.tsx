"use client";

import { useState } from "react";
import type { ChatRoom } from "@/lib/chat/types";
import { 
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArchiveBoxIcon,
  PencilIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

interface ManageChatsProps {
  rooms: ChatRoom[];
}

export default function ManageChats({ rooms }: ManageChatsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [counterpartFilter, setCounterpartFilter] = useState<string>("all");

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    const matchesCounterpart = counterpartFilter === "all" || room.counterpartRole === counterpartFilter;
    return matchesSearch && matchesStatus && matchesCounterpart;
  });

  // Group by counterpart type
  const groupedRooms = filteredRooms.reduce((acc, room) => {
    const key = room.counterpartRole;
    if (!acc[key]) acc[key] = [];
    acc[key].push(room);
    return acc;
  }, {} as Record<string, ChatRoom[]>);

  const getRoleLabel = (role: string) => {
    const labels = {
      vc: 'VCs',
      exchange: 'Exchanges',
      ido: 'IDO Platforms',
      influencer: 'Influencers',
      agency: 'Agencies'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      vc: '💼',
      exchange: '🏦',
      ido: '🚀',
      influencer: '📱',
      agency: '🎨'
    };
    return icons[role as keyof typeof icons] || '💬';
  };

  const exportNotePoints = async (roomId: string) => {
    // TODO: Implement note points export
    alert('Export feature coming soon!');
  };

  const archiveRoom = async (roomId: string) => {
    if (confirm('Archive this room?')) {
      // TODO: Implement archive
      alert('Archive feature coming soon!');
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-7 h-7" />
          Manage Chats
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Counterpart filter */}
          <select
            value={counterpartFilter}
            onChange={(e) => setCounterpartFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Counterparts</option>
            <option value="vc">VCs</option>
            <option value="exchange">Exchanges</option>
            <option value="ido">IDO Platforms</option>
            <option value="influencer">Influencers</option>
            <option value="agency">Agencies</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Rooms by Counterpart Type */}
      <div className="flex-1 overflow-y-auto p-6">
        {Object.keys(groupedRooms).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60">
            <ChatBubbleLeftRightIcon className="w-20 h-20 mb-4 opacity-40" />
            <p className="text-lg font-medium mb-2">No rooms found</p>
            <p className="text-sm opacity-75">
              Rooms will appear here when created
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRooms).map(([role, roleRooms]) => (
              <div key={role}>
                {/* Section header */}
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <span className="text-2xl">{getRoleIcon(role)}</span>
                  {getRoleLabel(role)}
                  <span className="text-white/40 text-sm">({roleRooms.length})</span>
                </h3>

                {/* Rooms table */}
                <div className="space-y-2">
                  {roleRooms.map(room => (
                    <div
                      key={room.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Room info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-medium">{room.name}</h4>
                            {room.status === 'archived' && (
                              <span className="px-2 py-0.5 bg-gray-600 text-white text-xs rounded">
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <span><UserGroupIcon className="w-4 h-4 inline mr-1" />{room.members.length} members</span>
                            {room.pinnedMessages.length > 0 && (
                              <span>📌 {room.pinnedMessages.length} pinned</span>
                            )}
                            <span className="capitalize">{room.type}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => window.location.href = `/messages?room=${room.id}`}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Open
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => exportNotePoints(room.id)}
                              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                              title="Export Note Points"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => archiveRoom(room.id)}
                              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                              title="Archive"
                            >
                              <ArchiveBoxIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* RaftAI Memory Summary */}
                      {room.raftaiMemory && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="grid grid-cols-3 gap-3 text-center text-xs">
                            <div>
                              <div className="text-blue-400 font-medium">
                                {room.raftaiMemory.decisions.length}
                              </div>
                              <div className="text-white/60">Decisions</div>
                            </div>
                            <div>
                              <div className="text-green-400 font-medium">
                                {room.raftaiMemory.tasks.length}
                              </div>
                              <div className="text-white/60">Tasks</div>
                            </div>
                            <div>
                              <div className="text-purple-400 font-medium">
                                {room.raftaiMemory.milestones.length}
                              </div>
                              <div className="text-white/60">Milestones</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

