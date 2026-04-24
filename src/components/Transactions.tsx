import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useData } from '../context/DataContext';
import { AddTransactionModal } from './AddTransactionModal';
import { Button } from './ui/Button';
import { Download, ArrowUpDown, History, Trash2 } from 'lucide-react';
import { downloadCSV } from '../utils/download';
import { DataSourceFooter } from './DataSourceFooter';
import { calculateHoldingsFromTransactions } from '../utils/portfolioMath';
import { ArrowUpRight } from 'lucide-react';

type SortField = 'date' | 'symbol' | 'type' | 'qty' | 'price' | 'total' | 'decisionPrice' | 'executionPrice';

export function Transactions({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { transactionsData, holdingsData, updateData } = useData();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleDownload = () => {
    downloadCSV(transactionsData, 'portfolio_transactions.csv');
  };

  const handleDelete = (indexToDelete: number) => {
    // Find the actual index in the original transactionsData array
    const txToDelete = sortedTransactions[indexToDelete];
    const originalIndex = transactionsData.indexOf(txToDelete);
    
    if (originalIndex === -1) return;

    const newTransactions = [...transactionsData];
    newTransactions.splice(originalIndex, 1);

    // Recalculate holdings
    const currentPrices: Record<string, number> = {};
    holdingsData.forEach(h => {
      currentPrices[h.symbol] = h.currentPrice;
    });

    const newHoldings = calculateHoldingsFromTransactions(newTransactions, holdingsData, currentPrices);

    updateData({
      transactionsData: newTransactions,
      holdingsData: newHoldings
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTransactions = [...transactionsData].sort((a, b) => {
    let aValue = a[sortField] ?? 0;
    let bValue = b[sortField] ?? 0;
    
    // Special handling for dates
    if (sortField === 'date') {
      aValue = new Date(a.date).getTime();
      bValue = new Date(b.date).getTime();
    }
    
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
      scope="col" 
      className={`px-6 py-3 cursor-pointer hover:bg-white/5 transition-colors group ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <span className="tech-label group-hover:text-terminal-text">{label}</span>
        <ArrowUpDown className={`h-3 w-3 transition-colors ${sortField === field ? 'text-indigo-400' : 'text-terminal-muted group-hover:text-terminal-text'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div>
          <div className="tech-label text-indigo-400 mb-1">Audit Trail</div>
          <h3 className="text-xl font-bold font-display tracking-tight">Transaction History</h3>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownload} className="tech-label border-white/10 hover:bg-white/5 gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <AddTransactionModal />
        </div>
      </div>

      <div className="terminal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <SortHeader field="date" label="Date" />
                <SortHeader field="symbol" label="Symbol" />
                <SortHeader field="type" label="Trade Type" />
                <SortHeader field="qty" label="QTY" align="right" className="hidden sm:table-cell" />
                <SortHeader field="price" label="Price" align="right" className="hidden md:table-cell" />
                <SortHeader field="total" label="Total Cash Value" align="right" />
                <SortHeader field="decisionPrice" label="Decision Price" align="right" className="hidden lg:table-cell" />
                <SortHeader field="executionPrice" label="Execution Price" align="right" className="hidden lg:table-cell" />
                <th className="px-6 py-3 text-right tech-label w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedTransactions.map((tx, index) => {
                const isBuy = tx.type === 'Buy';
                const isDeposit = tx.type === 'Deposit' || tx.type === 'Adjustment';
                const isWithdrawal = tx.type === 'Withdrawal';
                const isSell = tx.type === 'Sell';
                
                let typeColor = 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
                if (isBuy) typeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                if (isSell) typeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                if (isDeposit) typeColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
                if (isWithdrawal) typeColor = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';

                return (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-terminal-muted">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-indigo-400">
                      <span className="flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                        {tx.symbol || '-'}
                        {onTabChange && tx.symbol && tx.symbol !== 'CASH' && (
                          <button 
                            onClick={() => onTabChange('analysis')} 
                            className="text-terminal-muted hover:text-indigo-400 transition-colors focus:outline-none"
                            title="View Analysis"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${typeColor}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right tech-value text-xs hidden sm:table-cell">
                      {tx.qty ? tx.qty.toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right tech-value text-xs hidden md:table-cell">
                      {tx.price ? `$${tx.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right tech-value text-xs text-terminal-text">
                      ${tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right tech-value text-xs hidden lg:table-cell text-slate-400">
                      {tx.decisionPrice ? `$${tx.decisionPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right tech-value text-xs hidden lg:table-cell text-slate-400">
                      {tx.executionPrice ? `$${tx.executionPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(index)}
                        className="p-1.5 hover:bg-rose-500/10 rounded-md transition-colors text-terminal-muted hover:text-rose-400"
                        title="Delete Transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <History className="h-8 w-8 text-white/10" />
                      <p className="text-sm font-mono text-terminal-muted">No transactions found in the audit trail.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pt-4">
        <DataSourceFooter 
          pageName="Transaction History" 
          interpretation="The Transactions tab is your system of record for all portfolio activity. It tracks buys and sells, which are used to calculate your cost basis and holding periods for tax analysis. Accurate transaction data is critical for calculating time-weighted returns and realized gains/losses."
        />
      </div>
    </div>
  );
}
