"use client";

import { useMemo } from "react";
import { ChartBarIcon, CurrencyDollarIcon, ChartPieIcon } from "@heroicons/react/24/outline";

interface Project {
  id: string;
  sector?: string;
  funding?: {
    target?: number;
    raised?: number;
  };
  createdAt?: any;
}

interface DealflowAnalyticsProps {
  projects: Project[];
}

export default function DealflowAnalytics({ projects }: DealflowAnalyticsProps) {
  // Category distribution
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    projects.forEach(project => {
      const category = project.sector || 'Other';
      categories[category] = (categories[category] || 0) + 1;
    });
    return Object.entries(categories).map(([name, count]) => ({
      name,
      count,
      percentage: projects.length > 0 ? (count / projects.length) * 100 : 0
    }));
  }, [projects]);

  // Funding by category
  const fundingByCategory = useMemo(() => {
    const funding: Record<string, number> = {};
    projects.forEach(project => {
      const category = project.sector || 'Other';
      funding[category] = (funding[category] || 0) + (project.funding?.raised || 0);
    });
    const totalRaised = projects.reduce((sum, p) => sum + (p.funding?.raised || 0), 0);
    return Object.entries(funding).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalRaised > 0 ? (amount / totalRaised) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [projects]);

  // Monthly funding
  const monthlyFunding = useMemo(() => {
    const monthly: Record<string, number> = {};
    projects.forEach(project => {
      if (project.createdAt) {
        const date = project.createdAt.toDate ? project.createdAt.toDate() : new Date(project.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthly[monthKey] = (monthly[monthKey] || 0) + (project.funding?.raised || 0);
      }
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount
      }));
  }, [projects]);

  // Cumulative growth
  const cumulativeGrowth = useMemo(() => {
    let cumulative = 0;
    return monthlyFunding.map(({ month, amount }) => {
      cumulative += amount;
      return { month, cumulative };
    });
  }, [monthlyFunding]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-yellow-500',
    'bg-red-500'
  ];

  return (
    <div className="neo-glass-card rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <ChartBarIcon className="w-6 h-6" />
        Analytics & Insights
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution (Pie Chart) */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ChartPieIcon className="w-5 h-5" />
            Projects by Category
          </h4>
          <div className="space-y-3">
            {categoryData.length > 0 ? (
              categoryData.map((item, index) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 text-sm">{item.name}</span>
                    <span className="text-white text-sm font-semibold">{item.count} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/60 text-sm">No category data available</p>
            )}
          </div>
        </div>

        {/* Funding by Category (Bar Chart) */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5" />
            Funding by Category
          </h4>
          <div className="space-y-3">
            {fundingByCategory.length > 0 ? (
              fundingByCategory.slice(0, 5).map((item, index) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 text-sm">{item.name}</span>
                    <span className="text-white text-sm font-semibold">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className={`${colors[index % colors.length]} h-3 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/60 text-sm">No funding data available</p>
            )}
          </div>
        </div>

        {/* Monthly Funding (Bar Chart) */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Monthly Funding</h4>
          <div className="space-y-3">
            {monthlyFunding.length > 0 ? (
              monthlyFunding.map((item, index) => {
                const maxAmount = Math.max(...monthlyFunding.map(m => m.amount), 1);
                return (
                  <div key={item.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 text-sm">{item.month}</span>
                      <span className="text-white text-sm font-semibold">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-white/60 text-sm">No monthly funding data available</p>
            )}
          </div>
        </div>

        {/* Cumulative Growth (Line Graph) */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Cumulative Growth</h4>
          <div className="relative h-48">
            {cumulativeGrowth.length > 0 ? (
              <>
                <div className="absolute inset-0 flex items-end justify-between gap-2">
                  {cumulativeGrowth.map((item, index) => {
                    const maxCumulative = Math.max(...cumulativeGrowth.map(c => c.cumulative), 1);
                    const height = maxCumulative > 0 ? (item.cumulative / maxCumulative) * 100 : 0;
                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center">
                        <div className="relative w-full h-full flex items-end">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-cyan-600 rounded-t transition-all duration-300"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="text-white/60 text-xs mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                          {item.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute top-0 right-0 text-white/60 text-xs">
                  Total: {formatCurrency(cumulativeGrowth[cumulativeGrowth.length - 1]?.cumulative || 0)}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60 text-sm">No growth data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

