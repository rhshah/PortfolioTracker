import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Activity, Loader2, Download, Bot, ExternalLink, FileText, ShieldAlert, Zap, BarChart2 } from 'lucide-react';
import { Button } from './ui/Button';
import { DataSourceFooter } from './DataSourceFooter';
import { ExecutionTCA } from './ExecutionTCA';

interface AnalysisProps {
  report: string | null;
  isAnalyzing: boolean;
  onTabChange?: (tab: string) => void;
}

export function Analysis({ report, isAnalyzing, onTabChange }: AnalysisProps) {
  const [view, setView] = useState<'risk' | 'execution'>('risk');

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'portfolio_analysis.md');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract links for citations
  const citations = React.useMemo(() => {
    if (!report) return [];
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const matches = [...report.matchAll(linkRegex)];
    return matches.map(m => ({ text: m[1], url: m[2] }));
  }, [report]);

  return (
    <div className="terminal-card min-h-[600px] flex flex-col">
      <div className="p-8 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="tech-label text-indigo-400 mb-1">Institutional Intelligence</div>
          <h3 className="text-2xl font-bold font-display tracking-tight flex items-center gap-3">
            <Bot className="h-6 w-6 text-indigo-400" />
            Analysis & Execution
          </h3>
          <p className="text-[10px] text-terminal-muted uppercase font-bold mt-1 tracking-widest">
            Deep-dive risk analysis and transaction cost analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setView('risk')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                view === 'risk' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              Risk Analytics
            </button>
            <button
              onClick={() => setView('execution')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                view === 'execution' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              <BarChart2 className="h-3 w-3" />
              Execution (TCA)
            </button>
          </div>

          {report && view === 'risk' && (
            <Button variant="outline" size="sm" onClick={handleDownload} className="tech-label border-white/10 hover:bg-white/5 gap-2 h-8">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-8 flex-1">
        {view === 'execution' ? (
          <ExecutionTCA onTabChange={onTabChange} />
        ) : isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
              <div className="relative h-20 w-20 rounded-full bg-indigo-600/10 flex items-center justify-center border border-indigo-500/30">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold font-display text-terminal-text tracking-tight">Synthesizing Intelligence...</h3>
              <p className="max-w-xs text-xs text-terminal-muted font-mono leading-relaxed">Cross-referencing holdings with real-time market trends, macro headwinds, and idiosyncratic risk factors.</p>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-12">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-terminal-text prose-p:text-terminal-muted prose-p:leading-relaxed prose-strong:text-terminal-text prose-strong:font-bold prose-code:text-indigo-400 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>

            {citations.length > 0 && (
              <div className="pt-8 border-t border-white/10">
                <h3 className="text-xs font-bold text-terminal-text uppercase tracking-widest mb-6 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Sources & Citations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {citations.map((cite, i) => (
                    <a 
                      key={i} 
                      href={cite.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all group"
                    >
                      <span className="text-[10px] font-bold font-mono text-terminal-muted group-hover:text-terminal-text truncate mr-2 uppercase tracking-tighter">{cite.text}</span>
                      <ExternalLink className="h-3 w-3 text-terminal-muted group-hover:text-indigo-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="h-24 w-24 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10">
              <Bot className="h-12 w-12 text-terminal-muted opacity-30" />
            </div>
            <h3 className="text-2xl font-bold font-display text-terminal-text tracking-tight mb-3">No Analysis Generated</h3>
            <p className="max-w-md text-xs text-terminal-muted font-mono leading-relaxed mb-10">
              Initiate a comprehensive diagnostic to synthesize your portfolio against the "Decoupling Economy" framework. Our AI evaluates your asset allocation using a disciplined 80/20 Core-Satellite methodology.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
              {[
                { title: 'Risk Assessment', desc: 'Identify systematic & idiosyncratic risks', icon: ShieldAlert },
                { title: 'Market Context', desc: 'How macro factors affect your ETFs', icon: Activity },
                { title: 'Optimization', desc: 'Actionable rebalancing suggestions', icon: Zap }
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] text-left hover:border-indigo-500/20 transition-colors">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">{item.title}</h4>
                  <p className="text-[10px] text-terminal-muted leading-relaxed font-mono">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="px-8 pb-8">
        <DataSourceFooter 
          pageName="AI Portfolio Analysis" 
          interpretation="The Analysis tab leverages Gemini 3.1 Pro to synthesize your portfolio data with current market conditions. It provides a narrative interpretation of your risk-reward profile, identifies potential concentration issues, and offers strategic rebalancing suggestions based on institutional-grade financial logic."
        />
      </div>
    </div>
  );
}
