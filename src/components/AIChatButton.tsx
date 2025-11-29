"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRoleFlags } from '@/lib/guards';
import { usePathname } from 'next/navigation';
import { raftAIService } from '@/lib/raftai.service';
// import SkeletonLoader from './SkeletonLoader'; // Temporarily disabled
// Fallback SVG icons in case Heroicons fails to load
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ChatBubbleLeftRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

interface AIChatButtonProps {
  className?: string;
}

export default function AIChatButton({ className = '' }: AIChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, role, isAuthed, isFounder, isVC, isExchange, isIDO, isInfluencer, isAgency } = useRoleFlags();
  const pathname = usePathname();

  const getContextualPrompt = () => {
    if (!isAuthed) {
      return "Welcome to Cryptorafts! I'm RaftAI, your crypto ecosystem assistant. How can I help you get started?";
    }

    const baseContext = `You are RaftAI, the AI assistant for Cryptorafts. The user is a ${role} in the crypto ecosystem.`;
    
    switch (role) {
      case 'founder':
        return `${baseContext} Help them with project development, fundraising, tokenomics, and connecting with VCs. Current page: ${pathname}`;
      case 'vc':
        return `${baseContext} Help them with deal flow analysis, due diligence, portfolio management, and market insights. Current page: ${pathname}`;
      case 'exchange':
        return `${baseContext} Help them with listing processes, compliance, market making, and exchange operations. Current page: ${pathname}`;
      case 'ido':
        return `${baseContext} Help them with IDO launches, token sales, marketing strategies, and investor relations. Current page: ${pathname}`;
      case 'influencer':
        return `${baseContext} Help them with content creation, campaign management, audience engagement, and monetization. Current page: ${pathname}`;
      case 'agency':
        return `${baseContext} Help them with marketing campaigns, client management, service delivery, and business development. Current page: ${pathname}`;
      default:
        return `${baseContext} Help them navigate the crypto ecosystem and understand available opportunities. Current page: ${pathname}`;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpenChat = () => {
    setIsOpen(true);
    // Add welcome message if no messages exist
    if (messages.length === 0) {
      setMessages([{
        id: Date.now(),
        type: 'ai',
        message: getContextualPrompt(),
        timestamp: new Date()
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await raftAIService.chat(user?.uid || 'anonymous', inputMessage, {
        role,
        pathname,
        timestamp: new Date().toISOString()
      });

      if (response.success && response.result) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          message: response.result.message || response.result,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'ai',
          message: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getButtonLabel = () => {
    if (!isAuthed) return 'AI Assistant';
    
    switch (role) {
      case 'founder': return 'AI Insights';
      case 'vc': return 'Deal Analysis';
      case 'exchange': return 'Market AI';
      case 'ido': return 'Launch AI';
      case 'influencer': return 'Content AI';
      case 'agency': return 'Campaign AI';
      default: return 'RaftAI';
    }
  };

  const getButtonIcon = () => {
    if (isFounder) return <SparklesIcon className="w-4 h-4" />;
    return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
  };

  return (
    <>
      <button
        onClick={handleOpenChat}
        className={`btn btn-primary px-4 py-2 text-sm ${className}`}
        aria-label={`Open ${getButtonLabel()}`}
      >
        {getButtonIcon()}
        <span className="hidden sm:inline">{getButtonLabel()}</span>
        <span className="sm:hidden">AI</span>
      </button>

      {/* AI Chat Modal - Placeholder */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-2xl h-96 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{getButtonLabel()}</h3>
                  <p className="text-sm text-white/60">Powered by RaftAI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white/90'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-white/90 p-3 rounded-lg">
                      <div className="animate-pulse bg-white/10 rounded h-4 w-32"></div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about crypto, deals, or the platform..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="btn btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <SparklesIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>Press Esc to close</span>
                <span>RaftAI v1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
