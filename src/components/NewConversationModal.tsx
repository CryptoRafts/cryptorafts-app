"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserGroupIcon, 
  UserPlusIcon, 
  ChatBubbleLeftRightIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: () => void;
  onAddContact: () => void;
  onCreateDealRoom: () => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  onAddContact,
  onCreateDealRoom
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (option: string, action: () => void) => {
    setSelectedOption(option);
    setTimeout(() => {
      action();
      onClose();
      setSelectedOption(null);
    }, 200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">New Conversation</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* New Group */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionSelect('group', onCreateGroup)}
                disabled={selectedOption === 'group'}
                className="w-full flex items-center space-x-4 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">New Group</h3>
                  <p className="text-white/60 text-sm">Create a group chat with multiple members</p>
                </div>
              </motion.button>

              {/* Add Contact */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionSelect('contact', onAddContact)}
                disabled={selectedOption === 'contact'}
                className="w-full flex items-center space-x-4 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <UserPlusIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">Add Contact</h3>
                  <p className="text-white/60 text-sm">Start a conversation with a new contact</p>
                </div>
              </motion.button>

              {/* New Deal Room */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionSelect('dealroom', onCreateDealRoom)}
                disabled={selectedOption === 'dealroom'}
                className="w-full flex items-center space-x-4 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">New Deal Room</h3>
                  <p className="text-white/60 text-sm">Create a professional deal room for business discussions</p>
                </div>
              </motion.button>
            </div>

            {/* Loading State */}
            {selectedOption && (
              <div className="mt-4 text-center">
                <div className="text-white/60 text-sm">Creating {selectedOption}...</div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewConversationModal;
