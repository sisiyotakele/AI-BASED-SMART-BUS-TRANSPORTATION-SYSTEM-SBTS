// src/features/driver/components/profile/ProfileForm.tsx

import React from 'react';
import { FaUser, FaPhoneAlt, FaEnvelope, FaSave } from 'react-icons/fa';
import { DriverProfile } from '../../types';

interface ProfileFormProps {
  profile: DriverProfile;
  editing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  saved: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  editing,
  onChange,
  onSave,
  saved,
}) => {
  return (
    <div className="p-6 mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <h2 className="flex items-center gap-2 mb-4 text-base font-bold text-gray-800 dark:text-white">
        <FaUser className="text-[#2B4B9E]" />
        Personal information
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Full name</label>
          {editing ? (
            <input
              name="name"
              value={profile.name}
              onChange={onChange}
              className="w-full p-2.5 mt-1 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors"
            />
          ) : (
            <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
              {profile.name}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Driver ID</label>
          <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
            DRV-001
          </p>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <FaPhoneAlt className="w-3 h-3 text-[#12B2E4]" />
            Phone number
          </label>
          {editing ? (
            <input
              name="phone"
              value={profile.phone}
              onChange={onChange}
              className="w-full p-2.5 mt-1 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors"
            />
          ) : (
            <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
              {profile.phone}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <FaEnvelope className="w-3 h-3 text-[#12B2E4]" />
            Email
          </label>
          {editing ? (
            <input
              name="email"
              value={profile.email}
              onChange={onChange}
              className="w-full p-2.5 mt-1 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors"
            />
          ) : (
            <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
              {profile.email}
            </p>
          )}
        </div>
      </div>

      {editing && (
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 mt-4 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors touch-manipulation"
          onClick={onSave}
        >
          <FaSave className="w-3.5 h-3.5" />
          Save changes
        </button>
      )}

      {saved && (
        <div className="mt-3 text-sm text-green-600 dark:text-green-400 animate-in fade-in duration-300">
          ✅ Profile updated successfully
        </div>
      )}
    </div>
  );
};