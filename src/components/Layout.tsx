import React from 'react';
import { 
  LayoutDashboard, 
  List, 
  BarChart2, 
  Activity, 
  History, 
  Bot, 
  HelpCircle,
  Bell,
  Search,
  ChevronDown,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  lastSynced: Date | null;
  isSyncing: boolean;
  onSync: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  totalValue: number;
  dailyChange: number;
  dailyChangePct: number;
}

export function Layout({ 
  children, 
  activeTab, 
  onTabChange, 
  lastSynced, 
  isSyncing, 
  onSync,
  onAnalyze,
  isAnalyzing,
  totalValue,
  dailyChange,
  dailyChangePct
}: LayoutProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'holdings', label: 'Holdings', icon: List },
    { id: 'benchmark', label: 'Benchmark', icon: BarChart2 },
    { id: 'analysis', label: 'Analysis', icon: Activity },
    { id: 'transactions', label: 'History', icon: History },
    { id: 'ai', label: 'Co-Pilot', icon: Bot },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-terminal-bg text-terminal-text overflow-hidden font-sans">
      {/* Sidebar Rail - Desktop Only */}
      <aside className="hidden md:flex w-16 flex-col items-center py-6 border-r border-terminal-border bg-terminal-card/40 backdrop-blur-md z-50">
        <div className="mb-8">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative p-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-terminal-muted hover:text-terminal-text hover:bg-white/5'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-2 py-1 bg-[#151921] text-white text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10">
                {tab.label}
              </div>

              {/* Active Indicator */}
              {activeTab === tab.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <button className="p-3 text-terminal-muted hover:text-terminal-text transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all">
            JD
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top HUD (Heads-Up Display) */}
        <header className="h-16 border-b border-terminal-border bg-terminal-card/20 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-40">
          <div className="flex items-center gap-4 md:gap-12">
            <div className="flex flex-col">
              <span className="tech-label">Portfolio Value</span>
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-sm md:text-xl font-bold font-mono tracking-tight">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] md:text-xs font-bold font-mono ${dailyChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {dailyChange >= 0 ? '+' : ''}{dailyChangePct.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <div className="flex flex-col">
                <span className="tech-label">Market Regime</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-tighter">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Risk-On / Bullish
                </span>
              </div>
              <div className="flex flex-col">
                <span className="tech-label">Last Sync</span>
                <span className="text-xs font-bold text-terminal-text font-mono">
                  {lastSynced ? lastSynced.toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden xl:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-terminal-muted" />
              <input 
                type="text" 
                placeholder="COMMAND SEARCH..." 
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-64 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSync}
                disabled={isSyncing}
                className="h-7 md:h-8 px-2 md:px-3 border-white/10 bg-white/5 hover:bg-white/10 text-[8px] md:text-[10px] font-bold uppercase tracking-widest gap-1.5 md:gap-2"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">Sync</span>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="h-7 md:h-8 px-2 md:px-3 bg-indigo-600 hover:bg-indigo-700 text-[8px] md:text-[10px] font-bold uppercase tracking-widest gap-1.5 md:gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Bot className={`h-3 w-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
                {!isAnalyzing && <span className="xs:hidden">AI</span>}
              </Button>
            </div>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto scrollbar-hide p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-[1600px] mx-auto min-h-full flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              
              {/* Terminal Footer */}
              <footer className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-terminal-muted">
                      System Status: Operational
                    </span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/5 hidden md:block" />
                  <span className="text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
                    v2.4.0-stable
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted uppercase tracking-widest">
                  <span>Made by</span>
                  <a 
                    href="https://github.com/rhshah" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold"
                  >
                    Ronak Shah (@rhshah)
                  </a>
                  <span>using</span>
                  <span className="text-terminal-text font-bold">Google AI Studio</span>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden h-16 border-t border-terminal-border bg-terminal-card/80 backdrop-blur-xl flex items-center justify-around px-2 z-50">
        {tabs.slice(0, 6).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'text-indigo-400' 
                : 'text-terminal-muted'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">{tab.label === 'Co-Pilot' ? 'AI' : tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
