import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { AddHoldingModal } from './AddHoldingModal';
import { Button } from './ui/Button';
import { 
  Download, 
  ArrowUpDown, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  Filter,
  Zap,
  ShieldAlert,
  TrendingUp,
  Activity
} from 'lucide-react';
import { downloadCSV } from '../utils/download';
import { DataSourceFooter } from './DataSourceFooter';
import { InfoTooltip } from './benchmark/shared';

type SortField = 'symbol' | 'currentPrice' | 'purchasePrice' | 'qty' | 'totalValue' | 'totalGainLoss' | 'tcaSlippage' | 'tcaImpact';

export function Holdings({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { holdingsData } = useData();
  const [sortField, setSortField] = useState<SortField>('totalValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleDownload = () => {
    downloadCSV(holdingsData, 'portfolio_holdings.csv');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredHoldings = holdingsData.filter(h => 
    h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.assetClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    const aValue = a[sortField] ?? 0;
    const bValue = b[sortField] ?? 0;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const SortHeader = ({ field, label, align = 'left', className = '' }: { field: SortField, label: string, align?: 'left' | 'right', className?: string }) => (
    <th 
      className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors group ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <span className="tech-label group-hover:text-terminal-text">{label}</span>
        <ArrowUpDown className={`h-3 w-3 transition-colors ${sortField === field ? 'text-indigo-400' : 'text-terminal-muted group-hover:text-terminal-text'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Utility Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-muted" />
          <input 
            type="text"
            placeholder="Search symbols, asset classes, or descriptions..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDownload} className="tech-label border-white/10 hover:bg-white/5 gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <AddHoldingModal />
        </div>
      </div>

      {/* Main Holdings Grid */}
      <div className="terminal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <SortHeader field="symbol" label="Symbol" />
                <th className="px-4 py-3 text-left tech-label">Allocation & Context</th>
                <th className="px-4 py-3 text-right tech-label hidden md:table-cell">Exp. Ratio</th>
                <SortHeader field="qty" label="Quantity" align="right" className="hidden sm:table-cell" />
                <SortHeader field="currentPrice" label="Price" align="right" className="hidden lg:table-cell" />
                <SortHeader field="totalValue" label="Market Value" align="right" />
                <SortHeader field="totalGainLoss" label="P&L (Unrealized)" align="right" />
                <SortHeader field="tcaSlippage" label="TCA Slippage" align="right" className="hidden xl:table-cell" />
                <SortHeader field="tcaImpact" label="TCA Impact" align="right" className="hidden xl:table-cell" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedHoldings.map((holding) => {
                const isPositive = holding.totalGainLoss >= 0;
                const totalPortfolioValue = holdingsData.reduce((sum, h) => sum + h.totalValue, 0);
                const allocationPct = (holding.totalValue / totalPortfolioValue) * 100;
                
                const satelliteSymbols = ['VGT', 'SCHY', 'REIT', 'SLV', 'XFIV', 'TXXI', 'PCMM'];
                const bucketRole = satelliteSymbols.includes(holding.symbol) ? 'Satellite' : (holding.symbol === 'CASH' ? 'Cash' : 'Core');
                const bucketColor = bucketRole === 'Satellite' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' : (bucketRole === 'Core' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-gray-400 border-gray-400/20 bg-gray-400/10');
                
                return (
                  <tr key={holding.symbol} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-5 align-top">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                            {holding.symbol}
                            {onTabChange && holding.symbol !== 'CASH' && (
                              <button 
                                onClick={() => onTabChange('analysis')} 
                                className="text-terminal-muted hover:text-indigo-400 transition-colors focus:outline-none"
                                title="View Analysis"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${bucketColor} uppercase tracking-tighter`}>
                            {bucketRole}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase text-terminal-muted tracking-tighter">{holding.assetClass}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top max-w-md">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${allocationPct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-terminal-text">{allocationPct.toFixed(1)}%</span>
                        </div>
                        <p className="text-[10px] text-terminal-muted leading-relaxed line-clamp-2 italic">
                          {holding.description || "No diagnostic data available. Sync with AI for institutional context."}
                        </p>
                        {allocationPct > 15 && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-400 uppercase tracking-tighter">
                            <ShieldAlert className="h-3 w-3" />
                            Concentration Risk Detected
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top text-right hidden md:table-cell">
                      <span className="tech-value text-xs">{holding.expenseRatio ? `${holding.expenseRatio.toFixed(2)}%` : '—'}</span>
                    </td>
                    <td className="px-4 py-5 align-top text-right hidden sm:table-cell">
                      <span className="tech-value text-xs">
                        {holding.symbol === 'CASH' ? '—' : holding.qty.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-5 align-top text-right hidden lg:table-cell">
                      <div className="flex flex-col items-end">
                        <span className="tech-value text-xs">
                          {holding.symbol === 'CASH' ? '—' : `$${holding.currentPrice.toFixed(2)}`}
                        </span>
                        {holding.symbol !== 'CASH' && (
                          <span className="text-[8px] font-mono text-terminal-muted">Basis: ${holding.purchasePrice.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top text-right">
                      <span className="tech-value text-xs font-bold">${holding.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-4 py-5 align-top text-right">
                      {holding.symbol === 'CASH' ? (
                        <span className="tech-value text-xs text-terminal-muted">—</span>
                      ) : (
                        <div className={`flex flex-col items-end ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div className="flex items-center gap-1 font-mono font-bold text-xs">
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            ${Math.abs(holding.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <span className="text-[8px] font-mono opacity-70">
                            {((holding.totalGainLoss / (holding.totalValue - holding.totalGainLoss)) * 100).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-5 align-top text-right hidden xl:table-cell">
                      {holding.symbol === 'CASH' ? (
                        <span className="tech-value text-xs text-terminal-muted">—</span>
                      ) : (
                        <span className={`tech-value text-xs ${(holding.tcaSlippage || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ${(holding.tcaSlippage || 0).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-5 align-top text-right hidden xl:table-cell">
                      {holding.symbol === 'CASH' ? (
                        <span className="tech-value text-xs text-terminal-muted">—</span>
                      ) : (
                        <span className={`tech-value text-xs ${(holding.tcaImpact || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ${(holding.tcaImpact || 0).toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sortedHoldings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-8 w-8 text-white/10" />
                      <p className="text-sm font-mono text-terminal-muted">No holdings match your current filter criteria.</p>
                      <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="tech-label border-white/10">Clear Search</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostic Footer */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-panel p-4 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div className="tech-label text-indigo-400 mb-1">Alpha Driver</div>
            <p className="text-[10px] text-terminal-muted leading-relaxed">
              Your overweight position in <span className="text-terminal-text font-bold">VGT</span> is the primary driver of excess returns relative to the S&P 500.
            </p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-600/20 flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="tech-label text-amber-400 mb-1">Risk Alert</div>
            <p className="text-[10px] text-terminal-muted leading-relaxed">
              Portfolio concentration in <span className="text-terminal-text font-bold">Technology</span> exceeds institutional limits (40% vs 25% target).
            </p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-600/20 flex items-center justify-center border border-emerald-500/20">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="tech-label text-emerald-400 mb-1">Efficiency</div>
            <p className="text-[10px] text-terminal-muted leading-relaxed">
              Weighted average expense ratio is <span className="text-terminal-text font-bold">0.08%</span>, placing you in the most cost-efficient tier.
            </p>
          </div>
        </div>
      </div>

      <DataSourceFooter 
        pageName="Institutional Holdings Grid" 
        interpretation="This grid provides a high-density view of your capital allocation. It tracks cost basis, market value, and unrealized P&L while highlighting concentration risks and expense efficiency."
      />
    </div>
  );
}

