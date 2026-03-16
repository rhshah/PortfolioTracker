import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Button } from './ui/Button';
import { 
  RefreshCw, 
  LayoutDashboard, 
  List, 
  History, 
  Bot, 
  BarChart2, 
  Activity, 
  HelpCircle, 
  Loader2,
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { Overview } from './Overview';
import { Holdings } from './Holdings';
import { Transactions } from './Transactions';
import { AIAssistant } from './AIAssistant';
import { BenchmarkComparison } from './BenchmarkComparison';
import { Analysis } from './Analysis';
import { Help } from './Help';
import { GoogleGenAI } from '@google/genai';
import { useData } from '../context/DataContext';
import { syncRealData } from '../services/financeApi';

type SyncState = 'idle' | 'fetching' | 'analyzing';

export function Dashboard() {
  const { holdingsData, etfMetrics, updateData, benchmarks, clearCache, correlationMatrix, riskFreeRate } = useData();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  
  const [lastSynced, setLastSynced] = useState<Date | null>(() => {
    const stored = localStorage.getItem('lastSynced');
    return stored ? new Date(stored) : new Date();
  });

  const [syncCount, setSyncCount] = useState<number>(() => {
    const stored = localStorage.getItem('dailySyncCount');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === new Date().toDateString()) return count;
    }
    return 0;
  });

  const [reportCount, setReportCount] = useState<number>(() => {
    const stored = localStorage.getItem('dailyReportCount');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === new Date().toDateString()) return count;
    }
    return 0;
  });

  const [analysisReport, setAnalysisReport] = useState<string | null>(() => {
    const stored = localStorage.getItem('dailyAnalysisReport');
    if (stored) {
      const { date, report } = JSON.parse(stored);
      if (date === new Date().toDateString()) return report;
    }
    return null;
  });

  const [analysisSummary, setAnalysisSummary] = useState<string | null>(() => {
    const stored = localStorage.getItem('dailyAnalysisSummary');
    if (stored) {
      const { date, summary } = JSON.parse(stored);
      if (date === new Date().toDateString()) return summary;
    }
    return null;
  });

  useEffect(() => {
    if (lastSynced) localStorage.setItem('lastSynced', lastSynced.toISOString());
  }, [lastSynced]);

  useEffect(() => {
    localStorage.setItem('dailySyncCount', JSON.stringify({ date: new Date().toDateString(), count: syncCount }));
  }, [syncCount]);

  useEffect(() => {
    localStorage.setItem('dailyReportCount', JSON.stringify({ date: new Date().toDateString(), count: reportCount }));
  }, [reportCount]);

  useEffect(() => {
    if (analysisReport) {
      localStorage.setItem('dailyAnalysisReport', JSON.stringify({ date: new Date().toDateString(), report: analysisReport }));
    }
  }, [analysisReport]);

  useEffect(() => {
    if (analysisSummary) {
      localStorage.setItem('dailyAnalysisSummary', JSON.stringify({ date: new Date().toDateString(), summary: analysisSummary }));
    }
  }, [analysisSummary]);

  const hasAutoRun = React.useRef(false);

  useEffect(() => {
    if (hasAutoRun.current) return;
    hasAutoRun.current = true;

    const runAutoTasks = async () => {
      let latestHoldings = holdingsData;
      
      if (syncCount === 0) {
        const newHoldings = await handleSyncMarketData(holdingsData);
        if (newHoldings) {
          latestHoldings = newHoldings;
        }
      }

      if (reportCount === 0) {
        await handleGenerateAnalysis(latestHoldings);
      }
    };

    runAutoTasks();
  }, []); // Run once on mount

  const handleSyncMarketData = async (currentHoldings = holdingsData) => {
    setSyncState('fetching');
    // Clear cache to ensure fresh data and avoid stale state interference
    clearCache();
    
    try {
      const { newHoldingsData, newPerformanceData, newEtfMetrics, allFetchedData, riskFreeRate, correlationMatrix } = await syncRealData(currentHoldings, etfMetrics, benchmarks);
      
      updateData({
        holdingsData: newHoldingsData,
        performanceData: newPerformanceData,
        etfMetrics: newEtfMetrics,
        allFetchedData: allFetchedData,
        riskFreeRate: riskFreeRate,
        correlationMatrix: correlationMatrix
      });
      
      setLastSynced(new Date());
      setSyncCount(prev => prev + 1);
      return newHoldingsData;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    } finally {
      setSyncState('idle');
    }
  };

  const handleGenerateAnalysis = async (currentHoldings = holdingsData) => {
    setSyncState('analyzing');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
You are a Senior Portfolio Manager and Risk Strategist at a top-tier hedge fund. Your task is to provide a BRUTALLY HONEST, institutional-grade analysis of the following ETF portfolio. 

### CRITICAL INSTRUCTIONS:
1. **NO SUGAR COATING**: If an asset is a "laggard" or a "yield trap," say it. If the diversification is an illusion, highlight the "hidden concentration."
2. **GROUNDED RESEARCH**: Use the Google Search tool to find news from the LAST 14 DAYS regarding:
    - Federal Reserve policy shifts (Macro).
    - Specific sector headwinds for Tech (VGT), Real Estate (VNQ), and Bonds (AGG/BND).
    - Geopolitical risks affecting International Equities (VXUS).
3. **STRICT CITATIONS**: Every macro/micro claim MUST be followed by a citation in the format: [Source Name, Date].
4. **CORRELATION ANALYSIS**: Use the provided Correlation Matrix to identify "Cluster Risk." If assets that should be uncorrelated are moving together, flag it as a critical failure of the current strategy.

### PORTFOLIO DATA:
- **Holdings**: ${JSON.stringify(currentHoldings.map(h => ({
  symbol: h.symbol,
  assetClass: h.assetClass,
  unrealizedGainLoss: h.totalGainLoss,
  weight: ((h.totalValue / currentHoldings.reduce((sum, x) => sum + x.totalValue, 0)) * 100).toFixed(2) + '%',
  metrics: etfMetrics[h.symbol]
})), null, 2)}
- **Correlation Matrix**: ${JSON.stringify(correlationMatrix)}
- **Risk-Free Rate**: ${(riskFreeRate * 100).toFixed(2)}%

### REQUIRED OUTPUT STRUCTURE (Markdown):
1. **Executive Summary (The "Bottom Line")**: Start with a "Portfolio Health Score" (0-100). Be blunt about the primary threat to capital preservation.
2. **The "Bear Case" (Stress Test)**: What is the single most likely event that causes a double-digit drawdown in this specific mix?
3. **Asset-Level Autopsy**: For each major holding:
    - Performance Attribution: Is the return driven by "Beta" (lucky market lift) or "Alpha" (actual strategy edge)?
    - Recent Headwinds: Cite specific news [Source, Date] that threatens this ticker.
4. **Correlation & Cluster Risk**: Identify which assets are "fake diversifiers."
5. **Actionable Rebalancing (The "Trade Desk")**: Provide specific % adjustments. If an asset should be cut, provide the "Exit Price" logic.

### Output Format:
Return a JSON object:
{
  "report": "Your full detailed markdown analysis here...",
  "descriptions": { "SYMBOL": "Concise professional description" },
  "benchmarkDescriptions": { "BENCHMARK": "Concise professional description" }
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json'
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      const reportText = result.report || 'Analysis could not be generated.';
      const newDescriptions = result.descriptions || {};
      const newBenchmarkDescriptions = result.benchmarkDescriptions || {};
      
      setAnalysisReport(reportText);

      // Update holdings with new descriptions if they were generated
      let updatedHoldings = [...currentHoldings];
      if (Object.keys(newDescriptions).length > 0) {
        updatedHoldings = updatedHoldings.map(h => ({
          ...h,
          description: newDescriptions[h.symbol] || h.description
        }));
      }
      
      // Store benchmark descriptions in local storage or state if needed
      // For now, let's just update the holdings data if we want to persist them
      // But benchmarks are usually global. We might need to update the benchmarks array in context.
      
      if (Object.keys(newBenchmarkDescriptions).length > 0) {
        // Get all unique benchmark IDs from current holdings and existing benchmarks
        const allBenchmarkIds = Array.from(new Set([
          ...benchmarks.map(b => b.id),
          ...currentHoldings.map(h => h.benchmark)
        ]));

        const updatedBenchmarks = allBenchmarkIds.map(id => {
          const existing = benchmarks.find(b => b.id === id);
          return {
            id,
            name: existing?.name || id,
            description: newBenchmarkDescriptions[id] || (existing as any)?.description
          };
        });
        
        updateData({ holdingsData: updatedHoldings, benchmarks: updatedBenchmarks });
      } else {
        updateData({ holdingsData: updatedHoldings });
      }

      if (reportText !== 'Analysis could not be generated.') {
        const summaryPrompt = `
As a Senior Portfolio Manager, provide a 2-3 paragraph "Risk Alert" Executive Summary based on the following analysis. 
Focus on:
1. The "Bottom Line": A blunt assessment of current portfolio health.
2. The "Bear Case": The most critical risk factor that could lead to a significant drawdown.
3. The "Immediate Action": The single most important rebalancing or defensive move required right now.

Analysis:
${reportText}`;
        const summaryResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: summaryPrompt,
        });
        setAnalysisSummary(summaryResponse.text || 'Summary could not be generated.');
      }
      setReportCount(prev => prev + 1);
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      setAnalysisReport(`An error occurred: ${error.message || 'Please check your API key and try again.'}`);
      setAnalysisSummary(null);
    } finally {
      setSyncState('idle');
    }
  };

  const isSyncing = syncState === 'fetching';
  const isAnalyzing = syncState === 'analyzing';
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Activity className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">ETF<span className="text-indigo-600">Pulse</span></h1>
            </div>
            
            <div className="hidden md:flex relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search holdings..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Last Synced</span>
              <span className="text-xs font-medium text-slate-600 leading-none">{lastSynced ? lastSynced.toLocaleTimeString() : 'Never'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleSyncMarketData()} 
                disabled={isSyncing} 
                variant="outline" 
                size="sm"
                className="hidden sm:flex gap-2 rounded-full border-slate-200 hover:bg-slate-50 h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
              
              <Button 
                onClick={() => handleGenerateAnalysis()} 
                disabled={isAnalyzing} 
                variant="default" 
                size="sm"
                className="gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 h-9 px-4"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
            
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-2 border-l border-slate-200 sm:border-none hover:bg-slate-50 p-1 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 shadow-sm">
                  JD
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 hidden sm:block transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] py-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">John Doe</p>
                    <p className="text-[10px] text-slate-500">Premium Account</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <User className="h-4 w-4" /> Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Security
                  </button>
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full">
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="bg-white p-1 border border-slate-200 rounded-xl shadow-sm inline-flex shrink-0">
              <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200">
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="holdings" className="gap-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200">
                <List className="h-4 w-4" />
                <span>Holdings</span>
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="gap-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200">
                <BarChart2 className="h-4 w-4" />
                <span>Benchmark</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200">
                <Activity className="h-4 w-4" />
                <span>Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200">
                <History className="h-4 w-4" />
                <span>History</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200">
                <Bot className="h-4 w-4" />
                <span>AI Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="help" className="gap-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200">
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
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
            <Analysis 
              report={analysisReport} 
              isAnalyzing={isAnalyzing} 
            />
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
          <TabsContent value="help">
            <Help />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-slate-500">
            Developed by Ronak Shah using Google AI Studio
          </p>
        </div>
      </footer>
    </div>
  );
}
