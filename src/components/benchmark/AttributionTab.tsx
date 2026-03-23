import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart, Bar, Scatter, BarChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';
import { MetricRow, InfoTooltip } from './shared';
import { useData } from '../../context/DataContext';
import { HelpCircle, TrendingUp, TrendingDown, Target, Shield, Zap, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { 
  alignTimeSeries,
  calculateLogReturns,
  calculateVolatility, 
  calculateSharpeRatio, 
  calculateMaxDrawdown, 
  calculateBeta, 
  calculateAlpha, 
  calculateTrackingError, 
  calculateInformationRatio, 
  calculateTreynorRatio,
  calculateParametricVaR,
  calculateCVaR,
  calculateReturn1M,
  calculateSortinoRatio,
  calculateDrawdownSeries
} from '../../utils/financeMath';

interface AttributionTabProps {
  selectedBenchmark: string;
  setSelectedBenchmark: (id: string) => void;
  timeRange: string;
  setTimeRange: (range: any) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#64748b'];

export const AttributionTab: React.FC<AttributionTabProps> = ({
  selectedBenchmark,
  setSelectedBenchmark,
  timeRange,
  setTimeRange
}) => {
  const { 
    performanceData, 
    benchmarks, 
    holdingsData, 
    etfMetrics,
    riskFreeRate,
    transactionsData,
    allFetchedData
  } = useData();

  const benchmarkName = benchmarks.find(b => b.id === selectedBenchmark)?.name || 'Benchmark';

  const inceptionDate = useMemo(() => {
    if (transactionsData && transactionsData.length > 0) {
      const earliestTxTime = Math.min(...transactionsData.map(t => new Date(t.date).getTime()));
      return isNaN(earliestTxTime) ? null : new Date(earliestTxTime);
    }
    return null;
  }, [transactionsData]);

  // Calculate dynamic metrics and data for charts
  const { 
    formattedPerformanceData, 
    portfolioConstruction, 
    dynamicMetrics, 
    dumbbellData,
    factorExposures,
    contributionData
  } = useMemo(() => {
    // 0. Filter data by timeRange
    const sortedData = [...performanceData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedData.length === 0) return { formattedPerformanceData: [], portfolioConstruction: [], dynamicMetrics: null, dumbbellData: [], factorExposures: [] };

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
    }

    // Always clip to inception date if available
    if (inceptionDate && startDate < inceptionDate) {
      startDate = inceptionDate;
    }

    // Ensure startDate is at the beginning of its UTC day for comparison
    startDate.setUTCHours(0, 0, 0, 0);

    const filteredPerformance = sortedData.filter(d => {
      const dDate = new Date(d.date);
      dDate.setUTCHours(0, 0, 0, 0);
      return dDate >= startDate;
    });
    if (filteredPerformance.length === 0) return { formattedPerformanceData: [], portfolioConstruction: [], dynamicMetrics: null, dumbbellData: [], factorExposures: [] };

    const benchHistory = allFetchedData[selectedBenchmark] || [];

    // 1. Formatted Performance Data (Rebased to 100 at start of period)
    const firstValue = filteredPerformance[0]?.value || 1;
    const firstBench = filteredPerformance[0]?.[selectedBenchmark] || 1;

    const formattedData = filteredPerformance.map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
      Portfolio: (d.value / firstValue) * 100,
      [benchmarkName]: (d[selectedBenchmark] / firstBench) * 100,
      portRaw: d.value,
      benchRaw: d[selectedBenchmark]
    }));

    const portDrawdowns = calculateDrawdownSeries(formattedData.map(d => d.portRaw));
    const benchDrawdowns = calculateDrawdownSeries(formattedData.map(d => d.benchRaw));

    const finalChartData = formattedData.map((d, i) => ({
      ...d,
      portDrawdown: portDrawdowns[i],
      benchDrawdown: benchDrawdowns[i]
    }));

    // 2. Portfolio Construction (Asset Class Allocation vs Benchmark)
    const benchAlloc: Record<string, number> = selectedBenchmark === 'SPY' 
      ? { 'US Equity': 100, 'Intl Equity': 0, 'Fixed Income': 0, 'Real Estate': 0, 'Cash': 0, 'Commodities': 0 }
      : { 'US Equity': 0, 'Intl Equity': 0, 'Fixed Income': 100, 'Real Estate': 0, 'Cash': 0, 'Commodities': 0 };

    const assetClassMap = holdingsData.reduce((acc: any, h) => {
      acc[h.assetClass] = (acc[h.assetClass] || 0) + (h.qty * h.currentPrice);
      return acc;
    }, {});

    const totalValue = Object.values(assetClassMap).reduce((a: any, b: any) => a + b, 0) as number;
    
    const construction = Object.entries(assetClassMap).map(([name, value], index) => {
      const portWeight = ((value as number) / totalValue) * 100;
      const benchWeight = benchAlloc[name] || 0;
      return {
        name,
        value: portWeight,
        benchmark: benchWeight,
        active: portWeight - benchWeight,
        color: COLORS[index % COLORS.length]
      };
    }).sort((a, b) => b.value - a.value);

    // 3. Dumbbell Data (ETF vs Benchmark 1M Return) - DYNAMIC
    const dumbbell = holdingsData.map(h => {
      const etfHistory = allFetchedData[h.symbol] || [];
      const staticMetrics = etfMetrics[h.symbol] || {};
      
      let dynamicReturn = staticMetrics.return1M || 0;
      let dynamicBenchReturn = staticMetrics.benchReturn1M || 0;

      if (etfHistory.length > 5 && benchHistory.length > 5) {
        const filteredETF = etfHistory.filter(d => new Date(d.date) >= startDate);
        const filteredBench = benchHistory.filter(d => new Date(d.date) >= startDate);

        const { alignedPrices } = alignTimeSeries(
          { [h.symbol]: filteredETF, [selectedBenchmark]: filteredBench },
          [h.symbol, selectedBenchmark]
        );
        
        const alignedETF = alignedPrices[h.symbol];
        const alignedBench = alignedPrices[selectedBenchmark];

        if (alignedETF.length > 5) {
          dynamicReturn = ((alignedETF[alignedETF.length - 1] - alignedETF[0]) / alignedETF[0]) * 100;
          dynamicBenchReturn = ((alignedBench[alignedBench.length - 1] - alignedBench[0]) / alignedBench[0]) * 100;
        }
      }
      
      return {
        symbol: h.symbol,
        return1M: dynamicReturn,
        benchReturn1M: dynamicBenchReturn,
        alpha: dynamicReturn - dynamicBenchReturn
      };
    }).sort((a, b) => b.alpha - a.alpha);

    // 4. Dynamic Metrics (Calculated from filtered performanceData)
    const portValues = filteredPerformance.map(d => d.value);
    const benchValues = filteredPerformance.map(d => d[selectedBenchmark]);
    
    const portReturns = calculateLogReturns(portValues);
    const benchReturns = calculateLogReturns(benchValues);

    const portBeta = calculateBeta(portReturns, benchReturns);

    const metrics = {
      portfolio: {
        return1M: calculateReturn1M(portValues),
        volatility: calculateVolatility(portReturns),
        sharpeRatio: calculateSharpeRatio(portReturns, riskFreeRate),
        sortinoRatio: calculateSortinoRatio(portReturns, riskFreeRate),
        maxDrawdown: calculateMaxDrawdown(portValues),
        var95: calculateParametricVaR(portReturns),
        cvar95: calculateCVaR(portReturns),
        alpha: calculateAlpha(portReturns, benchReturns, portBeta, riskFreeRate),
        beta: portBeta,
        trackingError: calculateTrackingError(portReturns, benchReturns),
        informationRatio: calculateInformationRatio(portReturns, benchReturns),
        treynorRatio: calculateTreynorRatio(portReturns, portBeta, riskFreeRate)
      },
      benchmark: {
        return1M: calculateReturn1M(benchValues),
        volatility: calculateVolatility(benchReturns),
        sharpeRatio: calculateSharpeRatio(benchReturns, riskFreeRate),
        sortinoRatio: calculateSortinoRatio(benchReturns, riskFreeRate),
        maxDrawdown: calculateMaxDrawdown(benchValues),
        var95: calculateParametricVaR(benchReturns),
        cvar95: calculateCVaR(benchReturns),
        treynorRatio: calculateTreynorRatio(benchReturns, 1, riskFreeRate)
      }
    };

    // 5. Factor Exposures (Portfolio vs Benchmark Comparison)
    const factorNames = ['value', 'size', 'momentum', 'quality', 'lowVol'];
    const portFactors = factorNames.reduce((acc, f) => {
      acc[f] = holdingsData.reduce((sum, h) => {
        const weight = (h.qty * h.currentPrice) / totalValue;
        const etfF = etfMetrics[h.symbol]?.factors?.[f] || 0;
        return sum + (etfF * weight);
      }, 0);
      return acc;
    }, {} as Record<string, number>);

    const benchFactors = etfMetrics[selectedBenchmark]?.factors || { value: 0, size: 0, momentum: 0, quality: 0, lowVol: 0 };

    const factorComparisonData = factorNames.map(f => ({
      factor: f.charAt(0).toUpperCase() + f.slice(1),
      portfolio: portFactors[f] * 100,
      benchmark: (benchFactors[f] || 0) * 100
    }));

    // 6. Contribution to Return (Weight * Return) - DYNAMIC
    const contributionData = holdingsData.map(h => {
      const weight = (h.qty * h.currentPrice) / totalValue;
      
      const etfHistory = allFetchedData[h.symbol] || [];
      let dynamicReturn = etfMetrics[h.symbol]?.return1M || 0;
      
      if (etfHistory.length > 5) {
        const filteredETF = etfHistory.filter(d => new Date(d.date) >= startDate);
        if (filteredETF.length > 5) {
          dynamicReturn = ((filteredETF[filteredETF.length - 1].price - filteredETF[0].price) / filteredETF[0].price) * 100;
        }
      }

      return {
        name: h.symbol,
        contribution: weight * dynamicReturn,
        weight: weight * 100,
        return: dynamicReturn
      };
    }).sort((a, b) => b.contribution - a.contribution);

    return {
      formattedPerformanceData: finalChartData,
      portfolioConstruction: construction,
      dynamicMetrics: metrics,
      dumbbellData: dumbbell,
      factorExposures: factorComparisonData,
      contributionData
    };
  }, [performanceData, selectedBenchmark, benchmarkName, holdingsData, etfMetrics, riskFreeRate, timeRange, transactionsData, allFetchedData, inceptionDate]);

  if (!dynamicMetrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex flex-col">
          <h3 className="text-sm font-mono font-bold text-terminal-text uppercase tracking-widest">Analysis Parameters</h3>
          <p className="text-[10px] text-terminal-muted uppercase tracking-widest font-bold">Configure your attribution view</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
            {['1M', '3M', 'YTD', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all ${timeRange === range ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white' : 'text-terminal-muted hover:text-terminal-text'}`}
              >
                {range}
              </button>
            ))}
          </div>
          <select
            value={selectedBenchmark}
            onChange={(e) => setSelectedBenchmark(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-mono font-bold text-terminal-text shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors"
          >
            {benchmarks.map((b) => (
              <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-mono font-bold text-terminal-text uppercase tracking-widest flex items-center gap-2">
                Overall Performance
                <InfoTooltip 
                  title="Cumulative Performance" 
                  description="Shows the growth of your portfolio compared to the selected benchmark over time." 
                  lookFor="Look for consistent outperformance (Alpha) and how the portfolio reacts during market dips."
                />
              </h3>
              <p className="text-[10px] text-terminal-muted uppercase font-bold">Cumulative Growth ({timeRange}): Portfolio vs. {benchmarkName}</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedPerformanceData}>
                <defs>
                  <linearGradient id="colorPort" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(val) => `${val.toFixed(0)}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151921', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value.toFixed(2)}`, '']}
                />
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                <Area type="monotone" dataKey="Portfolio" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPort)" animationDuration={1500} />
                <Line type="monotone" dataKey={benchmarkName} stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-mono font-bold text-terminal-muted uppercase tracking-widest">Drawdown Analysis</h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span className="text-[10px] font-mono font-bold text-terminal-muted uppercase">Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <span className="text-[10px] font-mono font-bold text-terminal-muted uppercase">Benchmark</span>
                </div>
              </div>
            </div>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="displayDate" hide />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v) => `${v}%`}
                    domain={['auto', 0]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151921', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                  />
                  <Area type="monotone" dataKey="portDrawdown" name="Port DD" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="benchDrawdown" name="Bench DD" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.05)" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8">
          <div className="mb-8">
            <h3 className="text-sm font-mono font-bold text-terminal-text uppercase tracking-widest flex items-center gap-2">
              Portfolio Construction
              <InfoTooltip 
                title="Asset Allocation" 
                description="The breakdown of your portfolio by individual ETF holdings." 
                lookFor="Ensure your portfolio isn't overly concentrated in a single asset unless intentional."
              />
            </h3>
            <p className="text-[10px] text-terminal-muted uppercase font-bold">Asset Class Allocation</p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioConstruction}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {portfolioConstruction.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} className="hover:opacity-100 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151921', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 space-y-6">
            {portfolioConstruction.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-mono font-bold text-terminal-text uppercase tracking-tight">{item.name}</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-mono font-bold text-terminal-text">{item.value.toFixed(1)}%</span>
                      <span className="text-[8px] text-terminal-muted uppercase font-bold">Port</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-mono font-bold text-terminal-muted">{item.benchmark.toFixed(1)}%</span>
                      <span className="text-[8px] text-terminal-muted uppercase font-bold">Bench</span>
                    </div>
                  </div>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${item.active >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.abs(item.active) * 2}%`, marginLeft: item.active < 0 ? '0' : 'auto' }}
                  />
                </div>
                <div className={`text-[9px] font-mono font-bold text-right uppercase tracking-tighter ${item.active >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.active >= 0 ? '+' : ''}{item.active.toFixed(1)}% Active Weight
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <div className="glass-panel p-8">
          <div className="flex items-start gap-3 mb-6 h-16">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)] mt-1 shrink-0" />
            <div>
              <h3 className="text-sm font-mono font-bold text-terminal-text uppercase tracking-widest line-clamp-1">Macro Risk & Return</h3>
              <p className="text-[10px] text-terminal-muted uppercase font-bold mt-1 line-clamp-2">Period-specific statistical analysis ({timeRange})</p>
            </div>
          </div>
          <div className="space-y-0">
            <MetricRow label="1M Return" portValue={dynamicMetrics.portfolio.return1M} benchValue={dynamicMetrics.benchmark.return1M} isPercentage />
            <MetricRow label="Volatility (Ann.)" portValue={dynamicMetrics.portfolio.volatility} benchValue={dynamicMetrics.benchmark.volatility} isPercentage inverseGood />
            <MetricRow label="Sharpe Ratio" portValue={dynamicMetrics.portfolio.sharpeRatio} benchValue={dynamicMetrics.benchmark.sharpeRatio} />
            <MetricRow label="Sortino Ratio" portValue={dynamicMetrics.portfolio.sortinoRatio} benchValue={dynamicMetrics.benchmark.sortinoRatio} />
            <MetricRow label="Max Drawdown" portValue={dynamicMetrics.portfolio.maxDrawdown} benchValue={dynamicMetrics.benchmark.maxDrawdown} isPercentage inverseGood />
            <MetricRow label="VaR (95%)" portValue={dynamicMetrics.portfolio.var95} benchValue={dynamicMetrics.benchmark.var95} isPercentage inverseGood />
            <MetricRow label="CVaR (95%)" portValue={dynamicMetrics.portfolio.cvar95} benchValue={dynamicMetrics.benchmark.cvar95} isPercentage inverseGood />
          </div>
        </div>

        <div className="glass-panel p-8">
          <div className="flex items-start gap-3 mb-6 h-16">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] mt-1 shrink-0" />
            <div>
              <h3 className="text-sm font-mono font-bold text-terminal-text uppercase tracking-widest line-clamp-1">Micro Attribution</h3>
              <p className="text-[10px] text-terminal-muted uppercase font-bold mt-1 line-clamp-2">Relative performance vs. {selectedBenchmark}</p>
            </div>
          </div>
          <div className="space-y-0">
            <MetricRow label="Alpha (Ann.)" portValue={dynamicMetrics.portfolio.alpha} benchValue={0} isPercentage />
            <MetricRow label="Beta" portValue={dynamicMetrics.portfolio.beta} benchValue={1} inverseGood={dynamicMetrics.portfolio.beta > 1.1} />
            <MetricRow label="Tracking Error" portValue={dynamicMetrics.portfolio.trackingError} benchValue={0} isPercentage inverseGood />
            <MetricRow label="Information Ratio" portValue={dynamicMetrics.portfolio.informationRatio} benchValue={0} />
            <MetricRow label="Treynor Ratio" portValue={dynamicMetrics.portfolio.treynorRatio} benchValue={dynamicMetrics.benchmark.treynorRatio} />
          </div>
        </div>
      </div>

      <div className="glass-panel p-8">
        <div className="mb-8">
          <h3 className="text-sm font-mono font-bold text-terminal-text uppercase tracking-widest flex items-center gap-2">
            Performance Gap Analysis
            <InfoTooltip 
              title="Performance Attribution" 
              description="Compares individual ETF returns against the benchmark to identify where Alpha is being generated." 
              lookFor="Green bars indicate positive Alpha (outperformance), while red bars indicate underperformance."
            />
          </h3>
          <p className="text-[10px] text-terminal-muted uppercase font-bold">1M Return: Portfolio vs. Benchmark (Alpha Highlighted)</p>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dumbbellData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="symbol" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600 }}
                width={60}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#151921] p-4 border border-white/10 rounded-xl shadow-2xl text-[11px] font-mono">
                        <p className="font-bold text-terminal-text mb-3 border-b border-white/10 pb-2 uppercase tracking-widest">{data.symbol}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between gap-8">
                            <span className="text-terminal-muted uppercase">ETF Return:</span>
                            <span className="font-bold text-indigo-400">{data.return1M?.toFixed(2) || '0.00'}%</span>
                          </div>
                          <div className="flex justify-between gap-8">
                            <span className="text-terminal-muted uppercase">Bench Return:</span>
                            <span className="font-bold text-terminal-text">{data.benchReturn1M?.toFixed(2) || '0.00'}%</span>
                          </div>
                          <div className="pt-2 border-t border-white/10 flex justify-between gap-8">
                            <span className="text-terminal-muted font-bold uppercase">Alpha:</span>
                            <span className={`font-bold ${(data.alpha || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {(data.alpha || 0) >= 0 ? '+' : ''}{data.alpha?.toFixed(2) || '0.00'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="return1M" barSize={2} fill="rgba(255,255,255,0.1)">
                {dumbbellData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.alpha >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.3} />
                ))}
              </Bar>
              <Scatter dataKey="return1M" fill="#6366f1" />
              <Scatter dataKey="benchReturn1M" fill="rgba(255,255,255,0.4)" shape="diamond" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 flex items-center justify-center gap-12 text-[10px] font-mono font-bold uppercase tracking-widest text-terminal-muted">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <span>ETF Return</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white/40 rotate-45" />
            <span>Benchmark</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="glass-panel p-8">
          <div className="mb-8">
            <h3 className="text-sm font-mono font-bold text-terminal-text uppercase tracking-widest flex items-center gap-2">
              Contribution to Return
              <InfoTooltip 
                title="Return Contribution" 
                description="Shows how much each asset contributed to the total portfolio return based on its weight and performance." 
                lookFor="Identify the primary drivers of performance. High contribution can come from high weight or high return."
              />
            </h3>
            <p className="text-[10px] text-terminal-muted uppercase font-bold">Estimated contribution by asset (Weight % × Return %)</p>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'rgba(255,255,255,0.4)' }} unit="%" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600 }}
                  width={60}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#151921] p-4 border border-white/10 rounded-xl shadow-2xl text-[11px] font-mono">
                          <p className="font-bold text-terminal-text mb-3 border-b border-white/10 pb-2 uppercase tracking-widest">{data.name}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between gap-8">
                              <span className="text-terminal-muted uppercase">Weight:</span>
                              <span className="font-bold text-terminal-text">{data.weight.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between gap-8">
                              <span className="text-terminal-muted uppercase">Return:</span>
                              <span className={`font-bold ${data.return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {data.return.toFixed(2)}%
                              </span>
                            </div>
                            <div className="pt-2 border-t border-white/10 flex justify-between gap-8">
                              <span className="text-terminal-muted font-bold uppercase">Contribution:</span>
                              <span className={`font-bold ${data.contribution >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                                {data.contribution.toFixed(3)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                  {contributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.contribution >= 0 ? '#6366f1' : '#f43f5e'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8">
          <div className="mb-8">
            <h3 className="text-sm font-mono font-bold text-terminal-text uppercase tracking-widest flex items-center gap-2">
              Factor Exposures
              <InfoTooltip 
                title="Factor Analysis" 
                description="Compares your portfolio's sensitivity to common investment factors against the benchmark." 
                lookFor="Active factor tilts (e.g., high Quality or Value) explain performance differences relative to the market."
              />
            </h3>
            <p className="text-[10px] text-terminal-muted uppercase font-bold">Portfolio vs. Benchmark Factor Profile</p>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={factorExposures}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Portfolio"
                  dataKey="portfolio"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Benchmark"
                  dataKey="benchmark"
                  stroke="rgba(255,255,255,0.4)"
                  fill="rgba(255,255,255,0.2)"
                  fillOpacity={0.2}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151921', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
