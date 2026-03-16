import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  List, 
  Download, 
  Image as ImageIcon,
  Activity,
  Target,
  Zap
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
    <div className="space-y-8 pb-12">
      {/* Institutional Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-4">
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {[
            { id: 'attribution', label: 'Performance Attribution', icon: TrendingUp },
            { id: 'risk', label: 'Risk & Correlation', icon: ShieldCheck },
            { id: 'deep-dive', label: 'Asset Deep-Dive', icon: List }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg transition-all ${
                activeSubTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-terminal-muted hover:text-terminal-text hover:bg-white/5'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="tech-label text-terminal-muted">Risk-Free Rate:</span>
              <InfoTooltip 
                title="Risk-Free Rate" 
                description="The theoretical return on an investment with zero risk, typically based on 3-month Treasury bills." 
                lookFor="Used as a baseline to calculate excess returns like the Sharpe Ratio."
              />
            </div>
            <span className="tech-value text-indigo-400">{(riskFreeRate * 100).toFixed(2)}%</span>
          </div>
          <Button variant="outline" size="sm" className="tech-label border-white/10 hover:bg-white/5 gap-2">
            <Download className="h-4 w-4" />
            Export Analysis
          </Button>
        </div>
      </div>

      {/* Diagnostic Context Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
            <Activity className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div className="tech-label text-indigo-400">Regime Analysis</div>
            <div className="text-[10px] text-terminal-muted font-mono font-bold uppercase">Alpha-Positive Environment</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-600/20 flex items-center justify-center border border-emerald-500/20">
            <Target className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="tech-label text-emerald-400">Benchmark Tracking</div>
            <div className="text-[10px] text-terminal-muted font-mono font-bold uppercase">Tracking Error: 1.2%</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-600/20 flex items-center justify-center border border-amber-500/20">
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="tech-label text-amber-400">High Conviction</div>
            <div className="text-[10px] text-terminal-muted font-mono font-bold uppercase">Active Share: 68%</div>
          </div>
        </div>
      </div>

      <ErrorBoundary>
        <div className="terminal-card p-8 min-h-[600px]">
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
        </div>
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



