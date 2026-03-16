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
  const { holdingsData, performanceData, etfMetrics, updateData, benchmarks, clearCache, correlationMatrix, riskFreeRate } = useData();
  const [syncState, setSyncState] = useState<SyncState>('idle');
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
  const totalValue = useMemo(() => holdingsData.reduce((sum, item) => sum + item.totalValue, 0), [holdingsData]);
  
  const dailyStats = useMemo(() => {
    if (performanceData.length < 2) return { change: 0, changePct: 0 };
    const last = performanceData[performanceData.length - 1];
    const prev = performanceData[performanceData.length - 2];
    const change = last.value - prev.value;
    const changePct = prev.value > 0 ? (change / prev.value) * 100 : 0;
    return { change, changePct };
  }, [performanceData]);

  const handleSyncMarketData = async (currentHoldings = holdingsData) => {
    setSyncState('fetching');
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
      if (!apiKey) throw new Error('Gemini API key is missing.');
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
You are a Senior Portfolio Manager and Risk Strategist at a top-tier hedge fund. Your task is to provide a BRUTALLY HONEST, institutional-grade analysis of the following ETF portfolio. 

### CRITICAL INSTRUCTIONS:
1. **NO SUGAR COATING**: If an asset is a "laggard" or a "yield trap," say it. If the diversification is an illusion, highlight the "hidden concentration."
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
1. **Executive Summary (The "Bottom Line")**: Start with a "Portfolio Health Score" (0-100).
2. **The "Bear Case" (Stress Test)**: What causes a double-digit drawdown?
3. **Asset-Level Autopsy**: Performance Attribution (Alpha vs Beta).
4. **Correlation & Cluster Risk**: Identify "fake diversifiers."
5. **Actionable Rebalancing (The "Trade Desk")**: Specific % adjustments.

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
      case 'holdings': return <Holdings />;
      case 'benchmark': return <BenchmarkComparison />;
      case 'analysis': return <Analysis report={analysisReport} isAnalyzing={isAnalyzing} />;
      case 'transactions': return <Transactions />;
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
      totalValue={totalValue}
      dailyChange={dailyStats.change}
      dailyChangePct={dailyStats.changePct}
    >
      <div className="animate-slam">
        {renderContent()}
      </div>
    </Layout>
  );
}
