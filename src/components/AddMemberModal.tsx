"use client";

import { useState } from "react";
import { enhancedChatService } from "@/lib/chatService.enhanced";
import { XMarkIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase.client";

interface Props {
  roomId: string;
  currentMembers: string[];
  onClose: () => void;
}

export default function AddMemberModal({ roomId, currentMembers, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!db) {
      setError("Database not available");
      setLoading(false);
      return;
    }

    try {
      // Find user by email
      const usersRef = collection(db!, 'users');
      const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("User not found with this email");
        setLoading(false);
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      if (currentMembers.includes(userId)) {
        setError("This user is already a member");
        setLoading(false);
        return;
      }

      const memberName = userData.displayName || userData.companyName || userData.email || "User";
      const memberAvatar = userData.photoURL || userData.logo || null;

      await enhancedChatService.addMember(roomId, userId, memberName, memberAvatar);

      alert(`✅ ${memberName} added to chat!`);
      onClose();
    } catch (error) {
      console.error('Error adding member:', error);
      setError("Failed to add member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal p-4">
      <div className="bg-gray-800 border border-white/20 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <UserPlusIcon className="w-6 h-6" />
            Add Team Member
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

