import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Button } from './ui/Button';
import { RefreshCw, LayoutDashboard, List, History, Bot, BarChart2, Activity } from 'lucide-react';
import { Overview } from './Overview';
import { Holdings } from './Holdings';
import { Transactions } from './Transactions';
import { AIAssistant } from './AIAssistant';
import { BenchmarkComparison } from './BenchmarkComparison';
import { Analysis } from './Analysis';
import { GoogleGenAI } from '@google/genai';
import { useData } from '../context/DataContext';
import { syncRealData } from '../services/financeApi';

export function Dashboard() {
  const { holdingsData, etfMetrics, updateData } = useData();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch real market data
      const { newHoldingsData, newPerformanceData } = await syncRealData(holdingsData);
      
      // Update global context with real data
      updateData({
        holdingsData: newHoldingsData,
        performanceData: newPerformanceData
      });

      // 2. Generate AI Analysis using the updated real data
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
You are an expert financial analyst. Please analyze the following ETF portfolio based on current real-world micro and macroeconomic factors. 

For each ETF in the portfolio:
1. Explain why it is performing the way it is recently.
2. Identify whether its performance is primarily driven by market (systematic) risk or idiosyncratic (asset-specific) risk.
3. Consider and mention its performance relative to its specified benchmark.

Here is the updated real-time portfolio data:
${JSON.stringify(newHoldingsData.map(h => ({
  symbol: h.symbol,
  description: h.description,
  assetClass: h.assetClass,
  benchmark: h.benchmark,
  currentPrice: h.currentPrice,
  totalGainLoss: h.totalGainLoss,
  metrics: etfMetrics[h.symbol]
})), null, 2)}

Format the output in clean Markdown with clear headings for each ETF.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      
      const reportText = response.text || 'Analysis could not be generated.';
      setAnalysisReport(reportText);

      if (reportText !== 'Analysis could not be generated.') {
        const summaryPrompt = `Based on the following detailed ETF portfolio analysis, provide a concise 2-3 paragraph executive summary of the overall portfolio performance, key drivers, and main risks.\n\nAnalysis:\n${reportText}`;
        const summaryResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: summaryPrompt,
        });
        setAnalysisSummary(summaryResponse.text || 'Summary could not be generated.');
      }
      
      setLastSynced(new Date());
    } catch (error) {
      console.error('Error generating analysis:', error);
      setAnalysisReport('An error occurred while generating the analysis. Please check your API key and try again.');
      setAnalysisSummary(null);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">ETF Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 hidden sm:block">
              {lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : 'Not synced'}
            </div>
            <Button onClick={handleSync} disabled={isSyncing} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            <TabsList className="bg-slate-200/50 p-1 shrink-0">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="gap-2">
                <BarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">Benchmark</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="holdings" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Holdings</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Transactions</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">AI Assistant</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <Overview analysisSummary={analysisSummary} isSyncing={isSyncing} />
          </TabsContent>
          <TabsContent value="benchmark">
            <BenchmarkComparison />
          </TabsContent>
          <TabsContent value="analysis">
            <Analysis report={analysisReport} isSyncing={isSyncing} />
          </TabsContent>
          <TabsContent value="holdings">
            <Holdings />
          </TabsContent>
          <TabsContent value="transactions">
            <Transactions />
          </TabsContent>
          <TabsContent value="ai">
            <AIAssistant />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
