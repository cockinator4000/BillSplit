import React from 'react';
import { ShoppingCart, Upload, Plus, Sparkles, RotateCcw, Share2, DollarSign } from 'lucide-react';

interface NavbarProps {
  itemCount: number;
  totalSum: number;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onOpenCSVModal: () => void;
  onOpenAddItem: () => void;
  onLoadDemoData: () => void;
  onResetData: () => void;
  onOpenShareModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  itemCount,
  totalSum,
  currency,
  onCurrencyChange,
  onOpenCSVModal,
  onOpenAddItem,
  onLoadDemoData,
  onResetData,
  onOpenShareModal,
}) => {
  const currencies = ['$', '€', '£', '¥', 'CA$', 'AU$', 'zł', 'kr'];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shadow-xs">
              S
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                SplitCart
              </h1>
              <span className="text-slate-400 font-normal text-xs sm:text-sm">v2.4</span>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency selector */}
            <div className="relative inline-flex items-center">
              <span className="absolute left-2.5 text-slate-400 pointer-events-none">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
              <select
                id="currency-select"
                aria-label="Currency Selector"
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs font-semibold rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Demo Button */}
            <button
              id="btn-demo-data"
              onClick={onLoadDemoData}
              title="Load sample grocery receipt"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sample Demo</span>
            </button>

            {/* Manual Entry Button */}
            <button
              id="btn-add-item-nav"
              onClick={onOpenAddItem}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
            >
              Manual Entry
            </button>

            {/* CSV Import Button */}
            <button
              id="btn-import-csv"
              onClick={onOpenCSVModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Import .CSV File</span>
            </button>

            {/* Share / Export button */}
            <button
              id="btn-share-summary"
              onClick={onOpenShareModal}
              title="Export or share settlement summary"
              className="p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span className="hidden lg:inline">Share</span>
            </button>

            {/* Reset Button */}
            <button
              id="btn-reset-all"
              onClick={onResetData}
              title="Reset items and start fresh"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
