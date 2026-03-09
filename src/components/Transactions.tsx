import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { transactionsData } from '../data';

export function Transactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Date</th>
                <th scope="col" className="px-6 py-3 font-medium">Symbol</th>
                <th scope="col" className="px-6 py-3 font-medium">Trade Type</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">QTY</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Price</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Total Cash Value</th>
              </tr>
            </thead>
            <tbody>
              {transactionsData.map((tx, index) => {
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
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
