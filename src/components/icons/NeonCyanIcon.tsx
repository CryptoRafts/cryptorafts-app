'use client';

import React from 'react';

interface NeonCyanIconProps {
  type: 'bell' | 'home' | 'features' | 'blog' | 'contact' | 'dealflow' | 'dashboard' | 'portfolio' | 'pipeline' | 'messages' | 'team' | 'settings' | 'user' | 'menu' | 'close' | 'phone' | 'document' | 'chart' | 'info' | 'rocket' | 'building' | 'briefcase' | 'megaphone' | 'globe' | 'dollar' | 'shield' | 'cog' | 'chat' | 'logout' | 'analytics' | 'campaigns' | 'clients' | 'listings' | 'launchpad' | 'earnings' | 'search' | 'arrow-left' | 'arrow-right' | 'arrow-up' | 'arrow-down' | 'check' | 'x-circle' | 'calendar' | 'users' | 'exclamation' | 'video' | 'code' | 'clock' | 'eye' | 'star' | 'bolt' | 'cpu' | 'envelope' | 'credit-card' | 'sparkles' | 'chevron-down' | 'user-circle' | 'command' | 'paper-airplane' | 'paper-clip' | 'microphone' | 'smile' | 'ellipsis' | 'user-plus' | 'photo' | 'bell-slash' | 'flag' | 'tag' | 'lightbulb' | 'funnel' | 'plus' | 'robot' | 'play' | 'pause' | 'download' | 'link' | 'stop' | 'upload' | 'user-minus';
  className?: string;
  size?: number;
}

/**
 * Neon Cyan Icon Component
 * Creates unified neon-cyan cyber theme icons with glowing outlines
 * Clean icon shapes without circular rings/borders
 */
export const NeonCyanIcon: React.FC<NeonCyanIconProps> = ({ 
  type, 
  className = '', 
  size = 24
}) => {
  // Neon cyan color palette - Nemo Blue theme
  const baseColor = '#06b6d4'; // cyan-500 - main color
  const nodeColor = '#22d3ee'; // cyan-400 - bright nodes
  const lineColor = '#67e8f9'; // cyan-300 - connection lines
  const softCyan = '#a5f3fc'; // cyan-200 - subtle particles
  
  // Simple icon wrapper - no rings, no background glow
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Icon content - centered and properly sized */}
      {children}
    </svg>
  );

  const icons: Record<string, JSX.Element> = {
    // Bell: Notification bell matching the reference image exactly
    bell: (
      <IconWrapper>
        {/* Bell shape - rounded top, tapering sides, matching reference */}
        <path d="M12 3C10.5 3 9 3.5 8.5 4.5C8 5.5 7.5 6.5 7.5 8V11C7.5 12 7 13 6.5 14L5.5 16C5 17 5.5 18 6.5 18H17.5C18.5 18 19 17 18.5 16L17.5 14C17 13 16.5 12 16.5 11V8C16.5 6.5 16 5.5 15.5 4.5C15 3.5 13.5 3 12 3Z" 
          stroke={nodeColor} strokeWidth="1.8" fill="none" opacity="0.95"/>
        {/* Clapper - small circular clapper at the bottom */}
        <circle cx="12" cy="15" r="1.2" fill={nodeColor} opacity="0.9"/>
        {/* Handle - rounded top arch */}
        <path d="M10 3.5C10 3.5 10.5 3 11.5 3H12.5C13.5 3 14 3.5 14 3.5" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Home: House icon
    home: (
      <IconWrapper>
        <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5 5.5 21 6 21H9V16C9 15.5 9.5 15 10 15H14C14.5 15 15 15.5 15 16V21H18C18.5 21 19 20.5 19 20V10M19 10L21 12" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Features/Info: Information circle
    features: (
      <IconWrapper>
        <circle cx="12" cy="12" r="8" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="8" r="1" fill={nodeColor} opacity="0.9"/>
        <path d="M12 11V16" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Blog: Document icon
    blog: (
      <IconWrapper>
        <path d="M14 2H6C5.5 2 5 2.5 5 3V21C5 21.5 5.5 22 6 22H18C18.5 22 19 21.5 19 21V8L14 2Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M14 2V8H19" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
        <line x1="8" y1="16" x2="16" y2="16" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
        <line x1="8" y1="20" x2="12" y2="20" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
      </IconWrapper>
    ),
    // Contact: Phone icon
    phone: (
      <IconWrapper>
        <path d="M3 5C3 4 4 3 5 3H8C9 3 10 4 10 5V7C10 8 9 9 8 9H7C6 9 5 10 5 11C5 12 6 13 7 13H9C10 13 11 14 11 15V18C11 19 10 20 9 20H5C4 20 3 19 3 18V5Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Dealflow: Bar chart icon
    dealflow: (
      <IconWrapper>
        <line x1="6" y1="18" x2="6" y2="12" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="10" y1="18" x2="10" y2="8" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="14" y1="18" x2="14" y2="6" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="18" y1="18" x2="18" y2="10" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="5" y1="18" x2="19" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
      </IconWrapper>
    ),
    // Dashboard: Grid/analytics icon
    dashboard: (
      <IconWrapper>
        <rect x="4" y="4" width="6" height="6" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <rect x="14" y="4" width="6" height="6" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <rect x="4" y="14" width="6" height="6" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <rect x="14" y="14" width="6" height="6" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Portfolio: Briefcase icon
    portfolio: (
      <IconWrapper>
        <path d="M4 8C4 7 5 6 6 6H18C19 6 20 7 20 8V19C20 20 19 21 18 21H6C5 21 4 20 4 19V8Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M4 10H20" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
        <path d="M9 6V4C9 3 10 2 11 2H13C14 2 15 3 15 4V6" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Pipeline: Flow chart icon
    pipeline: (
      <IconWrapper>
        <circle cx="6" cy="6" r="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="18" cy="6" r="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="6" cy="18" r="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="18" cy="18" r="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="12" r="2.5" fill={nodeColor} opacity="0.9"/>
        <line x1="8" y1="6" x2="9.5" y2="10" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="14.5" y1="10" x2="16" y2="6" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="8" y1="18" x2="9.5" y2="14" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="14.5" y1="14" x2="16" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
      </IconWrapper>
    ),
    // Messages: Chat bubble icon
    messages: (
      <IconWrapper>
        <path d="M8 4H16C17.5 4 18.5 5 18.5 6.5V13.5C18.5 15 17.5 16 16 16H12L8 20V16C6.5 16 5.5 15 5.5 13.5V6.5C5.5 5 6.5 4 8 4Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="10" cy="9" r="1" fill={nodeColor} opacity="0.8"/>
        <circle cx="12" cy="9" r="1" fill={nodeColor} opacity="0.8"/>
        <circle cx="14" cy="9" r="1" fill={nodeColor} opacity="0.8"/>
      </IconWrapper>
    ),
    // Team: Users/group icon
    team: (
      <IconWrapper>
        <circle cx="9" cy="8" r="2.5" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="15" cy="8" r="2.5" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M5 16C5 14 6 13 8 13H16C18 13 19 14 19 16" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="5" r="1.5" fill={nodeColor} opacity="0.9"/>
        <path d="M8 12C8 11 9 10 10 10H14C15 10 16 11 16 12" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
      </IconWrapper>
    ),
    // Settings: Gear icon
    settings: (
      <IconWrapper>
        <circle cx="12" cy="12" r="4" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.9"/>
        <path d="M12 2V4M12 20V22M22 12H20M4 12H2M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" 
          stroke={nodeColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
      </IconWrapper>
    ),
    // User: User icon
    user: (
      <IconWrapper>
        <circle cx="12" cy="8" r="3" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M6 20C6 17 8 15 11 15H13C16 15 18 17 18 20" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Menu: Hamburger menu
    menu: (
      <IconWrapper>
        <line x1="4" y1="6" x2="20" y2="6" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
        <line x1="4" y1="12" x2="20" y2="12" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
        <line x1="4" y1="18" x2="20" y2="18" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Close: X icon
    close: (
      <IconWrapper>
        <line x1="6" y1="6" x2="18" y2="18" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
        <line x1="18" y1="6" x2="6" y2="18" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Document: Document icon
    document: (
      <IconWrapper>
        <path d="M14 2H6C5.5 2 5 2.5 5 3V21C5 21.5 5.5 22 6 22H18C18.5 22 19 21.5 19 21V8L14 2Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M14 2V8H19" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Chart: Chart icon
    chart: (
      <IconWrapper>
        <line x1="6" y1="18" x2="6" y2="12" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="10" y1="18" x2="10" y2="8" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="14" y1="18" x2="14" y2="6" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="18" y1="18" x2="18" y2="10" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="5" y1="18" x2="19" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
      </IconWrapper>
    ),
    // Info: Information icon
    info: (
      <IconWrapper>
        <circle cx="12" cy="12" r="8" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="8" r="1" fill={nodeColor} opacity="0.9"/>
        <path d="M12 11V16" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Rocket: Rocket icon
    rocket: (
      <IconWrapper>
        <path d="M4.5 16.5C4.5 13 6 10 8.5 8L12 4.5L15.5 8C18 10 19.5 13 19.5 16.5C19.5 18 18.5 19 17 19.5L16 20.5L15 19.5H9L8 20.5L7 19.5C5.5 19 4.5 18 4.5 16.5Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.9"/>
      </IconWrapper>
    ),
    // Building: Building icon
    building: (
      <IconWrapper>
        <path d="M4 21V7C4 6 5 5 6 5H18C19 5 20 6 20 7V21" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M9 9H11M9 13H11M9 17H11M13 9H15M13 13H15M13 17H15" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
        <path d="M4 21H20" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
      </IconWrapper>
    ),
    // Briefcase: Briefcase icon
    briefcase: (
      <IconWrapper>
        <path d="M4 8C4 7 5 6 6 6H18C19 6 20 7 20 8V19C20 20 19 21 18 21H6C5 21 4 20 4 19V8Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M4 10H20" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
        <path d="M9 6V4C9 3 10 2 11 2H13C14 2 15 3 15 4V6" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Megaphone: Megaphone icon
    megaphone: (
      <IconWrapper>
        <path d="M6 8L4 12L6 16V8Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M6 10L16 6L16 18L6 14" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M16 8C17 8 18 9 18 10" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
        <path d="M16 14C17 14 18 15 18 16" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
      </IconWrapper>
    ),
    // Globe: Globe icon
    globe: (
      <IconWrapper>
        <circle cx="12" cy="12" r="8" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M4 12H20M12 4C14 6 15 9 15 12C15 15 14 18 12 20C10 18 9 15 9 12C9 9 10 6 12 4Z" 
          stroke={lineColor} strokeWidth="1" opacity="0.6"/>
      </IconWrapper>
    ),
    // Dollar: Dollar icon
    dollar: (
      <IconWrapper>
        <path d="M12 2V22M9 6C9 5 10 4 12 4C14 4 15 5 15 6C15 7 14 8 12 8M12 16C14 16 15 17 15 18C15 19 14 20 12 20C10 20 9 19 9 18" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Shield: Shield icon
    shield: (
      <IconWrapper>
        <path d="M12 2L4 5V11C4 16 8 20 12 22C16 20 20 16 20 11V5L12 2Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M9 12L11 14L15 10" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Cog: Settings gear
    cog: (
      <IconWrapper>
        <circle cx="12" cy="12" r="4" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.9"/>
        <path d="M12 2V4M12 20V22M22 12H20M4 12H2M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" 
          stroke={nodeColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
      </IconWrapper>
    ),
    // Chat: Chat bubble
    chat: (
      <IconWrapper>
        <path d="M8 4H16C17.5 4 18.5 5 18.5 6.5V13.5C18.5 15 17.5 16 16 16H12L8 20V16C6.5 16 5.5 15 5.5 13.5V6.5C5.5 5 6.5 4 8 4Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="10" cy="9" r="1" fill={nodeColor} opacity="0.8"/>
        <circle cx="12" cy="9" r="1" fill={nodeColor} opacity="0.8"/>
        <circle cx="14" cy="9" r="1" fill={nodeColor} opacity="0.8"/>
      </IconWrapper>
    ),
    // Logout: Exit icon
    logout: (
      <IconWrapper>
        <path d="M9 21H5C4 21 3 20 3 19V5C3 4 4 3 5 3H9" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M16 17L21 12L16 7" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        <path d="M21 12H9" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Analytics: Analytics icon
    analytics: (
      <IconWrapper>
        <line x1="6" y1="18" x2="6" y2="12" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="10" y1="18" x2="10" y2="8" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="14" y1="18" x2="14" y2="6" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="18" y1="18" x2="18" y2="10" stroke={nodeColor} strokeWidth="2" opacity="0.9"/>
        <line x1="5" y1="18" x2="19" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
      </IconWrapper>
    ),
    // Campaigns: Same as megaphone
    campaigns: (
      <IconWrapper>
        <path d="M6 8L4 12L6 16V8Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M6 10L16 6L16 18L6 14" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M16 8C17 8 18 9 18 10" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
        <path d="M16 14C17 14 18 15 18 16" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
      </IconWrapper>
    ),
    // Clients: Same as team
    clients: (
      <IconWrapper>
        <circle cx="9" cy="8" r="2.5" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="15" cy="8" r="2.5" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M5 16C5 14 6 13 8 13H16C18 13 19 14 19 16" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="5" r="1.5" fill={nodeColor} opacity="0.9"/>
        <path d="M8 12C8 11 9 10 10 10H14C15 10 16 11 16 12" stroke={lineColor} strokeWidth="1" opacity="0.6"/>
      </IconWrapper>
    ),
    // Listings: Same as globe
    listings: (
      <IconWrapper>
        <circle cx="12" cy="12" r="8" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M4 12H20M12 4C14 6 15 9 15 12C15 15 14 18 12 20C10 18 9 15 9 12C9 9 10 6 12 4Z" 
          stroke={lineColor} strokeWidth="1" opacity="0.6"/>
      </IconWrapper>
    ),
    // Launchpad: Same as rocket
    launchpad: (
      <IconWrapper>
        <path d="M4.5 16.5C4.5 13 6 10 8.5 8L12 4.5L15.5 8C18 10 19.5 13 19.5 16.5C19.5 18 18.5 19 17 19.5L16 20.5L15 19.5H9L8 20.5L7 19.5C5.5 19 4.5 18 4.5 16.5Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.9"/>
      </IconWrapper>
    ),
    // Earnings: Same as dollar
    earnings: (
      <IconWrapper>
        <path d="M12 2V22M9 6C9 5 10 4 12 4C14 4 15 5 15 6C15 7 14 8 12 8M12 16C14 16 15 17 15 18C15 19 14 20 12 20C10 20 9 19 9 18" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Search: Magnifying glass
    search: (
      <IconWrapper>
        <circle cx="11" cy="11" r="7" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M17 17L21 21" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Arrow Left
    'arrow-left': (
      <IconWrapper>
        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Arrow Right
    'arrow-right': (
      <IconWrapper>
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Arrow Up
    'arrow-up': (
      <IconWrapper>
        <path d="M12 19V5M12 5L19 12M12 5L5 12" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Arrow Down
    'arrow-down': (
      <IconWrapper>
        <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Check: Checkmark
    check: (
      <IconWrapper>
        <path d="M20 6L9 17L4 12" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // X Circle: X in circle
    'x-circle': (
      <IconWrapper>
        <circle cx="12" cy="12" r="9" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M9 9L15 15M15 9L9 15" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Calendar
    calendar: (
      <IconWrapper>
        <rect x="4" y="5" width="16" height="16" rx="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M4 9H20" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
        <path d="M8 5V3M16 5V3" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
      </IconWrapper>
    ),
    // Users: Multiple users
    users: (
      <IconWrapper>
        <circle cx="9" cy="7" r="4" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M3 21C3 17 5 15 9 15C13 15 15 17 15 21" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="17" cy="7" r="4" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M21 21C21 17 19 15 15 15" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Exclamation: Warning triangle
    exclamation: (
      <IconWrapper>
        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Video: Video camera
    video: (
      <IconWrapper>
        <path d="M15 10L20.553 7.276C20.833 7.107 21 6.802 21 6.5V17.5C21 17.198 20.833 16.893 20.553 16.724L15 14V10Z" stroke={nodeColor} strokeWidth="1.5" strokeLinejoin="round" opacity="0.9"/>
        <rect x="3" y="6" width="12" height="12" rx="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Code: Code brackets
    code: (
      <IconWrapper>
        <path d="M16 18L22 12L16 6M8 6L2 12L8 18" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Clock: Clock icon
    clock: (
      <IconWrapper>
        <circle cx="12" cy="12" r="9" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M12 6V12L16 14" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Eye: Eye icon
    eye: (
      <IconWrapper>
        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="12" r="3" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Star: Star icon
    star: (
      <IconWrapper>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Bolt: Lightning bolt
    bolt: (
      <IconWrapper>
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // CPU: CPU chip
    cpu: (
      <IconWrapper>
        <rect x="4" y="4" width="16" height="16" rx="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <rect x="9" y="9" width="6" height="6" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M9 1V4M15 1V4M9 20V23M15 20V23M1 9H4M1 15H4M20 9H23M20 15H23" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Envelope: Mail icon
    envelope: (
      <IconWrapper>
        <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Credit Card
    'credit-card': (
      <IconWrapper>
        <rect x="3" y="6" width="18" height="12" rx="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M3 10H21" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
        <path d="M7 14H10" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
      </IconWrapper>
    ),
    // Sparkles: Sparkle icon
    sparkles: (
      <IconWrapper>
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="6" cy="4" r="1.5" fill={nodeColor} opacity="0.9"/>
        <circle cx="18" cy="16" r="1.5" fill={nodeColor} opacity="0.9"/>
      </IconWrapper>
    ),
    // Chevron Down
    'chevron-down': (
      <IconWrapper>
        <path d="M6 9L12 15L18 9" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // User Circle
    'user-circle': (
      <IconWrapper>
        <circle cx="12" cy="12" r="9" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="12" cy="9" r="3" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M6 20C6 17 8 15 11 15H13C16 15 18 17 18 20" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Command: Command key
    command: (
      <IconWrapper>
        <path d="M6 6C6 4.89543 6.89543 4 8 4H10C11.1046 4 12 4.89543 12 6V8C12 9.10457 11.1046 10 10 10H8C6.89543 10 6 9.10457 6 8V6Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M12 6C12 4.89543 12.8954 4 14 4H16C17.1046 4 18 4.89543 18 6V8C18 9.10457 17.1046 10 16 10H14C12.8954 10 12 9.10457 12 8V6Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M6 14C6 12.8954 6.89543 12 8 12H10C11.1046 12 12 12.8954 12 14V16C12 17.1046 11.1046 18 10 18H8C6.89543 18 6 17.1046 6 16V14Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M12 14C12 12.8954 12.8954 12 14 12H16C17.1046 12 18 12.8954 18 14V16C18 17.1046 17.1046 18 16 18H14C12.8954 18 12 17.1046 12 16V14Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Paper Airplane: Send icon
    'paper-airplane': (
      <IconWrapper>
        <path d="M6 12L22 2L17 22L12 14L6 12Z" stroke={nodeColor} strokeWidth="1.5" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Paper Clip: Attachment
    'paper-clip': (
      <IconWrapper>
        <path d="M21.44 11.05L12 20.49L3.56 12.05C2.38 10.87 2.38 9.13 3.56 7.95C4.74 6.77 6.48 6.77 7.66 7.95L16.1 16.39C16.49 16.78 16.49 17.41 16.1 17.8C15.71 18.19 15.08 18.19 14.69 17.8L6.25 9.36C5.07 8.18 5.07 6.44 6.25 5.26C7.43 4.08 9.17 4.08 10.35 5.26L18.79 13.7C19.56 14.47 19.56 15.73 18.79 16.5C18.02 17.27 16.76 17.27 15.99 16.5L7.55 8.06" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Microphone
    microphone: (
      <IconWrapper>
        <path d="M12 1V15M12 15C15.3137 15 18 12.3137 18 9V5C18 1.68629 15.3137 -1 12 -1C8.68629 -1 6 1.68629 6 5V9C6 12.3137 8.68629 15 12 15Z" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M19 10V12C19 16.4183 15.4183 20 11 20H13C17.4183 20 21 16.4183 21 12V10" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M12 20V23M8 23H16" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Smile: Smiley face
    smile: (
      <IconWrapper>
        <circle cx="12" cy="12" r="9" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="9" cy="9" r="1" fill={nodeColor} opacity="0.9"/>
        <circle cx="15" cy="9" r="1" fill={nodeColor} opacity="0.9"/>
        <path d="M9 15C9 15 10.5 17 12 17C13.5 17 15 15 15 15" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Ellipsis: Three dots
    ellipsis: (
      <IconWrapper>
        <circle cx="12" cy="12" r="1" fill={nodeColor} opacity="0.9"/>
        <circle cx="19" cy="12" r="1" fill={nodeColor} opacity="0.9"/>
        <circle cx="5" cy="12" r="1" fill={nodeColor} opacity="0.9"/>
      </IconWrapper>
    ),
    // User Plus: Add user
    'user-plus': (
      <IconWrapper>
        <circle cx="12" cy="8" r="3" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M6 20C6 17 8 15 11 15H13C16 15 18 17 18 20" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M19 8V14M22 11H16" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Photo: Image icon
    photo: (
      <IconWrapper>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill={nodeColor} opacity="0.9"/>
        <path d="M21 15L16 10L5 21" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Bell Slash: Muted bell
    'bell-slash': (
      <IconWrapper>
        <path d="M9 17H15M9 17C9 18 9.5 19 10.5 19H13.5C14.5 19 15 18 15 17M9 17V11C9 9 10 8 11 8M15 17V11C15 9.5 14.5 9 14 9M3 3L21 21" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Flag
    flag: (
      <IconWrapper>
        <path d="M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V3C20 3 19 4 16 4C13 4 11 2 8 2C5 2 4 3 4 3V15Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M4 22V15" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
      </IconWrapper>
    ),
    // Tag
    tag: (
      <IconWrapper>
        <path d="M20.59 13.41L13.42 6.24C12.85 5.67 12.85 4.73 13.42 4.16L16.84 0.74C17.41 0.17 18.35 0.17 18.92 0.74L23.26 5.08C23.83 5.65 23.83 6.59 23.26 7.16L16.08 14.34C15.51 14.91 14.57 14.91 14 14.34L10.58 10.92C10.01 10.35 10.01 9.41 10.58 8.84L17.76 1.66" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <circle cx="7" cy="17" r="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Lightbulb
    lightbulb: (
      <IconWrapper>
        <path d="M9 21H15M12 3C8 3 5 6 5 10C5 13 7 15.5 9 17V19C9 19.5 9.5 20 10 20H14C14.5 20 15 19.5 15 19V17C17 15.5 19 13 19 10C19 6 16 3 12 3Z" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Funnel: Filter icon
    funnel: (
      <IconWrapper>
        <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Plus: Plus sign
    plus: (
      <IconWrapper>
        <path d="M12 5V19M5 12H19" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Robot: Robot/AI head icon
    robot: (
      <IconWrapper>
        <rect x="6" y="8" width="12" height="10" rx="2" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <circle cx="9" cy="12" r="1.5" fill={nodeColor} opacity="0.9"/>
        <circle cx="15" cy="12" r="1.5" fill={nodeColor} opacity="0.9"/>
        <path d="M9 16H15" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M12 3V8" stroke={nodeColor} strokeWidth="1.5" opacity="0.9"/>
        <circle cx="12" cy="5" r="1" fill={nodeColor} opacity="0.9"/>
      </IconWrapper>
    ),
    // Play: Play button
    play: (
      <IconWrapper>
        <path d="M8 5V19L19 12L8 5Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Pause: Pause button
    pause: (
      <IconWrapper>
        <rect x="8" y="5" width="4" height="14" rx="1" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <rect x="14" y="5" width="4" height="14" rx="1" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Download: Download/arrow down tray
    download: (
      <IconWrapper>
        <path d="M21 15V19C21 19.5 20.5 20 20 20H4C3.5 20 3 19.5 3 19V15" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M7 10L12 15L17 10" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        <path d="M12 15V3" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Link: Link icon
    link: (
      <IconWrapper>
        <path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.47L11.75 5.18" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        <path d="M14 11C13.5705 10.4259 13.0226 9.95087 12.3934 9.60708C11.7643 9.26329 11.0685 9.05886 10.3533 9.00766C9.63816 8.95646 8.92037 9.05972 8.24874 9.31028C7.57711 9.56083 6.96705 9.95302 6.46 10.46L3.46 13.46C2.54918 14.403 2.0452 15.6661 2.05659 16.977C2.06799 18.288 2.59383 19.5421 3.52087 20.4691C4.44791 21.3962 5.70198 21.922 7.01296 21.9334C8.32394 21.9448 9.58695 21.4408 10.53 20.53L12.24 18.82" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // Stop: Stop button (square)
    stop: (
      <IconWrapper>
        <rect x="7" y="7" width="10" height="10" rx="1" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
      </IconWrapper>
    ),
    // Upload: Upload/arrow up tray
    upload: (
      <IconWrapper>
        <path d="M21 15V19C21 19.5 20.5 20 20 20H4C3.5 20 3 19.5 3 19V15" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M7 14L12 9L17 14" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        <path d="M12 9V21" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
    // User Minus: User with minus sign
    'user-minus': (
      <IconWrapper>
        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15C10.9391 15 9.92172 15.4214 9.17157 16.1716C8.42143 16.9217 8 17.9391 8 19V21" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        <circle cx="12" cy="7" r="4" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9"/>
        <path d="M20 10H16" stroke={nodeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
      </IconWrapper>
    ),
  };

  const iconElement = icons[type] || icons.bell;

  return iconElement;
};

export default NeonCyanIcon;

