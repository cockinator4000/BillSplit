import Papa from 'papaparse';
import { GroceryItem, Friend } from '../types';

export interface ParsedCSVRow {
  [key: string]: string;
}

export interface CSVParseResult {
  headers: string[];
  rows: ParsedCSVRow[];
  suggestedMapping: {
    nameCol: string;
    priceCol: string;
    qtyCol: string;
    categoryCol: string;
    paidByCol: string;
    assignedToCol: string;
  };
}

export function parseCSVString(csvText: string): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<ParsedCSVRow>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error('CSV file appears to be empty or has no readable rows.'));
          return;
        }

        const headers = results.meta.fields || Object.keys(results.data[0] || {});
        const suggestedMapping = detectColumnMapping(headers);

        resolve({
          headers,
          rows: results.data,
          suggestedMapping,
        });
      },
      error: (err: Error) => {
        reject(err);
      },
    });
  });
}

function detectColumnMapping(headers: string[]) {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  let nameCol = '';
  let priceCol = '';
  let qtyCol = '';
  let categoryCol = '';
  let paidByCol = '';
  let assignedToCol = '';

  const nameKeywords = ['item', 'name', 'desc', 'description', 'product', 'title', 'article', 'goods', 'grocery'];
  const priceKeywords = ['price', 'amount', 'cost', 'total', 'sum', 'charge', 'value', 'subtotal', 'lineamount'];
  const qtyKeywords = ['qty', 'quantity', 'count', 'units', 'pieces', 'pcs'];
  const catKeywords = ['category', 'department', 'dept', 'section', 'group', 'type'];
  const paidKeywords = ['paidby', 'payer', 'paid', 'buyer', 'purchasedby'];
  const assignedKeywords = ['assigned', 'splitwith', 'friend', 'friends', 'assignedto', 'who', 'consumers'];

  for (const h of headers) {
    const norm = normalize(h);

    if (!nameCol && nameKeywords.some(k => norm.includes(k))) {
      nameCol = h;
    }
    if (!priceCol && priceKeywords.some(k => norm.includes(k))) {
      priceCol = h;
    }
    if (!qtyCol && qtyKeywords.some(k => norm.includes(k))) {
      qtyCol = h;
    }
    if (!categoryCol && catKeywords.some(k => norm.includes(k))) {
      categoryCol = h;
    }
    if (!paidByCol && paidKeywords.some(k => norm.includes(k))) {
      paidByCol = h;
    }
    if (!assignedToCol && assignedKeywords.some(k => norm.includes(k))) {
      assignedToCol = h;
    }
  }

  // Fallback defaults if not matched
  if (!nameCol && headers.length > 0) nameCol = headers[0];
  if (!priceCol && headers.length > 1) priceCol = headers[1];

  return {
    nameCol,
    priceCol,
    qtyCol,
    categoryCol,
    paidByCol,
    assignedToCol,
  };
}

export function cleanPriceNumber(raw: string | number | undefined): number {
  if (typeof raw === 'number') return raw;
  if (!raw) return 0;

  // Remove currency signs, whitespace, and replace European comma decimal if standard format
  let str = String(raw).trim();
  // Remove currency symbols like $, €, £, ¥, zł, Kr, etc.
  str = str.replace(/[$€£¥zł]/g, '').trim();

  // If format like "12,99" (single comma, no dots)
  if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  } else if (str.includes(',') && str.includes('.')) {
    // Format like 1,234.56
    str = str.replace(/,/g, '');
  }

  // Extract number with optional negative sign and decimals
  const match = str.match(/-?\d+(\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0]) || 0;
}

export function convertRowsToGroceryItems(
  rows: ParsedCSVRow[],
  mapping: {
    nameCol: string;
    priceCol: string;
    qtyCol?: string;
    categoryCol?: string;
    paidByCol?: string;
    assignedToCol?: string;
  },
  friends: Friend[],
  defaultPayerId: string,
  selectedIndices?: Set<number>
): GroceryItem[] {
  const friendNameMap = new Map<string, string>();
  friends.forEach(f => {
    friendNameMap.set(f.name.toLowerCase().trim(), f.id);
  });

  const items: GroceryItem[] = [];

  rows.forEach((row, index) => {
    if (selectedIndices && !selectedIndices.has(index)) {
      return;
    }

    const rawName = row[mapping.nameCol];
    if (!rawName || !rawName.trim()) return;

    const rawPrice = row[mapping.priceCol];
    const price = cleanPriceNumber(rawPrice);
    if (price <= 0) return; // Skip zero/header artifacts

    const qtyVal = mapping.qtyCol ? cleanPriceNumber(row[mapping.qtyCol]) : 1;
    const quantity = qtyVal > 0 ? qtyVal : 1;

    const category = mapping.categoryCol ? row[mapping.categoryCol]?.trim() : undefined;

    // Check payer
    let paidById = defaultPayerId || (friends[0] ? friends[0].id : '');
    if (mapping.paidByCol && row[mapping.paidByCol]) {
      const payerName = row[mapping.paidByCol].toLowerCase().trim();
      const matchedPayer = friendNameMap.get(payerName);
      if (matchedPayer) {
        paidById = matchedPayer;
      }
    }

    // Check assigned friends from text column (e.g. "Alex, Sam" or "Everyone")
    let assignedTo: string[] = [];
    if (mapping.assignedToCol && row[mapping.assignedToCol]) {
      const assignedText = row[mapping.assignedToCol].toLowerCase();
      if (!assignedText.includes('all') && !assignedText.includes('everyone')) {
        friends.forEach(f => {
          if (assignedText.includes(f.name.toLowerCase())) {
            assignedTo.push(f.id);
          }
        });
      }
    }

    // If nothing matched, assign to everyone by default
    if (assignedTo.length === 0) {
      assignedTo = friends.map(f => f.id);
    }

    items.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '_' + index,
      name: rawName.trim(),
      price: Math.round(price * 100) / 100,
      quantity,
      category: category || inferCategory(rawName.trim()),
      paidById,
      assignedTo,
      splitMode: 'equal',
      createdAt: Date.now() + index,
    });
  });

  return items;
}

export function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/(milk|cheese|yogurt|butter|cream|cheddar|mozzarella|parmesan|sour cream|eggs|egg)/.test(n)) {
    return 'Dairy & Eggs';
  }
  if (/(apple|banana|berry|berries|avocado|salad|spinach|tomato|potato|onion|garlic|lime|lemon|carrot|cucumber|fruit|veg|vegetable|lettuce|broccoli|herbs)/.test(n)) {
    return 'Produce';
  }
  if (/(chicken|beef|steak|pork|bacon|salmon|tuna|turkey|shrimp|meat|fish|sausage|ham)/.test(n)) {
    return 'Meat & Seafood';
  }
  if (/(bread|bagel|toast|croissant|bun|bakery|tortilla|pita|muffin)/.test(n)) {
    return 'Bakery';
  }
  if (/(beer|wine|cider|gin|vodka|cocktail|whiskey|ipa|alcohol)/.test(n)) {
    return 'Alcohol';
  }
  if (/(soda|coke|juice|water|seltzer|coffee|tea|sparkling|energy|kombucha)/.test(n)) {
    return 'Beverages';
  }
  if (/(chip|chips|snack|cookie|chocolate|crackers|popcorn|candy|nuts|trail mix|ice cream)/.test(n)) {
    return 'Snacks & Sweets';
  }
  if (/(pasta|rice|sauce|oil|olive oil|cereal|oats|flour|sugar|spices|salt|beans|can|canned|soup)/.test(n)) {
    return 'Pantry';
  }
  if (/(soap|detergent|towel|paper|trash|foil|sponge|cleaner|shampoo|toothpaste|wipe)/.test(n)) {
    return 'Household';
  }
  return 'Groceries';
}

export const SAMPLE_CSV_CONTENT = `Item,Price,Quantity,Category,Paid By,Split With
Organic Whole Milk,4.29,1,Dairy & Eggs,You,Everyone
Avocados Hass (4 Pack),4.99,1,Produce,You,Everyone
Ribeye Steak 12oz,16.50,1,Meat & Seafood,Alex,Alex
Craft IPA Beer 6-Pack,13.99,1,Alcohol,You,You, Alex
Sourdough Artisan Bread,5.49,1,Bakery,Jordan,Everyone
Greek Yogurt 32oz,5.99,1,Dairy & Eggs,You,Sam
Cold Brew Coffee 48oz,6.49,1,Beverages,You,You, Jordan
Tortilla Chips & Salsa,6.29,1,Snacks & Sweets,Sam,Everyone
Fresh Atlantic Salmon,14.99,1,Meat & Seafood,Jordan,Jordan, Sam
Paper Towels 2-Pack,4.89,1,Household,You,Everyone
Strawberries Organic 1lb,3.99,1,Produce,Alex,Everyone
Dark Chocolate Bar,3.49,1,Snacks & Sweets,Sam,Sam`;

export function downloadSampleCSV(): void {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_grocery_receipt.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
