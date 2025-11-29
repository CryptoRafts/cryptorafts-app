import { NextRequest, NextResponse } from 'next/server';
import { blogServiceServer } from '@/lib/blog-service.server';

/**
 * GET /feed.xml
 * RSS feed endpoint (standard location)
 */
export async function GET(request: NextRequest) {
  try {
    // Get published blog posts only
    const filters = {
      status: 'published' as const,
      limit: 50,
      page: 1,
    };

    const posts = await blogServiceServer.getPosts(filters);
    
    // Get base URL from request headers or environment
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'www.cryptorafts.com';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    const siteUrl = baseUrl;
    const feedUrl = `${siteUrl}/feed.xml`;
    
    // Format date to RFC 822 format (required by IFTTT)
    const formatRFC822 = (date: Date): string => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const d = new Date(date);
      const day = days[d.getUTCDay()];
      const month = months[d.getUTCMonth()];
      const dateNum = d.getUTCDate();
      const year = d.getUTCFullYear();
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      const seconds = String(d.getUTCSeconds()).padStart(2, '0');
      return `${day}, ${dateNum} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
    };
    
    // Escape XML special characters
    const escapeXml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    // Generate RSS XML - ensure valid XML even with no posts
    const items = posts.length > 0 ? posts.map(post => {
      const postUrl = `${siteUrl}/blog/${post.slug || post.id}`;
      const pubDate = post.publishedAt || post.createdAt || new Date();
      const pubDateString = formatRFC822(new Date(pubDate));
      
      // Ensure unique GUID - use post ID if available
      const guid = post.id ? `${siteUrl}/blog/${post.id}` : postUrl;
      
      const description = post.metaDescription || post.excerpt || post.content?.replace(/<[^>]*>/g, '').substring(0, 300) || '';
      const content = post.content || '';
      
      // Handle images in content:encoded (IFTTT requirement)
      let imageContent = '';
      if (post.featuredImage) {
        imageContent = `<img src="${escapeXml(post.featuredImage)}" alt="${escapeXml(post.title || 'Post image')}" />`;
      }
      
      return `
    <item>
      <title><![CDATA[${post.title || 'Untitled'}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${guid}</guid>
      <description><![CDATA[${description}]]></description>
      <content:encoded><![CDATA[${imageContent ? imageContent + '<br/>' : ''}${content}]]></content:encoded>
      <pubDate>${pubDateString}</pubDate>
      <author>${post.author || 'CryptoRafts Team'}</author>
      <category>${post.category || 'crypto-news'}</category>
      ${post.featuredImage ? `<enclosure url="${escapeXml(post.featuredImage)}" type="image/jpeg"/>` : ''}
      ${post.tags ? post.tags.map((tag: string) => `<category><![CDATA[${tag}]]></category>`).join('') : ''}
    </item>`;
    }).join('') : `
    <item>
      <title>Welcome to CryptoRafts Blog</title>
      <link>${siteUrl}/blog</link>
      <guid isPermaLink="true">${siteUrl}/blog/welcome-${Date.now()}</guid>
      <description>Stay tuned for upcoming blog posts about crypto, Web3, DeFi, and blockchain technology.</description>
      <content:encoded><![CDATA[<p>Welcome to CryptoRafts Blog! Stay tuned for upcoming blog posts about crypto, Web3, DeFi, and blockchain technology.</p>]]></content:encoded>
      <pubDate>${formatRFC822(new Date())}</pubDate>
      <author>CryptoRafts Team</author>
      <category>announcement</category>
    </item>`;
    
    const now = new Date();
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>CryptoRafts Blog</title>
    <link>${siteUrl}/blog</link>
    <description>AI-verified deal flow on chain. Connect founders with VCs, agencies, exchanges, and IDO platforms.</description>
    <language>en-US</language>
    <lastBuildDate>${formatRFC822(now)}</lastBuildDate>
    <pubDate>${formatRFC822(now)}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/tablogo.ico</url>
      <title>CryptoRafts Blog</title>
      <link>${siteUrl}/blog</link>
    </image>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, must-revalidate',
        'Pragma': 'public',
        'Expires': new Date(Date.now() + 3600000).toUTCString(),
        'X-Content-Type-Options': 'nosniff',
        'Vary': 'Accept',
      },
    });
  } catch (error: any) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

