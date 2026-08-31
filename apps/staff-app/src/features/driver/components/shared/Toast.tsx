// src/features/driver/components/shared/Toast.tsx

import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="fixed bottom-20 sm:bottom-28 left-1/2 -translate-x-1/2 z-[70] bg-gray-900 dark:bg-gray-800 text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-[90vw] text-center">
      {message}
    </div>
  );
};