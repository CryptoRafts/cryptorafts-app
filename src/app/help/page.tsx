"use client";

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen neo-blue-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Help Center – Business Support
          </h1>
          <p className="text-white/70 text-lg max-w-3xl mx-auto">
            Welcome to the Cryptorafts Help Center — your gateway to seamless support for all business-related inquiries.
          </p>
        </div>

        {/* Introduction */}
        <div className="neo-glass-card rounded-2xl p-8 border border-white/10 mb-12">
          <p className="text-white/90 text-lg leading-relaxed">
            At Cryptorafts, we're dedicated to providing complete assistance to startups, investors, IDO marketing agencies, exchanges, and influencers using our platform.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Startup Support */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">1. Startup Support</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              We help project founders with:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-6">
              <li>Platform onboarding and verification (Hybrid KYC/KYB)</li>
              <li>Project listing and visibility setup</li>
              <li>Connection with verified investors, exchanges, and marketing agencies</li>
              <li>Guidance on preparing for fundraising, IDOs, and partnership opportunities</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              📩 <a href="mailto:startup@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">startup@cryptorafts.com</a>
            </p>
          </div>

          {/* Investor & VC Support */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">2. Investor & VC Support</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              We assist investors with:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-6">
              <li>Secure verification and onboarding</li>
              <li>Access to filtered, verified projects</li>
              <li>Portfolio tracking and deal flow updates</li>
              <li>Direct communication with project teams</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              📩 <a href="mailto:investor@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">investor@cryptorafts.com</a>
            </p>
          </div>

          {/* Exchange Support */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">3. Exchange Support</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              For exchanges partnering or listing projects through Cryptorafts:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-6">
              <li>Verified project onboarding</li>
              <li>Marketing and deal flow integration</li>
              <li>Dashboard support for active listings</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              📩 <a href="mailto:exchange@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">exchange@cryptorafts.com</a>
            </p>
          </div>

          {/* IDO Marketing Agency Support */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">4. IDO Marketing Agency Support</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              For agencies collaborating with Cryptorafts:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-6">
              <li>Project promotion tools</li>
              <li>Campaign data and analytics</li>
              <li>Direct communication with verified startups and investors</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              📩 <a href="mailto:agency@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">agency@cryptorafts.com</a>
            </p>
          </div>

          {/* Influencer Support */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">5. Influencer Support</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              For influencers and KOLs joining our verified influencer network:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-6">
              <li>Profile verification and onboarding</li>
              <li>Access to real, filtered projects</li>
              <li>Partnership and campaign coordination</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              📩 <a href="mailto:influencer@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">influencer@cryptorafts.com</a>
            </p>
          </div>

          {/* General Help & Technical Support */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">6. General Help & Technical Support</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              For all general questions or platform issues:
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              📩 <a href="mailto:support@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">support@cryptorafts.com</a>
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Need More Help?
            </h2>
            <p className="text-white/70 mb-6">
              Check out our documentation or contact us directly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/documentation"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium"
              >
                View Documentation
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

