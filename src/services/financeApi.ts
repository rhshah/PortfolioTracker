import { format, subYears, parseISO } from 'date-fns';
import { 
  calculateReturns, 
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
  calculateVaR
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
    
    return data.map((d: any) => ({
      date: new Date(d.date).toISOString().split('T')[0],
      price: d.adjClose || d.close
    }))
    .filter((d: any) => d.price !== null && d.price !== undefined)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error(`Backend fetch failed for ${symbol}:`, error);
    return [];
  }
}

export async function syncRealData(currentHoldings: any[], existingEtfMetrics: Record<string, any> = {}, benchmarks: any[] = []) {
  // 1. Fetch data for all holdings + all benchmarks + factor benchmarks + ^IRX (Risk-Free Rate)
  const holdingBenchmarkSymbols = Array.from(new Set(currentHoldings.map(h => h.benchmark)));
  const explicitBenchmarkSymbols = benchmarks.map(b => b.id);
  const factorSymbols = ['VTV', 'IWM']; 
  const symbols = Array.from(new Set([
    ...currentHoldings.map(h => h.symbol), 
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
  
  // Update Holdings with real current prices
  const newHoldingsData = currentHoldings.map(holding => {
    const history = fetchedData[holding.symbol];
    if (!history || history.length === 0) return holding;
    
    const currentPrice = history[history.length - 1].price;
    const totalValue = currentPrice * holding.qty;
    const totalGainLoss = totalValue - (holding.purchasePrice * holding.qty);
    
    return {
      ...holding,
      currentPrice,
      totalValue,
      totalGainLoss
    };
  });
  
  // Calculate real metrics for each ETF
  const newEtfMetrics: Record<string, any> = {};
  for (const holding of currentHoldings) {
    const etfHistory = fetchedData[holding.symbol];
    const benchHistory = fetchedData[holding.benchmark];
    
    if (etfHistory && benchHistory && etfHistory.length > 0 && benchHistory.length > 0) {
      // 1. Align data for primary metrics (Asset vs Benchmark)
      const primaryDates = etfHistory
        .map(d => d.date)
        .filter(date => benchHistory.some(bd => bd.date === date))
        .slice(-252);
        
      const etfPrices = primaryDates.map(date => etfHistory.find(d => d.date === date)!.price);
      const benchPrices = primaryDates.map(date => benchHistory.find(d => d.date === date)!.price);
      const etfReturns = calculateReturns(etfPrices);
      const benchReturns = calculateReturns(benchPrices);
      const beta = calculateBeta(etfReturns, benchReturns);

      // 2. Align data for factor metrics (Asset vs SPY, VTV, IWM)
      const factorDates = etfHistory
        .map(d => d.date)
        .filter(date => 
          spyData.some(sd => sd.date === date) && 
          valueData.some(vd => vd.date === date) && 
          sizeData.some(sd => sd.date === date)
        )
        .slice(-252);

      const etfFactorPrices = factorDates.map(date => etfHistory.find(d => d.date === date)!.price);
      const spyPrices = factorDates.map(date => spyData.find(d => d.date === date)!.price);
      const valuePrices = factorDates.map(date => valueData.find(d => d.date === date)!.price);
      const sizePrices = factorDates.map(date => sizeData.find(d => d.date === date)!.price);

      const etfFactorReturns = calculateReturns(etfFactorPrices);
      const spyReturns = calculateReturns(spyPrices);
      const valueReturns = calculateReturns(valuePrices);
      const sizeReturns = calculateReturns(sizePrices);
      
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
        var95: calculateVaR(etfReturns, 0.95)
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

  for (let i = chartStartIndex; i < spyData.length; i++) {
    const date = spyData[i].date;
    let dailyPortfolioValue = 0;
    
    for (const holding of currentHoldings) {
      const history = fetchedData[holding.symbol];
      if (!history || history.length === 0) continue;
      
      const dayData = history.find((d: any) => d.date === date);
      if (dayData) {
        dailyPortfolioValue += dayData.price * holding.qty;
      } else {
        // Fallback to the most recent price before this date
        const recentHistory = history.filter((h: any) => h.date < date);
        if (recentHistory.length > 0) {
          dailyPortfolioValue += recentHistory[recentHistory.length - 1].price * holding.qty;
        }
      }
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
      const history = fetchedData[symbol];
      if (history && history.length > 0) {
        const initialPriceData = history.find((d: any) => d.date === initialDate) || history[0];
        const initialPrice = initialPriceData.price;
        const dayData = history.find((d: any) => d.date === date) || history[history.length - 1];
        if (dayData && initialPrice > 0) {
          const returns = dayData.price / initialPrice;
          performancePoint[symbol] = currentPortfolioValue * returns;
        }
      }
    });
    
    newPerformanceData.push(performancePoint);
  }

  // Calculate full correlation matrix for all holdings
  const correlationMatrix: any = {
    symbols: currentHoldings.map(h => h.symbol),
    matrix: {}
  };

  for (const h1 of currentHoldings) {
    correlationMatrix.matrix[h1.symbol] = {};
    for (const h2 of currentHoldings) {
      if (h1.symbol === h2.symbol) {
        correlationMatrix.matrix[h1.symbol][h2.symbol] = 1.0;
        continue;
      }

      const history1 = fetchedData[h1.symbol];
      const history2 = fetchedData[h2.symbol];

      if (history1 && history2 && history1.length > 0 && history2.length > 0) {
        const commonDates = history1
          .map(d => d.date)
          .filter(date => history2.some(d2 => d2.date === date))
          .slice(-252);

        if (commonDates.length > 5) {
          const returns1 = calculateReturns(commonDates.map(date => history1.find(d => d.date === date)!.price));
          const returns2 = calculateReturns(commonDates.map(date => history2.find(d => d.date === date)!.price));
          correlationMatrix.matrix[h1.symbol][h2.symbol] = calculateCorrelation(returns1, returns2);
        } else {
          correlationMatrix.matrix[h1.symbol][h2.symbol] = 0.5;
        }
      } else {
        correlationMatrix.matrix[h1.symbol][h2.symbol] = 0.5;
      }
    }
  }
  
  return {
    newHoldingsData,
    newPerformanceData,
    newEtfMetrics,
    riskFreeRate,
    correlationMatrix,
    allFetchedData: fetchedData
  };
}
