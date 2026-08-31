// src/features/driver/components/shared/FieldLabel.tsx

import React from 'react';

interface FieldLabelProps {
  label: string;
  value: React.ReactNode;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ label, value }) => {
  return (
    <div>
      <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};