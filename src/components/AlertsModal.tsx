'use client';

import React from 'react';
import { PriceAlert, Currency, Product } from '@/types';
import { formatPrice } from '@/lib/currency';
import { Bell, Trash2, CheckCircle2, X, Target } from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  onRemoveAlert: (id: string) => void;
  products: Product[];
  currency: Currency;
}

export default function AlertsModal({
  isOpen,
  onClose,
  alerts,
  onRemoveAlert,
  products,
  currency,
}: AlertsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Active Price Triggers ("Limit Orders")
              </h3>
              <p className="text-slate-400 text-xs">
                Notifies when hardware drops to or below your target entry price
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 flex flex-col gap-3 max-h-[420px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Bell className="w-8 h-8 text-slate-600 stroke-1" />
              <div className="text-sm font-medium text-slate-400">No active price triggers</div>
              <p className="text-xs text-slate-500 max-w-xs">
                Select any GPU, CPU, or console and use the &quot;Target Buy Trigger&quot; form to set your desired entry price.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const product = products.find((p) => p.id === alert.productId);

              return (
                <div
                  key={alert.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 text-xs truncate">
                      {alert.productName}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                      <span className="text-slate-400">Target:</span>
                      <span className="text-emerald-400 font-bold">
                        {formatPrice(alert.targetPrice, alert.targetCurrency)}
                      </span>
                      <span className="text-slate-500">• Created: {alert.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-400" />
                      Active
                    </span>

                    <button
                      onClick={() => onRemoveAlert(alert.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Trigger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
