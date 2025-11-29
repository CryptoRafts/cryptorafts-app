"use client";

import React from 'react';
import ResponsiveLayout, { ResponsiveGrid, ResponsiveCard, ResponsiveText, ResponsiveButton } from '@/components/ResponsiveLayout';
import AdaptiveLogo from '@/components/AdaptiveLogo';

export default function ResponsiveTestPage() {
  return (
    <div className="min-h-screen neo-blue-background">
      <ResponsiveLayout spacing="lg" padding="lg">
        {/* Header */}
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
                  Responsive Test
                </ResponsiveText>
                <ResponsiveText variant="base" color="text-gray-300">
                  Perfect scaling across all devices
                </ResponsiveText>
              </div>
            </div>
            <ResponsiveButton variant="primary" size="md">
              Test Button
            </ResponsiveButton>
          </div>
        </div>

        {/* Typography Test */}
        <ResponsiveCard variant="lg" className="mb-8">
          <div className="space-y-4">
            <ResponsiveText variant="4xl" weight="bold" color="text-white">
              Typography Scale Test
            </ResponsiveText>
            <ResponsiveText variant="6xl" weight="bold" color="text-cyan-400">
              H1 - 6xl
            </ResponsiveText>
            <ResponsiveText variant="5xl" weight="bold" color="text-blue-400">
              H2 - 5xl
            </ResponsiveText>
            <ResponsiveText variant="4xl" weight="bold" color="text-green-400">
              H3 - 4xl
            </ResponsiveText>
            <ResponsiveText variant="3xl" weight="bold" color="text-yellow-400">
              H4 - 3xl
            </ResponsiveText>
            <ResponsiveText variant="2xl" weight="bold" color="text-orange-400">
              H5 - 2xl
            </ResponsiveText>
            <ResponsiveText variant="xl" weight="bold" color="text-red-400">
              H6 - xl
            </ResponsiveText>
            <ResponsiveText variant="lg" color="text-gray-300">
              Large text - lg
            </ResponsiveText>
            <ResponsiveText variant="base" color="text-gray-300">
              Base text - base
            </ResponsiveText>
            <ResponsiveText variant="sm" color="text-gray-400">
              Small text - sm
            </ResponsiveText>
            <ResponsiveText variant="xs" color="text-gray-500">
              Extra small text - xs
            </ResponsiveText>
          </div>
        </ResponsiveCard>

        {/* Grid Test */}
        <ResponsiveCard variant="lg" className="mb-8">
          <ResponsiveText variant="3xl" weight="bold" color="text-white" className="mb-6">
            Grid System Test
          </ResponsiveText>
          
          <div className="space-y-8">
            {/* Auto-fit Grid */}
            <div>
              <ResponsiveText variant="xl" weight="semibold" color="text-white" className="mb-4">
                Auto-fit Grid (280px min)
              </ResponsiveText>
              <ResponsiveGrid variant="auto-fit" gap="md">
                {Array.from({ length: 6 }, (_, i) => (
                  <ResponsiveCard key={i} variant="md">
                    <ResponsiveText variant="lg" weight="bold" color="text-white">
                      Card {i + 1}
                    </ResponsiveText>
                    <ResponsiveText variant="sm" color="text-gray-300">
                      Auto-fit responsive card
                    </ResponsiveText>
                  </ResponsiveCard>
                ))}
              </ResponsiveGrid>
            </div>

            {/* Auto-fill Grid */}
            <div>
              <ResponsiveText variant="xl" weight="semibold" color="text-white" className="mb-4">
                Auto-fill Grid (300px min)
              </ResponsiveText>
              <ResponsiveGrid variant="auto-fill" gap="md">
                {Array.from({ length: 5 }, (_, i) => (
                  <ResponsiveCard key={i} variant="md">
                    <ResponsiveText variant="lg" weight="bold" color="text-white">
                      Card {i + 1}
                    </ResponsiveText>
                    <ResponsiveText variant="sm" color="text-gray-300">
                      Auto-fill responsive card
                    </ResponsiveText>
                  </ResponsiveCard>
                ))}
              </ResponsiveGrid>
            </div>

            {/* Multi-desktop Grid */}
            <div>
              <ResponsiveText variant="xl" weight="semibold" color="text-white" className="mb-4">
                Multi-desktop Grid (1→2→3→4 columns)
              </ResponsiveText>
              <ResponsiveGrid variant="multi-desktop" gap="md">
                {Array.from({ length: 8 }, (_, i) => (
                  <ResponsiveCard key={i} variant="md">
                    <ResponsiveText variant="lg" weight="bold" color="text-white">
                      Card {i + 1}
                    </ResponsiveText>
                    <ResponsiveText variant="sm" color="text-gray-300">
                      Multi-desktop responsive card
                    </ResponsiveText>
                  </ResponsiveCard>
                ))}
              </ResponsiveGrid>
            </div>
          </div>
        </ResponsiveCard>

        {/* Button Test */}
        <ResponsiveCard variant="lg" className="mb-8">
          <ResponsiveText variant="3xl" weight="bold" color="text-white" className="mb-6">
            Button System Test
          </ResponsiveText>
          
          <div className="space-y-6">
            <div>
              <ResponsiveText variant="xl" weight="semibold" color="text-white" className="mb-4">
                Button Variants
              </ResponsiveText>
              <div className="flex flex-wrap gap-4">
                <ResponsiveButton variant="primary" size="md">Primary</ResponsiveButton>
                <ResponsiveButton variant="secondary" size="md">Secondary</ResponsiveButton>
                <ResponsiveButton variant="outline" size="md">Outline</ResponsiveButton>
                <ResponsiveButton variant="ghost" size="md">Ghost</ResponsiveButton>
              </div>
            </div>

            <div>
              <ResponsiveText variant="xl" weight="semibold" color="text-white" className="mb-4">
                Button Sizes
              </ResponsiveText>
              <div className="flex flex-wrap items-center gap-4">
                <ResponsiveButton variant="primary" size="xs">XS</ResponsiveButton>
                <ResponsiveButton variant="primary" size="sm">SM</ResponsiveButton>
                <ResponsiveButton variant="primary" size="md">MD</ResponsiveButton>
                <ResponsiveButton variant="primary" size="lg">LG</ResponsiveButton>
                <ResponsiveButton variant="primary" size="xl">XL</ResponsiveButton>
              </div>
            </div>
          </div>
        </ResponsiveCard>

        {/* Spacing Test */}
        <ResponsiveCard variant="lg" className="mb-8">
          <ResponsiveText variant="3xl" weight="bold" color="text-white" className="mb-6">
            Spacing System Test
          </ResponsiveText>
          
          <div className="space-y-6">
            <div className="space-responsive-xs">
              <ResponsiveText variant="lg" weight="semibold" color="text-white">XS Spacing</ResponsiveText>
              <ResponsiveText variant="base" color="text-gray-300">This is extra small spacing</ResponsiveText>
              <ResponsiveText variant="base" color="text-gray-300">Between elements</ResponsiveText>
            </div>
            
            <div className="space-responsive-sm">
              <ResponsiveText variant="lg" weight="semibold" color="text-white">SM Spacing</ResponsiveText>
              <ResponsiveText variant="base" color="text-gray-300">This is small spacing</ResponsiveText>
              <ResponsiveText variant="base" color="text-gray-300">Between elements</ResponsiveText>
            </div>
            
            <div className="space-responsive-md">
              <ResponsiveText variant="lg" weight="semibold" color="text-white">MD Spacing</ResponsiveText>
              <ResponsiveText variant="base" color="text-gray-300">This is medium spacing</ResponsiveText>
              <ResponsiveText variant="base" color="text-gray-300">Between elements</ResponsiveText>
            </div>
            
            <div className="space-responsive-lg">
              <ResponsiveText variant="lg" weight="semibold" color="text-white">LG Spacing</ResponsiveText>
              <ResponsiveText variant="base" color="text-gray-300">This is large spacing</ResponsiveText>
              <ResponsiveText variant="base" color="text-gray-300">Between elements</ResponsiveText>
            </div>
          </div>
        </ResponsiveCard>

        {/* Breakpoint Test */}
        <ResponsiveCard variant="lg">
          <ResponsiveText variant="3xl" weight="bold" color="text-white" className="mb-6">
            Breakpoint Test
          </ResponsiveText>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <ResponsiveText variant="lg" weight="bold" color="text-cyan-400">320px</ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">Mobile</ResponsiveText>
            </div>
            <div className="glass-card p-4 text-center">
              <ResponsiveText variant="lg" weight="bold" color="text-blue-400">375px</ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">Mobile</ResponsiveText>
            </div>
            <div className="glass-card p-4 text-center">
              <ResponsiveText variant="lg" weight="bold" color="text-green-400">414px</ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">Mobile</ResponsiveText>
            </div>
            <div className="glass-card p-4 text-center">
              <ResponsiveText variant="lg" weight="bold" color="text-yellow-400">768px</ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">Tablet</ResponsiveText>
            </div>
            <div className="glass-card p-4 text-center">
              <ResponsiveText variant="lg" weight="bold" color="text-orange-400">1024px</ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">Laptop</ResponsiveText>
            </div>
            <div className="glass-card p-4 text-center">
              <ResponsiveText variant="lg" weight="bold" color="text-red-400">1280px</ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">Desktop</ResponsiveText>
            </div>
            <div className="glass-card p-4 text-center">
              <ResponsiveText variant="lg" weight="bold" color="text-purple-400">1440px</ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">Large</ResponsiveText>
            </div>
            <div className="glass-card p-4 text-center">
              <ResponsiveText variant="lg" weight="bold" color="text-pink-400">1920px+</ResponsiveText>
              <ResponsiveText variant="sm" color="text-gray-300">Ultrawide</ResponsiveText>
            </div>
          </div>
        </ResponsiveCard>
      </ResponsiveLayout>
    </div>
  );
}
