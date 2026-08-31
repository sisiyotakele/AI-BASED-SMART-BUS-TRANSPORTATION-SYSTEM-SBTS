// src/features/driver/components/shared/SectionIcon.tsx

import React from 'react';

interface SectionIconProps {
  children: React.ReactNode;
}

export const SectionIcon: React.FC<SectionIconProps> = ({ children }) => {
  return (
    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#12B2E4]/20 to-[#2B4B9E]/20 flex items-center justify-center text-[#2B4B9E] dark:text-[#12B2E4] shrink-0">
      {children}
    </div>
  );
};