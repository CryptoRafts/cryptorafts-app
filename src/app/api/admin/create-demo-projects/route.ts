export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, initAdmin } from "@/server/firebaseAdmin";
import { getApps } from "firebase-admin/app";

export async function POST(req: NextRequest) {
  try {
    // Initialize Firebase Admin
    const apps = getApps();
    if (apps.length === 0) {
      const initResult = initAdmin();
      if (!initResult) {
        console.error('❌ [DEMO-PROJECTS] Failed to initialize Firebase Admin');
        return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 503 });
      }
    } else {
      if (!getAdminDb() || !getAdminAuth()) {
        initAdmin();
      }
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    if (!auth || !db) {
      console.error('❌ [DEMO-PROJECTS] Firebase Admin services not available');
      return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error: any) {
      console.error('❌ [DEMO-PROJECTS] Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const projectsRef = db.collection('projects');

    // First, delete old demo projects
    const oldDemoNames = ['CryptoSwap Protocol', 'MetaVerse Gaming Platform'];
    const oldSnapshot = await projectsRef.where('name', 'in', oldDemoNames).get();
    const deleteBatch = db.batch();
    let deletedCount = 0;
    
    oldSnapshot.forEach((doc) => {
      deleteBatch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await deleteBatch.commit();
      console.log(`✅ [DEMO-PROJECTS] Deleted ${deletedCount} old demo projects`);
    }

    // Demo Project 1: LOW SCORING (Score: 28)
    const demoProject1 = {
      name: 'BasicSwap DEX',
      title: 'BasicSwap DEX',
      description: 'A simple decentralized exchange for token swaps. Early stage project with minimal features and basic smart contract implementation. Limited liquidity and user base.',
      tagline: 'Simple token swapping on Ethereum',
      sector: 'DeFi',
      stage: 'Pre-Seed',
      chain: 'Ethereum',
      blockchain: 'Ethereum',
      geography: 'North America',
      logo: 'https://i.pravatar.cc/300?img=10',
      logoUrl: 'https://i.pravatar.cc/300?img=10',
      image: 'https://i.pravatar.cc/300?img=10',
      status: 'approved',
      reviewStatus: 'approved',
      adminApproved: true,
      adminStatus: 'approved',
      visibility: {
        discoverable: true
      },
      seekingListing: true,
      seekingIDO: true,
      seekingFunding: true,
      seekingMarketing: true,
      seekingServices: true,
      targetRoles: ['exchange', 'ido', 'vc', 'influencer', 'agency'],
      fundingGoal: 300000,
      currentFunding: 25000,
      tokenSymbol: 'BSWAP',
      website: 'https://basicswap.example.com',
      category: 'DeFi',
      social: {
        website: 'https://basicswap.example.com',
        twitter: 'https://twitter.com/basicswap',
        telegram: 'https://t.me/basicswap',
        discord: 'https://discord.gg/basicswap'
      },
      bio: 'BasicSwap is an early-stage decentralized exchange focused on providing basic token swapping functionality. We are building a simple, user-friendly DEX for the Ethereum ecosystem.',
      isDoxxed: false,
      isAudited: false,
      badges: {
        doxxed: false,
        audit: false
      },
      team: [
        {
          name: 'Mike Chen',
          role: 'Founder & Developer',
          bio: 'Self-taught developer, first blockchain project',
          linkedin: 'https://linkedin.com/in/mikechen',
          image: 'https://i.pravatar.cc/150?img=11'
        }
      ],
      documents: {
        whitepaper: 'https://example.com/basicswap-whitepaper.pdf',
        pitchdeck: 'https://example.com/basicswap-pitchdeck.pdf',
        tokenomics: 'https://example.com/basicswap-tokenomics.pdf'
      },
      raftai: {
        score: 28,
        rating: 'Low',
        summary: 'Very early stage project with minimal team, basic documentation, and unproven concept. High risk investment requiring significant development and market validation. Limited competitive advantage and unclear path to profitability.',
        insights: [
          'Single founder with limited blockchain experience',
          'Basic documentation lacks technical depth',
          'No audit or security review completed',
          'Unproven market demand and user adoption',
          'Limited differentiation from existing DEX solutions'
        ],
        risks: [
          'Single point of failure with solo founder',
          'No security audit increases smart contract risk',
          'Highly competitive market with established players',
          'Limited funding may restrict development speed',
          'Unclear tokenomics and revenue model'
        ],
        recommendations: [
          'Recruit experienced blockchain developers',
          'Complete comprehensive security audit before launch',
          'Develop clear competitive differentiation',
          'Create detailed roadmap and tokenomics',
          'Build community and early user base'
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Demo Project 2: MEDIUM SCORING (Score: 65)
    const demoProject2 = {
      name: 'NFT Marketplace Pro',
      title: 'NFT Marketplace Pro',
      description: 'A feature-rich NFT marketplace with advanced filtering, royalty management, and multi-chain support. Growing team with solid technical foundation and active development.',
      tagline: 'Professional NFT trading platform',
      sector: 'NFT',
      stage: 'Seed',
      chain: 'Polygon',
      blockchain: 'Polygon',
      geography: 'Europe',
      logo: 'https://i.pravatar.cc/300?img=20',
      logoUrl: 'https://i.pravatar.cc/300?img=20',
      image: 'https://i.pravatar.cc/300?img=20',
      status: 'approved',
      reviewStatus: 'approved',
      adminApproved: true,
      adminStatus: 'approved',
      visibility: {
        discoverable: true
      },
      seekingListing: true,
      seekingIDO: true,
      seekingFunding: true,
      seekingMarketing: true,
      seekingServices: true,
      targetRoles: ['exchange', 'ido', 'vc', 'influencer', 'agency'],
      fundingGoal: 2000000,
      currentFunding: 800000,
      tokenSymbol: 'NMP',
      website: 'https://nftmarketplacepro.example.com',
      category: 'NFT',
      social: {
        website: 'https://nftmarketplacepro.example.com',
        twitter: 'https://twitter.com/nftmarketplacepro',
        telegram: 'https://t.me/nftmarketplacepro',
        discord: 'https://discord.gg/nftmarketplacepro',
        linkedin: 'https://linkedin.com/company/nftmarketplacepro'
      },
      bio: 'NFT Marketplace Pro is building a comprehensive NFT trading platform with advanced features including multi-chain support, royalty management, and professional-grade analytics. Our team combines blockchain expertise with marketplace experience.',
      isDoxxed: true,
      isAudited: false,
      badges: {
        doxxed: true,
        audit: false
      },
      team: [
        {
          name: 'Sarah Martinez',
          role: 'CEO & Co-Founder',
          bio: 'Former product manager at major NFT platform, 8 years in crypto',
          linkedin: 'https://linkedin.com/in/sarahmartinez',
          image: 'https://i.pravatar.cc/150?img=12'
        },
        {
          name: 'James Wilson',
          role: 'CTO & Co-Founder',
          bio: 'Blockchain engineer with 6 years experience, ex-Consensys',
          linkedin: 'https://linkedin.com/in/jameswilson',
          image: 'https://i.pravatar.cc/150?img=13'
        },
        {
          name: 'Emily Davis',
          role: 'Head of Design',
          bio: 'UI/UX designer specializing in Web3 interfaces',
          linkedin: 'https://linkedin.com/in/emilydavis',
          image: 'https://i.pravatar.cc/150?img=14'
        }
      ],
      documents: {
        whitepaper: 'https://example.com/nftmarketplace-whitepaper.pdf',
        pitchdeck: 'https://example.com/nftmarketplace-pitchdeck.pdf',
        pitchDeck: 'https://example.com/nftmarketplace-pitchdeck.pdf',
        financials: 'https://example.com/nftmarketplace-financials.pdf',
        tokenomics: 'https://example.com/nftmarketplace-tokenomics.pdf',
        roadmap: 'https://example.com/nftmarketplace-roadmap.pdf'
      },
      raftai: {
        score: 65,
        rating: 'Normal',
        summary: 'Solid project with growing team and good technical foundation. Moderate risk with potential for success if execution continues to improve. Some gaps in documentation and security audit needed.',
        insights: [
          'Experienced founding team with relevant backgrounds',
          'Good technical foundation and active development',
          'Clear product vision with market demand',
          'Partial funding secured shows investor confidence',
          'Security audit pending is a concern'
        ],
        risks: [
          'Competitive NFT marketplace space',
          'No security audit completed yet',
          'Moderate team size may limit rapid scaling',
          'Market volatility in NFT sector',
          'Regulatory uncertainty around NFTs'
        ],
        recommendations: [
          'Complete comprehensive security audit',
          'Expand team for faster development',
          'Build strategic partnerships with NFT projects',
          'Develop clear monetization strategy',
          'Focus on user acquisition and retention'
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Demo Project 3: HIGH SCORING (Score: 94)
    const demoProject3 = {
      name: 'Enterprise Blockchain Suite',
      title: 'Enterprise Blockchain Suite',
      description: 'A comprehensive enterprise blockchain solution with advanced features including private networks, smart contract templates, and compliance tools. Well-funded with experienced team and proven track record.',
      tagline: 'Enterprise-grade blockchain infrastructure',
      sector: 'Infrastructure',
      stage: 'Series A',
      chain: 'Multi-chain',
      blockchain: 'Multi-chain',
      geography: 'Asia',
      logo: 'https://i.pravatar.cc/300?img=30',
      logoUrl: 'https://i.pravatar.cc/300?img=30',
      image: 'https://i.pravatar.cc/300?img=30',
      status: 'approved',
      reviewStatus: 'approved',
      adminApproved: true,
      adminStatus: 'approved',
      visibility: {
        discoverable: true
      },
      seekingListing: true,
      seekingIDO: true,
      seekingFunding: true,
      seekingMarketing: true,
      seekingServices: true,
      targetRoles: ['exchange', 'ido', 'vc', 'influencer', 'agency'],
      fundingGoal: 10000000,
      currentFunding: 6000000,
      tokenSymbol: 'EBS',
      website: 'https://enterpriseblockchain.example.com',
      category: 'Infrastructure',
      social: {
        website: 'https://enterpriseblockchain.example.com',
        twitter: 'https://twitter.com/enterpriseblockchain',
        telegram: 'https://t.me/enterpriseblockchain',
        discord: 'https://discord.gg/enterpriseblockchain',
        linkedin: 'https://linkedin.com/company/enterpriseblockchain',
        youtube: 'https://youtube.com/@enterpriseblockchain',
        github: 'https://github.com/enterpriseblockchain'
      },
      bio: 'Enterprise Blockchain Suite provides comprehensive blockchain infrastructure solutions for businesses. Our platform offers private networks, smart contract templates, compliance tools, and enterprise-grade security. We serve Fortune 500 companies and have a proven track record of successful deployments.',
      isDoxxed: true,
      isAudited: true,
      badges: {
        doxxed: true,
        audit: true
      },
      team: [
        {
          name: 'Dr. Robert Kim',
          role: 'CEO & Co-Founder',
          bio: 'Former VP at IBM Blockchain, PhD in Computer Science, 20+ years in enterprise tech',
          linkedin: 'https://linkedin.com/in/robertkim',
          image: 'https://i.pravatar.cc/150?img=15'
        },
        {
          name: 'Lisa Anderson',
          role: 'CTO & Co-Founder',
          bio: 'Former lead architect at Microsoft Azure, blockchain expert with 15 years experience',
          linkedin: 'https://linkedin.com/in/lisaanderson',
          image: 'https://i.pravatar.cc/150?img=16'
        },
        {
          name: 'Michael Thompson',
          role: 'Head of Engineering',
          bio: 'Senior blockchain engineer, ex-Consensys, 12 years in blockchain development',
          linkedin: 'https://linkedin.com/in/michaelthompson',
          image: 'https://i.pravatar.cc/150?img=17'
        },
        {
          name: 'Jennifer Lee',
          role: 'Head of Product',
          bio: 'Product leader with enterprise SaaS experience, 10 years in product management',
          linkedin: 'https://linkedin.com/in/jenniferlee',
          image: 'https://i.pravatar.cc/150?img=18'
        },
        {
          name: 'David Park',
          role: 'Head of Security',
          bio: 'Cybersecurity expert, former security lead at Coinbase, 14 years in crypto security',
          linkedin: 'https://linkedin.com/in/davidpark',
          image: 'https://i.pravatar.cc/150?img=19'
        },
        {
          name: 'Amanda White',
          role: 'Head of Business Development',
          bio: 'Enterprise sales executive, 12 years in B2B technology sales',
          linkedin: 'https://linkedin.com/in/amandawhite',
          image: 'https://i.pravatar.cc/150?img=20'
        }
      ],
      documents: {
        whitepaper: 'https://example.com/enterpriseblockchain-whitepaper.pdf',
        pitchdeck: 'https://example.com/enterpriseblockchain-pitchdeck.pdf',
        pitchDeck: 'https://example.com/enterpriseblockchain-pitchdeck.pdf',
        financials: 'https://example.com/enterpriseblockchain-financials.pdf',
        auditreport: 'https://example.com/enterpriseblockchain-audit.pdf',
        auditReport: 'https://example.com/enterpriseblockchain-audit.pdf',
        tokenomics: 'https://example.com/enterpriseblockchain-tokenomics.pdf',
        roadmap: 'https://example.com/enterpriseblockchain-roadmap.pdf',
        legalOpinion: 'https://example.com/enterpriseblockchain-legal.pdf',
        capTable: 'https://example.com/enterpriseblockchain-captable.pdf'
      },
      raftai: {
        score: 94,
        rating: 'High',
        summary: 'Exceptional project with outstanding team credentials, comprehensive documentation, proven track record, and strong market position. Low risk, high potential investment with clear path to success. Well-funded with experienced leadership and enterprise-grade execution.',
        insights: [
          'World-class team with Fortune 500 and major tech company backgrounds',
          'Comprehensive documentation including all required materials',
          'Proven track record with existing enterprise clients',
          'Strong funding position with 60% of goal already raised',
          'Security audit completed by reputable firm',
          'Clear competitive advantage in enterprise blockchain space',
          'Strong market demand with growing enterprise adoption',
          'Well-defined roadmap and execution plan'
        ],
        risks: [
          'Enterprise sales cycles can be lengthy',
          'Regulatory changes may affect enterprise adoption',
          'Competition from established tech giants',
          'Market conditions may impact funding rounds'
        ],
        recommendations: [
          'Continue expanding enterprise client base',
          'Maintain focus on security and compliance',
          'Build strategic partnerships with major cloud providers',
          'Expand to additional geographic markets',
          'Develop industry-specific solutions'
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add all 3 projects to Firestore
    const result1 = await projectsRef.add(demoProject1);
    const result2 = await projectsRef.add(demoProject2);
    const result3 = await projectsRef.add(demoProject3);

    console.log(`✅ [DEMO-PROJECTS] Created 3 demo projects: ${result1.id}, ${result2.id}, ${result3.id}`);

    return NextResponse.json({ 
      success: true,
      deletedCount: deletedCount,
      projects: [
        { id: result1.id, name: demoProject1.name, score: demoProject1.raftai.score, rating: demoProject1.raftai.rating },
        { id: result2.id, name: demoProject2.name, score: demoProject2.raftai.score, rating: demoProject2.raftai.rating },
        { id: result3.id, name: demoProject3.name, score: demoProject3.raftai.score, rating: demoProject3.raftai.rating }
      ]
    });

  } catch (error: any) {
    console.error('❌ [DEMO-PROJECTS] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create demo projects' 
    }, { status: 500 });
  }
}
