import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TableHeaderWithTooltip, TableHeaderWithTooltipRight, VisualMetricCell, InfoTooltip } from './shared';
import { useData } from '../../context/DataContext';
import { 
  alignTimeSeries,
  calculateLogReturns,
  calculateVolatility, 
  calculateSharpeRatio, 
  calculateMaxDrawdown, 
  calculateBeta, 
  calculateAlpha, 
  calculateTrackingError, 
  calculateParametricVaR,
  calculateCorrelation
} from '../../utils/financeMath';
import { ShieldCheck, BarChart3, Target, Info, ChevronDown, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';

interface DeepDiveTabProps {
  selectedBenchmark: string;
  setSelectedBenchmark: (id: string) => void;
  timeRange: string;
  setTimeRange: (range: any) => void;
  onTabChange?: (tab: string) => void;
}

export const DeepDiveTab: React.FC<DeepDiveTabProps> = ({ 
  selectedBenchmark,
  setSelectedBenchmark,
  timeRange,
  setTimeRange,
  onTabChange
}) => {
  const { holdingsData, etfMetrics, benchmarks, performanceData, allFetchedData, riskFreeRate, transactionsData } = useData();
  const [selectedETF, setSelectedETF] = useState<string | null>(null);
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'symbol', direction: 'asc' });

  const assetClasses = useMemo(() => ['All', ...Array.from(new Set(holdingsData.map(h => h.assetClass)))], [holdingsData]);

  const onSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const { sortedHoldings, etfChartData, selectedBenchmarkName, etfFundamentals } = useMemo(() => {
    // Calculate inception date from transactions
    const inceptionDate = transactionsData.length > 0 
      ? new Date(Math.min(...transactionsData.map(t => new Date(t.date).getTime())))
      : null;

    // 1. Filter and Calculate Dynamic Metrics for Holdings
    const filtered = holdingsData.filter(h => selectedAssetClass === 'All' || h.assetClass === selectedAssetClass);
    
    const benchHistory = allFetchedData[selectedBenchmark] || [];
    
    const holdingsWithMetrics = filtered.map(h => {
      const etfHistory = allFetchedData[h.symbol] || [];
      const staticMetrics = etfMetrics[h.symbol] || {};
      
      if (etfHistory.length > 5 && benchHistory.length > 5) {
        // Sort and find start date based on timeRange
        const sortedHistory = [...etfHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const latestDate = new Date(sortedHistory[sortedHistory.length - 1].date);
        let startDate = new Date(sortedHistory[0].date);

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
        } else if (timeRange === 'ALL' && inceptionDate) {
          startDate = inceptionDate;
        }

        if (timeRange === 'ALL' && inceptionDate && startDate < inceptionDate) {
          startDate = inceptionDate;
        }
        
        startDate.setUTCHours(0, 0, 0, 0);

        const filteredETF = sortedHistory.filter(d => new Date(d.date) >= startDate);
        const filteredBench = benchHistory.filter(d => new Date(d.date) >= startDate);

        // Align data points for math functions
        const { alignedPrices } = alignTimeSeries(
          { [h.symbol]: filteredETF, [selectedBenchmark]: filteredBench },
          [h.symbol, selectedBenchmark]
        );
        
        const alignedETF = alignedPrices[h.symbol];
        const alignedBench = alignedPrices[selectedBenchmark];

        if (alignedETF.length > 5) {
          const etfReturns = calculateLogReturns(alignedETF);
          const benchReturns = calculateLogReturns(alignedBench);
          const beta = calculateBeta(etfReturns, benchReturns);

          return {
            ...h,
            ...staticMetrics,
            return1M: ((alignedETF[alignedETF.length - 1] - alignedETF[0]) / alignedETF[0]) * 100,
            volatility: calculateVolatility(etfReturns),
            sharpeRatio: calculateSharpeRatio(etfReturns, riskFreeRate),
            alpha: calculateAlpha(etfReturns, benchReturns, beta, riskFreeRate),
            beta: beta,
            correlation: calculateCorrelation(etfReturns, benchReturns),
            trackingError: calculateTrackingError(etfReturns, benchReturns),
            var95: -calculateParametricVaR(etfReturns) // VaR is usually shown as negative in this UI
          };
        }
      }

      return {
        ...h,
        ...staticMetrics
      };
    });

    const sorted = [...holdingsWithMetrics].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key] ?? 0;
      const bVal = b[sortConfig.key] ?? 0;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    // 2. ETF Chart Data (Rebased to 100)
    let chartData: any[] = [];
    let bName = benchmarks.find(b => b.id === selectedBenchmark)?.name || 'Benchmark';
    
    if (selectedETF) {
      let etfHistory = allFetchedData[selectedETF] || [];
      let benchHistoryForChart = allFetchedData[selectedBenchmark] || [];

      // Filter by timeRange
      if (etfHistory.length > 0) {
        const sortedHistory = [...etfHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const latestDate = new Date(sortedHistory[sortedHistory.length - 1].date);
        let startDate = new Date(sortedHistory[0].date);

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
        } else if (timeRange === 'ALL' && inceptionDate) {
          startDate = inceptionDate;
        }

        if (timeRange === 'ALL' && inceptionDate && startDate < inceptionDate) {
          startDate = inceptionDate;
        }
        
        startDate.setUTCHours(0, 0, 0, 0);

        const filteredETF = sortedHistory.filter(d => {
          const dDate = new Date(d.date);
          dDate.setUTCHours(0, 0, 0, 0);
          return dDate >= startDate;
        });

        if (filteredETF.length > 0) {
          const firstValue = filteredETF[0].price || 1;
          
          chartData = filteredETF.map(d => {
            const bPoint = benchHistoryForChart.find(bd => bd.date === d.date);
            const firstBenchPoint = benchHistoryForChart.find(bd => bd.date === filteredETF[0].date);
            const firstBenchValue = firstBenchPoint?.price || 1;

            return {
              date: d.date,
              displayDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
              [selectedETF]: (d.price / firstValue) * 100,
              [bName]: bPoint ? (bPoint.price / firstBenchValue) * 100 : 100
            };
          });
        }
      }
    }

    // 3. ETF Fundamentals & Style (Mocked but deterministic)
    const getDeterministicValue = (symbol: string, seed: number, min: number, range: number) => {
      let hash = 0;
      for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
      }
      const pseudoRandom = Math.abs(Math.sin(hash + seed));
      return min + pseudoRandom * range;
    };

    const fundamentals = selectedETF ? {
      peRatio: getDeterministicValue(selectedETF, 1, 15, 10),
      pbRatio: getDeterministicValue(selectedETF, 2, 1.5, 3),
      dividendYield: etfMetrics[selectedETF]?.yield || 0,
      expenseRatio: etfMetrics[selectedETF]?.expenseRatio || 0.1,
      styleBox: {
        size: ['Large', 'Mid', 'Small'][Math.floor(getDeterministicValue(selectedETF, 3, 0, 2.9))],
        style: ['Value', 'Core', 'Growth'][Math.floor(getDeterministicValue(selectedETF, 4, 0, 2.9))]
      },
      topHoldings: [
        { name: 'Apple Inc.', weight: getDeterministicValue(selectedETF, 5, 5, 3) },
        { name: 'Microsoft Corp.', weight: getDeterministicValue(selectedETF, 6, 4, 3) },
        { name: 'Amazon.com Inc.', weight: getDeterministicValue(selectedETF, 7, 2, 2) },
        { name: 'NVIDIA Corp.', weight: getDeterministicValue(selectedETF, 8, 2, 2) },
        { name: 'Alphabet Inc.', weight: getDeterministicValue(selectedETF, 9, 1, 2) }
      ]
    } : null;

    return {
      sortedHoldings: sorted,
      etfChartData: chartData,
      selectedBenchmarkName: bName,
      etfFundamentals: fundamentals
    };
  }, [holdingsData, etfMetrics, benchmarks, performanceData, selectedETF, selectedAssetClass, sortConfig, selectedBenchmark, allFetchedData, timeRange, riskFreeRate]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Search className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">ASSET DEEP-DIVE</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-mono">Terminal v2.4.0</span>
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
            {['1M', '3M', 'YTD', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all tracking-wider ${
                  timeRange === range 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Asset Class Filter */}
          <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
            <div className="px-2 border-r border-white/10 mr-1">
              <Filter className="w-3 h-3 text-slate-500" />
            </div>
            {assetClasses.map((ac: string) => (
              <button
                key={ac}
                onClick={() => setSelectedAssetClass(ac)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all tracking-wider ${
                  selectedAssetClass === ac 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {ac.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Benchmark Selector */}
          <div className="relative">
            <select
              value={selectedBenchmark}
              onChange={(e) => setSelectedBenchmark(e.target.value)}
              className="appearance-none bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-[10px] font-bold text-white tracking-wider outline-none focus:border-indigo-500/50 transition-colors pr-10 min-w-[160px]"
            >
              {benchmarks.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0B0E14]">{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="terminal-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Holdings Performance Matrix</h4>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
            <span>TOTAL ASSETS: {sortedHoldings.length}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>SORT: {sortConfig.key.toUpperCase()}</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02]">
                <TableHeaderWithTooltip label="SYMBOL" metricKey="Symbol" sortKey="symbol" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltip label="ASSET CLASS" metricKey="Asset Class" sortKey="assetClass" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="RETURN" metricKey="Return" sortKey="return1M" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="VOLATILITY" metricKey="Volatility (Ann.)" sortKey="volatility" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="SHARPE" metricKey="Sharpe Ratio" sortKey="sharpeRatio" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="ALPHA" metricKey="Alpha (Ann.)" sortKey="alpha" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="BETA" metricKey="Beta" sortKey="beta" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="YIELD" metricKey="Dividend Yield" sortKey="yield" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="EXP. RATIO" metricKey="Expense Ratio" sortKey="expenseRatio" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="MARKET CAP" metricKey="Market Cap" sortKey="marketCap" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="CORR." metricKey="Correlation to Benchmark" sortKey="correlation" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="TE" metricKey="Tracking Error" sortKey="trackingError" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="VAR (95%)" metricKey="VaR (95%)" sortKey="var95" currentSortField={sortConfig.key} onSort={onSort} />
                <TableHeaderWithTooltipRight label="CVAR (95%)" metricKey="CVaR (95%)" sortKey="cvar95" currentSortField={sortConfig.key} onSort={onSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedHoldings.map((holding) => (
                <tr 
                  key={holding.symbol} 
                  className={`group transition-colors cursor-pointer ${
                    selectedETF === holding.symbol 
                      ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' 
                      : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                  }`}
                  onClick={() => setSelectedETF(holding.symbol)}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                        {holding.symbol}
                        {onTabChange && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onTabChange('transactions');
                            }} 
                            className="text-terminal-muted hover:text-indigo-400 transition-colors focus:outline-none"
                            title="View Transactions"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono tracking-tighter">{holding.benchmark}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                      {holding.assetClass}
                    </span>
                  </td>
                  <VisualMetricCell value={holding.return1M} min={-10} max={10} target={0} isPercentage />
                  <VisualMetricCell value={holding.volatility} min={0} max={40} target={20} isPercentage inverse />
                  <VisualMetricCell value={holding.sharpeRatio} min={-1} max={3} target={1} />
                  <VisualMetricCell value={holding.alpha} min={-5} max={5} target={0} isPercentage />
                  <VisualMetricCell value={holding.beta} min={0} max={2} target={1} inverse={holding.beta > 1.2} />
                  <VisualMetricCell value={holding.yield} min={0} max={10} target={2} isPercentage />
                  <VisualMetricCell value={holding.expenseRatio} min={0} max={1} target={0.1} isPercentage inverse />
                  <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-400">
                    {holding.marketCap ? `$${(holding.marketCap / 1e9).toFixed(1)}B` : 'N/A'}
                  </td>
                  <VisualMetricCell value={holding.correlation} min={0} max={1} target={0.8} />
                  <VisualMetricCell value={holding.trackingError} min={0} max={10} target={2} isPercentage inverse />
                  <VisualMetricCell value={holding.var95} min={-5} max={0} target={-2} isPercentage inverse />
                  <VisualMetricCell value={holding.cvar95} min={-5} max={0} target={-2} isPercentage inverse />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ETF Analysis Section */}
      {selectedETF && (
        <div className="terminal-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Target className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                  {selectedETF} <span className="text-slate-500 mx-2">VS</span> {selectedBenchmarkName}
                </h4>
                <p className="text-[9px] text-slate-500 font-mono">COMPARATIVE PERFORMANCE ANALYSIS</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedETF(null)}
              className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-bold uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500/20 transition-all"
            >
              TERMINATE ANALYSIS
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart Section */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">{selectedETF}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-slate-500 border-dashed" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedBenchmarkName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-500" />
                    <span className="text-[9px] text-slate-500 uppercase tracking-tighter">REBASED TO 100</span>
                  </div>
                </div>
                
                <div className="h-[350px] w-full bg-black/20 rounded-xl p-4 border border-white/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={etfChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="displayDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => val.toFixed(0)}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#151921', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontFamily: 'JetBrains Mono'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={selectedETF} 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#6366f1' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey={selectedBenchmarkName} 
                        stroke="#64748b" 
                        strokeWidth={2} 
                        strokeDasharray="5 5" 
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fundamentals & Style Box */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Fundamentals</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">P/E Ratio</p>
                      <p className="text-sm font-mono font-bold text-white">{etfFundamentals?.peRatio.toFixed(1)}x</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">P/B Ratio</p>
                      <p className="text-sm font-mono font-bold text-white">{etfFundamentals?.pbRatio.toFixed(1)}x</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Yield</p>
                      <p className="text-sm font-mono font-bold text-emerald-400">{etfFundamentals?.dividendYield.toFixed(2)}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Exp. Ratio</p>
                      <p className="text-sm font-mono font-bold text-white">{etfFundamentals?.expenseRatio.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Morningstar Style</h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="grid grid-cols-3 gap-1 w-32 h-32">
                      {['Large', 'Mid', 'Small'].map(size => 
                        ['Value', 'Core', 'Growth'].map(style => {
                          const isActive = etfFundamentals?.styleBox.size === size && etfFundamentals?.styleBox.style === style;
                          return (
                            <div 
                              key={`${size}-${style}`} 
                              className={`border border-white/10 rounded-sm flex items-center justify-center transition-all ${
                                isActive 
                                  ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)] scale-105 z-10' 
                                  : 'bg-white/[0.02]'
                              }`}
                              title={`${size} ${style}`}
                            >
                              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Size</p>
                        <p className="text-xs text-white font-bold tracking-wider">{etfFundamentals?.styleBox.size.toUpperCase()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Style</p>
                        <p className="text-xs text-white font-bold tracking-wider">{etfFundamentals?.styleBox.style.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between w-32 mt-2 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                    <span>Value</span>
                    <span>Core</span>
                    <span>Growth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Holdings Section */}
            <div className="mt-10 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Top 5 Underlying Assets</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {etfFundamentals?.topHoldings.map(h => (
                  <div key={h.name} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                    <p className="text-[10px] font-bold text-white truncate mb-2 group-hover:text-indigo-400 transition-colors">{h.name.toUpperCase()}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-indigo-400">{h.weight.toFixed(1)}%</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">WEIGHT</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                          style={{ width: `${h.weight * 5}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Directory */}
      <div className="terminal-card">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Benchmark Registry</h4>
          </div>
          <InfoTooltip 
            title="Benchmarks" 
            description="Standard indices used to measure the relative performance of your assets." 
            lookFor="Different assets are compared against different benchmarks (e.g., SPY for US Equities, AGG for Bonds)."
          />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benchmarks.map(b => (
              <div key={b.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold font-mono border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                    {b.id}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                </div>
                <p className="text-xs font-bold text-white mb-2 tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{b.name}</p>
                {b.marketCap && (
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">MARKET CAP</span>
                    <span className="text-[10px] text-slate-400 font-mono">${(b.marketCap / 1e9).toFixed(1)}B</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
