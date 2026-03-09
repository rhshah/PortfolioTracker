import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useData } from '../context/DataContext';
import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export function BenchmarkComparison() {
  const { performanceData, benchmarks, metricsData, holdingsData, etfMetrics } = useData();
  const [selectedBenchmark, setSelectedBenchmark] = useState(benchmarks[0].id);
  const [selectedETF, setSelectedETF] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'days' | 'months'>('days');
  const [chartType, setChartType] = useState<'value' | 'percentage'>('value');

  const portfolioMetrics = metricsData.portfolio;
  const benchmarkMetrics = metricsData[selectedBenchmark as keyof typeof metricsData];

  const MetricRow = ({ label, portValue, benchValue, isPercentage = false, inverseGood = false }: any) => {
    const diff = portValue - benchValue;
    const isPositive = inverseGood ? diff < 0 : diff > 0;
    
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-6 text-sm">
          <span className={`w-20 text-right font-semibold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md' : 'text-slate-900'}`}>
            {isPositive && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            {portValue.toFixed(2)}{isPercentage ? '%' : ''}
          </span>
          <span className={`w-20 text-right flex items-center justify-end gap-1 ${!isPositive ? 'text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-semibold' : 'text-slate-500'}`}>
            {!isPositive && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            {benchValue.toFixed(2)}{isPercentage ? '%' : ''}
          </span>
          <span className={`w-20 text-right flex items-center justify-end ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(diff).toFixed(2)}{isPercentage ? '%' : ''}
          </span>
        </div>
      </div>
    );
  };

  const totalPortfolioValue = holdingsData.reduce((sum, item) => sum + item.totalValue, 0);
  const assetAllocation = holdingsData.reduce((acc, holding) => {
    acc[holding.assetClass] = (acc[holding.assetClass] || 0) + holding.totalValue;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(assetAllocation)
    .map(([name, value]) => ({ name, value, percentage: (value / totalPortfolioValue) * 100 }))
    .sort((a, b) => b.value - a.value);
    
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const formattedPerformanceData = useMemo(() => {
    let baseData = [...performanceData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (timeframe === 'months') {
      const monthlyData: Record<string, any> = {};
      baseData.forEach(d => {
        const date = new Date(d.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { ...d };
        } else {
          monthlyData[monthKey] = { ...d };
        }
      });
      baseData = Object.keys(monthlyData).sort().map(key => monthlyData[key]);
    }

    const initialPortfolioValue = baseData[0].value;
    const initialBenchmarkValue = baseData[0][selectedBenchmark as keyof typeof baseData[0]] as number;

    return baseData.map(d => {
      const date = new Date(d.date);
      const displayDate = timeframe === 'days' 
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const benchValue = d[selectedBenchmark as keyof typeof d] as number;

      if (chartType === 'percentage') {
        return {
          ...d,
          displayDate,
          value: ((d.value - initialPortfolioValue) / initialPortfolioValue) * 100,
          [selectedBenchmark]: ((benchValue - initialBenchmarkValue) / initialBenchmarkValue) * 100,
        };
      }

      return {
        ...d,
        displayDate,
      };
    });
  }, [timeframe, chartType, selectedBenchmark, performanceData]);

  // Generate mock data for individual ETF chart
  const etfChartData = useMemo(() => {
    if (!selectedETF) return [];
    const holding = holdingsData.find(h => h.symbol === selectedETF);
    if (!holding) return [];
    
    let baseValue = holding.purchasePrice;
    let benchBaseValue = 100; // Normalized benchmark value
    
    return formattedPerformanceData.map((d, i) => {
      // Add some random walk based on the ETF's alpha/beta
      const metrics = etfMetrics[selectedETF];
      const dailyReturn = (metrics.return1M / 100) / formattedPerformanceData.length;
      const benchDailyReturn = (metrics.benchReturn1M / 100) / formattedPerformanceData.length;
      
      baseValue = baseValue * (1 + dailyReturn + (Math.random() * 0.01 - 0.005));
      benchBaseValue = benchBaseValue * (1 + benchDailyReturn + (Math.random() * 0.01 - 0.005));
      
      return {
        displayDate: d.displayDate,
        [selectedETF]: baseValue,
        [holding.benchmark]: benchBaseValue * (holding.purchasePrice / 100) // Scale benchmark to match starting price roughly
      };
    });
  }, [selectedETF, formattedPerformanceData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Quantitative Analysis</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-md p-1">
            <button
              onClick={() => setChartType('value')}
              className={`px-3 py-1 text-sm rounded-sm transition-colors ${chartType === 'value' ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Value
            </button>
            <button
              onClick={() => setChartType('percentage')}
              className={`px-3 py-1 text-sm rounded-sm transition-colors ${chartType === 'percentage' ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Percentage
            </button>
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
          <select
            value={selectedBenchmark}
            onChange={(e) => setSelectedBenchmark(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
          >
            {benchmarks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Performance vs {selectedBenchmark}</CardTitle>
          <CardDescription>Portfolio value compared to selected benchmark since inception</CardDescription>
        </CardHeader>
        <CardContent>
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
                  domain={['auto', 'auto']} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => chartType === 'percentage' ? `${value.toFixed(1)}%` : `$${(value / 1000).toFixed(0)}k`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => [
                    chartType === 'percentage' ? `${value.toFixed(2)}%` : `$${value.toLocaleString()}`, 
                    name === 'value' ? 'Portfolio' : name
                  ]}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Portfolio"
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedBenchmark} 
                  name={selectedBenchmark}
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 6, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Macro Metrics</CardTitle>
            <CardDescription>High-level performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-end pb-2 border-b border-slate-200 text-xs font-medium text-slate-500">
              <div className="flex gap-6">
                <span className="w-20 text-right">Portfolio</span>
                <span className="w-20 text-right">{selectedBenchmark}</span>
                <span className="w-20 text-right">Diff</span>
              </div>
            </div>
            <MetricRow label="1M Return" portValue={portfolioMetrics.return1M} benchValue={benchmarkMetrics.return1M} isPercentage />
            <MetricRow label="Volatility (Ann.)" portValue={portfolioMetrics.volatility} benchValue={benchmarkMetrics.volatility} isPercentage inverseGood />
            <MetricRow label="Max Drawdown" portValue={portfolioMetrics.maxDrawdown} benchValue={benchmarkMetrics.maxDrawdown} isPercentage />
            <MetricRow label="Dividend Yield" portValue={portfolioMetrics.yield} benchValue={benchmarkMetrics.yield} isPercentage />
            <MetricRow label="Correlation" portValue={portfolioMetrics.correlation} benchValue={benchmarkMetrics.correlation} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Micro Metrics</CardTitle>
            <CardDescription>Risk-adjusted performance measures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-end pb-2 border-b border-slate-200 text-xs font-medium text-slate-500">
              <div className="flex gap-6">
                <span className="w-20 text-right">Portfolio</span>
                <span className="w-20 text-right">{selectedBenchmark}</span>
                <span className="w-20 text-right">Diff</span>
              </div>
            </div>
            <MetricRow label="Sharpe Ratio" portValue={portfolioMetrics.sharpeRatio} benchValue={benchmarkMetrics.sharpeRatio} />
            <MetricRow label="Beta vs Market" portValue={portfolioMetrics.beta} benchValue={benchmarkMetrics.beta} inverseGood />
            <MetricRow label="Alpha (Ann.)" portValue={portfolioMetrics.alpha} benchValue={benchmarkMetrics.alpha} isPercentage />
            <MetricRow label="Tracking Error" portValue={portfolioMetrics.trackingError} benchValue={benchmarkMetrics.trackingError} isPercentage inverseGood />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Portfolio Construction</CardTitle>
            <CardDescription>Asset class allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Individual ETF vs Benchmark</CardTitle>
            <CardDescription>Click on an ETF to view its performance chart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">ETF</th>
                    <th className="px-4 py-3 font-medium">Asset Class</th>
                    <th className="px-4 py-3 font-medium">Benchmark</th>
                    <th className="px-4 py-3 font-medium text-right">1M Return</th>
                    <th className="px-4 py-3 font-medium text-right">Bench 1M</th>
                    <th className="px-4 py-3 font-medium text-right">Alpha</th>
                    <th className="px-4 py-3 font-medium text-right">Beta</th>
                    <th className="px-4 py-3 font-medium text-right">Corr.</th>
                    <th className="px-4 py-3 font-medium text-right">Trk. Err</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsData.map(holding => {
                    const metrics = etfMetrics[holding.symbol];
                    if (!metrics) return null;
                    
                    const outperforming = metrics.return1M > metrics.benchReturn1M;
                    const isSelected = selectedETF === holding.symbol;
                    
                    return (
                      <tr 
                        key={holding.symbol} 
                        onClick={() => setSelectedETF(isSelected ? null : holding.symbol)}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 font-medium text-indigo-600">{holding.symbol}</td>
                        <td className="px-4 py-3">{holding.assetClass}</td>
                        <td className="px-4 py-3 text-slate-400">{holding.benchmark}</td>
                        <td className={`px-4 py-3 text-right font-medium ${metrics.return1M >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {metrics.return1M > 0 ? '+' : ''}{metrics.return1M.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          {metrics.benchReturn1M > 0 ? '+' : ''}{metrics.benchReturn1M.toFixed(2)}%
                        </td>
                        <td className={`px-4 py-3 text-right ${outperforming ? 'text-emerald-600 font-medium' : 'text-slate-600'}`}>
                          {metrics.alpha > 0 ? '+' : ''}{metrics.alpha.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">{metrics.beta.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{metrics.correlation.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{metrics.trackingError.toFixed(2)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedETF && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardHeader>
            <CardTitle>{selectedETF} vs {holdingsData.find(h => h.symbol === selectedETF)?.benchmark}</CardTitle>
            <CardDescription>Performance comparison since transaction date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={etfChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                    minTickGap={15}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                    labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line 
                    type="monotone" 
                    dataKey={selectedETF} 
                    name={selectedETF}
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={holdingsData.find(h => h.symbol === selectedETF)?.benchmark || ''} 
                    name={holdingsData.find(h => h.symbol === selectedETF)?.benchmark}
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 6, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


