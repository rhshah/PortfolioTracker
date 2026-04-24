import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './Layout';
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
  const { holdingsData, transactionsData, performanceData, etfMetrics, updateData, benchmarks, clearCache, correlationMatrix, riskFreeRate } = useData();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
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

  // Persistence Effects
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

  // Auto-run logic
  const hasAutoRun = React.useRef(false);
  useEffect(() => {
    if (hasAutoRun.current) return;
    hasAutoRun.current = true;

    const runAutoTasks = async () => {
      let latestHoldings = holdingsData;
      if (syncCount === 0) {
        const newHoldings = await handleSyncMarketData(holdingsData);
        if (newHoldings) latestHoldings = newHoldings;
      }
      if (reportCount === 0) {
        await handleGenerateAnalysis(latestHoldings);
      }
    };

    runAutoTasks();
  }, []);

  // Performance Calculations for HUD
  const accountValue = useMemo(() => holdingsData.reduce((sum, item) => sum + item.totalValue, 0), [holdingsData]);
  const cashBalance = useMemo(() => holdingsData.find(h => h.symbol === 'CASH')?.totalValue || 0, [holdingsData]);
  const totalValue = accountValue - cashBalance; // holdings only
  
  const dailyStats = useMemo(() => {
    if (performanceData.length < 2) return { change: 0, changePct: 0 };
    const last = performanceData[performanceData.length - 1];
    const prev = performanceData[performanceData.length - 2];
    const change = last.value - prev.value;
    const changePct = prev.value > 0 ? (change / prev.value) * 100 : 0;
    return { change, changePct };
  }, [performanceData]);

  const overallStats = useMemo(() => {
    const totalCostBasis = holdingsData.reduce((sum, item) => sum + (item.qty * item.purchasePrice), 0);
    const change = accountValue - totalCostBasis;
    const changePct = totalCostBasis > 0 ? (change / totalCostBasis) * 100 : 0;
    return { change, changePct };
  }, [holdingsData, accountValue]);

  const handleSyncMarketData = async (currentHoldings = holdingsData) => {
    console.log(`[Dashboard] Initiating syncMarketData. Current holdings: ${currentHoldings.length}`);
    const syncStartTime = performance.now();
    setSyncState('fetching');
    setSyncError(null);
    try {
      const { newHoldingsData, newPerformanceData, newEtfMetrics, allFetchedData, riskFreeRate, correlationMatrix, enrichedTransactionsData } = await syncRealData(currentHoldings, transactionsData, etfMetrics, benchmarks);
      
      console.log(`[Dashboard] syncRealData completed in ${(performance.now() - syncStartTime).toFixed(0)}ms. Updating context.`);
      
      updateData({
        holdingsData: newHoldingsData,
        performanceData: newPerformanceData,
        etfMetrics: newEtfMetrics,
        allFetchedData: allFetchedData,
        riskFreeRate: riskFreeRate,
        correlationMatrix: correlationMatrix,
        transactionsData: enrichedTransactionsData
      });
      setLastSynced(new Date());
      setSyncCount(prev => prev + 1);
      console.log(`[Dashboard] Context updated successfully. New holdings: ${newHoldingsData.length}`);
      return newHoldingsData;
    } catch (error: any) {
      console.error('[Dashboard] Critical error fetching market data:', error);
      setSyncError(`Sync failed: ${error.message || 'Unknown error. Check console for details.'}`);
      return null;
    } finally {
      setSyncState('idle');
    }
  };

  const handleGenerateAnalysis = async (currentHoldings = holdingsData) => {
    setSyncState('analyzing');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is missing.');
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
You are a Senior Portfolio Manager and Risk Strategist at a top-tier hedge fund. Your task is to provide a BRUTALLY HONEST, institutional-grade analysis of the following ETF portfolio. 

### CRITICAL STRATEGIC FRAMEWORK (2026 Decoupling Economy):
You must evaluate this portfolio through the lens of a modernized "60/40 Portfolio" adapted for a "Decoupling Economy" in 2026 (persistent inflation above 3%, resilient US GDP >2.2%, agentic AI productivity gains, and a cautious Fed easing cycle). 
The ideal implementation uses an **80/20 Core-Satellite structure**:
- **Core (80%)**: Broad-market, low-cost vehicles capturing market beta (e.g., VTI, BND, VXUS, VNQ, GLTR).
- **Satellite (20%)**: Tactical allocations responding to specific 2026 macro signals:
  1. The Warsh Fed Pivot & Yield Curve Steepening (e.g., XFIV for 5-Year duration tilt).
  2. The AI Infrastructure "Gigawatt Ceiling" (e.g., VGT).
  3. Private Credit & Floating-Rate Resilience (e.g., PCMM).
  4. Rare Metals Basket & Silver Catch-Up (e.g., SLV).
Assess if the portfolio strictly maintains this 80% Core / 20% Satellite discipline.

### CRITICAL INSTRUCTIONS:
1. **NO SUGAR COATING**: If an asset is a "laggard" or a "yield trap," say it. Did the investor drift past the 5% threshold? Highlight it.
2. **GROUNDED RESEARCH**: Use the Google Search tool to find news from the LAST 14 DAYS regarding macro and sector headwinds.
3. **STRICT CITATIONS**: Every macro/micro claim MUST be followed by a citation in the format: [Source Name, Date].
4. **CORRELATION ANALYSIS**: Use the provided Correlation Matrix to identify "Cluster Risk."

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
1. **Executive Summary (The "Bottom Line")**: Start with a "Portfolio Health Score" (0-100) and summarize adherence to the 80/20 Core-Satellite discipline. Include a clear note on the timeframe assessed (e.g., "Metrics represent timeframe: [Start Date] - [End Date]").
2. **The "Bear Case" (Stress Test)**: What causes a double-digit drawdown in this decoupling economy?
3. **Asset-Level Autopsy**: Performance Attribution (Alpha vs Beta, Core vs Satellite).
4. **Correlation & Cluster Risk**: Identify "fake diversifiers."
5. **Actionable Rebalancing (The "Trade Desk")**: Specific % adjustments using the 5% drift threshold rule.

Return a JSON object:
{
  "report": "Your full detailed markdown analysis here...",
  "descriptions": { "SYMBOL": "Concise professional description referencing its role in the 80/20 framework" },
  "benchmarkDescriptions": { "BENCHMARK": "Concise professional description" }
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' }
      });
      
      const result = JSON.parse(response.text || '{}');
      const reportText = result.report || 'Analysis could not be generated.';
      const newDescriptions = result.descriptions || {};
      const newBenchmarkDescriptions = result.benchmarkDescriptions || {};
      
      setAnalysisReport(reportText);

      let updatedHoldings = [...currentHoldings];
      if (Object.keys(newDescriptions).length > 0) {
        updatedHoldings = updatedHoldings.map(h => ({
          ...h,
          description: newDescriptions[h.symbol] || h.description
        }));
      }
      
      if (Object.keys(newBenchmarkDescriptions).length > 0) {
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
2. The "Bear Case": The most critical risk factor.
3. The "Immediate Action": The single most important move required right now.

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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <Overview analysisSummary={analysisSummary} isSyncing={isSyncing} onTabChange={setActiveTab} />;
      case 'holdings': return <Holdings onTabChange={setActiveTab} />;
      case 'benchmark': return <BenchmarkComparison onTabChange={setActiveTab} />;
      case 'analysis': return <Analysis report={analysisReport} isAnalyzing={isAnalyzing} onTabChange={setActiveTab} />;
      case 'transactions': return <Transactions onTabChange={setActiveTab} />;
      case 'ai': return <AIAssistant />;
      case 'help': return <Help />;
      default: return <Overview analysisSummary={analysisSummary} isSyncing={isSyncing} onTabChange={setActiveTab} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lastSynced={lastSynced}
      isSyncing={isSyncing}
      onSync={() => handleSyncMarketData()}
      onAnalyze={() => handleGenerateAnalysis()}
      isAnalyzing={isAnalyzing}
      syncError={syncError}
      totalValue={accountValue} // Retaining totalValue prop but passing accountValue instead to avoid refactoring Layout everywhere
      cashBalance={cashBalance}
      dailyChange={dailyStats.change}
      dailyChangePct={dailyStats.changePct}
      overallChange={overallStats.change}
      overallChangePct={overallStats.changePct}
    >
      <div className="animate-slam">
        {renderContent()}
      </div>
    </Layout>
  );
}
