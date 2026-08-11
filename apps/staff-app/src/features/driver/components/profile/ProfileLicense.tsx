// src/features/driver/components/profile/ProfileLicense.tsx

import React from 'react';
import { FaIdCard, FaShieldAlt } from 'react-icons/fa';

interface ProfileLicenseProps {
  licenseNumber: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
}

export const ProfileLicense: React.FC<ProfileLicenseProps> = ({
  licenseNumber = "ETH-123456",
  licenseType = "Category C",
  issueDate = "2024-01-10",
  expiryDate = "2029-01-10",
}) => {
  return (
    <div className="p-6 mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 dark:text-white">
          <FaIdCard className="text-purple-600" />
          Driving license
        </h2>
        <span className="px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full shrink-0">
          Verified
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">License number</label>
          <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
            {licenseNumber}
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">License type</label>
          <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
            {licenseType}
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Issue date</label>
          <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
            {issueDate}
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Expiry date</label>
          <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
            {expiryDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 mt-4 text-sm text-green-800 dark:text-green-400 rounded-lg bg-green-50 dark:bg-green-900/30">
        <FaShieldAlt className="text-xl text-green-600 dark:text-green-400 shrink-0" />
        <div>
          <p className="font-semibold">License status: valid</p>
          <p className="text-green-700 dark:text-green-300">Expires in approximately 3 years</p>
        </div>
      </div>
    </div>
  );
};