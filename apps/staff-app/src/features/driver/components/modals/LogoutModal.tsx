// src/features/driver/components/modals/LogoutModal.tsx

import React from 'react';
import Button from '../Button';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 text-center border-t border-gray-100 dark:border-gray-700">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 shadow-sm border border-rose-100 dark:border-rose-800">
          <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Log out?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 px-4">
          You'll need to sign in again with your driver credentials.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-4 text-white font-semibold text-base bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50">
            Yes, Log out
          </button>
          <button onClick={onClose} className="w-full py-4 text-gray-600 dark:text-gray-300 font-semibold text-base bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};