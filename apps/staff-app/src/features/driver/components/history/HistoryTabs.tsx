// src/features/driver/components/history/HistoryTabs.tsx

import React from 'react';
import { FaBus, FaExclamationTriangle, FaWrench, FaUser } from 'react-icons/fa';
import { TabType } from '../../types';

interface HistoryTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: {
    trips: number;
    incidents: number;
    maintenance: number;
    handovers: number;
  };
}

export const HistoryTabs: React.FC<HistoryTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const tabs = [
    { id: 'trips' as TabType, label: 'Trips', icon: <FaBus size={14} />, count: counts.trips },
    { id: 'incidents' as TabType, label: 'Incidents', icon: <FaExclamationTriangle size={14} />, count: counts.incidents },
    { id: 'maintenance' as TabType, label: 'Maintenance', icon: <FaWrench size={14} />, count: counts.maintenance },
    { id: 'handovers' as TabType, label: 'Handovers', icon: <FaUser size={14} />, count: counts.handovers },
  ];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
            activeTab === tab.id
              ? "text-[#12B2E4] border-b-2 border-[#12B2E4]"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          {tab.icon}
          {tab.label}
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#2B4B9E] text-white rounded-full">
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};