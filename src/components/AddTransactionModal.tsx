import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Plus, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calculateHoldingsFromTransactions, Transaction, enrichTransactionWithTCA } from '../utils/portfolioMath';

export function AddTransactionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { transactionsData, holdingsData, updateData, allFetchedData } = useData();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('Buy');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [executionType, setExecutionType] = useState('Stock: Buy at Market');

  const handleSave = () => {
    if (!date) return;
    if ((type === 'Buy' || type === 'Sell') && (!symbol || !qty || !price)) return;
    if ((type === 'Deposit' || type === 'Withdrawal' || type === 'Adjustment') && !price) return; // Using price as the amount

    const parsedQty = qty ? parseFloat(qty) : undefined;
    const parsedPrice = parseFloat(price);
    const upperSymbol = symbol ? symbol.toUpperCase() : 'CASH';

    let newTx: Transaction = {
      date: new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      symbol: upperSymbol,
      type: type as any,
      qty: parsedQty,
      price: type === 'Buy' || type === 'Sell' ? parsedPrice : undefined,
      total: type === 'Buy' || type === 'Sell' ? parsedPrice * (parsedQty || 0) : parsedPrice,
      executionType: executionType
    };

    // Enrich immediately if we have the historical data
    if (allFetchedData && allFetchedData[upperSymbol] && (type === 'Buy' || type === 'Sell')) {
      newTx = enrichTransactionWithTCA(newTx, allFetchedData[upperSymbol]);
    }

    const newTransactions = [newTx, ...transactionsData];

    // Extract current prices to maintain them during recalculation
    const currentPrices: Record<string, number> = {};
    holdingsData.forEach(h => {
      currentPrices[h.symbol] = h.currentPrice;
    });

    const newHoldings = calculateHoldingsFromTransactions(newTransactions, holdingsData, currentPrices);

    updateData({
      transactionsData: newTransactions,
      holdingsData: newHoldings
    });

    setIsOpen(false);
    setSymbol('');
    setQty('');
    setPrice('');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Transaction
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Add Transaction</h2>
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
                  <label className="text-sm font-medium text-slate-700">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {(type === 'Buy' || type === 'Sell') && (
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
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>
                {(type === 'Buy' || type === 'Sell') && (
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
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {type === 'Buy' || type === 'Sell' ? 'Price' : 'Amount'}
                  </label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                {(type === 'Buy' || type === 'Sell') && (
                  <div className="space-y-2 md:col-span-2">
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
                )}
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Transaction
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
