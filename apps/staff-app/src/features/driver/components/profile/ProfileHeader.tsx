// src/features/driver/components/profile/ProfileHeader.tsx

import React from 'react';
import { DriverProfile } from '../../services/api/driver';

interface ProfileHeaderProps {
  profile: DriverProfile;
  editing: boolean;
  onEditToggle: () => void;
  onAvatarChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarPreview?: string | null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  editing,
  onEditToggle,
  onAvatarChange,
  avatarPreview,
}) => {
  console.log('🔍 ProfileHeader - editing:', editing);

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (profile?.avatar) {
      if (profile.avatar.startsWith('http')) {
        return profile.avatar;
      }
      const baseUrl = import.meta.env.VITE_API_URL || '';
      return `${baseUrl}${profile.avatar}`;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();
  const displayName = profile?.fullName || profile?.name || 'Driver';
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row">
        <div className="flex items-start flex-1 gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex items-center justify-center w-20 h-20 text-3xl text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded-full ring-4 ring-[#12B2E4]/30 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('span');
                      fallback.className = 'text-white font-bold text-2xl';
                      fallback.textContent = initials;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <span className="text-white font-bold text-2xl">{initials}</span>
              )}
            </div>

            {editing && onAvatarChange && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors border-2 border-white dark:border-gray-800">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  className="hidden"
                />
              </label>
            )}

            <span className="absolute bottom-0 right-0 flex items-center justify-center w-5 h-5 text-white bg-green-500 border-2 border-white rounded-full">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight text-gray-800 dark:text-white">
              {displayName}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Professional Driver</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Driver ID: {profile?.id || 'N/A'}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {profile?.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <span>🪪</span> License: {profile?.licenseNumber || (profile as any)?.driver?.licenseNumber || 'ETH-88492'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span>📅</span> Exp: {profile?.licenseExpiry || (profile as any)?.driver?.licenseExpiry || (profile as any)?.licenseExpiryDate || '2028-12-31'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit/Cancel Button */}
        <button
          onClick={onEditToggle}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-lg active:scale-[0.98] touch-manipulation"
          style={{
            backgroundColor: editing ? "#ef4444" : "#12B2E4",
          }}
        >
          {editing ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
};