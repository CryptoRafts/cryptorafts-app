"use client";

import Link from "next/link";

export default function Support() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Support Center</h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Get help with your Cryptorafts account, platform features, and technical issues.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">FAQ</h2>
          </div>
          <p className="text-white/70 mb-4">Find answers to common questions about the platform.</p>
          <Link href="/faq" className="btn btn-outline">View FAQ</Link>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Contact Us</h2>
          </div>
          <p className="text-white/70 mb-4">Get in touch with our support team for personalized help.</p>
          <Link href="/contact" className="btn btn-primary">Contact Support</Link>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Documentation</h2>
          </div>
          <p className="text-white/70 mb-4">Comprehensive guides and API documentation.</p>
          <Link href="/docs" className="btn btn-outline">View Docs</Link>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Status Page</h2>
          </div>
          <p className="text-white/70 mb-4">Check the current status of our services and systems.</p>
          <Link href="/status" className="btn btn-outline">Check Status</Link>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/10 text-center">
        <h3 className="text-xl font-semibold mb-2">Need Immediate Help?</h3>
        <p className="text-white/70 mb-4">
          For urgent issues or questions, contact us directly via email or join our Discord community.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a 
            href="mailto:support@cryptorafts.com" 
            className="btn btn-primary"
          >
            Email Support
          </a>
          <a 
            href="https://discord.gg/cryptorafts" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Join Discord
          </a>
        </div>
      </div>
    </div>
  );
}
