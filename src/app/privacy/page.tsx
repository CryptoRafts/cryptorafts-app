"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen neo-blue-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Cryptorafts Privacy Policy
          </h1>
          <p className="text-white/70 text-lg">
            Last Updated: November 2025
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Introduction */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">1. Introduction</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Welcome to Cryptorafts, a Web3 platform deployed on <strong className="text-white">BNB Smart Chain (BSC)</strong>.
            </p>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform and related services on the <strong className="text-white">BNB Chain ecosystem</strong>.
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              By using Cryptorafts, you agree to the terms outlined in this policy.
            </p>
          </div>

          {/* Information We Collect */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">2. Information We Collect</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              We collect limited information necessary to operate securely and effectively.
            </p>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Depending on your role (Founder, Investor, Exchange, Influencer, or Agency), we may collect:
            </p>
            
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">a. Account Information</h3>
                <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside">
                  <li>Name, email address, username, and password.</li>
                  <li>Public business information (for KYB).</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">b. Verification Data (Hybrid KYC/KYB)</h3>
                <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside">
                  <li>Limited identity or business verification data for authentication purposes.</li>
                  <li>Verification is handled off-chain through AI-powered systems.</li>
                  <li>Only hashed proofs of verification are stored on-chain on <strong className="text-white">BNB Smart Chain (BSC)</strong>.</li>
                  <li>No sensitive personal or business documents are ever made public.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">c. Platform Usage Data</h3>
                <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside">
                  <li>Login logs, session activity, and device information (IP, browser type).</li>
                  <li>Analytics for improving platform performance.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">3. How We Use Your Information</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-4">
              <li>Verify user and project authenticity through hybrid KYC/KYB.</li>
              <li>Improve platform performance and AI-based risk scoring.</li>
              <li>Enable secure communication between verified users.</li>
              <li>Prevent fraud, scams, or suspicious activity.</li>
              <li>Comply with regulatory and anti-money laundering (AML) standards.</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed font-semibold">
              We never sell or rent your personal information to third parties.
            </p>
          </div>

          {/* Data Storage & Security */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">4. Data Storage & Security</h2>
            <ul className="space-y-3 text-white/90 text-lg leading-relaxed list-disc list-inside">
              <li><strong className="text-white">Hybrid Model:</strong> Sensitive data stays off-chain (AI verification servers), while hashed proofs are stored on-chain on <strong className="text-white">BNB Smart Chain (BSC)</strong> for transparency and immutability.</li>
              <li><strong className="text-white">BNB Chain Deployment:</strong> All on-chain data storage and smart contract operations are deployed on <strong className="text-white">BNB Smart Chain (BSC)</strong> - Chain ID: 56, leveraging BSC's low gas costs and high performance.</li>
              <li><strong className="text-white">Encryption:</strong> All data is protected using AES-256 encryption.</li>
              <li><strong className="text-white">Access Control:</strong> Only verified users and authorized staff can access restricted areas.</li>
              <li><strong className="text-white">No Raw Data On-Chain:</strong> We do not store images, IDs, or documents on the blockchain. Only hashed and salted verification proofs are stored on <strong className="text-white">BNB Smart Chain</strong>.</li>
            </ul>
          </div>

          {/* Data Sharing */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">5. Data Sharing</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              We may share limited, non-sensitive data only in the following cases:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-4">
              <li>With third-party verification partners to confirm authenticity.</li>
              <li>With regulatory authorities if legally required.</li>
              <li>With AI risk systems for continuous monitoring and fraud detection.</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              Every partner must comply with our data privacy and security standards.
            </p>
          </div>

          {/* Cookies & Analytics */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">6. Cookies & Analytics</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Cryptorafts uses cookies to:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-4">
              <li>Remember your preferences.</li>
              <li>Analyze website traffic.</li>
              <li>Enhance your user experience.</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              You can control cookies through your browser settings at any time.
            </p>
          </div>

          {/* Your Rights */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">7. Your Rights</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-4">
              <li>Access, correct, or delete your account data.</li>
              <li>Request verification of your stored hashed identity.</li>
              <li>Withdraw consent and deactivate your account.</li>
              <li>Request data export in machine-readable form.</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              For any privacy-related requests, contact: <a href="mailto:support@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">support@cryptorafts.com</a>
            </p>
          </div>

          {/* Data Retention */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">8. Data Retention</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              We retain user data only as long as necessary for:
            </p>
            <ul className="space-y-2 text-white/90 text-lg leading-relaxed list-disc list-inside mb-4">
              <li>Compliance with legal or verification purposes.</li>
              <li>Security and dispute resolution.</li>
              <li>Platform integrity and fraud prevention.</li>
            </ul>
            <p className="text-white/90 text-lg leading-relaxed">
              When no longer required, data is permanently deleted or anonymized.
            </p>
          </div>

          {/* International Users */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">9. International Users</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              Cryptorafts operates globally.
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              Your data may be processed in multiple countries under strict security protocols that comply with international privacy standards (GDPR, ISO/IEC 27001).
            </p>
          </div>

          {/* Updates to This Policy */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">10. Updates to This Policy</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              We may update this Privacy Policy from time to time.
            </p>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              All updates will be published on this page with a revised "Last Updated" date.
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              We encourage users to review this policy periodically.
            </p>
          </div>

          {/* Contact Us */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">11. Contact Us</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact us:
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              📧 <a href="mailto:support@cryptorafts.com" className="text-blue-400 hover:text-blue-300 underline">support@cryptorafts.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

