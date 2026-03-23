import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Plus, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calculateHoldingsFromTransactions, Transaction, enrichTransactionWithTCA } from '../utils/portfolioMath';

export function AddHoldingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { holdingsData, transactionsData, updateData, allFetchedData } = useData();
  
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [qty, setQty] = useState('');
  const [assetClass, setAssetClass] = useState('US Equity');
  const [benchmark, setBenchmark] = useState('SPY');
  const [executionType, setExecutionType] = useState('Stock: Buy at Market');

  const handleSave = () => {
    if (!symbol || !purchasePrice || !qty) return;

    const upperSymbol = symbol.toUpperCase();

    const newHoldingMeta = {
      symbol: upperSymbol,
      description: description || upperSymbol,
      currentPrice: parseFloat(purchasePrice), // Placeholder until synced
      purchasePrice: parseFloat(purchasePrice),
      qty: parseFloat(qty),
      totalValue: parseFloat(purchasePrice) * parseFloat(qty),
      totalGainLoss: 0,
      assetClass,
      benchmark,
    };

    const parsedQty = parseFloat(qty);
    const parsedPrice = parseFloat(purchasePrice);

    let newTx: Transaction = {
      date: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      symbol: upperSymbol,
      type: 'Buy',
      qty: parsedQty,
      price: parsedPrice,
      total: parsedPrice * parsedQty,
      executionType: executionType
    };

    // Enrich immediately if we have the historical data
    if (allFetchedData && allFetchedData[upperSymbol]) {
      newTx = enrichTransactionWithTCA(newTx, allFetchedData[upperSymbol]);
    }

    const newTransactions = [newTx, ...transactionsData];
    const newHoldingsMetaList = [...holdingsData, newHoldingMeta];

    const currentPrices: Record<string, number> = {};
    newHoldingsMetaList.forEach(h => {
      currentPrices[h.symbol] = h.currentPrice;
    });

    const newHoldings = calculateHoldingsFromTransactions(newTransactions, newHoldingsMetaList, currentPrices);

    updateData({
      transactionsData: newTransactions,
      holdingsData: newHoldings
    });

    setIsOpen(false);
    setSymbol('');
    setDescription('');
    setPurchasePrice('');
    setQty('');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Holding
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Add New Holding</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Symbol</label>
                  <input 
                    type="text" 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. AAPL"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Apple Inc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Purchase Price</label>
                  <input 
                    type="number" 
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Quantity</label>
                  <input 
                    type="number" 
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Execution Type</label>
                <select 
                  value={executionType}
                  onChange={(e) => setExecutionType(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Stock: Buy at Market">Stock: Buy at Market</option>
                  <option value="Stock: Sell at Market">Stock: Sell at Market</option>
                  <option value="Stock: Buy at Market Open">Stock: Buy at Market Open</option>
                  <option value="Stock: Sell at Market Open">Stock: Sell at Market Open</option>
                  <option value="Stock: Buy at Market Close">Stock: Buy at Market Close</option>
                  <option value="Stock: Sell at Market Close">Stock: Sell at Market Close</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Asset Class</label>
                  <select 
                    value={assetClass}
                    onChange={(e) => setAssetClass(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="US Equity">US Equity</option>
                    <option value="Intl Equity">Intl Equity</option>
                    <option value="Fixed Income">Fixed Income</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Commodities">Commodities</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Benchmark</label>
                  <input 
                    type="text" 
                    value={benchmark}
                    onChange={(e) => setBenchmark(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. SPY"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Holding
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
