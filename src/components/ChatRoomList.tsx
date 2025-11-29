"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/SimpleAuthProvider";
import { chatService } from "@/lib/chatService";
import { ChatRoom } from "@/lib/chatTypes";
import { 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";

interface ChatRoomListProps {
  onRoomSelect: (roomId: string) => void;
  selectedRoomId?: string;
}

export default function ChatRoomList({ onRoomSelect, selectedRoomId }: ChatRoomListProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Subscribe to user's rooms
  useEffect(() => {
    if (!user) {
      console.log("ChatRoomList: No user, cannot load rooms");
      setLoading(false);
      return;
    }

    console.log("ChatRoomList: Loading rooms for user:", user.uid);
    setLoading(true);
    
    const unsubscribe = chatService.subscribeToUserRooms(user.uid, (newRooms) => {
      console.log("ChatRoomList: Rooms loaded:", newRooms.length);
      setRooms(newRooms);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || room.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getRoomIcon = (type: string) => {
    switch (type) {
      case "deal":
        return "🤝";
      case "listing":
        return "📈";
      case "ido":
        return "🚀";
      case "campaign":
        return "📢";
      case "proposal":
        return "📋";
      case "team":
        return "👥";
      case "ops":
        return "⚙️";
      default:
        return "💬";
    }
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case "deal":
        return "Deal Room";
      case "listing":
        return "Listing Room";
      case "ido":
        return "IDO Room";
      case "campaign":
        return "Campaign Room";
      case "proposal":
        return "Proposal Room";
      case "team":
        return "Team Room";
      case "ops":
        return "Operations";
      default:
        return "Chat Room";
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Chat Rooms</h2>
          <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-4 h-4 text-white/40" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg text-white text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Rooms</option>
            <option value="deal">Deal Rooms</option>
            <option value="listing">Listing Rooms</option>
            <option value="ido">IDO Rooms</option>
            <option value="campaign">Campaign Rooms</option>
            <option value="proposal">Proposal Rooms</option>
            <option value="team">Team Rooms</option>
            <option value="ops">Operations</option>
          </select>
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mb-4" />
            <p className="text-center">
              {searchTerm || filterType !== "all" 
                ? "No rooms match your search" 
                : "No chat rooms yet"}
            </p>
            {!searchTerm && filterType === "all" && (
              <p className="text-sm mt-2">Start a conversation to create your first room</p>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onRoomSelect(room.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedRoomId === room.id
                    ? "bg-blue-600/20 border border-blue-500/30"
                    : "hover:bg-white/10 border border-transparent"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg">
                    {getRoomIcon(room.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium truncate">{room.name}</h3>
                      <span className="text-white/40 text-xs">
                        {formatLastActivity(room.lastActivityAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white/60 text-sm">
                        {getRoomTypeLabel(room.type)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <UserGroupIcon className="w-3 h-3 text-white/40" />
                        <span className="text-white/40 text-xs">{room.members.length}</span>
                      </div>
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
