"use client";
import { NeonCyanIcon } from "@/components/icons/NeonCyanIcon";

export default function FeaturesPage() {
  const features = [
    {
      iconType: 'shield' as const,
      title: "KYC/KYB Verification",
      description: "AI-powered identity verification with blockchain-based credentials for secure onboarding.",
      color: "from-teal-500 to-cyan-500"
    },
    {
      iconType: 'chat' as const,
      title: "Smart Deal Rooms",
      description: "Private, encrypted communication channels with automated deal-flow management.",
      color: "from-green-500 to-emerald-500"
    },
    {
      iconType: 'chart' as const,
      title: "Analytics Dashboard",
      description: "Real-time insights into project performance, market trends, and investor engagement.",
      color: "from-purple-500 to-violet-500"
    },
    {
      iconType: 'dollar' as const,
      title: "Investment Pipeline",
      description: "Streamlined deal flow management for VCs with automated screening and due diligence.",
      color: "from-blue-500 to-indigo-500"
    },
    {
      iconType: 'globe' as const,
      title: "Exchange Listings",
      description: "Comprehensive listing management with compliance tracking and risk assessment.",
      color: "from-orange-500 to-red-500"
    },
    {
      iconType: 'lightbulb' as const,
      title: "IDO Launchpad",
      description: "Token sale management with whitelist automation and vesting schedules.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      iconType: 'user' as const,
      title: "Influencer Campaigns",
      description: "Campaign management with performance tracking and automated payouts.",
      color: "from-pink-500 to-rose-500"
    },
    {
      iconType: 'building' as const,
      title: "Agency Services",
      description: "Lead management and project collaboration tools for marketing agencies.",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen neo-blue-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Platform Features
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Enterprise-grade infrastructure for crypto innovation across all ecosystem participants
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="neo-glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <NeonCyanIcon type={feature.iconType} size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-white/70 mb-6">
              Join thousands of crypto professionals already using our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium"
              >
                Get Started
              </a>
              <a
                href="/contact"
                className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
