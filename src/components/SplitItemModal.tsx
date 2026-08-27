import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Divide,
  PieChart,
  Percent,
  DollarSign,
  Package,
  Users,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { GroceryItem, Friend } from '../types';
import { getColorTheme } from '../utils/colors';
import { formatCurrency } from '../utils/calculations';

interface SplitItemModalProps {
  isOpen: boolean;
  item: GroceryItem | null;
  friends: Friend[];
  currency: string;
  onClose: () => void;
  onSaveSplit: (updatedItem: GroceryItem) => void;
}

type SplitTab = 'equal' | 'shares' | 'percentage' | 'exact' | 'units';

export const SplitItemModal: React.FC<SplitItemModalProps> = ({
  isOpen,
  item,
  friends,
  currency,
  onClose,
  onSaveSplit,
}) => {
  if (!isOpen || !item) return null;

  const [activeTab, setActiveTab] = useState<SplitTab>(() => {
    if (item.splitMode === 'units' && item.quantity > 1) return 'units';
    if (item.splitMode === 'exact') return 'exact';
    if (item.splitMode === 'percentage') return 'percentage';
    if (item.splitMode === 'shares') return 'shares';
    return 'equal';
  });

  const [selectedFriends, setSelectedFriends] = useState<string[]>(() => {
    if (item.assignedTo && item.assignedTo.length > 0) {
      return item.assignedTo;
    }
    return friends.map(f => f.id);
  });

  // Local state for each split mode
  const [shares, setShares] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    friends.forEach(f => {
      initial[f.id] = item.shares?.[f.id] ?? (item.assignedTo.includes(f.id) || item.assignedTo.length === 0 ? 1 : 0);
    });
    return initial;
  });

  const [percentages, setPercentages] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (item.percentages) {
      friends.forEach(f => {
        initial[f.id] = item.percentages?.[f.id] ?? 0;
      });
    } else {
      const activeIds = item.assignedTo.length > 0 ? item.assignedTo : friends.map(f => f.id);
      const equalPct = activeIds.length > 0 ? Math.round((100 / activeIds.length) * 10) / 10 : 0;
      friends.forEach(f => {
        initial[f.id] = activeIds.includes(f.id) ? equalPct : 0;
      });
    }
    return initial;
  });

  const [exactAmounts, setExactAmounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (item.exactAmounts) {
      friends.forEach(f => {
        initial[f.id] = item.exactAmounts?.[f.id] ?? 0;
      });
    } else {
      const activeIds = item.assignedTo.length > 0 ? item.assignedTo : friends.map(f => f.id);
      const equalAmt = activeIds.length > 0 ? Math.round((item.price / activeIds.length) * 100) / 100 : 0;
      friends.forEach(f => {
        initial[f.id] = activeIds.includes(f.id) ? equalAmt : 0;
      });
    }
    return initial;
  });

  const [unitCounts, setUnitCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (item.unitCounts) {
      friends.forEach(f => {
        initial[f.id] = item.unitCounts?.[f.id] ?? 0;
      });
    } else {
      const activeIds = item.assignedTo.length > 0 ? item.assignedTo : friends.map(f => f.id);
      const perPersonUnits = activeIds.length > 0 ? Math.max(1, Math.floor(item.quantity / activeIds.length)) : 1;
      friends.forEach(f => {
        initial[f.id] = activeIds.includes(f.id) ? perPersonUnits : 0;
      });
    }
    return initial;
  });

  // Re-sync when item changes
  useEffect(() => {
    if (!item) return;
    if (item.splitMode === 'units' && item.quantity > 1) {
      setActiveTab('units');
    } else if (item.splitMode === 'exact') {
      setActiveTab('exact');
    } else if (item.splitMode === 'percentage') {
      setActiveTab('percentage');
    } else if (item.splitMode === 'shares') {
      setActiveTab('shares');
    } else {
      setActiveTab('equal');
    }

    const assigned = item.assignedTo.length > 0 ? item.assignedTo : friends.map(f => f.id);
    setSelectedFriends(assigned);

    // Sync shares
    const initShares: Record<string, number> = {};
    friends.forEach(f => {
      initShares[f.id] = item.shares?.[f.id] ?? (assigned.includes(f.id) ? 1 : 0);
    });
    setShares(initShares);

    // Sync percentages
    const initPct: Record<string, number> = {};
    if (item.percentages) {
      friends.forEach(f => {
        initPct[f.id] = item.percentages?.[f.id] ?? 0;
      });
    } else {
      const equalPct = assigned.length > 0 ? Math.round((100 / assigned.length) * 10) / 10 : 0;
      friends.forEach(f => {
        initPct[f.id] = assigned.includes(f.id) ? equalPct : 0;
      });
    }
    setPercentages(initPct);

    // Sync exact amounts
    const initExact: Record<string, number> = {};
    if (item.exactAmounts) {
      friends.forEach(f => {
        initExact[f.id] = item.exactAmounts?.[f.id] ?? 0;
      });
    } else {
      const equalAmt = assigned.length > 0 ? Math.round((item.price / assigned.length) * 100) / 100 : 0;
      friends.forEach(f => {
        initExact[f.id] = assigned.includes(f.id) ? equalAmt : 0;
      });
    }
    setExactAmounts(initExact);

    // Sync unit counts
    const initUnits: Record<string, number> = {};
    if (item.unitCounts) {
      friends.forEach(f => {
        initUnits[f.id] = item.unitCounts?.[f.id] ?? 0;
      });
    } else {
      const perPersonUnits = assigned.length > 0 ? Math.max(1, Math.floor(item.quantity / assigned.length)) : 1;
      friends.forEach(f => {
        initUnits[f.id] = assigned.includes(f.id) ? perPersonUnits : 0;
      });
    }
    setUnitCounts(initUnits);
  }, [item, friends]);

  // Helpers for Equal Split
  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      if (selectedFriends.length > 1) {
        setSelectedFriends(selectedFriends.filter(id => id !== friendId));
      }
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const selectAllFriends = () => {
    setSelectedFriends(friends.map(f => f.id));
  };

  // Helpers for Shares / Portions
  const updateShare = (friendId: string, delta: number) => {
    setShares(prev => {
      const current = prev[friendId] || 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [friendId]: nextVal };
    });
  };

  const setExactShare = (friendId: string, val: number) => {
    setShares(prev => ({
      ...prev,
      [friendId]: Math.max(0, val),
    }));
  };

  // Helpers for Percentages
  const updatePercentage = (friendId: string, val: number) => {
    setPercentages(prev => ({
      ...prev,
      [friendId]: Math.max(0, Math.min(100, Math.round(val * 10) / 10)),
    }));
  };

  const totalPercentage = useMemo(() => {
    return (Object.values(percentages) as number[]).reduce((sum: number, p: number) => sum + (Number(p) || 0), 0);
  }, [percentages]);

  const normalizePercentages = () => {
    if (totalPercentage <= 0) return;
    const next: Record<string, number> = {};
    friends.forEach(f => {
      const current = percentages[f.id] || 0;
      next[f.id] = Math.round((current / totalPercentage) * 1000) / 10;
    });
    setPercentages(next);
  };

  const distributeRemainingPercent = () => {
    const remaining = Math.max(0, 100 - totalPercentage);
    if (remaining <= 0) return;
    const activeFriends = friends.filter(f => (percentages[f.id] || 0) > 0);
    const targetFriends = activeFriends.length > 0 ? activeFriends : friends;
    const addition = Math.round((remaining / targetFriends.length) * 10) / 10;
    const next = { ...percentages };
    targetFriends.forEach(f => {
      next[f.id] = (next[f.id] || 0) + addition;
    });
    setPercentages(next);
  };

  // Helpers for Exact Amounts
  const updateExactAmount = (friendId: string, val: number) => {
    setExactAmounts(prev => ({
      ...prev,
      [friendId]: Math.max(0, Math.round(val * 100) / 100),
    }));
  };

  const totalExactAmount = useMemo(() => {
    return (Object.values(exactAmounts) as number[]).reduce((sum: number, a: number) => sum + (Number(a) || 0), 0);
  }, [exactAmounts]);

  const distributeRemainingAmount = () => {
    const remaining = Math.round((item.price - totalExactAmount) * 100) / 100;
    if (remaining <= 0) return;
    const activeFriends = friends.filter(f => (exactAmounts[f.id] || 0) > 0);
    const targetFriends = activeFriends.length > 0 ? activeFriends : friends;
    const addition = Math.round((remaining / targetFriends.length) * 100) / 100;
    const next = { ...exactAmounts };
    targetFriends.forEach(f => {
      next[f.id] = Math.round(((next[f.id] || 0) + addition) * 100) / 100;
    });
    setExactAmounts(next);
  };

  // Helpers for Units / Quantity
  const updateUnits = (friendId: string, delta: number) => {
    setUnitCounts(prev => {
      const current = prev[friendId] || 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [friendId]: nextVal };
    });
  };

  const totalAllocatedUnits = useMemo(() => {
    return (Object.values(unitCounts) as number[]).reduce((sum: number, u: number) => sum + (Number(u) || 0), 0);
  }, [unitCounts]);

  // Compute live breakdown per friend based on the active tab
  const liveBreakdowns = useMemo(() => {
    const itemPrice = item.price;
    const result: {
      friend: Friend;
      shareAmount: number;
      percentageOfItem: number;
      detailText: string;
      isActive: boolean;
    }[] = [];

    if (activeTab === 'equal') {
      const count = selectedFriends.length;
      const perPerson = count > 0 ? itemPrice / count : 0;
      friends.forEach(f => {
        const isAssigned = selectedFriends.includes(f.id);
        result.push({
          friend: f,
          shareAmount: isAssigned ? perPerson : 0,
          percentageOfItem: isAssigned && count > 0 ? 100 / count : 0,
          detailText: isAssigned ? `1/${count} equal share` : 'Not sharing',
          isActive: isAssigned,
        });
      });
    } else if (activeTab === 'shares') {
      let totalShares = 0;
      friends.forEach(f => {
        totalShares += shares[f.id] || 0;
      });

      friends.forEach(f => {
        const userShares = shares[f.id] || 0;
        const shareAmount = totalShares > 0 ? (userShares / totalShares) * itemPrice : 0;
        const pct = totalShares > 0 ? (userShares / totalShares) * 100 : 0;
        result.push({
          friend: f,
          shareAmount,
          percentageOfItem: pct,
          detailText: userShares > 0 ? `${userShares} of ${totalShares} portions` : '0 portions',
          isActive: userShares > 0,
        });
      });
    } else if (activeTab === 'percentage') {
      friends.forEach(f => {
        const pct = percentages[f.id] || 0;
        const shareAmount = (pct / 100) * itemPrice;
        result.push({
          friend: f,
          shareAmount,
          percentageOfItem: pct,
          detailText: `${pct}% share`,
          isActive: pct > 0,
        });
      });
    } else if (activeTab === 'exact') {
      friends.forEach(f => {
        const amt = exactAmounts[f.id] || 0;
        const pct = itemPrice > 0 ? (amt / itemPrice) * 100 : 0;
        result.push({
          friend: f,
          shareAmount: amt,
          percentageOfItem: pct,
          detailText: `${formatCurrency(amt, currency)} exact amount`,
          isActive: amt > 0,
        });
      });
    } else if (activeTab === 'units') {
      const unitPrice = item.quantity > 0 ? itemPrice / item.quantity : (totalAllocatedUnits > 0 ? itemPrice / totalAllocatedUnits : itemPrice);
      friends.forEach(f => {
        const count = unitCounts[f.id] || 0;
        const shareAmount = count * unitPrice;
        const pct = itemPrice > 0 ? (shareAmount / itemPrice) * 100 : 0;
        result.push({
          friend: f,
          shareAmount,
          percentageOfItem: pct,
          detailText: `${count} of ${item.quantity || totalAllocatedUnits} units (${formatCurrency(unitPrice, currency)}/ea)`,
          isActive: count > 0,
        });
      });
    }

    return result;
  }, [activeTab, item, friends, selectedFriends, shares, percentages, exactAmounts, unitCounts, totalAllocatedUnits, currency]);

  // Total allocated dollar sum in current mode
  const totalAllocatedDollars = liveBreakdowns.reduce((sum, b) => sum + b.shareAmount, 0);
  const remainingDollars = item.price - totalAllocatedDollars;

  const handleSave = () => {
    let finalAssignedTo: string[] = [];
    let finalSplitMode: GroceryItem['splitMode'] = activeTab;
    let finalShares: Record<string, number> | undefined = undefined;
    let finalPercentages: Record<string, number> | undefined = undefined;
    let finalExactAmounts: Record<string, number> | undefined = undefined;
    let finalUnitCounts: Record<string, number> | undefined = undefined;

    if (activeTab === 'equal') {
      finalAssignedTo = selectedFriends.length > 0 ? selectedFriends : friends.map(f => f.id);
    } else if (activeTab === 'shares') {
      finalShares = {};
      friends.forEach(f => {
        if ((shares[f.id] || 0) > 0) {
          finalShares![f.id] = shares[f.id];
          finalAssignedTo.push(f.id);
        }
      });
      if (finalAssignedTo.length === 0) {
        finalAssignedTo = friends.map(f => f.id);
      }
    } else if (activeTab === 'percentage') {
      finalPercentages = {};
      friends.forEach(f => {
        if ((percentages[f.id] || 0) > 0) {
          finalPercentages![f.id] = percentages[f.id];
          finalAssignedTo.push(f.id);
        }
      });
      if (finalAssignedTo.length === 0) {
        finalAssignedTo = friends.map(f => f.id);
      }
    } else if (activeTab === 'exact') {
      finalExactAmounts = {};
      friends.forEach(f => {
        if ((exactAmounts[f.id] || 0) > 0) {
          finalExactAmounts![f.id] = exactAmounts[f.id];
          finalAssignedTo.push(f.id);
        }
      });
      if (finalAssignedTo.length === 0) {
        finalAssignedTo = friends.map(f => f.id);
      }
    } else if (activeTab === 'units') {
      finalUnitCounts = {};
      friends.forEach(f => {
        if ((unitCounts[f.id] || 0) > 0) {
          finalUnitCounts![f.id] = unitCounts[f.id];
          finalAssignedTo.push(f.id);
        }
      });
      if (finalAssignedTo.length === 0) {
        finalAssignedTo = friends.map(f => f.id);
      }
    }

    onSaveSplit({
      ...item,
      assignedTo: finalAssignedTo,
      splitMode: finalSplitMode,
      shares: finalShares,
      percentages: finalPercentages,
      exactAmounts: finalExactAmounts,
      unitCounts: finalUnitCounts,
    });

    onClose();
  };

  const payerFriend = friends.find(f => f.id === item.paidById) || friends[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Divide className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Split Item: <span className="font-bold">{item.name}</span>
                </h2>
                {item.quantity > 1 && (
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                    Qty: {item.quantity}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                Item total: <strong className="text-slate-900 dark:text-white tabular-nums">{formatCurrency(item.price, currency)}</strong> • Paid by {payerFriend?.name || 'Friend'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Split Mode Selector Tabs */}
        <div className="flex items-center gap-1 px-5 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('equal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'equal'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Split Equally</span>
          </button>

          <button
            onClick={() => setActiveTab('shares')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'shares'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>2. Portions / Shares</span>
          </button>

          <button
            onClick={() => setActiveTab('percentage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'percentage'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>3. Percentages (%)</span>
          </button>

          <button
            onClick={() => setActiveTab('exact')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'exact'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>4. Exact Amounts ($)</span>
          </button>

          {item.quantity > 1 && (
            <button
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'units'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>5. By Quantity Units ({item.quantity})</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: EQUAL SPLIT */}
          {activeTab === 'equal' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select who is sharing this item:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllFriends}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Select All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {friends.map(f => {
                  const isChecked = selectedFriends.includes(f.id);
                  const theme = getColorTheme(f.color);
                  const perPersonAmt = selectedFriends.length > 0 ? item.price / selectedFriends.length : 0;

                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFriendSelection(f.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${theme.avatarBg}`}
                        >
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {f.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {isChecked ? `Pays ${formatCurrency(perPersonAmt, currency)}` : 'Excluded'}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SHARES / PORTIONS */}
          {activeTab === 'shares' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Allocate portions or servings per person (e.g. 2 slices of pizza, 3 bottles of juice). The total cost will be divided proportionally.
              </p>

              <div className="space-y-2">
                {friends.map(f => {
                  const userShares = shares[f.id] || 0;
                  const theme = getColorTheme(f.color);
                  const totalShares = (Object.values(shares) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
                  const shareCost = totalShares > 0 ? (userShares / totalShares) * item.price : 0;

                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${theme.avatarBg}`}
                        >
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {f.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {userShares > 0
                              ? `${userShares} portion(s) • ${formatCurrency(shareCost, currency)}`
                              : '0 portions (no charge)'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateShare(f.id, -1)}
                          disabled={userShares <= 0}
                          className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={userShares}
                          onChange={(e) => setExactShare(f.id, parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-xs font-bold py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => updateShare(f.id, 1)}
                          className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PERCENTAGES (%) */}
          {activeTab === 'percentage' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign custom percentages per person. Must equal 100%.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={normalizePercentages}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Normalize to 100%
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={distributeRemainingPercent}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Fill Remainder
                  </button>
                </div>
              </div>

              {/* Validation Status Bar */}
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center justify-between font-medium ${
                  Math.abs(totalPercentage - 100) < 0.1
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                }`}
              >
                <span>Total Allocated: <strong>{Math.round(totalPercentage * 10) / 10}%</strong></span>
                <span>
                  {Math.abs(totalPercentage - 100) < 0.1
                    ? '✓ Perfectly balanced'
                    : totalPercentage < 100
                    ? `${Math.round((100 - totalPercentage) * 10) / 10}% remaining`
                    : `${Math.round((totalPercentage - 100) * 10) / 10}% over 100%`}
                </span>
              </div>

              <div className="space-y-2">
                {friends.map(f => {
                  const pct = percentages[f.id] || 0;
                  const theme = getColorTheme(f.color);
                  const shareCost = (pct / 100) * item.price;

                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${theme.avatarBg}`}
                        >
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {f.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatCurrency(shareCost, currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={pct}
                            onChange={(e) => updatePercentage(f.id, parseFloat(e.target.value) || 0)}
                            className="w-20 pr-6 text-right text-xs font-bold py-1.5 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="absolute right-2 top-2 text-xs text-slate-400 pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: EXACT AMOUNTS ($) */}
          {activeTab === 'exact' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Specify the exact dollar amount each person should contribute.
                </p>
                {Math.abs(remainingDollars) > 0.01 && (
                  <button
                    type="button"
                    onClick={distributeRemainingAmount}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Distribute Remaining {formatCurrency(remainingDollars, currency)}
                  </button>
                )}
              </div>

              {/* Status Bar */}
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center justify-between font-medium ${
                  Math.abs(remainingDollars) < 0.02
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                }`}
              >
                <span>Allocated: <strong>{formatCurrency(totalExactAmount, currency)}</strong> of {formatCurrency(item.price, currency)}</span>
                <span>
                  {Math.abs(remainingDollars) < 0.02
                    ? '✓ Full amount allocated'
                    : remainingDollars > 0
                    ? `Remaining: ${formatCurrency(remainingDollars, currency)}`
                    : `Over allocated: ${formatCurrency(-remainingDollars, currency)}`}
                </span>
              </div>

              <div className="space-y-2">
                {friends.map(f => {
                  const amt = exactAmounts[f.id] || 0;
                  const theme = getColorTheme(f.color);
                  const pct = item.price > 0 ? (amt / item.price) * 100 : 0;

                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${theme.avatarBg}`}
                        >
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {f.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {Math.round(pct * 10) / 10}% of item
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 pointer-events-none">
                          {currency}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amt}
                          onChange={(e) => updateExactAmount(f.id, parseFloat(e.target.value) || 0)}
                          className="w-24 pl-6 pr-2 text-right text-xs font-bold py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: BY QUANTITY UNITS */}
          {activeTab === 'units' && item.quantity > 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This item has a quantity of <strong>{item.quantity}</strong> ({formatCurrency(item.price / item.quantity, currency)} each). Distribute the units to each person.
              </p>

              <div
                className={`p-2.5 rounded-lg text-xs flex items-center justify-between font-medium ${
                  totalAllocatedUnits === item.quantity
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                }`}
              >
                <span>Allocated Units: <strong>{totalAllocatedUnits}</strong> of {item.quantity}</span>
                <span>
                  {totalAllocatedUnits === item.quantity
                    ? '✓ All units assigned'
                    : totalAllocatedUnits < item.quantity
                    ? `${item.quantity - totalAllocatedUnits} unassigned`
                    : `${totalAllocatedUnits - item.quantity} excess units`}
                </span>
              </div>

              <div className="space-y-2">
                {friends.map(f => {
                  const count = unitCounts[f.id] || 0;
                  const theme = getColorTheme(f.color);
                  const unitPrice = item.price / item.quantity;
                  const totalForFriend = count * unitPrice;

                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${theme.avatarBg}`}
                        >
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {f.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {count} units • {formatCurrency(totalForFriend, currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateUnits(f.id, -1)}
                          disabled={count <= 0}
                          className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateUnits(f.id, 1)}
                          className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Proportional Distribution Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span>Split Distribution</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatCurrency(totalAllocatedDollars, currency)} / {formatCurrency(item.price, currency)}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              {liveBreakdowns.map(b => {
                if (b.percentageOfItem <= 0) return null;
                const theme = getColorTheme(b.friend.color);
                return (
                  <div
                    key={b.friend.id}
                    style={{ width: `${Math.min(100, b.percentageOfItem)}%` }}
                    className={`${theme.badgeBg} h-full transition-all`}
                    title={`${b.friend.name}: ${formatCurrency(b.shareAmount, currency)} (${Math.round(b.percentageOfItem)}%)`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Save Split</span>
          </button>
        </div>
      </div>
    </div>
  );
};
