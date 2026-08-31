// src/features/driver/components/trip/QuickActions.tsx

import React, { useState } from 'react';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  bgColor: string;  // Changed from bg to bgColor (hex color)
  hoverColor: string;  // Added hover color
  iconColor: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  return (
    <div className="mt-3 sm:mt-4">
      <div className="h-px bg-gray-100 dark:bg-gray-700 mb-3 sm:mb-4" />
      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
        <span>⚡</span> Quick Actions
      </h3>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            onMouseEnter={() => setHoveredAction(action.id)}
            onMouseLeave={() => setHoveredAction(null)}
            style={{
              backgroundColor: hoveredAction === action.id ? action.hoverColor : action.bgColor,
            }}
            className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl transition-all hover:scale-105 active:scale-95 w-full touch-manipulation focus:outline-none"
          >
            <span className={action.iconColor}>{action.icon}</span>
            <span className="text-[8px] sm:text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};