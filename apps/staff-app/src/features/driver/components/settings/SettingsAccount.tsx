// src/features/driver/components/settings/SettingsAccount.tsx

import React from 'react';
import { FaUser } from 'react-icons/fa';
import { SettingsSection } from '../shared/SettingsSection';

interface AccountSettings {
  name: string;
  phone: string;
  email: string;
}

interface SettingsAccountProps {
  account: AccountSettings;
  onChange: (field: keyof AccountSettings, value: string) => void;
}

export const SettingsAccount: React.FC<SettingsAccountProps> = ({
  account,
  onChange,
}) => {
  return (
    <SettingsSection title="Account Information" icon={<FaUser className="text-[#12B2E4]" />}>
      <div className="mb-3 sm:mb-4">
        <label className="block mb-1 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
          Full Name
        </label>
        <input
          className="w-full p-2 sm:p-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors duration-300"
          value={account.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter your full name"
        />
        <p className="mt-1 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
          This name will appear across the app
        </p>
      </div>

      <div className="mb-3 sm:mb-4">
        <label className="block mb-1 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
          Phone Number
        </label>
        <input
          className="w-full p-2 sm:p-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors duration-300"
          value={account.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="Enter your phone number"
        />
      </div>

      <div>
        <label className="block mb-1 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          className="w-full p-2 sm:p-2.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors duration-300"
          value={account.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="Enter your email"
        />
      </div>
    </SettingsSection>
  );
};