/**
 * Fallback Blog Generator
 * Generates blog posts without OpenAI when API quota is exceeded
 * Uses templates and trending topics
 */

import { googleTrendsService } from './google-trends-service';

interface BlogPost {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  slug: string;
}

const blogTemplates = [
  {
    category: 'crypto-news',
    templates: [
      {
        titleTemplate: 'The Future of {topic}: What You Need to Know in 2025',
        contentTemplate: `
<h1>The Future of {topic}: What You Need to Know in 2025</h1>

<p>The cryptocurrency and blockchain space continues to evolve at a rapid pace, and {topic} is at the forefront of this transformation. As we navigate through 2025, understanding the latest developments and trends is crucial for anyone involved in the digital asset ecosystem.</p>

<h2>Understanding {topic}</h2>

<p>{topic} represents one of the most significant innovations in the blockchain space. This technology has the potential to revolutionize how we interact with digital assets, decentralized applications, and the broader Web3 ecosystem.</p>

<h3>Key Features and Benefits</h3>

<ul>
<li><strong>Decentralization:</strong> {topic} operates on a decentralized network, eliminating the need for intermediaries and providing users with greater control over their digital assets.</li>
<li><strong>Security:</strong> Built on blockchain technology, {topic} offers enhanced security through cryptographic protocols and distributed ledger technology.</li>
<li><strong>Transparency:</strong> All transactions and operations are recorded on a public ledger, ensuring complete transparency and accountability.</li>
<li><strong>Efficiency:</strong> By removing intermediaries, {topic} reduces transaction costs and processing times significantly.</li>
</ul>

<h2>Current Market Trends</h2>

<p>The market for {topic} has seen substantial growth in recent months. Industry analysts predict continued expansion as more institutions and individual investors recognize the value proposition of this technology.</p>

<h3>Adoption Rates</h3>

<p>Adoption of {topic} has accelerated across various sectors, including finance, supply chain management, and digital identity verification. Major corporations and financial institutions are increasingly exploring integration opportunities.</p>

<h2>Investment Considerations</h2>

<p>For investors looking to get involved with {topic}, it's essential to conduct thorough research and understand the associated risks. While the potential for significant returns exists, the cryptocurrency market remains highly volatile.</p>

<h3>Risk Management</h3>

<ul>
<li>Diversify your portfolio across different assets</li>
<li>Only invest what you can afford to lose</li>
<li>Stay informed about regulatory developments</li>
<li>Consider long-term investment strategies</li>
</ul>

<h2>Looking Ahead</h2>

<p>As we move further into 2025, {topic} is expected to play an increasingly important role in the digital economy. Regulatory clarity, technological improvements, and growing mainstream acceptance are all factors that will shape the future of this space.</p>

<h3>Future Developments</h3>

<p>Industry experts anticipate several key developments in the coming months, including enhanced scalability solutions, improved user interfaces, and greater interoperability between different blockchain networks.</p>

<h2>Conclusion</h2>

<p>{topic} represents a significant opportunity for those willing to understand and engage with this emerging technology. As the space continues to mature, staying informed and making educated decisions will be key to success in this dynamic market.</p>

<p>Whether you're a seasoned crypto enthusiast or new to the space, understanding {topic} and its implications is essential for navigating the future of digital assets and blockchain technology.</p>
        `
      }
    ]
  },
  {
    category: 'defi',
    templates: [
      {
        titleTemplate: 'DeFi Revolution: How {topic} is Changing Finance',
        contentTemplate: `
<h1>DeFi Revolution: How {topic} is Changing Finance</h1>

<p>Decentralized Finance (DeFi) has emerged as one of the most transformative forces in the financial sector, and {topic} is leading this revolution. This comprehensive guide explores how {topic} is reshaping traditional financial systems and creating new opportunities for users worldwide.</p>

<h2>What is {topic}?</h2>

<p>{topic} is a groundbreaking DeFi protocol that enables users to access financial services without traditional intermediaries. By leveraging blockchain technology, {topic} provides transparent, accessible, and efficient financial solutions.</p>

<h2>How {topic} Works</h2>

<p>The {topic} protocol operates on smart contracts, which automatically execute transactions based on predefined conditions. This eliminates the need for banks or financial institutions, allowing users to interact directly with the protocol.</p>

<h3>Key Mechanisms</h3>

<ul>
<li><strong>Smart Contracts:</strong> Automated agreements that execute without intermediaries</li>
<li><strong>Liquidity Pools:</strong> Collections of funds that enable various DeFi operations</li>
<li><strong>Yield Farming:</strong> Opportunities to earn returns on deposited assets</li>
<li><strong>Governance Tokens:</strong> Community-driven decision-making processes</li>
</ul>

<h2>Benefits of {topic}</h2>

<p>{topic} offers numerous advantages over traditional financial systems, including lower fees, faster transactions, and global accessibility. Users can access these services 24/7 from anywhere in the world.</p>

<h2>Risks and Considerations</h2>

<p>While {topic} presents exciting opportunities, it's important to understand the risks involved. Smart contract vulnerabilities, market volatility, and regulatory uncertainty are factors to consider.</p>

<h2>The Future of {topic}</h2>

<p>As DeFi continues to evolve, {topic} is positioned to play a crucial role in the future of finance. Ongoing developments in scalability, security, and user experience will likely drive further adoption.</p>
        `
      }
    ]
  },
  {
    category: 'web3',
    templates: [
      {
        titleTemplate: 'Web3 and {topic}: The Next Generation of the Internet',
        contentTemplate: `
<h1>Web3 and {topic}: The Next Generation of the Internet</h1>

<p>Web3 represents a paradigm shift in how we interact with the internet, and {topic} is at the heart of this transformation. This article explores how {topic} is shaping the future of decentralized web technologies.</p>

<h2>Understanding Web3</h2>

<p>Web3 is the next evolution of the internet, built on blockchain technology and decentralized principles. Unlike Web2, which relies on centralized platforms, Web3 gives users ownership and control over their data and digital assets.</p>

<h2>{topic} in the Web3 Ecosystem</h2>

<p>{topic} plays a vital role in the Web3 ecosystem, providing essential infrastructure and services that enable decentralized applications to function effectively.</p>

<h2>Key Innovations</h2>

<p>The integration of {topic} with Web3 technologies has led to numerous innovations, including decentralized identity systems, NFT marketplaces, and blockchain-based social networks.</p>

<h2>Challenges and Opportunities</h2>

<p>While Web3 and {topic} offer tremendous potential, challenges such as scalability, user experience, and regulatory clarity need to be addressed for mainstream adoption.</p>

<h2>Conclusion</h2>

<p>{topic} is set to be a cornerstone of the Web3 revolution, offering new possibilities for how we create, share, and monetize digital content and services.</p>
        `
      }
    ]
  }
];

export class BlogGeneratorFallback {
  static async generateBlogPost(topic?: string): Promise<BlogPost> {
    // Get trending topic if not provided
    let selectedTopic = topic;
    if (!selectedTopic) {
      try {
        const trendingTopics = await googleTrendsService.getTrendingTopics(10);
        selectedTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)].keyword;
      } catch (error) {
        // Fallback topics if Google Trends fails
        const fallbackTopics = [
          'Bitcoin', 'Ethereum', 'DeFi', 'NFTs', 'Web3', 
          'Blockchain', 'Cryptocurrency', 'Smart Contracts', 'DAO', 'Tokenomics'
        ];
        selectedTopic = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
      }
    }

    // Select category and template
    const categories = ['crypto-news', 'defi', 'web3'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryData = blogTemplates.find(c => c.category === category) || blogTemplates[0];
    const template = categoryData.templates[Math.floor(Math.random() * categoryData.templates.length)];

    // Generate title
    const title = template.titleTemplate.replace('{topic}', selectedTopic);

    // Generate content
    let content = template.contentTemplate.replace(/{topic}/g, selectedTopic);
    
    // Add more dynamic content
    content += this.generateAdditionalSections(selectedTopic);

    // Generate excerpt
    const excerpt = this.generateExcerpt(content, selectedTopic);

    // Generate slug
    const slug = this.generateSlug(title);

    // Generate tags
    const tags = this.generateTags(selectedTopic, category);

    return {
      title,
      content,
      excerpt,
      category,
      tags,
      metaTitle: title.substring(0, 60),
      metaDescription: excerpt.substring(0, 155),
      slug
    };
  }

  private static generateAdditionalSections(topic: string): string {
    const sections = [
      `
<h2>Market Analysis</h2>
<p>The current market conditions for {topic} show promising signs of growth and stability. Analysts are optimistic about the long-term prospects, though short-term volatility remains a factor to consider.</p>
      `,
      `
<h2>Technical Deep Dive</h2>
<p>From a technical perspective, {topic} utilizes advanced cryptographic methods and consensus mechanisms to ensure security and reliability. Understanding these technical aspects can help users make more informed decisions.</p>
      `,
      `
<h2>Community and Ecosystem</h2>
<p>The {topic} community is vibrant and growing, with developers, investors, and enthusiasts contributing to the ecosystem's development. This active community is a key driver of innovation and adoption.</p>
      `
    ];

    return sections[Math.floor(Math.random() * sections.length)].replace(/{topic}/g, topic);
  }

  private static generateExcerpt(content: string, topic: string): string {
    const text = content.replace(/<[^>]*>/g, '');
    const sentences = text.split('.').filter(s => s.trim().length > 20);
    const excerpt = sentences.slice(0, 2).join('. ').trim();
    return excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt;
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private static generateTags(topic: string, category: string): string[] {
    const baseTags = [category, topic.toLowerCase()];
    const commonTags = ['crypto', 'blockchain', 'web3', 'defi', 'nft', 'bitcoin', 'ethereum'];
    const selectedTags = commonTags
      .filter(tag => tag !== category && tag !== topic.toLowerCase())
      .slice(0, 3);
    
    return [...baseTags, ...selectedTags].slice(0, 6);
  }
}

