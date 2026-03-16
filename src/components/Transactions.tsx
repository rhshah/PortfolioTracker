import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useData } from '../context/DataContext';
import { AddTransactionModal } from './AddTransactionModal';
import { Button } from './ui/Button';
import { Download, ArrowUpDown } from 'lucide-react';
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

  const SortHeader = ({ field, label, align = 'left' }: { field: SortField, label: string, align?: 'left' | 'right' }) => (
    <th 
      scope="col" 
      className={`px-6 py-3 font-medium cursor-pointer hover:bg-slate-100 transition-colors ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <ArrowUpDown className="h-3 w-3 text-slate-400" />
      </div>
    </th>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaction History</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
          <AddTransactionModal />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <SortHeader field="date" label="Date" />
                <SortHeader field="symbol" label="Symbol" />
                <SortHeader field="type" label="Trade Type" />
                <SortHeader field="qty" label="QTY" align="right" />
                <SortHeader field="price" label="Price" align="right" />
                <SortHeader field="total" label="Total Cash Value" align="right" />
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((tx, index) => {
                const isBuy = tx.type === 'Buy';
                return (
                  <tr key={index} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 font-medium text-indigo-600">
                      {tx.symbol}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isBuy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tx.qty.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ${tx.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      ${tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {sortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No transactions found. Add your first transaction to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <div className="px-6 pb-6">
        <DataSourceFooter 
          pageName="Transaction History" 
          interpretation="The Transactions tab is your system of record for all portfolio activity. It tracks buys and sells, which are used to calculate your cost basis and holding periods for tax analysis. Accurate transaction data is critical for calculating time-weighted returns and realized gains/losses."
        />
      </div>
    </Card>
  );
}
