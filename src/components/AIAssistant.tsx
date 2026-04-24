import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { transactionsData } from '../data';
import { useData } from '../context/DataContext';
import ReactMarkdown from 'react-markdown';
import { DataSourceFooter } from './DataSourceFooter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const { holdingsData } = useData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI Portfolio Assistant. I have access to your ETF holdings and transaction history. How can I help you analyze your portfolio today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = () => {
    if (chatRef.current) return chatRef.current;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is missing.');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const portfolioContext = `
      Current Holdings:
      ${JSON.stringify(holdingsData, null, 2)}
      
      Transaction History:
      ${JSON.stringify(transactionsData, null, 2)}
    `;

    const systemInstruction = `You are an institutional Portfolio Strategist and AI Assistant evaluating an ETF portfolio based on the "Decoupling Economy" framework for 2026.
    
    CRITICAL FRAMEWORK:
    Evaluate the portfolio utilizing an "80/20 Core-Satellite" implementation of the modernized 60/40 portfolio.
    - Core (80% target): Broad-market beta, low-cost (e.g., VTI, VXUS, BND, VNQ, GLTR, BAB, AGG).
    - Satellite (20% target): Tactical alpha responding to 2026 macro signals (e.g., XFIV for Yield Curve Steepening, VGT for AI infra "Gigawatt Ceiling", PCMM for Private Credit, SLV for Silver Catch-Up, SCHY for intl div, TXXI for munis).
    - Drift Threshold: Rebalance actively if an asset class drifts by 5 percentage points.
    
    You have access to the user's current holdings and transaction history. 
    Answer questions based on this data through the lens of this specific 80/20 framework. Be concise, professional, and brutally honest about tracking error and drift.
    Do not provide financial advice, just analyze the data provided and give insights.
    
    Context:
    ${portfolioContext}`;

    chatRef.current = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
      },
    });
    
    return chatRef.current;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chat = initChat();
      const response = await chat.sendMessage({ message: userMessage.content });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'Sorry, I could not generate a response.',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please ensure your API key is configured correctly.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="terminal-card flex flex-col h-[600px] md:h-[700px] animate-slam">
      <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-row items-center justify-between">
        <div>
          <div className="tech-label text-indigo-400 mb-1">Neural Interface</div>
          <h3 className="text-xl font-bold font-display tracking-tight flex items-center gap-3">
            <Bot className="h-5 w-5 text-indigo-400" />
            Portfolio Assistant
          </h3>
          <p className="text-[10px] text-terminal-muted uppercase font-bold mt-1 tracking-widest">
            Gemini 3.1 Flash • Real-time Portfolio Context
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`rounded-2xl px-5 py-4 max-w-[85%] md:max-w-[75%] border transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-indigo-600/10 border-indigo-500/30 text-terminal-text rounded-tr-none shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                  : 'bg-white/[0.03] border-white/10 text-terminal-muted rounded-tl-none'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:text-terminal-muted prose-strong:text-terminal-text prose-code:text-indigo-400">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm font-mono leading-relaxed">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-terminal-muted">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl px-5 py-4 bg-white/[0.03] border border-white/10 rounded-tl-none flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span className="ml-3 text-[10px] font-mono text-terminal-muted uppercase tracking-widest animate-pulse">Processing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-white/10 bg-white/[0.01]">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query portfolio data..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm font-mono text-terminal-text placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all min-h-[56px] max-h-[150px]"
              rows={1}
            />
            <div className="absolute right-4 bottom-4 text-[8px] font-mono text-white/10 uppercase hidden md:block">
              Shift + Enter for new line
            </div>
          </div>
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()} 
            size="icon" 
            className="shrink-0 h-[56px] w-[56px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-6 pb-6">
        <DataSourceFooter 
          pageName="AI Portfolio Assistant" 
          interpretation="The AI Assistant provides real-time answers to your portfolio questions. It has access to your current holdings and transaction history, allowing it to perform custom calculations, explain risk metrics, or summarize your asset allocation in plain English."
        />
      </div>
    </div>
  );
}
