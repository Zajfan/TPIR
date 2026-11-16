'use client';

import React, { useState } from 'react';
import { Product, Currency, TechnicalAnalysis, PriceAlert } from '@/types';
import { convertCurrency, formatPrice, formatPercent } from '@/lib/currency';
import TruthIndexBadge from '@/components/TruthIndexBadge';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Sparkles,
  Zap,
  Target,
  Info,
  FolderPlus,
  Layers,
} from 'lucide-react';

interface PrognosisCardProps {
  product: Product;
  analysis: TechnicalAnalysis;
  currency: Currency;
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  activeAlerts: PriceAlert[];
  onAddToPortfolio: (product: Product) => void;
}

export default function PrognosisCard({
  product,
  analysis,
  currency,
  onAddAlert,
  activeAlerts,
  onAddToPortfolio,
}: PrognosisCardProps) {
  const currentPriceUSD = product.historyDaily[product.historyDaily.length - 1]?.close || product.msrpUSD;
  const currentPrice = convertCurrency(currentPriceUSD, 'USD', currency);
  const fairValue = convertCurrency(analysis.fairValuePrice, 'USD', currency);

  const defaultTarget = Math.round(currentPrice * 0.92);
  const [targetInput, setTargetInput] = useState<number>(defaultTarget);
  const [alertSaved, setAlertSaved] = useState<boolean>(false);
  const [portfolioAdded, setPortfolioAdded] = useState<boolean>(false);

  const existingAlert = activeAlerts.find(
    (a) => a.productId === product.id && a.targetCurrency === currency
  );

  const handleSetAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput || targetInput <= 0) return;

    onAddAlert({
      productId: product.id,
      productName: product.name,
      targetPrice: targetInput,
      targetCurrency: currency,
      active: true,
    });
    setAlertSaved(true);
    setTimeout(() => setAlertSaved(false), 2500);
  };

  const handleAddToList = () => {
    onAddToPortfolio(product);
    setPortfolioAdded(true);
    setTimeout(() => setPortfolioAdded(false), 2000);
  };

  const getRatingBadge = () => {
    switch (analysis.rating) {
      case 'STRONG_BUY':
        return {
          label: 'STRONG BUY (DEEP VALUE)',
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
          gaugeColor: '#10b981',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        };
      case 'GOOD_DEAL':
        return {
          label: 'GOOD DEAL (FAVORABLE)',
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/50',
          gaugeColor: '#14b8a6',
          icon: <Sparkles className="w-4 h-4 text-teal-300" />,
        };
      case 'FAIR_PRICE':
        return {
          label: 'FAIR PRICE (HOLD / NEUTRAL)',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
          gaugeColor: '#3b82f6',
          icon: <Info className="w-4 h-4 text-blue-300" />,
        };
      case 'OVERPRICED':
        return {
          label: 'OVERPRICED (WAIT FOR CORRECTION)',
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
          gaugeColor: '#f59e0b',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      case 'DON_T_BUY':
      default:
        return {
          label: "DON'T BUY (SCALPED / PEAK)",
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
          gaugeColor: '#ef4444',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
        };
    }
  };

  const badge = getRatingBadge();

  return (
    <div className="flex flex-col gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide uppercase">
            AI Market Prognosis & Signals
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border flex items-center gap-1.5 ${badge.bg}`}>
            {badge.icon}
            {badge.label}
          </div>
        </div>
      </div>

      {/* Truth Index Fake Discount Warning (if applicable) */}
      <TruthIndexBadge truthIndex={analysis.truthIndex} currency={currency} />

      {/* Deal Score Gauge Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-mono">Deal Rating Score</span>
          <span className="font-bold font-mono text-base text-slate-100">
            {analysis.dealScore} <span className="text-xs text-slate-500">/ 100</span>
          </span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out shadow-lg"
            style={{
              width: `${analysis.dealScore}%`,
              backgroundColor: badge.gaugeColor,
              boxShadow: `0 0 12px ${badge.gaugeColor}88`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0 (Extreme Scalp)</span>
          <span>50 (Fair MSRP)</span>
          <span>100 (Historic Low)</span>
        </div>
      </div>

      {/* Valuation Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 py-1">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 font-mono">Fair Value Est.</div>
          <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
            {formatPrice(fairValue, currency)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Spread: {formatPrice(currentPrice - fairValue, currency)}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400 font-mono">30-Day Prognosis</div>
          <div
            className={`text-base font-bold font-mono mt-0.5 flex items-center gap-1 ${
              analysis.forecastedChange30dPct < 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {analysis.forecastedChange30dPct < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            {formatPercent(analysis.forecastedChange30dPct)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {analysis.forecastedChange30dPct < 0 ? 'Projected to drop' : 'Projected to rise'}
          </div>
        </div>
      </div>

      {/* RVI & Cycle Note */}
      <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3.5 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-mono">Hardware RVI (Relative Value):</span>
          <span className="font-mono font-bold text-slate-200">
            {analysis.rvi} <span className="text-slate-500 font-normal">(&lt;30 = Bargain, &gt;70 = Overpriced)</span>
          </span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[13px]">
          {analysis.recommendationReason}
        </p>
        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span><strong className="text-slate-300">Market Cycle:</strong> {analysis.marketCycleNote}</span>
        </div>
      </div>

      {/* Action Row: Limit Buy Order & Add to Portfolio */}
      <div className="mt-1 pt-3 border-t border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            TARGET BUY TRIGGER ("LIMIT ORDER")
          </span>
          <button
            onClick={handleAddToList}
            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
          >
            <FolderPlus className="w-3 h-3" />
            {portfolioAdded ? 'Added to List!' : 'Add to Portfolio'}
          </button>
        </div>

        <form onSubmit={handleSetAlert} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder={`Target price in ${currency}`}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Bell className="w-3.5 h-3.5" />
            {alertSaved ? 'Saved!' : 'Set Trigger'}
          </button>
        </form>
      </div>
    </div>
  );
}
