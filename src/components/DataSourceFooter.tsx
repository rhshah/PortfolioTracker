import React from 'react';
import { ShieldCheck, Info, ExternalLink } from 'lucide-react';

interface DataSourceFooterProps {
  pageName: string;
  interpretation?: string;
}

export const DataSourceFooter: React.FC<DataSourceFooterProps> = ({ pageName, interpretation }) => {
  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Data Sources & Methodology
          </div>
          <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
            <p>
              <span className="font-medium text-slate-700">Market Data:</span> Real-time and historical pricing, dividends, and corporate actions are sourced via <span className="font-medium">Yahoo Finance API</span>.
            </p>
            <p>
              <span className="font-medium text-slate-700">Risk-Free Rate:</span> Calculations for Sharpe Ratio and Alpha use the <span className="font-medium">13-Week Treasury Bill (^IRX)</span> as the benchmark for risk-free return.
            </p>
            <p>
              <span className="font-medium text-slate-700">Tax Assumptions:</span> Tax impact analysis uses standard individual marginal rates (15% Long-Term, 24% Short-Term) based on <span className="font-medium">Investopedia</span> guidelines.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <Info className="h-4 w-4 text-indigo-500" />
            How to Interpret: {pageName}
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed italic">
            {interpretation || "This page provides a high-level view of your portfolio's current state and performance trends. Use the 'Sync' button to ensure all metrics reflect the latest market close prices."}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
        <span>Last Updated: {new Date().toLocaleDateString()}</span>
        <div className="flex items-center gap-4">
          <a href="https://finance.yahoo.com" target="_blank" rel="noreferrer" className="hover:text-indigo-500 flex items-center gap-1">
            Yahoo Finance <ExternalLink className="h-2 w-2" />
          </a>
          <a href="https://www.investopedia.com" target="_blank" rel="noreferrer" className="hover:text-indigo-500 flex items-center gap-1">
            Investopedia <ExternalLink className="h-2 w-2" />
          </a>
        </div>
      </div>
    </div>
  );
};
