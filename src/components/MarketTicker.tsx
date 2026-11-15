'use client';

import React from 'react';
import { Product, Currency } from '@/types';
import { convertCurrency, formatPrice, formatPercent } from '@/lib/currency';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketTickerProps {
  products: Product[];
  currency: Currency;
  onSelectProduct: (product: Product) => void;
  selectedProductId: string;
}

export default function MarketTicker({
  products,
  currency,
  onSelectProduct,
  selectedProductId,
}: MarketTickerProps) {
  return (
    <div className="w-full bg-slate-950/80 border-b border-slate-800/80 overflow-x-auto no-scrollbar py-2 px-4 flex items-center gap-4 select-none backdrop-blur-md">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800 text-xs font-mono font-bold tracking-wider text-blue-400 uppercase shrink-0">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
        MARKET PULSE
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {products.map((p) => {
          const history = p.history;
          const currentClose = history[history.length - 1]?.close || p.msrpUSD;
          const prevClose = history[history.length - 2]?.close || currentClose;
          const changePct = ((currentClose - prevClose) / prevClose) * 100;
          const isPositive = changePct >= 0;
          const isSelected = p.id === selectedProductId;

          const price = convertCurrency(currentClose, 'USD', currency);

          return (
            <button
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className={`flex items-center gap-2.5 px-3 py-1 rounded-md text-xs font-mono transition-all border ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500/60 text-white'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <span className="font-semibold text-slate-200">{p.brand} {p.model.split(' ')[0]}</span>
              <span className="text-slate-400">{formatPrice(price, currency)}</span>
              <span
                className={`flex items-center font-bold ${
                  isPositive ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {formatPercent(changePct)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
