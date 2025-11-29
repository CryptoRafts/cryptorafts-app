import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Your production URL
  const baseUrl = 'https://www.cryptorafts.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/*',
          '/api/*',
          '/founder/dashboard/*',
          '/vc/dashboard/*',
          '/agency/dashboard/*',
          '/exchange/dashboard/*',
          '/ido/dashboard/*',
          '/influencer/dashboard/*',
          '/messages/*',
          '/chat/*',
          '/rooms/*',
          '/profile/*',
          '/settings/*',
          '/kyc',
          '/kyb',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

