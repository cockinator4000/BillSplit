import React, { useState, useMemo } from 'react';
import { Search, Filter, Trash2, CheckSquare, Square, Users, Edit2, Check, X, Tag, Divide, PieChart, Percent, DollarSign, Package } from 'lucide-react';
import { GroceryItem, Friend } from '../types';
import { getColorTheme } from '../utils/colors';
import { formatCurrency } from '../utils/calculations';
import { SplitItemModal } from './SplitItemModal';

interface ItemListProps {
  items: GroceryItem[];
  friends: Friend[];
  currency: string;
  onUpdateItem: (item: GroceryItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onBulkAssign: (itemIds: string[], friendIds: string[]) => void;
  onBulkSetPayer: (itemIds: string[], payerId: string) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  friends,
  currency,
  onUpdateItem,
  onDeleteItem,
  onDeleteMultiple,
  onBulkAssign,
  onBulkSetPayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterFriendId, setFilterFriendId] = useState<string>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [splittingItem, setSplittingItem] = useState<GroceryItem | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Friend filter (items assigned to friend or paid by friend)
      if (filterFriendId !== 'all') {
        const isAssigned = item.assignedTo.includes(filterFriendId) || item.assignedTo.length === 0;
        const isPayer = item.paidById === filterFriendId;
        if (!isAssigned && !isPayer) return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, filterFriendId]);

  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      const all = new Set<string>();
      filteredItems.forEach(i => all.add(i.id));
      setSelectedItemIds(all);
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  const handleToggleFriendOnItem = (item: GroceryItem, friendId: string) => {
    let newAssigned: string[];
    const current = item.assignedTo.length === 0 ? friends.map(f => f.id) : item.assignedTo;

    if (current.includes(friendId)) {
      // Don't remove if it's the last person
      if (current.length > 1) {
        newAssigned = current.filter(id => id !== friendId);
      } else {
        newAssigned = current;
      }
    } else {
      newAssigned = [...current, friendId];
    }

    onUpdateItem({
      ...item,
      assignedTo: newAssigned,
    });
  };

  const handleSetEveryoneOnItem = (item: GroceryItem) => {
    onUpdateItem({
      ...item,
      assignedTo: friends.map(f => f.id),
    });
  };

  const startEdit = (item: GroceryItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
  };

  const saveEdit = (item: GroceryItem) => {
    const parsedPrice = parseFloat(editPrice);
    if (editName.trim() && !isNaN(parsedPrice) && parsedPrice > 0) {
      onUpdateItem({
        ...item,
        name: editName.trim(),
        price: Math.round(parsedPrice * 100) / 100,
      });
    }
    setEditingItemId(null);
  };

  const handleBulkDelete = () => {
    if (selectedItemIds.size === 0) return;
    onDeleteMultiple(Array.from(selectedItemIds));
    setSelectedItemIds(new Set());
  };

  const handleBulkSplitEveryone = () => {
    if (selectedItemIds.size === 0) return;
    onBulkAssign(Array.from(selectedItemIds), friends.map(f => f.id));
    setSelectedItemIds(new Set());
  };

  const handleBulkAssignToPerson = (friendId: string) => {
    if (selectedItemIds.size === 0) return;
    onBulkAssign(Array.from(selectedItemIds), [friendId]);
    setSelectedItemIds(new Set());
  };

  const handleBulkPayer = (payerId: string) => {
    if (selectedItemIds.size === 0) return;
    onBulkSetPayer(Array.from(selectedItemIds), payerId);
  };

  const totalFilteredPrice = filteredItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
      {/* Header & Search */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Transaction Items ({items.length})
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
              Total: {formatCurrency(totalFilteredPrice, currency)}
            </span>
          </div>

          {/* Quick Filter dropdown by Friend */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium hidden sm:inline uppercase tracking-wider">
              Filter by person:
            </label>
            <select
              aria-label="Filter items by person"
              value={filterFriendId}
              onChange={(e) => setFilterFriendId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="all">All People</option>
              {friends.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input & Category pills */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category quick scroll */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-xs px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Batch Actions Toolbar if any items selected */}
        {selectedItemIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800/80 text-xs">
            <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>{selectedItemIds.size} items selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleBulkSplitEveryone}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-medium"
              >
                Split with Everyone
              </button>

              {friends.length <= 4 && friends.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleBulkAssignToPerson(f.id)}
                  className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-medium"
                >
                  Just {f.name}
                </button>
              ))}

              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Header Bar */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
        <div className="sm:col-span-6 flex items-center gap-3">
          <span className="w-4"></span>
          <span>Item Description</span>
        </div>
        <div className="sm:col-span-2 text-right">Price</div>
        <div className="sm:col-span-4 text-center">Assigned To</div>
      </div>

      {/* Item List Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[580px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-medium">No grocery items found.</p>
            <p className="text-xs mt-1">Import a CSV receipt or add items using the form above.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isSelected = selectedItemIds.has(item.id);
            const isEditing = editingItemId === item.id;
            const assignedIds = item.assignedTo.length === 0 ? friends.map(f => f.id) : item.assignedTo;
            const isSplitWithAll = assignedIds.length === friends.length;
            const perPersonCost = assignedIds.length > 0 ? item.price / assignedIds.length : item.price;
            const payerFriend = friends.find(f => f.id === item.paidById) || friends[0];

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:px-6 sm:py-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                }`}
              >
                {/* Left: Checkbox + Name + Price + Category */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleSelectItem(item.id)}
                    className="mt-0.5 sm:mt-0 text-slate-400 hover:text-indigo-600 focus:outline-none"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 text-xs sm:text-sm font-semibold rounded bg-white dark:bg-slate-900 border border-indigo-500 w-44"
                          autoFocus
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="px-2 py-1 text-xs sm:text-sm font-bold rounded bg-white dark:bg-slate-900 border border-indigo-500 w-20"
                        />
                        <button
                          onClick={() => saveEdit(item)}
                          className="p-1 text-indigo-600 hover:text-indigo-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItemId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            x{item.quantity}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {item.category}
                          </span>
                        )}
                        {item.splitMode === 'shares' && (
                          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <PieChart className="w-2.5 h-2.5" />
                            Portions
                          </span>
                        )}
                        {item.splitMode === 'percentage' && (
                          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Percent className="w-2.5 h-2.5" />
                            % Split
                          </span>
                        )}
                        {item.splitMode === 'exact' && (
                          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <DollarSign className="w-2.5 h-2.5" />
                            Exact $
                          </span>
                        )}
                        {item.splitMode === 'units' && (
                          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Package className="w-2.5 h-2.5" />
                            Units
                          </span>
                        )}
                      </div>
                    )}

                    {/* Calculation breakdown hint */}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {formatCurrency(item.price, currency)}
                      </span>
                      <span>·</span>
                      <span>
                        {item.splitMode === 'shares'
                          ? `Custom portions (${assignedIds.length} people)`
                          : item.splitMode === 'percentage'
                          ? `Custom percentage (${assignedIds.length} people)`
                          : item.splitMode === 'exact'
                          ? `Exact amounts (${assignedIds.length} people)`
                          : item.splitMode === 'units'
                          ? `Split by units (${assignedIds.length} people)`
                          : isSplitWithAll
                          ? `Split All (${formatCurrency(perPersonCost, currency)} each)`
                          : `${assignedIds.length} split (${formatCurrency(perPersonCost, currency)} each)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center / Right: Friends Allocation Badges & Payer */}
                <div className="flex flex-wrap items-center gap-2.5 pl-7 sm:pl-0">
                  {/* Dedicated Split Modal Button */}
                  <button
                    type="button"
                    onClick={() => setSplittingItem(item)}
                    title="Open detailed split options (shares, percentages, exact amounts, or equal)"
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Divide className="w-3.5 h-3.5" />
                    <span>Split</span>
                  </button>

                  {/* Friend toggles per item */}
                  <div className="flex items-center gap-1">
                    {isSplitWithAll && item.splitMode === 'equal' ? (
                      <span className="text-slate-400 italic text-xs px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded">
                        Split All
                      </span>
                    ) : (
                      friends.map(f => {
                        const isAssigned = assignedIds.includes(f.id);
                        const theme = getColorTheme(f.color);

                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleToggleFriendOnItem(item, f.id)}
                            title={
                              isAssigned
                                ? `Click to remove ${f.name} from this item`
                                : `Click to add ${f.name} to this item`
                            }
                            className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all flex items-center justify-center ${
                              isAssigned
                                ? `${theme.avatarBg} shadow-xs ring-1 ${theme.activeRing}`
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-40 hover:opacity-90'
                            }`}
                          >
                            {f.name.charAt(0)}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Quick "+All" toggle button */}
                  {(!isSplitWithAll || item.splitMode !== 'equal') && (
                    <button
                      onClick={() => handleSetEveryoneOnItem(item)}
                      title="Reset and split this item with everyone equally"
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      +All
                    </button>
                  )}

                  {/* Payer dropdown */}
                  <div className="flex items-center gap-1 text-xs">
                    <select
                      aria-label="Paid by"
                      value={item.paidById}
                      onChange={(e) => onUpdateItem({ ...item, paidById: e.target.value })}
                      className="px-2 py-1 text-xs font-semibold rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      {friends.map(f => (
                        <option key={f.id} value={f.id}>
                          Paid: {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => startEdit(item)}
                    title="Edit item name or price"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    title="Delete item"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary / Select all bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={toggleSelectAll}
          className="font-medium text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1.5"
        >
          {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? (
            <>
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Deselect All</span>
            </>
          ) : (
            <>
              <Square className="w-3.5 h-3.5" />
              <span>Select All Visible</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3">
          <span>
            Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items
          </span>
          <span className="font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalFilteredPrice, currency)}
          </span>
        </div>
      </div>

      {/* Split Item Modal */}
      <SplitItemModal
        isOpen={!!splittingItem}
        item={splittingItem}
        friends={friends}
        currency={currency}
        onClose={() => setSplittingItem(null)}
        onSaveSplit={(updatedItem) => {
          onUpdateItem(updatedItem);
          setSplittingItem(null);
        }}
      />
    </div>
  );
};
