// src/features/driver/components/modals/EndTripModal.tsx

import React from 'react';
import Button from '../Button';

interface EndTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const EndTripModal: React.FC<EndTripModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">End this trip?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This will save the trip to your history.
        </p>
        <div className="flex gap-3">
          <Button text="Cancel" variant="outline" fullWidth onClick={onClose} />
          <Button text="End Trip" variant="danger" fullWidth onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
};