import React, { createContext, useContext, useState } from 'react';
import { 
  performanceData as initialPerformanceData, 
  benchmarks as initialBenchmarks, 
  metricsData as initialMetricsData, 
  holdingsData as initialHoldingsData, 
  etfMetrics as initialEtfMetrics 
} from '../data';

interface DataContextType {
  performanceData: typeof initialPerformanceData;
  benchmarks: typeof initialBenchmarks;
  metricsData: typeof initialMetricsData;
  holdingsData: typeof initialHoldingsData;
  etfMetrics: typeof initialEtfMetrics;
  updateData: (newData: Partial<DataContextType>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState({
    performanceData: initialPerformanceData,
    benchmarks: initialBenchmarks,
    metricsData: initialMetricsData,
    holdingsData: initialHoldingsData,
    etfMetrics: initialEtfMetrics,
  });

  const updateData = (newData: Partial<DataContextType>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  return (
    <DataContext.Provider value={{ ...data, updateData }}>
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
