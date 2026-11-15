'use client';

import React from 'react';
import { Product, Currency, RetailerPrice } from '@/types';
import { convertCurrency, formatPrice } from '@/lib/currency';
import { ExternalLink, Check, X, ShieldCheck } from 'lucide-react';

interface RetailerOrderbookProps {
  product: Product;
  currency: Currency;
}

export default function RetailerOrderbook({ product, currency }: RetailerOrderbookProps) {
  // Sort retailers by normalized price ascending
  const sortedRetailers = [...product.retailers].sort((a, b) => {
    const priceA = convertCurrency(a.price, a.currency, currency);
    const priceB = convertCurrency(b.price, b.currency, currency);
    return priceA - priceB;
  });

  const bestPrice = sortedRetailers[0]
    ? convertCurrency(sortedRetailers[0].price, sortedRetailers[0].currency, currency)
    : 0;

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-slate-100 text-xs tracking-wider uppercase font-mono">
            RETAILER ORDERBOOK (LIVE QUOTES)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {sortedRetailers.length} Retailers
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sortedRetailers.map((r, index) => {
          const converted = convertCurrency(r.price, r.currency, currency);
          const isBest = index === 0 && r.inStock;
          const diffFromBest = converted - bestPrice;

          return (
            <div
              key={r.retailerId}
              className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                isBest
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-[10px] font-mono shrink-0 ${
                    r.country === 'SE'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  }`}
                  title={r.country === 'SE' ? 'Swedish Retailer' : 'International Retailer'}
                >
                  {r.country}
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200 text-xs truncate">
                      {r.retailerName}
                    </span>
                    {isBest && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        BEST ASK
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                    {r.inStock ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3" />
                        In Stock {r.stockCount ? `(${r.stockCount} left)` : ''}
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-mono">
                        <X className="w-3 h-3" />
                        Out of Stock
                      </span>
                    )}
                    <span className="text-slate-500">• {r.lastUpdated}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-slate-100">
                    {formatPrice(converted, currency)}
                  </div>
                  {r.currency !== currency && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      Orig: {formatPrice(r.price, r.currency)}
                    </div>
                  )}
                  {diffFromBest > 0 && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      +{formatPrice(diffFromBest, currency)}
                    </div>
                  )}
                </div>

                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center transition-all ${
                    isBest
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="View at Store"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
