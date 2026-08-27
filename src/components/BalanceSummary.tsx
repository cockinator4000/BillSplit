import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, Sparkles, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FriendSummary, SettlementTransfer, GlobalAdjustments } from '../types';
import { getColorTheme } from '../utils/colors';
import { formatCurrency } from '../utils/calculations';

interface BalanceSummaryProps {
  friendSummaries: FriendSummary[];
  transfers: SettlementTransfer[];
  grandTotal: number;
  itemsSubtotal: number;
  totalTax: number;
  totalDiscount: number;
  totalTip: number;
  currency: string;
  adjustments: GlobalAdjustments;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  friendSummaries,
  transfers,
  grandTotal,
  itemsSubtotal,
  totalTax,
  totalDiscount,
  totalTip,
  currency,
  adjustments,
}) => {
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);
  const [settledTransfers, setSettledTransfers] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedFriendId(prev => (prev === id ? null : id));
  };

  const handleToggleSettled = (index: number) => {
    const next = new Set(settledTransfers);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
      // Trigger confetti celebration!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
    setSettledTransfers(next);
  };

  const handleCopyTransfer = (t: SettlementTransfer, index: number) => {
    const text = `${t.fromFriend.name} sends ${formatCurrency(t.amount, currency)} to ${t.toFriend.name}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const allSettled = transfers.length > 0 && settledTransfers.size === transfers.length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Grand Bill */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
            Total Grocery Bill
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {formatCurrency(grandTotal, currency)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Items: {formatCurrency(itemsSubtotal, currency)}
            {totalTax > 0 && ` + Tax ${formatCurrency(totalTax, currency)}`}
          </span>
        </div>

        {/* Number of People */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
            People Splitting
          </span>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">
            {friendSummaries.length}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Avg. {formatCurrency(friendSummaries.length > 0 ? grandTotal / friendSummaries.length : 0, currency)} / person
          </span>
        </div>

        {/* Transfers Count */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
            Transfers Needed
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {transfers.length}
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 block font-medium">
            Direct settlements
          </span>
        </div>

        {/* Settlement Status */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
            Settlement Status
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {allSettled || transfers.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700 dark:text-indigo-400">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                All Settled Up!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 dark:text-amber-400">
                <Wallet className="w-4 h-4 text-amber-600" />
                {settledTransfers.size} of {transfers.length} completed
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Click transfer to mark paid
          </span>
        </div>
      </div>

      {/* SECTION 1: SETTLEMENT TRANSFER PLAN (WHO PAYS WHOM) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Settlement Plan (Who Pays Whom)
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Direct minimal transfers to square all balances completely
              </p>
            </div>
          </div>

          {transfers.length > 0 && (
            <button
              onClick={() => {
                const all = new Set<number>();
                transfers.forEach((_, i) => all.add(i));
                setSettledTransfers(settledTransfers.size === transfers.length ? new Set() : all);
                if (settledTransfers.size !== transfers.length) {
                  confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
                }
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              {settledTransfers.size === transfers.length ? 'Reset All' : 'Mark All Settled'}
            </button>
          )}
        </div>

        {transfers.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
            <Sparkles className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Everyone is balanced!
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Each friend has paid exactly their fair share for the groceries they picked.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {transfers.map((t, idx) => {
              const isSettled = settledTransfers.has(idx);
              const fromTheme = getColorTheme(t.fromFriend.color);
              const toTheme = getColorTheme(t.toFriend.color);

              return (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-4 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                    isSettled
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-2xs hover:border-indigo-300'
                  }`}
                >
                  {/* Sender and Receiver */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* From friend */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${fromTheme.avatarBg}`}
                      >
                        {t.fromFriend.name.charAt(0)}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {t.fromFriend.name}
                      </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                    {/* To friend */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${toTheme.avatarBg}`}
                      >
                        {t.toFriend.name.charAt(0)}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {t.toFriend.name}
                      </span>
                    </div>
                  </div>

                  {/* Transfer Amount & Actions */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {formatCurrency(t.amount, currency)}
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                        {isSettled ? 'Settled' : 'Pending'}
                      </span>
                    </div>

                    {/* Copy button */}
                    <button
                      onClick={() => handleCopyTransfer(t, idx)}
                      title="Copy transfer text"
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-white dark:hover:bg-slate-700"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Mark Settled checkbox */}
                    <button
                      onClick={() => handleToggleSettled(idx)}
                      title={isSettled ? 'Mark as unpaid' : 'Mark as paid'}
                      className={`p-1.5 rounded transition-colors ${
                        isSettled
                          ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                          : 'text-slate-300 hover:text-indigo-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: PER-PERSON ITEMIZED CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Individual Balance & Breakdown
          </h3>
          <span className="text-xs text-slate-400">
            Click any person to view exact groceries they consumed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {friendSummaries.map(s => {
            const theme = getColorTheme(s.friend.color);
            const isExpanded = expandedFriendId === s.friend.id;
            const net = s.netBalance;
            const getsBack = net > 0.01;
            const owes = net < -0.01;

            return (
              <div
                key={s.friend.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                {/* Header Bar */}
                <div
                  onClick={() => toggleExpand(s.friend.id)}
                  className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${theme.avatarBg}`}
                      >
                        {s.friend.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                          {s.friend.name}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {s.itemBreakdowns.length} items consumed
                        </span>
                      </div>
                    </div>

                    {/* Net Balance Status Badge */}
                    <div className="text-right">
                      {getsBack && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span className="tabular-nums">Gets back {formatCurrency(net, currency)}</span>
                        </div>
                      )}
                      {owes && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span className="tabular-nums">Owes {formatCurrency(Math.abs(net), currency)}</span>
                        </div>
                      )}
                      {!getsBack && !owes && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <span>Settled ($0.00)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics Summary */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Subtotal</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatCurrency(s.itemsSubtotal, currency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Fair Share</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(s.totalOwed, currency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Paid at Reg.</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {formatCurrency(s.totalPaid, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Expand toggle hint */}
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                    <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      {isExpanded ? 'Hide item breakdown' : 'Click to view itemized list'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Collapsible Itemized List for this person */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs bg-slate-50/50 dark:bg-slate-800/20">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200 pt-3 mb-1">
                      Items {s.friend.name} is paying for:
                    </h5>

                    {s.itemBreakdowns.length === 0 ? (
                      <p className="text-slate-400 italic py-2">No specific items assigned.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {s.itemBreakdowns.map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-slate-900 dark:text-slate-100 truncate block">
                                {b.item.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {b.shareDescription} (Total: {formatCurrency(b.item.price, currency)})
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 pl-2 tabular-nums">
                              {formatCurrency(b.theirShareAmount, currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adjustments row */}
                    {(s.taxShare > 0 || s.discountShare > 0 || s.tipShare > 0) && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-400 space-y-0.5">
                        {s.taxShare > 0 && (
                          <div className="flex justify-between">
                            <span>+ Tax portion:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                              {formatCurrency(s.taxShare, currency)}
                            </span>
                          </div>
                        )}
                        {s.discountShare > 0 && (
                          <div className="flex justify-between text-indigo-600">
                            <span>- Discount portion:</span>
                            <span className="font-medium tabular-nums">
                              -{formatCurrency(s.discountShare, currency)}
                            </span>
                          </div>
                        )}
                        {s.tipShare > 0 && (
                          <div className="flex justify-between">
                            <span>+ Tip / Fee portion:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                              {formatCurrency(s.tipShare, currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
