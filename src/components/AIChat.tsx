"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { raftai } from '@/lib/raftai';
import { db } from '@/lib/firebase.client';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  timestamp: number;
  type: 'user' | 'ai';
  context?: any;
  sessionId?: string;
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  type: 'deal_room' | 'listing_room' | 'campaign_room' | 'proposal_room' | 'general';
  participants: string[];
  createdAt: number;
  lastMessageAt: number;
}

interface AIChatProps {
  sessionId?: string;
  sessionType?: string;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function AIChat({ sessionId, sessionType = 'general', onClose, isOpen = true }: AIChatProps) {
  const { user, claims } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && sessionId) {
      loadChatSession();
    }
  }, [user, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatSession = async () => {
    if (!user || !sessionId || !db) return;

    // Load chat messages
    const messagesQuery = query(
      collection(db!, 'chat_interactions'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
        .filter(msg => msg.sessionId === sessionId)
        .reverse();

      setMessages(chatMessages);
    });

    return () => unsubscribe();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      userId: user.uid,
      message: userMessage,
      response: '',
      timestamp: Date.now(),
      type: 'user'
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      // Process with RaftAI
      const aiResponse = await raftai.processChat(
        user.uid,
        userMessage,
        sessionId || 'general',
        { sessionType, userRole: claims?.role || 'user' }
      );

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        userId: 'raftai',
        message: userMessage,
        response: aiResponse,
        timestamp: Date.now(),
        type: 'ai'
      };

      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id).concat(aiMessage));
    } catch (error) {
      console.error('Error processing chat message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommand = (command: string) => {
    const commands = {
      '/summary': 'summarize',
      '/risks': 'risks',
      '/draft': 'draft',
      '/action': 'action',
      '/translate': 'translate',
      '/compliance': 'compliance'
    };

    const message = `${commands[command as keyof typeof commands] || 'help'} the current context`;
    setInputMessage(message);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl"
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">RaftAI Assistant</h3>
            <p className="text-xs text-slate-400">
              {sessionType === 'deal_room' ? 'Deal Room' :
               sessionType === 'listing_room' ? 'Listing Room' :
               sessionType === 'campaign_room' ? 'Campaign Room' :
               sessionType === 'proposal_room' ? 'Proposal Room' :
               'General Chat'}
            </p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-slate-400"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">RaftAI is thinking...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands */}
      <div className="p-4 border-t border-white/10">
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.keys({
            '/summary': 'Summarize',
            '/risks': 'Risks',
            '/draft': 'Draft',
            '/action': 'Actions',
            '/translate': 'Translate',
            '/compliance': 'Compliance'
          }).map((command) => (
            <button
              key={command}
              onClick={() => handleCommand(command)}
              className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors"
            >
              {command}
            </button>
          ))}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask RaftAI anything..."
            className="flex-1 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// Individual Chat Message Component
function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const isAI = message.type === 'ai';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {isAI && (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
      )}
      
      <div className={`max-w-[80%] ${isAI ? 'order-2' : 'order-1'}`}>
        <div className={`p-3 rounded-lg ${
          isAI 
            ? 'bg-slate-800/50 border border-white/10' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500'
        }`}>
          {isAI ? (
            <div className="text-white">
              <div className="whitespace-pre-wrap">{message.response}</div>
            </div>
          ) : (
            <div className="text-white">
              {message.message}
            </div>
          )}
        </div>
        
        <p className={`text-xs text-slate-400 mt-1 ${isAI ? 'text-left' : 'text-right'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
      
      {!isAI && (
        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 order-2">
          <span className="text-white font-bold text-sm">U</span>
        </div>
      )}
    </motion.div>
  );
}

// Chat Room Management
export function useChatRooms(userId: string) {
  const [rooms, setRooms] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !db) return;

    const roomsQuery = query(
      collection(db!, 'chat_sessions'),
      orderBy('lastMessageAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const userRooms = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChatSession))
        .filter(room => room.participants.includes(userId));

      setRooms(userRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const createRoom = async (type: string, participants: string[], title: string) => {
    if (!db) throw new Error('Database not available');
    
    const roomData: Omit<ChatSession, 'id'> = {
      userId,
      title,
      type: type as any,
      participants,
      createdAt: Date.now(),
      lastMessageAt: Date.now()
    };

    const docRef = await addDoc(collection(db!, 'chat_sessions'), roomData);
    return docRef.id;
  };

  return { rooms, loading, createRoom };
}
