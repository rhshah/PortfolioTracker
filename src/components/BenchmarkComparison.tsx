import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  List, 
  Download, 
  Image as ImageIcon
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from './ui/Button';
import { AttributionTab } from './benchmark/AttributionTab';
import { RiskTab } from './benchmark/RiskTab';
import { DeepDiveTab } from './benchmark/DeepDiveTab';
import { ErrorBoundary } from './ErrorBoundary';
import { InfoTooltip } from './benchmark/shared';
import { DataSourceFooter } from './DataSourceFooter';

export type TimeRange = '1M' | '3M' | 'YTD' | '1Y' | 'ALL';
export type SubTab = 'attribution' | 'risk' | 'deep-dive';

export function BenchmarkComparison() {
  const { benchmarks, riskFreeRate } = useData();
  const [selectedBenchmark, setSelectedBenchmark] = useState(benchmarks[0].id);
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('attribution');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-8">
          {[
            { id: 'attribution', label: 'Performance Attribution', icon: TrendingUp },
            { id: 'risk', label: 'Risk & Correlation', icon: ShieldCheck },
            { id: 'deep-dive', label: 'Asset Deep-Dive', icon: List }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`flex items-center gap-2 py-4 text-sm font-medium transition-all relative ${activeSubTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeSubTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md mb-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Risk-Free Rate:</span>
            <InfoTooltip 
              title="Risk-Free Rate" 
              description="The theoretical return on an investment with zero risk, typically based on 3-month Treasury bills." 
              lookFor="Used as a baseline to calculate excess returns like the Sharpe Ratio."
            />
          </div>
          <span className="text-sm font-bold text-indigo-600">{(riskFreeRate * 100).toFixed(2)}%</span>
        </div>
      </div>

      <ErrorBoundary>
        {activeSubTab === 'attribution' && (
          <AttributionTab 
            selectedBenchmark={selectedBenchmark}
            setSelectedBenchmark={setSelectedBenchmark}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
          />
        )}
        {activeSubTab === 'risk' && (
          <RiskTab 
            selectedBenchmark={selectedBenchmark}
            setSelectedBenchmark={setSelectedBenchmark}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
          />
        )}
        {activeSubTab === 'deep-dive' && (
          <DeepDiveTab 
            selectedBenchmark={selectedBenchmark}
            setSelectedBenchmark={setSelectedBenchmark}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
          />
        )}
      </ErrorBoundary>

      <DataSourceFooter 
        pageName={
          activeSubTab === 'attribution' ? 'Performance Attribution' :
          activeSubTab === 'risk' ? 'Risk & Correlation' : 'Asset Deep-Dive'
        }
        interpretation={
          activeSubTab === 'attribution' ? 'This tab breaks down your portfolio\'s performance relative to a benchmark. It helps you understand if your returns are driven by broad market movements (Beta) or your specific asset selection (Alpha).' :
          activeSubTab === 'risk' ? 'The Risk tab visualizes your portfolio\'s volatility and sensitivity. The Bubble Heatmap shows how assets move together, while the Scatter Plot helps you identify Alpha Generators versus Market Trackers.' :
          'The Deep-Dive tab provides a detailed look at individual asset metrics, including expense ratios, market caps, and historical volatility, allowing for granular security analysis.'
        }
      />
    </div>
  );
}



