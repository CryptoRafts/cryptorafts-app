"use client";

import React from 'react';
import ResponsiveLayout, { ResponsiveGrid, ResponsiveCard, ResponsiveText, ResponsiveButton } from '@/components/ResponsiveLayout';
import AdaptiveLogo from '@/components/AdaptiveLogo';

export default function MobileTestPage() {
  return (
    <div className="min-h-screen neo-blue-background">
      <ResponsiveLayout spacing="lg" padding="lg">
        {/* Mobile Header */}
        <div className="glass-panel border-b border-white/10 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AdaptiveLogo 
                defaultLogoSrc="/cryptorafts.logo (1).svg"
                smallScreenLogoSrc="/logofor-smallscreens.png"
                alt="Cryptorafts"
                className="logo-responsive"
              />
              <div>
                <ResponsiveText variant="3xl" weight="bold" color="text-white">
                  Mobile Background Test
                </ResponsiveText>
                <ResponsiveText variant="base" color="text-gray-300">
                  Perfect mobile background optimization
                </ResponsiveText>
              </div>
            </div>
            <ResponsiveButton variant="primary" size="md">
              Mobile Test
            </ResponsiveButton>
          </div>
        </div>

        {/* Mobile Background Test Cards */}
        <ResponsiveCard variant="lg" className="mb-8">
          <ResponsiveText variant="3xl" weight="bold" color="text-white" className="mb-6">
            Mobile Background Performance Test
          </ResponsiveText>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="glass-card p-4 text-center">
                <ResponsiveText variant="lg" weight="bold" color="text-cyan-400">320px</ResponsiveText>
                <ResponsiveText variant="sm" color="text-gray-300">iPhone SE</ResponsiveText>
                <ResponsiveText variant="xs" color="text-gray-400">Ultra-optimized background</ResponsiveText>
              </div>
              <div className="glass-card p-4 text-center">
                <ResponsiveText variant="lg" weight="bold" color="text-blue-400">375px</ResponsiveText>
                <ResponsiveText variant="sm" color="text-gray-300">iPhone</ResponsiveText>
                <ResponsiveText variant="xs" color="text-gray-400">Optimized background</ResponsiveText>
              </div>
              <div className="glass-card p-4 text-center">
                <ResponsiveText variant="lg" weight="bold" color="text-green-400">414px</ResponsiveText>
                <ResponsiveText variant="sm" color="text-gray-300">iPhone Plus</ResponsiveText>
                <ResponsiveText variant="xs" color="text-gray-400">Enhanced background</ResponsiveText>
              </div>
              <div className="glass-card p-4 text-center">
                <ResponsiveText variant="lg" weight="bold" color="text-yellow-400">768px</ResponsiveText>
                <ResponsiveText variant="sm" color="text-gray-300">Tablet</ResponsiveText>
                <ResponsiveText variant="xs" color="text-gray-400">Full background</ResponsiveText>
              </div>
            </div>
          </div>
        </ResponsiveCard>

        {/* Mobile Performance Test */}
        <ResponsiveCard variant="lg" className="mb-8">
          <ResponsiveText variant="3xl" weight="bold" color="text-white" className="mb-6">
            Mobile Performance Features
          </ResponsiveText>
          
          <div className="space-y-4">
            <div className="glass-card p-4">
              <ResponsiveText variant="lg" weight="bold" color="text-green-400" className="mb-2">
                ✅ Hardware Acceleration
              </ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">
                Uses transform3d for optimal mobile rendering performance
              </ResponsiveText>
            </div>
            
            <div className="glass-card p-4">
              <ResponsiveText variant="lg" weight="bold" color="text-blue-400" className="mb-2">
                ✅ Reduced Complexity
              </ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">
                Simplified background layers for better mobile performance
              </ResponsiveText>
            </div>
            
            <div className="glass-card p-4">
              <ResponsiveText variant="lg" weight="bold" color="text-purple-400" className="mb-2">
                ✅ Touch Optimizations
              </ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">
                Optimized touch interactions and scrolling behavior
              </ResponsiveText>
            </div>
            
            <div className="glass-card p-4">
              <ResponsiveText variant="lg" weight="bold" color="text-orange-400" className="mb-2">
                ✅ Memory Efficient
              </ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">
                Reduced memory usage with optimized background rendering
              </ResponsiveText>
            </div>
          </div>
        </ResponsiveCard>

        {/* Mobile Grid Test */}
        <ResponsiveCard variant="lg" className="mb-8">
          <ResponsiveText variant="3xl" weight="bold" color="text-white" className="mb-6">
            Mobile Grid System Test
          </ResponsiveText>
          
          <ResponsiveGrid variant="auto-fit" gap="md">
            {Array.from({ length: 8 }, (_, i) => (
              <ResponsiveCard key={i} variant="md">
                <ResponsiveText variant="lg" weight="bold" color="text-white">
                  Mobile Card {i + 1}
                </ResponsiveText>
                <ResponsiveText variant="sm" color="text-gray-300">
                  Perfect mobile responsive card with glass effects
                </ResponsiveText>
                <div className="mt-4">
                  <ResponsiveButton variant="primary" size="sm">
                    Mobile Action
                  </ResponsiveButton>
                </div>
              </ResponsiveCard>
            ))}
          </ResponsiveGrid>
        </ResponsiveCard>

        {/* Mobile Typography Test */}
        <ResponsiveCard variant="lg">
          <ResponsiveText variant="3xl" weight="bold" color="text-white" className="mb-6">
            Mobile Typography Test
          </ResponsiveText>
          
          <div className="space-y-4">
            <ResponsiveText variant="6xl" weight="bold" color="text-cyan-400">
              H1 - Perfect Mobile Scaling
            </ResponsiveText>
            <ResponsiveText variant="5xl" weight="bold" color="text-blue-400">
              H2 - Responsive Typography
            </ResponsiveText>
            <ResponsiveText variant="4xl" weight="bold" color="text-green-400">
              H3 - Mobile Optimized
            </ResponsiveText>
            <ResponsiveText variant="3xl" weight="bold" color="text-yellow-400">
              H4 - Perfect Scaling
            </ResponsiveText>
            <ResponsiveText variant="2xl" weight="bold" color="text-orange-400">
              H5 - Responsive Text
            </ResponsiveText>
            <ResponsiveText variant="xl" weight="bold" color="text-red-400">
              H6 - Mobile Ready
            </ResponsiveText>
            <ResponsiveText variant="lg" color="text-gray-300">
              Large text with perfect mobile scaling
            </ResponsiveText>
            <ResponsiveText variant="base" color="text-gray-300">
              Base text optimized for mobile reading
            </ResponsiveText>
            <ResponsiveText variant="sm" color="text-gray-400">
              Small text with mobile-friendly sizing
            </ResponsiveText>
            <ResponsiveText variant="xs" color="text-gray-500">
              Extra small text for mobile interfaces
            </ResponsiveText>
          </div>
        </ResponsiveCard>
      </ResponsiveLayout>
    </div>
  );
}
