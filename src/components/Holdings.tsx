import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useData } from '../context/DataContext';
import { AddHoldingModal } from './AddHoldingModal';
import { Button } from './ui/Button';
import { Download, ArrowUpDown, Info, Tag, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { downloadCSV } from '../utils/download';
import { DataSourceFooter } from './DataSourceFooter';

type SortField = 'symbol' | 'currentPrice' | 'purchasePrice' | 'qty' | 'totalValue' | 'totalGainLoss';

export function Holdings() {
  const { holdingsData } = useData();
  const [sortField, setSortField] = useState<SortField>('totalValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const sortedHoldings = [...holdingsData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
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
          <CardTitle>Current Holdings</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
            <AddHoldingModal />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <Info className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-900">AI-Enriched Descriptions</p>
              <p className="text-xs text-indigo-700">Click "Generate Analysis" on the Dashboard to automatically fetch professional descriptions for your ETFs.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <SortHeader field="symbol" label="Symbol" />
                  <th scope="col" className="px-6 py-3 font-medium">ETF Description</th>
                  <th scope="col" className="px-6 py-3 font-medium text-right">Exp. Ratio</th>
                  <th scope="col" className="px-6 py-3 font-medium text-right">Market Cap</th>
                  <SortHeader field="currentPrice" label="Current Price" align="right" />
                  <SortHeader field="purchasePrice" label="Purchase Price" align="right" />
                  <SortHeader field="qty" label="QTY" align="right" />
                  <SortHeader field="totalValue" label="Total Value" align="right" />
                  <SortHeader field="totalGainLoss" label="Total Gain/Loss" align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((holding) => {
                  const isPositive = holding.totalGainLoss >= 0;
                  const assetClassColors: Record<string, string> = {
                    'US Equity': 'bg-blue-50 text-blue-700 border-blue-100',
                    'Intl Equity': 'bg-indigo-50 text-indigo-700 border-indigo-100',
                    'Fixed Income': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    'Real Estate': 'bg-amber-50 text-amber-700 border-amber-100',
                    'Commodities': 'bg-orange-50 text-orange-700 border-orange-100',
                  };
                  
                  return (
                    <tr key={holding.symbol} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-600 group-hover:underline cursor-pointer">{holding.symbol}</span>
                          <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${assetClassColors[holding.assetClass] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                            {holding.assetClass}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-md">
                        <div className="text-sm line-clamp-2">
                          {holding.description || <span className="text-slate-400 italic">No description available. Sync with AI to update.</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs">
                        {holding.expenseRatio ? `${holding.expenseRatio.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs">
                        {holding.marketCap ? `$${(holding.marketCap / 1e9).toFixed(1)}B` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs">
                        ${holding.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs">
                        ${holding.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {holding.qty.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                        ${holding.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {isPositive ? '+' : ''}${holding.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {sortedHoldings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No holdings found. Add your first holding to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <div className="px-6 pb-6">
        <DataSourceFooter 
          pageName="Portfolio Holdings" 
          interpretation="The Holdings tab provides a granular view of your individual ETF positions. It tracks your cost basis, current market value, and unrealized gains. Expense ratios and market caps are fetched from Yahoo Finance to help you monitor the cost and size of your underlying assets."
        />
      </div>
    </Card>
  );
}

