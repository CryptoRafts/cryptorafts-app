"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleNavigation } from '@/hooks/useSimpleNavigation';
import { useSimpleRoleFlags } from '@/lib/simple-guards';
// Fallback SVG icons
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CommandLineIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

interface CommandItem {
  id: string;
  label: string;
  href: string;
  category: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

// Internal component that handles the actual command palette logic
function CommandPaletteContent({ onClose, isOpen }: { onClose: () => void; isOpen: boolean }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { publicItems, roleItems, isAuthed, userRole } = useSimpleNavigation();
  const { isFounder, isVC, isExchange, isIDO, isInfluencer, isAgency } = useSimpleRoleFlags();

  // Build command list based on role and navigation using useMemo to prevent infinite loops
  const commands = useMemo(() => {
    const allCommands: CommandItem[] = [];

    // Public commands
    if (publicItems && Array.isArray(publicItems)) {
      publicItems.forEach(item => {
        allCommands.push({
          id: `public-${item.href}`,
          label: item.label,
          href: item.href,
          category: 'Public',
          shortcut: item.label === 'Pitch Your Project' ? 'P' : undefined
        });
      });
    }

    // Role-specific commands
    if (roleItems && roleItems.primary) {
      allCommands.push({
        id: `role-${roleItems.primary.href}`,
        label: roleItems.primary.label,
        href: roleItems.primary.href,
        category: 'Your Portal'
      });

      if (roleItems.submenu && Array.isArray(roleItems.submenu)) {
        roleItems.submenu.forEach(item => {
          allCommands.push({
            id: `role-${item.href}`,
            label: item.label,
            href: item.href,
            category: 'Your Portal'
          });
        });
      }
    }

    // Quick actions based on role
    if (isFounder) {
      allCommands.push({
        id: 'quick-pitch',
        label: 'Create New Pitch',
        href: '/founder/pitch',
        category: 'Quick Actions',
        shortcut: 'P'
      });
    }

    if (isVC) {
      allCommands.push({
        id: 'quick-dealflow',
        label: 'View Dealflow',
        href: '/vc/dealflow',
        category: 'Quick Actions'
      });
    }

    // Support shortcut
    allCommands.push({
      id: 'support',
      label: 'Support',
      href: '/support',
      category: 'Quick Actions',
      shortcut: 'S'
    });

    return allCommands;
  }, [publicItems, roleItems, isFounder, isVC]);

  // Filter commands based on query - memoized to prevent infinite re-renders
  const filteredCommands = useMemo(() => {
    return commands.filter(command =>
      command.label.toLowerCase().includes(query.toLowerCase()) ||
      command.href.toLowerCase().includes(query.toLowerCase())
    );
  }, [commands, query]);

  // Group commands by category - memoized to prevent infinite re-renders
  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce((acc, command) => {
      if (!acc[command.category]) {
        acc[command.category] = [];
      }
      acc[command.category].push(command);
      return acc;
    }, {} as Record<string, CommandItem[]>);
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleCommandSelect(filteredCommands[selectedIndex]);
        }
        return;
      }

      // Quick shortcuts
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const pitchCommand = commands.find(c => c.shortcut === 'P');
        if (pitchCommand) {
          handleCommandSelect(pitchCommand);
        }
        return;
      }

      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const supportCommand = commands.find(c => c.shortcut === 'S');
        if (supportCommand) {
          handleCommandSelect(supportCommand);
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, commands, onClose]);

  // Focus input when opened
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleCommandSelect = useCallback((command: CommandItem) => {
    router.push(command.href);
    onClose();
  }, [router, onClose]);

  return (
    <div className="fixed inset-0 z-[50] flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40]"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[50]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <MagnifyingGlassIcon className="w-5 h-5 text-white/60" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, pages, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/60 outline-none"
          />
          <div className="flex items-center gap-2 text-xs text-white/40">
            <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘K</kbd>
            <span>to open</span>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-white/60">
              <CommandLineIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category} className="py-2">
                <div className="px-4 py-1 text-xs font-semibold text-white/60 uppercase tracking-wider">
                  {category}
                </div>
                {categoryCommands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={command.id}
                      onClick={() => handleCommandSelect(command)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors duration-150 ${
                        isSelected 
                          ? 'bg-blue-500/20 text-white' 
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{command.label}</span>
                        {command.shortcut && (
                          <span className="text-xs text-white/40">({command.shortcut})</span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 font-mono">
                        {command.href}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 text-xs text-white/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">⌘P</kbd>
              <span>Pitch</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">⌘S</kbd>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that conditionally renders the content
export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  if (!isOpen) {
    return null;
  }

  return <CommandPaletteContent onClose={onClose} isOpen={isOpen} />;
}
