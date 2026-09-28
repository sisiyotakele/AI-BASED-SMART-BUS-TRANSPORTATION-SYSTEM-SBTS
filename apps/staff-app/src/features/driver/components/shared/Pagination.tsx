// src/features/driver/components/shared/Pagination.tsx

import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  label = 'items',
}) => {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 gap-2 sm:gap-0">
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        Showing {start} to {end} of {totalItems} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors touch-manipulation"
        >
          <FaChevronLeft className="text-gray-600 dark:text-gray-400" size={12} />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                currentPage === pageNum
                  ? "bg-[#12B2E4] text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {totalPages > 5 && <span className="text-gray-400 dark:text-gray-500">...</span>}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors touch-manipulation"
        >
          <FaChevronRight className="text-gray-600 dark:text-gray-400" size={12} />
        </button>
      </div>
    </div>
  );
};