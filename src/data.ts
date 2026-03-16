export const holdingsData = [
  { symbol: 'AGG', description: 'iShares Core U.S. Aggregate Bond ETF', currentPrice: 100.12, purchasePrice: 100.40, qty: 798, totalValue: 79895.76, totalGainLoss: -223.44, assetClass: 'Fixed Income', benchmark: 'BND', expenseRatio: 0.03, marketCap: 105.4e9 },
  { symbol: 'BAB', description: 'Invesco Taxable Municipal Bond ETF', currentPrice: 27.37, purchasePrice: 27.35, qty: 4409, totalValue: 120674.33, totalGainLoss: 88.18, assetClass: 'Fixed Income', benchmark: 'MUB', expenseRatio: 0.28, marketCap: 1.8e9 },
  { symbol: 'BND', description: 'Vanguard Total Bond Market ETF', currentPrice: 74.24, purchasePrice: 74.45, qty: 1616, totalValue: 119971.84, totalGainLoss: -339.36, assetClass: 'Fixed Income', benchmark: 'AGG', expenseRatio: 0.03, marketCap: 102.1e9 },
  { symbol: 'GLTR', description: 'abrdn Physical Precious Metals Basket Shares ETF', currentPrice: 241.71, purchasePrice: 238.92, qty: 497, totalValue: 120129.87, totalGainLoss: 1386.63, assetClass: 'Commodities', benchmark: 'GLD', expenseRatio: 0.60, marketCap: 1.1e9 },
  { symbol: 'PCMM', description: 'BondBloxx Private Credit CLO ETF', currentPrice: 49.85, purchasePrice: 50.25, qty: 395, totalValue: 19690.75, totalGainLoss: -158.00, assetClass: 'Fixed Income', benchmark: 'BND', expenseRatio: 0.45, marketCap: 0.05e9 },
  { symbol: 'REIT', description: 'ALPS Active REIT ETF', currentPrice: 28.41, purchasePrice: 27.83, qty: 718, totalValue: 20400.75, totalGainLoss: 418.81, assetClass: 'Real Estate', benchmark: 'VNQ', expenseRatio: 0.68, marketCap: 0.12e9 },
  { symbol: 'SCHY', description: 'Schwab International Dividend Equity ETF', currentPrice: 31.76, purchasePrice: 33.04, qty: 605, totalValue: 19214.80, totalGainLoss: -774.40, assetClass: 'Intl Equity', benchmark: 'VXUS', expenseRatio: 0.14, marketCap: 0.85e9 },
  { symbol: 'SLV', description: 'iShares Silver Trust', currentPrice: 75.94, purchasePrice: 74.72, qty: 394, totalValue: 29920.36, totalGainLoss: 480.68, assetClass: 'Commodities', benchmark: 'GLD', expenseRatio: 0.50, marketCap: 12.4e9 },
  { symbol: 'TXXI', description: 'BondBloxx IR+M Tax-Aware Intermediate Duration ETF', currentPrice: 50.74, purchasePrice: 51.01, qty: 588, totalValue: 29834.65, totalGainLoss: -156.29, assetClass: 'Fixed Income', benchmark: 'MUB', expenseRatio: 0.25, marketCap: 0.08e9 },
  { symbol: 'VGT', description: 'Vanguard Information Technology ETF', currentPrice: 719.03, purchasePrice: 754.85, qty: 65, totalValue: 46736.95, totalGainLoss: -2328.30, assetClass: 'US Equity', benchmark: 'XLK', expenseRatio: 0.10, marketCap: 68.5e9 },
  { symbol: 'VNQ', description: 'Vanguard Real Estate Index Fund ETF', currentPrice: 93.55, purchasePrice: 92.76, qty: 863, totalValue: 80733.65, totalGainLoss: 681.77, assetClass: 'Real Estate', benchmark: 'XLRE', expenseRatio: 0.12, marketCap: 32.1e9 },
  { symbol: 'VTI', description: 'Vanguard Total Stock Market ETF', currentPrice: 331.41, purchasePrice: 342.20, qty: 584, totalValue: 193543.44, totalGainLoss: -6303.40, assetClass: 'US Equity', benchmark: 'SPY', expenseRatio: 0.03, marketCap: 1.6e12 },
  { symbol: 'VXUS', description: 'Vanguard Total International Stock ETF', currentPrice: 77.98, purchasePrice: 81.82, qty: 966, totalValue: 75328.68, totalGainLoss: -3704.61, assetClass: 'Intl Equity', benchmark: 'ACWX', expenseRatio: 0.08, marketCap: 62.4e9 },
  { symbol: 'XFIV', description: 'BondBloxx Bloomberg Five Year Target Duration US Treasury ETF', currentPrice: 49.55, purchasePrice: 49.60, qty: 605, totalValue: 29976.54, totalGainLoss: -31.46, assetClass: 'Fixed Income', benchmark: 'IEF', expenseRatio: 0.05, marketCap: 0.15e9 },
];

export const transactionsData = [
  { date: '2026-02-10', symbol: 'TXXI', type: 'Buy', qty: 588, price: 51.01, total: 29990.94 },
  { date: '2026-02-10', symbol: 'AGG', type: 'Buy', qty: 798, price: 100.40, total: 80119.20 },
  { date: '2026-02-10', symbol: 'BAB', type: 'Buy', qty: 4409, price: 27.35, total: 120586.15 },
  { date: '2026-02-10', symbol: 'BND', type: 'Buy', qty: 1616, price: 74.45, total: 120311.20 },
  { date: '2026-02-10', symbol: 'GLTR', type: 'Buy', qty: 497, price: 238.92, total: 118743.24 },
  { date: '2026-02-10', symbol: 'VNQ', type: 'Buy', qty: 863, price: 92.76, total: 80051.88 },
  { date: '2026-02-10', symbol: 'PCMM', type: 'Buy', qty: 395, price: 50.25, total: 19848.75 },
  { date: '2026-02-10', symbol: 'SLV', type: 'Buy', qty: 394, price: 74.72, total: 29439.68 },
  { date: '2026-02-10', symbol: 'XFIV', type: 'Buy', qty: 605, price: 49.60, total: 30008.00 },
  { date: '2026-02-10', symbol: 'REIT', type: 'Buy', qty: 718, price: 27.83, total: 19981.94 },
  { date: '2026-02-10', symbol: 'SCHY', type: 'Buy', qty: 605, price: 33.04, total: 19989.20 },
  { date: '2026-02-10', symbol: 'VGT', type: 'Buy', qty: 65, price: 754.85, total: 49065.25 },
  { date: '2026-02-10', symbol: 'VTI', type: 'Sell', qty: 590, price: 343.15, total: 202458.50 },
  { date: '2026-02-09', symbol: 'VXUS', type: 'Sell', qty: 256, price: 82.02, total: 20997.12 },
  { date: '2026-02-09', symbol: 'VTI', type: 'Sell', qty: 144, price: 342.78, total: 49359.60 },
  { date: '2026-02-09', symbol: 'VTI', type: 'Buy', qty: 586, price: 342.75, total: 200848.57 },
  { date: '2026-02-09', symbol: 'VXUS', type: 'Buy', qty: 1222, price: 81.82, total: 99977.93 },
  { date: '2026-02-09', symbol: 'VTI', type: 'Buy', qty: 732, price: 341.77, total: 250175.64 },
];

export const performanceData = [
  { date: '2026-02-09', value: 1000000, SPY: 1000000, BND: 1000000 },
  { date: '2026-02-10', value: 1000000, SPY: 1002000, BND: 999500 },
  { date: '2026-02-11', value: 998000, SPY: 1005000, BND: 999000 },
  { date: '2026-02-12', value: 995000, SPY: 1001000, BND: 1000500 },
  { date: '2026-02-13', value: 992000, SPY: 1008000, BND: 1001000 },
  { date: '2026-02-16', value: 988000, SPY: 995000, BND: 1002000 },
  { date: '2026-02-17', value: 985000, SPY: 1002000, BND: 1001500 },
  { date: '2026-02-18', value: 982000, SPY: 1004000, BND: 1001000 },
  { date: '2026-02-19', value: 980000, SPY: 998000, BND: 1000500 },
  { date: '2026-02-20', value: 978000, SPY: 1005000, BND: 1001000 },
  { date: '2026-02-23', value: 975000, SPY: 1007000, BND: 1001500 },
  { date: '2026-02-24', value: 972000, SPY: 1012000, BND: 1002000 },
  { date: '2026-02-25', value: 970000, SPY: 1018000, BND: 1002500 },
  { date: '2026-02-26', value: 968000, SPY: 1015000, BND: 1003000 },
  { date: '2026-02-27', value: 965000, SPY: 1019000, BND: 1002500 },
  { date: '2026-03-02', value: 962000, SPY: 1022000, BND: 1003000 },
  { date: '2026-03-03', value: 960000, SPY: 1025000, BND: 1003500 },
  { date: '2026-03-04', value: 958000, SPY: 1028000, BND: 1004000 },
  { date: '2026-03-05', value: 955000, SPY: 1030000, BND: 1004500 },
  { date: '2026-03-06', value: 952000, SPY: 1035000, BND: 1005000 },
  { date: '2026-03-09', value: 950000, SPY: 1032000, BND: 1005500 },
];

export const benchmarks = [
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

