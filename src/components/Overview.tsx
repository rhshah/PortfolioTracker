import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
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
  Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/Button';
import { downloadCSV } from '../utils/download';
import { downloadSVG } from '../utils/downloadSvg';
import { DataSourceFooter } from './DataSourceFooter';

interface OverviewProps {
  analysisSummary?: string | null;
  isSyncing?: boolean;
}

type TimeRange = '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

export function Overview({ analysisSummary, isSyncing }: OverviewProps) {
  const { performanceData, holdingsData, transactionsData, benchmarks } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [selectedBenchmark, setSelectedBenchmark] = useState(benchmarks[0].id);

  const totalValue = holdingsData.reduce((sum, item) => sum + item.totalValue, 0);
  const totalGainLossSinceInception = holdingsData.reduce((sum, item) => sum + item.totalGainLoss, 0);
  const totalPurchaseValue = totalValue - totalGainLossSinceInception;
  const percentageReturnSinceInception = totalPurchaseValue > 0 ? (totalGainLossSinceInception / totalPurchaseValue) * 100 : 0;

  // Calculate Asset Allocation
  const assetAllocation = useMemo(() => {
    const allocation: Record<string, number> = {};
    holdingsData.forEach(h => {
      allocation[h.assetClass] = (allocation[h.assetClass] || 0) + h.totalValue;
    });
    return Object.entries(allocation).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalValue) * 100
    })).sort((a, b) => b.value - a.value);
  }, [holdingsData, totalValue]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const filteredPerformanceData = useMemo(() => {
    const sortedData = [...performanceData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedData.length === 0) return [];

    const latestDateStr = sortedData[sortedData.length - 1].date;
    const latestDate = new Date(latestDateStr);
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
    } else if (timeRange === 'ALL') {
      if (transactionsData && transactionsData.length > 0) {
        const earliestTxTime = Math.min(...transactionsData.map(t => new Date(t.date).getTime()));
        if (!isNaN(earliestTxTime)) {
          const earliestTxDate = new Date(earliestTxTime);
          if (earliestTxDate > startDate) {
            startDate = earliestTxDate;
          }
        }
      }
    }

    // Ensure startDate is at the beginning of its UTC day for comparison
    startDate.setUTCHours(0, 0, 0, 0);

    const filtered = sortedData.filter(d => {
      const dDate = new Date(d.date);
      dDate.setUTCHours(0, 0, 0, 0);
      return dDate >= startDate;
    });
    
    if (filtered.length === 0) return [];

    const firstPoint = filtered[0];
    const portfolioStartValue = firstPoint.value;

    return filtered.map(d => {
      const normalizedData: any = {
        ...d,
        displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        // Calculate cumulative return % for portfolio
        Portfolio: portfolioStartValue > 0 ? ((d.value / portfolioStartValue) - 1) * 100 : 0
      };

      // Normalize all benchmarks found in the data to cumulative return %
      benchmarks.forEach(b => {
        if (d[b.id] !== undefined && firstPoint[b.id] !== undefined && firstPoint[b.id] !== 0) {
          normalizedData[b.id] = ((d[b.id] / firstPoint[b.id]) - 1) * 100;
        }
      });

      return normalizedData;
    });
  }, [timeRange, performanceData, transactionsData, benchmarks]);

  const periodStats = useMemo(() => {
    if (filteredPerformanceData.length < 2) {
      return {
        returnPct: percentageReturnSinceInception,
        valueChange: totalGainLossSinceInception,
        isTotal: true
      };
    }
    
    const first = performanceData.find(p => p.date === filteredPerformanceData[0].date);
    const last = performanceData.find(p => p.date === filteredPerformanceData[filteredPerformanceData.length - 1].date);
    
    if (!first || !last) return { returnPct: 0, valueChange: 0, isTotal: false };
    
    const startValue = first.value;
    const endValue = last.value;
    
    const valueChange = endValue - startValue;
    const returnPct = startValue > 0 ? (valueChange / startValue) * 100 : 0;
    
    return { returnPct, valueChange, isTotal: timeRange === 'ALL' };
  }, [filteredPerformanceData, performanceData, timeRange, percentageReturnSinceInception, totalGainLossSinceInception]);

  const handleDownloadCSV = () => {
    downloadCSV(filteredPerformanceData, `portfolio_performance_${timeRange}.csv`);
  };

  const handleDownloadChart = () => {
    downloadSVG('overview-chart-container', `portfolio_chart_${timeRange}.svg`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="h-12 w-12 text-indigo-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-display">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Verified Market Data</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-12 w-12 text-emerald-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {periodStats.isTotal ? 'Total Return' : `${timeRange} Return`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-display ${periodStats.valueChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {periodStats.valueChange >= 0 ? '+' : ''}${Math.abs(periodStats.valueChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {periodStats.valueChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-rose-500" />
              )}
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                {periodStats.isTotal ? 'Since Inception' : `During ${timeRange}`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Percent className="h-12 w-12 text-indigo-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {periodStats.isTotal ? 'Total Return %' : `${timeRange} Return %`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-display ${periodStats.returnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {periodStats.returnPct >= 0 ? '+' : ''}{periodStats.returnPct.toFixed(2)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Activity className="h-3 w-3 text-indigo-500" />
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                {periodStats.isTotal ? 'Time-Weighted' : `Period Return`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieChartIcon className="h-12 w-12 text-slate-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-display">{holdingsData.length} ETFs</div>
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-slate-400" />
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Diversified Portfolio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Performance</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                Portfolio value vs {selectedBenchmark}
                <span className="group relative inline-block">
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                  <span className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 leading-relaxed">
                    Note: Time ranges (1M, 3M, etc.) show hypothetical performance as if the current portfolio was held from the start of that period. This isolates recent market trends from your actual historical purchase prices.
                  </span>
                </span>
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
              <div className="flex items-center gap-2 mr-2">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Benchmark:</label>
                <select 
                  value={selectedBenchmark}
                  onChange={(e) => setSelectedBenchmark(e.target.value)}
                  className="text-xs bg-slate-100 border-none rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {benchmarks.map(b => (
                    <option key={b.id} value={b.id}>{b.id}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowBenchmark(!showBenchmark)}
                  className={`p-1 rounded transition-colors ${showBenchmark ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-100'}`}
                  title="Toggle Benchmark"
                >
                  <Activity className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center bg-slate-100 rounded-md p-1">
                {(['1M', '3M', 'YTD', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs sm:text-sm rounded-sm transition-colors ${timeRange === range ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={handleDownloadChart} title="Download Chart">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleDownloadCSV} title="Download Data">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div id="overview-chart-container" className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                    minTickGap={15}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`, 
                      name === 'Portfolio' ? 'Portfolio' : name
                    ]}
                    labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Portfolio" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    dot={false}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                    name="Portfolio"
                  />
                  {showBenchmark && (
                    <Line 
                      type="monotone" 
                      dataKey={selectedBenchmark} 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 4, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
                      name={selectedBenchmark}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 px-2 flex items-start gap-2">
              <Info className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Note: Performance for 1M, 3M, YTD, and 1Y is hypothetical and shows what your current portfolio would have returned if held from the start of that period. Only "ALL" reflects your actual purchase history.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <PieChartIcon className="h-5 w-5 text-indigo-600" />
              Asset Allocation
            </CardTitle>
            <CardDescription>Diversification by class</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {assetAllocation.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Activity className="h-5 w-5 text-indigo-600" />
              Executive Summary
            </CardTitle>
            <CardDescription>AI-generated insights</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {isSyncing ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-sm text-center">Generating summary...</p>
              </div>
            ) : analysisSummary ? (
              <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-indigo-600">
                <ReactMarkdown>{analysisSummary}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                <p className="text-sm text-center">Click "Generate Analysis" in the Analysis tab to create an AI summary.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DataSourceFooter 
        pageName="Dashboard Overview" 
        interpretation="The Overview tab provides a consolidated view of your total wealth, cumulative returns, and asset distribution. The Performance chart compares your growth against a selected benchmark, while the Executive Summary uses AI to synthesize complex data into actionable insights."
      />
    </div>
  );
}
