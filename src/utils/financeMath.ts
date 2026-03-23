/**
 * Aligns time series data across multiple symbols by forward-filling missing dates.
 * This ensures that all arrays have the same length and correspond to the same dates,
 * which is critical for accurate correlation and portfolio calculations.
 */
export function alignTimeSeries(fetchedData: Record<string, any[]>, symbols: string[]) {
  const allDatesSet = new Set<string>();
  symbols.forEach(sym => {
    if (fetchedData[sym]) {
      fetchedData[sym].forEach(d => allDatesSet.add(d.date));
    }
  });
  
  const allDates = Array.from(allDatesSet).sort();
  const alignedPrices: Record<string, number[]> = {};
  
  symbols.forEach(sym => {
    alignedPrices[sym] = [];
    let lastPrice = 0;
    
    if (fetchedData[sym] && fetchedData[sym].length > 0) {
      lastPrice = fetchedData[sym][0].price;
    }

    const dateToPrice = new Map<string, number>();
    if (fetchedData[sym]) {
      fetchedData[sym].forEach(d => dateToPrice.set(d.date, d.price));
    }

    allDates.forEach(date => {
      if (dateToPrice.has(date)) {
        lastPrice = dateToPrice.get(date)!;
      }
      alignedPrices[sym].push(lastPrice);
    });
  });
  
  return { dates: allDates, alignedPrices };
}

/**
 * Calculates simple arithmetic returns.
 * Useful for single-period display, but not recommended for compounding over time.
 */
export function calculateReturns(data: number[]) {
  if (data.length < 2) return [];
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    const prevValue = data[i - 1];
    if (prevValue <= 0) {
      returns.push(0);
    } else {
      returns.push((data[i] - prevValue) / prevValue);
    }
  }
  return returns;
}

/**
 * Calculates logarithmic returns (continuously compounded returns).
 * This is statistically superior for time-series aggregation and volatility calculations
 * because log returns are symmetric and additive over time.
 */
export function calculateLogReturns(data: number[]) {
  if (data.length < 2) return [];
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    const prevValue = data[i - 1];
    const currentValue = data[i];
    if (prevValue <= 0 || currentValue <= 0) {
      returns.push(0);
    } else {
      returns.push(Math.log(currentValue / prevValue));
    }
  }
  return returns;
}

export function calculateVolatility(returns: number[], periodsPerYear = 252) {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear) * 100;
}

export function calculateSharpeRatio(returns: number[], riskFreeRate = 0.02, periodsPerYear = 252) {
  if (returns.length < 5) return 0;
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualizedReturn = meanReturn * periodsPerYear;
  const volatility = calculateVolatility(returns, periodsPerYear) / 100;
  if (volatility < 0.0001) return 0;
  return (annualizedReturn - riskFreeRate) / volatility;
}

export function calculateMaxDrawdown(data: number[]) {
  if (data.length === 0) return 0;
  let maxDrawdown = 0;
  let peak = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i] > peak) {
      peak = data[i];
    }
    const drawdown = (data[i] - peak) / peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  return maxDrawdown * 100;
}

export function calculateBeta(assetReturns: number[], benchmarkReturns: number[]) {
  if (assetReturns.length < 5 || benchmarkReturns.length < 5 || assetReturns.length !== benchmarkReturns.length) return 1;
  const meanAsset = assetReturns.reduce((a, b) => a + b, 0) / assetReturns.length;
  const meanBench = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
  
  let covariance = 0;
  let varianceBench = 0;
  
  for (let i = 0; i < assetReturns.length; i++) {
    covariance += (assetReturns[i] - meanAsset) * (benchmarkReturns[i] - meanBench);
    varianceBench += Math.pow(benchmarkReturns[i] - meanBench, 2);
  }
  
  if (varianceBench < 0.000001) return 1;
  return covariance / varianceBench;
}

export function calculateAlpha(assetReturns: number[], benchmarkReturns: number[], beta: number, riskFreeRate = 0.02, periodsPerYear = 252) {
  if (assetReturns.length === 0 || benchmarkReturns.length === 0) return 0;
  const meanAsset = assetReturns.reduce((a, b) => a + b, 0) / assetReturns.length;
  const meanBench = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
  
  const annualizedAssetReturn = meanAsset * periodsPerYear;
  const annualizedBenchReturn = meanBench * periodsPerYear;
  
  return (annualizedAssetReturn - riskFreeRate - beta * (annualizedBenchReturn - riskFreeRate)) * 100;
}

export function calculateCorrelation(assetReturns: number[], benchmarkReturns: number[]) {
  if (assetReturns.length === 0 || benchmarkReturns.length === 0 || assetReturns.length !== benchmarkReturns.length) return 1;
  const meanAsset = assetReturns.reduce((a, b) => a + b, 0) / assetReturns.length;
  const meanBench = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
  
  let covariance = 0;
  let varianceAsset = 0;
  let varianceBench = 0;
  
  for (let i = 0; i < assetReturns.length; i++) {
    covariance += (assetReturns[i] - meanAsset) * (benchmarkReturns[i] - meanBench);
    varianceAsset += Math.pow(assetReturns[i] - meanAsset, 2);
    varianceBench += Math.pow(benchmarkReturns[i] - meanBench, 2);
  }
  
  if (varianceAsset === 0 || varianceBench === 0) return 1;
  return covariance / Math.sqrt(varianceAsset * varianceBench);
}

export function calculateTrackingError(assetReturns: number[], benchmarkReturns: number[], periodsPerYear = 252) {
  if (assetReturns.length === 0 || benchmarkReturns.length === 0 || assetReturns.length !== benchmarkReturns.length) return 0;
  const activeReturns = assetReturns.map((r, i) => r - benchmarkReturns[i]);
  const meanActiveReturn = activeReturns.reduce((a, b) => a + b, 0) / activeReturns.length;
  const varianceActiveReturn = activeReturns.reduce((a, b) => a + Math.pow(b - meanActiveReturn, 2), 0) / activeReturns.length;
  return Math.sqrt(varianceActiveReturn) * Math.sqrt(periodsPerYear) * 100;
}

export function calculateDownsideDeviation(returns: number[], riskFreeRate = 0.02, periodsPerYear = 252) {
  if (returns.length === 0) return 0;
  const periodicRF = riskFreeRate / periodsPerYear;
  const downsideReturns = returns.map(r => Math.min(0, r - periodicRF));
  const variance = downsideReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear) * 100;
}

export function calculateSortinoRatio(returns: number[], riskFreeRate = 0.02, periodsPerYear = 252) {
  if (returns.length === 0) return 0;
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualizedReturn = meanReturn * periodsPerYear;
  const downsideDev = calculateDownsideDeviation(returns, riskFreeRate, periodsPerYear) / 100;
  if (downsideDev === 0) return 0;
  return (annualizedReturn - riskFreeRate) / downsideDev;
}

export function calculateTreynorRatio(returns: number[], beta: number, riskFreeRate = 0.02, periodsPerYear = 252) {
  if (returns.length === 0 || beta === 0) return 0;
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualizedReturn = meanReturn * periodsPerYear;
  return (annualizedReturn - riskFreeRate) / beta;
}

export function calculateInformationRatio(assetReturns: number[], benchmarkReturns: number[], periodsPerYear = 252) {
  if (assetReturns.length === 0 || benchmarkReturns.length === 0) return 0;
  const activeReturns = assetReturns.map((r, i) => r - benchmarkReturns[i]);
  const meanActiveReturn = activeReturns.reduce((a, b) => a + b, 0) / activeReturns.length;
  const annualizedActiveReturn = meanActiveReturn * periodsPerYear;
  const trackingError = calculateTrackingError(assetReturns, benchmarkReturns, periodsPerYear) / 100;
  if (trackingError === 0) return 0;
  return annualizedActiveReturn / trackingError;
}

/**
 * Calculates Parametric Value at Risk (VaR) assuming a normal distribution.
 * This is generally preferred for portfolios with sufficient history and normal-ish returns.
 * @param returns Array of log returns
 * @param confidence Confidence level (e.g., 0.95 for 95%)
 * @param periodsPerYear Number of trading periods in a year (default 252)
 * @returns Annualized Parametric VaR as a percentage
 */
export function calculateParametricVaR(returns: number[], confidence = 0.95, periodsPerYear = 252) {
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Z-scores for common confidence levels
  let zScore = 1.645; // 95%
  if (confidence === 0.99) zScore = 2.326;
  else if (confidence === 0.90) zScore = 1.282;
  
  // Daily VaR
  const dailyVaR = (mean - zScore * stdDev);
  
  // Annualized VaR (assuming normal distribution scales with sqrt(time))
  const annualizedVaR = dailyVaR * Math.sqrt(periodsPerYear);
  
  return Math.abs(annualizedVaR) * 100;
}

/**
 * Calculates Conditional Value at Risk (CVaR) / Expected Shortfall.
 * This measures the expected loss given that the loss is greater than the VaR threshold.
 * It's a more robust risk measure than VaR for tail risks.
 * @param returns Array of log returns
 * @param confidence Confidence level (e.g., 0.95 for 95%)
 * @param periodsPerYear Number of trading periods in a year (default 252)
 * @returns Annualized CVaR as a percentage
 */
export function calculateCVaR(returns: number[], confidence = 0.95, periodsPerYear = 252) {
  if (returns.length === 0) return 0;
  
  // Calculate Historical VaR threshold first
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const varIndex = Math.floor((1 - confidence) * sortedReturns.length);
  
  if (varIndex <= 0) return 0; // Not enough data for tail
  
  // Get all returns worse than the VaR threshold
  const tailReturns = sortedReturns.slice(0, varIndex);
  
  // Calculate the average of these tail returns (Daily CVaR)
  const dailyCVaR = tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;
  
  // Annualize
  const annualizedCVaR = dailyCVaR * Math.sqrt(periodsPerYear);
  
  return Math.abs(annualizedCVaR) * 100;
}

/**
 * Calculates Historical Value at Risk (VaR).
 * @param returns Array of log returns
 * @param confidence Confidence level (e.g., 0.95 for 95%)
 * @param periodsPerYear Number of trading periods in a year (default 252)
 * @returns Annualized Historical VaR as a percentage
 */
export function calculateHistoricalVaR(returns: number[], confidence = 0.95, periodsPerYear = 252) {
  if (returns.length === 0) return 0;
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sortedReturns.length);
  const dailyVaR = sortedReturns[index];
  const annualizedVaR = dailyVaR * Math.sqrt(periodsPerYear);
  return Math.abs(annualizedVaR) * 100;
}

// Keep the old calculateVaR for backwards compatibility, but alias it to Historical
export const calculateVaR = calculateHistoricalVaR;

export function calculateReturn1M(data: number[]) {
  if (data.length < 2) return 0;
  const period = Math.min(21, data.length - 1);
  const startValue = data[data.length - 1 - period];
  const endValue = data[data.length - 1];
  return ((endValue - startValue) / startValue) * 100;
}

export function calculateDrawdownSeries(data: number[]) {
  if (data.length === 0) return [];
  let peak = data[0];
  return data.map(value => {
    if (value > peak) peak = value;
    return ((value - peak) / peak) * 100;
  });
}

export function calculateCaptureRatios(assetReturns: number[], benchmarkReturns: number[]) {
  if (assetReturns.length === 0 || benchmarkReturns.length === 0 || assetReturns.length !== benchmarkReturns.length) {
    return { upside: 100, downside: 100 };
  }

  let upsideAsset = 1;
  let upsideBench = 1;
  let downsideAsset = 1;
  let downsideBench = 1;

  let hasUpside = false;
  let hasDownside = false;

  for (let i = 0; i < assetReturns.length; i++) {
    if (benchmarkReturns[i] > 0) {
      upsideAsset *= (1 + assetReturns[i]);
      upsideBench *= (1 + benchmarkReturns[i]);
      hasUpside = true;
    } else if (benchmarkReturns[i] < 0) {
      downsideAsset *= (1 + assetReturns[i]);
      downsideBench *= (1 + benchmarkReturns[i]);
      hasDownside = true;
    }
  }

  const upsideCapture = hasUpside ? ((Math.pow(upsideAsset, 1) - 1) / (Math.pow(upsideBench, 1) - 1)) * 100 : 100;
  const downsideCapture = hasDownside ? ((Math.pow(downsideAsset, 1) - 1) / (Math.pow(downsideBench, 1) - 1)) * 100 : 100;

  return {
    upside: isNaN(upsideCapture) ? 100 : upsideCapture,
    downside: isNaN(downsideCapture) ? 100 : downsideCapture
  };
}
