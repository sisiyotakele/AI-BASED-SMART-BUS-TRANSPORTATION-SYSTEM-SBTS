// src/features/driver/components/modals/HandoverListModal.tsx

import React from 'react';
import { FaTimes, FaSpinner, FaCheck, FaTimes as FaReject } from 'react-icons/fa';
import { ShiftHandover } from '../../types';

interface HandoverListModalProps {
  isOpen: boolean;
  handovers: ShiftHandover[];
  onAccept: (id: string | number) => void;
  onReject: (id: string | number) => void;
  onClose: () => void;
  currentDriverName: string;
  loading?: boolean;
}

export const HandoverListModal: React.FC<HandoverListModalProps> = ({
  isOpen,
  handovers,
  onAccept,
  onReject,
  onClose,
  currentDriverName,
  loading = false, // ← ADD THIS LINE
}) => {
  if (!isOpen) return null;

  const pendingHandovers = handovers.filter(
    (h) => h.status?.toLowerCase() === 'pending'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 border-t border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh]">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-700 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white text-xl backdrop-blur-md"
          >
            ×
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-4 shadow-inner backdrop-blur-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-1">Check Handing-Overs</h3>
          <p className="text-white/80 text-sm">Review incoming vehicle transfers</p>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <FaSpinner className="animate-spin text-indigo-500 text-3xl mb-3" />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading handovers...</span>
            </div>
          ) : pendingHandovers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">You're all caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending handovers to review.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {pendingHandovers.map((handover) => (
                <div key={handover.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-600 shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        From: {handover.currentDriver}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 pl-3.5">
                        → To: <span className="text-gray-700 dark:text-gray-200 font-medium">{handover.nextDriver}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-3.5">
                        📅 {handover.date}
                      </p>
                      {handover.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 pl-3.5 font-medium">
                          <span className="text-gray-400 block mb-0.5 uppercase text-[10px] tracking-wider">Notes:</span>
                          {handover.notes}
                        </p>
                      )}
                      
                      <div className="pl-3.5 mt-3 grid grid-cols-2 gap-2">
                        <div className="bg-white dark:bg-gray-800 rounded bg-opacity-50 p-2 shadow-sm border border-gray-100 dark:border-gray-700/50">
                            <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Condition</span>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 capitalize">{handover.vehicleCondition}</span>
                        </div>
                        {handover.currentDriverLocation && (
                          <div className="bg-white dark:bg-gray-800 rounded bg-opacity-50 p-2 shadow-sm border border-gray-100 dark:border-gray-700/50 truncate">
                              <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Location</span>
                              <span className="text-xs font-mono text-gray-700 dark:text-gray-200 truncate block">{handover.currentDriverLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-3 mt-1 border-t border-gray-100 dark:border-gray-600/50">
                      <button
                        onClick={() => onAccept(handover.id)}
                        disabled={loading}
                        className="flex-1 py-2 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 rounded-xl transition-colors font-semibold text-xs disabled:opacity-50"
                      >
                        <FaCheck className="w-3.5 h-3.5" /> Accept Keys
                      </button>
                      <button
                        onClick={() => onReject(handover.id)}
                        disabled={loading}
                        className="flex-[0.6] py-2 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 rounded-xl transition-colors font-semibold text-xs disabled:opacity-50"
                      >
                        <FaReject className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};