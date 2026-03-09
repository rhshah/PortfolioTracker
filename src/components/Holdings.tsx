import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { holdingsData } from '../data';

export function Holdings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Symbol</th>
                <th scope="col" className="px-6 py-3 font-medium hidden md:table-cell">Description</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Current Price</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Purchase Price</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">QTY</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Total Value</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Total Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {holdingsData.map((holding) => {
                const isPositive = holding.totalGainLoss >= 0;
                return (
                  <tr key={holding.symbol} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-600 whitespace-nowrap">
                      {holding.symbol}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-600">
                      {holding.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ${holding.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ${holding.purchasePrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {holding.qty.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      ${holding.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? '+' : ''}${holding.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
