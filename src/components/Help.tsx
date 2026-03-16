import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  ShieldAlert, 
  Bell, 
  User, 
  Activity, 
  TrendingUp, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { DataSourceFooter } from './DataSourceFooter';

export function Help() {
  return (
    <div className="space-y-6 pb-12">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 font-display">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            Documentation & Support
          </CardTitle>
          <CardDescription>
            Master the ETF Pulse platform to optimize your investment strategy.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-12">
          {/* Header Icons Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Interface Guide
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Notifications (Bell)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The notification center tracks critical portfolio events such as significant price movements, rebalancing alerts, and AI report completions. Currently, it serves as a visual placeholder for future real-time alerting features.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">User Profile (JD)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The Profile dropdown provides access to account settings, security preferences, and API key management. "JD" stands for the default demo user (John Doe).
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-12 md:grid-cols-2">
            {/* Core Features */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  Core Workflow
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-800">1. Data Synchronization</h5>
                    <p className="text-sm text-slate-600">
                      Click <strong>Sync Market Data</strong> to pull the latest adjusted closing prices from Yahoo Finance. This updates your portfolio value, gain/loss metrics, and performance charts.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-800">2. AI Analysis</h5>
                    <p className="text-sm text-slate-600">
                      The <strong>Analyze</strong> button triggers a deep-dive report. Gemini AI cross-references your holdings with current macro trends to identify risks and opportunities.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-800">3. Benchmark Comparison</h5>
                    <p className="text-sm text-slate-600">
                      Every ETF is compared against a primary benchmark (e.g., SPY for US Equities). Use the <strong>Benchmark</strong> tab to see detailed correlation and tracking error data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                  Risk Metrics Explained
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 rounded-lg border border-slate-100 text-xs">
                    <span className="font-bold text-slate-900">Beta:</span> Measures sensitivity to the benchmark. A beta of 1.2 means the ETF tends to move 20% more than the market.
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 text-xs">
                    <span className="font-bold text-slate-900">Sharpe Ratio:</span> Risk-adjusted return. Higher is better; it indicates how much excess return you get for the extra volatility.
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 text-xs">
                    <span className="font-bold text-slate-900">Alpha:</span> The "excess return" generated by the investment relative to the return of a benchmark index.
                  </div>
                </div>
              </div>
            </div>

            {/* AI & Data */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <MessageSquare className="h-5 w-5 text-indigo-500" />
                  AI Intelligence
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  ETF Pulse leverages <strong>Gemini 3.1 Pro</strong> to provide institutional-grade analysis.
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="h-5 w-5 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-3 w-3 text-indigo-600" />
                    </div>
                    <span className="text-sm text-slate-600"><strong>Systematic Risk:</strong> AI identifies how broader market trends (inflation, interest rates) impact your portfolio.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="h-5 w-5 rounded bg-emerald-50 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-600"><strong>Performance Attribution:</strong> Understand exactly which holdings are driving your gains or losses.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-indigo-600 text-white space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pro Tip
                </h4>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  Use the <strong>AI Assistant</strong> to ask specific questions like "How would a 50bps rate hike affect my tech holdings?" or "Which of my ETFs has the highest correlation to gold?"
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <DataSourceFooter 
        pageName="Help & Documentation" 
        interpretation="The Help section provides a comprehensive guide to the platform's features, metrics, and AI capabilities. It explains the methodology behind our risk analysis and provides instructions on how to effectively use the synchronization and analysis tools."
      />
    </div>
  );
}
