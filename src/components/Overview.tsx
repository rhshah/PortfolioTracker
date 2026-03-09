import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { ArrowDownRight, ArrowUpRight, DollarSign, Percent, Activity, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface OverviewProps {
  analysisSummary?: string | null;
  isSyncing?: boolean;
}

export function Overview({ analysisSummary, isSyncing }: OverviewProps) {
  const { performanceData, holdingsData } = useData();
  const [timeframe, setTimeframe] = useState<'days' | 'months'>('days');

  const totalValue = holdingsData.reduce((sum, item) => sum + item.totalValue, 0);
  const totalGainLoss = holdingsData.reduce((sum, item) => sum + item.totalGainLoss, 0);
  const totalPurchaseValue = totalValue - totalGainLoss;
  const percentageReturn = (totalGainLoss / totalPurchaseValue) * 100;

  const formattedPerformanceData = useMemo(() => {
    if (timeframe === 'days') {
      return performanceData.map(d => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));
    } else {
      // Group by month
      const monthlyData: Record<string, any> = {};
      performanceData.forEach(d => {
        const date = new Date(d.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { ...d, displayDate: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) };
        } else {
          // Keep the latest value for the month
          monthlyData[monthKey] = { ...d, displayDate: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) };
        }
      });
      return Object.values(monthlyData);
    }
  }, [timeframe]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Based on latest market data
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Return</CardTitle>
            {totalGainLoss >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Since inception
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Percentage Return</CardTitle>
            <Percent className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${percentageReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {percentageReturn >= 0 ? '+' : ''}{percentageReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Time-weighted return
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Assets</CardTitle>
            <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
              {holdingsData.length}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{holdingsData.length} ETFs</div>
            <p className="text-xs text-slate-500 mt-1">
              Across various sectors
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Portfolio value since inception</CardDescription>
            </div>
            <div className="flex items-center bg-slate-100 rounded-md p-1">
              <button
                onClick={() => setTimeframe('days')}
                className={`px-3 py-1 text-sm rounded-sm transition-colors ${timeframe === 'days' ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Days
              </button>
              <button
                onClick={() => setTimeframe('months')}
                className={`px-3 py-1 text-sm rounded-sm transition-colors ${timeframe === 'months' ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Months
              </button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={['dataMin - 10000', 'dataMax + 10000']} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                    labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Executive Summary
            </CardTitle>
            <CardDescription>AI-generated insights</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {isSyncing ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-sm text-center">Generating summary...</p>
              </div>
            ) : analysisSummary ? (
              <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-indigo-600">
                <ReactMarkdown>{analysisSummary}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                <p className="text-sm text-center">Click "Sync Data" to generate an AI summary of your portfolio's performance.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
