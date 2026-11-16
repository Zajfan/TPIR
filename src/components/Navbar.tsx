'use client';

import React from 'react';
import { CURRENCY_NAMES } from '@/lib/currency';
import { Product, PriceAlert, Currency, WatchlistPortfolio } from '@/types';
import {
  TrendingDown,
  Search,
  Bell,
  Code2,
  Radio,
  Swords,
  FolderHeart,
} from 'lucide-react';

interface NavbarProps {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
  alerts: PriceAlert[];
  onOpenAlerts: () => void;
  onOpenCompare: () => void;
  onOpenPortfolios: () => void;
  portfolioCount: number;
}

export default function Navbar({
  currency,
  onCurrencyChange,
  products,
  onSelectProduct,
  alerts,
  onOpenAlerts,
  onOpenCompare,
  onOpenPortfolios,
  portfolioCount,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  const filtered = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const activeAlertCount = alerts.filter((a) => a.active).length;

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-base tracking-wider text-slate-100">
                TPIR<span className="text-blue-500">.TERMINAL</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                v0.2-PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
              The Price is Right • Hardware Market Exchange
            </div>
          </div>
        </div>

        {/* Global Hardware Search */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search RTX 4080, Ryzen 9800X3D, PS5 Pro, SSDs..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Quick search popup */}
          {showSearchResults && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden z-50">
              {filtered.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p);
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 border-b border-slate-800/60 last:border-0 flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{p.category}</div>
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono font-bold">VIEW QUOTE →</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Tools: Compare, Portfolios, Currency, Alerts, Github */}
        <div className="flex items-center gap-2.5">
          {/* Compare Arena Button */}
          <button
            onClick={onOpenCompare}
            className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            title="Compare Hardware Arena"
          >
            <Swords className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compare</span>
          </button>

          {/* Portfolios / Lists Button */}
          <button
            onClick={onOpenPortfolios}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            title="Portfolios & Build Lists"
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portfolios</span>
            <span className="text-[10px] px-1 rounded bg-indigo-900/60 text-indigo-200 font-bold">
              {portfolioCount}
            </span>
          </button>

          {/* Multi-Currency Switcher (SEK / EUR / USD) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => onCurrencyChange('SEK')}
              title="Swedish Krona (SEK)"
              className={`px-2 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                currency === 'SEK'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              kr SEK
            </button>
            <button
              onClick={() => onCurrencyChange('EUR')}
              title="Euro (EUR)"
              className={`px-2 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                currency === 'EUR'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              € EUR
            </button>
            <button
              onClick={() => onCurrencyChange('USD')}
              title="US Dollar (USD)"
              className={`px-2 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* Target Buy Triggers / Alerts Modal Button */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Price Triggers & Limit Orders"
          >
            <Bell className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Open Source / Github Link */}
          <a
            href="https://github.com/Zajfan/TPIR"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors hidden sm:flex items-center"
            title="GitHub Repository"
          >
            <Code2 className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
