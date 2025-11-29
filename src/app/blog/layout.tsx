import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - CryptoRafts",
  description: "Latest news, insights, and guides about crypto, Web3, DeFi, and blockchain technology. Stay updated with CryptoRafts blog.",
  keywords: ["crypto blog", "blockchain news", "Web3", "DeFi", "cryptocurrency", "blockchain technology"],
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

