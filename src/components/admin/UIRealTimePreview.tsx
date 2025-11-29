"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  EyeIcon, 
  DevicePhoneMobileIcon, 
  DeviceTabletIcon, 
  ComputerDesktopIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

interface UIRealTimePreviewProps {
  tokens: Record<string, any>;
  overrides: any[];
  isPreviewMode: boolean;
  selectedBreakpoint: string;
  onBreakpointChange: (breakpoint: string) => void;
}

export default function UIRealTimePreview({
  tokens,
  overrides,
  isPreviewMode,
  selectedBreakpoint,
  onBreakpointChange
}: UIRealTimePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 1200, height: 800 });
  const previewRef = useRef<HTMLIFrameElement>(null);
  const animationRef = useRef<number>();

  // Auto-play slideshow
  useEffect(() => {
    if (isPlaying && isPreviewMode) {
      animationRef.current = window.setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % 3); // 3 slides: desktop, tablet, mobile
      }, 3000);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, isPreviewMode]);

  // Generate preview HTML with current tokens
  const generatePreviewHTML = useCallback(() => {
    const css = generateCSSFromTokens(tokens);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CryptoRafts - Live Preview</title>
    <style>
        ${css}
        
        /* Preview-specific styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--typography-font-family-body, Inter, sans-serif);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .preview-container {
            max-width: var(--layout-container-width, 1200px);
            margin: 0 auto;
            padding: 0 var(--layout-spacing-base, 16px);
        }
        
        .header {
            height: var(--header-height, 80px);
            padding: var(--header-padding, 0 24px);
            position: ${tokens['header.sticky'] === 'true' ? 'sticky' : 'static'};
            top: 0;
            z-index: 50;
            background: rgba(255, 255, 255, var(--header-transparency, 0.95));
            backdrop-filter: ${tokens['header.blur'] === 'true' ? 'blur(8px)' : 'none'};
            box-shadow: ${tokens['header.shadow'] === 'true' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none'};
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background: var(--color-primary, #8b5cf6);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: var(--color-neutral-900, #0f172a);
            font-family: var(--typography-font-family-heading, Inter, sans-serif);
        }
        
        .nav-links {
            display: flex;
            gap: 24px;
            align-items: center;
        }
        
        .nav-link {
            color: var(--color-neutral-600, #475569);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }
        
        .nav-link:hover {
            color: var(--color-primary, #8b5cf6);
        }
        
        .btn {
            background: var(--color-primary, #8b5cf6);
            color: white;
            border: none;
            border-radius: var(--button-radius, 8px);
            padding: var(--button-padding, 12px 24px);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            transform: scale(var(--button-size-scale, 1));
            box-shadow: ${tokens['button.elevation'] === 'true' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
        }
        
        .btn:hover {
            transform: scale(var(--button-hover-scale, 1.05));
            background: var(--color-secondary, #06b6d4);
        }
        
        .hero {
            text-align: center;
            padding: var(--layout-section-padding, 80px) 0;
        }
        
        .hero h1 {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: var(--typography-weight-heading, 700);
            color: white;
            margin-bottom: 24px;
            font-family: var(--typography-font-family-heading, Inter, sans-serif);
        }
        
        .hero p {
            font-size: 1.25rem;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 32px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--layout-grid-gap, 24px);
            margin: 80px 0;
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: var(--component-card-radius, 12px);
            padding: var(--component-card-padding, 24px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: ${tokens['component.card.shadow'] === 'true' ? '0 8px 32px rgba(0, 0, 0, 0.1)' : 'none'};
            transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-4px);
        }
        
        .feature-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            font-size: 24px;
        }
        
        .feature-card h3 {
            font-size: 1.5rem;
            font-weight: var(--typography-weight-heading, 700);
            color: white;
            margin-bottom: 12px;
            font-family: var(--typography-font-family-heading, Inter, sans-serif);
        }
        
        .feature-card p {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
        }
        
        /* Responsive breakpoints */
        @media (max-width: var(--breakpoint-md, 768px)) {
            .nav-links {
                display: none;
            }
            
            .hero {
                padding: 60px 0;
            }
            
            .features {
                grid-template-columns: 1fr;
                gap: 16px;
            }
        }
        
        @media (max-width: var(--breakpoint-sm, 640px)) {
            .preview-container {
                padding: 0 16px;
            }
            
            .header {
                padding: 0 16px;
            }
            
            .hero h1 {
                font-size: 2rem;
            }
            
            .hero p {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="preview-container">
            <div class="logo">
                <div class="logo-icon">CR</div>
                <span class="logo-text">CryptoRafts</span>
            </div>
            <nav class="nav-links">
                <a href="#" class="nav-link">Projects</a>
                <a href="#" class="nav-link">Investors</a>
                <a href="#" class="nav-link">About</a>
                <button class="btn">Get Started</button>
            </nav>
        </div>
    </header>
    
    <main>
        <section class="hero">
            <div class="preview-container">
                <h1>PITCH. INVEST. BUILD. VERIFIED.</h1>
                <p>AI-verified deal flow on chain—KYC/KYB, due diligence, and secure deal rooms in one network.</p>
                <button class="btn">GET STARTED</button>
            </div>
        </section>
        
        <section class="features">
            <div class="preview-container">
                <div class="feature-card">
                    <div class="feature-icon" style="background: var(--color-primary, #8b5cf6);">🔐</div>
                    <h3>AI KYC/KYB</h3>
                    <p>Secure onboarding with blockchain-based identity verification ensures compliance and trust.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon" style="background: var(--color-secondary, #06b6d4);">💬</div>
                    <h3>Smart Deal Rooms</h3>
                    <p>Private, encrypted communication channels with automated deal-flow management for efficient collaboration.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon" style="background: var(--color-success, #10b981);">📊</div>
                    <h3>Analytics & Signals</h3>
                    <p>Gain real-time insights into project performance, market trends, and investor engagement.</p>
                </div>
            </div>
        </section>
    </main>
</body>
</html>
    `;
  }, [tokens]);

  // Generate CSS from tokens
  const generateCSSFromTokens = (tokens: Record<string, any>): string => {
    const cssVars: string[] = [];
    
    Object.entries(tokens).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/\./g, '-')}`;
      cssVars.push(`  ${cssVar}: ${value};`);
    });
    
    return `:root {\n${cssVars.join('\n')}\n}`;
  };

  // Update preview dimensions based on breakpoint
  const updatePreviewDimensions = useCallback((breakpoint: string) => {
    const dimensions = {
      all: { width: 1200, height: 800 },
      xl: { width: 1280, height: 800 },
      lg: { width: 1024, height: 768 },
      md: { width: 768, height: 1024 },
      sm: { width: 640, height: 1136 },
      xs: { width: 375, height: 812 }
    };
    
    setPreviewDimensions(dimensions[breakpoint as keyof typeof dimensions] || dimensions.all);
  }, []);

  // Handle breakpoint change
  const handleBreakpointChange = useCallback((breakpoint: string) => {
    updatePreviewDimensions(breakpoint);
    onBreakpointChange(breakpoint);
  }, [updatePreviewDimensions, onBreakpointChange]);

  // Refresh preview
  const refreshPreview = useCallback(() => {
    if (previewRef.current) {
      const previewHTML = generatePreviewHTML();
      const blob = new Blob([previewHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      previewRef.current.src = url;
      
      // Clean up previous URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }, [generatePreviewHTML]);

  // Update preview when tokens change
  useEffect(() => {
    if (isPreviewMode) {
      refreshPreview();
    }
  }, [tokens, overrides, isPreviewMode, refreshPreview]);

  // Update dimensions when breakpoint changes
  useEffect(() => {
    updatePreviewDimensions(selectedBreakpoint);
  }, [selectedBreakpoint, updatePreviewDimensions]);

  if (!isPreviewMode) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
        <div className="text-center">
          <EyeIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">Preview mode is disabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Preview Controls */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Breakpoint Selector */}
            <div className="flex items-center space-x-2">
              <DevicePhoneMobileIcon className="w-5 h-5 text-white/60" />
              <select
                value={selectedBreakpoint}
                onChange={(e) => handleBreakpointChange(e.target.value)}
                className="px-3 py-1 bg-gray-700 text-white rounded-lg text-sm border border-gray-600 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Sizes</option>
                <option value="xl">XL (1280px)</option>
                <option value="lg">LG (1024px)</option>
                <option value="md">MD (768px)</option>
                <option value="sm">SM (640px)</option>
                <option value="xs">XS (375px)</option>
              </select>
            </div>
            
            {/* Auto-play Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-lg transition-colors ${
                isPlaying 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-white/60 hover:bg-gray-600'
              }`}
            >
              {isPlaying ? (
                <PauseIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={refreshPreview}
              className="p-2 rounded-lg bg-gray-700 text-white/60 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            
            {/* Dimensions Display */}
            <span className="text-sm text-white/60">
              {previewDimensions.width} × {previewDimensions.height}
            </span>
          </div>
        </div>
      </div>
      
      {/* Preview Frame */}
      <div className="relative">
        <div className="flex justify-center p-8 bg-gray-100">
          <div 
            className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{
              width: Math.min(previewDimensions.width, 1200),
              height: Math.min(previewDimensions.height, 800),
              transform: `scale(${Math.min(1, 1200 / previewDimensions.width)})`
            }}
          >
            <iframe
              ref={previewRef}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        </div>
        
        {/* Loading Overlay */}
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p className="text-white/60 text-sm">Loading preview...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
