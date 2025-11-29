"use client";

import { useEffect, useState } from "react";
import { FireIcon } from "@heroicons/react/24/outline";

interface Project {
  id: string;
  title?: string;
  name?: string;
  funding?: {
    raised?: number;
    recentRaised?: number;
  };
  ido?: {
    status?: 'upcoming' | 'live' | 'completed';
  };
  updatedAt?: any;
}

interface LiveTickerProps {
  projects: Project[];
}

interface TickerItem {
  id: string;
  text: string;
  timestamp: number;
}

export default function LiveTicker({ projects }: LiveTickerProps) {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    // Generate ticker items from active projects
    const activeProjects = projects.filter(p => 
      p.ido?.status === 'live' || p.ido?.status === 'upcoming'
    );

    const items: TickerItem[] = activeProjects.slice(0, 5).map(project => {
      const name = project.title || project.name || 'Project';
      const raised = project.funding?.raised || 0;
      const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount}`;
      };

      return {
        id: project.id,
        text: `${name} raised ${formatCurrency(raised)} in last 24h`,
        timestamp: Date.now()
      };
    });

    setTickerItems(items);

    // Simulate new updates every 10 seconds
    const interval = setInterval(() => {
      if (items.length > 0) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        setTickerItems(prev => [
          { ...randomItem, id: `${Date.now()}`, timestamp: Date.now() },
          ...prev.slice(0, 4)
        ]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [projects]);

  if (tickerItems.length === 0) {
    return null;
  }

  return (
    <div className="neo-glass-card rounded-xl p-4 mb-6 border border-white/10 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-orange-400">
          <FireIcon className="w-5 h-5 animate-pulse" />
          <span className="font-semibold text-sm">Live Updates</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-8 animate-scroll">
            {tickerItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex-shrink-0 text-white/80 text-sm whitespace-nowrap">
                {item.text}
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {tickerItems.map((item, index) => (
              <div key={`${item.id}-dup-${index}`} className="flex-shrink-0 text-white/80 text-sm whitespace-nowrap">
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

