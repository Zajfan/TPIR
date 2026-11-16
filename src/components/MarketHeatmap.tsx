'use client';

import React, { useState } from 'react';
import { Product, Currency, HardwareCategory } from '@/types';
import { analyzeProduct } from '@/lib/prognosis';
import { convertCurrency, formatPrice, formatPercent } from '@/lib/currency';
import {
  TrendingDown,
  TrendingUp,
  Cpu,
  HardDrive,
  Gamepad2,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MarketHeatmapProps {
  products: Product[];
  currency: Currency;
  onSelectProduct: (product: Product) => void;
  selectedProductId: string;
}

export default function MarketHeatmap({
  products,
  currency,
  onSelectProduct,
  selectedProductId,
}: MarketHeatmapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dealScore' | 'priceDrop' | 'priceAsc' | 'priceDesc'>('dealScore');

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Hardware', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'gpu', label: 'GPUs', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'cpu', label: 'CPUs', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'ram', label: 'RAM', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'ssd', label: 'SSDs', icon: <HardDrive className="w-3.5 h-3.5" /> },
    { id: 'console', label: 'Consoles', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'server', label: 'Servers & HDDs', icon: <Server className="w-3.5 h-3.5" /> },
  ];

  const filtered = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'server') return p.category === 'server' || p.category === 'hdd';
    return p.category === selectedCategory;
  });

  const analyzed = filtered.map((p) => {
    const analysis = analyzeProduct(p);
    const history = p.historyDaily;
    const currentClose = history[history.length - 1]?.close || p.msrpUSD;
    const pastClose = history[Math.max(0, history.length - 10)]?.close || currentClose;
    const changePct = ((currentClose - pastClose) / pastClose) * 100;
    const currentPrice = convertCurrency(currentClose, 'USD', currency);

    return {
      product: p,
      analysis,
      currentPrice,
      changePct,
    };
  });

  const sorted = [...analyzed].sort((a, b) => {
    if (sortBy === 'dealScore') return b.analysis.dealScore - a.analysis.dealScore;
    if (sortBy === 'priceDrop') return a.changePct - b.changePct; // most negative first
    if (sortBy === 'priceAsc') return a.currentPrice - b.currentPrice;
    if (sortBy === 'priceDesc') return b.currentPrice - a.currentPrice;
    return 0;
  });

  return (
    <div className="flex flex-col gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Category Tabs & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="dealScore">Best Deal Score</option>
            <option value="priceDrop">Biggest Recent Drop</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid of Hardware Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {sorted.map(({ product, analysis, currentPrice, changePct }) => {
          const isSelected = product.id === selectedProductId;
          const isDrop = changePct <= 0;

          return (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                isSelected
                  ? 'bg-blue-950/30 border-blue-500/80 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Category chip & Deal score */}
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-800/80 text-slate-400 border border-slate-700/50">
                  {product.category}
                </span>

                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border ${
                    analysis.dealScore >= 75
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : analysis.dealScore >= 50
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  Score: {analysis.dealScore}/100
                </div>
              </div>

              {/* Title & Brand */}
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                  {product.name}
                </h4>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {Object.entries(product.specs).slice(0, 2).map(([k, v]) => `${v}`).join(' • ')}
                </div>
              </div>

              {/* Price and 30d change */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-end justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">Current Price</div>
                  <div className="font-mono font-bold text-base text-slate-100">
                    {formatPrice(currentPrice, currency)}
                  </div>
                </div>

                <div
                  className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                    isDrop ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isDrop ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(changePct)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
