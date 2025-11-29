/**
 * Structured Data (JSON-LD) for SEO
 * Helps search engines understand your content better
 */

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CryptoRafts',
    description: 'Cryptorafts - AI-powered Web3 DeFi ecosystem for founders and investors. Launch crypto projects, raise VC funding, complete on-chain KYC/KYB verification. Best crypto launchpad, TGE platform, and token generation event solution for Web3 startups.',
    url: 'https://www.cryptorafts.com',
    logo: 'https://www.cryptorafts.com/logo.png',
    sameAs: [
      'https://twitter.com/cryptorafts',
      'https://linkedin.com/company/cryptorafts',
      'https://github.com/cryptorafts'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Business Contact',
      email: 'business@cryptorafts.com'
    }
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CryptoRafts',
    description: 'Join Cryptorafts - the best AI-powered crypto launchpad for Web3 startups. Launch your crypto project, secure VC funding, complete investor verification. IDO, pre-sale, private sale, and TGE token launch platform.',
    url: 'https://www.cryptorafts.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.cryptorafts.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function generateWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CryptoRafts Platform',
    description: 'Comprehensive Web3 funding platform with AI-powered verification',
    url: 'https://www.cryptorafts.com',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: [
      'KYC/KYB Verification',
      'Smart Deal Rooms',
      'AI Analysis',
      'Real-time Analytics',
      'Secure Messaging',
      'Project Spotlight',
      'Investment Tracking'
    ]
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function generateServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Web3 Funding Platform',
    provider: {
      '@type': 'Organization',
      name: 'CryptoRafts'
    },
    areaServed: 'Worldwide',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Platform Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Founder Services',
            description: 'Pitch your project, get verified, raise funding'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'VC Services',
            description: 'Discover verified projects, manage dealflow, invest securely'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Agency Services',
            description: 'Connect projects with investors, manage portfolios'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Exchange Services',
            description: 'Review listing applications, manage compliance'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'IDO Platform Services',
            description: 'Launch verified projects, manage token sales'
          }
        }
      ]
    }
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

