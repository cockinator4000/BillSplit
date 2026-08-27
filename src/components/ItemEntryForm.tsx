import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, Check, X, Tag, SlidersHorizontal } from 'lucide-react';
import { Friend, GroceryItem } from '../types';
import { getColorTheme } from '../utils/colors';

interface ItemEntryFormProps {
  friends: Friend[];
  defaultPayerId: string;
  currency: string;
  onAddItem: (item: Omit<GroceryItem, 'id' | 'createdAt'>) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const COMMON_CATEGORIES = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Bakery',
  'Beverages',
  'Alcohol',
  'Snacks & Sweets',
  'Pantry',
  'Household',
  'General',
];

export const ItemEntryForm: React.FC<ItemEntryFormProps> = ({
  friends,
  defaultPayerId,
  currency,
  onAddItem,
  isOpen = true,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('Produce');
  const [paidById, setPaidById] = useState(defaultPayerId || (friends[0]?.id ?? ''));
  const [assignedTo, setAssignedTo] = useState<string[]>(friends.map(f => f.id));
  const [splitMode, setSplitMode] = useState<'equal' | 'shares'>('equal');
  const [shares, setShares] = useState<Record<string, number>>({});
  const [showAdvancedShares, setShowAdvancedShares] = useState(false);

  // Sync default payer when friends change
  useEffect(() => {
    if (defaultPayerId) {
      setPaidById(defaultPayerId);
    } else if (friends.length > 0 && !paidById) {
      setPaidById(friends[0].id);
    }
  }, [defaultPayerId, friends]);

  // Keep assigned friends valid
  useEffect(() => {
    const validIds = friends.map(f => f.id);
    setAssignedTo(prev => {
      const filtered = prev.filter(id => validIds.includes(id));
      return filtered.length > 0 ? filtered : validIds;
    });
  }, [friends]);

  const toggleFriend = (id: string) => {
    if (assignedTo.includes(id)) {
      if (assignedTo.length > 1) {
        setAssignedTo(assignedTo.filter(fId => fId !== id));
      }
    } else {
      setAssignedTo([...assignedTo, id]);
    }
  };

  const selectEveryone = () => {
    setAssignedTo(friends.map(f => f.id));
  };

  const selectOnlyMe = (myId: string) => {
    setAssignedTo([myId]);
  };

  const handleShareChange = (friendId: string, count: number) => {
    setShares(prev => ({
      ...prev,
      [friendId]: Math.max(0, count),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    const numQty = parseFloat(quantity) || 1;

    if (!name.trim() || isNaN(numPrice) || numPrice <= 0) {
      return;
    }

    // If shares mode is active, prepare shares record
    let finalShares: Record<string, number> | undefined = undefined;
    if (splitMode === 'shares') {
      finalShares = {};
      assignedTo.forEach(fId => {
        finalShares![fId] = shares[fId] !== undefined ? shares[fId] : 1;
      });
    }

    onAddItem({
      name: name.trim(),
      price: Math.round(numPrice * 100) / 100,
      quantity: numQty,
      category,
      paidById: paidById || friends[0]?.id,
      assignedTo: assignedTo.length > 0 ? assignedTo : friends.map(f => f.id),
      splitMode,
      shares: finalShares,
    });

    // Reset inputs for next rapid entry
    setName('');
    setPrice('');
    setQuantity('1');
    // Keep payer and category/assigned default for speed
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isEveryoneSelected = assignedTo.length === friends.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Manual Item Entry
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400">
              Quickly add single grocery items or custom split receipts
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name, Price, Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Item Name *
            </label>
            <input
              id="input-item-name"
              type="text"
              placeholder="e.g. Oat Milk, Avocados, Ribeye Steak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Cost ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-medium text-xs sm:text-sm">
                {currency}
              </span>
              <input
                id="input-item-price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quantity / Units
            </label>
            <input
              id="input-item-qty"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
            />
          </div>
        </div>

        {/* Row 2: Category & Paid By */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              Category
            </label>
            <select
              id="select-item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {COMMON_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Who paid at register?
            </label>
            <select
              id="select-item-paidby"
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {friends.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.isDefaultPayer ? '(Default Payer)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Split Assignment */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Split With:
              </span>
              <span className="text-xs text-slate-400">
                ({assignedTo.length} of {friends.length} people)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectEveryone}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  isEveryoneSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Everyone
              </button>

              {friends.length > 1 && (
                <button
                  type="button"
                  onClick={() => selectOnlyMe(friends[0].id)}
                  className="text-xs px-2.5 py-1 rounded-md font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Just {friends[0].name}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowAdvancedShares(!showAdvancedShares);
                  setSplitMode(showAdvancedShares ? 'equal' : 'shares');
                }}
                className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium"
                title="Custom servings/shares per person"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{showAdvancedShares ? 'Equal Split' : 'Custom Shares'}</span>
              </button>
            </div>
          </div>

          {/* Friend Toggle Badges */}
          <div className="flex flex-wrap gap-2">
            {friends.map(f => {
              const isSelected = assignedTo.includes(f.id);
              const theme = getColorTheme(f.color);

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFriend(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isSelected
                      ? `${theme.badgeBg} ${theme.badgeBorder} ring-1 ${theme.activeRing}`
                      : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? theme.avatarBg : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f.name.charAt(0)}
                  </div>
                  <span>{f.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>

          {/* Custom weighted shares per person if enabled */}
          {showAdvancedShares && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-400 mb-2">
                Specify unequal portions (e.g. 2 beers for Alex, 1 for Sam):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {friends.filter(f => assignedTo.includes(f.id)).map(f => (
                  <div key={f.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-medium truncate flex-1">{f.name}:</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={shares[f.id] !== undefined ? shares[f.id] : 1}
                      onChange={(e) => handleShareChange(f.id, parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 text-xs text-center border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-bold tabular-nums"
                    />
                    <span className="text-[10px] text-slate-400">share</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            id="btn-submit-add-item"
            type="submit"
            disabled={!name.trim() || !price}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Item to Bill</span>
          </button>
        </div>
      </form>
    </div>
  );
};
