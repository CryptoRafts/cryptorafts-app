"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedButton from './ui/AnimatedButton';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot 
} from '@/lib/firebase.client';

interface HeaderChatSectionProps {
  currentUserId: string;
  userRole: string;
}

const HeaderChatSection: React.FC<HeaderChatSectionProps> = ({
  currentUserId,
  userRole
}) => {
  const router = useRouter();
  const [unreadTotal, setUnreadTotal] = useState(0);
  
  useEffect(() => {
    // Real-time unread notifications count
    if (!db) {
      return;
    }

    const notificationsRef = collection(db!, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('userId', '==', currentUserId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      setUnreadTotal(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [currentUserId]);
  
  const handleChatClick = () => {
    router.push('/messages');
  };

  return (
    <div className="relative">
      {/* Chat Button with Notification Badge */}
      <button
        onClick={handleChatClick}
        className="relative w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
      >
        <NeonCyanIcon type="chat" size={20} className="text-white" />
        {unreadTotal > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          </div>
        )}
      </button>
    </div>
  );
};

export default HeaderChatSection;
