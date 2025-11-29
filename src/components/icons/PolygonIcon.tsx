'use client';

import React from 'react';

interface PolygonIconProps {
  type: 'traction' | 'revenue' | 'engagement' | 'verified' | 'risk' | 'network' | 'shield' | 'brain' | 'hand' | 'ai' | 'ecosystem' | 'verification' | 'dashboard' | 'dealflow' | 'portfolio' | 'pipeline' | 'messages' | 'team' | 'building' | 'settings' | 'home' | 'analytics' | 'campaigns' | 'clients' | 'listings' | 'launchpad' | 'earnings';
  className?: string;
  size?: number;
  withBackground?: boolean;
  bgColor?: string;
}

/**
 * Polygonal Mesh Icon Component
 * Creates network-style icons with interconnected dots and lines
 * Supports circular backgrounds like in the reference images
 */
export const PolygonIcon: React.FC<PolygonIconProps> = ({ 
  type, 
  className = '', 
  size = 24,
  withBackground = false,
  bgColor = 'rgba(6, 182, 212, 0.2)' // cyan-500 with opacity
}) => {
  // Neon cyan color palette - Nemo Blue theme
  const baseColor = '#06b6d4'; // cyan-500 - main glow
  const nodeColor = '#22d3ee'; // cyan-400 - bright nodes
  const lineColor = '#67e8f9'; // cyan-300 - connection lines
  const softCyan = '#a5f3fc'; // cyan-200 - subtle particles
  const darkBg = '#0a0e1a'; // Dark background
  
  // Enhanced glow filters for neon-cyan cyber theme - matching reference bell icon
  const glowFilter = `drop-shadow(0 0 2px ${nodeColor}) drop-shadow(0 0 4px ${nodeColor}40) drop-shadow(0 0 8px ${nodeColor}20)`;
  const strongGlowFilter = `drop-shadow(0 0 3px ${nodeColor}) drop-shadow(0 0 6px ${nodeColor}60) drop-shadow(0 0 12px ${nodeColor}30)`;
  const haloFilter = `drop-shadow(0 0 4px ${nodeColor}50) drop-shadow(0 0 8px ${nodeColor}30) drop-shadow(0 0 16px ${nodeColor}15)`;
  
  // Standard icon wrapper - ensures consistent dark background and prominent circular glow border
  // Matching reference bell icon: dark background, glowing circular outline, soft halo
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ filter: glowFilter }}>
      {/* Dark background circle - matching reference */}
      <circle cx="12" cy="12" r="11" fill={darkBg} opacity="0.8"/>
      {/* Prominent circular glow border - matching reference bell icon style exactly */}
      <circle cx="12" cy="12" r="10.5" stroke={nodeColor} strokeWidth="1.8" fill="none" opacity="1" style={{ filter: strongGlowFilter }}/>
      {/* Inner soft glow halo */}
      <circle cx="12" cy="12" r="9.5" stroke={baseColor} strokeWidth="0.6" fill="none" opacity="0.4" style={{ filter: haloFilter }}/>
      {/* Icon content - centered and properly sized */}
      {children}
    </svg>
  );

  const icons: Record<string, JSX.Element> = {
    // Dashboard: Star/node with radiating points - neon blue theme with circular halos
    dashboard: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* Inner ring */}
        <circle cx="12" cy="12" r="3" stroke={lineColor} strokeWidth="0.5" fill="none" opacity="0.5"/>
        {/* Central hub */}
        <circle cx="12" cy="12" r="2.5" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Radiating nodes */}
        <circle cx="12" cy="6" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="8" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="18" cy="16" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="12" cy="18" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="6" cy="16" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="6" cy="8" r="1" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="12" y2="6" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="8" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="16" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="6" y2="16" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="6" y2="8" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        {/* Particles */}
        <circle cx="15" cy="5" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="19" cy="12" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="9" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="5" cy="12" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Dealflow: Target/bullseye with interconnected nodes - neon blue theme
    dealflow: (
      <IconWrapper>
        {/* Concentric rings */}
        <circle cx="12" cy="12" r="6" stroke={baseColor} strokeWidth="1.2" fill="none" opacity="0.4"/>
        <circle cx="12" cy="12" r="4" stroke={nodeColor} strokeWidth="0.8" fill="none" opacity="0.5"/>
        <circle cx="12" cy="12" r="2" stroke={lineColor} strokeWidth="0.6" fill="none" opacity="0.6"/>
        {/* Center hub */}
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.95" style={{ filter: strongGlowFilter }}/>
        {/* Corner nodes */}
        <circle cx="8" cy="8" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="16" cy="8" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="8" cy="16" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="16" cy="16" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="8" y2="8" stroke={lineColor} strokeWidth="0.8" opacity="0.5"/>
        <line x1="12" y1="12" x2="16" y2="8" stroke={lineColor} strokeWidth="0.8" opacity="0.5"/>
        <line x1="12" y1="12" x2="8" y2="16" stroke={lineColor} strokeWidth="0.8" opacity="0.5"/>
        <line x1="12" y1="12" x2="16" y2="16" stroke={lineColor} strokeWidth="0.8" opacity="0.5"/>
        {/* Particles */}
        <circle cx="10" cy="6" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="18" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="18" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="6" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Portfolio: Blockchain/B symbol with nodes - neon blue theme
    portfolio: (
      <IconWrapper>
        {/* B symbol */}
        <path d="M8 4V20M8 4H14C16 4 18 5 18 8C18 11 16 12 14 12H8M8 12H14C16 12 18 13 18 16C18 19 16 20 14 20H8" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Network nodes */}
        <circle cx="18" cy="6" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="12" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="18" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="6" cy="6" r="0.8" fill={nodeColor} opacity="0.7"/>
        <circle cx="6" cy="18" r="0.8" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="8" y1="4" x2="18" y2="6" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="8" y1="12" x2="18" y2="12" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="8" y1="20" x2="18" y2="18" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        {/* Particles */}
        <circle cx="20" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="4" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="4" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Pipeline: Star/node similar to dashboard - neon blue theme
    pipeline: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* Central hub */}
        <circle cx="12" cy="12" r="2.5" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Flow nodes */}
        <circle cx="12" cy="6" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="9" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="18" cy="15" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="12" cy="18" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="6" cy="15" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="6" cy="9" r="1" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="12" y2="6" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="9" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="15" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="6" y2="15" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="6" y2="9" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        {/* Particles */}
        <circle cx="15" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="12" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="9" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="4" cy="12" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Messages: Snowflake/network pattern - neon blue theme
    messages: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* Central hub */}
        <circle cx="12" cy="12" r="2" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Message nodes */}
        <circle cx="12" cy="6" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="10" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="18" cy="14" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="12" cy="18" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="6" cy="14" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="6" cy="10" r="1" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="12" y2="6" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="10" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="14" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="6" y2="14" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="6" y2="10" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="18" y1="10" x2="6" y2="10" stroke={lineColor} strokeWidth="0.5" opacity="0.3"/>
        <line x1="18" y1="14" x2="6" y2="14" stroke={lineColor} strokeWidth="0.5" opacity="0.3"/>
        {/* Particles */}
        <circle cx="15" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="8" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="9" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="4" cy="16" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Team: Target/bullseye similar to dealflow - neon blue theme
    team: (
      <IconWrapper>
        {/* Concentric rings */}
        <circle cx="12" cy="12" r="5" stroke={baseColor} strokeWidth="1.2" fill="none" opacity="0.4"/>
        <circle cx="12" cy="12" r="3" stroke={nodeColor} strokeWidth="0.8" fill="none" opacity="0.5"/>
        {/* Central hub */}
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Team member nodes */}
        <circle cx="8" cy="8" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="16" cy="8" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="8" cy="16" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="16" cy="16" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="6" r="0.8" fill={nodeColor} opacity="0.7"/>
        <circle cx="12" cy="18" r="0.8" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="8" y2="8" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="16" y2="8" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="8" y2="16" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="16" y2="16" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="6" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        {/* Particles */}
        <circle cx="10" cy="5" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="19" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="5" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    traction: (
      <IconWrapper>
        {/* Rocket shape */}
        <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Central hub */}
        <circle cx="12" cy="10" r="2" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Corner nodes */}
        <circle cx="14" cy="8" r="1.5" fill={nodeColor} opacity="0.7"/>
        <circle cx="10" cy="8" r="1.5" fill={nodeColor} opacity="0.7"/>
        <circle cx="14" cy="12" r="1.5" fill={nodeColor} opacity="0.7"/>
        <circle cx="10" cy="12" r="1.5" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="10" x2="14" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="10" x2="10" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="10" x2="14" y2="12" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="10" x2="10" y2="12" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        {/* Trail particles */}
        <circle cx="12" cy="20" r="0.6" fill={softCyan} opacity="0.7"/>
        <circle cx="11" cy="21" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="13" cy="21" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    revenue: (
      <IconWrapper>
        {/* Dollar sign ring */}
        <circle cx="12" cy="12" r="8" stroke={baseColor} strokeWidth="1.2" fill="none" opacity="0.4"/>
        {/* Dollar sign */}
        <path d="M12 6V18M9 9C9 8 10 7 12 7C14 7 15 8 15 9C15 10 14 11 12 11M12 13C14 13 15 14 15 15C15 16 14 17 12 17C10 17 9 16 9 15" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Center node */}
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.95" style={{ filter: strongGlowFilter }}/>
        {/* Corner nodes */}
        <circle cx="8" cy="8" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="16" cy="8" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="8" cy="16" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="16" cy="16" r="1" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="8" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.4"/>
        <line x1="12" y1="12" x2="16" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.4"/>
        <line x1="12" y1="12" x2="8" y2="16" stroke={lineColor} strokeWidth="0.5" opacity="0.4"/>
        <line x1="12" y1="12" x2="16" y2="16" stroke={lineColor} strokeWidth="0.5" opacity="0.4"/>
        {/* Particles */}
        <circle cx="10" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="18" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="6" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    engagement: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* Central hub */}
        <circle cx="12" cy="12" r="2.5" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Outer nodes */}
        <circle cx="6" cy="8" r="1.5" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="8" r="1.5" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="6" cy="16" r="1.5" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="16" r="1.5" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="6" r="1.5" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="18" r="1.5" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="6" y2="8" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="8" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="6" y2="16" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="16" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="6" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        <line x1="6" y1="8" x2="18" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.3"/>
        <line x1="6" y1="16" x2="18" y2="16" stroke={lineColor} strokeWidth="0.5" opacity="0.3"/>
        {/* Particles */}
        <circle cx="8" cy="5" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="19" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="16" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="5" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    verified: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* Polygon badge */}
        <polygon points="12,2 16,6 22,4 20,10 24,12 20,14 22,20 16,18 12,22 8,18 2,20 4,14 0,12 4,10 2,4 8,6" 
          stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.6" style={{ filter: strongGlowFilter }}/>
        {/* Checkmark */}
        <path d="M8 12L11 15L16 9" stroke={nodeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Center node */}
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.95" style={{ filter: strongGlowFilter }}/>
        {/* Particles */}
        <circle cx="14" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="8" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="16" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    risk: (
      <IconWrapper>
        {/* Shield outline */}
        <path d="M12 2L4 5V11C4 16 8 20 12 22C16 20 20 16 20 11V5L12 2Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.7" style={{ filter: strongGlowFilter }}/>
        {/* Center node */}
        <circle cx="12" cy="12" r="2" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Corner nodes */}
        <circle cx="8" cy="8" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="16" cy="8" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="12" cy="6" r="1" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="8" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="16" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="6" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        {/* Particles */}
        <circle cx="10" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="9" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="15" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    network: (
      <IconWrapper>
        {/* Middle rings */}
        <circle cx="12" cy="12" r="6" stroke={baseColor} strokeWidth="1" fill="none" opacity="0.3"/>
        <circle cx="12" cy="12" r="4" stroke={nodeColor} strokeWidth="0.8" fill="none" opacity="0.4"/>
        {/* Central hub */}
        <circle cx="12" cy="12" r="2" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Outer nodes */}
        <circle cx="8" cy="8" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="16" cy="8" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="8" cy="16" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="16" cy="16" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="6" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="12" cy="18" r="1" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="8" y2="8" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="12" y1="12" x2="16" y2="8" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="12" y1="12" x2="8" y2="16" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="12" y1="12" x2="16" y2="16" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="8" y1="8" x2="16" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.3"/>
        <line x1="8" y1="16" x2="16" y2="16" stroke={lineColor} strokeWidth="0.5" opacity="0.3"/>
        {/* Particles */}
        <circle cx="10" cy="5" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="19" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="5" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    shield: (
      <IconWrapper>
        {/* Shield outline */}
        <path d="M12 2L4 5V11C4 16 8 20 12 22C16 20 20 16 20 11V5L12 2Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.7" style={{ filter: strongGlowFilter }}/>
        {/* Brain mesh inside shield */}
        <path d="M10 10C10 9 11 8 12 8C13 8 14 9 14 10C14 11 13 12 12 12C11 12 10 11 10 10Z" 
          stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.8"/>
        <path d="M9 13C9 12 10 11 11 11C12 11 13 12 13 13" 
          stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.8"/>
        <circle cx="11" cy="10" r="0.8" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="13" cy="10" r="0.8" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="12" r="0.6" fill={nodeColor} opacity="0.8"/>
        <line x1="12" y1="10" x2="12" y2="12" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        {/* Particles */}
        <circle cx="10" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="9" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="15" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    brain: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* Brain outline */}
        <path d="M12 8C14 8 16 9 16 11C16 13 14 14 12 14C10 14 8 13 8 11C8 9 10 8 12 8Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Brain nodes */}
        <path d="M10 10C10 9 11 8 12 8C13 8 14 9 14 10" 
          stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.8"/>
        <circle cx="11" cy="10" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="13" cy="10" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="12" r="0.8" fill={nodeColor} opacity="0.8"/>
        <circle cx="10" cy="9" r="0.6" fill={nodeColor} opacity="0.7"/>
        <circle cx="14" cy="9" r="0.6" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="11" y1="10" x2="10" y2="9" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="13" y1="10" x2="14" y2="9" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="11" y2="10" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="13" y2="10" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        {/* Particles */}
        <circle cx="9" cy="7" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="15" cy="7" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="8" cy="13" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="16" cy="13" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    hand: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* Hand outline */}
        <path d="M12 18L10 16L8 14L6 12L8 10L10 8L12 10L14 8L16 10L18 12L16 14L14 16Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.7" style={{ filter: strongGlowFilter }}/>
        {/* Central hub */}
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Finger nodes */}
        <circle cx="10" cy="10" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="14" cy="10" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="8" cy="12" r="0.8" fill={nodeColor} opacity="0.7"/>
        <circle cx="16" cy="12" r="0.8" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="10" y2="10" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="14" y2="10" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="8" y2="12" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="16" y2="12" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        {/* Particles */}
        <circle cx="9" cy="7" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="15" cy="7" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="7" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="17" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    ai: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* AI text */}
        <text x="8" y="16" fill={nodeColor} fontSize="12" fontWeight="bold" opacity="0.95" style={{ filter: strongGlowFilter }}>AI</text>
        {/* Corner nodes */}
        <circle cx="6" cy="8" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="8" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="6" cy="20" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="20" r="1" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="6" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="6" y2="20" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="18" y2="20" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        {/* Particles */}
        <circle cx="8" cy="6" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="16" cy="22" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="4" cy="18" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    ecosystem: (
      <IconWrapper>
        {/* Middle rings */}
        <circle cx="12" cy="12" r="7" stroke={baseColor} strokeWidth="1.2" fill="none" opacity="0.3"/>
        <circle cx="12" cy="12" r="5" stroke={nodeColor} strokeWidth="0.8" fill="none" opacity="0.4"/>
        {/* Central hub */}
        <circle cx="12" cy="12" r="2.5" fill={nodeColor} opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Outer nodes */}
        <circle cx="6" cy="8" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="8" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="6" cy="16" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="16" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="5" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="12" cy="19" r="1" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="6" y2="8" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="12" y1="12" x2="18" y2="8" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="12" y1="12" x2="6" y2="16" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="12" y1="12" x2="18" y2="16" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="12" y1="12" x2="12" y2="5" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="12" y1="12" x2="12" y2="19" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        {/* Particles */}
        <circle cx="8" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="16" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="4" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    verification: (
      <IconWrapper>
        {/* Middle ring */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="0.6" fill="none" opacity="0.4"/>
        {/* Shield outline */}
        <path d="M12 2L4 5V11C4 16 8 20 12 22C16 20 20 16 20 11V5L12 2Z" 
          stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.7" style={{ filter: strongGlowFilter }}/>
        {/* Brain nodes */}
        <circle cx="11" cy="10" r="0.8" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="13" cy="10" r="0.8" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <path d="M10 10C10 9 11 8 12 8C13 8 14 9 14 10" 
          stroke={nodeColor} strokeWidth="0.8" fill="none" opacity="0.8"/>
        {/* Hand node */}
        <circle cx="12" cy="15" r="1.2" fill={nodeColor} opacity="0.8" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="10" cy="14" r="0.6" fill={nodeColor} opacity="0.7"/>
        <circle cx="14" cy="14" r="0.6" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="11" y2="10" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        <line x1="12" y1="12" x2="12" y2="15" stroke={lineColor} strokeWidth="0.5" opacity="0.5"/>
        {/* Particles */}
        <circle cx="10" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="9" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="15" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Building/Company: Minimal wireframe building with neon glow
    building: (
      <IconWrapper>
        {/* Building wireframe */}
        <rect x="7" y="10" width="10" height="10" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Building windows */}
        <rect x="9" y="12" width="2" height="2" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.6"/>
        <rect x="13" y="12" width="2" height="2" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.6"/>
        <rect x="9" y="16" width="2" height="2" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.6"/>
        <rect x="13" y="16" width="2" height="2" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.6"/>
        {/* Building roof */}
        <path d="M7 10L12 6L17 10" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Corner nodes */}
        <circle cx="7" cy="10" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="17" cy="10" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="7" cy="20" r="0.8" fill={nodeColor} opacity="0.7"/>
        <circle cx="17" cy="20" r="0.8" fill={nodeColor} opacity="0.7"/>
        {/* Particles */}
        <circle cx="5" cy="8" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="19" cy="8" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="6" cy="22" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="18" cy="22" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Settings/Gear: Minimal gear icon with neon glow
    settings: (
      <IconWrapper>
        {/* Gear wireframe */}
        <circle cx="12" cy="12" r="5" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Gear teeth */}
        <rect x="11" y="4" width="2" height="3" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <rect x="11" y="17" width="2" height="3" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <rect x="4" y="11" width="3" height="2" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <rect x="17" y="11" width="3" height="2" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Diagonal teeth */}
        <rect x="6.5" y="6.5" width="2" height="2" transform="rotate(-45 7.5 7.5)" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.7"/>
        <rect x="15.5" y="15.5" width="2" height="2" transform="rotate(-45 16.5 16.5)" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.7"/>
        <rect x="15.5" y="6.5" width="2" height="2" transform="rotate(45 16.5 7.5)" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.7"/>
        <rect x="6.5" y="15.5" width="2" height="2" transform="rotate(45 7.5 16.5)" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.7"/>
        {/* Center hub */}
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.95" style={{ filter: strongGlowFilter }}/>
        {/* Particles */}
        <circle cx="8" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="16" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="4" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Home: Minimal house wireframe
    home: (
      <IconWrapper>
        {/* House wireframe */}
        <rect x="8" y="12" width="8" height="8" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Roof */}
        <path d="M6 12L12 6L18 12" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Door */}
        <rect x="11" y="16" width="2" height="4" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.6"/>
        {/* Window */}
        <rect x="9" y="13" width="2" height="2" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.6"/>
        <rect x="13" y="13" width="2" height="2" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.6"/>
        {/* Corner nodes */}
        <circle cx="6" cy="12" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="12" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="6" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        {/* Particles */}
        <circle cx="4" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="10" cy="22" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="22" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Analytics: Chart wireframe
    analytics: (
      <IconWrapper>
        {/* Chart wireframe */}
        <line x1="7" y1="18" x2="7" y2="18" stroke={nodeColor} strokeWidth="2" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <line x1="10" y1="15" x2="10" y2="18" stroke={nodeColor} strokeWidth="2" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <line x1="13" y1="12" x2="13" y2="18" stroke={nodeColor} strokeWidth="2" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <line x1="16" y1="9" x2="16" y2="18" stroke={nodeColor} strokeWidth="2" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <line x1="19" y1="6" x2="19" y2="18" stroke={nodeColor} strokeWidth="2" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Base line */}
        <line x1="6" y1="18" x2="20" y2="18" stroke={lineColor} strokeWidth="1" opacity="0.5"/>
        {/* Connection lines */}
        <line x1="7" y1="18" x2="10" y2="15" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="10" y1="15" x2="13" y2="12" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="13" y1="12" x2="16" y2="9" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="16" y1="9" x2="19" y2="6" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        {/* Nodes */}
        <circle cx="7" cy="18" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="10" cy="15" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="13" cy="12" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="16" cy="9" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="19" cy="6" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        {/* Particles */}
        <circle cx="5" cy="5" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="21" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="8" cy="21" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Campaigns: Megaphone wireframe
    campaigns: (
      <IconWrapper>
        {/* Megaphone wireframe */}
        <path d="M8 8L4 12L8 16V8Z" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <path d="M8 10L18 6L18 18L8 14" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Sound waves */}
        <path d="M18 8C19 8 20 9 20 10" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.5"/>
        <path d="M18 14C19 14 20 15 20 16" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.5"/>
        {/* Nodes */}
        <circle cx="4" cy="12" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="6" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="18" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        {/* Particles */}
        <circle cx="2" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="22" cy="8" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="22" cy="16" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="6" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Clients: User group wireframe
    clients: (
      <IconWrapper>
        {/* User icons */}
        <circle cx="9" cy="10" r="2" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <path d="M6 16C6 14 7 13 9 13C11 13 12 14 12 16" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <circle cx="15" cy="10" r="2" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        <path d="M12 16C12 14 13 13 15 13C17 13 18 14 18 16" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Connection lines */}
        <line x1="9" y1="10" x2="15" y2="10" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        <line x1="9" y1="13" x2="15" y2="13" stroke={lineColor} strokeWidth="0.8" opacity="0.4"/>
        {/* Particles */}
        <circle cx="5" cy="8" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="19" cy="8" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="7" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="17" cy="19" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Listings: Globe wireframe
    listings: (
      <IconWrapper>
        {/* Globe wireframe */}
        <circle cx="12" cy="12" r="6" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Latitude lines */}
        <ellipse cx="12" cy="12" rx="6" ry="2" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.5"/>
        <ellipse cx="12" cy="12" rx="6" ry="2" transform="rotate(90 12 12)" stroke={lineColor} strokeWidth="0.8" fill="none" opacity="0.5"/>
        {/* Nodes */}
        <circle cx="12" cy="6" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="12" cy="18" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="6" cy="12" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="18" cy="12" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        {/* Particles */}
        <circle cx="4" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="4" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="20" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Launchpad: Rocket wireframe
    launchpad: (
      <IconWrapper>
        {/* Rocket wireframe */}
        <path d="M12 4L14 10L20 12L14 14L12 20L10 14L4 12L10 10Z" stroke={nodeColor} strokeWidth="1.2" fill="none" opacity="0.8" style={{ filter: strongGlowFilter }}/>
        {/* Rocket body */}
        <rect x="11" y="10" width="2" height="4" stroke={nodeColor} strokeWidth="1" fill="none" opacity="0.8"/>
        {/* Flame */}
        <path d="M11 14L10 18L12 16L14 18L13 14" stroke={lineColor} strokeWidth="1" fill="none" opacity="0.6"/>
        {/* Nodes */}
        <circle cx="12" cy="12" r="1" fill={nodeColor} opacity="0.9" style={{ filter: `drop-shadow(0 0 2px ${nodeColor})` }}/>
        <circle cx="14" cy="10" r="0.8" fill={nodeColor} opacity="0.7"/>
        <circle cx="10" cy="10" r="0.8" fill={nodeColor} opacity="0.7"/>
        {/* Particles */}
        <circle cx="8" cy="6" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="16" cy="6" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="12" cy="22" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
    // Earnings: Dollar sign wireframe
    earnings: (
      <IconWrapper>
        {/* Dollar sign wireframe */}
        <path d="M12 6V18M9 9C9 8 10 7 12 7C14 7 15 8 15 9C15 10 14 11 12 11M12 13C14 13 15 14 15 15C15 16 14 17 12 17C10 17 9 16 9 15" stroke={nodeColor} strokeWidth="1.5" fill="none" opacity="0.9" style={{ filter: strongGlowFilter }}/>
        {/* Center node */}
        <circle cx="12" cy="12" r="1.5" fill={nodeColor} opacity="0.95" style={{ filter: strongGlowFilter }}/>
        {/* Corner nodes */}
        <circle cx="8" cy="8" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="16" cy="8" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="8" cy="16" r="1" fill={nodeColor} opacity="0.7"/>
        <circle cx="16" cy="16" r="1" fill={nodeColor} opacity="0.7"/>
        {/* Connection lines */}
        <line x1="12" y1="12" x2="8" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.4"/>
        <line x1="12" y1="12" x2="16" y2="8" stroke={lineColor} strokeWidth="0.5" opacity="0.4"/>
        <line x1="12" y1="12" x2="8" y2="16" stroke={lineColor} strokeWidth="0.5" opacity="0.4"/>
        <line x1="12" y1="12" x2="16" y2="16" stroke={lineColor} strokeWidth="0.5" opacity="0.4"/>
        {/* Particles */}
        <circle cx="10" cy="4" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="18" cy="10" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="14" cy="20" r="0.5" fill={softCyan} opacity="0.6"/>
        <circle cx="6" cy="14" r="0.5" fill={softCyan} opacity="0.6"/>
      </IconWrapper>
    ),
  };

  const iconElement = icons[type] || icons.network;

  // If withBackground is true, wrap the icon in a circular background with dark theme
  if (withBackground) {
    const bgSize = size + 8; // Add padding around icon
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-full ${className}`}
        style={{ 
          width: bgSize, 
          height: bgSize,
          backgroundColor: bgColor || 'rgba(0, 0, 0, 0.4)', // Dark background
          padding: '2px',
          border: `1px solid rgba(6, 182, 212, 0.3)`, // Neon cyan border
          boxShadow: `0 0 8px rgba(6, 182, 212, 0.2)` // Subtle glow
        }}
      >
        {iconElement}
      </div>
    );
  }

  return iconElement;
};

export default PolygonIcon;
