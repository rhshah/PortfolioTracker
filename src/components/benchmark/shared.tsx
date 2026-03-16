import React, { useState } from 'react';
import { HelpCircle, ArrowUpDown } from 'lucide-react';

export const METRIC_INFO: Record<string, { description: string, lookFor: string }> = {
  '1M Return': {
    description: 'Percentage change in value over the last 30 days.',
    lookFor: 'Positive values indicate growth; compare against benchmark to see relative strength.'
  },
  'Volatility (Ann.)': {
    description: 'Annualized standard deviation of returns. Measures how much the price fluctuates.',
    lookFor: 'Lower values indicate more stability. High volatility means higher risk.'
  },
  'Sharpe Ratio': {
    description: 'Risk-adjusted return. Measures excess return per unit of volatility.',
    lookFor: 'Higher is better. >1.0 is good, >2.0 is very good, >3.0 is excellent.'
  },
  'Sortino Ratio': {
    description: 'Similar to Sharpe, but only considers "downside" volatility.',
    lookFor: 'Higher is better. Useful for portfolios with non-normal return distributions.'
  },
  'Max Drawdown': {
    description: 'The largest peak-to-trough decline in portfolio value.',
    lookFor: 'Smaller (less negative) is better. Indicates the "worst case" historical loss.'
  },
  'Alpha (Ann.)': {
    description: 'The "active" return on an investment compared to a benchmark.',
    lookFor: 'Positive alpha means the portfolio outperformed the benchmark on a risk-adjusted basis.'
  },
  'Beta': {
    description: 'Sensitivity to market movements. 1.0 means it moves with the market.',
    lookFor: 'Beta > 1.0 is more aggressive; Beta < 1.0 is more defensive.'
  },
  'Tracking Error': {
    description: 'The standard deviation of the difference between portfolio and benchmark returns.',
    lookFor: 'Lower values mean the portfolio closely follows the benchmark.'
  },
  'VaR (95%)': {
    description: 'Value at Risk. The maximum expected loss over a day with 95% confidence.',
    lookFor: 'Lower is better. Helps set expectations for daily "normal" bad days.'
  },
  'Information Ratio': {
    description: 'Consistency of active return. Alpha divided by tracking error.',
    lookFor: 'Higher is better. Measures the skill of the manager relative to the benchmark.'
  },
  'Treynor Ratio': {
    description: 'Return per unit of systematic risk (Beta).',
    lookFor: 'Higher is better. Useful for diversified portfolios.'
  },
  'Dividend Yield': {
    description: 'The annual dividend payment as a percentage of the current price.',
    lookFor: 'Higher yields provide more income. Compare against benchmark to see income tilt.'
  },
  'Correlation to Benchmark': {
    description: 'Measures how closely the asset price moves in relation to the benchmark.',
    lookFor: '1.0 means perfect correlation. Lower correlation provides better diversification.'
  },
  'Symbol': {
    description: 'The unique ticker symbol for the ETF.',
    lookFor: 'Used to identify the specific fund.'
  },
  'Asset Class': {
    description: 'The category of investment (e.g., Equity, Fixed Income).',
    lookFor: 'Diversifying across asset classes reduces overall portfolio risk.'
  },
  'Market Cap': {
    description: 'Total market value of all outstanding shares.',
    lookFor: 'Large cap (> $10B) is generally more stable; Small cap (< $2B) has higher growth potential.'
  },
  'Expense Ratio': {
    description: 'The annual fee charged by the ETF to cover operating expenses.',
    lookFor: 'Lower is better. High fees eat into long-term returns.'
  }
};

export const InfoTooltip = ({ title, description, lookFor }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1">
      <button 
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-terminal-muted hover:text-indigo-400 transition-colors focus:outline-none align-middle"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-[#151921] border border-white/10 text-white text-[10px] rounded-xl shadow-2xl z-50 pointer-events-none">
          <p className="font-mono font-bold mb-1 text-indigo-400 uppercase tracking-widest">{title}</p>
          <p className="mb-2 text-terminal-muted leading-relaxed">{description}</p>
          {lookFor && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-indigo-400 font-mono font-bold uppercase tracking-tighter mb-1">Diagnostic Context:</p>
              <p className="text-terminal-muted italic">{lookFor}</p>
            </div>
          )}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#151921] border-r border-b border-white/10 rotate-45" />
        </div>
      )}
    </div>
  );
};

export const MetricRow = ({ label, portValue, benchValue, isPercentage = false, inverseGood = false, formatter }: any) => {
  const diff = portValue - benchValue;
  const isPositive = inverseGood ? diff < 0 : diff > 0;
  const info = METRIC_INFO[label];
  const [showInfo, setShowInfo] = useState(false);
  
  const formatValue = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    if (formatter) return formatter(val);
    return `${val.toFixed(2)}${isPercentage ? '%' : ''}`;
  };
  
  return (
    <div className="py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-4 -mx-4 rounded-xl">
      <div className="flex items-center justify-between group relative">
        <div className="flex items-center gap-2">
          <span className="tech-label text-terminal-muted">{label}</span>
          {info && (
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="text-terminal-muted hover:text-indigo-400 transition-colors focus:outline-none"
              title="Click for info"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-8 text-xs">
          <div className="flex flex-col items-end w-24">
            <span className={`tech-value ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatValue(portValue)}
            </span>
            <span className="text-[9px] text-terminal-muted uppercase font-mono font-bold tracking-tighter">Portfolio</span>
          </div>
          <div className="flex flex-col items-end w-24">
            <span className="tech-value text-terminal-text">
              {formatValue(benchValue)}
            </span>
            <span className="text-[9px] text-terminal-muted uppercase font-mono font-bold tracking-tighter">Benchmark</span>
          </div>
          <div className="flex flex-col items-end w-24">
            <span className={`tech-value ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : '-'}{formatValue(Math.abs(diff))}
            </span>
            <span className="text-[9px] text-terminal-muted uppercase font-mono font-bold tracking-tighter">Variance</span>
          </div>
        </div>
      </div>
      {showInfo && info && (
        <div className="mt-3 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-[11px] text-terminal-muted animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="font-mono font-bold mb-1 text-indigo-400 uppercase">{label}</p>
          <p className="mb-2 opacity-80">{info.description}</p>
          <div className="pt-2 border-t border-white/10">
            <span className="font-mono font-bold text-indigo-400 uppercase">Analysis: </span>
            {info.lookFor}
          </div>
        </div>
      )}
    </div>
  );
};

export const VisualMetricCell = ({ value, min, max, target, isPercentage = false, inverse = false }: { value: number | undefined | null, min: number, max: number, target?: number, isPercentage?: boolean, inverse?: boolean }) => {
  const safeValue = (value === undefined || value === null || isNaN(value)) ? 0 : value;
  const isAvailable = value !== undefined && value !== null && !isNaN(value);
  
  const range = max - min;
  const percentage = ((safeValue - min) / range) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  let colorClass = 'bg-terminal-muted';
  if (isAvailable && target !== undefined) {
    const isGood = inverse ? safeValue < target : safeValue > target;
    colorClass = isGood ? 'bg-emerald-500' : 'bg-rose-500';
  } else if (isAvailable) {
    if (safeValue > 0) colorClass = 'bg-emerald-500';
    else if (safeValue < 0) colorClass = 'bg-rose-500';
  }

  return (
    <td className="px-4 py-3 text-right">
      <div className="flex flex-col items-end gap-1">
        <span className={`tech-value ${!isAvailable ? 'text-terminal-muted' : safeValue > 0 ? 'text-emerald-400' : safeValue < 0 ? 'text-rose-400' : 'text-terminal-text'}`}>
          {!isAvailable ? 'N/A' : `${safeValue > 0 ? '+' : ''}${safeValue.toFixed(2)}${isPercentage ? '%' : ''}`}
        </span>
        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.5)]`} 
            style={{ width: `${isAvailable ? clampedPercentage : 0}%` }} 
          />
        </div>
      </div>
    </td>
  );
};

export const TableHeaderWithTooltip = ({ label, metricKey, sortKey, currentSortField, onSort }: { label: string, metricKey?: string, sortKey?: string, currentSortField: string, onSort: (key: any) => void }) => {
  const info = metricKey ? METRIC_INFO[metricKey] : null;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <th 
      className={`px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-terminal-muted group/header relative ${sortKey ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
      onClick={() => sortKey && onSort(sortKey)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {sortKey && <ArrowUpDown className={`h-3 w-3 ${currentSortField === sortKey ? 'text-indigo-400' : 'text-terminal-muted/30'}`} />}
        {info && (
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(!showInfo);
              }}
              className="text-terminal-muted/50 hover:text-indigo-400 focus:outline-none"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
            {showInfo && (
              <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-slate-900 border border-white/10 text-white text-[10px] rounded-xl shadow-2xl z-50 normal-case font-normal animate-in fade-in zoom-in-95 duration-150">
                <p className="font-mono font-bold mb-1 text-indigo-400 uppercase tracking-widest">{label}</p>
                <p className="mb-2 text-terminal-muted leading-relaxed">{info.description}</p>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-indigo-400 font-mono font-bold uppercase tracking-tighter mb-1">Diagnostic Context:</p>
                  <p className="text-terminal-muted italic">{info.lookFor}</p>
                </div>
                <button 
                  className="absolute top-2 right-2 text-terminal-muted hover:text-white"
                  onClick={() => setShowInfo(false)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </th>
  );
};

export const TableHeaderWithTooltipRight = ({ label, metricKey, sortKey, currentSortField, onSort }: { label: string, metricKey?: string, sortKey?: string, currentSortField: string, onSort: (key: any) => void }) => {
  const info = metricKey ? METRIC_INFO[metricKey] : null;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <th 
      className={`px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-terminal-muted text-right group/header relative ${sortKey ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
      onClick={() => sortKey && onSort(sortKey)}
    >
      <div className="flex items-center justify-end gap-1.5">
        {label}
        {sortKey && <ArrowUpDown className={`h-3 w-3 ${currentSortField === sortKey ? 'text-indigo-400' : 'text-terminal-muted/30'}`} />}
        {info && (
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(!showInfo);
              }}
              className="text-terminal-muted/50 hover:text-indigo-400 focus:outline-none"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
            {showInfo && (
              <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-slate-900 border border-white/10 text-white text-[10px] rounded-xl shadow-2xl z-50 normal-case font-normal animate-in fade-in zoom-in-95 duration-150">
                <p className="font-mono font-bold mb-1 text-indigo-400 uppercase tracking-widest">{label}</p>
                <p className="mb-2 text-terminal-muted leading-relaxed">{info.description}</p>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-indigo-400 font-mono font-bold uppercase tracking-tighter mb-1">Diagnostic Context:</p>
                  <p className="text-terminal-muted italic">{info.lookFor}</p>
                </div>
                <button 
                  className="absolute top-2 right-2 text-terminal-muted hover:text-white"
                  onClick={() => setShowInfo(false)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </th>
  );
};
