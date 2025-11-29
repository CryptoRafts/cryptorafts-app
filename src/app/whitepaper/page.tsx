"use client";

import Link from "next/link";

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen neo-blue-background py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-[0.3em] text-cyan-400 mb-3">
            CRYPTORAFTS WHITE PAPER
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
            BUILD. VERIFIED. PITCH. INVEST.
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            The AI-powered Web3 ecosystem for founders, investors, exchanges,
            launchpads, agencies, influencers, and communities — united under a
            single trust and growth infrastructure.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/api/documents/CRYPTORAFTS%20WHITE%20PAPER%20.pdf"
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download PDF
            </a>
            <Link
              href="/signup"
              className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
            >
              Join Cryptorafts
            </Link>
          </div>
        </div>

        <div className="space-y-10">
          {/* Abstract */}
          <section className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              1. Abstract
            </h2>
            <p className="text-white/85 leading-relaxed">
              Cryptorafts introduces a unified, AI-powered trust layer for Web3
              that solves fragmentation, misinformation, and verification
              challenges across the fundraising ecosystem. By combining machine
              learning, blockchain, and decentralized identity, Cryptorafts
              creates a secure environment where founders, investors, exchanges,
              launchpads, agencies, and influencers can collaborate with
              confidence. RaftAI — the core verification engine — delivers
              dynamic trust scoring, fraud detection, and continuous risk
              monitoring to make Web3 capital formation safer and more
              efficient.
            </p>
          </section>

          {/* Introduction */}
          <section className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              2. Introduction
            </h2>
            <p className="text-white/85 leading-relaxed mb-4">
              Web3 has unlocked an open, permissionless environment where
              anyone can build and launch new crypto-native products. But this
              openness has also amplified fraud, fake teams, unreliable data,
              and regulatory risk. Anonymous founders, non-standardized
              documentation, and siloed due diligence make it difficult for
              serious capital and institutional players to participate safely.
            </p>
            <p className="text-white/85 leading-relaxed">
              Guided by the principle{" "}
              <span className="font-semibold">
                &quot;BUILD. VERIFIED. PITCH. INVEST.&quot;
              </span>
              , Cryptorafts delivers role-based portals, AI-enhanced KYC/KYB,
              standardized project profiles, and real-time risk analytics to
              become the trust and collaboration layer for decentralized
              capital markets.
            </p>
          </section>

          {/* Market Problem */}
          <section className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              3. Market Problem
            </h2>
            <ul className="list-disc list-inside space-y-2 text-white/85 leading-relaxed">
              <li>
                <strong>Trust fragmentation:</strong> anonymous teams and
                unverifiable claims drive scams and rug pulls, costing the
                market billions of dollars every year.
              </li>
              <li>
                <strong>Data asymmetry:</strong> investors and exchanges rely on
                ad‑hoc pitch decks, messages, and spreadsheets instead of a
                standardized, verifiable data model.
              </li>
              <li>
                <strong>Fake engagement:</strong> botted social metrics and
                fabricated community numbers distort discovery and marketing
                decisions.
              </li>
              <li>
                <strong>Regulatory risk:</strong> inconsistent KYC/KYB and
                compliance practices slow growth and expose platforms to legal
                and reputational risk.
              </li>
            </ul>
          </section>

          {/* All‑in‑One Solution */}
          <section className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              4. The All‑in‑One Solution
            </h2>
            <p className="text-white/85 leading-relaxed mb-4">
              Cryptorafts consolidates verification, collaboration, and growth
              into one intelligent platform with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/85 leading-relaxed mb-4">
              <li>
                <strong>Role-based portals</strong> for founders, VCs,
                exchanges, launchpads, agencies, influencers, and communities.
              </li>
              <li>
                <strong>Automated escrow &amp; milestones</strong> to release
                capital only when verified deliverables are met.
              </li>
              <li>
                <strong>On‑chain project directory</strong> with KYC/KYB proofs,
                tokenomics, audits, and RaftAI trust scores.
              </li>
            </ul>
            <p className="text-white/80 leading-relaxed">
              This transforms today&apos;s fragmented landscape into a single,
              composable trust and dealflow fabric.
            </p>
          </section>

          {/* RaftAI */}
          <section className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              5. RaftAI – The Core Verification Engine
            </h2>
            <p className="text-white/85 leading-relaxed mb-4">
              RaftAI is a multi‑model engine (NLP, ML, CV) that automates
              due‑diligence and ongoing monitoring:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/85 leading-relaxed mb-4">
              <li>
                Real‑time <strong>KYC/KYB</strong> with liveness and sanction
                checks.
              </li>
              <li>
                <strong>Tokenomics analysis</strong> of distribution, vesting,
                and economic soundness.
              </li>
              <li>
                <strong>Document intelligence</strong> over whitepapers, pitch
                decks, and roadmaps.
              </li>
              <li>
                <strong>Dynamic trust index (0–100)</strong> that powers
                listings, exposure, and incentives.
              </li>
            </ul>
            <p className="text-white/80 leading-relaxed">
              RaftAI reduces manual review overhead by up to 90% while making
              screening more consistent, transparent, and explainable.
            </p>
          </section>

          {/* Roadmap & Governance */}
          <section className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              6. Roadmap &amp; Governance
            </h2>
            <p className="text-white/85 leading-relaxed mb-3">
              The white paper outlines a four‑phase rollout from RaftAI
              foundation and alpha testing through TGE, multi‑role onboarding,
              and a full public launch of all role‑based dashboards and
              verification flows.
            </p>
            <p className="text-white/85 leading-relaxed mb-3">
              After the $CRAFTS Token Generation Event, Cryptorafts transitions
              toward a DAO model where verified stakeholders can propose,
              vote on, and execute protocol upgrades, partnership programs, and
              risk policies through on‑chain governance.
            </p>
          </section>

          {/* Vision & Closing */}
          <section className="neo-glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              7. Vision &amp; Conclusion
            </h2>
            <p className="text-white/85 leading-relaxed mb-4">
              Cryptorafts aims to become the global standard for verification,
              transparency, and trust in decentralized capital markets — the
              &quot;trust layer&quot; that sits underneath fundraising, listings,
              campaigns, and community coordination across chains.
            </p>
            <p className="text-white/85 leading-relaxed">
              By fusing RaftAI, on‑chain identity, and role‑aware workflows,
              Cryptorafts moves Web3 from &quot;trust me&quot; to
              <span className="font-semibold"> provable trust</span> —
              delivering an environment where serious builders and serious
              capital can finally meet at scale.
            </p>
          </section>

          {/* Footer CTA */}
          <section className="neo-glass-card rounded-2xl p-8 border border-white/10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              BUILD. VERIFIED. PITCH. INVEST.
            </h2>
            <p className="text-white/75 mb-6">
              For partnership, fundraising, or ecosystem collaboration, contact
              us at{" "}
              <a
                href="mailto:business@cryptorafts.com"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                business@cryptorafts.com
              </a>{" "}
              or{" "}
              <a
                href="mailto:support@cryptorafts.com"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                support@cryptorafts.com
              </a>
              .
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/api/documents/CRYPTORAFTS%20WHITE%20PAPER%20.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Open White Paper (PDF)
              </a>
              <Link
                href="/contact"
                className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
              >
                Contact Team
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


