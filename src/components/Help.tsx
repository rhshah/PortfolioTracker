import React from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  Terminal,
  Cpu,
  Search,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { DataSourceFooter } from './DataSourceFooter';

export function Help() {
  const sections = [
    {
      title: "Core Operations",
      icon: Terminal,
      items: [
        {
          label: "Sync Market Data",
          desc: "Triggers a real-time fetch from Yahoo Finance. Updates all adjusted closing prices, cost basis calculations, and performance charts across the terminal.",
          icon: RefreshCw
        },
        {
          label: "AI Risk Briefing",
          desc: "Leverages Gemini 3.1 Pro to perform a 'Brutally Honest' analysis. Cross-references your holdings with the last 14 days of macro news and correlation data.",
          icon: Cpu
        },
        {
          label: "Command Search",
          desc: "Universal search bar for navigating assets, benchmarks, and terminal commands. (Institutional shortcut: CMD+K)",
          icon: Search
        }
      ]
    },
    {
      title: "Risk Diagnostics",
      icon: ShieldAlert,
      items: [
        {
          label: "Beta (Sensitivity)",
          desc: "Measures systemic risk relative to the benchmark. A Beta of 1.20 implies the asset is 20% more volatile than the market index.",
          icon: Activity
        },
        {
          label: "Sharpe Ratio",
          desc: "The gold standard for risk-adjusted returns. Calculates excess return per unit of volatility. Values > 1.0 are considered professional grade.",
          icon: ShieldCheck
        },
        {
          label: "Tracking Error",
          desc: "Measures the divergence between an ETF's price behavior and its underlying benchmark. Critical for passive strategy validation.",
          icon: BarChart3
        }
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-slam">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-indigo-400">
          <HelpCircle className="h-5 w-5" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">System Documentation</span>
        </div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Terminal Operations Guide</h1>
        <p className="text-terminal-muted max-w-2xl">
          Master the institutional-grade diagnostic tools and AI-driven risk models integrated into the ETF Pulse Terminal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Start */}
        <div className="lg:col-span-2 space-y-8">
          {sections.map((section, idx) => (
            <div key={idx} className="terminal-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <section.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold font-display tracking-tight">{section.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-lg bg-white/5 text-terminal-muted group-hover:text-indigo-400 transition-colors">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold mb-1 text-terminal-text">{item.label}</h4>
                        <p className="text-xs text-terminal-muted leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pro Tip */}
          <div className="p-8 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="h-24 w-24 text-indigo-400" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-indigo-400 mb-4">
                <Zap className="h-5 w-5" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Advanced Strategy</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Leverage the AI Co-Pilot</h3>
              <p className="text-sm text-indigo-100/70 max-w-xl leading-relaxed">
                The Co-Pilot isn't just a chatbot. Ask it to perform complex tasks like "Calculate the impact of a 50bps Fed hike on my duration-sensitive holdings" or "Identify the top 3 cluster risks in my current asset allocation."
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: System Specs */}
        <div className="space-y-8">
          <div className="terminal-card p-6">
            <div className="tech-label mb-4">System Architecture</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[10px] font-mono text-terminal-muted uppercase">Engine</span>
                <span className="text-[10px] font-mono text-terminal-text font-bold uppercase">Gemini 3.1 Pro</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[10px] font-mono text-terminal-muted uppercase">Data Feed</span>
                <span className="text-[10px] font-mono text-terminal-text font-bold uppercase">Yahoo Finance API</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[10px] font-mono text-terminal-muted uppercase">Math Library</span>
                <span className="text-[10px] font-mono text-terminal-text font-bold uppercase">Custom FinanceMath.ts</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[10px] font-mono text-terminal-muted uppercase">Latency</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">~120ms (Optimized)</span>
              </div>
            </div>
          </div>

          <div className="terminal-card p-6 bg-indigo-600/5 border-indigo-500/20">
            <div className="tech-label mb-4 text-indigo-400">Support Protocol</div>
            <p className="text-xs text-terminal-muted leading-relaxed mb-4">
              For technical inquiries or bug reports, please contact the lead engineer via the secure GitHub channel.
            </p>
            <a 
              href="https://github.com/rhshah" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
            >
              <MessageSquare className="h-3 w-3" />
              Open Secure Ticket
            </a>
          </div>
        </div>
      </div>

      <DataSourceFooter 
        pageName="Help & Documentation" 
        interpretation="The Help section provides a comprehensive guide to the platform's features, metrics, and AI capabilities. It explains the methodology behind our risk analysis and provides instructions on how to effectively use the synchronization and analysis tools."
      />
    </div>
  );
}

