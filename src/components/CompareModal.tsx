'use client';

import React, { useState } from 'react';
import { Product, Currency } from '@/types';
import { analyzeProduct } from '@/lib/prognosis';
import { convertCurrency, formatPrice } from '@/lib/currency';
import { X, Swords, Crown, TrendingDown, ArrowRight, Zap } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentProduct: Product;
  currency: Currency;
  onSelectProduct: (p: Product) => void;
}

export default function CompareModal({
  isOpen,
  onClose,
  products,
  currentProduct,
  currency,
  onSelectProduct,
}: CompareModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    currentProduct.id,
    products.find((p) => p.category === currentProduct.category && p.id !== currentProduct.id)?.id ||
      products[1]?.id,
  ]);

  if (!isOpen) return null;

  const comparedProducts = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const handleToggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      } else {
        setSelectedIds([selectedIds[0], selectedIds[1], id]);
      }
    }
  };

  // Find best value score winner
  const analyses = comparedProducts.map((p) => {
    const analysis = analyzeProduct(p);
    const latestCloseUSD = p.historyDaily[p.historyDaily.length - 1]?.close || p.msrpUSD;
    const price = convertCurrency(latestCloseUSD, 'USD', currency);
    // Value score = performance per 1000 in currency
    const valueRatio = (p.performance.scoreValue / Math.max(1, price)) * (currency === 'SEK' ? 1000 : 100);

    return {
      product: p,
      analysis,
      price,
      valueRatio: Math.round(valueRatio * 10) / 10,
    };
  });

  const bestValueItem = [...analyses].sort((a, b) => b.valueRatio - a.valueRatio)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-base font-mono">
                TPIR HARDWARE COMPARE ARENA
              </h3>
              <p className="text-slate-400 text-xs">
                Side-by-side financial valuation, performance index, and specs battle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Selector Chips */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-mono mr-2">Compare:</span>
          {products.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => handleToggleProduct(p.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{p.name.split(' ')[0]} {p.model.split(' ')[0]}</span>
                {isSelected && <span className="text-[10px] bg-blue-700 px-1 rounded">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`grid grid-cols-1 md:grid-cols-${comparedProducts.length} gap-6`}>
            {analyses.map(({ product, analysis, price, valueRatio }) => {
              const isBestValue = bestValueItem?.product.id === product.id;

              return (
                <div
                  key={product.id}
                  className={`flex flex-col bg-slate-950/70 border rounded-2xl p-5 relative overflow-hidden transition-all ${
                    isBestValue
                      ? 'border-emerald-500/60 shadow-xl shadow-emerald-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  {isBestValue && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-emerald-400" />
                      BEST VALUE CROWN
                    </div>
                  )}

                  {/* Header info */}
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {product.brand} • {product.category}
                  </div>
                  <h4 className="text-base font-bold text-slate-100 font-sans line-clamp-2 min-h-[48px]">
                    {product.name}
                  </h4>

                  {/* Price Block */}
                  <div className="mt-3 p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-baseline justify-between font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500">Market Price</div>
                      <div className="text-lg font-black text-slate-100">
                        {formatPrice(price, currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Deal Score</div>
                      <div className="text-sm font-bold text-blue-400">
                        {analysis.dealScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Performance to Price Ratio */}
                  <div className="mt-3 p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl flex flex-col gap-1 font-mono text-xs">
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span>Performance Metric:</span>
                      <strong className="text-slate-200">{product.performance.scoreLabel}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                      <span>Value Ratio:</span>
                      <strong className="text-emerald-400">
                        {valueRatio} pts / {currency === 'SEK' ? '1,000 kr' : '100 ' + currency}
                      </strong>
                    </div>
                  </div>

                  {/* Key Specifications */}
                  <div className="mt-4 flex-1">
                    <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Key Hardware Architecture
                    </div>
                    <div className="flex flex-col gap-1.5 font-mono text-xs">
                      {Object.entries(product.specs).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between py-1 border-b border-slate-850/60 text-[11px]"
                        >
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-slate-300 font-semibold">{v}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-1 text-[11px]">
                        <span className="text-slate-500">TDP Power:</span>
                        <span className="text-amber-400 font-bold">{product.powerWatts}W</span>
                      </div>
                    </div>
                  </div>

                  {/* Switch to this product button */}
                  <button
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="mt-5 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    <span>View Terminal Chart</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
