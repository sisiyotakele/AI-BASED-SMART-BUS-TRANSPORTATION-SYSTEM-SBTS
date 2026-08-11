// src/features/driver/components/profile/ProfileHeader.tsx

import React from 'react';
import { FaUser, FaCheckCircle, FaStar, FaEdit, FaTimes } from 'react-icons/fa';
import { DriverProfile } from '../../types';

interface ProfileHeaderProps {
  profile: DriverProfile;
  editing: boolean;
  onEditToggle: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  editing,
  onEditToggle,
}) => {
  return (
    <div className="p-6 mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row">
        <div className="flex items-start flex-1 gap-5">
          <div className="relative shrink-0">
            <div className="flex items-center justify-center w-20 h-20 text-3xl text-white bg-[#2B4B9E] rounded-full ring-4 ring-[#12B2E4]/30">
              <FaUser />
            </div>
            <span className="absolute bottom-0 right-0 flex items-center justify-center w-5 h-5 text-white bg-green-500 border-2 border-white rounded-full">
              <FaCheckCircle className="w-2.5 h-2.5" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight text-gray-800 dark:text-white">{profile.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Professional driver</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Driver ID: DRV-001</p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Active
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <FaStar className="w-3 h-3 text-amber-500" />
                4.8 / 5
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onEditToggle}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-lg active:scale-[0.98] touch-manipulation"
          style={{
            backgroundColor: editing ? "#ef4444" : "#12B2E4",
          }}
        >
          {editing ? (
            <>
              <FaTimes className="w-3.5 h-3.5" />
              Cancel
            </>
          ) : (
            <>
              <FaEdit className="w-3.5 h-3.5" />
              Edit profile
            </>
          )}
        </button>
      </div>
    </div>
  );
};