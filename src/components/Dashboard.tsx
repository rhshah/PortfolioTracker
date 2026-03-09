import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Button } from './ui/Button';
import { RefreshCw, LayoutDashboard, List, History, Bot, BarChart2 } from 'lucide-react';
import { Overview } from './Overview';
import { Holdings } from './Holdings';
import { Transactions } from './Transactions';
import { AIAssistant } from './AIAssistant';
import { BenchmarkComparison } from './BenchmarkComparison';

export function Dashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate network request
    setTimeout(() => {
      setIsSyncing(false);
      setLastSynced(new Date());
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">ETF Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 hidden sm:block">
              {lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : 'Not synced'}
            </div>
            <Button onClick={handleSync} disabled={isSyncing} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-200/50 p-1">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="gap-2">
                <BarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">Benchmark</span>
              </TabsTrigger>
              <TabsTrigger value="holdings" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Holdings</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Transactions</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">AI Assistant</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <Overview />
          </TabsContent>
          <TabsContent value="benchmark">
            <BenchmarkComparison />
          </TabsContent>
          <TabsContent value="holdings">
            <Holdings />
          </TabsContent>
          <TabsContent value="transactions">
            <Transactions />
          </TabsContent>
          <TabsContent value="ai">
            <AIAssistant />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
