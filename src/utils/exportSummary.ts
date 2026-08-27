import { FriendSummary, SettlementTransfer, GlobalAdjustments } from '../types';
import { formatCurrency } from './calculations';

export function generateTextSummary(
  friendSummaries: FriendSummary[],
  transfers: SettlementTransfer[],
  grandTotal: number,
  adjustments: GlobalAdjustments
): string {
  const currency = adjustments.currency;
  const dateStr = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  let text = `🛒 *GROCERY BILL SPLIT SUMMARY* (${dateStr})\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Total Bill: ${formatCurrency(grandTotal, currency)}\n\n`;

  text += `👥 *PER-PERSON BREAKDOWN:*\n`;
  friendSummaries.forEach(s => {
    const net = s.netBalance;
    const netStr = net >= 0
      ? `🟢 Gets back ${formatCurrency(net, currency)}`
      : `🔴 Owes ${formatCurrency(Math.abs(net), currency)}`;

    text += `\n• *${s.friend.name}*:\n`;
    text += `   - Fair Share (Owed): ${formatCurrency(s.totalOwed, currency)} (items: ${formatCurrency(s.itemsSubtotal, currency)}`;
    if (s.taxShare > 0) text += ` + tax: ${formatCurrency(s.taxShare, currency)}`;
    if (s.discountShare > 0) text += ` - discount: ${formatCurrency(s.discountShare, currency)}`;
    if (s.tipShare > 0) text += ` + tip: ${formatCurrency(s.tipShare, currency)}`;
    text += `)\n`;
    text += `   - Amount Paid: ${formatCurrency(s.totalPaid, currency)}\n`;
    text += `   - *Net Status*: ${netStr}\n`;
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💸 *SETTLEMENT TRANSFERS (WHO PAYS WHOM):*\n`;

  if (transfers.length === 0) {
    text += `✅ All settled up! No transfers needed.\n`;
  } else {
    transfers.forEach((t, idx) => {
      text += `${idx + 1}. *${t.fromFriend.name}* sends *${formatCurrency(t.amount, currency)}* to *${t.toFriend.name}*\n`;
    });
  }

  text += `\nCreated with Grocery Splitter`;
  return text;
}

export function downloadBreakdownCSV(
  friendSummaries: FriendSummary[],
  transfers: SettlementTransfer[],
  currency: string
): void {
  let csv = `Friend,Items Subtotal,Tax Share,Discount Share,Tip Share,Total Fair Share,Total Paid Upfront,Net Balance,Status\n`;

  friendSummaries.forEach(s => {
    const status = s.netBalance >= 0 ? `Gets back ${formatCurrency(s.netBalance, currency)}` : `Owes ${formatCurrency(Math.abs(s.netBalance), currency)}`;
    csv += `"${s.friend.name}",${s.itemsSubtotal.toFixed(2)},${s.taxShare.toFixed(2)},${s.discountShare.toFixed(2)},${s.tipShare.toFixed(2)},${s.totalOwed.toFixed(2)},${s.totalPaid.toFixed(2)},${s.netBalance.toFixed(2)},"${status}"\n`;
  });

  csv += `\n\nSettlement Plan\nFrom,To,Amount\n`;
  transfers.forEach(t => {
    csv += `"${t.fromFriend.name}","${t.toFriend.name}",${t.amount.toFixed(2)}\n`;
  });

  csv += `\n\nItemized Allocations\nFriend,Item Name,Category,Item Total,Friend Share Amount,Details\n`;
  friendSummaries.forEach(s => {
    s.itemBreakdowns.forEach(b => {
      csv += `"${s.friend.name}","${b.item.name}","${b.item.category || 'General'}",${b.item.price.toFixed(2)},${b.theirShareAmount.toFixed(2)},"${b.shareDescription}"\n`;
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `grocery_settlement_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
