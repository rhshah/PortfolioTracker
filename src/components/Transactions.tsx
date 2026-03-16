import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useData } from '../context/DataContext';
import { AddTransactionModal } from './AddTransactionModal';
import { Button } from './ui/Button';
import { Download, ArrowUpDown, History } from 'lucide-react';
import { downloadCSV } from '../utils/download';
import { DataSourceFooter } from './DataSourceFooter';

type SortField = 'date' | 'symbol' | 'type' | 'qty' | 'price' | 'total';

export function Transactions() {
  const { transactionsData } = useData();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleDownload = () => {
    downloadCSV(transactionsData, 'portfolio_transactions.csv');
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
    let aValue = a[sortField];
    let bValue = b[sortField];
    
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
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedTransactions.map((tx, index) => {
                const isBuy = tx.type === 'Buy';
                return (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-terminal-muted">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-indigo-400">
                      {tx.symbol}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right tech-value text-xs hidden sm:table-cell">
                      {tx.qty.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right tech-value text-xs hidden md:table-cell">
                      ${tx.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right tech-value text-xs text-terminal-text">
                      ${tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {sortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
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
