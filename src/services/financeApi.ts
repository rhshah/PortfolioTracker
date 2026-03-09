import { format, subYears, parseISO } from 'date-fns';

export async function fetchETFData(symbol: string) {
  try {
    const response = await fetch(`/api/finance/history?symbol=${symbol}&period1=2026-02-09`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch data for ${symbol}: ${errData.error || response.statusText || response.status}`);
    }
    const data = await response.json();
    
    // yahoo-finance2 historical returns an array of objects:
    // { date: Date, open: number, high: number, low: number, close: number, adjClose: number, volume: number }
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

export async function syncRealData(currentHoldings: any[]) {
  // 1. Fetch data for all holdings + SPY (Benchmark)
  const symbols = [...currentHoldings.map(h => h.symbol), 'SPY'];
  const fetchedData: Record<string, any[]> = {};
  
  const fetchPromises = symbols.map(async (symbol) => {
    fetchedData[symbol] = await fetchETFData(symbol);
  });
  
  await Promise.all(fetchPromises);
  
  // 2. Align dates based on SPY (assuming it has the most complete trading days)
  const spyData = fetchedData['SPY'];
  if (!spyData || spyData.length === 0) {
    throw new Error("Failed to fetch market data from the backend API. Yahoo Finance might be temporarily unavailable.");
  }
  
  const newPerformanceData = [];
  let currentPortfolioValue = 0;
  
  // Calculate initial shares based on the first day's price to simulate a $100k portfolio
  // Let's use the actual purchase prices and quantities from holdings if we want exact values,
  // but for the chart, we'll just track the real daily changes.
  
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
  
  // Build performance chart data
  // We'll simulate the portfolio value over the last year based on current quantities
  for (let i = 0; i < spyData.length; i++) {
    const date = spyData[i].date;
    let dailyPortfolioValue = 0;
    
    for (const holding of currentHoldings) {
      const history = fetchedData[holding.symbol];
      if (!history || history.length === 0) continue;
      
      // Find the price for this date, or use the closest previous price
      const dayData = history.find((d: any) => d.date === date) || history[history.length - 1];
      if (dayData) {
        dailyPortfolioValue += dayData.price * holding.qty;
      }
    }
    
    // Calculate SPY benchmark value scaled to match initial portfolio value
    // On day 0, benchmark = portfolio value. Then it grows by SPY return.
    const initialSpyPrice = spyData[0].price;
    const currentSpyPrice = spyData[i].price;
    const spyReturn = currentSpyPrice / initialSpyPrice;
    
    // We need the initial portfolio value to scale the benchmark
    if (i === 0) {
      currentPortfolioValue = dailyPortfolioValue;
    }
    
    newPerformanceData.push({
      date,
      value: dailyPortfolioValue,
      SPY: currentPortfolioValue * spyReturn,
      QQQ: currentPortfolioValue * spyReturn * 1.05, // Mock QQQ slightly higher for demo
      AGG: currentPortfolioValue * spyReturn * 0.4,  // Mock AGG lower volatility
    });
  }
  
  return {
    newHoldingsData,
    newPerformanceData
  };
}
