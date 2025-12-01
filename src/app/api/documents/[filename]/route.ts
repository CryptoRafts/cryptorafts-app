import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Check if this is a whitepaper request
function isWhitepaperRequest(filename: string, decodedFilename: string): boolean {
  const whitepaperKeywords = ['whitepaper', 'white paper', 'white-paper', 'CRYPTORAFTS WHITE PAPER'];
  const lowerFilename = filename.toLowerCase();
  const lowerDecoded = decodedFilename.toLowerCase();
  
  return whitepaperKeywords.some(keyword => 
    lowerFilename.includes(keyword.toLowerCase()) || 
    lowerDecoded.includes(keyword.toLowerCase())
  );
}

// Generate whitepaper PDF on-the-fly using jsPDF (serverless-friendly, no font files needed)
async function generateWhitepaperPDF(): Promise<Buffer> {
  try {
    // Create PDF document (letter size, portrait, mm units)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    // Helper function to add text with word wrapping and return height used
    const addText = (text: string, x: number, y: number, fontSize: number, maxWidth?: number, align: 'left' | 'center' | 'right' = 'left'): number => {
      doc.setFontSize(fontSize);
      if (maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y, { align });
        return lines.length * (fontSize * 0.35); // Approximate line height
      } else {
        doc.text(text, x, y, { align });
        return fontSize * 0.35;
      }
    };
    
    let yPos = 20;
    const pageWidth = 216; // Letter width in mm
    const pageHeight = 279; // Letter height in mm
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const lineHeight = 7; // Standard line height in mm
    
    // Title Page
    yPos += addText('CRYPTORAFTS', margin, yPos, 24, contentWidth, 'center');
    yPos += 10;
    yPos += addText('WHITE PAPER', margin, yPos, 18, contentWidth, 'center');
    yPos += 15;
    yPos += addText('BUILD. VERIFIED. PITCH. INVEST.', margin, yPos, 16, contentWidth, 'center');
    yPos += 12;
    yPos += addText('AI-powered Web3 ecosystem designed to unite founders, investors, exchanges, launchpads, agencies, and communities within a single trust and growth infrastructure.', margin, yPos, 12, contentWidth, 'center');
    yPos += 20;
    addText('WWW.CRYPTORAFTS.COM', margin, yPos, 10, contentWidth, 'center');
    
    doc.addPage();
    yPos = margin;
    
    // Table of Contents
    yPos += addText('TABLE OF CONTENTS', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    doc.setFontSize(12);
    const toc = [
      '01 Abstract',
      '02 Introduction',
      '03 Market Problem',
      '04 The All in One Solution',
      '05 RaftAI: The Core Verification Engine',
      '06 Platform Features',
      '07 Platform Comparison',
      '08 Roadmap',
      '09 Governance and DAO Framework',
      '10 Vision for the Future',
      '11 Conclusion'
    ];
    toc.forEach((item) => {
      doc.text(item, margin + 10, yPos);
      yPos += lineHeight;
    });
    
    doc.addPage();
    yPos = margin;
    
    // Abstract
    yPos += addText('01 ABSTRACT', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('Cryptorafts introduces a unified, AI-powered trust layer for Web3, designed to solve fragmentation, misinformation, and verification challenges across the fundraising ecosystem. By combining machine learning, blockchain, and decentralized identity, Cryptorafts creates a secure environment where founders, investors, exchanges, and agencies can collaborate with confidence.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Key innovations include AI-powered project filtering, dynamic trust scoring, and verified role-based dashboards that streamline discovery and collaboration. Cryptorafts ensures every project and participant passes identity verification and risk screening, allowing investors and partners to engage with confidence. Powered by the $CRAFTS token, the ecosystem aligns incentives and supports transparent, trusted participation.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('As Web3 matures, Cryptorafts positions itself as a foundational layer enabling compliant fundraising, safer interactions, and scalable growth across the decentralized ecosystem.', margin, yPos, 11, contentWidth, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // Introduction
    yPos += addText('02 INTRODUCTION', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('The rise of Web3 has opened a new era of decentralized innovation — an environment where anyone can build, launch, and scale without relying on intermediaries. But this openness also brings serious challenges: fraud, misinformation, verification gaps, and fragmented project data. These issues limit trust, slow decision-making, and expose investors, founders, and platforms to unnecessary risks.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Cryptorafts is designed to solve these core problems by creating a unified, AI-powered ecosystem where every participant is verified, every project is transparent, and every interaction is secure. By combining AI-driven KYC/KYB, standardized project data, real-time checks, and structured role-based workflows, Cryptorafts establishes a trusted foundation for project launches, fundraising, and collaboration.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Guided by the principle "BUILD. VERIFIED. PITCH. INVEST.", Cryptorafts introduces a new model of Web3 credibility — one where authenticity is provable, information is standardized, and opportunities flow efficiently between founders, investors, exchanges, IDOs, agencies, and influencers.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Through decentralized identity layers, automated verification, and smart contract enhanced processes, Cryptorafts strengthens the entire Web3 ecosystem, enabling safer growth, better decision making, and a more reliable pathway from idea to investment.', margin, yPos, 11, contentWidth, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // Market Problem
    yPos += addText('03 MARKET PROBLEM', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('The Web3 ecosystem, valued at over $2.5 trillion in market capitalization, remains fragmented and susceptible to exploitation despite its growth. Key challenges include:', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('• Trust Fragmentation: Anonymous founders and unverifiable claims lead to rampant scams, with $9.3 billion lost in 2024 and projections exceeding $5 billion for 2025.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Data Asymmetry and Verification Inconsistencies: Investors rely on non-standardized data, resulting in misinformed decisions. Exchanges bear heavy risks from unvetted projects, with rug pulls costing nearly $95 million annually.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Fake Engagement and Influencer Fraud: Botted social metrics and misrepresented portfolios deceive stakeholders, amplifying losses.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Regulatory and Compliance Gaps: Varying KYC/KYB standards across platforms slow scalability and invite legal risks.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 8;
    yPos += addText('These issues not only deter institutional participation but also stifle retail confidence, limiting Web3\'s potential. Cryptorafts resolves them through standardized, AI-enhanced protocols that promote interoperability and security.', margin, yPos, 11, contentWidth, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // Solution
    yPos += addText('04 THE ALL IN ONE SOLUTION', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('Cryptorafts consolidates verification, collaboration, and growth into a singular, intelligent platform. It serves as a hub for all Web3 actors, ensuring secure, efficient interactions:', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('01 Role-Based Portals', margin, yPos, 11, contentWidth, 'left');
    yPos += 6;
    yPos += addText('Tailored interfaces for:', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Founders: AI-assisted KYC, pitch creation, and direct VC/IDO connections.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Investors/VCs: Access to AI-scored, verified projects with risk insights.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Exchanges/Launchpads: Pre-vetted project onboarding with compliance packs.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Agencies & KOLs: Escrow-backed campaigns and authenticity checks.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Communities: Transparent directories of trusted opportunities.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('02 Automated Escrow and Smart Contracts', margin, yPos, 11, contentWidth, 'left');
    yPos += 6;
    yPos += addText('Blockchain-based escrow ensures fair transactions, releasing funds only upon milestone achievement.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 8;
    yPos += addText('03 Verified Project Directory', margin, yPos, 11, contentWidth, 'left');
    yPos += 6;
    yPos += addText('An on-chain registry featuring KYC/KYB proofs, tokenomics audits, AI trust scores (0-100), and historical data. This holistic approach eliminates silos, fostering a self-sustaining ecosystem of verified growth.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // RaftAI
    yPos += addText('05 RAFTAI: THE CORE VERIFICATION ENGINE', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('RaftAI is the heartbeat of Cryptorafts, an advanced AI system that automates due diligence and maintains ongoing trust monitoring.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Core Capabilities', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Automated KYC/KYB - Real-time KYC/KYB with liveness detection and sanction screening', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Tokenomics Evaluation: Analyzes distribution, vesting, and economic viability using ML models.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Document Intelligence: NLP for whitepaper originality, roadmap feasibility, and pitch deck analysis', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Risk and Credibility Scoring: Dynamic indices based on on-chain behavior, social authenticity, and compliance.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Adaptive Learning: Refines algorithms via community feedback and verified outcomes.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('Trust Index', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('A proprietary 0-100 score, stored on-chain, influencing staking rewards, listings, and partnerships. High scores unlock premium features, incentivizing integrity.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('RaftAI\'s multi-model architecture (NLP, ML, CV) ensures comprehensive, real-time insights, reducing manual efforts by up to 90%.', margin, yPos, 11, contentWidth, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // Platform Features
    yPos += addText('06 PLATFORM FEATURES', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('Cryptorafts offers robust tools across user segments', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Startup/Founder Features:', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Hybrid KYC/KYB integration.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• AI generated project profiles (team, tokenomics, roadmap).', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Pitch/whitepaper analysis with feasibility scores.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Premium boosting for visibility.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('VC/Investor Features:', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• KYB verification & identity screening', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Hybrid verification (AI + human review)', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Market intelligence dashboard', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Project milestone tracking', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• AI based relevance scoring', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('Influencer/KOL Features:', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Engagement authenticity verification (bot detection).', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Niche-matched campaigns with KPI tracking.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Scam protection filters.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('Exchange & Agency Features:', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Verified onboarding pipelines.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Compliance support and quality filtering.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Launchpad tools for IDOs.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('Additional ecosystem tools include AI fundraising rooms, partner marketplaces, and Web3 identity passports (in development).', margin, yPos, 11, contentWidth, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // Platform Comparison
    yPos += addText('07 PLATFORM COMPARISON', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('Cryptorafts delivers a unified, intelligence driven fundraising infrastructure unmatched in the market.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Capability Comparison:', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• AI Project Analysis & Scoring: Cryptorafts ✓ | Others ×', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• AI Review of Key Documents: Cryptorafts ✓ | Others ×', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Secure On-Chain KYC/KYB (hashed & salted): Cryptorafts ✓ | Others ×', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Verified Stakeholder Network: Cryptorafts ✓ | Others ×', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Smart Matchmaking System: Cryptorafts ✓ | Others ×', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Complete Fundraising Stack: Cryptorafts ✓ | Others ×', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• All-in-one solution: Cryptorafts ✓ | Others ×', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('We Are Sorry - No Other Platform Offers A Complete All In One Solution Like Cryptorafts', margin, yPos, 11, contentWidth, 'center');
    
    doc.addPage();
    yPos = margin;
    
    // Roadmap
    yPos += addText('08 ROADMAP', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('Phase 1: Foundation & Alpha (Q4 2025)', margin, yPos, 12, contentWidth, 'left');
    yPos += 6;
    yPos += addText('• Core RaftAI systems deployed.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Hybrid KYC/KYB framework ready.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Platform Alpha version completed for internal testing.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Fraud detection & identity scoring activated.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• All official social channels launched.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• On-chain testing for proofs and document hashing completed.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 8;
    yPos += addText('Phase 2: Fundraise & TGE (Q1 2026)', margin, yPos, 12, contentWidth, 'left');
    yPos += 6;
    yPos += addText('• Begin and close the initial fundraising round with VCs and strategic partners.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Finalize tokenomics, allocations, and utility framework.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Complete $CRAFTS smart contract audits.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Execute the $CRAFTS Token Generation Event (TGE).', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Deploy the token and activate the on-chain identity layer.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 8;
    yPos += addText('Phase 3: User Onboarding (Q2 2026)', margin, yPos, 12, contentWidth, 'left');
    yPos += 6;
    yPos += addText('• Deploy the MVP version of the Cryptorafts platform.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Activate core AI systems for project intelligence, document evaluation, and verification.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Enable hybrid KYC/KYB, fraud detection, and on-chain identity proofs.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Begin onboarding all user roles: founders, VCs, influencers, exchanges, and partners.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 8;
    yPos += addText('Phase 4: Full Platform Launch (Q3 2026)', margin, yPos, 12, contentWidth, 'left');
    yPos += 6;
    yPos += addText('• Official public launch of the complete Cryptorafts platform.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• All features activated across every user role.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Release of full dashboards, scoring systems, and on-chain verification modules.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Begin global user acquisition, marketing, and partnership expansion.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Open platform for worldwide project submissions and investor participation.', margin + 10, yPos, 11, contentWidth - 10, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // Governance
    yPos += addText('09 GOVERNANCE AND DAO FRAMEWORK', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('Following the Token Generation Event (TGE), Cryptorafts will evolve into a decentralized autonomous organization (DAO) empowering the community to shape the platform\'s growth, policies, and partnerships through transparent, on-chain governance.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Governance Roles:', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Proposers - Submit strategic upgrades, integrations, and partnership proposals.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Voters - Participate in on-chain decision making using $CRAFTS tokens to approve or reject initiatives.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Executors - Automatically implement approved proposals through audited smart contracts', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('Governance Objectives:', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Uphold transparency, accountability, and fairness across all operations.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Safeguard ecosystem integrity, stability, and long term sustainability.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Distribute decision making power equitably among verified, contributing participants.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('DAO operations utilize a multi-signature and smart contract based governance model, minimizing human intervention while ensuring immutability, security, and verifiable execution.', margin, yPos, 11, contentWidth, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // Vision
    yPos += addText('10 VISION FOR THE FUTURE', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('Cryptorafts aspires to become the global standard for verification, transparency, and trust within decentralized capital markets. Its long-term vision is to establish a foundation where innovation, compliance, and credibility coexist seamlessly across the Web3 economy.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Strategic Roadmap Focus:', margin + 10, yPos, 12, contentWidth - 10, 'left');
    yPos += 6;
    yPos += addText('• Regulatory Integration - Forge global partnerships with regulatory bodies and integrate with leading compliance and financial intelligence APIs.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Intelligent Risk Infrastructure - Deliver real-time AI-driven risk assessment and compliance analytics for investors, exchanges, and institutions.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• Cross-Chain Expansion - Extend Cryptorafts\' trust protocol across multiple blockchains to enable interoperable and borderless project verification.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 6;
    yPos += addText('• AI-Verified Fundraising Standard - Lead a new era of decentralized fundraising defined by authenticity, transparency, and institutional-grade assurance.', margin + 15, yPos, 11, contentWidth - 15, 'left');
    yPos += 8;
    yPos += addText('Cryptorafts envisions a future where trust is verifiable, opportunity is inclusive, and every participant contributes to a transparent and intelligent Web3 ecosystem.', margin, yPos, 11, contentWidth, 'left');
    
    doc.addPage();
    yPos = margin;
    
    // Conclusion
    yPos += addText('11 CONCLUSION', margin, yPos, 16, contentWidth, 'left');
    yPos += 10;
    yPos += addText('Cryptorafts is redefining the foundation of the Web3 economy by uniting technology, governance, and verification into a single, intelligent trust protocol.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Powered by RaftAI, on-chain verification, and the $CRAFTS token, the ecosystem enables every participant from emerging startups to global institutions to engage in a transparent, data-driven environment where integrity and performance are inherently rewarded.', margin, yPos, 11, contentWidth, 'left');
    yPos += 8;
    yPos += addText('Pitch. Invest. Build. Verify.', margin, yPos, 11, contentWidth, 'center');
    yPos += 8;
    yPos += addText('Cryptorafts is more than a platform — it is the trust layer of the decentralized future, carrying Web3 toward an era of intelligent, secure, and verifiable innovation.', margin, yPos, 11, contentWidth, 'left');
    
    doc.addPage();
    yPos = margin;
    
    yPos += addText('BUILD. VERIFIED. PITCH. INVEST.', margin, yPos, 16, contentWidth, 'center');
    yPos += 15;
    yPos += addText('CONTACT US', margin, yPos, 12, contentWidth, 'center');
    yPos += 8;
    yPos += addText('Email', margin, yPos, 11, contentWidth, 'center');
    yPos += 6;
    yPos += addText('Business@cryptorafts.com', margin, yPos, 11, contentWidth, 'center');
    yPos += 6;
    yPos += addText('support@cryptorafts.com', margin, yPos, 11, contentWidth, 'center');
    yPos += 8;
    yPos += addText('Website', margin, yPos, 11, contentWidth, 'center');
    yPos += 6;
    yPos += addText('www.cryptorafts.com', margin, yPos, 11, contentWidth, 'center');
    yPos += 12;
    addText('#CRYPTORAFTS', margin, yPos, 10, contentWidth, 'center');
    
    // Return PDF as Buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Decode URL-encoded filename
    const decodedFilename = decodeURIComponent(filename);
    
    // Check if this is a whitepaper request
    if (isWhitepaperRequest(filename, decodedFilename)) {
      // Serve the actual PDF file from public directory
      // Try multiple possible paths for different environments
      const publicDir = join(process.cwd(), 'public');
      const possiblePaths = [
        join(publicDir, 'CRYPTORAFTS WHITE PAPER .pdf'),
        join(process.cwd(), 'CRYPTORAFTS WHITE PAPER .pdf'),
        join(publicDir, 'CRYPTORAFTS WHITE PAPER.pdf'),
      ];
      
      let whitepaperPath: string | null = null;
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          whitepaperPath = path;
          break;
        }
      }
      
      // Check if the actual PDF file exists
      if (!whitepaperPath) {
        console.error('❌ Whitepaper PDF not found. Tried paths:', possiblePaths);
        return new NextResponse('Whitepaper PDF file not found. Please ensure CRYPTORAFTS WHITE PAPER .pdf exists in the public directory.', { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
          }
        });
      }
      
      try {
        console.log('✅ Serving whitepaper from:', whitepaperPath);
        const fileBuffer = await readFile(whitepaperPath);
        console.log('✅ PDF file size:', fileBuffer.length, 'bytes');
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="CRYPTORAFTS WHITE PAPER .pdf"',
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch (error: any) {
        console.error('❌ Error reading whitepaper PDF file:', error);
        return new NextResponse(`Error reading whitepaper PDF: ${error?.message || 'Unknown error'}`, { 
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          }
        });
      }
    }
    
    // For other documents, try to find the file
    const documentsDir = join(process.cwd(), 'public', 'documents');
    const publicDir = join(process.cwd(), 'public');
    
    // Map of available documents (legacy support)
    const documents = {
      'pitch-deck.pdf': 'pitch-deck-sample.pdf',
      'executive-summary.pdf': 'executive-summary-sample.pdf',
      'whitepaper.pdf': 'whitepaper-sample.pdf',
      'technical-summary.pdf': 'technical-summary-sample.pdf',
      'ai-analysis-report.pdf': 'ai-analysis-report-sample.pdf',
    };
    
    // Try to get mapped filename first, otherwise use the decoded filename directly
    let actualFilename = documents[filename as keyof typeof documents] || decodedFilename;
    
    // Try multiple possible filenames in both documents directory and public root
    const possibleFilenames = [
      actualFilename,
      decodedFilename,
      filename,
    ];
    
    let filePath: string | null = null;
    let foundFilename: string | null = null;
    
    // Try to find the file in documents directory first
    for (const possibleFilename of possibleFilenames) {
      const testPath = join(documentsDir, possibleFilename);
      if (existsSync(testPath)) {
        filePath = testPath;
        foundFilename = possibleFilename;
        break;
      }
    }
    
    // If not found in documents, try public root
    if (!filePath) {
      for (const possibleFilename of possibleFilenames) {
        const testPath = join(publicDir, possibleFilename);
        if (existsSync(testPath)) {
          filePath = testPath;
          foundFilename = possibleFilename;
          break;
        }
      }
    }
    
    if (!filePath || !foundFilename) {
      return new NextResponse('Document not found. Please ensure the PDF file is placed in the public/documents directory.', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }
    
    try {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${decodedFilename}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return new NextResponse('Error reading document file', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }
  } catch (error) {
    console.error('Error serving document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
