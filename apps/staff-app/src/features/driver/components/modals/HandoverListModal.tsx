// src/features/driver/components/modals/HandoverListModal.tsx

import React from 'react';
import { ShiftHandover } from '../../types';

interface HandoverListModalProps {
  isOpen: boolean;
  handovers: ShiftHandover[];
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onClose: () => void;
  currentDriverName: string;
}

export const HandoverListModal: React.FC<HandoverListModalProps> = ({
  isOpen,
  handovers,
  onAccept,
  onReject,
  onClose,
  currentDriverName,
}) => {
  if (!isOpen) return null;

  const pendingHandovers = handovers.filter(
    (h) => h.status === "Pending" && h.nextDriver === currentDriverName
  );

  if (pendingHandovers.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-3xl mb-4">
              ✅
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Pending Handovers</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              You don't have any handovers waiting for your acceptance.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-[#12B2E4] text-white rounded-lg hover:bg-[#0e9ed4] transition-colors text-sm font-medium touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Pending Handovers
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-lg sm:text-xl"
          >
            ×
          </button>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
          You have {pendingHandovers.length} handover
          {pendingHandovers.length !== 1 ? "s" : ""} waiting for your acceptance
        </p>

        <div className="space-y-3 sm:space-y-4">
          {pendingHandovers.map((handover) => (
            <div
              key={handover.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      From: {handover.currentDriver}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <span className="font-medium">Vehicle:</span> {handover.vehicleCondition}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Notes:</span> {handover.notes || "No notes"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Initiated: {handover.date}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onAccept(handover.id)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(handover.id)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};