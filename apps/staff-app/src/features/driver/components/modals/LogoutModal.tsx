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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Log out?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          You'll need to sign in again.
        </p>
        <div className="flex gap-3">
          <Button text="Cancel" variant="outline" fullWidth onClick={onClose} />
          <Button text="Logout" variant="danger" fullWidth onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
};