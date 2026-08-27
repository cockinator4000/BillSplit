import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download, RefreshCw, ArrowRight, Table } from 'lucide-react';
import { Friend, GroceryItem } from '../types';
import { parseCSVString, convertRowsToGroceryItems, downloadSampleCSV, ParsedCSVRow, SAMPLE_CSV_CONTENT } from '../utils/csvParser';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  defaultPayerId: string;
  currency: string;
  onImportItems: (newItems: GroceryItem[]) => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  friends,
  defaultPayerId,
  currency,
  onImportItems,
}) => {
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [csvRaw, setCsvRaw] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedCSVRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importPayerId, setImportPayerId] = useState<string>(defaultPayerId || (friends[0]?.id ?? ''));

  // Column mapping states
  const [nameCol, setNameCol] = useState<string>('');
  const [priceCol, setPriceCol] = useState<string>('');
  const [qtyCol, setQtyCol] = useState<string>('');
  const [categoryCol, setCategoryCol] = useState<string>('');
  const [paidByCol, setPaidByCol] = useState<string>('');
  const [assignedToCol, setAssignedToCol] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processCSVContent = async (text: string, sourceName: string) => {
    setErrorMsg(null);
    try {
      const parsed = await parseCSVString(text);
      if (parsed.rows.length === 0) {
        setErrorMsg('The CSV file does not contain any data rows.');
        return;
      }

      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setCsvRaw(text);
      setFileName(sourceName);

      // Set suggested mapping
      setNameCol(parsed.suggestedMapping.nameCol);
      setPriceCol(parsed.suggestedMapping.priceCol);
      setQtyCol(parsed.suggestedMapping.qtyCol);
      setCategoryCol(parsed.suggestedMapping.categoryCol);
      setPaidByCol(parsed.suggestedMapping.paidByCol);
      setAssignedToCol(parsed.suggestedMapping.assignedToCol);

      // Select all rows by default
      const initialSelected = new Set<number>();
      parsed.rows.forEach((_, idx) => initialSelected.add(idx));
      setSelectedIndices(initialSelected);

      setStep('map');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse CSV file. Please verify the format.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCSVContent(content, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processCSVContent(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = () => {
    processCSVContent(SAMPLE_CSV_CONTENT, 'sample_grocery_receipt.csv');
  };

  const toggleSelectRow = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === rows.length) {
      setSelectedIndices(new Set());
    } else {
      const all = new Set<number>();
      rows.forEach((_, i) => all.add(i));
      setSelectedIndices(all);
    }
  };

  const handleFinalImport = () => {
    if (!nameCol || !priceCol) {
      setErrorMsg('Please select which column is Item Name and which is Price.');
      return;
    }

    const items = convertRowsToGroceryItems(
      rows,
      {
        nameCol,
        priceCol,
        qtyCol: qtyCol || undefined,
        categoryCol: categoryCol || undefined,
        paidByCol: paidByCol || undefined,
        assignedToCol: assignedToCol || undefined,
      },
      friends,
      importPayerId,
      selectedIndices
    );

    if (items.length === 0) {
      setErrorMsg('No valid grocery items could be created from the selected rows.');
      return;
    }

    onImportItems(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Import Grocery CSV Transactions
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Import receipts from bank exports, supermarket files, or spreadsheet CSVs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center border-b border-slate-100 dark:border-slate-800/80 px-6 py-2.5 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
          <div className={`flex items-center gap-1.5 font-medium ${step === 'upload' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              1
            </span>
            <span>Upload File</span>
          </div>
          <div className="w-8 h-px bg-slate-200 dark:border-slate-700 mx-2" />
          <div className={`flex items-center gap-1.5 font-medium ${step === 'map' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${step === 'map' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              2
            </span>
            <span>Map Columns</span>
          </div>
          <div className="w-8 h-px bg-slate-200 dark:border-slate-700 mx-2" />
          <div className={`flex items-center gap-1.5 font-medium ${step === 'preview' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${step === 'preview' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              3
            </span>
            <span>Preview & Import</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drag and drop your .csv file here
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    Supports any CSV format with items and prices
                  </p>
                </div>
              </div>

              {/* Sample file buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Load Sample Grocery CSV</span>
                </button>

                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* Paste raw text option */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Or paste CSV text directly:
                </label>
                <textarea
                  rows={3}
                  placeholder="Item,Price,Quantity&#10;Organic Milk,4.29,1&#10;Avocados,4.99,1"
                  value={csvRaw}
                  onChange={(e) => setCsvRaw(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                {csvRaw.trim() && (
                  <button
                    type="button"
                    onClick={() => processCSVContent(csvRaw, 'pasted_data.csv')}
                    className="mt-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Parse Pasted Data
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'map' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-900 flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300">
                <span>Loaded <strong>{rows.length} rows</strong> from {fileName || 'CSV'}</span>
                <span className="font-semibold">Auto-detected columns below</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Item / Product Name *
                  </label>
                  <select
                    value={nameCol}
                    onChange={(e) => setNameCol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Price / Amount *
                  </label>
                  <select
                    value={priceCol}
                    onChange={(e) => setPriceCol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quantity (Optional)
                  </label>
                  <select
                    value={qtyCol}
                    onChange={(e) => setQtyCol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- None (Default: 1) --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    value={categoryCol}
                    onChange={(e) => setCategoryCol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Auto-infer Category --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Paid By Column (Optional)
                  </label>
                  <select
                    value={paidByCol}
                    onChange={(e) => setPaidByCol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Default to Payer Below --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Split With Column (Optional)
                  </label>
                  <select
                    value={assignedToCol}
                    onChange={(e) => setAssignedToCol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Split with Everyone by default --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Default Payer for this file */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Primary receipt payer:
                </span>
                <select
                  value={importPayerId}
                  onChange={(e) => setImportPayerId(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  {friends.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & SELECTION */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Select items to import ({selectedIndices.size} of {rows.length} selected):
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  {selectedIndices.size === rows.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-8"></th>
                      <th className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">Item</th>
                      <th className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">Price</th>
                      <th className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">Qty</th>
                      <th className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row, idx) => {
                      const isChecked = selectedIndices.has(idx);
                      const itemName = row[nameCol] || '-';
                      const itemPrice = row[priceCol] || '0.00';
                      const itemQty = qtyCol ? row[qtyCol] : '1';
                      const itemCat = categoryCol ? row[categoryCol] : '';

                      return (
                        <tr
                          key={idx}
                          onClick={() => toggleSelectRow(idx)}
                          className={`cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                              : 'opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="p-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{itemName}</td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{itemPrice}</td>
                          <td className="p-2.5 text-slate-500 tabular-nums">{itemQty || 1}</td>
                          <td className="p-2.5 text-slate-500">{itemCat || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          <div>
            {step !== 'upload' && (
              <button
                type="button"
                onClick={() => setStep(step === 'preview' ? 'map' : 'upload')}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              Cancel
            </button>

            {step === 'map' && (
              <button
                id="btn-csv-to-preview"
                type="button"
                disabled={!nameCol || !priceCol}
                onClick={() => setStep('preview')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xs transition-colors"
              >
                <span>Next: Review Items</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'preview' && (
              <button
                id="btn-confirm-csv-import"
                type="button"
                disabled={selectedIndices.size === 0}
                onClick={handleFinalImport}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Import {selectedIndices.size} Items</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
