export const holdingsData = [
  { symbol: 'AGG', description: 'iShares Core U.S. Aggregate Bond ETF', currentPrice: 99.59, purchasePrice: 100.40, qty: 798, totalValue: 79895.76, totalGainLoss: -223.44, assetClass: 'Fixed Income', benchmark: 'BND', expenseRatio: 0.03, marketCap: 105.4e9 },
  { symbol: 'BAB', description: 'Invesco Taxable Municipal Bond ETF', currentPrice: 26.96, purchasePrice: 27.35, qty: 4409, totalValue: 120674.33, totalGainLoss: 88.18, assetClass: 'Fixed Income', benchmark: 'MUB', expenseRatio: 0.28, marketCap: 1.8e9 },
  { symbol: 'BND', description: 'Vanguard Total Bond Market ETF', currentPrice: 73.86, purchasePrice: 74.45, qty: 1616, totalValue: 119971.84, totalGainLoss: -339.36, assetClass: 'Fixed Income', benchmark: 'AGG', expenseRatio: 0.03, marketCap: 102.1e9 },
  { symbol: 'GLTR', description: 'abrdn Physical Precious Metals Basket Shares ETF', currentPrice: 221.27, purchasePrice: 238.92, qty: 497, totalValue: 120129.87, totalGainLoss: 1386.63, assetClass: 'Commodities', benchmark: 'GLD', expenseRatio: 0.60, marketCap: 1.1e9 },
  { symbol: 'PCMM', description: 'BondBloxx Private Credit CLO ETF', currentPrice: 49.59, purchasePrice: 50.25, qty: 395, totalValue: 19690.75, totalGainLoss: -158.00, assetClass: 'Fixed Income', benchmark: 'BND', expenseRatio: 0.45, marketCap: 0.05e9 },
  { symbol: 'REIT', description: 'ALPS Active REIT ETF', currentPrice: 29.42, purchasePrice: 27.83, qty: 718, totalValue: 20400.75, totalGainLoss: 418.81, assetClass: 'Real Estate', benchmark: 'VNQ', expenseRatio: 0.68, marketCap: 0.12e9 },
  { symbol: 'SCHY', description: 'Schwab International Dividend Equity ETF', currentPrice: 32.30, purchasePrice: 33.04, qty: 605, totalValue: 19214.80, totalGainLoss: -774.40, assetClass: 'Intl Equity', benchmark: 'VXUS', expenseRatio: 0.14, marketCap: 0.85e9 },
  { symbol: 'SLV', description: 'iShares Silver Trust', currentPrice: 69.12, purchasePrice: 74.72, qty: 394, totalValue: 29920.36, totalGainLoss: 480.68, assetClass: 'Commodities', benchmark: 'GLD', expenseRatio: 0.50, marketCap: 12.4e9 },
  { symbol: 'TXXI', description: 'BondBloxx IR+M Tax-Aware Intermediate Duration ETF', currentPrice: 50.70, purchasePrice: 51.01, qty: 588, totalValue: 29834.65, totalGainLoss: -156.29, assetClass: 'Fixed Income', benchmark: 'MUB', expenseRatio: 0.25, marketCap: 0.08e9 },
  { symbol: 'VGT', description: 'Vanguard Information Technology ETF', currentPrice: 104.06, purchasePrice: 94.36, qty: 520, totalValue: 46736.95, totalGainLoss: -2328.30, assetClass: 'US Equity', benchmark: 'XLK', expenseRatio: 0.10, marketCap: 68.5e9 },
  { symbol: 'VNQ', description: 'Vanguard Real Estate Index Fund ETF', currentPrice: 95.48, purchasePrice: 92.76, qty: 863, totalValue: 80733.65, totalGainLoss: 681.77, assetClass: 'Real Estate', benchmark: 'XLRE', expenseRatio: 0.12, marketCap: 32.1e9 },
  { symbol: 'VTI', description: 'Vanguard Total Stock Market ETF', currentPrice: 351.87, purchasePrice: 342.20, qty: 584, totalValue: 193543.44, totalGainLoss: -6303.40, assetClass: 'US Equity', benchmark: 'SPY', expenseRatio: 0.03, marketCap: 1.6e12 },
  { symbol: 'VXUS', description: 'Vanguard Total International Stock ETF', currentPrice: 82.42, purchasePrice: 81.82, qty: 966, totalValue: 75328.68, totalGainLoss: -3704.61, assetClass: 'Intl Equity', benchmark: 'ACWX', expenseRatio: 0.08, marketCap: 62.4e9 },
  { symbol: 'XFIV', description: 'BondBloxx Bloomberg Five Year Target Duration US Treasury ETF', currentPrice: 49.19, purchasePrice: 49.60, qty: 605, totalValue: 29976.54, totalGainLoss: -31.46, assetClass: 'Fixed Income', benchmark: 'IEF', expenseRatio: 0.05, marketCap: 0.15e9 },
];

export const transactionsData = [
  { date: '2026-02-08', symbol: 'CASH', type: 'Deposit', qty: 1, price: 1000000, total: 1000000, commission: 0, slippageBps: 0, marketImpactBps: 0 },
  { date: '2026-02-10', symbol: 'TXXI', type: 'Buy', qty: 588, price: 51.01, total: 29990.94, arrivalPrice: 50.95, executionPrice: 51.01, vwap: 50.98, commission: 2.50, slippageBps: 11.77, marketImpactBps: 5.88 },
  { date: '2026-02-10', symbol: 'AGG', type: 'Buy', qty: 798, price: 100.40, total: 80119.20, arrivalPrice: 100.35, executionPrice: 100.40, vwap: 100.38, commission: 5.00, slippageBps: 4.98, marketImpactBps: 1.99 },
  { date: '2026-02-10', symbol: 'BAB', type: 'Buy', qty: 4409, price: 27.35, total: 120586.15, arrivalPrice: 27.30, executionPrice: 27.35, vwap: 27.32, commission: 12.00, slippageBps: 18.31, marketImpactBps: 10.98 },
  { date: '2026-02-10', symbol: 'BND', type: 'Buy', qty: 1616, price: 74.45, total: 120311.20, arrivalPrice: 74.40, executionPrice: 74.45, vwap: 74.42, commission: 8.50, slippageBps: 6.72, marketImpactBps: 4.03 },
  { date: '2026-02-10', symbol: 'GLTR', type: 'Buy', qty: 497, price: 238.92, total: 118743.24, arrivalPrice: 238.50, executionPrice: 238.92, vwap: 238.70, commission: 10.00, slippageBps: 17.61, marketImpactBps: 9.22 },
  { date: '2026-02-10', symbol: 'VNQ', type: 'Buy', qty: 863, price: 92.76, total: 80051.88, arrivalPrice: 92.60, executionPrice: 92.76, vwap: 92.65, commission: 6.50, slippageBps: 17.27, marketImpactBps: 11.87 },
  { date: '2026-02-10', symbol: 'PCMM', type: 'Buy', qty: 395, price: 50.25, total: 19848.75, arrivalPrice: 50.15, executionPrice: 50.25, vwap: 50.18, commission: 1.50, slippageBps: 19.94, marketImpactBps: 13.95 },
  { date: '2026-02-10', symbol: 'SLV', type: 'Buy', qty: 394, price: 74.72, total: 29439.68, arrivalPrice: 74.50, executionPrice: 74.72, vwap: 74.60, commission: 2.00, slippageBps: 29.53, marketImpactBps: 16.10 },
  { date: '2026-02-10', symbol: 'XFIV', type: 'Buy', qty: 605, price: 49.60, total: 30008.00, arrivalPrice: 49.55, executionPrice: 49.60, vwap: 49.57, commission: 2.50, slippageBps: 10.09, marketImpactBps: 6.05 },
  { date: '2026-02-10', symbol: 'REIT', type: 'Buy', qty: 718, price: 27.83, total: 19981.94, arrivalPrice: 27.75, executionPrice: 27.83, vwap: 27.80, commission: 1.50, slippageBps: 28.82, marketImpactBps: 10.81 },
  { date: '2026-02-10', symbol: 'SCHY', type: 'Buy', qty: 605, price: 33.04, total: 19989.20, arrivalPrice: 32.95, executionPrice: 33.04, vwap: 33.00, commission: 1.50, slippageBps: 27.31, marketImpactBps: 12.13 },
  { date: '2026-02-10', symbol: 'VGT', type: 'Buy', qty: 520, price: 94.35625, total: 49065.25, arrivalPrice: 94.25, executionPrice: 94.35625, vwap: 94.3125, commission: 4.00, slippageBps: 11.27, marketImpactBps: 4.64 },
  { date: '2026-02-10', symbol: 'VTI', type: 'Sell', qty: 590, price: 343.15, total: 202458.50, arrivalPrice: 343.50, executionPrice: 343.15, vwap: 343.30, commission: 15.00, slippageBps: 10.18, marketImpactBps: 4.36 },
  { date: '2026-02-09', symbol: 'VXUS', type: 'Sell', qty: 256, price: 82.02, total: 20997.12, arrivalPrice: 82.10, executionPrice: 82.02, vwap: 82.05, commission: 2.00, slippageBps: 9.74, marketImpactBps: 3.65 },
  { date: '2026-02-09', symbol: 'VTI', type: 'Sell', qty: 144, price: 342.78, total: 49359.60, arrivalPrice: 343.00, executionPrice: 342.78, vwap: 342.90, commission: 4.00, slippageBps: 6.41, marketImpactBps: 3.50 },
  { date: '2026-02-09', symbol: 'VTI', type: 'Buy', qty: 586, price: 342.75, total: 200848.57, arrivalPrice: 342.50, executionPrice: 342.75, vwap: 342.65, commission: 15.00, slippageBps: 7.29, marketImpactBps: 2.91 },
  { date: '2026-02-09', symbol: 'VXUS', type: 'Buy', qty: 1222, price: 81.82, total: 99977.93, arrivalPrice: 81.70, executionPrice: 81.82, vwap: 81.78, commission: 8.00, slippageBps: 14.68, marketImpactBps: 4.89 },
  { date: '2026-02-09', symbol: 'VTI', type: 'Buy', qty: 732, price: 341.77, total: 250175.64, arrivalPrice: 341.50, executionPrice: 341.77, vwap: 341.65, commission: 18.00, slippageBps: 7.90, marketImpactBps: 3.51 },
];

export const performanceData = [
  { date: '2026-02-09', value: 1000000, AOR: 1000000, SPY: 1000000, BND: 1000000 },
  { date: '2026-02-10', value: 1000000, AOR: 1000500, SPY: 1002000, BND: 999500 },
  { date: '2026-02-11', value: 998000, AOR: 1001000, SPY: 1005000, BND: 999000 },
  { date: '2026-02-12', value: 995000, AOR: 1000800, SPY: 1001000, BND: 1000500 },
  { date: '2026-02-13', value: 992000, AOR: 1004000, SPY: 1008000, BND: 1001000 },
  { date: '2026-02-16', value: 988000, AOR: 998000, SPY: 995000, BND: 1002000 },
  { date: '2026-02-17', value: 985000, AOR: 1001800, SPY: 1002000, BND: 1001500 },
  { date: '2026-02-18', value: 982000, AOR: 1002500, SPY: 1004000, BND: 1001000 },
  { date: '2026-02-19', value: 980000, AOR: 999000, SPY: 998000, BND: 1000500 },
  { date: '2026-02-20', value: 978000, AOR: 1003000, SPY: 1005000, BND: 1001000 },
  { date: '2026-02-23', value: 975000, AOR: 1004500, SPY: 1007000, BND: 1001500 },
  { date: '2026-02-24', value: 972000, AOR: 1007000, SPY: 1012000, BND: 1002000 },
  { date: '2026-02-25', value: 970000, AOR: 1010000, SPY: 1018000, BND: 1002500 },
  { date: '2026-02-26', value: 968000, AOR: 1009000, SPY: 1015000, BND: 1003000 },
  { date: '2026-02-27', value: 965000, AOR: 1011000, SPY: 1019000, BND: 1002500 },
  { date: '2026-03-02', value: 962000, AOR: 1012500, SPY: 1022000, BND: 1003000 },
  { date: '2026-03-03', value: 960000, AOR: 1014000, SPY: 1025000, BND: 1003500 },
  { date: '2026-03-04', value: 958000, AOR: 1016000, SPY: 1028000, BND: 1004000 },
  { date: '2026-03-05', value: 955000, AOR: 1017500, SPY: 1030000, BND: 1004500 },
  { date: '2026-03-06', value: 952000, AOR: 1020000, SPY: 1035000, BND: 1005000 },
  { date: '2026-03-09', value: 950000, AOR: 1019000, SPY: 1032000, BND: 1005500 },
];

export const benchmarks = [
  { id: 'AOR', name: 'iShares Core 60/40 Balanced Allocation ETF', expenseRatio: 0.15, marketCap: 2.5e9 },
  { id: 'SPY', name: 'SPDR S&P 500 ETF Trust (Equity Benchmark)', expenseRatio: 0.09, marketCap: 520.1e9 },
  { id: 'BND', name: 'Vanguard Total Bond Market ETF (Fixed Income Benchmark)', expenseRatio: 0.03, marketCap: 102.1e9 },
];

export const metricsData = {
  portfolio: {
    return1M: -0.90,
    volatility: 12.4,
    sharpeRatio: 0.85,
    maxDrawdown: -3.2,
    beta: 0.82,
    alpha: -1.2,
    yield: 2.4,
    correlation: 0.88,
    trackingError: 3.2,
    factors: { value: 0.12, size: -0.05, momentum: 0.25, quality: 0.18, lowVol: 0.05 }
  },
  SPY: {
    return1M: 0.50,
    volatility: 15.2,
    sharpeRatio: 1.1,
    maxDrawdown: -4.5,
    beta: 1.0,
    alpha: 0.0,
    yield: 1.3,
    correlation: 1.0,
    trackingError: 0.0,
    factors: { value: 0.05, size: -0.10, momentum: 0.35, quality: 0.25, lowVol: -0.05 }
  },
  BND: {
    return1M: 0.85,
    volatility: 4.5,
    sharpeRatio: 0.4,
    maxDrawdown: -1.2,
    beta: 0.1,
    alpha: 0.2,
    yield: 4.1,
    correlation: 1.0,
    trackingError: 0.0,
    factors: { value: 0.0, size: 0.0, momentum: 0.0, quality: 0.10, lowVol: 0.45 }
  }
};

export const etfMetrics: Record<string, any> = {
  AOR: { yield: 2.1, return1M: 1.9, benchReturn1M: 1.9, alpha: 0.0, beta: 1.0, sharpeRatio: 0.9, correlation: 1.0, trackingError: 0.0, factors: { value: 0.1, size: 0.0, momentum: 0.1, quality: 0.2, lowVol: 0.1 } },
  AGG: { yield: 3.2, return1M: -0.28, benchReturn1M: -0.30, alpha: 0.02, beta: 0.98, sharpeRatio: 0.45, correlation: 0.99, trackingError: 0.15, factors: { value: 0.0, size: 0.0, momentum: 0.0, quality: 0.05, lowVol: 0.40 } },
  BAB: { yield: 4.5, return1M: -0.07, benchReturn1M: -0.10, alpha: 0.05, beta: 1.05, sharpeRatio: 0.62, correlation: 0.94, trackingError: 0.45, factors: { value: 0.05, size: 0.0, momentum: -0.05, quality: 0.15, lowVol: 0.20 } },
  BND: { yield: 3.1, return1M: -0.28, benchReturn1M: -0.28, alpha: 0.00, beta: 1.00, sharpeRatio: 0.40, correlation: 1.00, trackingError: 0.05, factors: { value: 0.0, size: 0.0, momentum: 0.0, quality: 0.10, lowVol: 0.45 } },
  GLTR: { yield: 0.0, return1M: 1.17, benchReturn1M: 1.10, alpha: 0.15, beta: 0.95, sharpeRatio: 0.85, correlation: 0.92, trackingError: 1.20, factors: { value: 0.0, size: 0.0, momentum: 0.15, quality: 0.0, lowVol: 0.10 } },
  PCMM: { yield: 5.2, return1M: 0.00, benchReturn1M: -0.28, alpha: 0.30, beta: 0.80, sharpeRatio: 1.15, correlation: 0.75, trackingError: 2.50, factors: { value: 0.20, size: 0.10, momentum: -0.10, quality: 0.05, lowVol: 0.15 } },
  REIT: { yield: 4.8, return1M: -1.26, benchReturn1M: -1.09, alpha: -0.15, beta: 1.10, sharpeRatio: 0.55, correlation: 0.96, trackingError: 0.85, factors: { value: 0.35, size: 0.15, momentum: -0.20, quality: -0.10, lowVol: -0.05 } },
  SCHY: { yield: 3.9, return1M: -0.35, benchReturn1M: -0.94, alpha: 0.60, beta: 0.85, sharpeRatio: 1.25, correlation: 0.88, trackingError: 1.50, factors: { value: 0.45, size: -0.05, momentum: -0.10, quality: 0.30, lowVol: 0.25 } },
  SLV: { yield: 0.0, return1M: 2.25, benchReturn1M: 1.10, alpha: 1.20, beta: 1.50, sharpeRatio: 0.95, correlation: 0.85, trackingError: 3.10, factors: { value: 0.0, size: 0.0, momentum: 0.50, quality: 0.0, lowVol: -0.30 } },
  TXXI: { yield: 3.5, return1M: -0.11, benchReturn1M: -0.10, alpha: -0.01, beta: 0.99, sharpeRatio: 0.58, correlation: 0.98, trackingError: 0.20, factors: { value: 0.0, size: 0.0, momentum: 0.0, quality: 0.10, lowVol: 0.35 } },
  VGT: { yield: 0.7, return1M: -4.75, benchReturn1M: -4.50, alpha: -0.20, beta: 1.15, sharpeRatio: 1.45, correlation: 0.97, trackingError: 0.90, factors: { value: -0.30, size: -0.15, momentum: 0.60, quality: 0.45, lowVol: -0.25 } },
  VNQ: { yield: 4.2, return1M: -1.09, benchReturn1M: -1.05, alpha: -0.05, beta: 1.02, sharpeRatio: 0.65, correlation: 0.99, trackingError: 0.10, factors: { value: 0.30, size: 0.10, momentum: -0.15, quality: -0.05, lowVol: 0.0 } },
  VTI: { yield: 1.4, return1M: -3.15, benchReturn1M: -3.00, alpha: -0.10, beta: 1.03, sharpeRatio: 1.10, correlation: 0.99, trackingError: 0.12, factors: { value: 0.05, size: -0.05, momentum: 0.25, quality: 0.20, lowVol: -0.05 } },
  VXUS: { yield: 3.0, return1M: -4.69, benchReturn1M: -4.50, alpha: -0.15, beta: 1.05, sharpeRatio: 0.75, correlation: 0.98, trackingError: 0.40, factors: { value: 0.15, size: -0.10, momentum: 0.10, quality: 0.15, lowVol: 0.05 } },
  XFIV: { yield: 3.8, return1M: -0.10, benchReturn1M: -0.12, alpha: 0.02, beta: 0.95, sharpeRatio: 0.48, correlation: 0.96, trackingError: 0.35, factors: { value: 0.0, size: 0.0, momentum: 0.0, quality: 0.05, lowVol: 0.50 } },
};

