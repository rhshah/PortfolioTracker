import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import { Info, HelpCircle, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { calculateReturns, calculateBeta, calculateCaptureRatios, calculateCorrelation, calculateSharpeRatio, calculateReturn1M } from '../../utils/financeMath';
import { InfoTooltip, MetricRow } from './shared';

interface RiskTabProps {
  selectedBenchmark: string;
  setSelectedBenchmark: (id: string) => void;
  timeRange: string;
  setTimeRange: (range: any) => void;
}

export const RiskTab: React.FC<RiskTabProps> = ({ 
  selectedBenchmark,
  setSelectedBenchmark,
  timeRange,
  setTimeRange
}) => {
  const { performanceData, holdingsData, etfMetrics, transactionsData, benchmarks, correlationMatrix: contextCorrelationMatrix, allFetchedData, riskFreeRate } = useData();

  const inceptionDate = useMemo(() => {
    if (transactionsData && transactionsData.length > 0) {
      const earliestTxTime = Math.min(...transactionsData.map(t => new Date(t.date).getTime()));
      return isNaN(earliestTxTime) ? null : new Date(earliestTxTime);
    }
    return null;
  }, [transactionsData]);

  const { scatterData, correlationMatrix, scenarioAnalysis, portfolioBeta, captureRatios, taxAnalysis } = useMemo(() => {
    // 0. Filter performance data by timeRange
    const sortedData = [...performanceData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedData.length === 0) return { scatterData: [], correlationMatrix: null, scenarioAnalysis: [], portfolioBeta: 0 };

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
    
    const benchHistory = allFetchedData[selectedBenchmark] || [];

    // 1. Scatter Data (Beta vs Return) - DYNAMIC
    const scatter = holdingsData.map(h => {
      const etfHistory = allFetchedData[h.symbol] || [];
      const staticMetrics = etfMetrics[h.symbol] || {};
      
      let dynamicBeta = staticMetrics.beta || 1.0;
      let dynamicReturn = staticMetrics.return1M || 0;
      let dynamicSharpe = staticMetrics.sharpeRatio || 0;

      if (etfHistory.length > 5 && benchHistory.length > 5) {
        const filteredETF = etfHistory.filter(d => new Date(d.date) >= startDate);
        const filteredBench = benchHistory.filter(d => new Date(d.date) >= startDate);

        const alignedDates = filteredETF.map(d => d.date).filter(date => filteredBench.some(bd => bd.date === date));
        const alignedETF = alignedDates.map(date => filteredETF.find(d => d.date === date)!.price);
        const alignedBench = alignedDates.map(date => filteredBench.find(d => d.date === date)!.price);

        if (alignedETF.length > 5) {
          const etfReturns = calculateReturns(alignedETF);
          const benchReturns = calculateReturns(alignedBench);
          dynamicBeta = calculateBeta(etfReturns, benchReturns);
          dynamicReturn = ((alignedETF[alignedETF.length - 1] - alignedETF[0]) / alignedETF[0]) * 100;
          dynamicSharpe = calculateSharpeRatio(etfReturns, riskFreeRate);
        }
      }
      
      return {
        symbol: h.symbol,
        beta: dynamicBeta,
        return1M: dynamicReturn,
        sharpeRatio: dynamicSharpe,
        marketCap: h.marketCap || 1000000000,
        assetClass: h.assetClass,
        isBenchmark: false
      };
    }).filter(Boolean);

    // Add Benchmark point
    let benchReturn = 0;
    if (benchHistory.length > 5) {
      const filteredBench = benchHistory.filter(d => new Date(d.date) >= startDate);
      if (filteredBench.length > 5) {
        benchReturn = ((filteredBench[filteredBench.length - 1].price - filteredBench[0].price) / filteredBench[0].price) * 100;
      }
    }

    scatter.push({
      symbol: selectedBenchmark,
      beta: 1.0,
      return1M: benchReturn,
      sharpeRatio: 0,
      marketCap: 500000000000,
      assetClass: 'Benchmark',
      isBenchmark: true
    });

    // 2. Correlation Matrix
    let matrixToUse = contextCorrelationMatrix;
    
    // If we have allFetchedData, we can calculate a dynamic matrix for the selected timeRange
    if (allFetchedData && Object.keys(allFetchedData).length > 0) {
      const symbols = holdingsData.map(h => h.symbol);
      const dynamicMatrix: any = {
        symbols,
        matrix: {}
      };

      for (const s1 of symbols) {
        dynamicMatrix.matrix[s1] = {};
        for (const s2 of symbols) {
          if (s1 === s2) {
            dynamicMatrix.matrix[s1][s2] = 1.0;
            continue;
          }

          const history1 = allFetchedData[s1];
          const history2 = allFetchedData[s2];

          if (history1 && history2 && history1.length > 0 && history2.length > 0) {
            // Filter both histories by the same startDate
            const filtered1 = history1.filter(d => new Date(d.date) >= startDate);
            const filtered2 = history2.filter(d => new Date(d.date) >= startDate);

            const commonDates = filtered1
              .map(d => d.date)
              .filter(date => filtered2.some(d2 => d2.date === date));

            if (commonDates.length > 5) {
              const returns1 = calculateReturns(commonDates.map(date => filtered1.find(d => d.date === date)!.price));
              const returns2 = calculateReturns(commonDates.map(date => filtered2.find(d => d.date === date)!.price));
              dynamicMatrix.matrix[s1][s2] = calculateCorrelation(returns1, returns2);
            } else {
              dynamicMatrix.matrix[s1][s2] = contextCorrelationMatrix?.matrix?.[s1]?.[s2] ?? 0.5;
            }
          } else {
            dynamicMatrix.matrix[s1][s2] = contextCorrelationMatrix?.matrix?.[s1]?.[s2] ?? 0.5;
          }
        }
      }
      matrixToUse = dynamicMatrix;
    }
    
    // 3. Scenario Analysis (Calculated Portfolio Beta)
    const portValues = filteredPerformance.map(d => d.value);
    const benchValues = filteredPerformance.map(d => d[selectedBenchmark]);
    const portReturns = calculateReturns(portValues);
    const benchReturns = calculateReturns(benchValues);
    
    const pBeta = calculateBeta(portReturns, benchReturns);
    
    const scenarios = [
      { name: 'S&P 500 -10%', estimatedLoss: -10 * pBeta, description: 'Standard market correction scenario' },
      { name: 'Tech Selloff -20%', estimatedLoss: -15 * pBeta, description: 'High-growth sector rotation' },
      { name: 'Interest Rate Spike', estimatedLoss: -5 * pBeta, description: 'Impact of 100bps yield increase' },
      { name: 'Global Recession', estimatedLoss: -25 * pBeta, description: 'Severe multi-quarter downturn' }
    ];

    const cRatios = calculateCaptureRatios(portReturns, benchReturns);

    // 4. Tax Impact Analysis (Based on Investopedia's ST vs LT distinction)
    const totalValue = holdingsData.reduce((sum, h) => sum + h.totalValue, 0);
    const taxAnalysis = holdingsData.map(h => {
      const unrealizedGain = h.totalGainLoss;
      
      // Calculate holding period from transactions
      const symbolTxs = transactionsData.filter(t => t.symbol === h.symbol && t.type === 'Buy');
      const earliestBuy = symbolTxs.length > 0 
        ? Math.min(...symbolTxs.map(t => new Date(t.date).getTime()))
        : Date.now();
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const isLongTerm = earliestBuy < oneYearAgo.getTime();
      
      // Standard Individual Rates (Investopedia: LT 15%, ST Ordinary Income ~24% for mid-bracket)
      const taxRate = isLongTerm ? 0.15 : 0.24;
      const estTax = unrealizedGain > 0 ? unrealizedGain * taxRate : 0;
      
      return {
        symbol: h.symbol,
        unrealizedGain,
        isLongTerm,
        estTax,
        weight: (h.totalValue / totalValue) * 100
      };
    });

    return {
      scatterData: scatter,
      correlationMatrix: matrixToUse,
      scenarioAnalysis: scenarios,
      portfolioBeta: pBeta,
      captureRatios: cRatios,
      taxAnalysis
    };
  }, [holdingsData, etfMetrics, performanceData, selectedBenchmark, timeRange, inceptionDate, contextCorrelationMatrix, allFetchedData, riskFreeRate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-900">Risk Parameters</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Adjust risk analysis window</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Upside / Downside Capture
              <InfoTooltip 
                title="Capture Ratios" 
                description="Measures how much of the benchmark's gains (Upside) and losses (Downside) the portfolio captured." 
                lookFor="Ideally, Upside > 100% and Downside < 100%. This indicates the portfolio gains more than the market in up periods and loses less in down periods."
              />
            </CardTitle>
            <CardDescription>Relative performance in up vs. down markets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upside Capture</span>
                  <span className="text-2xl font-mono font-bold text-emerald-600">{captureRatios.upside.toFixed(1)}%</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Downside Capture</span>
                  <span className="text-2xl font-mono font-bold text-rose-600">{captureRatios.downside.toFixed(1)}%</span>
                </div>
              </div>
              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, captureRatios.upside / 2)}%` }} 
                />
                <div className="w-0.5 h-full bg-white z-10" />
                <div 
                  className="h-full bg-rose-500 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, captureRatios.downside / 2)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                <span>More Aggressive</span>
                <span>Benchmark (100%)</span>
                <span>More Defensive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Risk vs. Reward Profile
              <InfoTooltip 
                title="Risk vs. Reward" 
                description="Visualizes the relationship between market sensitivity (Beta) and recent performance." 
                lookFor="Assets in the top-left are 'low risk, high reward' (Alpha generators). Top-right are 'high risk, high reward'."
              />
            </CardTitle>
            <CardDescription>Beta (Market Sensitivity) vs. 1M Return</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full relative">
              {/* Quadrant Labels */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-[0.03] p-10">
                <div className="flex items-start justify-start border-r border-b border-slate-900">
                  <span className="text-[40px] font-black uppercase tracking-tighter">Alpha Zone</span>
                </div>
                <div className="flex items-start justify-end border-b border-slate-900">
                  <span className="text-[40px] font-black uppercase tracking-tighter">Aggressive</span>
                </div>
                <div className="flex items-end justify-start border-r border-slate-900">
                  <span className="text-[40px] font-black uppercase tracking-tighter">Defensive</span>
                </div>
                <div className="flex items-end justify-end">
                  <span className="text-[40px] font-black uppercase tracking-tighter">Laggards</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    type="number" 
                    dataKey="beta" 
                    name="Beta" 
                    unit="" 
                    domain={[0, 2]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  >
                    <Label value="Beta (Market Sensitivity)" offset={-10} position="insideBottom" style={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }} />
                  </XAxis>
                  <YAxis 
                    type="number" 
                    dataKey="return1M" 
                    name="Return" 
                    unit="%" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  >
                    <Label value="1M Return (%)" angle={-90} position="insideLeft" style={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }} />
                  </YAxis>
                  <ZAxis type="number" dataKey="marketCap" range={[100, 800]} name="Market Cap" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-indigo-600">{data.symbol}</p>
                              {data.isBenchmark && <span className="text-[8px] bg-slate-900 text-white px-1 rounded">BENCHMARK</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">{data.assetClass}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Beta:</span>
                                <span className="font-mono font-bold">{data.beta?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Return:</span>
                                <span className={`font-mono font-bold ${(data.return1M || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {data.return1M?.toFixed(2) || '0.00'}%
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Sharpe:</span>
                                <span className="font-mono font-bold">{data.sharpeRatio?.toFixed(2) || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={1} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3">
                    <Label value="Market Beta" position="top" style={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
                  </ReferenceLine>
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" />
                  <Scatter name="ETFs" data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.isBenchmark ? '#000000' :
                          entry.assetClass === 'US Equity' ? '#6366f1' :
                          entry.assetClass === 'Intl Equity' ? '#8b5cf6' :
                          entry.assetClass === 'Fixed Income' ? '#10b981' :
                          entry.assetClass === 'Real Estate' ? '#f59e0b' :
                          '#64748b'
                        }
                        stroke={entry.isBenchmark ? '#ffffff' : 'none'}
                        strokeWidth={entry.isBenchmark ? 2 : 0}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Scenario Stress Test
              <InfoTooltip 
                title="Scenario Analysis" 
                description="Estimates how your portfolio might perform under specific historical or hypothetical market shocks." 
                lookFor="Review the potential losses to ensure they align with your risk tolerance."
              />
            </CardTitle>
            <CardDescription>Estimated portfolio impact based on current Beta ({portfolioBeta.toFixed(2)})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scenarioAnalysis.map(s => (
                <div key={s.name} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group relative">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-900">{s.name}</span>
                    <span className="text-sm font-mono font-bold text-rose-600">{s.estimatedLoss.toFixed(1)}%</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {s.description}
                  </p>
                  <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500" 
                      style={{ width: `${Math.min(100, Math.abs(s.estimatedLoss))}%` }} 
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 italic">
                  <Info className="h-3 w-3" />
                  <span>Estimates assume linear beta relationship. Idiosyncratic risk not included.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Tax Impact Analysis
              <InfoTooltip 
                title="Tax-Efficient Rebalancing" 
                description="Estimates potential tax liabilities if you were to sell positions to rebalance your portfolio." 
                lookFor="High unrealized gains in short-term holdings create the largest tax drag. Consider tax-loss harvesting to offset these."
              />
            </CardTitle>
            <CardDescription>Estimated tax drag on rebalancing (15% LT / 25% ST)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Unrealized Gain</p>
                  <p className="text-lg font-mono font-bold text-emerald-600">
                    ${taxAnalysis?.reduce((sum: number, i: any) => sum + Math.max(0, i.unrealizedGain), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Est. Liquidation Tax</p>
                  <p className="text-lg font-mono font-bold text-rose-600">
                    ${taxAnalysis?.reduce((sum: number, i: any) => sum + i.estTax, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Tax Drags</p>
                {taxAnalysis?.sort((a: any, b: any) => b.estTax - a.estTax).slice(0, 3).map((item: any) => (
                  <div key={item.symbol} className="flex items-center justify-between p-2 rounded-lg border border-slate-50 bg-white shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.symbol}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${item.isLongTerm ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.isLongTerm ? 'Long Term' : 'Short Term'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-slate-900">${item.estTax.toFixed(0)}</p>
                      <p className="text-[9px] text-slate-400">Tax Liability</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed">
                  <ShieldCheck className="h-3 w-3 mt-0.5 text-indigo-500 shrink-0" />
                  <span>
                    Analysis based on Investopedia's standard individual rates: 15% for Long-Term (&gt;1yr) and 24% for Short-Term (estimated marginal rate). Actual taxes depend on your specific bracket and state.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Correlation Matrix</CardTitle>
          <CardDescription>Understanding how your assets move together (1.0 = Perfect Sync, 0 = No Relation)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {correlationMatrix && correlationMatrix.symbols && correlationMatrix.symbols.length > 0 ? (
            <div className="w-full max-w-full overflow-x-auto">
              <div className="min-w-[900px] p-4">
                <div 
                  className="grid gap-1"
                  style={{ 
                    gridTemplateColumns: `100px repeat(${correlationMatrix.symbols.length}, 1fr)` 
                  }}
                >
                  {/* Header */}
                  <div className="h-10" />
                  {correlationMatrix.symbols.map((s: string) => (
                    <div key={s} className="h-10 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate px-1" title={s}>
                      {s}
                    </div>
                  ))}

                  {/* Matrix Rows */}
                  {correlationMatrix.symbols.map((s1: string) => (
                    <React.Fragment key={s1}>
                      <div className="h-12 flex items-center justify-end pr-4 text-[10px] font-bold text-slate-900 uppercase tracking-tighter truncate" title={s1}>
                        {s1}
                      </div>
                      {correlationMatrix.symbols.map((s2: string) => {
                        const corr = correlationMatrix.matrix[s1]?.[s2] ?? 0;
                        const absCorr = Math.abs(corr);
                        const size = 10 + (absCorr * 30); // Bubble size between 10px and 40px
                        const color = corr > 0 ? '#6366f1' : '#f43f5e';
                        const opacity = 0.1 + (absCorr * 0.9);

                        return (
                          <div 
                            key={s2} 
                            className="h-12 flex items-center justify-center bg-slate-50/50 rounded-lg border border-white relative group"
                            title={`${s1} vs ${s2}: ${corr.toFixed(2)}`}
                          >
                            <div 
                              className="rounded-full transition-all duration-500 ease-out shadow-sm"
                              style={{ 
                                width: `${size}px`, 
                                height: `${size}px`, 
                                backgroundColor: color,
                                opacity: opacity
                              }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-shadow-md">
                              {corr.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                      <div className="w-4 h-4 rounded-full bg-slate-300" />
                      <div className="w-6 h-6 rounded-full bg-slate-300" />
                    </div>
                    <span>Strength</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span>Positive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span>Negative</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 italic text-sm gap-2">
              <Info className="h-5 w-5 opacity-20" />
              <span>{holdingsData.length > 0 ? "Sync data to generate correlation analysis" : "Add more holdings to see correlation analysis"}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
