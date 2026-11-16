'use client';

import React, { useState, useEffect } from 'react';
import { PRODUCTS } from '@/lib/catalog';
import { analyzeProduct } from '@/lib/prognosis';
import { Currency, Product, PriceAlert, WatchlistPortfolio, Timeframe } from '@/types';
import { convertCurrency, formatPrice, formatPercent } from '@/lib/currency';
import Navbar from '@/components/Navbar';
import MarketTicker from '@/components/MarketTicker';
import PriceChart from '@/components/PriceChart';
import PrognosisCard from '@/components/PrognosisCard';
import RetailerOrderbook from '@/components/RetailerOrderbook';
import MarketHeatmap from '@/components/MarketHeatmap';
import AlertsModal from '@/components/AlertsModal';
import CompareModal from '@/components/CompareModal';
import PortfolioDrawer from '@/components/PortfolioDrawer';
import EnterpriseTCOCard from '@/components/EnterpriseTCOCard';
import {
  TrendingDown,
  TrendingUp,
  Cpu,
  Layers,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Zap,
  Swords,
  Clock,
  Sparkles,
} from 'lucide-react';

const INITIAL_PORTFOLIOS: WatchlistPortfolio[] = [
  {
    id: 'portfolio-dream-4k-rig',
    name: 'Dream 4K Gaming Rig',
    description: 'Ultra-tier 4K gaming build with top value components',
    categoryIcon: 'rig',
    createdAt: '2026-11-15',
    items: [
      { productId: 'gpu-rtx-4080-super', quantity: 1 },
      { productId: 'cpu-ryzen-7-9800x3d', quantity: 1 },
      { productId: 'ram-corsair-vengeance-ddr5-32gb', quantity: 1 },
      { productId: 'ssd-samsung-990-pro-2tb', quantity: 1 },
    ],
  },
  {
    id: 'portfolio-homelab',
    name: 'Homelab & Storage Cluster',
    description: 'Proxmox hypervisor & 16TB NAS setup',
    categoryIcon: 'server',
    createdAt: '2026-11-15',
    items: [
      { productId: 'server-dell-poweredge-t150', quantity: 1 },
      { productId: 'hdd-seagate-ironwolf-pro-16tb', quantity: 2 },
    ],
  },
];

export default function Home() {
  const [currency, setCurrency] = useState<Currency>('SEK');
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [portfolios, setPortfolios] = useState<WatchlistPortfolio[]>(INITIAL_PORTFOLIOS);
  const [activePortfolioId, setActivePortfolioId] = useState<string>(INITIAL_PORTFOLIOS[0].id);

  // Modals state
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isPortfoliosOpen, setIsPortfoliosOpen] = useState<boolean>(false);

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

      const savedPortfolios = localStorage.getItem('tpir_portfolios');
      if (savedPortfolios) {
        setPortfolios(JSON.parse(savedPortfolios));
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

  const handleCreatePortfolio = (name: string, description: string) => {
    const newP: WatchlistPortfolio = {
      id: `portfolio-${Date.now()}`,
      name,
      description,
      categoryIcon: 'custom',
      createdAt: new Date().toLocaleDateString('sv-SE'),
      items: [{ productId: selectedProduct.id, quantity: 1 }],
    };
    const updated = [...portfolios, newP];
    setPortfolios(updated);
    setActivePortfolioId(newP.id);
    try {
      localStorage.setItem('tpir_portfolios', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddToPortfolio = (product: Product) => {
    const updated = portfolios.map((p) => {
      if (p.id === activePortfolioId) {
        const exists = p.items.find((i) => i.productId === product.id);
        if (exists) {
          return {
            ...p,
            items: p.items.map((i) =>
              i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return {
          ...p,
          items: [...p.items, { productId: product.id, quantity: 1 }],
        };
      }
      return p;
    });
    setPortfolios(updated);
    try {
      localStorage.setItem('tpir_portfolios', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveItemFromPortfolio = (portfolioId: string, productId: string) => {
    const updated = portfolios.map((p) => {
      if (p.id === portfolioId) {
        return {
          ...p,
          items: p.items.filter((i) => i.productId !== productId),
        };
      }
      return p;
    });
    setPortfolios(updated);
    try {
      localStorage.setItem('tpir_portfolios', JSON.stringify(updated));
    } catch (e) {}
  };

  const analysis = analyzeProduct(selectedProduct);

  const history = selectedProduct.historyDaily;
  const latestCloseUSD = history[history.length - 1]?.close || selectedProduct.msrpUSD;
  const prevCloseUSD = history[Math.max(0, history.length - 2)]?.close || latestCloseUSD;
  const dayChangePct = ((latestCloseUSD - prevCloseUSD) / prevCloseUSD) * 100;

  const currentPrice = convertCurrency(latestCloseUSD, 'USD', currency);
  const msrp = convertCurrency(selectedProduct.msrpUSD, 'USD', currency);
  const msrpDiffPct = Math.round(((currentPrice - msrp) / msrp) * 100);

  const inStockRetailers = selectedProduct.retailers.filter((r) => r.inStock);
  const lowestRetailer = [...inStockRetailers].sort(
    (a, b) =>
      convertCurrency(a.price, a.currency, currency) -
      convertCurrency(b.price, b.currency, currency)
  )[0] || selectedProduct.retailers[0];

  const getLifecycleColor = (stage: string) => {
    switch (stage) {
      case 'CLEARANCE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'PRICE_BOTTOM':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'LAUNCH_SPIKE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

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
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenPortfolios={() => setIsPortfoliosOpen(true)}
        portfolioCount={portfolios.length}
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {selectedProduct.category}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${getLifecycleColor(selectedProduct.lifecycleStage)}`}>
                  {selectedProduct.lifecycleStage.replace('_', ' ')}
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
          {/* Main Chart Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <PriceChart
              product={selectedProduct}
              analysis={analysis}
              currency={currency}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />

            <PrognosisCard
              product={selectedProduct}
              analysis={analysis}
              currency={currency}
              onAddAlert={handleAddAlert}
              activeAlerts={alerts}
              onAddToPortfolio={handleAddToPortfolio}
            />
          </div>

          {/* Right Orderbook & Technical Specs Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <RetailerOrderbook
              product={selectedProduct}
              currency={currency}
            />

            {/* Enterprise & Gamer TCO Power Calculator */}
            <EnterpriseTCOCard
              product={selectedProduct}
              currency={currency}
              hardwarePrice={currentPrice}
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

      {/* Modals & Drawers */}
      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onRemoveAlert={handleRemoveAlert}
        products={PRODUCTS}
        currency={currency}
      />

      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        products={PRODUCTS}
        currentProduct={selectedProduct}
        currency={currency}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <PortfolioDrawer
        isOpen={isPortfoliosOpen}
        onClose={() => setIsPortfoliosOpen(false)}
        portfolios={portfolios}
        activePortfolioId={activePortfolioId}
        onSelectPortfolio={setActivePortfolioId}
        onCreatePortfolio={handleCreatePortfolio}
        onRemoveItemFromPortfolio={handleRemoveItemFromPortfolio}
        products={PRODUCTS}
        currency={currency}
        onSelectProduct={(p) => setSelectedProduct(p)}
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
