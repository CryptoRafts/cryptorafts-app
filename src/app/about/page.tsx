"use client";

export default function AboutPage() {
  return (
    <div className="min-h-screen neo-blue-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            About Cryptorafts
          </h1>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Introduction */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <p className="text-white/90 text-lg leading-relaxed">
              Cryptorafts is an all-in-one blockchain ecosystem designed to connect and verify every player in the crypto space — from founders and investors to exchanges, influencers, and IDO marketing agencies — in one trusted platform.
            </p>
            <p className="text-white/90 text-lg leading-relaxed mt-4">
              We are solving one of the biggest challenges in Web3: trust and transparency. By combining hybrid verification systems, AI-driven analysis, and on-chain validation, Cryptorafts ensures that only authentic projects and verified participants thrive in the ecosystem.
            </p>
          </div>

          {/* Our Vision */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">Our Vision</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              To create a decentralized yet transparent crypto ecosystem where founders, investors, influencers, and exchanges can connect, collaborate, and grow safely — with AI ensuring credibility and blockchain ensuring proof.
            </p>
          </div>

          {/* How Cryptorafts Works */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-8">How Cryptorafts Works</h2>
            
            <div className="space-y-8">
              {/* For Founders */}
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">For Founders</h3>
                <p className="text-white/90 text-lg leading-relaxed mb-3">
                  Founders can list their crypto projects, undergo hybrid KYC/KYB verification, and access a global pool of verified investors, exchanges, and marketing partners.
                </p>
                <p className="text-white/90 text-lg leading-relaxed">
                  AI tools help founders prepare IDO campaigns, reach out to influencers, and connect directly with marketing agencies to boost exposure and fundraising potential.
                </p>
              </div>

              {/* For Investors & VCs */}
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">For Investors & VCs</h3>
                <p className="text-white/90 text-lg leading-relaxed mb-3">
                  Investors get verified project access through our filtered dashboard.
                </p>
                <p className="text-white/90 text-lg leading-relaxed">
                  AI-powered due diligence and hybrid KYB verification ensure only legitimate ventures are showcased — helping investors discover high-quality, scam-free opportunities before they launch.
                </p>
              </div>

              {/* For Exchanges */}
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">For Exchanges</h3>
                <p className="text-white/90 text-lg leading-relaxed">
                  Exchanges can discover vetted projects ready for listing or IDO participation.
                </p>
                <p className="text-white/90 text-lg leading-relaxed mt-3">
                  Cryptorafts connects exchanges with verified startups and marketing agencies, streamlining partnerships, listings, and co-promotional activities.
                </p>
              </div>

              {/* For Influencers & KOLs */}
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">For Influencers & KOLs</h3>
                <p className="text-white/90 text-lg leading-relaxed mb-3">
                  Influencers join for free and get matched with verified crypto projects based on audience fit and niche.
                </p>
                <p className="text-white/90 text-lg leading-relaxed">
                  Cryptorafts ensures each influencer is authentic through hybrid verification, ensuring that brands and projects connect only with real, valuable voices.
                </p>
              </div>

              {/* For IDO Marketing Agencies */}
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">For IDO Marketing Agencies</h3>
                <p className="text-white/90 text-lg leading-relaxed">
                  We onboard verified marketing agencies to collaborate with founders and exchanges.
                </p>
                <p className="text-white/90 text-lg leading-relaxed mt-3">
                  Projects can find trusted agencies to manage IDO campaigns, PR, influencer outreach, and token launch marketing — all within one secure platform.
                </p>
              </div>
            </div>
          </div>

          {/* Hybrid KYC/KYB Verification */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">Hybrid KYC/KYB Verification</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Our hybrid verification system blends AI-driven off-chain checks with on-chain hash storage.
            </p>
            <ul className="space-y-3 text-white/90 text-lg leading-relaxed list-disc list-inside">
              <li>Personal data is never exposed publicly.</li>
              <li>AI systems (Raft AI) review and score authenticity.</li>
              <li>Only non-sensitive hashed proofs are stored on-chain.</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed mt-4">
              This ensures maximum privacy, compliance, and trust across the ecosystem.
            </p>
          </div>

          {/* AI-Driven Filtering & Automation */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">AI-Driven Filtering & Automation</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-3">
              Cryptorafts uses Raft AI to analyze project data, team credibility, and market activity.
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              Our system automatically filters out suspicious projects, fake influencers, or non-compliant agencies — ensuring a high-quality experience for all verified members.
            </p>
          </div>

          {/* Our Mission */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              To build the most secure, transparent, and efficient bridge between crypto projects, investors, exchanges, influencers, and marketing agencies, empowering global collaboration under a single trusted platform.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Join the Ecosystem?
            </h2>
            <p className="text-white/70 mb-6">
              Start your journey with Cryptorafts today
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
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

