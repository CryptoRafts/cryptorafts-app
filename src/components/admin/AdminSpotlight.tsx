"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { db, collection, getDocs, query, where, limit } from '@/lib/firebase.client';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  XMarkIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'user' | 'kyc' | 'kyb' | 'project' | 'dossier';
  title: string;
  subtitle: string;
  email?: string;
  status?: string;
  href?: string;
  icon: any;
  data: any;
}

export default function AdminSpotlight({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    if (!db) {
      console.error('Database not available');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const allResults: SearchResult[] = [];

    try {
      const searchLower = searchTerm.toLowerCase();

      // Search Users
      const usersSnapshot = await getDocs(collection(db!, 'users'));
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const email = data.email || data.userEmail || '';
        const displayName = data.displayName || data.fullName || data.name || '';
        const role = data.role || 'user';
        
        if (
          email.toLowerCase().includes(searchLower) ||
          displayName.toLowerCase().includes(searchLower) ||
          doc.id.toLowerCase().includes(searchLower)
        ) {
          allResults.push({
            id: doc.id,
            type: 'user',
            title: displayName || email || 'Unknown User',
            subtitle: `${email} • ${role.toUpperCase()}`,
            email,
            status: data.kycStatus || data.kybStatus || 'unknown',
            href: `/admin/users/${doc.id}`,
            icon: UserIcon,
            data
          });
        }
      });

      // Search KYC Submissions
      const kycSnapshot = await getDocs(collection(db!, 'kycSubmissions'));
      kycSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const name = data.fullName || data.kycData?.fullName || '';
        const email = data.userEmail || data.email || data.kycData?.email || '';
        
        if (
          name.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          doc.id.toLowerCase().includes(searchLower)
        ) {
          allResults.push({
            id: doc.id,
            type: 'kyc',
            title: `KYC: ${name || 'Unknown'}`,
            subtitle: email,
            email,
            status: data.status || 'pending',
            href: `/admin/kyc`,
            icon: DocumentTextIcon,
            data
          });
        }
      });

      // Search KYB Submissions
      const kybSnapshot = await getDocs(collection(db!, 'kybSubmissions'));
      kybSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const company = data.kybData?.legalName || data.companyName || data.organizationName || '';
        const email = data.userEmail || data.email || data.kybData?.email || '';
        
        if (
          company.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          doc.id.toLowerCase().includes(searchLower)
        ) {
          allResults.push({
            id: doc.id,
            type: 'kyb',
            title: `KYB: ${company || 'Unknown Business'}`,
            subtitle: email,
            email,
            status: data.status || 'pending',
            href: `/admin/kyb`,
            icon: BuildingOfficeIcon,
            data
          });
        }
      });

      // Search Projects
      const projectsSnapshot = await getDocs(collection(db!, 'projects'));
      projectsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const name = data.name || data.title || data.projectName || '';
        const description = data.description || '';
        
        if (
          name.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          doc.id.toLowerCase().includes(searchLower)
        ) {
          allResults.push({
            id: doc.id,
            type: 'project',
            title: `Project: ${name || 'Unnamed'}`,
            subtitle: description.substring(0, 60) || 'No description',
            status: data.status || 'active',
            href: `/admin/projects/${doc.id}`,
            icon: RocketLaunchIcon,
            data
          });
        }
      });

      // Sort results by relevance (exact matches first)
      allResults.sort((a, b) => {
        const aExact = a.title.toLowerCase() === searchLower || a.email?.toLowerCase() === searchLower;
        const bExact = b.title.toLowerCase() === searchLower || b.email?.toLowerCase() === searchLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      setResults(allResults.slice(0, 10)); // Limit to 10 results
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    if (result.href) {
      router.push(result.href);
    }
    onClose();
    setSearchQuery('');
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl mx-4">
        {/* Search Box */}
        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden">
          {/* Header */}
          <div className="flex items-center px-4 py-3 border-b border-white/10">
            <MagnifyingGlassIcon className="w-6 h-6 text-cyan-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, KYC, KYB, projects... (type at least 2 characters)"
              className="flex-1 bg-transparent text-white text-lg placeholder-white/40 outline-none"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-3"></div>
                <p className="text-white/60 text-sm">Searching...</p>
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="p-8 text-center">
                <MagnifyingGlassIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 text-sm">Type at least 2 characters to search</p>
                <p className="text-white/40 text-xs mt-2">
                  Search across users, KYC, KYB, projects, and more
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <XMarkIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 text-sm">No results found</p>
                <p className="text-white/40 text-xs mt-2">
                  Try searching with different keywords
                </p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((result, index) => {
                  const Icon = result.icon;
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-150 ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-lg'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          result.type === 'user' ? 'bg-purple-500/20' :
                          result.type === 'kyc' ? 'bg-blue-500/20' :
                          result.type === 'kyb' ? 'bg-green-500/20' :
                          'bg-orange-500/20'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            result.type === 'user' ? 'text-purple-400' :
                            result.type === 'kyc' ? 'text-blue-400' :
                            result.type === 'kyb' ? 'text-green-400' :
                            'text-orange-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold truncate">
                              {result.title}
                            </h3>
                            {result.status && (
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${getStatusColor(result.status)}`}>
                                {result.status}
                              </span>
                            )}
                          </div>
                          <p className="text-white/60 text-sm truncate">
                            {result.subtitle}
                          </p>
                        </div>

                        <div className="text-white/40 text-xs uppercase font-semibold px-2 py-1 bg-white/5 rounded">
                          {result.type}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded">↑</kbd>
                  <kbd className="px-2 py-1 bg-white/10 rounded">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd>
                  Close
                </span>
              </div>
              <span>{results.length} results</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

