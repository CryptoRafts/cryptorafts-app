"use client";

import { useState } from "react";
import type { ChatRoom } from "@/lib/chatService.enhanced";
import { MagnifyingGlassIcon, FunnelIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface Props {
  rooms: ChatRoom[];
  currentUserId: string;
  selectedRoomId?: string;
  onRoomSelect: (room: ChatRoom) => void;
}

export default function ChatRoomListProduction({ rooms, currentUserId, selectedRoomId, onRoomSelect }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredRooms = rooms.filter(room => {
    const roomName = room.name || 'Unnamed Room';
    const matchesSearch = roomName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || room.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getRoomIcon = (type: string) => {
    const icons = { deal: '🤝', listing: '📈', ido: '🚀', campaign: '📢', group: '👥', support: '🆘' };
    return icons[type as keyof typeof icons] || '💬';
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp.toDate?.() || new Date();
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white mb-3">Chats</h2>
        
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-white/40" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Rooms</option>
            <option value="deal">Deal Rooms</option>
            <option value="listing">Listings</option>
            <option value="ido">IDO Rooms</option>
            <option value="campaign">Campaigns</option>
            <option value="group">Groups</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60 p-8">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-center font-medium mb-1">
              {searchTerm || filterType !== "all" ? "No rooms match your search" : "No chats yet"}
            </p>
            <p className="text-sm text-center opacity-75 mt-1">
              Your chat rooms will appear here
            </p>
          </div>
        ) : (
          <div>
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onRoomSelect(room)}
                className={`p-3 cursor-pointer transition-all border-b border-white/5 hover:bg-white/10 ${
                  selectedRoomId === room.id ? "bg-blue-600/20 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl">
                      {room.founderLogo ? (
                        <img src={room.founderLogo} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        getRoomIcon(room.type)
                      )}
                    </div>
                    {room.counterpartLogo && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-gray-900 overflow-hidden">
                        <img src={room.counterpartLogo} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="text-white font-medium truncate text-sm">{room.name}</h3>
                      <div className="flex items-center gap-2">
                        {/* Unread Count Badge */}
                        {room.unreadCount && room.unreadCount[currentUserId] > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            {room.unreadCount[currentUserId]}
                          </span>
                        )}
                        <span className="text-white/40 text-xs flex-shrink-0">
                          {formatTime(room.lastActivityAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-xs capitalize">{room.type}</span>
                      {room.pinnedMessages?.length > 0 && (
                        <span className="text-white/40 text-xs">📌 {room.pinnedMessages.length}</span>
                      )}
                      {room.mutedBy?.includes(currentUserId) && (
                        <span className="text-white/40 text-xs">🔕</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

