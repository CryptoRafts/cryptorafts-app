"use client";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen neo-blue-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Cryptorafts Documentation
          </h1>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Overview */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">1. Overview</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Cryptorafts is a unified Web3 ecosystem connecting founders, investors, exchanges, influencers, and IDO marketing agencies in one trusted platform.
            </p>
            <p className="text-white/90 text-lg leading-relaxed mt-4">
              We ensure transparency, security, and authenticity through AI automation and hybrid KYC/KYB verification, creating a safer space for real collaborations in crypto.
            </p>
          </div>

          {/* Core Concept */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">2. Core Concept</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Cryptorafts solves three key problems in the crypto industry:
            </p>
            <ul className="space-y-3 text-white/90 text-lg leading-relaxed list-disc list-inside">
              <li>Fake projects and scams — filtered by AI.</li>
              <li>Unverified participants — secured with hybrid verification.</li>
              <li>Scattered collaboration — unified under one dashboard.</li>
            </ul>
          </div>

          {/* How It Works */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">3. How It Works</h2>
            <ul className="space-y-4 text-white/90 text-lg leading-relaxed">
              <li><strong className="text-white">Founders</strong> verify projects, connect with investors, exchanges, and agencies.</li>
              <li><strong className="text-white">Investors</strong> access pre-verified, AI-filtered projects.</li>
              <li><strong className="text-white">Exchanges</strong> discover ready-to-list verified startups.</li>
              <li><strong className="text-white">Influencers & KOLs</strong> get matched with authentic projects.</li>
              <li><strong className="text-white">IDO Marketing Agencies</strong> manage campaigns directly through Cryptorafts.</li>
            </ul>
          </div>

          {/* Hybrid KYC/KYB Verification */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">4. Hybrid KYC/KYB Verification</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Our hybrid system ensures:
            </p>
            <ul className="space-y-3 text-white/90 text-lg leading-relaxed list-disc list-inside">
              <li>AI-driven off-chain checks for identity & business validation.</li>
              <li>On-chain hashed storage for privacy and compliance.</li>
              <li>No sensitive data is stored on-chain.</li>
              <li>AI flags fake entities before they onboard.</li>
            </ul>
          </div>

          {/* Key Features */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">5. Key Features</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white font-semibold">Feature</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">AI Project Filtering</td>
                    <td className="py-3 px-4 text-white/90">Automatically removes fake or low-quality projects.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">Verified Ecosystem</td>
                    <td className="py-3 px-4 text-white/90">All users go through hybrid verification.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">Deal Flow Dashboard</td>
                    <td className="py-3 px-4 text-white/90">Live view of verified fundraising and IDOs.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">Influencer & Agency Hub</td>
                    <td className="py-3 px-4 text-white/90">Connects projects with verified partners.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">AI Matching</td>
                    <td className="py-3 px-4 text-white/90">Auto-connects users based on goals and verification level.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Security */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">6. Security</h2>
            <ul className="space-y-3 text-white/90 text-lg leading-relaxed list-disc list-inside">
              <li>End-to-end encryption for all user data.</li>
              <li>On-chain hashing for proof of authenticity.</li>
              <li>Continuous AI monitoring for fraud detection.</li>
              <li>Role-based dashboards for secure collaboration.</li>
            </ul>
          </div>

          {/* Benefits */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">7. Benefits</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white font-semibold">User</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Benefit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">Founders</td>
                    <td className="py-3 px-4 text-white/90">Easy investor access & marketing partnerships.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">Investors</td>
                    <td className="py-3 px-4 text-white/90">Verified projects, transparent data.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">Exchanges</td>
                    <td className="py-3 px-4 text-white/90">Vetted listing-ready startups.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">Influencers</td>
                    <td className="py-3 px-4 text-white/90">Authentic collaboration opportunities.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-white font-medium">Agencies</td>
                    <td className="py-3 px-4 text-white/90">Centralized IDO & PR campaign management.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mission */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">8. Mission</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              To build the most trusted and intelligent Web3 ecosystem — empowering secure, verified, and AI-driven collaboration between all players in the crypto world.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-white/70 mb-6">
              Join the Cryptorafts ecosystem today
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

