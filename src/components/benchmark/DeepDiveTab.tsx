import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TableHeaderWithTooltip, TableHeaderWithTooltipRight, VisualMetricCell, InfoTooltip } from './shared';
import { useData } from '../../context/DataContext';
import { 
  calculateReturns, 
  calculateVolatility, 
  calculateSharpeRatio, 
  calculateMaxDrawdown, 
  calculateBeta, 
  calculateAlpha, 
  calculateTrackingError, 
  calculateVaR,
  calculateCorrelation
} from '../../utils/financeMath';

interface DeepDiveTabProps {
  selectedBenchmark: string;
  setSelectedBenchmark: (id: string) => void;
  timeRange: string;
  setTimeRange: (range: any) => void;
}

export const DeepDiveTab: React.FC<DeepDiveTabProps> = ({ 
  selectedBenchmark,
  setSelectedBenchmark,
  timeRange,
  setTimeRange
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
        const alignedDates = filteredETF.map(d => d.date).filter(date => filteredBench.some(bd => bd.date === date));
        const alignedETF = alignedDates.map(date => filteredETF.find(d => d.date === date)!.price);
        const alignedBench = alignedDates.map(date => filteredBench.find(d => d.date === date)!.price);

        if (alignedETF.length > 5) {
          const etfReturns = calculateReturns(alignedETF);
          const benchReturns = calculateReturns(alignedBench);
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
            var95: -calculateVaR(etfReturns) // VaR is usually shown as negative in this UI
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-900">Asset Deep-Dive</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Analyze individual holdings vs. benchmark</p>
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
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            {assetClasses.map((ac: string) => (
              <button
                key={ac}
                onClick={() => setSelectedAssetClass(ac)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${selectedAssetClass === ac ? 'bg-white shadow-sm font-bold text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {ac}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Individual ETF Performance Directory</CardTitle>
            <CardDescription>Detailed metrics for each holding in your portfolio</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50/50">
                <tr>
                  <TableHeaderWithTooltip label="Symbol" metricKey="Symbol" sortKey="symbol" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltip label="Asset Class" metricKey="Asset Class" sortKey="assetClass" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Return" metricKey="Return" sortKey="return1M" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Volatility" metricKey="Volatility (Ann.)" sortKey="volatility" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Sharpe" metricKey="Sharpe Ratio" sortKey="sharpeRatio" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Alpha" metricKey="Alpha (Ann.)" sortKey="alpha" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Beta" metricKey="Beta" sortKey="beta" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Yield" metricKey="Dividend Yield" sortKey="yield" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Exp. Ratio" metricKey="Expense Ratio" sortKey="expenseRatio" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Market Cap" metricKey="Market Cap" sortKey="marketCap" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="Corr." metricKey="Correlation to Benchmark" sortKey="correlation" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="TE" metricKey="Tracking Error" sortKey="trackingError" currentSortField={sortConfig.key} onSort={onSort} />
                  <TableHeaderWithTooltipRight label="VaR (95%)" metricKey="VaR (95%)" sortKey="var95" currentSortField={sortConfig.key} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedHoldings.map((holding) => (
                  <tr 
                    key={holding.symbol} 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedETF === holding.symbol ? 'bg-indigo-50/50' : ''}`}
                    onClick={() => setSelectedETF(holding.symbol)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{holding.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{holding.benchmark}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
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
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                      {holding.marketCap ? `$${(holding.marketCap / 1e9).toFixed(1)}B` : 'N/A'}
                    </td>
                    <VisualMetricCell value={holding.correlation} min={0} max={1} target={0.8} />
                    <VisualMetricCell value={holding.trackingError} min={0} max={10} target={2} isPercentage inverse />
                    <VisualMetricCell value={holding.var95} min={-5} max={0} target={-2} isPercentage inverse />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedETF && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedETF} vs. {selectedBenchmarkName}
                  <InfoTooltip 
                    title="Price History" 
                    description="Visualizes the growth of $100 invested in the selected ETF vs. its benchmark." 
                    lookFor="Divergence between the lines indicates Alpha (outperformance) or Beta (sensitivity) differences."
                  />
                </CardTitle>
                <CardDescription>Historical Price Comparison (Normalized)</CardDescription>
              </div>
              <button 
                onClick={() => setSelectedETF(null)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Close Analysis
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={etfChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="displayDate" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line 
                      type="monotone" 
                      dataKey={selectedETF} 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{ r: 6, strokeWidth: 0 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey={selectedBenchmarkName} 
                      stroke="#94a3b8" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Fundamentals</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">P/E Ratio</p>
                      <p className="text-sm font-mono font-bold text-slate-900">{etfFundamentals?.peRatio.toFixed(1)}x</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">P/B Ratio</p>
                      <p className="text-sm font-mono font-bold text-slate-900">{etfFundamentals?.pbRatio.toFixed(1)}x</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Yield</p>
                      <p className="text-sm font-mono font-bold text-emerald-600">{etfFundamentals?.dividendYield.toFixed(2)}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Exp. Ratio</p>
                      <p className="text-sm font-mono font-bold text-slate-900">{etfFundamentals?.expenseRatio.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Style Box</h4>
                  <div className="grid grid-cols-3 gap-1 w-32 h-32">
                    {['Large', 'Mid', 'Small'].map(size => 
                      ['Value', 'Core', 'Growth'].map(style => {
                        const isActive = etfFundamentals?.styleBox.size === size && etfFundamentals?.styleBox.style === style;
                        return (
                          <div 
                            key={`${size}-${style}`} 
                            className={`border border-slate-200 rounded-sm flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500 border-indigo-600 shadow-sm scale-105 z-10' : 'bg-slate-50'}`}
                            title={`${size} ${style}`}
                          >
                            {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="flex justify-between w-32 mt-1 text-[8px] font-bold text-slate-400 uppercase">
                    <span>Value</span>
                    <span>Core</span>
                    <span>Growth</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Top 5 Holdings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {etfFundamentals?.topHoldings.map(h => (
                  <div key={h.name} className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <p className="text-[10px] font-bold text-slate-900 truncate mb-1">{h.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-600">{h.weight.toFixed(1)}%</span>
                      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${h.weight * 5}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Benchmark Directory
            <InfoTooltip 
              title="Benchmarks" 
              description="Standard indices used to measure the relative performance of your assets." 
              lookFor="Different assets are compared against different benchmarks (e.g., SPY for US Equities, AGG for Bonds)."
            />
          </CardTitle>
          <CardDescription>Reference indices used for relative performance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benchmarks.map(b => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-600 font-mono">{b.id}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">{b.name}</p>
                {b.marketCap && (
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Market Cap: ${(b.marketCap / 1e9).toFixed(1)}B
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
