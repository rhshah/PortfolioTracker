import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';
import { 
  performanceData as initialPerformanceData, 
  benchmarks as initialBenchmarks, 
  metricsData as initialMetricsData, 
  holdingsData as initialHoldingsData, 
  etfMetrics as initialEtfMetrics,
  transactionsData as initialTransactionsData
} from '../data';

import { Transaction } from '../utils/portfolioMath';

export interface Benchmark {
  id: string;
  name: string;
  expenseRatio?: number;
  marketCap?: number;
}

export interface Holding {
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
  realizedGainLoss?: number;
  tcaSlippage?: number;
  tcaImpact?: number;
}

export interface DataContextType {
  performanceData: any[];
  benchmarks: Benchmark[];
  metricsData: any;
  holdingsData: Holding[];
  etfMetrics: Record<string, any>;
  transactionsData: Transaction[];
  allFetchedData: Record<string, any[]>;
  correlationMatrix: any;
  riskFreeRate: number;
  selectedBenchmark: string;
  setSelectedBenchmark: (id: string) => void;
  updateData: (newData: Partial<DataContextType>) => void;
  clearCache: () => void;
  isLoaded: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>(initialBenchmarks[0].id);
  const [data, setData] = useState<Omit<DataContextType, 'updateData' | 'clearCache' | 'isLoaded' | 'selectedBenchmark' | 'setSelectedBenchmark'>>({
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedHoldings = localStorage.getItem('holdingsData');
        const savedTransactions = localStorage.getItem('transactionsData');
        const savedRiskFreeRate = localStorage.getItem('riskFreeRate');
        const savedBenchmarks = localStorage.getItem('benchmarks');
        
        // Load heavy data from IndexedDB
        const savedPerformance = await get('performanceData');
        const savedEtfMetrics = await get('etfMetrics');
        const savedAllFetchedData = await get('allFetchedData');
        const savedCorrelationMatrix = await get('correlationMatrix');
        
        let holdings = savedHoldings ? JSON.parse(savedHoldings) : initialHoldingsData;
        let benchmarks = savedBenchmarks ? JSON.parse(savedBenchmarks) : initialBenchmarks;
        let etfMetrics = savedEtfMetrics ? savedEtfMetrics : initialEtfMetrics;

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

        // Migration: Ensure all initial benchmarks (like AOR) are present if they were added after the user's first visit
        initialBenchmarks.forEach(ib => {
          if (!benchmarks.find((b: any) => b.id === ib.id)) {
            benchmarks.unshift(ib);
          }
        });

        // Migration: Merge new factor data into etfMetrics if missing
        Object.keys(initialEtfMetrics).forEach(symbol => {
          if (!etfMetrics[symbol]) {
            etfMetrics[symbol] = initialEtfMetrics[symbol];
          } else if (!etfMetrics[symbol].factors && initialEtfMetrics[symbol].factors) {
            etfMetrics[symbol].factors = initialEtfMetrics[symbol].factors;
          }
        });

        let performanceData = savedPerformance ? savedPerformance : initialPerformanceData;
        if (performanceData.length > 0 && performanceData[0].AOR === undefined) {
          performanceData = performanceData.map((pd: any) => {
            const initial = initialPerformanceData.find((ipd: any) => ipd.date === pd.date);
            return {
              ...pd,
              AOR: initial ? initial.AOR : (pd.SPY || 1000000)
            };
          });
        }

        setData({
          performanceData,
          benchmarks,
          metricsData: initialMetricsData,
          holdingsData: holdings,
          etfMetrics: etfMetrics,
          transactionsData: savedTransactions ? JSON.parse(savedTransactions) : initialTransactionsData,
          allFetchedData: savedAllFetchedData ? savedAllFetchedData : {},
          correlationMatrix: savedCorrelationMatrix ? savedCorrelationMatrix : { symbols: [], matrix: {} },
          riskFreeRate: savedRiskFreeRate ? parseFloat(savedRiskFreeRate) : 0.02,
        });
      } catch (error) {
        console.error("Failed to load data from storage", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Save data effect
  useEffect(() => {
    if (!isLoaded) return; // Don't save initial state before loading

    localStorage.setItem('holdingsData', JSON.stringify(data.holdingsData));
    localStorage.setItem('transactionsData', JSON.stringify(data.transactionsData));
    localStorage.setItem('riskFreeRate', data.riskFreeRate.toString());
    localStorage.setItem('benchmarks', JSON.stringify(data.benchmarks));
    
    // Save heavy data to IndexedDB
    set('performanceData', data.performanceData).catch(console.error);
    set('etfMetrics', data.etfMetrics).catch(console.error);
    set('allFetchedData', data.allFetchedData).catch(console.error);
    set('correlationMatrix', data.correlationMatrix).catch(console.error);
  }, [data.holdingsData, data.transactionsData, data.performanceData, data.etfMetrics, data.allFetchedData, data.riskFreeRate, data.benchmarks, isLoaded]);

  const updateData = (newData: Partial<DataContextType>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const clearCache = async () => {
    const localKeys = [
      'holdingsData', 
      'transactionsData', 
      'riskFreeRate', 
      'benchmarks',
      'dailySyncCount',
      'dailyReportCount',
      'dailyAnalysisReport',
      'dailyAnalysisSummary',
      'lastSynced'
    ];
    localKeys.forEach(key => localStorage.removeItem(key));
    
    const idbKeys = ['performanceData', 'etfMetrics', 'allFetchedData', 'correlationMatrix'];
    await Promise.all(idbKeys.map(key => del(key)));
    
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
    <DataContext.Provider value={{ ...data, selectedBenchmark, setSelectedBenchmark, updateData, clearCache, isLoaded }}>
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
