'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase.client';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import RoleGate from "@/components/RoleGate";
import BlockchainCard from "@/components/ui/BlockchainCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import StandardLoading from "@/components/ui/StandardLoading";
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Investment {
  id: string;
  projectName: string;
  projectDescription: string;
  investmentAmount: number;
  investmentDate: Date;
  currentValue: number;
  roi: number;
  stage: string;
  sector: string;
  founderName: string;
  status: 'active' | 'exited' | 'pending';
  logoUrl?: string;
  acceptedAt: string;
}

interface AnalyticsData {
  totalInvested: number;
  totalCurrentValue: number;
  totalROI: number;
  activeInvestments: number;
  exitedInvestments: number;
  averageROI: number;
  bestPerformer: {
    name: string;
    roi: number;
  } | null;
  worstPerformer: {
    name: string;
    roi: number;
  } | null;
  monthlyPerformance: Array<{
    month: string;
    value: number;
    roi: number;
    count: number;
  }>;
  sectorBreakdown: Array<{
    sector: string;
    count: number;
    totalValue: number;
    percentage: number;
  }>;
  stageBreakdown: Array<{
    stage: string;
    count: number;
    totalValue: number;
    percentage: number;
  }>;
}

export default function PortfolioAnalytics() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');

  useEffect(() => {
    if (!user) return;

    const setupListener = async () => {
      const isReady = await waitForFirebase(5000);
      if (!isReady) {
        console.error('❌ Firebase not initialized');
        return;
      }

      try {
        const dbInstance = ensureDb();
        console.log('📊 Loading real-time portfolio analytics for:', user.email);

        // Load real portfolio data from database
        const portfolioQuery = query(
          collection(dbInstance, 'projects'),
          where('status', '==', 'accepted'),
          where('acceptedBy', '==', user.uid),
          orderBy('acceptedAt', 'desc')
        );

        const unsubscribe = onSnapshot(portfolioQuery, (snapshot) => {
          console.log('📊 Portfolio projects found:', snapshot.docs.length);
          
          const portfolioData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Calculate simulated current value and ROI based on project data
            const investmentAmount = data.fundingGoal || data.investmentAmount || 100000;
            const monthsSinceInvestment = data.acceptedAt 
              ? Math.floor((Date.now() - new Date(data.acceptedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
              : 0;
            
            // Simulate growth based on RaftAI score and time
            const raftaiScore = data.raftai?.score || 70;
            const growthFactor = (raftaiScore / 100) * (1 + monthsSinceInvestment * 0.05); // Higher score = better growth
            const currentValue = investmentAmount * growthFactor;
            const roi = ((currentValue - investmentAmount) / investmentAmount) * 100;
            
            return {
              id: doc.id,
              projectName: data.name || data.title || 'Unknown Project',
              projectDescription: data.description || data.tagline || 'No description available',
              investmentAmount: investmentAmount,
              investmentDate: data.acceptedAt ? new Date(data.acceptedAt) : new Date(),
              currentValue: currentValue,
              roi: roi,
              stage: data.stage || data.fundingStage || 'Unknown',
              sector: data.sector || 'Unknown',
              founderName: data.founderName || 'Unknown Founder',
              status: 'active' as const,
              logoUrl: data.logoUrl,
              acceptedAt: data.acceptedAt
            };
          });

          setInvestments(portfolioData);
          calculateAnalytics(portfolioData);
          setDataLoading(false);
        }, (error) => {
          console.error('❌ Error loading portfolio analytics:', error);
          setInvestments([]);
          setDataLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setDataLoading(false);
        return () => {};
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user]);

  const calculateAnalytics = (portfolioData: Investment[]) => {
    if (portfolioData.length === 0) {
      setAnalyticsData(null);
      return;
    }

    console.log('📊 Calculating analytics for', portfolioData.length, 'investments');

    // Filter by timeframe
    const now = new Date();
    let filteredData = portfolioData;

    if (selectedTimeframe !== 'ALL') {
      const monthsMap = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 };
      const months = monthsMap[selectedTimeframe];
      const cutoffDate = new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
      
      filteredData = portfolioData.filter(inv => 
        inv.investmentDate >= cutoffDate
      );
    }

    console.log('📊 Filtered data for', selectedTimeframe, ':', filteredData.length, 'investments');

    // Calculate totals
    const totalInvested = filteredData.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const totalCurrentValue = filteredData.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalROI = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;
    const activeInvestments = filteredData.filter(inv => inv.status === 'active').length;
    const exitedInvestments = filteredData.filter(inv => inv.status === 'exited').length;
    const averageROI = filteredData.length > 0 
      ? filteredData.reduce((sum, inv) => sum + inv.roi, 0) / filteredData.length 
      : 0;

    // Find best and worst performers
    const sortedByROI = [...filteredData].sort((a, b) => b.roi - a.roi);
    const bestPerformer = sortedByROI.length > 0 
      ? { name: sortedByROI[0].projectName, roi: sortedByROI[0].roi }
      : null;
    const worstPerformer = sortedByROI.length > 0 
      ? { name: sortedByROI[sortedByROI.length - 1].projectName, roi: sortedByROI[sortedByROI.length - 1].roi }
      : null;

    // Calculate monthly performance
    const monthlyMap = new Map<string, { value: number, count: number, investments: Investment[] }>();
    
    filteredData.forEach(inv => {
      const monthKey = inv.investmentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { value: 0, count: 0, investments: [] });
      }
      const monthData = monthlyMap.get(monthKey)!;
      monthData.value += inv.currentValue;
      monthData.count += 1;
      monthData.investments.push(inv);
    });

    const monthlyPerformance = Array.from(monthlyMap.entries())
      .map(([month, data]) => {
        const monthInvested = data.investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
        const monthROI = monthInvested > 0 
          ? ((data.value - monthInvested) / monthInvested) * 100 
          : 0;
        return {
          month,
          value: data.value,
          roi: monthROI,
          count: data.count
        };
      })
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months

    // Sector breakdown
    const sectorMap = new Map<string, { count: number, totalValue: number }>();
    filteredData.forEach(inv => {
      const sector = inv.sector || 'Unknown';
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { count: 0, totalValue: 0 });
      }
      const sectorData = sectorMap.get(sector)!;
      sectorData.count += 1;
      sectorData.totalValue += inv.currentValue;
    });

    const sectorBreakdown = Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        count: data.count,
        totalValue: data.totalValue,
        percentage: totalCurrentValue > 0 ? (data.totalValue / totalCurrentValue) * 100 : 0
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    // Stage breakdown
    const stageMap = new Map<string, { count: number, totalValue: number }>();
    filteredData.forEach(inv => {
      const stage = inv.stage || 'Unknown';
      if (!stageMap.has(stage)) {
        stageMap.set(stage, { count: 0, totalValue: 0 });
      }
      const stageData = stageMap.get(stage)!;
      stageData.count += 1;
      stageData.totalValue += inv.currentValue;
    });

    const stageBreakdown = Array.from(stageMap.entries())
      .map(([stage, data]) => ({
        stage,
        count: data.count,
        totalValue: data.totalValue,
        percentage: totalCurrentValue > 0 ? (data.totalValue / totalCurrentValue) * 100 : 0
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const analytics: AnalyticsData = {
      totalInvested,
      totalCurrentValue,
      totalROI,
      activeInvestments,
      exitedInvestments,
      averageROI,
      bestPerformer,
      worstPerformer,
      monthlyPerformance,
      sectorBreakdown,
      stageBreakdown
    };

    console.log('✅ Analytics calculated:', {
      totalInvestments: filteredData.length,
      totalROI: totalROI.toFixed(2) + '%',
      bestPerformer: bestPerformer?.name
    });

    setAnalyticsData(analytics);
  };

  // Recalculate when timeframe changes
  useEffect(() => {
    if (investments.length > 0) {
      calculateAnalytics(investments);
    }
  }, [selectedTimeframe, investments]);

  const exportReport = () => {
    if (!analyticsData || !user) return;

    console.log('📥 Exporting portfolio report...');

    // Create comprehensive JSON report
    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: user.email,
      timeframe: selectedTimeframe,
      summary: {
        totalInvestments: analyticsData.activeInvestments + analyticsData.exitedInvestments,
        totalInvested: analyticsData.totalInvested,
        totalCurrentValue: analyticsData.totalCurrentValue,
        totalProfit: analyticsData.totalCurrentValue - analyticsData.totalInvested,
        totalROI: analyticsData.totalROI,
        averageROI: analyticsData.averageROI,
        activeInvestments: analyticsData.activeInvestments,
        exitedInvestments: analyticsData.exitedInvestments
      },
      bestPerformer: analyticsData.bestPerformer,
      worstPerformer: analyticsData.worstPerformer,
      monthlyPerformance: analyticsData.monthlyPerformance,
      sectorBreakdown: analyticsData.sectorBreakdown,
      stageBreakdown: analyticsData.stageBreakdown,
      investments: investments.map(inv => ({
        projectName: inv.projectName,
        sector: inv.sector,
        stage: inv.stage,
        investmentAmount: inv.investmentAmount,
        currentValue: inv.currentValue,
        roi: inv.roi,
        investmentDate: inv.investmentDate.toISOString(),
        status: inv.status
      }))
    };
    
    // Export JSON
    const jsonStr = JSON.stringify(reportData, null, 2);
    const jsonUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(jsonStr);
    const jsonFileName = `portfolio-analytics-${selectedTimeframe.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    
    const jsonLink = document.createElement('a');
    jsonLink.setAttribute('href', jsonUri);
    jsonLink.setAttribute('download', jsonFileName);
    jsonLink.click();
    
    // Export CSV
    const csvData = [
      ['Portfolio Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Generated By:', user.email || ''],
      ['Timeframe:', selectedTimeframe],
      [''],
      ['SUMMARY METRICS'],
      ['Total Investments', (analyticsData.activeInvestments + analyticsData.exitedInvestments).toString()],
      ['Total Invested', `$${(analyticsData.totalInvested / 1000000).toFixed(2)}M`],
      ['Current Value', `$${(analyticsData.totalCurrentValue / 1000000).toFixed(2)}M`],
      ['Total Profit', `$${((analyticsData.totalCurrentValue - analyticsData.totalInvested) / 1000000).toFixed(2)}M`],
      ['Total ROI', `${analyticsData.totalROI.toFixed(2)}%`],
      ['Average ROI', `${analyticsData.averageROI.toFixed(2)}%`],
      ['Active Investments', analyticsData.activeInvestments.toString()],
      ['Exited Investments', analyticsData.exitedInvestments.toString()],
      [''],
      ['BEST PERFORMER'],
      ['Project', analyticsData.bestPerformer?.name || 'N/A'],
      ['ROI', analyticsData.bestPerformer ? `${analyticsData.bestPerformer.roi.toFixed(2)}%` : 'N/A'],
      [''],
      ['WORST PERFORMER'],
      ['Project', analyticsData.worstPerformer?.name || 'N/A'],
      ['ROI', analyticsData.worstPerformer ? `${analyticsData.worstPerformer.roi.toFixed(2)}%` : 'N/A'],
      [''],
      ['MONTHLY PERFORMANCE'],
      ['Month', 'Value', 'ROI', 'Investments'],
      ...analyticsData.monthlyPerformance.map(m => [
        m.month, 
        `$${(m.value / 1000000).toFixed(2)}M`, 
        `${m.roi.toFixed(2)}%`,
        m.count.toString()
      ]),
      [''],
      ['SECTOR BREAKDOWN'],
      ['Sector', 'Count', 'Total Value', 'Percentage'],
      ...analyticsData.sectorBreakdown.map(s => [
        s.sector,
        s.count.toString(),
        `$${(s.totalValue / 1000000).toFixed(2)}M`,
        `${s.percentage.toFixed(2)}%`
      ]),
      [''],
      ['STAGE BREAKDOWN'],
      ['Stage', 'Count', 'Total Value', 'Percentage'],
      ...analyticsData.stageBreakdown.map(s => [
        s.stage,
        s.count.toString(),
        `$${(s.totalValue / 1000000).toFixed(2)}M`,
        `${s.percentage.toFixed(2)}%`
      ]),
      [''],
      ['DETAILED INVESTMENTS'],
      ['Project', 'Sector', 'Stage', 'Investment', 'Current Value', 'ROI', 'Status', 'Investment Date'],
      ...investments.map(inv => [
        inv.projectName,
        inv.sector,
        inv.stage,
        `$${(inv.investmentAmount / 1000).toFixed(0)}K`,
        `$${(inv.currentValue / 1000).toFixed(0)}K`,
        `${inv.roi.toFixed(2)}%`,
        inv.status,
        inv.investmentDate.toLocaleDateString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const csvUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
    const csvFileName = `portfolio-analytics-${selectedTimeframe.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    
    const csvLink = document.createElement('a');
    csvLink.setAttribute('href', csvUri);
    csvLink.setAttribute('download', csvFileName);
    csvLink.click();
    
    console.log('✅ Portfolio report exported:', csvFileName);
    alert(`✅ Report exported successfully!\n\nFiles downloaded:\n- ${jsonFileName}\n- ${csvFileName}`);
  };

  const getROIColor = (roi: number) => {
    if (roi > 0) return 'text-green-400';
    if (roi < 0) return 'text-red-400';
    return 'text-white';
  };

  const getROIIcon = (roi: number) => {
    if (roi > 0) return <ArrowUpIcon className="w-4 h-4 text-green-400" />;
    if (roi < 0) return <ArrowDownIcon className="w-4 h-4 text-red-400" />;
    return null;
  };

  if (isLoading || dataLoading) {
    return <StandardLoading title="Loading Analytics" message="Analyzing your portfolio performance..." />;
  }

  if (!analyticsData) {
    return (
      <RoleGate requiredRole="vc">
        <div className="min-h-screen relative neo-blue-background">
          <div className="container-perfect relative z-10 py-12">
            <div className="neo-glass-card rounded-2xl p-12 text-center">
              <ChartBarIcon className="w-20 h-20 text-white/40 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">No Portfolio Data</h2>
              <p className="text-white/70 text-lg mb-6">
                You haven't accepted any projects yet. Start investing to see analytics.
              </p>
              <AnimatedButton
                variant="primary"
                size="lg"
                onClick={() => router.push('/vc/dashboard')}
              >
                Browse Dealflow
              </AnimatedButton>
            </div>
          </div>
        </div>
      </RoleGate>
    );
  }

  return (
    <RoleGate requiredRole="vc">
      <div className="min-h-screen relative neo-blue-background">
        <div className="container-perfect relative z-10 py-8">
          {/* Header */}
          <div className="neo-glass-card rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Portfolio Analytics</h1>
                <p className="text-white/60 text-lg">Real-time analysis of your investment portfolio</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="1M">Last Month</option>
                  <option value="3M">Last 3 Months</option>
                  <option value="6M">Last 6 Months</option>
                  <option value="1Y">Last Year</option>
                  <option value="ALL">All Time</option>
                </select>
                <AnimatedButton
                  variant="primary"
                  size="md"
                  icon={<DocumentArrowDownIcon className="w-5 h-5" />}
                  onClick={exportReport}
                >
                  Export Report
                </AnimatedButton>
              </div>
            </div>

            {/* RaftAI Disclaimer */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-xs flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                <span><strong>Note:</strong> ROI calculations are based on real-time data and RaftAI project scores. Current values are simulated based on project performance indicators. Actual returns may vary.</span>
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <BlockchainCard variant="default" size="md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-white/60 text-sm mb-1">Total Invested</p>
                  <p className="text-2xl font-bold text-white">${(analyticsData.totalInvested / 1000000).toFixed(2)}M</p>
                </div>
                <CurrencyDollarIcon className="h-8 w-8 text-blue-400 flex-shrink-0" />
              </div>
              <div className="flex items-center text-blue-400 text-sm">
                <span>Capital Deployed</span>
              </div>
            </BlockchainCard>

            <BlockchainCard variant="default" size="md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-white/60 text-sm mb-1">Current Value</p>
                  <p className="text-2xl font-bold text-white">${(analyticsData.totalCurrentValue / 1000000).toFixed(2)}M</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-green-400 flex-shrink-0" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <span>Portfolio Value</span>
              </div>
            </BlockchainCard>

            <BlockchainCard variant="default" size="md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-white/60 text-sm mb-1">Total ROI</p>
                  <p className={`text-2xl font-bold ${getROIColor(analyticsData.totalROI)}`}>
                    {analyticsData.totalROI > 0 ? '+' : ''}{analyticsData.totalROI.toFixed(1)}%
                  </p>
                </div>
                <div className="flex items-center">
                  {getROIIcon(analyticsData.totalROI)}
                </div>
              </div>
              <div className="flex items-center text-purple-400 text-sm">
                <span>Return on Investment</span>
              </div>
            </BlockchainCard>

            <BlockchainCard variant="default" size="md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-white/60 text-sm mb-1">Active Investments</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.activeInvestments}</p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-orange-400 flex-shrink-0" />
              </div>
              <div className="flex items-center text-orange-400 text-sm">
                <span>Portfolio Size</span>
              </div>
            </BlockchainCard>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Performance Chart */}
            <BlockchainCard variant="default" size="lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Portfolio Performance</h3>
                <p className="text-white/60 text-sm">Monthly value and ROI trends ({selectedTimeframe})</p>
              </div>
              
              {analyticsData.monthlyPerformance.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.monthlyPerformance.map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex-1">
                        <p className="text-white font-medium">{month.month}</p>
                        <p className="text-white/60 text-sm">${(month.value / 1000000).toFixed(2)}M • {month.count} {month.count === 1 ? 'investment' : 'investments'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getROIIcon(month.roi)}
                        <span className={`font-semibold ${getROIColor(month.roi)}`}>
                          {month.roi > 0 ? '+' : ''}{month.roi.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No data for selected timeframe</p>
                </div>
              )}
            </BlockchainCard>

            {/* Top Performers */}
            <BlockchainCard variant="default" size="lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Top Performers</h3>
                <p className="text-white/60 text-sm">Best and worst performing investments</p>
              </div>
              
              <div className="space-y-4">
                {analyticsData.bestPerformer && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">Best Performer 🏆</h4>
                      <ArrowUpIcon className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-white/80 text-sm mb-1">{analyticsData.bestPerformer.name}</p>
                    <p className="text-green-400 font-bold text-xl">
                      +{analyticsData.bestPerformer.roi.toFixed(1)}%
                    </p>
                  </div>
                )}

                {analyticsData.worstPerformer && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">Worst Performer</h4>
                      <ArrowDownIcon className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-white/80 text-sm mb-1">{analyticsData.worstPerformer.name}</p>
                    <p className="text-red-400 font-bold text-xl">
                      {analyticsData.worstPerformer.roi.toFixed(1)}%
                    </p>
                  </div>
                )}

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Average ROI</h4>
                    <ArrowTrendingUpIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-white/80 text-sm mb-1">Portfolio Average</p>
                  <p className="text-blue-400 font-bold text-xl">
                    {analyticsData.averageROI > 0 ? '+' : ''}{analyticsData.averageROI.toFixed(1)}%
                  </p>
                </div>
              </div>
            </BlockchainCard>
          </div>

          {/* Sector & Stage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Sector Breakdown */}
            <BlockchainCard variant="default" size="lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Sector Breakdown</h3>
                <p className="text-white/60 text-sm">Investment distribution by sector</p>
              </div>
              
              {analyticsData.sectorBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.sectorBreakdown.map((sector) => (
                    <div key={sector.sector} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{sector.sector}</span>
                        <span className="text-white/60 text-sm">{sector.count} {sector.count === 1 ? 'investment' : 'investments'}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-sm">${(sector.totalValue / 1000000).toFixed(2)}M</span>
                        <span className="text-blue-400 font-semibold">{sector.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${sector.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No sector data available</p>
                </div>
              )}
            </BlockchainCard>

            {/* Stage Breakdown */}
            <BlockchainCard variant="default" size="lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Stage Breakdown</h3>
                <p className="text-white/60 text-sm">Investment distribution by stage</p>
              </div>
              
              {analyticsData.stageBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.stageBreakdown.map((stage) => (
                    <div key={stage.stage} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{stage.stage}</span>
                        <span className="text-white/60 text-sm">{stage.count} {stage.count === 1 ? 'investment' : 'investments'}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-sm">${(stage.totalValue / 1000000).toFixed(2)}M</span>
                        <span className="text-green-400 font-semibold">{stage.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stage.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No stage data available</p>
                </div>
              )}
            </BlockchainCard>
          </div>

          {/* Investment Summary */}
          <BlockchainCard variant="default" size="lg">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Investment Summary</h3>
              <p className="text-white/60 text-sm">Key portfolio metrics and insights</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-4xl font-bold text-white mb-2">{analyticsData.activeInvestments + analyticsData.exitedInvestments}</div>
                <div className="text-white/60 text-sm">Total Investments</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-4xl font-bold text-white mb-2">{analyticsData.exitedInvestments}</div>
                <div className="text-white/60 text-sm">Exited Investments</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className={`text-4xl font-bold mb-2 ${getROIColor(analyticsData.totalCurrentValue - analyticsData.totalInvested)}`}>
                  ${((analyticsData.totalCurrentValue - analyticsData.totalInvested) / 1000000).toFixed(2)}M
                </div>
                <div className="text-white/60 text-sm">Total Profit/Loss</div>
              </div>
            </div>
          </BlockchainCard>

          {/* Detailed Investment List */}
          <BlockchainCard variant="default" size="lg" className="mt-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Detailed Investment List</h3>
              <p className="text-white/60 text-sm">{investments.length} total investments</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/60 text-sm font-medium pb-3">Project</th>
                    <th className="text-left text-white/60 text-sm font-medium pb-3">Sector</th>
                    <th className="text-left text-white/60 text-sm font-medium pb-3">Stage</th>
                    <th className="text-right text-white/60 text-sm font-medium pb-3">Investment</th>
                    <th className="text-right text-white/60 text-sm font-medium pb-3">Current Value</th>
                    <th className="text-right text-white/60 text-sm font-medium pb-3">ROI</th>
                    <th className="text-center text-white/60 text-sm font-medium pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {inv.logoUrl && (
                            <img src={inv.logoUrl} alt={inv.projectName} className="w-8 h-8 rounded-lg" />
                          )}
                          <span className="text-white font-medium">{inv.projectName}</span>
                        </div>
                      </td>
                      <td className="py-4 text-white/70">{inv.sector}</td>
                      <td className="py-4 text-white/70">{inv.stage}</td>
                      <td className="py-4 text-right text-white">${(inv.investmentAmount / 1000).toFixed(0)}K</td>
                      <td className="py-4 text-right text-white">${(inv.currentValue / 1000).toFixed(0)}K</td>
                      <td className="py-4 text-right">
                        <span className={`font-semibold ${getROIColor(inv.roi)}`}>
                          {inv.roi > 0 ? '+' : ''}{inv.roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BlockchainCard>
        </div>
      </div>
    </RoleGate>
  );
}
