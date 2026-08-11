// src/features/driver/pages/SettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { FaSave, FaSync, FaCheckCircle } from 'react-icons/fa';
import {
  SettingsHeader,
  SettingsAccount,
  SettingsNotifications,
  SettingsPreferences,
  SettingsAppearance,
} from '../components/settings';
import { useDriverProfile, useDriverSettings } from '../hooks';

const SettingsPage: React.FC = () => {
  const { profile, updateProfile } = useDriverProfile();
  const {
    notifications,
    preferences,
    toggleNotification,
    togglePreference,
    saveSettings,
  } = useDriverSettings();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // ─── Account State ─────────────────────────────────────────────
  const [account, setAccount] = useState({
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
  });

  useEffect(() => {
    setAccount({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
    });
  }, [profile]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleAccountChange = (field: keyof typeof account, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setSaving(true);

    // Update profile
    updateProfile(account);

    // Save settings
    saveSettings();

    setSaved(true);
    setSaving(false);

    setTimeout(() => setSaved(false), 3000);
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">

        <SettingsHeader
          title="Settings"
          subtitle="Manage your driver account and application preferences"
        />

        {saved && (
          <div className="flex items-center gap-3 p-3 sm:p-4 mb-4 sm:mb-5 font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <FaCheckCircle className="text-lg sm:text-xl text-green-600 dark:text-green-400 shrink-0" />
            Settings saved successfully
          </div>
        )}

        <SettingsAccount
          account={account}
          onChange={handleAccountChange}
        />

        <button
          className="flex items-center justify-center w-full gap-2 py-2.5 sm:py-3 mb-4 sm:mb-5 font-semibold text-white transition-colors rounded-lg bg-[#12B2E4] hover:bg-[#0e9ed4] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <FaSync className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FaSave />
              Save Changes
            </>
          )}
        </button>

        <SettingsNotifications
          notifications={notifications}
          onToggle={toggleNotification}
        />

        <SettingsPreferences
          preferences={preferences}
          onToggle={togglePreference}
        />

        <SettingsAppearance
          darkMode={preferences.darkMode}
          onToggle={() => togglePreference('darkMode')}
        />

      </div>
    </div>
  );
};

export default SettingsPage;