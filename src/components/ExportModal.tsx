import React, { useState } from 'react';
import { Share2, Copy, Check, Download, Printer, X, MessageSquare, FileSpreadsheet } from 'lucide-react';
import { FriendSummary, SettlementTransfer, GlobalAdjustments } from '../types';
import { generateTextSummary, downloadBreakdownCSV } from '../utils/exportSummary';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendSummaries: FriendSummary[];
  transfers: SettlementTransfer[];
  grandTotal: number;
  adjustments: GlobalAdjustments;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  friendSummaries,
  transfers,
  grandTotal,
  adjustments,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const textSummary = generateTextSummary(friendSummaries, transfers, grandTotal, adjustments);

  const handleCopyText = () => {
    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCSV = () => {
    downloadBreakdownCSV(friendSummaries, transfers, adjustments.currency);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Share & Export Settlement
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Send breakdown to your group chat or export spreadsheet
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleCopyText}
              className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 text-left transition-colors flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {copied ? (
                  <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-indigo-600/70" />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Copy Group Text
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Ready for WhatsApp & iMessage
                </span>
              </div>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors flex flex-col justify-between gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Download CSV
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Full itemized breakdown spreadsheet
                </span>
              </div>
            </button>

            <button
              onClick={handlePrint}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors flex flex-col justify-between gap-2"
            >
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Print / Save PDF
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Clean printable receipt layout
                </span>
              </div>
            </button>
          </div>

          {/* Formatted Text Box Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Message Preview:
              </label>
              <button
                onClick={handleCopyText}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to clipboard' : 'Copy message'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-64 border border-slate-800 leading-relaxed select-all">
              {textSummary}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
