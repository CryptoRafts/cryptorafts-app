import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SimpleAuthProvider } from "@/providers/SimpleAuthProvider";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { RoleProvider } from "@/contexts/RoleContext";
import PerfectHeader from "@/components/PerfectHeader";
import GlobalCallNotificationManager from "@/components/GlobalCallNotificationManager";
import ErrorBoundary from "@/components/ErrorBoundary";
import { generateOrganizationSchema, generateWebSiteSchema, generateWebApplicationSchema, generateFAQSchema } from "./structured-data";
import { getAllKeywords } from "./seo-keywords-large";
import Canonical from "./canonical";
import Script from "next/script";
import ErrorHandlerInitializer from "@/components/ErrorHandlerInitializer";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cryptorafts.com'),
  title: {
    default: "CryptoRafts - Pitch. Invest. Build. Verified.",
    template: "%s | CryptoRafts"
  },
  description: "AI-verified deal flow on chain�KYC/KYB, due diligence, and secure deal rooms in one network. Connect founders, VCs, agencies, exchanges, and IDO platforms.",
  keywords: getAllKeywords(),
  authors: [{ name: "CryptoRafts" }],
  creator: "CryptoRafts",
  publisher: "CryptoRafts",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.cryptorafts.com",
    title: "CryptoRafts - Web3 Funding Platform",
    description: "AI-powered Web3 DeFi ecosystem for founders and investors. Launch crypto projects, secure VC funding, complete KYC/KYB verification. Best crypto launchpad 2025.",
    siteName: "CryptoRafts",
    images: [
      {
        url: "https://www.cryptorafts.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CryptoRafts - Web3 Funding Platform",
      },
    ],
  },
  alternates: {
    canonical: "https://www.cryptorafts.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoRafts - Web3 Funding Platform",
    description: "AI-powered Web3 platform for crypto startups and investors. Launch projects, raise funds, and build trusted partnerships in DeFi.",
    images: ["https://www.cryptorafts.com/og-image.jpg"],
    creator: "@cryptorafts",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/tablogo.ico", sizes: "any" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: "/favicon.ico",
    apple: "/tablogo.ico",
    other: [
      {
        rel: "icon",
        url: "/favicon.ico",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-black" style={{ backgroundColor: '#000000', background: '#000000' }}>
      <head>
        {/* Canonical URL to prevent duplicate content */}
        <link rel="canonical" href="https://www.cryptorafts.com" />
        
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="eZ11XVG71mBWKtocDX08k2s1BZux8ax3f628476UNvU" />
        
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationSchema())
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebSiteSchema())
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebApplicationSchema())
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQSchema([
              {
                question: "How to launch a crypto project on Cryptorafts?",
                answer: "Launch your crypto project on Cryptorafts in 3 simple steps: 1) Complete on-chain KYC/KYB verification with AI-powered identity verification, 2) Create your project profile with tokenomics and pitch deck, 3) Connect with verified VCs and investors to raise funds. Our platform is the best crypto launchpad for Web3 startups, offering TGE services, IDO support, and private sale capabilities."
              },
              {
                question: "What is the best crypto launchpad for startups?",
                answer: "Cryptorafts is the best AI-powered crypto launchpad for Web3 startups in 2025. We offer complete TGE (Token Generation Event) services, on-chain KYC/KYB verification, AI-driven deal flow analysis, and direct access to top venture capital investors. Our platform helps founders launch projects, raise VC funding, and build strong communities."
              },
              {
                question: "How to get VC funding for crypto projects?",
                answer: "Get VC funding for your crypto startup on Cryptorafts by completing investor verification (KYC/KYB), creating a compelling project profile with strong tokenomics, connecting with verified venture capital investors, and leveraging our AI-powered matchmaking. Our platform connects Web3 founders with top crypto VCs, offering pre-sale, private sale, and IDO opportunities."
              },
              {
                question: "What is AI-powered KYC verification?",
                answer: "AI-powered KYC (Know Your Customer) verification on Cryptorafts uses advanced artificial intelligence to verify investor and founder identities securely on-chain. Our hybrid blockchain solution combines AI analytics with on-chain verification to ensure trust, compliance, and security for all participants in the Web3 ecosystem."
              },
              {
                question: "How to list tokens on crypto exchanges?",
                answer: "List your tokens on major crypto exchanges like Binance and Coinbase through Cryptorafts. Our platform helps Web3 startups complete pre-launch marketing, build community, establish tokenomics, and navigate exchange listing requirements. We connect you with exchange partners and provide comprehensive support for TGE and post-launch token marketing."
              },
              {
                question: "What is the difference between DeFi and CeFi?",
                answer: "DeFi (Decentralized Finance) operates on blockchain without intermediaries, while CeFi (Centralized Finance) uses traditional financial institutions. Cryptorafts combines the best of both worlds, offering decentralized on-chain verification with professional AI-driven analysis and traditional VC funding access, making it the ideal platform for modern crypto startups."
              },
              {
                question: "How to promote a crypto startup?",
                answer: "Promote your crypto startup effectively with Cryptorafts' marketing tools including influencer partnerships, community building strategies, Web3 marketing campaigns, pre-TGE and post-TGE marketing plans, social media optimization, and direct access to crypto influencers and marketing agencies. Our platform helps make your project trend on Twitter and build a strong Web3 community."
              },
              {
                question: "What are upcoming TGE and token sales?",
                answer: "TGE (Token Generation Event) is the launch of a new cryptocurrency token. Cryptorafts hosts upcoming TGE launches and token sales with IDO (Initial DEX Offering), private sale, and pre-sale opportunities. Join our platform to discover the best upcoming token launches, invest in verified projects, or launch your own TGE with our comprehensive support."
              }
            ]))
          }}
        />
        {/* Suppress ERR_BLOCKED_BY_CLIENT errors early - before any other scripts */}
        <Script id="suppress-ad-blocker-errors" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Suppress ERR_BLOCKED_BY_CLIENT errors from ad blockers
              // These are harmless Firestore channel termination requests
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                const originalLog = console.log;
                const originalWarn = console.warn;
                const originalInfo = console.info;
                
                // Helper to check if error should be suppressed
                const shouldSuppress = function(message) {
                  if (!message || typeof message !== 'string') return false;
                  const isBlockedByClient = message.includes('ERR_BLOCKED_BY_CLIENT') || 
                                           message.includes('net::ERR_BLOCKED_BY_CLIENT');
                  const isFirestoreTerminate = message.includes('firestore.googleapis.com') && 
                                               (message.includes('TYPE=terminate') || 
                                                message.includes('/Write/channel') || 
                                                message.includes('/Listen/channel') ||
                                                message.includes('terminate') ||
                                                message.includes('/channel?VER=') ||
                                                message.includes('gsessionid') ||
                                                message.includes('SID=') ||
                                                message.includes('RID='));
                  const isFirestoreError = message.includes('firestore.googleapis.com') && 
                                          (message.includes('ERR_BLOCKED_BY_CLIENT') ||
                                           message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                                           message.includes('Failed to load resource'));
                  const isFailedToLoad = message.includes('Failed to load resource') && 
                                        (message.includes('firestore.googleapis.com') || 
                                         message.includes('Write/channel') ||
                                         message.includes('TYPE=terminate'));
                  return isBlockedByClient || isFirestoreTerminate || isFirestoreError || isFailedToLoad;
                };
                
                // Suppress in console.error
                console.error = function(...args) {
                  const message = args.map(arg => {
                    if (typeof arg === 'string') return arg;
                    if (arg && typeof arg === 'object') {
                      try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                    }
                    return String(arg);
                  }).join(' ');
                  
                  if (!shouldSuppress(message)) {
                    originalError.apply(console, args);
                  }
                };
                
                // Suppress in console.log
                console.log = function(...args) {
                  const message = args.map(arg => {
                    if (typeof arg === 'string') return arg;
                    if (arg && typeof arg === 'object') {
                      try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                    }
                    return String(arg);
                  }).join(' ');
                  
                  if (!shouldSuppress(message)) {
                    originalLog.apply(console, args);
                  }
                };
                
                // Suppress in console.warn
                console.warn = function(...args) {
                  const message = args.map(arg => {
                    if (typeof arg === 'string') return arg;
                    if (arg && typeof arg === 'object') {
                      try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                    }
                    return String(arg);
                  }).join(' ');
                  
                  if (!shouldSuppress(message)) {
                    originalWarn.apply(console, args);
                  }
                };
                
                // Suppress window error events (capture phase - before other listeners)
                // Set up multiple listeners to catch errors at different phases
                const suppressError = function(event) {
                  const errorMessage = event.message || '';
                  const errorSource = event.filename || (event.target && (event.target.src || event.target.href)) || '';
                  const errorUrl = errorSource || '';
                  
                  if (shouldSuppress(errorMessage) || shouldSuppress(errorSource) || shouldSuppress(errorUrl)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    return false;
                  }
                };
                
                // Add listeners at both capture and bubble phases
                // CRITICAL: Suppress React insertBefore errors - these are React reconciliation issues
                // that don't affect functionality but cause console spam
                const suppressReactReconciliationError = (event: ErrorEvent) => {
                  if (event.error && (
                    event.error.message?.includes("Failed to execute 'insertBefore' on 'Node'") ||
                    (event.error.name === 'NotFoundError' && event.error.message?.includes('insertBefore'))
                  )) {
                    // This is a React reconciliation error that doesn't affect functionality
                    // Suppress it to prevent console spam
                    event.preventDefault();
                    event.stopPropagation();
                    console.warn('⚠️ [React] Suppressed insertBefore reconciliation error (non-critical)');
                    return true;
                  }
                  return false;
                };
                
                window.addEventListener('error', (event) => {
                  if (!suppressReactReconciliationError(event)) {
                    suppressError(event);
                  }
                }, true); // Capture phase (earliest)
                window.addEventListener('error', (event) => {
                  if (!suppressReactReconciliationError(event)) {
                    suppressError(event);
                  }
                }, false); // Bubble phase
                
                // Suppress unhandled promise rejections
                // CRITICAL: Also suppress insertBefore errors in promise rejections
                window.addEventListener('unhandledrejection', function(event) {
                  // Suppress React insertBefore errors in promise rejections
                  if (event.reason && (
                    event.reason.message?.includes("Failed to execute 'insertBefore' on 'Node'") ||
                    (event.reason.name === 'NotFoundError' && event.reason.message?.includes('insertBefore'))
                  )) {
                    event.preventDefault();
                    console.warn('⚠️ [React] Suppressed insertBefore reconciliation error in promise rejection (non-critical)');
                    return;
                  }
                  const reason = event.reason?.message || event.reason?.toString() || '';
                  if (shouldSuppress(reason)) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                }, true);
                
                // Intercept XMLHttpRequest errors
                if (window.XMLHttpRequest) {
                  const OriginalXHR = window.XMLHttpRequest;
                  const originalOpen = XMLHttpRequest.prototype.open;
                  const originalSend = XMLHttpRequest.prototype.send;
                  
                  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                    this._url = url.toString();
                    return originalOpen.apply(this, [method, url, ...rest]);
                  };
                  
                  XMLHttpRequest.prototype.send = function(...args) {
                    const xhr = this;
                    const url = xhr._url || '';
                    
                    xhr.addEventListener('error', function(event) {
                      if (shouldSuppress(url) || shouldSuppress(event.message || '')) {
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                        return false;
                      }
                    }, true);
                    
                    return originalSend.apply(this, args);
                  };
                }
                
                // Intercept fetch errors
                if (window.fetch) {
                  const originalFetch = window.fetch;
                  window.fetch = function(...args) {
                    const url = args[0]?.toString() || '';
                    if (shouldSuppress(url)) {
                      // Return a rejected promise that won't be logged
                      return Promise.reject(new Error('Request blocked by ad blocker (harmless)'));
                    }
                    return originalFetch.apply(this, args).catch(function(error) {
                      const errorMessage = error?.message || error?.toString() || '';
                      if (shouldSuppress(errorMessage) || shouldSuppress(url)) {
                        // Don't re-throw - suppress the error
                        return Promise.reject(new Error('Request blocked by ad blocker (harmless)'));
                      }
                      throw error;
                    });
                  };
                }
              }
            })();
          `
        }} />
        {/* Hide Vercel Toolbar - Aggressive Removal */}
        <Script id="hide-vercel-toolbar" strategy="beforeInteractive">
          {`
            (function() {
              // Aggressive Vercel toolbar removal
              const hideVercelToolbar = () => {
                // Multiple selectors to catch all variations
                const selectors = [
                  '[data-vercel-toolbar]',
                  'iframe[src*="vercel"]',
                  '#vercel-live-feedback',
                  '[id*="vercel"]',
                  '[class*="vercel"]',
                  '[class*="Vercel"]',
                  'div[style*="position: fixed"][style*="bottom"]',
                  'div[style*="position:fixed"][style*="bottom"]'
                ];
                
                selectors.forEach(selector => {
                  try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                      if (el) {
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                        el.style.opacity = '0';
                        el.style.pointerEvents = 'none';
                        el.remove();
                      }
                    });
                  } catch(e) {}
                });
                
                // Remove any iframes containing vercel
                document.querySelectorAll('iframe').forEach(iframe => {
                  if (iframe.src && iframe.src.includes('vercel')) {
                    iframe.remove();
                  }
                });
              };
              
              // Run immediately
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', hideVercelToolbar);
              } else {
                hideVercelToolbar();
              }
              
              // Run after load
              window.addEventListener('load', hideVercelToolbar);
              
              // Run periodically
              setInterval(hideVercelToolbar, 500);
              
              // Use MutationObserver to catch dynamically added toolbars
              const observer = new MutationObserver(hideVercelToolbar);
              observer.observe(document.body, { childList: true, subtree: true });
            })();
          `}
        </Script>
      </head>
      <body 
        className={`
          min-h-[100dvh] h-full 
          font-sans
          overflow-x-hidden
          text-white antialiased
          bg-black
        `}
        style={{ backgroundColor: '#000000', background: '#000000' }}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ErrorHandlerInitializer />
          <SimpleAuthProvider>
            <NotificationsProvider>
              <RoleProvider>
                <GlobalCallNotificationManager />
                <div className="min-h-[100dvh] flex flex-col relative" style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <PerfectHeader />
                  <main 
                    className="flex-1 w-full overflow-x-hidden" 
                    role="main"
                    id="main-content"
                    style={{ position: 'relative', width: '100%', height: '100%', flex: '1 1 auto', display: 'block', visibility: 'visible', opacity: 1, zIndex: 1 }}
                    suppressHydrationWarning
                  >
                    <div className="w-full" style={{ position: 'relative', width: '100%', height: '100%', display: 'block', visibility: 'visible', opacity: 1 }} suppressHydrationWarning>
                      {children}
                    </div>
                  </main>
                </div>
              </RoleProvider>
            </NotificationsProvider>
          </SimpleAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
