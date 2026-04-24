import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Cell,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { TrendingDown, AlertTriangle, ShieldCheck, Info, ArrowUpRight } from 'lucide-react';
import { InfoTooltip } from './benchmark/shared';

export function ExecutionTCA({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { transactionsData } = useData();

  const tcaMetrics = useMemo(() => {
    let totalCommission = 0;
    let totalSlippageDollars = 0;
    let totalImpactDollars = 0;
    let totalTradeValue = 0;
    let slippageBpsSum = 0;
    let countWithSlippage = 0;
    let beatVwapCount = 0;

    const scatterData: any[] = [];
    const waterfallData: any[] = [];

    transactionsData.forEach(t => {
      if (t.commission) totalCommission += t.commission;
      
      const tradeValue = t.qty * t.price;
      totalTradeValue += tradeValue;

      if (t.slippageBps !== undefined) {
        const slippageDlr = tradeValue * (t.slippageBps / 10000);
        totalSlippageDollars += slippageDlr;
        slippageBpsSum += t.slippageBps;
        countWithSlippage++;
      }

      if (t.marketImpactBps !== undefined) {
        const impactDlr = tradeValue * (t.marketImpactBps / 10000);
        totalImpactDollars += impactDlr;
      }

      if (t.vwap && t.executionPrice) {
        if (t.type === 'Buy' && t.executionPrice < t.vwap) beatVwapCount++;
        if (t.type === 'Sell' && t.executionPrice > t.vwap) beatVwapCount++;
      }

      if (t.slippageBps !== undefined) {
        scatterData.push({
          x: tradeValue,
          y: t.slippageBps,
          type: t.type,
          symbol: t.symbol,
          date: t.date
        });
      }
    });

    const avgSlippageBps = countWithSlippage > 0 ? slippageBpsSum / countWithSlippage : 0;
    const totalShortfall = totalCommission + totalSlippageDollars + totalImpactDollars;
    const shortfallPct = totalTradeValue > 0 ? (totalShortfall / totalTradeValue) * 100 : 0;
    const executionScore = transactionsData.length > 0 ? Math.round((beatVwapCount / transactionsData.length) * 100) : 0;

    // Waterfall Data
    // Gross Return (Hypothetical 100%), then subtract costs
    waterfallData.push({ name: 'Gross', value: totalTradeValue > 0 ? 100 : 0, fill: '#6366f1' });
    waterfallData.push({ name: 'Commissions', value: totalTradeValue > 0 ? -(totalCommission / totalTradeValue) * 100 : 0, fill: '#ef4444' });
    waterfallData.push({ name: 'Slippage', value: totalTradeValue > 0 ? -(totalSlippageDollars / totalTradeValue) * 100 : 0, fill: '#f59e0b' });
    waterfallData.push({ name: 'Impact', value: totalTradeValue > 0 ? -(totalImpactDollars / totalTradeValue) * 100 : 0, fill: '#ec4899' });
    
    const netValue = 100 - (totalTradeValue > 0 ? (totalShortfall / totalTradeValue) * 100 : 0);
    waterfallData.push({ name: 'Net', value: netValue, fill: '#10b981' });

    return {
      totalShortfall,
      shortfallPct,
      avgSlippageBps,
      executionScore,
      scatterData,
      waterfallData,
      analyzedTrades: transactionsData
    };
  }, [transactionsData]);

  return (
    <div className="space-y-8 animate-slam">
      {/* Top Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="terminal-card p-6 border-l-4 border-l-rose-500">
          <div className="tech-label mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            Implementation Shortfall
            <InfoTooltip 
              title="Total Friction" 
              description="The total dollar amount lost to execution inefficiencies. This includes explicit costs (broker commissions) and implicit costs (slippage and market impact)." 
              lookFor="A high shortfall indicates poor execution timing or excessive trading costs."
            />
          </div>
          <div className="text-3xl font-bold font-mono text-terminal-text tracking-tight">
            -${tcaMetrics.totalShortfall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-400 font-mono mt-2 font-bold">
            -{tcaMetrics.shortfallPct.toFixed(2)}% of Traded Volume
          </div>
        </div>

        <div className="terminal-card p-6 border-l-4 border-l-amber-500">
          <div className="tech-label mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Average Slippage
            <InfoTooltip 
              title="Average Slippage" 
              description="The difference between the price when you decided to trade (Arrival Price) and the price you actually got (Execution Price). Measured in basis points (1 bps = 0.01%)." 
              lookFor="Consistently high slippage suggests trading in illiquid markets or using aggressive market orders."
            />
          </div>
          <div className="text-3xl font-bold font-mono text-terminal-text tracking-tight">
            {tcaMetrics.avgSlippageBps.toFixed(1)} <span className="text-lg text-terminal-muted">bps</span>
          </div>
          <div className="text-xs text-terminal-muted font-mono mt-2">
            Across {tcaMetrics.scatterData.length} analyzed trades
          </div>
        </div>

        <div className="terminal-card p-6 border-l-4 border-l-emerald-500">
          <div className="tech-label mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Execution Quality Score
            <InfoTooltip 
              title="VWAP Beat Score" 
              description="A score from 0-100 based on how often your execution price beat the daily Volume Weighted Average Price (VWAP). A score above 50 means you are consistently getting better-than-average fills." 
              lookFor="Aim for a score above 50 to ensure you are not systematically overpaying."
            />
          </div>
          <div className="text-3xl font-bold font-mono text-terminal-text tracking-tight">
            {tcaMetrics.executionScore}/100
          </div>
          <div className="text-xs text-emerald-400 font-mono mt-2 font-bold">
            Beat VWAP on {tcaMetrics.executionScore}% of trades
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-terminal-muted font-mono bg-white/5 p-2 rounded-lg border border-white/5 inline-block mt-4">
        <Info className="h-3 w-3 inline mr-1 text-indigo-400" />
        TCA assumes arrival prices represent the opening benchmark price on the date of execution. Execution metrics are compared to intraday VWAP approximations.
      </p>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Chart */}
        <div className="terminal-card p-6">
          <div className="tech-label mb-6 flex items-center">
            Cost Breakdown (Relative to Gross)
            <InfoTooltip 
              title="Implementation Shortfall" 
              description="A waterfall chart showing how much of your gross return is eaten away by execution costs. 'Gross' is the theoretical return if trades were free and instantaneous." 
              lookFor="Identify the largest source of friction (commissions vs. slippage) to optimize your trading strategy."
            />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tcaMetrics.waterfallData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#151921', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Value']}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {tcaMetrics.waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="terminal-card p-6">
          <div className="tech-label mb-6 flex items-center">
            Trade Size vs. Slippage (bps)
            <InfoTooltip 
              title="Market Impact" 
              description="Visualizes whether larger trades suffer from worse execution. If the dots trend upwards to the right, your trade sizes are too large for the market's liquidity." 
              lookFor="Look for a positive correlation between trade size and slippage, indicating market impact."
            />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Trade Size" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Slippage" 
                  stroke="#64748b" 
                  fontSize={10} 
                  unit=" bps" 
                  tickLine={false} 
                  axisLine={false} 
                />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#151921', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Trade Size') return [`$${Number(value).toLocaleString()}`, name];
                    return [`${value} bps`, name];
                  }}
                  labelFormatter={() => ''}
                />
                <Scatter name="Buys" data={tcaMetrics.scatterData.filter(d => d.type === 'Buy')} fill="#10b981" />
                <Scatter name="Sells" data={tcaMetrics.scatterData.filter(d => d.type === 'Sell')} fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trade Tape */}
      <div className="terminal-card p-6">
        <div className="tech-label mb-6 flex items-center">
          Execution Tape & Micro-Receipts
          <InfoTooltip 
            title="Execution Tape" 
            description="A detailed log of every trade. The micro-chart shows the Arrival Price (gray), the Execution Price (colored dot), and the daily VWAP (blue line). Green dots mean you beat the VWAP." 
            lookFor="Review individual trades to understand the context behind aggregate slippage and impact metrics."
          />
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-[#151921] z-30">
              <tr className="border-b border-white/10">
                <th className="pb-3 text-xs font-bold text-terminal-muted uppercase tracking-widest bg-[#151921]">Date</th>
                <th className="pb-3 text-xs font-bold text-terminal-muted uppercase tracking-widest bg-[#151921]">Symbol</th>
                <th className="pb-3 text-xs font-bold text-terminal-muted uppercase tracking-widest bg-[#151921]">Type</th>
                <th className="pb-3 text-xs font-bold text-terminal-muted uppercase tracking-widest bg-[#151921]">Execution Note</th>
                <th className="pb-3 text-xs font-bold text-terminal-muted uppercase tracking-widest text-right bg-[#151921]">Size</th>
                <th className="pb-3 text-xs font-bold text-terminal-muted uppercase tracking-widest text-right bg-[#151921]">Exec Price</th>
                <th className="pb-3 text-xs font-bold text-terminal-muted uppercase tracking-widest text-center bg-[#151921]">
                  <div className="flex items-center justify-center">
                    Arrival ➔ Exec ➔ VWAP
                    <InfoTooltip 
                      title="Micro-Chart" 
                      description="Gray Dot = Arrival Price. Blue Line = VWAP. Colored Dot = Execution Price." 
                      lookFor="A colored dot to the left of the blue line (for buys) indicates a better-than-VWAP execution."
                    />
                  </div>
                </th>
                <th className="pb-3 text-xs font-bold text-terminal-muted uppercase tracking-widest text-right bg-[#151921]">
                  <div className="flex items-center justify-end">
                    Slippage
                    <InfoTooltip 
                      title="Slippage" 
                      description="Difference between Arrival Price and Execution Price in basis points." 
                      lookFor="Positive slippage means the execution price was worse than the arrival price."
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {tcaMetrics.analyzedTrades.map((trade, i) => {
                const isBuy = trade.type === 'Buy';
                const beatVwap = trade.vwap && trade.executionPrice 
                  ? (isBuy ? trade.executionPrice < trade.vwap : trade.executionPrice > trade.vwap)
                  : false;
                
                // Calculate positions for micro-chart (0 to 100%)
                const minPrice = Math.min(trade.arrivalPrice || trade.price, trade.executionPrice || trade.price, trade.vwap || trade.price) * 0.999;
                const maxPrice = Math.max(trade.arrivalPrice || trade.price, trade.executionPrice || trade.price, trade.vwap || trade.price) * 1.001;
                const range = maxPrice - minPrice;
                
                const getPos = (p: number) => `${((p - minPrice) / range) * 100}%`;

                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 text-terminal-muted">{trade.date}</td>
                    <td className="py-4 font-bold text-terminal-text">
                      <span className="flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                        {trade.symbol}
                        {onTabChange && (
                          <button 
                            onClick={() => onTabChange('transactions')} 
                            className="text-terminal-muted hover:text-indigo-400 transition-colors focus:outline-none"
                            title="View Transactions"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                        isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="py-4 text-terminal-muted text-xs">
                      {trade.executionType || 'Unknown'}
                      {trade.isTcaEstimated && (
                        <span className="ml-2 text-[10px] text-amber-500/80 italic" title="TCA metrics estimated from OHLCV data">
                          (Est.)
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">${(trade.qty * trade.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-4 text-right font-bold">${trade.executionPrice?.toFixed(2) || trade.price.toFixed(2)}</td>
                    <td className="py-4 px-8">
                      {trade.arrivalPrice && trade.vwap && trade.executionPrice ? (
                        <div className="relative h-2 w-full bg-white/5 rounded-full flex items-center">
                          {/* Arrival Price (Gray Dot) */}
                          <div 
                            className="absolute h-3 w-3 rounded-full bg-slate-400 border-2 border-[#0a0a0a] z-10"
                            style={{ left: getPos(trade.arrivalPrice), transform: 'translateX(-50%)' }}
                            title={`Arrival: $${trade.arrivalPrice.toFixed(2)}`}
                          />
                          {/* VWAP (Blue Line) */}
                          <div 
                            className="absolute h-4 w-1 bg-indigo-500 z-0"
                            style={{ left: getPos(trade.vwap), transform: 'translateX(-50%)' }}
                            title={`VWAP: $${trade.vwap.toFixed(2)}`}
                          />
                          {/* Execution Price (Colored Dot) */}
                          <div 
                            className={`absolute h-3 w-3 rounded-full border-2 border-[#0a0a0a] z-20 ${beatVwap ? 'bg-emerald-400' : 'bg-rose-400'}`}
                            style={{ left: getPos(trade.executionPrice), transform: 'translateX(-50%)' }}
                            title={`Execution: $${trade.executionPrice.toFixed(2)}`}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-terminal-muted">N/A</span>
                      )}
                    </td>
                    <td className={`py-4 text-right font-bold ${trade.slippageBps && trade.slippageBps > 15 ? 'text-rose-400' : 'text-terminal-muted'}`}>
                      {trade.slippageBps ? `${trade.slippageBps.toFixed(1)} bps` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
