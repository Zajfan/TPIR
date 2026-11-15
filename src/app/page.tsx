'use client';

import React, { useState, useEffect } from 'react';
import { PRODUCTS } from '@/lib/catalog';
import { analyzeProduct } from '@/lib/prognosis';
import { Currency, Product, PriceAlert } from '@/types';
import { convertCurrency, formatPrice, formatPercent } from '@/lib/currency';
import Navbar from '@/components/Navbar';
import MarketTicker from '@/components/MarketTicker';
import PriceChart from '@/components/PriceChart';
import PrognosisCard from '@/components/PrognosisCard';
import RetailerOrderbook from '@/components/RetailerOrderbook';
import MarketHeatmap from '@/components/MarketHeatmap';
import AlertsModal from '@/components/AlertsModal';
import {
  TrendingDown,
  TrendingUp,
  Sliders,
  Cpu,
  Layers,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function Home() {
  const [currency, setCurrency] = useState<Currency>('SEK');
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);

  // Load saved alerts and currency preference from localStorage on mount
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('tpir_currency') as Currency;
      if (savedCurrency && ['SEK', 'EUR', 'USD'].includes(savedCurrency)) {
        setCurrency(savedCurrency);
      }

      const savedAlerts = localStorage.getItem('tpir_alerts');
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
  }, []);

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    try {
      localStorage.setItem('tpir_currency', newCurrency);
    } catch (e) {}
  };

  const handleAddAlert = (newAlertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const newAlert: PriceAlert = {
      ...newAlertData,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('sv-SE'),
      triggered: false,
    };
    const updated = [...alerts.filter((a) => a.productId !== newAlert.productId), newAlert];
    setAlerts(updated);
    try {
      localStorage.setItem('tpir_alerts', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    try {
      localStorage.setItem('tpir_alerts', JSON.stringify(updated));
    } catch (e) {}
  };

  // Run technical analysis on selected product
  const analysis = analyzeProduct(selectedProduct);

  const history = selectedProduct.history;
  const latestCloseUSD = history[history.length - 1]?.close || selectedProduct.msrpUSD;
  const prevCloseUSD = history[Math.max(0, history.length - 2)]?.close || latestCloseUSD;
  const dayChangePct = ((latestCloseUSD - prevCloseUSD) / prevCloseUSD) * 100;

  const currentPrice = convertCurrency(latestCloseUSD, 'USD', currency);
  const msrp = convertCurrency(selectedProduct.msrpUSD, 'USD', currency);
  const msrpDiffPct = Math.round(((currentPrice - msrp) / msrp) * 100);

  // Lowest available price among in-stock retailers
  const inStockRetailers = selectedProduct.retailers.filter((r) => r.inStock);
  const lowestRetailer = [...inStockRetailers].sort(
    (a, b) =>
      convertCurrency(a.price, a.currency, currency) -
      convertCurrency(b.price, b.currency, currency)
  )[0] || selectedProduct.retailers[0];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        products={PRODUCTS}
        onSelectProduct={setSelectedProduct}
        alerts={alerts}
        onOpenAlerts={() => setIsAlertsOpen(true)}
      />

      {/* Marquee Ticker */}
      <MarketTicker
        products={PRODUCTS}
        currency={currency}
        onSelectProduct={setSelectedProduct}
        selectedProductId={selectedProduct.id}
      />

      {/* Main Terminal Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Active Product Header Bar */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {selectedProduct.category}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedProduct.brand} • Released {selectedProduct.releaseDate}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 mt-1">
                {selectedProduct.name}
              </h1>
            </div>
          </div>

          {/* Key Pricing Metrics */}
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] font-mono text-slate-400">Current Market Price</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-100">
                  {formatPrice(currentPrice, currency)}
                </span>
                <span
                  className={`text-xs font-mono font-bold flex items-center ${
                    dayChangePct <= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {dayChangePct <= 0 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(dayChangePct)}
                </span>
              </div>
            </div>

            <div className="border-l border-slate-800 pl-6 hidden sm:block">
              <div className="text-[11px] font-mono text-slate-400">MSRP Spread</div>
              <div
                className={`text-base font-bold font-mono mt-0.5 ${
                  msrpDiffPct <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {msrpDiffPct <= 0 ? `${msrpDiffPct}% below MSRP` : `+${msrpDiffPct}% above MSRP`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                MSRP: {formatPrice(msrp, currency)}
              </div>
            </div>

            {lowestRetailer && (
              <div className="border-l border-slate-800 pl-6 hidden md:block">
                <div className="text-[11px] font-mono text-slate-400">Best Store Ask</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <span className="text-blue-400">{lowestRetailer.retailerName}</span>
                  <span className="text-xs font-mono text-slate-300">
                    ({formatPrice(convertCurrency(lowestRetailer.price, lowestRetailer.currency, currency), currency)})
                  </span>
                </div>
                <a
                  href={lowestRetailer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 mt-0.5"
                >
                  Go to Deal <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* 2-Column Bloomberg/TradingView Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Chart Column (7 or 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <PriceChart
              product={selectedProduct}
              analysis={analysis}
              currency={currency}
            />

            <PrognosisCard
              product={selectedProduct}
              analysis={analysis}
              currency={currency}
              onAddAlert={handleAddAlert}
              activeAlerts={alerts}
            />
          </div>

          {/* Right Orderbook & Technical Specs Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <RetailerOrderbook
              product={selectedProduct}
              currency={currency}
            />

            {/* Hardware Specification Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                <Cpu className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-xs tracking-wider uppercase font-mono">
                  HARDWARE ARCHITECTURE & SPECS
                </h3>
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                {Object.entries(selectedProduct.specs).map(([specKey, specVal]) => (
                  <div
                    key={specKey}
                    className="flex items-center justify-between py-1.5 border-b border-slate-850 last:border-0"
                  >
                    <span className="text-slate-400">{specKey}</span>
                    <span className="font-semibold text-slate-200 text-right">{specVal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Market Heatmap / Category Explorer */}
        <section className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100 tracking-wide uppercase font-mono">
              Hardware Market Exchange & Heatmap
            </h2>
          </div>
          <MarketHeatmap
            products={PRODUCTS}
            currency={currency}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            selectedProductId={selectedProduct.id}
          />
        </section>
      </main>

      {/* Price Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onRemoveAlert={handleRemoveAlert}
        products={PRODUCTS}
        currency={currency}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950 py-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-slate-400 font-bold">
              TPIR (The Price is Right) • Hardware Financial Terminal
            </div>
            <div className="text-slate-600 mt-1">
              Open source product trading platform for GPUs, CPUs, SSDs, RAM, and Consoles.
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Sweden (SEK)</span>
            <span>•</span>
            <span>Europe (EUR)</span>
            <span>•</span>
            <span>United States (USD)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
