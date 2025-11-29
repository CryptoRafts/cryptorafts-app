"use client";

export default function CookiesPolicyPage() {
  return (
    <div className="min-h-screen neo-blue-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Cookies Policy
          </h1>
          <p className="text-white/70 text-lg">
            Last Updated: November 2025
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Introduction */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <p className="text-white/90 text-lg leading-relaxed">
              This Cookies Policy explains how Cryptorafts uses cookies and similar technologies on its website and platform.
            </p>
          </div>

          {/* What Are Cookies */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">1. What Are Cookies</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Cookies are small text files stored on your device when you visit our website. They help us improve functionality, analyze usage, and provide a better user experience.
            </p>
          </div>

          {/* How We Use Cookies */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">2. How We Use Cookies</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              We use cookies for the following purposes:
            </p>
            <ul className="space-y-3 text-white/90 text-lg leading-relaxed list-disc list-inside">
              <li><strong className="text-white">Essential Cookies:</strong> Enable core features like security, login, and account access.</li>
              <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how users interact with our platform to improve performance.</li>
              <li><strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences.</li>
              <li><strong className="text-white">Marketing Cookies:</strong> Used to display relevant campaigns, including IDO marketing agency activities and partner promotions.</li>
            </ul>
          </div>

          {/* Third-Party Cookies */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">3. Third-Party Cookies</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Some cookies may be placed by trusted third parties such as analytics providers, ad networks, or marketing agencies integrated with Cryptorafts. These third parties follow their own privacy and cookie policies.
            </p>
          </div>

          {/* Managing Cookies */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">4. Managing Cookies</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              You can control or delete cookies through your browser settings. However, disabling cookies may affect your experience and limit certain platform functions.
            </p>
          </div>

          {/* Updates to This Policy */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">5. Updates to This Policy</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              We may update this Cookies Policy occasionally. Updates will be posted with a new "Last Updated" date at the top of this page.
            </p>
          </div>

          {/* Contact */}
          <div className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6">6. Contact</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              For questions about our cookie usage, contact us at:
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

