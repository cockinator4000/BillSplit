import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { FriendsManager } from './components/FriendsManager';
import { ItemEntryForm } from './components/ItemEntryForm';
import { ItemList } from './components/ItemList';
import { TaxAdjustmentsBar } from './components/TaxAdjustmentsBar';
import { BalanceSummary } from './components/BalanceSummary';
import { CSVImportModal } from './components/CSVImportModal';
import { ExportModal } from './components/ExportModal';
import { Friend, GroceryItem, GlobalAdjustments } from './types';
import { calculateSettlement, formatCurrency } from './utils/calculations';
import { FRIEND_COLORS } from './utils/colors';
import { parseCSVString, convertRowsToGroceryItems, SAMPLE_CSV_CONTENT } from './utils/csvParser';
import { LayoutList, Calculator, Plus, Upload, Sparkles } from 'lucide-react';

const STORAGE_KEY_FRIENDS = 'grocery_splitter_friends_v1';
const STORAGE_KEY_ITEMS = 'grocery_splitter_items_v1';
const STORAGE_KEY_ADJUSTMENTS = 'grocery_splitter_adjustments_v1';

const INITIAL_FRIENDS: Friend[] = [
  {
    id: 'friend_you',
    name: 'You',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    isDefaultPayer: true,
  },
  {
    id: 'friend_alex',
    name: 'Alex',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'friend_sam',
    name: 'Sam',
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  {
    id: 'friend_jordan',
    name: 'Jordan',
    color: 'rose',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
  },
];

const INITIAL_ADJUSTMENTS: GlobalAdjustments = {
  currency: '$',
  taxType: 'percent',
  taxValue: 0,
  discountType: 'fixed',
  discountValue: 0,
  tipType: 'fixed',
  tipValue: 0,
  splitAdjustmentsMode: 'proportional',
};

export default function App() {
  // State Initialization from LocalStorage
  const [friends, setFriends] = useState<Friend[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FRIENDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_FRIENDS;
  });

  const [items, setItems] = useState<GroceryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [adjustments, setAdjustments] = useState<GlobalAdjustments>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADJUSTMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ADJUSTMENTS;
  });

  // Active View Tab on smaller screens / general toggle: 'items' | 'settlement'
  const [activeTab, setActiveTab] = useState<'items' | 'settlement'>('items');

  // Modals
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddItemFormOpen, setIsAddItemFormOpen] = useState(true);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADJUSTMENTS, JSON.stringify(adjustments));
  }, [adjustments]);

  // Load starter demo if items are completely empty on first load
  useEffect(() => {
    if (items.length === 0) {
      loadDemoData();
    }
  }, []);

  const defaultPayer = useMemo(() => {
    return friends.find(f => f.isDefaultPayer) || friends[0];
  }, [friends]);

  const defaultPayerId = defaultPayer ? defaultPayer.id : '';

  // Calculate settlement balances
  const settlement = useMemo(() => {
    return calculateSettlement(friends, items, adjustments);
  }, [friends, items, adjustments]);

  // Handlers for Friends
  const handleAddFriend = (name: string, colorId?: string) => {
    const newId = 'friend_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
    const color = colorId || FRIEND_COLORS[friends.length % FRIEND_COLORS.length].id;
    const newFriend: Friend = {
      id: newId,
      name,
      color,
      bgColor: `bg-${color}-50`,
      textColor: `text-${color}-700`,
      borderColor: `border-${color}-200`,
      isDefaultPayer: friends.length === 0,
    };
    setFriends(prev => [...prev, newFriend]);
  };

  const handleRemoveFriend = (id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id));
    // Clean up from items
    setItems(prev =>
      prev.map(item => ({
        ...item,
        assignedTo: item.assignedTo.filter(fId => fId !== id),
        paidById: item.paidById === id ? (friends.find(f => f.id !== id)?.id || '') : item.paidById,
      }))
    );
  };

  const handleUpdateFriend = (updated: Friend) => {
    setFriends(prev => prev.map(f => (f.id === updated.id ? updated : f)));
  };

  const handleSetDefaultPayer = (id: string) => {
    setFriends(prev =>
      prev.map(f => ({
        ...f,
        isDefaultPayer: f.id === id,
      }))
    );
  };

  // Handlers for Items
  const handleAddItem = (itemData: Omit<GroceryItem, 'id' | 'createdAt'>) => {
    const newItem: GroceryItem = {
      ...itemData,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
    };
    setItems(prev => [newItem, ...prev]);
  };

  const handleUpdateItem = (updated: GroceryItem) => {
    setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleDeleteMultiple = (ids: string[]) => {
    const set = new Set(ids);
    setItems(prev => prev.filter(i => !set.has(i.id)));
  };

  const handleBulkAssign = (itemIds: string[], friendIds: string[]) => {
    const set = new Set(itemIds);
    setItems(prev =>
      prev.map(i => (set.has(i.id) ? { ...i, assignedTo: friendIds } : i))
    );
  };

  const handleBulkSetPayer = (itemIds: string[], payerId: string) => {
    const set = new Set(itemIds);
    setItems(prev =>
      prev.map(i => (set.has(i.id) ? { ...i, paidById: payerId } : i))
    );
  };

  const handleImportItems = (newItems: GroceryItem[]) => {
    setItems(prev => [...newItems, ...prev]);
  };

  const loadDemoData = async () => {
    try {
      const parsed = await parseCSVString(SAMPLE_CSV_CONTENT);
      const demoItems = convertRowsToGroceryItems(
        parsed.rows,
        {
          nameCol: 'Item',
          priceCol: 'Price',
          qtyCol: 'Quantity',
          categoryCol: 'Category',
          paidByCol: 'Paid By',
          assignedToCol: 'Split With',
        },
        friends.length > 0 ? friends : INITIAL_FRIENDS,
        defaultPayerId || INITIAL_FRIENDS[0].id
      );
      setItems(demoItems);
    } catch (e) {
      console.error('Failed to load demo data', e);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to clear all grocery items and reset?')) {
      setItems([]);
      setAdjustments(INITIAL_ADJUSTMENTS);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Top Navbar */}
      <Navbar
        itemCount={items.length}
        totalSum={settlement.grandTotal}
        currency={adjustments.currency}
        onCurrencyChange={(c) => setAdjustments(prev => ({ ...prev, currency: c }))}
        onOpenCSVModal={() => setIsCSVModalOpen(true)}
        onOpenAddItem={() => {
          setActiveTab('items');
          setIsAddItemFormOpen(true);
        }}
        onLoadDemoData={loadDemoData}
        onResetData={handleResetData}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Friends Manager Strip */}
        <FriendsManager
          friends={friends}
          onAddFriend={handleAddFriend}
          onRemoveFriend={handleRemoveFriend}
          onUpdateFriend={handleUpdateFriend}
          onSetDefaultPayer={handleSetDefaultPayer}
        />

        {/* View Switcher Tabs for Mobile & Quick Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl">
            <button
              id="tab-items-view"
              onClick={() => setActiveTab('items')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'items'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutList className={`w-4 h-4 ${activeTab === 'items' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span>1. Grocery Items & Bill ({items.length})</span>
            </button>

            <button
              id="tab-settlement-view"
              onClick={() => setActiveTab('settlement')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'settlement'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calculator className={`w-4 h-4 ${activeTab === 'settlement' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span>2. Final Balance & Settlement</span>
              {settlement.transfers.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Total:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(settlement.grandTotal, adjustments.currency)}
            </span>
          </div>
        </div>

        {/* VIEW 1: ITEMS & BILL CONFIGURATION */}
        {activeTab === 'items' && (
          <div className="space-y-6">
            {/* Quick Hero Banner if empty */}
            {items.length === 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Ready to split your grocery bill!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                  Import your transaction .csv file or add items manually below to assign who pays for what.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setIsCSVModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import CSV File</span>
                  </button>
                  <button
                    onClick={loadDemoData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Load Demo Receipt</span>
                  </button>
                </div>
              </div>
            )}

            {/* Manual Entry Form */}
            <ItemEntryForm
              friends={friends}
              defaultPayerId={defaultPayerId}
              currency={adjustments.currency}
              onAddItem={handleAddItem}
              isOpen={isAddItemFormOpen}
              onClose={items.length > 0 ? () => setIsAddItemFormOpen(false) : undefined}
            />

            {!isAddItemFormOpen && (
              <button
                onClick={() => setIsAddItemFormOpen(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Item</span>
              </button>
            )}

            {/* Tax, Discounts & Fees Bar */}
            <TaxAdjustmentsBar
              adjustments={adjustments}
              onChange={setAdjustments}
              itemsSubtotal={settlement.itemsSubtotal}
              currency={adjustments.currency}
            />

            {/* Main Interactive Items Table */}
            <ItemList
              items={items}
              friends={friends}
              currency={adjustments.currency}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onDeleteMultiple={handleDeleteMultiple}
              onBulkAssign={handleBulkAssign}
              onBulkSetPayer={handleBulkSetPayer}
            />

            {/* Bottom action to jump to Settlement */}
            {items.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-xl shadow-xs">
                <div>
                  <h4 className="text-sm font-semibold">Done reviewing items?</h4>
                  <p className="text-xs text-indigo-100">
                    See who owes whom and generate final payment summary
                  </p>
                </div>
                <button
                  id="btn-view-settlement-bottom"
                  onClick={() => {
                    setActiveTab('settlement');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-medium bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 shadow-xs transition-colors"
                >
                  View Final Settlement →
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: FINAL SETTLEMENT & BALANCE SUMMARY */}
        {activeTab === 'settlement' && (
          <div className="space-y-6">
            <BalanceSummary
              friendSummaries={settlement.friendSummaries}
              transfers={settlement.transfers}
              grandTotal={settlement.grandTotal}
              itemsSubtotal={settlement.itemsSubtotal}
              totalTax={settlement.totalTax}
              totalDiscount={settlement.totalDiscount}
              totalTip={settlement.totalTip}
              currency={adjustments.currency}
              adjustments={adjustments}
            />

            {/* Quick Share Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Ready to send to the group chat?
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-400">
                  Export formatted WhatsApp summary or download spreadsheet
                </p>
              </div>
              <button
                id="btn-open-share-bottom"
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2 text-xs sm:text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-xs transition-colors"
              >
                Share & Export Summary
              </button>
            </div>
          </div>
        )}
      </main>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        friends={friends}
        defaultPayerId={defaultPayerId}
        currency={adjustments.currency}
        onImportItems={handleImportItems}
      />

      {/* Share / Export Modal */}
      <ExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        friendSummaries={settlement.friendSummaries}
        transfers={settlement.transfers}
        grandTotal={settlement.grandTotal}
        adjustments={adjustments}
      />
    </div>
  );
}
