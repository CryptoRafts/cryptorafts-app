"use client";

import React, { useState, useRef, useEffect } from 'react';
// Fallback SVG icon
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
import { useRouter } from 'next/navigation';

interface SearchInputProps {
  className?: string;
  placeholder?: string;
  onCommandPalette?: () => void;
}

export default function SearchInput({ 
  className = '', 
  placeholder = "Search...",
  onCommandPalette 
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onCommandPalette) {
          onCommandPalette();
        } else if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCommandPalette]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // For now, just navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused ? 'scale-105' : ''
      }`}>
        <div className="absolute left-2.5 pointer-events-none">
          <MagnifyingGlassIcon className="w-4 h-4 text-white" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full lg:w-[420px] lg:max-w-[50vw] pl-8 pr-16 py-2 bg-white/5 border border-white/10 rounded-full lg:rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 text-sm"
        />
        
        <div className="absolute right-2.5 flex items-center gap-2">
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-gray-700 rounded text-xs text-white">
            ⌘K
          </kbd>
        </div>
      </div>
    </form>
  );
}
