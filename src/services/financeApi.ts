import { format, subYears, parseISO } from 'date-fns';
import { calculateHoldingsFromTransactions, Transaction, enrichTransactionWithTCA } from '../utils/portfolioMath';
import { Holding } from '../context/DataContext';
import { 
  alignTimeSeries,
  calculateLogReturns,
  calculateVolatility, 
  calculateSharpeRatio, 
  calculateMaxDrawdown, 
  calculateBeta, 
  calculateAlpha, 
  calculateCorrelation, 
  calculateTrackingError, 
  calculateReturn1M,
  calculateSortinoRatio,
  calculateTreynorRatio,
  calculateInformationRatio,
  calculateVaR,
  calculateParametricVaR,
  calculateCVaR
} from '../utils/financeMath';

export async function fetchETFData(symbol: string) {
  try {
    // Use a consistent start date for everyone (5 years ago from the start of the current year)
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear - 5}-01-01`;
    const response = await fetch(`/api/finance/history?symbol=${symbol}&period1=${startDate}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch data for ${symbol}: ${errData.error || response.statusText || response.status}`);
    }
    const data = await response.json();
    
    const mappedData = data.map((d: any) => ({
      date: new Date(d.date).toISOString().split('T')[0],
      price: d.adjClose || d.close,
      open: d.open || d.close,
      high: d.high || d.close,
      low: d.low || d.close,
      close: d.close,
      volume: d.volume || 0
    }))
    .filter((d: any) => d.price !== null && d.price !== undefined)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Deduplicate by date (keep the last entry for each date)
    const uniqueData = [];
    let lastDate = '';
    for (const d of mappedData) {
      if (d.date !== lastDate) {
        uniqueData.push(d);
        lastDate = d.date;
      } else {
        uniqueData[uniqueData.length - 1] = d;
      }
    }
    
    return uniqueData;
  } catch (error) {
    console.error(`Backend fetch failed for ${symbol}:`, error);
    return [];
  }
}

export async function syncRealData(currentHoldings: Holding[], transactionsData: Transaction[], existingEtfMetrics: Record<string, any> = {}, benchmarks: any[] = []) {
  // 1. Fetch data for all holdings + all benchmarks + factor benchmarks + ^IRX (Risk-Free Rate)
  const holdingBenchmarkSymbols = Array.from(new Set(currentHoldings.map(h => h.benchmark)));
  const explicitBenchmarkSymbols = benchmarks.map(b => b.id);
  const factorSymbols = ['VTV', 'IWM']; 
  const symbols = Array.from(new Set([
    ...currentHoldings.map(h => h.symbol), 
    ...transactionsData.map(t => t.symbol), // Ensure we fetch data for all transacted symbols too
    ...holdingBenchmarkSymbols, 
    ...explicitBenchmarkSymbols,
    ...factorSymbols, 
    'SPY', 'BND', '^IRX'
  ]));
  const fetchedData: Record<string, any[]> = {};
  
  const fetchPromises = symbols.map(async (symbol) => {
    fetchedData[symbol] = await fetchETFData(symbol);
  });
  
  await Promise.all(fetchPromises);
  
  // 2. Align dates based on SPY
  const spyData = fetchedData['SPY'];
  const bndData = fetchedData['BND'];
  const valueData = fetchedData['VTV'];
  const sizeData = fetchedData['IWM'];
  const irxData = fetchedData['^IRX'];

  if (!spyData || spyData.length === 0) {
    throw new Error("Failed to fetch market data from the backend API. Yahoo Finance might be temporarily unavailable.");
  }

  // Get current risk-free rate from ^IRX (13-week T-Bill yield)
  // ^IRX price is the yield in percentage points (e.g. 5.25 means 5.25%)
  const latestIrx = irxData && irxData.length > 0 ? irxData[irxData.length - 1].price : 4.0;
  const riskFreeRate = latestIrx / 100;
  
  const newPerformanceData = [];
  let currentPortfolioValue = 0;
  
  // Extract current prices for all symbols
  const currentPrices: Record<string, number> = {};
  symbols.forEach(sym => {
    const history = fetchedData[sym];
    if (history && history.length > 0) {
      currentPrices[sym] = history[history.length - 1].price;
    } else {
      console.warn(`[syncRealData] No price history found for symbol: ${sym}`);
    }
  });

  console.log(`[syncRealData] Current Prices:`, currentPrices);

  // Enrich transactions with TCA metrics using historical data
  const enrichedTransactions = transactionsData.map(tx => {
    const history = fetchedData[tx.symbol];
    return enrichTransactionWithTCA(tx, history || []);
  });

  console.log(`[syncRealData] Calculating holdings from ${enrichedTransactions.length} transactions...`);
  // Calculate Holdings from Transactions
  const newHoldingsData = calculateHoldingsFromTransactions(enrichedTransactions, currentHoldings, currentPrices);
  console.log(`[syncRealData] Calculated ${newHoldingsData.length} active holdings.`);
  
  const debugTotalValue = newHoldingsData.reduce((sum, h) => sum + h.totalValue, 0);
  console.log(`[syncRealData] DEBUG Total Value:`, debugTotalValue);
  
  // Calculate real metrics for each ETF
  const newEtfMetrics: Record<string, any> = {};
  for (const holding of newHoldingsData) {
    const etfHistory = fetchedData[holding.symbol];
    const benchHistory = fetchedData[holding.benchmark];
    
    if (etfHistory && benchHistory && etfHistory.length > 0 && benchHistory.length > 0) {
      // 1. Align data for primary metrics (Asset vs Benchmark)
      const { alignedPrices: primaryAligned } = alignTimeSeries(fetchedData, [holding.symbol, holding.benchmark]);
      const etfPrices = primaryAligned[holding.symbol].slice(-252);
      const benchPrices = primaryAligned[holding.benchmark].slice(-252);
      
      const etfReturns = calculateLogReturns(etfPrices);
      const benchReturns = calculateLogReturns(benchPrices);
      const beta = calculateBeta(etfReturns, benchReturns);

      // 2. Align data for factor metrics (Asset vs SPY, VTV, IWM)
      const { alignedPrices: factorAligned } = alignTimeSeries(fetchedData, [holding.symbol, 'SPY', 'VTV', 'IWM']);
      const etfFactorPrices = factorAligned[holding.symbol].slice(-252);
      const spyPrices = factorAligned['SPY'].slice(-252);
      const valuePrices = factorAligned['VTV'].slice(-252);
      const sizePrices = factorAligned['IWM'].slice(-252);

      const etfFactorReturns = calculateLogReturns(etfFactorPrices);
      const spyReturns = calculateLogReturns(spyPrices);
      const valueReturns = calculateLogReturns(valuePrices);
      const sizeReturns = calculateLogReturns(sizePrices);
      
      const marketBeta = calculateBeta(etfFactorReturns, spyReturns);
      const valueBeta = calculateBeta(etfFactorReturns, valueReturns);
      const sizeBeta = calculateBeta(etfFactorReturns, sizeReturns);
      
      const existingMetrics = existingEtfMetrics[holding.symbol] || {};
      
      newEtfMetrics[holding.symbol] = {
        ...existingMetrics,
        return1M: calculateReturn1M(etfPrices),
        benchReturn1M: calculateReturn1M(benchPrices),
        volatility: calculateVolatility(etfReturns),
        alpha: calculateAlpha(etfReturns, benchReturns, beta, riskFreeRate),
        beta: beta,
        marketBeta: marketBeta,
        valueBeta: valueBeta,
        sizeBeta: sizeBeta,
        correlation: calculateCorrelation(etfReturns, benchReturns),
        trackingError: calculateTrackingError(etfReturns, benchReturns),
        sharpeRatio: calculateSharpeRatio(etfReturns, riskFreeRate),
        sortinoRatio: calculateSortinoRatio(etfReturns, riskFreeRate),
        treynorRatio: calculateTreynorRatio(etfReturns, beta, riskFreeRate),
        informationRatio: calculateInformationRatio(etfReturns, benchReturns),
        var95: calculateParametricVaR(etfReturns, 0.95),
        cvar95: calculateCVaR(etfReturns, 0.95)
      };
    } else {
      // If we couldn't fetch history, preserve existing metrics
      newEtfMetrics[holding.symbol] = existingEtfMetrics[holding.symbol] || {};
    }
  }
  
  // Build performance chart data
  // Use all available data points for the chart (up to 5 years)
  const chartDataPoints = spyData.length;
  const chartStartIndex = 0;

  // Pre-build price lookup maps for O(1) access
  const priceMaps: Record<string, Map<string, number>> = {};
  symbols.forEach(sym => {
    const history = fetchedData[sym];
    const map = new Map<string, number>();
    if (history) {
      history.forEach((d: any) => map.set(d.date, d.price));
    }
    priceMaps[sym] = map;
  });

  // Track the last known price for each symbol to handle missing daily data
  const lastKnownPrices: Record<string, number> = {};
  symbols.forEach(sym => {
    lastKnownPrices[sym] = 0;
    // Initialize with the earliest available price if possible
    const history = fetchedData[sym];
    if (history && history.length > 0) {
      lastKnownPrices[sym] = history[0].price;
    }
  });

  for (let i = chartStartIndex; i < spyData.length; i++) {
    const date = spyData[i].date;
    let dailyPortfolioValue = 0;
    
    for (const holding of newHoldingsData) {
      const price = priceMaps[holding.symbol]?.get(date);
      if (price !== undefined) {
        lastKnownPrices[holding.symbol] = price;
      }
      
      dailyPortfolioValue += lastKnownPrices[holding.symbol] * holding.qty;
    }
    
    if (i === chartStartIndex) {
      currentPortfolioValue = dailyPortfolioValue;
    }

    const performancePoint: any = {
      date,
      value: dailyPortfolioValue
    };

    // Add all benchmarks
    const initialDate = spyData[chartStartIndex].date;
    symbols.forEach(symbol => {
      const initialPrice = priceMaps[symbol]?.get(initialDate) || fetchedData[symbol]?.[0]?.price || 0;
      const currentPrice = priceMaps[symbol]?.get(date) || lastKnownPrices[symbol] || 0;
      
      if (initialPrice > 0 && currentPrice > 0) {
        const returns = currentPrice / initialPrice;
        performancePoint[symbol] = currentPortfolioValue * returns;
      }
    });
    
    newPerformanceData.push(performancePoint);
  }

  // Calculate full correlation matrix for all holdings by offloading to the backend
  let correlationMatrix: any = {
    symbols: currentHoldings.map(h => h.symbol),
    matrix: {}
  };

  const holdingSymbols = currentHoldings.map(h => h.symbol);
  
  try {
    const correlationResponse = await fetch('/api/finance/correlation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fetchedData,
        symbols: holdingSymbols
      })
    });
    
    if (correlationResponse.ok) {
      correlationMatrix = await correlationResponse.json();
    } else {
      console.warn("Failed to fetch correlation matrix from backend, falling back to empty matrix.");
    }
  } catch (error) {
    console.error("Error fetching correlation matrix:", error);
  }
  
  return {
    newHoldingsData,
    newPerformanceData,
    newEtfMetrics,
    riskFreeRate,
    correlationMatrix,
    allFetchedData: fetchedData,
    enrichedTransactionsData: enrichedTransactions
  };
}
