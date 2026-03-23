import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { useData } from '../context/DataContext';
import { Plus, Edit2, Save, Trash2 } from 'lucide-react';

export function BenchmarkManager() {
  const { benchmarks, updateData, selectedBenchmark, setSelectedBenchmark } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [newBenchmark, setNewBenchmark] = useState({ id: '', name: '', expenseRatio: 0, marketCap: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newBenchmark.id || !newBenchmark.name) return;
    updateData({ benchmarks: [...benchmarks, newBenchmark] });
    setNewBenchmark({ id: '', name: '', expenseRatio: 0, marketCap: 0 });
  };

  const handleRemove = (id: string) => {
    const newBenchmarks = benchmarks.filter(b => b.id !== id);
    updateData({ benchmarks: newBenchmarks });
    if (selectedBenchmark === id && newBenchmarks.length > 0) {
      setSelectedBenchmark(newBenchmarks[0].id);
    }
  };

  const handleUpdate = (id: string, updated: any) => {
    updateData({
      benchmarks: benchmarks.map(b => b.id === id ? { ...b, ...updated } : b)
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display">Manage Benchmarks</CardTitle>
          <CardDescription>Add or update custom benchmark definitions</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Close' : 'Manage'}
        </Button>
      </CardHeader>
      {isEditing && (
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticker</label>
              <input 
                type="text" 
                value={newBenchmark.id} 
                onChange={e => setNewBenchmark({ ...newBenchmark, id: e.target.value.toUpperCase() })}
                placeholder="e.g. SPY"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
              <input 
                type="text" 
                value={newBenchmark.name} 
                onChange={e => setNewBenchmark({ ...newBenchmark, name: e.target.value })}
                placeholder="Benchmark Name"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exp. Ratio (%)</label>
              <input 
                type="number" 
                step="0.01"
                value={newBenchmark.expenseRatio} 
                onChange={e => setNewBenchmark({ ...newBenchmark, expenseRatio: parseFloat(e.target.value) })}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Market Cap ($B)</label>
              <input 
                type="number" 
                step="0.1"
                value={newBenchmark.marketCap ? newBenchmark.marketCap / 1e9 : 0} 
                onChange={e => setNewBenchmark({ ...newBenchmark, marketCap: parseFloat(e.target.value) * 1e9 })}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <Button onClick={handleAdd} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Benchmark
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Ticker</th>
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold text-right">Exp. Ratio</th>
                  <th className="px-6 py-4 font-bold text-right">Market Cap</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {benchmarks.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs border border-indigo-100">
                        {b.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === b.id ? (
                        <input 
                          type="text" 
                          value={b.name} 
                          onChange={e => handleUpdate(b.id, { name: e.target.value })}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none"
                        />
                      ) : b.name}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {editingId === b.id ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={b.expenseRatio} 
                          onChange={e => handleUpdate(b.id, { expenseRatio: parseFloat(e.target.value) })}
                          className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-right outline-none"
                        />
                      ) : `${(b.expenseRatio || 0).toFixed(2)}%`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {editingId === b.id ? (
                        <input 
                          type="number" 
                          step="0.1"
                          value={b.marketCap ? b.marketCap / 1e9 : 0} 
                          onChange={e => handleUpdate(b.id, { marketCap: parseFloat(e.target.value) * 1e9 })}
                          className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-right outline-none"
                        />
                      ) : `$${((b.marketCap || 0) / 1e9).toFixed(1)}B`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingId(editingId === b.id ? null : b.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {editingId === b.id ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                        </button>
                        <button 
                          onClick={() => handleRemove(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
