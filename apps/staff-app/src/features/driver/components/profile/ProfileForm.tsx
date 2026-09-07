// src/features/driver/components/profile/ProfileForm.tsx

import React from 'react';
import { FaUser, FaPhoneAlt, FaEnvelope, FaSave, FaHome } from 'react-icons/fa';

interface DriverProfile {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseType?: string;
  issueDate?: string;
  isActive?: boolean;
  rating?: number;
  totalTrips?: number;
  assignedBus?: string;
  avatar?: string;
}

interface ProfileFormProps {
  profile: DriverProfile;
  editing: boolean;
  formData: Partial<DriverProfile>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  saved: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  editing,
  formData,
  onChange,
  onSave,
  saved,
}) => {
  console.log('🔍 ProfileForm - editing:', editing);
  console.log('🔍 ProfileForm - formData:', formData);

  return (
    <div className="p-6 mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <h2 className="flex items-center gap-2 mb-4 text-base font-bold text-gray-800 dark:text-white">
        <FaUser className="text-[#2B4B9E]" />
        Personal Information
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Full Name */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Full Name</label>
          {editing ? (
            <input
              name="fullName"
              type="text"
              value={formData.fullName || ''}
              onChange={onChange}
              className="w-full p-2.5 mt-1 text-sm border border-blue-400 dark:border-blue-500 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors bg-white dark:bg-gray-700"
              placeholder="Enter your full name"
              autoFocus
            />
          ) : (
            <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
              {profile.fullName || profile.name || 'Not set'}
            </p>
          )}
        </div>

        {/* Driver ID */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Driver ID</label>
          <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
            {profile.id || 'N/A'}
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <FaPhoneAlt className="w-3 h-3 text-[#12B2E4]" />
            Phone Number
          </label>
          {editing ? (
            <input
              name="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={onChange}
              className="w-full p-2.5 mt-1 text-sm border border-blue-400 dark:border-blue-500 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors bg-white dark:bg-gray-700"
              placeholder="Enter your phone number"
            />
          ) : (
            <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
              {profile.phone || 'Not set'}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <FaEnvelope className="w-3 h-3 text-[#12B2E4]" />
            Email
          </label>
          {editing ? (
            <input
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={onChange}
              className="w-full p-2.5 mt-1 text-sm border border-blue-400 dark:border-blue-500 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors bg-white dark:bg-gray-700"
              placeholder="Enter your email"
            />
          ) : (
            <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
              {profile.email || 'Not set'}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <FaHome className="w-3 h-3 text-[#12B2E4]" />
            Address
          </label>
          {editing ? (
            <input
              name="address"
              type="text"
              value={formData.address || ''}
              onChange={onChange}
              className="w-full p-2.5 mt-1 text-sm border border-blue-400 dark:border-blue-500 dark:bg-gray-700 dark:text-white rounded-lg outline-none focus:border-[#12B2E4] focus:ring-2 focus:ring-[#12B2E4]/30 transition-colors bg-white dark:bg-gray-700"
              placeholder="Enter your address"
            />
          ) : (
            <p className="p-2.5 mt-1 text-sm text-gray-800 dark:text-white rounded-lg bg-gray-50 dark:bg-gray-700">
              {profile.address || 'Not set'}
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      {editing && (
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 mt-4 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors touch-manipulation"
        >
          <FaSave className="w-3.5 h-3.5" />
          Save Changes
        </button>
      )}

      {/* Success Message */}
      {saved && (
        <div className="mt-3 text-sm text-green-600 dark:text-green-400 animate-in fade-in duration-300">
          ✅ Profile updated successfully
        </div>
      )}
    </div>
  );
};