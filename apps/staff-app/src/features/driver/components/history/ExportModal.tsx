// src/features/driver/components/history/ExportModal.tsx

import React from 'react';
import { FaFileCsv, FaFilePdf, FaTimes } from 'react-icons/fa';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCSV: () => void;
  onExportStyled: () => void;
  count: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportCSV,
  onExportStyled,
  count,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#12B2E4]/10 flex items-center justify-center text-[#12B2E4]">
              <FaFileCsv size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export Trip History</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Choose export format for {count} trips
        </p>

        <div className="space-y-3">
          <button
            onClick={onExportCSV}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-[#12B2E4]/5 dark:hover:bg-[#12B2E4]/10 rounded-xl transition-colors border border-gray-100 dark:border-gray-600 hover:border-[#12B2E4]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <FaFileCsv size={18} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">CSV Export</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Comma-separated values</p>
              </div>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">↓</span>
          </button>

          <button
            onClick={onExportStyled}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-[#2B4B9E]/5 dark:hover:bg-[#2B4B9E]/10 rounded-xl transition-colors border border-gray-100 dark:border-gray-600 hover:border-[#2B4B9E]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#12B2E4]/10 flex items-center justify-center text-[#12B2E4]">
                <FaFilePdf size={18} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-white">Styled Report</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">HTML table with formatting</p>
              </div>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">↓</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};