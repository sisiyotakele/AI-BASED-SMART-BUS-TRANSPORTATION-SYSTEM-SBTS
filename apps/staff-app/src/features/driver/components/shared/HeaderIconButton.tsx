// src/features/driver/components/shared/HeaderIconButton.tsx

import React from 'react';

interface HeaderIconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: boolean;
}

export const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  onClick,
  icon,
  label,
  badge,
}) => {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-[#12B2E4] transition-all shadow-sm flex items-center justify-center touch-manipulation"
      >
        <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{icon}</span>
        {badge && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </button>
      <span className="text-[6px] sm:text-[8px] text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </span>
    </div>
  );
};