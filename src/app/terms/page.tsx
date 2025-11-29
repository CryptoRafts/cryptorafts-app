"use client";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen neo-blue-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Terms of Service
          </h1>
          <p className="text-white/70 text-lg">
            Last Updated: November 2025
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Introduction */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Welcome to Cryptorafts. These Terms of Service ("Terms") govern your access to and use of the Cryptorafts platform, including all related services, websites, and applications (collectively, the "Platform"). By using Cryptorafts, you agree to these Terms.
            </p>
          </div>

          {/* Acceptance of Terms */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">1. Acceptance of Terms</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              By accessing or using Cryptorafts, you confirm that you are at least 18 years old and have read, understood, and agreed to these Terms. If you do not agree, you may not use the Platform.
            </p>
          </div>

          {/* Platform Overview */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">2. Platform Overview</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Cryptorafts provides a blockchain-based ecosystem connecting startups, investors, exchanges, and influencers. Users can explore verified projects, engage in fundraising activities, and interact within a secure hybrid KYC/KYB-verified environment.
            </p>
          </div>

          {/* Account Registration */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">3. Account Registration</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Users must register and complete hybrid KYC/KYB verification (AI + blockchain validation). You agree to provide accurate, complete, and updated information and are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </div>

          {/* Use of Platform */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">4. Use of Platform</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-4">
              <li>Engage in fraudulent, illegal, or deceptive activities.</li>
              <li>Interfere with platform security or data integrity.</li>
              <li>Use automated systems or bots to access data without authorization.</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              Cryptorafts reserves the right to suspend or terminate accounts that violate these Terms.
            </p>
          </div>

          {/* Intellectual Property */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">5. Intellectual Property</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              All content, trademarks, and technologies on Cryptorafts are the property of Cryptorafts or its licensors. Users may not copy, modify, or distribute any content without permission.
            </p>
          </div>

          {/* Third-Party Services */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">6. Third-Party Services</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Cryptorafts may integrate third-party marketing agencies, blockchain services, and AI providers. We are not responsible for their content, policies, or actions.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">7. Disclaimer</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Cryptorafts does not provide investment advice. Users must conduct their own due diligence before engaging in any project or investment. The platform is provided "as is" without warranties of any kind.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">8. Limitation of Liability</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Cryptorafts, its affiliates, and partners shall not be liable for any direct or indirect damages arising from use, data loss, or service interruption.
            </p>
          </div>

          {/* Modifications */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">9. Modifications</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              We may update these Terms from time to time. Continued use after changes constitutes your acceptance of the revised Terms.
            </p>
          </div>

          {/* Contact */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">10. Contact</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              For any legal or support inquiries, please contact:
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              📩 <a href="mailto:support@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">support@cryptorafts.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

