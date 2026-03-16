import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import ReactMarkdown from 'react-markdown';
import { Activity, Loader2, Download, Bot } from 'lucide-react';
import { Button } from './ui/Button';
import { DataSourceFooter } from './DataSourceFooter';

interface AnalysisProps {
  report: string | null;
  isAnalyzing: boolean;
}

export function Analysis({ report, isAnalyzing }: AnalysisProps) {
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

  return (
    <Card className="min-h-[500px] border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <div>
          <CardTitle className="flex items-center gap-2 font-display">
            <Bot className="h-5 w-5 text-indigo-600" />
            AI Portfolio Insights
          </CardTitle>
          <CardDescription>
            Deep-dive analysis powered by Gemini 3.1 Pro
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {report && (
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2 rounded-full">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-20"></div>
              <div className="relative h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Generating Intelligence...</h3>
              <p className="max-w-xs text-sm">Our AI is currently cross-referencing your holdings with real-time market trends and risk factors.</p>
            </div>
          </div>
        ) : report ? (
          <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-900 prose-headings:tracking-tight">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 text-center">
            <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
              <Bot className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Analysis Generated</h3>
            <p className="max-w-md text-slate-500 mb-8">
              Get a comprehensive breakdown of your portfolio's performance, risk profile, and optimization opportunities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {[
                { title: 'Risk Assessment', desc: 'Identify systematic & idiosyncratic risks' },
                { title: 'Market Context', desc: 'How macro factors affect your ETFs' },
                { title: 'Optimization', desc: 'Actionable rebalancing suggestions' }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-left">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <div className="px-8 pb-8">
        <DataSourceFooter 
          pageName="AI Portfolio Analysis" 
          interpretation="The Analysis tab leverages Gemini 3.1 Pro to synthesize your portfolio data with current market conditions. It provides a narrative interpretation of your risk-reward profile, identifies potential concentration issues, and offers strategic rebalancing suggestions based on institutional-grade financial logic."
        />
      </div>
    </Card>
  );
}
