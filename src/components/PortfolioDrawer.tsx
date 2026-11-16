'use client';

import React, { useState } from 'react';
import { WatchlistPortfolio, Product, Currency } from '@/types';
import { convertCurrency, formatPrice } from '@/lib/currency';
import {
  X,
  FolderHeart,
  Plus,
  Trash2,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Layers,
  Store,
} from 'lucide-react';

interface PortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: WatchlistPortfolio[];
  activePortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onCreatePortfolio: (name: string, description: string) => void;
  onRemoveItemFromPortfolio: (portfolioId: string, productId: string) => void;
  products: Product[];
  currency: Currency;
  onSelectProduct: (p: Product) => void;
}

export default function PortfolioDrawer({
  isOpen,
  onClose,
  portfolios,
  activePortfolioId,
  onSelectPortfolio,
  onCreatePortfolio,
  onRemoveItemFromPortfolio,
  products,
  currency,
  onSelectProduct,
}: PortfolioDrawerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  if (!isOpen) return null;

  const currentPortfolio = portfolios.find((p) => p.id === activePortfolioId) || portfolios[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreatePortfolio(newListName.trim(), newListDesc.trim() || 'Custom hardware build');
    setNewListName('');
    setNewListDesc('');
    setIsCreating(false);
  };

  // Compute aggregate pricing & split-store optimization for current portfolio
  const basketItems = currentPortfolio.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;

    const currentCloseUSD = product.historyDaily[product.historyDaily.length - 1]?.close || product.msrpUSD;
    const currentPrice = convertCurrency(currentCloseUSD, 'USD', currency);
    const msrpPrice = convertCurrency(product.msrpUSD, 'USD', currency);

    // Find best in-stock retailer for this item
    const inStockRetailers = product.retailers.filter((r) => r.inStock);
    const bestRetailer = [...inStockRetailers].sort(
      (a, b) =>
        convertCurrency(a.price, a.currency, currency) -
        convertCurrency(b.price, b.currency, currency)
    )[0] || product.retailers[0];

    const bestRetailerPrice = convertCurrency(bestRetailer.price, bestRetailer.currency, currency);

    return {
      product,
      quantity: item.quantity,
      currentPrice,
      totalItemPrice: bestRetailerPrice * item.quantity,
      msrpPrice: msrpPrice * item.quantity,
      bestRetailer,
      bestRetailerPrice,
    };
  }).filter(Boolean) as {
    product: Product;
    quantity: number;
    currentPrice: number;
    totalItemPrice: number;
    msrpPrice: number;
    bestRetailer: any;
    bestRetailerPrice: number;
  }[];

  const totalBasketCost = basketItems.reduce((acc, i) => acc + i.totalItemPrice, 0);
  const totalMSRP = basketItems.reduce((acc, i) => acc + i.msrpPrice, 0);
  const totalSavings = totalMSRP - totalBasketCost;

  // Split-Store grouping
  const storeGroups: Record<string, { storeName: string; items: string[]; subtotal: number }> = {};
  basketItems.forEach((i) => {
    const sName = i.bestRetailer.retailerName;
    if (!storeGroups[sName]) {
      storeGroups[sName] = { storeName: sName, items: [], subtotal: 0 };
    }
    storeGroups[sName].items.push(`${i.product.name.split(' ')[0]} ${i.product.model.split(' ')[0]}`);
    storeGroups[sName].subtotal += i.totalItemPrice;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-base font-mono">
                TPIR PORTFOLIOS & HARDWARE BUILDS
              </h3>
              <p className="text-slate-400 text-xs">
                Multi-list tracking, basket cost optimization, and split-store shopping planner
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

        {/* Portfolio Tabs & New List Button */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {portfolios.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPortfolio(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
                  p.id === currentPortfolio.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{p.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 text-slate-300">
                  {p.items.length}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>New List</span>
          </button>
        </div>

        {/* Create List Form Inline */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center gap-3 animate-in fade-in"
          >
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name (e.g., Black Friday 2026 Wishlist)"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 flex-1 min-w-[200px] focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              placeholder="Description (optional)"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 flex-1 min-w-[200px] focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-semibold transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Basket Financial Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
            <div>
              <div className="text-[11px] font-mono text-slate-400">Total Basket Value</div>
              <div className="text-2xl font-black font-mono text-slate-100 mt-1">
                {formatPrice(totalBasketCost, currency)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {basketItems.length} components selected
              </div>
            </div>

            <div className="border-l border-slate-800 pl-4">
              <div className="text-[11px] font-mono text-slate-400">Total Savings vs MSRP</div>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  totalSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalSavings >= 0 ? `-${formatPrice(totalSavings, currency)}` : `+${formatPrice(Math.abs(totalSavings), currency)}`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Baseline MSRP: {formatPrice(totalMSRP, currency)}
              </div>
            </div>

            <div className="border-l border-slate-800 pl-4 flex flex-col justify-center">
              <div className="text-[11px] font-mono text-slate-400">Basket Verdict</div>
              <div className="inline-flex items-center gap-1.5 mt-1 text-sm font-bold font-mono text-emerald-400">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>STRONG BUY (FAVORABLE CYCLE)</span>
              </div>
            </div>
          </div>

          {/* Split-Store Optimization Recommendation */}
          {Object.keys(storeGroups).length > 0 && (
            <div className="bg-blue-950/20 border border-blue-500/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-blue-400" />
                <h4 className="font-mono font-bold text-slate-200 text-xs uppercase tracking-wider">
                  SPLIT-STORE ORDER OPTIMIZER (LOWEST TOTAL COST)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {Object.values(storeGroups).map((g) => (
                  <div key={g.storeName} className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
                    <div className="flex justify-between items-center text-xs font-mono font-bold text-blue-400">
                      <span>{g.storeName}</span>
                      <span className="text-slate-100">{formatPrice(g.subtotal, currency)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {g.items.join(' + ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Item List */}
          <div className="flex flex-col gap-2.5">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Components in {currentPortfolio.name}
            </div>

            {basketItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No items in this list yet. Click &quot;Add to List&quot; on any hardware item in the terminal!
              </div>
            ) : (
              basketItems.map(({ product, quantity, totalItemPrice, bestRetailer, bestRetailerPrice }) => (
                <div
                  key={product.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                        {product.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Best Ask: <span className="text-emerald-400 font-semibold">{bestRetailer.retailerName}</span> ({formatPrice(bestRetailerPrice, currency)})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-100">
                        {formatPrice(totalItemPrice, currency)}
                      </div>
                      <div className="text-[10px] text-slate-500">Qty: {quantity}</div>
                    </div>

                    <button
                      onClick={() => onRemoveItemFromPortfolio(currentPortfolio.id, product.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
