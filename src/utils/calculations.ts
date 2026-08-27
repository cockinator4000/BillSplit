import { Friend, GroceryItem, GlobalAdjustments, FriendSummary, SettlementTransfer } from '../types';

export function calculateSettlement(
  friends: Friend[],
  items: GroceryItem[],
  adjustments: GlobalAdjustments
): {
  itemsSubtotal: number;
  totalTax: number;
  totalDiscount: number;
  totalTip: number;
  grandTotal: number;
  totalPaidSum: number;
  isBalanced: boolean;
  friendSummaries: FriendSummary[];
  transfers: SettlementTransfer[];
} {
  if (friends.length === 0) {
    return {
      itemsSubtotal: 0,
      totalTax: 0,
      totalDiscount: 0,
      totalTip: 0,
      grandTotal: 0,
      totalPaidSum: 0,
      isBalanced: true,
      friendSummaries: [],
      transfers: [],
    };
  }

  const friendMap = new Map<string, Friend>();
  friends.forEach(f => friendMap.set(f.id, f));

  // Initialize summary map
  const summaryMap = new Map<string, {
    itemsSubtotal: number;
    totalPaid: number;
    itemBreakdowns: {
      item: GroceryItem;
      theirShareAmount: number;
      shareDescription: string;
    }[];
  }>();

  friends.forEach(f => {
    summaryMap.set(f.id, {
      itemsSubtotal: 0,
      totalPaid: 0,
      itemBreakdowns: [],
    });
  });

  let itemsSubtotal = 0;

  // Process items
  items.forEach(item => {
    const itemPrice = Number(item.price) || 0;
    itemsSubtotal += itemPrice;

    // Track who paid for this item
    const payerId = item.paidById || friends[0]?.id;
    if (payerId && summaryMap.has(payerId)) {
      summaryMap.get(payerId)!.totalPaid += itemPrice;
    }

    // Determine who shares this item
    let assigned = item.assignedTo || [];
    // If no one explicitly selected, default to all friends
    if (assigned.length === 0) {
      assigned = friends.map(f => f.id);
    }

    // Filter to currently valid friends
    const validAssigned = assigned.filter(id => friendMap.has(id));
    if (validAssigned.length === 0) return;

    if (item.splitMode === 'shares' && item.shares) {
      // Calculate weighted shares / portions
      let totalShares = 0;
      validAssigned.forEach(id => {
        totalShares += Number(item.shares?.[id]) || 0;
      });

      if (totalShares <= 0) {
        const perPerson = itemPrice / validAssigned.length;
        validAssigned.forEach(id => {
          const friendData = summaryMap.get(id);
          if (friendData) {
            friendData.itemsSubtotal += perPerson;
            friendData.itemBreakdowns.push({
              item,
              theirShareAmount: perPerson,
              shareDescription: `1/${validAssigned.length} share of ${item.name}`,
            });
          }
        });
      } else {
        validAssigned.forEach(id => {
          const shareUnits = Number(item.shares?.[id]) || 0;
          if (shareUnits > 0) {
            const friendSharePrice = (shareUnits / totalShares) * itemPrice;
            const friendData = summaryMap.get(id);
            if (friendData) {
              friendData.itemsSubtotal += friendSharePrice;
              friendData.itemBreakdowns.push({
                item,
                theirShareAmount: friendSharePrice,
                shareDescription: `${shareUnits}/${totalShares} portions of ${item.name}`,
              });
            }
          }
        });
      }
    } else if (item.splitMode === 'percentage' && item.percentages) {
      // Percentage split
      let totalPct = 0;
      validAssigned.forEach(id => {
        totalPct += Number(item.percentages?.[id]) || 0;
      });

      const scale = totalPct > 0 ? 100 / totalPct : 1;
      validAssigned.forEach(id => {
        const rawPct = Number(item.percentages?.[id]) || 0;
        if (rawPct > 0) {
          // If sum is already 100 or close, use rawPct; otherwise normalized
          const effPct = totalPct > 0 ? (rawPct / totalPct) * 100 : 0;
          const friendSharePrice = (effPct / 100) * itemPrice;
          const friendData = summaryMap.get(id);
          if (friendData) {
            friendData.itemsSubtotal += friendSharePrice;
            friendData.itemBreakdowns.push({
              item,
              theirShareAmount: friendSharePrice,
              shareDescription: `${Math.round(effPct * 10) / 10}% of ${item.name}`,
            });
          }
        }
      });
    } else if (item.splitMode === 'exact' && item.exactAmounts) {
      // Exact dollar amount split
      let totalExact = 0;
      validAssigned.forEach(id => {
        totalExact += Number(item.exactAmounts?.[id]) || 0;
      });

      validAssigned.forEach(id => {
        const friendAmount = Number(item.exactAmounts?.[id]) || 0;
        if (friendAmount > 0) {
          const friendData = summaryMap.get(id);
          if (friendData) {
            friendData.itemsSubtotal += friendAmount;
            friendData.itemBreakdowns.push({
              item,
              theirShareAmount: friendAmount,
              shareDescription: `Exact custom amount for ${item.name}`,
            });
          }
        }
      });
    } else if (item.splitMode === 'units' && item.unitCounts) {
      // Split by physical quantity / units
      let totalUnits = 0;
      validAssigned.forEach(id => {
        totalUnits += Number(item.unitCounts?.[id]) || 0;
      });

      const unitPrice = item.quantity > 0 ? itemPrice / item.quantity : (totalUnits > 0 ? itemPrice / totalUnits : itemPrice);

      validAssigned.forEach(id => {
        const count = Number(item.unitCounts?.[id]) || 0;
        if (count > 0) {
          const friendSharePrice = count * unitPrice;
          const friendData = summaryMap.get(id);
          if (friendData) {
            friendData.itemsSubtotal += friendSharePrice;
            friendData.itemBreakdowns.push({
              item,
              theirShareAmount: friendSharePrice,
              shareDescription: `${count} of ${item.quantity || totalUnits} units of ${item.name}`,
            });
          }
        }
      });
    } else {
      // Equal split among assigned
      const perPerson = itemPrice / validAssigned.length;
      validAssigned.forEach(id => {
        const friendData = summaryMap.get(id);
        if (friendData) {
          friendData.itemsSubtotal += perPerson;
          friendData.itemBreakdowns.push({
            item,
            theirShareAmount: perPerson,
            shareDescription: validAssigned.length === friends.length
              ? `Split evenly (${validAssigned.length} people)`
              : `Shared with ${validAssigned.length} people`,
          });
        }
      });
    }
  });

  // Calculate Adjustments
  let totalTax = 0;
  if (adjustments.taxType === 'percent') {
    totalTax = (itemsSubtotal * (Number(adjustments.taxValue) || 0)) / 100;
  } else {
    totalTax = Number(adjustments.taxValue) || 0;
  }

  let totalDiscount = 0;
  if (adjustments.discountType === 'percent') {
    totalDiscount = (itemsSubtotal * (Number(adjustments.discountValue) || 0)) / 100;
  } else {
    totalDiscount = Number(adjustments.discountValue) || 0;
  }

  let totalTip = 0;
  if (adjustments.tipType === 'percent') {
    totalTip = (itemsSubtotal * (Number(adjustments.tipValue) || 0)) / 100;
  } else {
    totalTip = Number(adjustments.tipValue) || 0;
  }

  const grandTotal = Math.max(0, itemsSubtotal + totalTax - totalDiscount + totalTip);

  // Build friend summaries
  const friendSummaries: FriendSummary[] = friends.map(friend => {
    const raw = summaryMap.get(friend.id)!;
    const mySubtotal = raw.itemsSubtotal;

    let taxShare = 0;
    let discountShare = 0;
    let tipShare = 0;

    if (itemsSubtotal > 0 && adjustments.splitAdjustmentsMode === 'proportional') {
      const ratio = mySubtotal / itemsSubtotal;
      taxShare = totalTax * ratio;
      discountShare = totalDiscount * ratio;
      tipShare = totalTip * ratio;
    } else {
      // Equal distribution among all friends
      const count = friends.length;
      taxShare = count > 0 ? totalTax / count : 0;
      discountShare = count > 0 ? totalDiscount / count : 0;
      tipShare = count > 0 ? totalTip / count : 0;
    }

    const totalOwed = Math.max(0, mySubtotal + taxShare - discountShare + tipShare);
    const totalPaid = raw.totalPaid;
    const netBalance = totalPaid - totalOwed; // positive = should receive, negative = should pay

    return {
      friend,
      itemsSubtotal: mySubtotal,
      taxShare,
      discountShare,
      tipShare,
      totalOwed,
      totalPaid,
      netBalance,
      itemBreakdowns: raw.itemBreakdowns,
    };
  });

  const totalPaidSum = friendSummaries.reduce((sum, f) => sum + f.totalPaid, 0);

  // Calculate settlement transfers (minimum cash transfers using greedy net balance matching)
  const transfers = calculateMinimumTransfers(friendSummaries);

  return {
    itemsSubtotal,
    totalTax,
    totalDiscount,
    totalTip,
    grandTotal,
    totalPaidSum,
    isBalanced: Math.abs(grandTotal - totalPaidSum) < 0.05,
    friendSummaries,
    transfers,
  };
}

/**
 * Greedy algorithm to settle debts with the minimal number of transactions
 */
function calculateMinimumTransfers(summaries: FriendSummary[]): SettlementTransfer[] {
  interface BalanceNode {
    friend: Friend;
    net: number; // positive = creditor (gets money), negative = debtor (owes money)
  }

  const debtors: BalanceNode[] = [];
  const creditors: BalanceNode[] = [];

  summaries.forEach(s => {
    // Round to 2 decimals to prevent floating point inaccuracies
    const net = Math.round(s.netBalance * 100) / 100;
    if (net < -0.01) {
      debtors.push({ friend: s.friend, net: -net }); // store positive amount owed
    } else if (net > 0.01) {
      creditors.push({ friend: s.friend, net: net });
    }
  });

  // Sort descending by magnitude
  debtors.sort((a, b) => b.net - a.net);
  creditors.sort((a, b) => b.net - a.net);

  const transfers: SettlementTransfer[] = [];
  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];

    const settleAmount = Math.min(debtor.net, creditor.net);

    if (settleAmount > 0.009) {
      transfers.push({
        fromFriend: debtor.friend,
        toFriend: creditor.friend,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtor.net -= settleAmount;
    creditor.net -= settleAmount;

    if (debtor.net <= 0.009) {
      dIndex++;
    }
    if (creditor.net <= 0.009) {
      cIndex++;
    }
  }

  return transfers;
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? '-' : ''}${currency}${formatted}`;
}
