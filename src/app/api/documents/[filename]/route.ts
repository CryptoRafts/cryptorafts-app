import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

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

// Generate whitepaper PDF on-the-fly
async function generateWhitepaperPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      doc.on('end', () => {
        try {
          resolve(Buffer.concat(chunks));
        } catch (err) {
          console.error('Error concatenating PDF chunks:', err);
          reject(err);
        }
      });
      
      doc.on('error', (err: Error) => {
        console.error('PDF generation error:', err);
        reject(err);
      });
    
    // Title Page
    try {
      doc.fontSize(24).font('Helvetica-Bold');
      doc.text('CRYPTORAFTS', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18);
      doc.text('WHITE PAPER', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(16);
      doc.text('BUILD. VERIFIED. PITCH. INVEST.', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica');
      doc.text('AI-powered Web3 ecosystem designed to unite founders, investors, exchanges, launchpads, agencies, and communities within a single trust and growth infrastructure.', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(10);
      doc.text('WWW.CRYPTORAFTS.COM', { align: 'center' });
    
    doc.addPage();
    
    // Table of Contents
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('TABLE OF CONTENTS');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
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
    toc.forEach((item, index) => {
      doc.text(item, { indent: 20 });
      doc.moveDown(0.5);
    });
    
    doc.addPage();
    
    // Abstract
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('01 ABSTRACT');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('Cryptorafts introduces a unified, AI-powered trust layer for Web3, designed to solve fragmentation, misinformation, and verification challenges across the fundraising ecosystem. By combining machine learning, blockchain, and decentralized identity, Cryptorafts creates a secure environment where founders, investors, exchanges, and agencies can collaborate with confidence.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.text('Key innovations include AI-powered project filtering, dynamic trust scoring, and verified role-based dashboards that streamline discovery and collaboration. Cryptorafts ensures every project and participant passes identity verification and risk screening, allowing investors and partners to engage with confidence. Powered by the $CRAFTS token, the ecosystem aligns incentives and supports transparent, trusted participation.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.text('As Web3 matures, Cryptorafts positions itself as a foundational layer enabling compliant fundraising, safer interactions, and scalable growth across the decentralized ecosystem.', {
      align: 'justify',
      lineGap: 3
    });
    
    doc.addPage();
    
    // Introduction
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('02 INTRODUCTION');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('The rise of Web3 has opened a new era of decentralized innovation — an environment where anyone can build, launch, and scale without relying on intermediaries. But this openness also brings serious challenges: fraud, misinformation, verification gaps, and fragmented project data. These issues limit trust, slow decision-making, and expose investors, founders, and platforms to unnecessary risks.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.text('Cryptorafts is designed to solve these core problems by creating a unified, AI-powered ecosystem where every participant is verified, every project is transparent, and every interaction is secure. By combining AI-driven KYC/KYB, standardized project data, real-time checks, and structured role-based workflows, Cryptorafts establishes a trusted foundation for project launches, fundraising, and collaboration.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.text('Guided by the principle "BUILD. VERIFIED. PITCH. INVEST.", Cryptorafts introduces a new model of Web3 credibility — one where authenticity is provable, information is standardized, and opportunities flow efficiently between founders, investors, exchanges, IDOs, agencies, and influencers.', {
      align: 'justify',
      lineGap: 3
    });
    
    doc.addPage();
    
    // Market Problem
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('03 MARKET PROBLEM');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('The Web3 ecosystem, valued at over $2.5 trillion in market capitalization, remains fragmented and susceptible to exploitation despite its growth. Key challenges include:', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('• Trust Fragmentation:');
    doc.fontSize(11).font('Helvetica');
    doc.text('Anonymous founders and unverifiable claims lead to rampant scams, with $9.3 billion lost in 2024 and projections exceeding $5 billion for 2025.', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('• Data Asymmetry and Verification Inconsistencies:');
    doc.fontSize(11).font('Helvetica');
    doc.text('Investors rely on non-standardized data, resulting in misinformed decisions. Exchanges bear heavy risks from unvetted projects, with rug pulls costing nearly $95 million annually.', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('• Fake Engagement and Influencer Fraud:');
    doc.fontSize(11).font('Helvetica');
    doc.text('Botted social metrics and misrepresented portfolios deceive stakeholders, amplifying losses.', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('• Regulatory and Compliance Gaps:');
    doc.fontSize(11).font('Helvetica');
    doc.text('Varying KYC/KYB standards across platforms slow scalability and invite legal risks.', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.text('These issues not only deter institutional participation but also stifle retail confidence, limiting Web3\'s potential. Cryptorafts resolves them through standardized, AI-enhanced protocols that promote interoperability and security.', {
      align: 'justify',
      lineGap: 3
    });
    
    doc.addPage();
    
    // Solution
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('04 THE ALL IN ONE SOLUTION');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('Cryptorafts consolidates verification, collaboration, and growth into a singular, intelligent platform. It serves as a hub for all Web3 actors, ensuring secure, efficient interactions:', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('01 Role-Based Portals');
    doc.fontSize(11).font('Helvetica');
    doc.text('Tailored interfaces for Founders, Investors/VCs, Exchanges/Launchpads, Agencies & KOLs, and Communities.', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('02 Automated Escrow and Smart Contracts');
    doc.fontSize(11).font('Helvetica');
    doc.text('Blockchain-based escrow ensures fair transactions, releasing funds only upon milestone achievement.', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('03 Verified Project Directory');
    doc.fontSize(11).font('Helvetica');
    doc.text('An on-chain registry featuring KYC/KYB proofs, tokenomics audits, AI trust scores (0-100), and historical data. This holistic approach eliminates silos, fostering a self-sustaining ecosystem of verified growth.', { indent: 20, lineGap: 2 });
    
    doc.addPage();
    
    // RaftAI
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('05 RAFTAI: THE CORE VERIFICATION ENGINE');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('RaftAI is the heartbeat of Cryptorafts, an advanced AI system that automates due diligence and maintains ongoing trust monitoring.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Core Capabilities:');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('• Automated KYC/KYB: Real-time KYC/KYB with liveness detection and sanction screening', { indent: 20, lineGap: 2 });
    doc.moveDown(0.5);
    doc.text('• Tokenomics Evaluation: Analyzes distribution, vesting, and economic viability using ML models.', { indent: 20, lineGap: 2 });
    doc.moveDown(0.5);
    doc.text('• Document Intelligence: NLP for whitepaper originality, roadmap feasibility, and pitch deck analysis', { indent: 20, lineGap: 2 });
    doc.moveDown(0.5);
    doc.text('• Risk and Credibility Scoring: Dynamic indices based on on-chain behavior, social authenticity, and compliance.', { indent: 20, lineGap: 2 });
    doc.moveDown(0.5);
    doc.text('• Adaptive Learning: Refines algorithms via community feedback and verified outcomes.', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Trust Index:');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('A proprietary 0-100 score, stored on-chain, influencing staking rewards, listings, and partnerships. High scores unlock premium features, incentivizing integrity.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.text('RaftAI\'s multi-model architecture (NLP, ML, CV) ensures comprehensive, real-time insights, reducing manual efforts by up to 90%.', {
      align: 'justify',
      lineGap: 3
    });
    
    doc.addPage();
    
    // Roadmap
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('08 ROADMAP');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Phase 1: Foundation & Alpha (Q4 2025)');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('• Core RaftAI systems deployed', { indent: 20, lineGap: 2 });
    doc.text('• Hybrid KYC/KYB framework ready', { indent: 20, lineGap: 2 });
    doc.text('• Platform Alpha version completed for internal testing', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Phase 2: Fundraise & TGE (Q1 2026)');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('• Begin and close initial fundraising round', { indent: 20, lineGap: 2 });
    doc.text('• Complete $CRAFTS smart contract audits', { indent: 20, lineGap: 2 });
    doc.text('• Execute $CRAFTS Token Generation Event (TGE)', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Phase 3: User Onboarding (Q2 2026)');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('• Deploy MVP version of Cryptorafts platform', { indent: 20, lineGap: 2 });
    doc.text('• Activate core AI systems', { indent: 20, lineGap: 2 });
    doc.text('• Begin onboarding all user roles', { indent: 20, lineGap: 2 });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Phase 4: Full Platform Launch (Q3 2026)');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('• Official public launch of complete Cryptorafts platform', { indent: 20, lineGap: 2 });
    doc.text('• All features activated across every user role', { indent: 20, lineGap: 2 });
    doc.text('• Begin global user acquisition and marketing', { indent: 20, lineGap: 2 });
    
    doc.addPage();
    
    // Governance
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('09 GOVERNANCE AND DAO FRAMEWORK');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('Following the Token Generation Event (TGE), Cryptorafts will evolve into a decentralized autonomous organization (DAO) empowering the community to shape the platform\'s growth, policies, and partnerships through transparent, on-chain governance.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Governance Roles:');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('• Proposers: Submit strategic upgrades, integrations, and partnership proposals.', { indent: 20, lineGap: 2 });
    doc.text('• Voters: Participate in on-chain decision-making using $CRAFTS tokens.', { indent: 20, lineGap: 2 });
    doc.text('• Executors: Automatically implement approved proposals through audited smart contracts', { indent: 20, lineGap: 2 });
    
    doc.addPage();
    
    // Vision
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('10 VISION FOR THE FUTURE');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('Cryptorafts aspires to become the global standard for verification, transparency, and trust within decentralized capital markets. Its long-term vision is to establish a foundation where innovation, compliance, and credibility coexist seamlessly across the Web3 economy.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Strategic Roadmap Focus:');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text('• Regulatory Integration: Forge global partnerships with regulatory bodies', { indent: 20, lineGap: 2 });
    doc.text('• Intelligent Risk Infrastructure: Deliver real-time AI-driven risk assessment', { indent: 20, lineGap: 2 });
    doc.text('• Cross-Chain Expansion: Extend Cryptorafts\' trust protocol across multiple blockchains', { indent: 20, lineGap: 2 });
    doc.text('• AI-Verified Fundraising Standard: Lead a new era of decentralized fundraising', { indent: 20, lineGap: 2 });
    
    doc.addPage();
    
    // Conclusion
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('11 CONCLUSION');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('Cryptorafts is redefining the foundation of the Web3 economy by uniting technology, governance, and verification into a single, intelligent trust protocol.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.text('Powered by RaftAI, on-chain verification, and the $CRAFTS token, the ecosystem enables every participant from emerging startups to global institutions to engage in a transparent, data-driven environment where integrity and performance are inherently rewarded.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('BUILD. VERIFIED. PITCH. INVEST.', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text('Cryptorafts is more than a platform — it is the trust layer of the decentralized future, carrying Web3 toward an era of intelligent, secure, and verifiable innovation.', {
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown(3);
    doc.fontSize(10).text('CONTACT US', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text('Email: business@cryptorafts.com | support@cryptorafts.com', { align: 'center' });
    doc.fontSize(10).text('Website: www.cryptorafts.com', { align: 'center' });
    
    doc.end();
    } catch (err) {
      console.error('Error in PDF content generation:', err);
      reject(err);
    }
    } catch (err) {
      console.error('Error creating PDF document:', err);
      reject(err);
    }
  });
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
      // Generate PDF on-the-fly
      try {
        const pdfBuffer = await generateWhitepaperPDF();
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="CRYPTORAFTS-WHITE-PAPER.pdf"`,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (error: any) {
        console.error('❌ Error generating PDF:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name
        });
        return new NextResponse(`Error generating whitepaper PDF: ${error?.message || 'Unknown error'}`, { 
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
