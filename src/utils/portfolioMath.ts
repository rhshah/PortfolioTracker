import { Holding } from '../context/DataContext';

export interface Transaction {
  date: string;
  symbol?: string;
  type: 'Buy' | 'Sell' | 'Deposit' | 'Withdrawal' | 'Adjustment';
  qty?: number;
  price?: number;
  total: number;
  executionType?: string;
  isTcaEstimated?: boolean;
  arrivalPrice?: number;
  executionPrice?: number;
  vwap?: number;
  commission?: number;
  slippageBps?: number;
  marketImpactBps?: number;
}

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  price: number; // Adjusted close for backward compatibility
}

/**
 * Enriches a transaction with deterministic TCA metrics based on historical OHLCV data.
 * This replaces randomized metrics with mathematically sound proxies.
 */
export function enrichTransactionWithTCA(tx: Transaction, history: OHLCV[]): Transaction {
  // If already enriched and not estimated, or if history is missing, return as is
  if (tx.vwap && !tx.isTcaEstimated) return tx;
  if (!history || history.length === 0) return tx;

  try {
    // Normalize date to YYYY-MM-DD for matching
    const txDateObj = new Date(tx.date);
    const txDateStr = txDateObj.toISOString().split('T')[0];
    
    const dayIndex = history.findIndex(h => h.date === txDateStr);
    if (dayIndex === -1) {
      console.warn(`[TCA Enrichment] No historical data found for ${tx.symbol} on ${txDateStr}`);
      return tx;
    }

    const dayData = history[dayIndex];
    const prevDayData = dayIndex > 0 ? history[dayIndex - 1] : dayData; // Fallback to same day if no prev day

    // Calculate Proxy VWAP: (High + Low + Close) / 3
    const proxyVwap = (dayData.high + dayData.low + dayData.close) / 3;

    let arrivalPrice = proxyVwap; // Default to VWAP for intraday "At Market"
    
    const execType = (tx.executionType || '').toLowerCase();
    const isMarketOpen = execType.includes('market open');
    const isMarketClose = execType.includes('market close');

    if (isMarketOpen) {
      // Arrival price is previous day's close
      arrivalPrice = prevDayData.close;
    } else if (isMarketClose) {
      // Arrival price is today's open or VWAP
      arrivalPrice = proxyVwap;
    }

    // Calculate Slippage in bps
    // Buy: (Execution - Arrival) / Arrival * 10000
    // Sell: (Arrival - Execution) / Arrival * 10000
    const slippageBps = tx.type === 'Buy' 
      ? ((tx.price - arrivalPrice) / arrivalPrice) * 10000
      : ((arrivalPrice - tx.price) / arrivalPrice) * 10000;

    // Calculate Market Impact
    const tradeValue = tx.price * tx.qty;
    const dailyVolumeValue = proxyVwap * dayData.volume;
    const participationRate = dailyVolumeValue > 0 ? tradeValue / dailyVolumeValue : 0;
    
    // Simple market impact model: participation rate * 10000 (bps) * factor
    const marketImpactBps = Math.min(500, participationRate * 10000 * 0.1); // Cap at 500 bps

    // Base commission: $0 for now (assuming zero-commission broker)
    const commission = 0;

    return {
      ...tx,
      isTcaEstimated: true,
      arrivalPrice: Number(arrivalPrice.toFixed(2)),
      executionPrice: Number(tx.price.toFixed(2)),
      vwap: Number(proxyVwap.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      slippageBps: Number(slippageBps.toFixed(2)),
      marketImpactBps: Number(marketImpactBps.toFixed(2))
    };
  } catch (error) {
    console.error(`[TCA Enrichment] Error enriching transaction for ${tx.symbol}:`, error);
    return tx;
  }
}

/**
 * Calculates the current cash balance based on a ledger of transactions.
 * @param transactions The full history of transactions.
 * @returns The current cash balance.
 */
export function calculateCashBalance(transactions: Transaction[]): number {
  return transactions.reduce((balance, tx) => {
    switch (tx.type) {
      case 'Deposit':
      case 'Adjustment':
        return balance + tx.total;
      case 'Withdrawal':
        return balance - tx.total;
      case 'Buy':
        return balance - tx.total;
      case 'Sell':
        return balance + tx.total;
      default:
        return balance;
    }
  }, 0);
}

/**
 * Calculates current holdings based on a ledger of transactions.
 * This is the core engine for Transaction Cost Analysis (TCA) and cost basis tracking.
 * It processes transactions chronologically to accurately determine realized and unrealized gains.
 * 
 * @param transactions The full ledger of historical transactions.
 * @param existingHoldings Existing holding metadata (description, asset class, benchmark).
 * @param currentPrices A map of current market prices for the symbols.
 * @returns An array of active holdings (qty > 0 or has realized gains).
 */
export function calculateHoldingsFromTransactions(
  transactions: Transaction[],
  existingHoldings: Holding[],
  currentPrices: Record<string, number> = {}
): Holding[] {
  console.log(`[portfolioMath] Processing ${transactions.length} transactions to calculate holdings...`);
  const holdingsMap = new Map<string, Holding>();

  // Initialize with existing metadata
  existingHoldings.forEach(h => {
    holdingsMap.set(h.symbol, {
      ...h,
      qty: 0,
      purchasePrice: 0,
      totalValue: 0,
      totalGainLoss: 0,
      realizedGainLoss: 0,
    } as any);
  });

  // Sort transactions by date (oldest first), then Buy before Sell
  const sortedTxs = [...transactions].sort((a, b) => {
    const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (timeDiff !== 0) return timeDiff;
    if (a.type === 'Buy' && b.type === 'Sell') return -1;
    if (a.type === 'Sell' && b.type === 'Buy') return 1;
    return 0;
  });

  let cashBalance = 0;

  sortedTxs.forEach(tx => {
    // Handle cash balance
    if (tx.type === 'Deposit' || tx.type === 'Adjustment') {
      cashBalance += tx.total;
      return; // No symbol processing needed for pure cash transactions
    } else if (tx.type === 'Withdrawal') {
      cashBalance -= tx.total;
      return;
    } else if (tx.type === 'Buy') {
      cashBalance -= tx.total;
    } else if (tx.type === 'Sell') {
      cashBalance += tx.total;
    }

    const sym = tx.symbol;
    if (!sym) return;

    if (!holdingsMap.has(sym)) {
      // If we don't have metadata, create a default entry
      holdingsMap.set(sym, {
        symbol: sym,
        description: sym,
        assetClass: 'Unknown',
        benchmark: 'SPY',
        currentPrice: currentPrices[sym] || tx.price,
        purchasePrice: 0,
        qty: 0,
        totalValue: 0,
        totalGainLoss: 0,
        realizedGainLoss: 0,
        tcaSlippage: 0,
        tcaImpact: 0,
      } as any);
    }

    const holding = holdingsMap.get(sym)! as any;

    // Initialize TCA fields if they don't exist
    if (holding.tcaSlippage === undefined) holding.tcaSlippage = 0;
    if (holding.tcaImpact === undefined) holding.tcaImpact = 0;

    if (tx.type === 'Buy') {
      const totalCost = holding.qty * holding.purchasePrice;
      const newTotalCost = totalCost + (tx.qty * tx.price);
      holding.qty += tx.qty;
      holding.purchasePrice = holding.qty > 0 ? newTotalCost / holding.qty : 0;
      
      // Calculate TCA metrics for Buy
      if (tx.decisionPrice && tx.executionPrice) {
        // Slippage: Execution Price vs Decision Price
        const slippage = (tx.executionPrice - tx.decisionPrice) * tx.qty;
        holding.tcaSlippage += slippage;
        
        // Impact: Actual Price vs Execution Price (if different, e.g., fees or market impact)
        const impact = (tx.price - tx.executionPrice) * tx.qty;
        holding.tcaImpact += impact;
      }
    } else if (tx.type === 'Sell') {
      // Calculate realized gain/loss
      const costBasisForSale = tx.qty * holding.purchasePrice;
      const saleProceeds = tx.qty * tx.price;
      holding.realizedGainLoss = (holding.realizedGainLoss || 0) + (saleProceeds - costBasisForSale);
      
      holding.qty -= tx.qty;
      
      // Calculate TCA metrics for Sell
      if (tx.decisionPrice && tx.executionPrice) {
        // Slippage: Decision Price vs Execution Price (reversed for sell)
        const slippage = (tx.decisionPrice - tx.executionPrice) * tx.qty;
        holding.tcaSlippage += slippage;
        
        // Impact: Execution Price vs Actual Price
        const impact = (tx.executionPrice - tx.price) * tx.qty;
        holding.tcaImpact += impact;
      }

      if (holding.qty <= 0) {
        holding.qty = 0;
        holding.purchasePrice = 0; // Reset cost basis if position closed
      }
    }
  });

  // Calculate current value and unrealized gain/loss
  let activeHoldings = Array.from(holdingsMap.values()).filter((h: any) => h.qty > 0 || h.realizedGainLoss !== 0);
  
  activeHoldings.forEach((h: any) => {
    // If we have a current price passed in, use it, otherwise keep the one from metadata or last tx
    if (currentPrices[h.symbol]) {
      h.currentPrice = currentPrices[h.symbol];
    }
    h.totalValue = h.qty * h.currentPrice;
    h.totalGainLoss = h.totalValue - (h.qty * h.purchasePrice);
  });

  // Remove any existing CASH holding that might have been created by trades
  activeHoldings = activeHoldings.filter((h: any) => h.symbol !== 'CASH');

  if (cashBalance !== 0) {
    activeHoldings.push({
      symbol: 'CASH',
      description: 'US Dollar',
      assetClass: 'Cash',
      benchmark: 'CASH',
      currentPrice: 1,
      purchasePrice: 1,
      qty: cashBalance,
      totalValue: cashBalance,
      totalGainLoss: 0,
      realizedGainLoss: 0,
      expenseRatio: 0,
      marketCap: 0
    } as any);
  }

  return activeHoldings;
}
