import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useData } from '../context/DataContext';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  Percent, 
  Activity, 
  Loader2, 
  Download, 
  Image as ImageIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Info,
  FileText,
  Share2,
  Zap,
  Target,
  ShieldAlert
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/Button';
import { InfoTooltip } from './benchmark/shared';
import { downloadCSV } from '../utils/download';
import { downloadSVG } from '../utils/downloadSvg';
import { DataSourceFooter } from './DataSourceFooter';

interface OverviewProps {
  analysisSummary?: string | null;
  isSyncing?: boolean;
  onTabChange: (tab: string) => void;
}

type TimeRange = '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

export function Overview({ analysisSummary, isSyncing, onTabChange }: OverviewProps) {
  const { performanceData, holdingsData, transactionsData, benchmarks, riskFreeRate, correlationMatrix, selectedBenchmark, setSelectedBenchmark } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

  const firstTransactionDate = useMemo(() => {
    if (!transactionsData || transactionsData.length === 0) return null;
    const dates = transactionsData.map(t => new Date(t.date).getTime());
    return new Date(Math.min(...dates));
  }, [transactionsData]);

  const totalValue = holdingsData.reduce((sum, item) => sum + item.totalValue, 0);
  const totalGainLossSinceInception = holdingsData.reduce((sum, item) => sum + item.totalGainLoss, 0);
  
  const filteredPerformanceData = useMemo(() => {
    const sortedData = [...performanceData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedData.length === 0) return [];

    const latestDate = new Date(sortedData[sortedData.length - 1].date);
    let startDate = new Date(sortedData[0].date);

    if (timeRange === '1M') {
      startDate = new Date(latestDate);
      startDate.setUTCMonth(startDate.getUTCMonth() - 1);
    } else if (timeRange === '3M') {
      startDate = new Date(latestDate);
      startDate.setUTCMonth(startDate.getUTCMonth() - 3);
    } else if (timeRange === 'YTD') {
      startDate = new Date(Date.UTC(latestDate.getUTCFullYear(), 0, 1));
    } else if (timeRange === '1Y') {
      startDate = new Date(latestDate);
      startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
    } else if (timeRange === 'ALL' && firstTransactionDate) {
      startDate = new Date(firstTransactionDate);
    }

    startDate.setUTCHours(0, 0, 0, 0);
    const filtered = sortedData.filter(d => new Date(d.date) >= startDate);
    if (filtered.length === 0) return [];

    const portfolioStartValue = filtered[0].value;
    return filtered.map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Portfolio: portfolioStartValue > 0 ? ((d.value / portfolioStartValue) - 1) * 100 : 0,
      [selectedBenchmark]: filtered[0][selectedBenchmark] > 0 ? ((d[selectedBenchmark] / filtered[0][selectedBenchmark]) - 1) * 100 : 0
    }));
  }, [timeRange, performanceData, selectedBenchmark, firstTransactionDate]);

  const { maxDrawdown, annualizedVol, annualizedReturn } = useMemo(() => {
    let vol = 0;
    let ret = 0;
    let mdd = 0;

    if (filteredPerformanceData.length >= 5) {
      const returns = [];
      let peak = filteredPerformanceData[0].value;
      
      for (let i = 1; i < filteredPerformanceData.length; i++) {
        const current = filteredPerformanceData[i].value;
        const prev = filteredPerformanceData[i-1].value;
        if (prev > 0) {
          returns.push((current / prev) - 1);
        }
        
        if (current > peak) {
          peak = current;
        }
        const dd = (current - peak) / peak;
        if (dd < mdd) {
          mdd = dd;
        }
      }

      if (returns.length > 0) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        vol = Math.sqrt(variance) * Math.sqrt(252) * 100;
      }

      const first = filteredPerformanceData[0].value;
      const last = filteredPerformanceData[filteredPerformanceData.length - 1].value;
      const days = (new Date(filteredPerformanceData[filteredPerformanceData.length - 1].date).getTime() - new Date(filteredPerformanceData[0].date).getTime()) / (1000 * 60 * 60 * 24);
      
      if (days >= 1 && first > 0) {
        const totalReturn = (last / first) - 1;
        ret = (Math.pow(1 + totalReturn, 365 / days) - 1) * 100;
      }
    }
    
    return { annualizedVol: vol, annualizedReturn: ret, maxDrawdown: mdd * 100 };
  }, [filteredPerformanceData]);

  const sharpeRatio = useMemo(() => {
    const vol = annualizedVol / 100;
    const ret = annualizedReturn / 100;
    const rf = riskFreeRate;
    if (vol === 0) return 0;
    return (ret - rf) / vol;
  }, [annualizedReturn, annualizedVol, riskFreeRate]);

  const healthScore = useMemo(() => {
    let score = 50;
    const safeSharpe = isNaN(sharpeRatio) ? 0 : sharpeRatio;
    const safeVol = isNaN(annualizedVol) ? 0 : annualizedVol;
    
    if (safeSharpe > 1.5) score += 30;
    else if (safeSharpe > 1) score += 20;
    else if (safeSharpe > 0.5) score += 10;
    
    if (safeVol > 0 && safeVol < 10) score += 10;
    else if (safeVol > 30) score -= 10;
    
    const assetClasses = new Set(holdingsData.map(h => h.assetClass)).size;
    if (assetClasses >= 4) score += 10;
    
    const finalScore = Math.max(0, Math.min(score, 100));
    return isNaN(finalScore) ? 0 : finalScore;
  }, [sharpeRatio, annualizedVol, holdingsData]);

  const assetAllocation = useMemo(() => {
    const allocation: Record<string, number> = {};
    let allocTotalValue = 0;
    holdingsData.forEach(h => {
      // Ignore negative holdings (e.g. short cash/margin) for pie chart, otherwise recharts crashes
      if (h.totalValue > 0) {
        allocation[h.assetClass] = (allocation[h.assetClass] || 0) + h.totalValue;
        allocTotalValue += h.totalValue;
      }
    });
    return Object.entries(allocation).map(([name, value]) => ({
      name,
      value: Math.max(0, value),
      percentage: allocTotalValue > 0 ? (value / allocTotalValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [holdingsData]);

  const coreSatelliteBreakdown = useMemo(() => {
    const satelliteSymbols = ['VGT', 'SCHY', 'REIT', 'SLV', 'XFIV', 'TXXI', 'PCMM'];
    let core = 0;
    let satellite = 0;
    let cash = 0;
    let total = 0;
    
    holdingsData.forEach(h => {
      if (h.totalValue > 0) {
        if (h.symbol === 'CASH') {
          cash += h.totalValue;
        } else if (satelliteSymbols.includes(h.symbol)) {
          satellite += h.totalValue;
        } else {
          core += h.totalValue;
        }
        total += h.totalValue;
      }
    });
    
    return {
      core: total > 0 ? (core / total) * 100 : 0,
      satellite: total > 0 ? (satellite / total) * 100 : 0,
      cash: total > 0 ? (cash / total) * 100 : 0,
    };
  }, [holdingsData]);

  const contributors = useMemo(() => [...holdingsData].filter(h => h.symbol !== 'CASH').sort((a, b) => b.totalGainLoss - a.totalGainLoss).slice(0, 3), [holdingsData]);
  const detractors = useMemo(() => [...holdingsData].filter(h => h.symbol !== 'CASH').sort((a, b) => a.totalGainLoss - b.totalGainLoss).slice(0, 3), [holdingsData]);

  const isHypothetical = useMemo(() => {
    if (!firstTransactionDate || filteredPerformanceData.length === 0) return false;
    const chartStartDate = new Date(filteredPerformanceData[0].date);
    // Add a small buffer for date comparison
    return chartStartDate.getTime() < (firstTransactionDate.getTime() - 86400000);
  }, [firstTransactionDate, filteredPerformanceData]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const contributorsList = useMemo(() => contributors.map(c => c.symbol).join(', '), [contributors]);
  const detractorsList = useMemo(() => detractors.map(d => d.symbol).join(', '), [detractors]);

  const diagnosticConfidence = useMemo(() => {
    if (performanceData.length > 252) return { score: 5, text: "High Reliability" }; // > 1 year
    if (performanceData.length > 126) return { score: 4, text: "Good Reliability" }; // > 6 months
    if (performanceData.length > 63) return { score: 3, text: "Moderate Reliability" }; // > 3 months
    return { score: 2, text: "Low Reliability" };
  }, [performanceData]);

  return (
    <div className="space-y-8 pb-12 animate-slam">
      {/* Mosaic Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        
        {/* Main Performance Attribution - Large Span */}
        <div className="md:col-span-8 terminal-card p-6 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="tech-label mb-1">Performance Attribution</div>
              <h3 
                className="text-xl font-bold font-display tracking-tight flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors group"
                onClick={() => onTabChange('analysis')}
              >
                Cumulative Growth vs Benchmark
                <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all" />
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                {(['1M', '3M', 'YTD', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-[10px] font-mono font-bold rounded-md transition-all ${
                      timeRange === range 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'text-terminal-muted hover:text-terminal-text'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <select
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono font-bold text-terminal-text shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors"
              >
                {benchmarks.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>
                ))}
              </select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onTabChange('analysis')}
                className="h-8 px-3 border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest gap-2"
              >
                <Activity className="h-3 w-3" />
                Deep Analysis
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredPerformanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(val) => `${val.toFixed(0)}%`}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#151921', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
                  }}
                  itemStyle={{ color: '#E2E8F0', fontSize: '11px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Portfolio" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  name="Portfolio"
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedBenchmark} 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={selectedBenchmark}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${isHypothetical ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-mono uppercase tracking-widest text-terminal-muted">
                {isHypothetical ? 'Hypothetical Backtest Mode' : 'Actual Performance Mode'}
              </span>
              <InfoTooltip 
                title={isHypothetical ? "Hypothetical Backtest" : "Actual Performance"} 
                description={isHypothetical 
                  ? "This view simulates how your CURRENT holdings would have performed over the selected period, even before your first transaction." 
                  : "This view shows the performance of your portfolio starting from your very first recorded transaction."}
                lookFor={isHypothetical ? "Use this to evaluate the historical strength of your current asset allocation." : "Use this to track your actual realized and unrealized gains over time."}
              />
            </div>
            {isHypothetical && (
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-mono text-amber-500/70 uppercase italic">
                  * Based on current quantities held back-dated
                </span>
                <InfoTooltip 
                  title="Back-Dated Simulation" 
                  description="In Backtest Mode, the system applies your current share quantities to historical price data. This assumes you held the same number of shares throughout the entire period, providing a 'what-if' scenario for your current strategy."
                  lookFor="Understand that this does not reflect your actual trading history or cash flows."
                />
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="tech-label mb-2 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-indigo-400" />
                Why did it happen?
              </div>
              <p className="text-xs text-terminal-muted leading-relaxed font-mono">
                Performance driven by strong contributions from <span className="text-terminal-text font-bold">{contributorsList}</span>. 
                {detractors.length > 0 && ` Offset by headwinds in ${detractorsList}.`}
              </p>
            </div>
            <div>
              <div className="tech-label mb-2 flex items-center gap-1.5">
                <Target className="h-3 w-3 text-emerald-400" />
                What to do?
              </div>
              <p className="text-xs text-terminal-muted leading-relaxed font-mono">
                {healthScore > 80 
                  ? "Maintain current allocation. Portfolio is highly optimized for risk-adjusted returns."
                  : healthScore > 60
                  ? "Consider rebalancing overweight positions to lock in gains and reduce concentration risk."
                  : "Urgent review of risk parameters recommended. Diversification benefits are currently suboptimal."}
              </p>
            </div>
            <div className="flex flex-col items-end justify-center">
              <div className="tech-label mb-2">Diagnostic Confidence</div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-1.5 w-4 rounded-full ${i <= diagnosticConfidence.score ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-white/10'}`} />
                ))}
              </div>
              <div className="text-[8px] text-terminal-muted mt-2 font-mono uppercase tracking-widest">{diagnosticConfidence.text}</div>
            </div>
          </div>
        </div>

        {/* Portfolio Health - Side Span */}
        <div className="md:col-span-4 terminal-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="tech-label mb-1">Risk Assessment</div>
                <div className="flex items-center gap-2">
                  <h3 
                    className="text-xl font-bold font-display tracking-tight flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors group"
                    onClick={() => onTabChange('benchmark')}
                  >
                    Portfolio Health
                    <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all" />
                  </h3>
                </div>
                {filteredPerformanceData.length > 0 && (
                  <p className="text-[9px] text-terminal-muted font-mono mt-1">
                    Metrics based on period: {filteredPerformanceData[0].displayDate} - {filteredPerformanceData[filteredPerformanceData.length - 1].displayDate}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onTabChange('benchmark')}
                className="h-6 px-2 text-[8px] font-bold uppercase tracking-widest text-terminal-muted hover:text-terminal-text"
              >
                Details
              </Button>
            </div>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative h-24 w-24">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path className="stroke-white/5" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path 
                    className="stroke-indigo-500 transition-all duration-1000 ease-out" 
                    strokeWidth="3" 
                    strokeDasharray={`${healthScore}, 100`} 
                    strokeLinecap="round" 
                    fill="none" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    style={{ filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold font-mono text-terminal-text">
                  {healthScore}
                </div>
              </div>
              <div>
                <div className={`text-xs font-bold uppercase tracking-tighter mb-1 ${healthScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {healthScore > 80 ? 'Optimized' : healthScore > 60 ? 'Stable' : 'Caution'}
                </div>
                <p className="text-[10px] text-terminal-muted leading-tight font-mono">
                  Sharpe Ratio: {sharpeRatio.toFixed(2)}<br />
                  Risk/Reward: {sharpeRatio > 1 ? 'Efficient' : 'Suboptimal'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-1.5">
                  <span className="tech-label group-hover:text-terminal-text transition-colors">Sharpe Ratio</span>
                  <InfoTooltip 
                    title="Sharpe Ratio" 
                    description="Measures excess return per unit of volatility." 
                    lookFor="Higher is better. >1.0 is good, >2.0 is excellent."
                  />
                </div>
                <span className={`tech-value ${sharpeRatio > 1 ? 'text-emerald-400' : 'text-terminal-text'}`}>{sharpeRatio.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-1.5">
                  <span className="tech-label group-hover:text-terminal-text transition-colors">Ann. Volatility</span>
                  <InfoTooltip 
                    title="Annualized Volatility" 
                    description="Measures how much the price fluctuates over a year." 
                    lookFor="Lower values indicate more stability."
                  />
                </div>
                <span className="tech-value">{annualizedVol.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-1.5">
                  <span className="tech-label group-hover:text-terminal-text transition-colors">Max Drawdown</span>
                  <InfoTooltip 
                    title="Max Drawdown" 
                    description="The largest peak-to-trough decline in portfolio value." 
                    lookFor="Smaller (less negative) is better."
                  />
                </div>
                <span className={`tech-value ${maxDrawdown < -5 ? 'text-rose-400' : 'text-terminal-text'}`}>{maxDrawdown.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-amber-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span className="tech-label text-amber-400">Action Required</span>
            </div>
            <p className="text-[10px] text-terminal-muted leading-relaxed font-mono">
              Correlation between top assets has increased. Diversification benefit is eroding. Review <span className="text-terminal-text font-bold">Deep Dive</span> for details.
            </p>
          </div>
        </div>

        {/* Asset Allocation - Middle Span */}
        <div className="md:col-span-4 terminal-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="tech-label mb-1">Exposure Analysis</div>
              <h3 
                className="text-lg font-bold font-display tracking-tight flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors group"
                onClick={() => onTabChange('holdings')}
              >
                Asset Allocation
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onTabChange('holdings')}
              className="h-6 px-2 text-[8px] font-bold uppercase tracking-widest text-terminal-muted hover:text-terminal-text"
            >
              Manage
            </Button>
          </div>
          
          <div className="h-[200px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#151921', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
                  }}
                  itemStyle={{ color: '#E2E8F0', fontSize: '11px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {assetAllocation.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-mono uppercase text-terminal-muted group-hover:text-terminal-text transition-colors">{item.name}</span>
                </div>
                <span className="text-[10px] font-mono font-bold">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-terminal-muted group-hover:text-terminal-text transition-colors uppercase">Core-Satellite Implementation</span>
            </div>
            
            <div className="h-4 w-full bg-slate-800 rounded-sm overflow-hidden flex gap-0.5">
              <div className="h-full bg-emerald-500" style={{ width: `${coreSatelliteBreakdown.core}%` }} title={`Core: ${coreSatelliteBreakdown.core.toFixed(1)}%`} />
              <div className="h-full bg-amber-500" style={{ width: `${coreSatelliteBreakdown.satellite}%` }} title={`Satellite: ${coreSatelliteBreakdown.satellite.toFixed(1)}%`} />
              {coreSatelliteBreakdown.cash > 0 && (
                <div className="h-full bg-slate-400" style={{ width: `${coreSatelliteBreakdown.cash}%` }} title={`Cash: ${coreSatelliteBreakdown.cash.toFixed(1)}%`} />
              )}
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-mono uppercase">
              <span className="text-emerald-400 font-bold">{coreSatelliteBreakdown.core.toFixed(1)}% Core (80% Tgt)</span>
               {coreSatelliteBreakdown.cash > 0 && <span className="text-slate-400 font-bold">{coreSatelliteBreakdown.cash.toFixed(1)}% Cash</span>}
              <span className="text-amber-400 font-bold">{coreSatelliteBreakdown.satellite.toFixed(1)}% Sat (20% Tgt)</span>
            </div>
          </div>
        </div>

        {/* Top Contributors - Small Span */}
        <div className="md:col-span-4 terminal-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="tech-label mb-1">Alpha Drivers</div>
              <h3 
                className="text-lg font-bold font-display tracking-tight flex items-center gap-2 cursor-pointer hover:text-emerald-400 transition-colors group"
                onClick={() => onTabChange('holdings')}
              >
                Top Contributors
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onTabChange('holdings')}
              className="h-6 px-2 text-[8px] font-bold uppercase tracking-widest text-terminal-muted hover:text-terminal-text"
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {contributors.map(h => (
              <div key={h.symbol} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-emerald-500/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    {h.symbol}
                  </div>
                  <span className="text-xs font-bold font-mono">{h.symbol}</span>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${h.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {h.totalGainLoss >= 0 ? '+' : '-'}${Math.abs(h.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="tech-label text-[8px]">Unrealized P&L</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Detractors - Small Span */}
        <div className="md:col-span-4 terminal-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="tech-label mb-1">Risk Detractors</div>
              <h3 
                className="text-lg font-bold font-display tracking-tight flex items-center gap-2 cursor-pointer hover:text-rose-400 transition-colors group"
                onClick={() => onTabChange('holdings')}
              >
                Top Detractors
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onTabChange('holdings')}
              className="h-6 px-2 text-[8px] font-bold uppercase tracking-widest text-terminal-muted hover:text-terminal-text"
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {detractors.map(h => (
              <div key={h.symbol} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-rose-500/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-rose-500/10 flex items-center justify-center text-[10px] font-bold text-rose-400 border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
                    {h.symbol}
                  </div>
                  <span className="text-xs font-bold font-mono">{h.symbol}</span>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${h.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {h.totalGainLoss >= 0 ? '+' : '-'}${Math.abs(h.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="tech-label text-[8px]">Unrealized P&L</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Risk Briefing - Full Width Bottom */}
        <div className="md:col-span-12 glass-panel p-8 rounded-2xl border-indigo-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Activity className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <div className="tech-label text-indigo-400">Institutional Intelligence</div>
                <h3 
                  className="text-2xl font-bold font-display tracking-tight cursor-pointer hover:text-indigo-400 transition-colors group flex items-center gap-3"
                  onClick={() => onTabChange('analysis')}
                >
                  PM Risk Briefing
                  <ArrowUpRight className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all" />
                </h3>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onTabChange('analysis')}
              className="h-10 px-6 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-[10px] font-bold uppercase tracking-widest gap-2"
            >
              <FileText className="h-4 w-4" />
              View Full Report
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              {isSyncing ? (
                <div className="flex items-center gap-3 py-4 text-indigo-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-mono font-bold uppercase tracking-widest">Synthesizing market data...</span>
                </div>
              ) : analysisSummary ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:text-terminal-muted prose-p:leading-relaxed prose-strong:text-terminal-text prose-strong:font-bold">
                  <ReactMarkdown>{analysisSummary}</ReactMarkdown>
                </div>
              ) : (
                <div className="py-4 text-terminal-muted text-sm italic font-mono">
                  No briefing available. Run "Analyze" to generate a PM-grade risk assessment.
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-indigo-600/10 rounded-xl border border-indigo-500/20 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]">
                <div className="tech-label text-indigo-400 mb-2">Framework Status</div>
                <p className="text-xs text-terminal-text leading-relaxed font-medium font-mono">
                  Core Allocation is currently <span className="text-indigo-400">{coreSatelliteBreakdown.core.toFixed(1)}%</span>. 
                  {coreSatelliteBreakdown.core > 85 
                    ? " Portfolio may be undermonitizing tactical macro signals."
                    : coreSatelliteBreakdown.core < 75 
                    ? " Substantial drift detected. Rebalance Satellites to restore beta anchor."
                    : " Portfolio is highly disciplined within the 80/20 Decoupling framework."}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="tech-label mb-2">Next Steps</div>
                <ul className="text-[10px] text-terminal-muted space-y-2 font-mono">
                  <li className="flex items-start gap-2">
                    <div className="h-1 w-1 rounded-full bg-indigo-500 mt-1.5" />
                    Review Satellite drift against the 5% warning threshold.
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1 w-1 rounded-full bg-indigo-500 mt-1.5" />
                    Direct {contributors[0]?.symbol} yield into underweighted allocations.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>

      <DataSourceFooter 
        pageName="Institutional Command Center" 
        interpretation="This terminal provides a high-conviction view of your portfolio's vital signs. It prioritizes risk-adjusted metrics and identifies specific drivers of P&L to help you manage capital with institutional precision."
      />
    </div>
  );
}

