import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart, Bar, Scatter, BarChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';
import { MetricRow, InfoTooltip } from './shared';
import { useData } from '../../context/DataContext';
import { HelpCircle, TrendingUp, TrendingDown, Target, Shield, Zap, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { 
  calculateReturns, 
  calculateVolatility, 
  calculateSharpeRatio, 
  calculateMaxDrawdown, 
  calculateBeta, 
  calculateAlpha, 
  calculateTrackingError, 
  calculateInformationRatio, 
  calculateTreynorRatio,
  calculateVaR,
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

        const alignedDates = filteredETF.map(d => d.date).filter(date => filteredBench.some(bd => bd.date === date));
        const alignedETF = alignedDates.map(date => filteredETF.find(d => d.date === date)!.price);
        const alignedBench = alignedDates.map(date => filteredBench.find(d => d.date === date)!.price);

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
    
    const portReturns = calculateReturns(portValues);
    const benchReturns = calculateReturns(benchValues);

    const portBeta = calculateBeta(portReturns, benchReturns);

    const metrics = {
      portfolio: {
        return1M: calculateReturn1M(portValues),
        volatility: calculateVolatility(portReturns),
        sharpeRatio: calculateSharpeRatio(portReturns, riskFreeRate),
        sortinoRatio: calculateSortinoRatio(portReturns, riskFreeRate),
        maxDrawdown: calculateMaxDrawdown(portValues),
        var95: calculateVaR(portReturns),
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
        var95: calculateVaR(benchReturns),
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-900">Analysis Parameters</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Configure your attribution view</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            {['1M', '3M', 'YTD', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${timeRange === range ? 'bg-white shadow-sm font-bold text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {range}
              </button>
            ))}
          </div>
          <select
            value={selectedBenchmark}
            onChange={(e) => setSelectedBenchmark(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            {benchmarks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Overall Performance
              <InfoTooltip 
                title="Cumulative Performance" 
                description="Shows the growth of your portfolio compared to the selected benchmark over time." 
                lookFor="Look for consistent outperformance (Alpha) and how the portfolio reacts during market dips."
              />
            </CardTitle>
            <CardDescription>Cumulative Growth ({timeRange}): Portfolio vs. {benchmarkName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedPerformanceData}>
                  <defs>
                    <linearGradient id="colorPort" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    minTickGap={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => `${val.toFixed(0)}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(2)}`, '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="Portfolio" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPort)" />
                  <Line type="monotone" dataKey={benchmarkName} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drawdown Analysis</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-slate-500">Portfolio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500">Benchmark</span>
                  </div>
                </div>
              </div>
              <div className="h-[100px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="displayDate" hide />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 9 }}
                      tickFormatter={(v) => `${v}%`}
                      domain={['auto', 0]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      itemStyle={{ fontSize: '11px' }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                    />
                    <Area type="monotone" dataKey="portDrawdown" name="Port DD" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="benchDrawdown" name="Bench DD" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.05} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Portfolio Construction
              <InfoTooltip 
                title="Asset Allocation" 
                description="The breakdown of your portfolio by individual ETF holdings." 
                lookFor="Ensure your portfolio isn't overly concentrated in a single asset unless intentional."
              />
            </CardTitle>
            <CardDescription>Asset Class Allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioConstruction}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {portfolioConstruction.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-4">
              {portfolioConstruction.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-bold">{item.name}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-slate-400">Port: <span className="text-slate-900 font-bold">{item.value.toFixed(1)}%</span></span>
                      <span className="text-slate-400">Bench: <span className="text-slate-900 font-bold">{item.benchmark.toFixed(1)}%</span></span>
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold text-right ${item.active >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.active >= 0 ? '+' : ''}{item.active.toFixed(1)}% Active Weight
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-indigo-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
              Macro Risk & Return Metrics
            </CardTitle>
            <CardDescription>Period-specific statistical analysis ({timeRange})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <MetricRow label="1M Return" portValue={dynamicMetrics.portfolio.return1M} benchValue={dynamicMetrics.benchmark.return1M} isPercentage />
              <MetricRow label="Volatility (Ann.)" portValue={dynamicMetrics.portfolio.volatility} benchValue={dynamicMetrics.benchmark.volatility} isPercentage inverseGood />
              <MetricRow label="Sharpe Ratio" portValue={dynamicMetrics.portfolio.sharpeRatio} benchValue={dynamicMetrics.benchmark.sharpeRatio} />
              <MetricRow label="Sortino Ratio" portValue={dynamicMetrics.portfolio.sortinoRatio} benchValue={dynamicMetrics.benchmark.sortinoRatio} />
              <MetricRow label="Max Drawdown" portValue={dynamicMetrics.portfolio.maxDrawdown} benchValue={dynamicMetrics.benchmark.maxDrawdown} isPercentage inverseGood />
              <MetricRow label="VaR (95%)" portValue={dynamicMetrics.portfolio.var95} benchValue={dynamicMetrics.benchmark.var95} isPercentage inverseGood />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
              Micro Attribution Metrics
            </CardTitle>
            <CardDescription>Relative performance vs. {selectedBenchmark}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <MetricRow label="Alpha (Ann.)" portValue={dynamicMetrics.portfolio.alpha} benchValue={0} isPercentage />
              <MetricRow label="Beta" portValue={dynamicMetrics.portfolio.beta} benchValue={1} inverseGood={dynamicMetrics.portfolio.beta > 1.1} />
              <MetricRow label="Tracking Error" portValue={dynamicMetrics.portfolio.trackingError} benchValue={0} isPercentage inverseGood />
              <MetricRow label="Information Ratio" portValue={dynamicMetrics.portfolio.informationRatio} benchValue={0} />
              <MetricRow label="Treynor Ratio" portValue={dynamicMetrics.portfolio.treynorRatio} benchValue={dynamicMetrics.benchmark.treynorRatio} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Performance Gap Analysis
            <InfoTooltip 
              title="Performance Attribution" 
              description="Compares individual ETF returns against the benchmark to identify where Alpha is being generated." 
              lookFor="Green bars indicate positive Alpha (outperformance), while red bars indicate underperformance."
            />
          </CardTitle>
          <CardDescription>1M Return: Portfolio vs. Benchmark (Alpha Highlighted)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dumbbellData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="symbol" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  width={40}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-xl text-xs">
                          <p className="font-bold text-slate-900 mb-2">{data.symbol}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">ETF Return:</span>
                              <span className="font-mono font-bold text-indigo-600">{data.return1M?.toFixed(2) || '0.00'}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Bench Return:</span>
                              <span className="font-mono font-bold text-slate-600">{data.benchReturn1M?.toFixed(2) || '0.00'}%</span>
                            </div>
                            <div className="pt-1 border-t border-slate-100 flex justify-between gap-4">
                              <span className="text-slate-500 font-bold">Alpha:</span>
                              <span className={`font-mono font-bold ${(data.alpha || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                <Bar dataKey="return1M" barSize={2} fill="#e2e8f0">
                  {dumbbellData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.alpha >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.2} />
                  ))}
                </Bar>
                <Scatter dataKey="return1M" fill="#6366f1" />
                <Scatter dataKey="benchReturn1M" fill="#94a3b8" shape="diamond" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span>ETF Return</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-400 rotate-45" />
              <span>Benchmark</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Contribution to Return
            <InfoTooltip 
              title="Return Contribution" 
              description="Shows how much each asset contributed to the total portfolio return based on its weight and performance." 
              lookFor="Identify the primary drivers of performance. High contribution can come from high weight or high return."
            />
          </CardTitle>
          <CardDescription>Estimated contribution by asset (Weight % × Return %)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  width={40}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-xl text-xs">
                          <p className="font-bold text-slate-900 mb-2">{data.name}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Weight:</span>
                              <span className="font-mono font-bold">{data.weight.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Return:</span>
                              <span className={`font-mono font-bold ${data.return >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {data.return.toFixed(2)}%
                              </span>
                            </div>
                            <div className="pt-1 border-t border-slate-100 flex justify-between gap-4">
                              <span className="text-slate-500 font-bold">Contribution:</span>
                              <span className={`font-mono font-bold ${data.contribution >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
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
                    <Cell key={`cell-${index}`} fill={entry.contribution >= 0 ? '#6366f1' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Factor Exposures
            <InfoTooltip 
              title="Factor Analysis" 
              description="Compares your portfolio's sensitivity to common investment factors against the benchmark." 
              lookFor="Active factor tilts (e.g., high Quality or Value) explain performance differences relative to the market."
            />
          </CardTitle>
          <CardDescription>Portfolio vs. Benchmark Factor Profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={factorExposures}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Portfolio"
                  dataKey="portfolio"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.5}
                />
                <Radar
                  name="Benchmark"
                  dataKey="benchmark"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.2}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
