'use client';

import React, { useState } from 'react';
import { Product, Currency } from '@/types';
import { convertCurrency, formatPrice } from '@/lib/currency';
import { Zap, Calculator, Clock } from 'lucide-react';

interface EnterpriseTCOCardProps {
  product: Product;
  currency: Currency;
  hardwarePrice: number;
}

export default function EnterpriseTCOCard({ product, currency, hardwarePrice }: EnterpriseTCOCardProps) {
  const [hoursPerDay, setHoursPerDay] = useState<number>(
    product.category === 'server' || product.category === 'hdd' ? 24 : 4
  );

  // Baseline electricity rates per kWh
  const kWhRate = currency === 'SEK' ? 1.85 : currency === 'EUR' ? 0.28 : 0.16;

  // Power in kW
  const powerKW = product.powerWatts / 1000;

  // Daily kWh
  const dailyKWh = powerKW * hoursPerDay;
  const annualKWh = dailyKWh * 365;

  const annualPowerCost = annualKWh * kWhRate;
  const threeYearPowerCost = annualPowerCost * 3;
  const threeYearTCO = hardwarePrice + threeYearPowerCost;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-xs tracking-wider uppercase font-mono">
            TOTAL COST OF OWNERSHIP (TCO) & POWER
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          TDP: <strong className="text-amber-400">{product.powerWatts}W</strong>
        </span>
      </div>

      {/* Usage Profile Selector */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-mono text-[11px]">Usage Profile:</span>
        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setHoursPerDay(4)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
              hoursPerDay === 4 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4h/day (Gaming)
          </button>
          <button
            onClick={() => setHoursPerDay(8)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
              hoursPerDay === 8 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            8h/day (Work)
          </button>
          <button
            onClick={() => setHoursPerDay(24)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
              hoursPerDay === 24 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            24/7 (Server)
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono py-1">
        <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[10px] text-slate-500">Annual Power</div>
          <div className="text-xs font-bold text-slate-200 mt-0.5">
            {formatPrice(annualPowerCost, currency)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">{Math.round(annualKWh)} kWh/yr</div>
        </div>

        <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[10px] text-slate-500">3-Year Energy</div>
          <div className="text-xs font-bold text-amber-400 mt-0.5">
            {formatPrice(threeYearPowerCost, currency)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">{Math.round(annualKWh * 3)} kWh</div>
        </div>

        <div className="p-2 bg-blue-950/20 border border-blue-500/40 rounded-lg">
          <div className="text-[10px] text-blue-400 font-bold">3-Year Total TCO</div>
          <div className="text-xs font-bold text-white mt-0.5">
            {formatPrice(threeYearTCO, currency)}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Hardware + Power</div>
        </div>
      </div>
    </div>
  );
}
