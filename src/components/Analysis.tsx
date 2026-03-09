import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import ReactMarkdown from 'react-markdown';
import { Activity, Loader2 } from 'lucide-react';

interface AnalysisProps {
  report: string | null;
  isSyncing: boolean;
}

export function Analysis({ report, isSyncing }: AnalysisProps) {
  return (
    <Card className="min-h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          AI Portfolio Analysis
        </CardTitle>
        <CardDescription>
          Comprehensive analysis of micro/macro factors, systematic vs idiosyncratic risks, and benchmark comparisons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSyncing ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p>Analyzing market data and portfolio performance...</p>
          </div>
        ) : report ? (
          <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-indigo-600">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <p>Click "Sync Data" to generate a real-time portfolio analysis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
