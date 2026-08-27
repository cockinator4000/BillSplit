export interface Friend {
  id: string;
  name: string;
  color: string; // e.g. emerald, blue, purple, amber, rose, indigo, teal, orange
  bgColor: string;
  textColor: string;
  borderColor: string;
  isDefaultPayer?: boolean;
}

export interface GroceryItem {
  id: string;
  name: string;
  price: number; // total price for this row
  quantity: number;
  unitPrice?: number;
  category?: string;
  paidById: string; // friend ID who paid
  assignedTo: string[]; // friend IDs who share this item. If empty, treated as unassigned or all depending on mode
  splitMode: 'equal' | 'shares' | 'percentage' | 'exact' | 'units'; // equal among assigned, weighted shares, exact percentage, exact dollar amounts, or units/portions
  shares?: Record<string, number>; // friendId -> number of shares (e.g. 2 shares vs 1 share)
  percentages?: Record<string, number>; // friendId -> percentage (e.g. 60 for 60%)
  exactAmounts?: Record<string, number>; // friendId -> exact amount (e.g. $12.50)
  unitCounts?: Record<string, number>; // friendId -> exact quantity units (e.g. 2 of 6 beers)
  notes?: string;
  createdAt: number;
}

export interface GlobalAdjustments {
  currency: string;
  taxType: 'fixed' | 'percent';
  taxValue: number;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  tipType: 'fixed' | 'percent';
  tipValue: number;
  splitAdjustmentsMode: 'proportional' | 'equal'; // Proportional to items consumed or split equally
}

export interface FriendSummary {
  friend: Friend;
  itemsSubtotal: number;
  taxShare: number;
  discountShare: number;
  tipShare: number;
  totalOwed: number; // Total they should pay for what they used
  totalPaid: number; // Total they paid up front at checkout
  netBalance: number; // totalPaid - totalOwed (positive = receives money, negative = owes money)
  itemBreakdowns: {
    item: GroceryItem;
    theirShareAmount: number;
    shareDescription: string;
  }[];
}

export interface SettlementTransfer {
  fromFriend: Friend;
  toFriend: Friend;
  amount: number;
}

export interface CSVColumnMapping {
  name: string;
  price: string;
  quantity?: string;
  category?: string;
  paidBy?: string;
  assignedTo?: string;
}
