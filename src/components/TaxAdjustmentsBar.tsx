import React, { useState } from 'react';
import { Percent, DollarSign, Receipt, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { GlobalAdjustments } from '../types';
import { formatCurrency } from '../utils/calculations';

interface TaxAdjustmentsBarProps {
  adjustments: GlobalAdjustments;
  onChange: (adjustments: GlobalAdjustments) => void;
  itemsSubtotal: number;
  currency: string;
}

export const TaxAdjustmentsBar: React.FC<TaxAdjustmentsBarProps> = ({
  adjustments,
  onChange,
  itemsSubtotal,
  currency,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAdjustments =
    adjustments.taxValue > 0 || adjustments.discountValue > 0 || adjustments.tipValue > 0;

  const calculatedTax =
    adjustments.taxType === 'percent'
      ? (itemsSubtotal * (adjustments.taxValue || 0)) / 100
      : adjustments.taxValue || 0;

  const calculatedDiscount =
    adjustments.discountType === 'percent'
      ? (itemsSubtotal * (adjustments.discountValue || 0)) / 100
      : adjustments.discountValue || 0;

  const calculatedTip =
    adjustments.tipType === 'percent'
      ? (itemsSubtotal * (adjustments.tipValue || 0)) / 100
      : adjustments.tipValue || 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                Tax, Discounts & Fees
              </h3>
              {hasAdjustments && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Applied
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {hasAdjustments
                ? `Tax: ${formatCurrency(calculatedTax, currency)} · Disc: -${formatCurrency(calculatedDiscount, currency)} · Fees: ${formatCurrency(calculatedTip, currency)}`
                : 'Click to add sales tax, store discounts, or delivery fees'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
            {isExpanded ? 'Hide' : 'Configure'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            {/* Tax */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Sales Tax
                </label>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => onChange({ ...adjustments, taxType: 'percent' })}
                    className={`px-1.5 py-0.5 rounded ${
                      adjustments.taxType === 'percent'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...adjustments, taxType: 'fixed' })}
                    className={`px-1.5 py-0.5 rounded ${
                      adjustments.taxType === 'fixed'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {currency}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={adjustments.taxValue || ''}
                  placeholder="0"
                  onChange={(e) =>
                    onChange({ ...adjustments, taxValue: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                = {formatCurrency(calculatedTax, currency)}
              </span>
            </div>

            {/* Discount / Coupon */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Discount / Coupon
                </label>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => onChange({ ...adjustments, discountType: 'percent' })}
                    className={`px-1.5 py-0.5 rounded ${
                      adjustments.discountType === 'percent'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...adjustments, discountType: 'fixed' })}
                    className={`px-1.5 py-0.5 rounded ${
                      adjustments.discountType === 'fixed'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {currency}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={adjustments.discountValue || ''}
                  placeholder="0"
                  onChange={(e) =>
                    onChange({ ...adjustments, discountValue: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-indigo-700 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                = -{formatCurrency(calculatedDiscount, currency)}
              </span>
            </div>

            {/* Tip / Delivery / Bag fee */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Tip / Delivery Fee
                </label>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => onChange({ ...adjustments, tipType: 'percent' })}
                    className={`px-1.5 py-0.5 rounded ${
                      adjustments.tipType === 'percent'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...adjustments, tipType: 'fixed' })}
                    className={`px-1.5 py-0.5 rounded ${
                      adjustments.tipType === 'fixed'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {currency}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={adjustments.tipValue || ''}
                  placeholder="0"
                  onChange={(e) =>
                    onChange({ ...adjustments, tipValue: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                = +{formatCurrency(calculatedTip, currency)}
              </span>
            </div>
          </div>

          {/* Distribution mode */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Split tax & fees:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...adjustments, splitAdjustmentsMode: 'proportional' })}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  adjustments.splitAdjustmentsMode === 'proportional'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Proportional to spending (Fair)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...adjustments, splitAdjustmentsMode: 'equal' })}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  adjustments.splitAdjustmentsMode === 'equal'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Split Equally
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
