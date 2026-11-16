'use client';

import React from 'react';
import { TruthIndexAnalysis, Currency } from '@/types';
import { formatPrice } from '@/lib/currency';
import { ShieldAlert, ShieldCheck, HelpCircle } from 'lucide-react';

interface TruthIndexBadgeProps {
  truthIndex: TruthIndexAnalysis;
  currency: Currency;
}

export default function TruthIndexBadge({ truthIndex, currency }: TruthIndexBadgeProps) {
  const { isFakeDiscount, claimedDiscountPercent, realDiscountPercent, preSaleInflationPercent, verdict } = truthIndex;

  if (isFakeDiscount) {
    return (
      <div className="w-full bg-rose-950/40 border border-rose-500/50 rounded-xl p-3.5 flex items-start gap-3 text-xs shadow-lg shadow-rose-950/20 animate-pulse">
        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-rose-300 uppercase tracking-wider">
              FAKE DISCOUNT RADAR DETECTED
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              ARTIFICIAL MARKUP
            </span>
          </div>
          <p className="text-slate-300 mt-1 leading-relaxed">
            {verdict}
          </p>
          <div className="flex flex-wrap gap-4 mt-2 pt-2 border-t border-rose-500/20 font-mono text-[11px]">
            <span className="text-rose-400">Claimed Discount: <strong>-{claimedDiscountPercent}%</strong></span>
            <span className="text-amber-400">Pre-Sale Price Markup: <strong>+{preSaleInflationPercent}%</strong></span>
            <span className="text-slate-300">True Real Discount: <strong>-{realDiscountPercent}%</strong></span>
          </div>
        </div>
      </div>
    );
  }

  if (realDiscountPercent >= 10) {
    return (
      <div className="w-full bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-mono font-bold text-emerald-300 uppercase tracking-wider">
            VERIFIED GENUINE DISCOUNT
          </span>
          <p className="text-slate-300 mt-0.5 leading-relaxed">
            {verdict}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
