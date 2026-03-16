import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  performanceData as initialPerformanceData, 
  benchmarks as initialBenchmarks, 
  metricsData as initialMetricsData, 
  holdingsData as initialHoldingsData, 
  etfMetrics as initialEtfMetrics,
  transactionsData as initialTransactionsData
} from '../data';

interface Benchmark {
  id: string;
  name: string;
  expenseRatio?: number;
  marketCap?: number;
}

interface Holding {
  symbol: string;
  description: string;
  currentPrice: number;
  purchasePrice: number;
  qty: number;
  totalValue: number;
  totalGainLoss: number;
  assetClass: string;
  benchmark: string;
  expenseRatio?: number;
  marketCap?: number;
}

interface DataContextType {
  performanceData: any[];
  benchmarks: Benchmark[];
  metricsData: any;
  holdingsData: Holding[];
  etfMetrics: Record<string, any>;
  transactionsData: any[];
  allFetchedData: Record<string, any[]>;
  correlationMatrix: any;
  riskFreeRate: number;
  updateData: (newData: Partial<DataContextType>) => void;
  clearCache: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Omit<DataContextType, 'updateData' | 'clearCache'>>(() => {
    const savedHoldings = localStorage.getItem('holdingsData');
    const savedTransactions = localStorage.getItem('transactionsData');
    const savedPerformance = localStorage.getItem('performanceData');
    const savedEtfMetrics = localStorage.getItem('etfMetrics');
    const savedAllFetchedData = localStorage.getItem('allFetchedData');
    const savedCorrelationMatrix = localStorage.getItem('correlationMatrix');
    const savedRiskFreeRate = localStorage.getItem('riskFreeRate');
    const savedBenchmarks = localStorage.getItem('benchmarks');
    
    let holdings = savedHoldings ? JSON.parse(savedHoldings) : initialHoldingsData;
    let benchmarks = savedBenchmarks ? JSON.parse(savedBenchmarks) : initialBenchmarks;
    let etfMetrics = savedEtfMetrics ? JSON.parse(savedEtfMetrics) : initialEtfMetrics;

    // Migration: Ensure expenseRatio and marketCap are present if missing or zero in saved data for known items
    holdings = holdings.map((h: any) => {
      const initial = initialHoldingsData.find((ih: any) => ih.symbol === h.symbol);
      const updated = { ...h };
      if (h.expenseRatio === undefined || h.expenseRatio === null || (h.expenseRatio === 0 && initial?.expenseRatio)) {
        updated.expenseRatio = initial?.expenseRatio ?? 0;
      }
      if (h.marketCap === undefined || h.marketCap === null || (h.marketCap === 0 && initial?.marketCap)) {
        updated.marketCap = initial?.marketCap ?? 0;
      }
      return updated;
    });

    benchmarks = benchmarks.map((b: any) => {
      const initial = initialBenchmarks.find((ib: any) => ib.id === b.id);
      const updated = { ...b };
      if (b.expenseRatio === undefined || b.expenseRatio === null || (b.expenseRatio === 0 && initial?.expenseRatio)) {
        updated.expenseRatio = initial?.expenseRatio ?? 0;
      }
      if (b.marketCap === undefined || b.marketCap === null || (b.marketCap === 0 && initial?.marketCap)) {
        updated.marketCap = initial?.marketCap ?? 0;
      }
      return updated;
    });

    // Migration: Merge new factor data into etfMetrics if missing
    Object.keys(initialEtfMetrics).forEach(symbol => {
      if (!etfMetrics[symbol]) {
        etfMetrics[symbol] = initialEtfMetrics[symbol];
      } else if (!etfMetrics[symbol].factors && initialEtfMetrics[symbol].factors) {
        etfMetrics[symbol].factors = initialEtfMetrics[symbol].factors;
      }
    });

    return {
      performanceData: savedPerformance ? JSON.parse(savedPerformance) : initialPerformanceData,
      benchmarks,
      metricsData: initialMetricsData,
      holdingsData: holdings,
      etfMetrics: etfMetrics,
      transactionsData: savedTransactions ? JSON.parse(savedTransactions) : initialTransactionsData,
      allFetchedData: savedAllFetchedData ? JSON.parse(savedAllFetchedData) : {},
      correlationMatrix: savedCorrelationMatrix ? JSON.parse(savedCorrelationMatrix) : { symbols: [], matrix: {} },
      riskFreeRate: savedRiskFreeRate ? parseFloat(savedRiskFreeRate) : 0.02,
    };
  });

  useEffect(() => {
    localStorage.setItem('holdingsData', JSON.stringify(data.holdingsData));
    localStorage.setItem('transactionsData', JSON.stringify(data.transactionsData));
    localStorage.setItem('performanceData', JSON.stringify(data.performanceData));
    localStorage.setItem('etfMetrics', JSON.stringify(data.etfMetrics));
    localStorage.setItem('allFetchedData', JSON.stringify(data.allFetchedData));
    localStorage.setItem('correlationMatrix', JSON.stringify(data.correlationMatrix));
    localStorage.setItem('riskFreeRate', data.riskFreeRate.toString());
    localStorage.setItem('benchmarks', JSON.stringify(data.benchmarks));
  }, [data.holdingsData, data.transactionsData, data.performanceData, data.etfMetrics, data.allFetchedData, data.riskFreeRate, data.benchmarks]);

  const updateData = (newData: Partial<DataContextType>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const clearCache = () => {
    const keys = [
      'holdingsData', 
      'transactionsData', 
      'performanceData', 
      'etfMetrics', 
      'allFetchedData', 
      'correlationMatrix', 
      'riskFreeRate', 
      'benchmarks',
      'dailySyncCount',
      'dailyReportCount',
      'dailyAnalysisReport',
      'dailyAnalysisSummary',
      'lastSynced'
    ];
    keys.forEach(key => localStorage.removeItem(key));
    
    // Reset state to initial
    setData({
      performanceData: initialPerformanceData,
      benchmarks: initialBenchmarks,
      metricsData: initialMetricsData,
      holdingsData: initialHoldingsData,
      etfMetrics: initialEtfMetrics,
      transactionsData: initialTransactionsData,
      allFetchedData: {},
      correlationMatrix: { symbols: [], matrix: {} },
      riskFreeRate: 0.02,
    });
  };

  return (
    <DataContext.Provider value={{ ...data, updateData, clearCache }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
