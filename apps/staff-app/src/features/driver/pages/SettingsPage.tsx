// src/features/driver/pages/SettingsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { FaSave, FaSync, FaCheckCircle } from 'react-icons/fa';
import {
  SettingsHeader,
  SettingsAccount,
  SettingsNotifications,
  SettingsPreferences,
  SettingsAppearance,
} from '../components/settings';
import { driverApi, DriverProfile } from '../services/api/driver';
import { settingsApi, AccountSettings, NotificationSettings, PreferenceSettings } from '../services/api/settings';

const SettingsPage: React.FC = () => {
  // ─── State ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Account State ─────────────────────────────────────────────
  const [account, setAccount] = useState<AccountSettings>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // ─── Notification Settings ─────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationSettings>({
    trip: true,
    traffic: true,
    incident: true,
    emergency: true,
  });

  // ─── Preference Settings ──────────────────────────────────────
  const [preferences, setPreferences] = useState<PreferenceSettings>({
    gps: true,
    autoStart: false,
    stopAlerts: true,
    darkMode: false,
  });

  // ─── Load Profile ──────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await driverApi.getProfile();
      console.log('📋 Profile loaded:', data);
      setProfile(data);
      
      // Update account form
      setAccount({
        name: data.fullName || data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      });

      // Load settings from settings API
      const settings = settingsApi.getSettings();
      setNotifications(settings.notifications);
      setPreferences(settings.preferences);

    } catch (err: any) {
      console.error('❌ Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
      
      // Fallback to localStorage
      const saved = localStorage.getItem('driverProfile');
      if (saved) {
        try {
          const cached = JSON.parse(saved);
          setProfile(cached);
          setAccount({
            name: cached.fullName || cached.name || '',
            phone: cached.phone || '',
            email: cached.email || '',
            address: cached.address || '',
          });
        } catch {
          // Use defaults
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ─── Listen for profile updates from other components ─────────
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('🔄 Profile updated from another component, reloading...');
      loadProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [loadProfile]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleAccountChange = (field: keyof AccountSettings, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    const updated = settingsApi.toggleNotification(key);
    setNotifications(updated);
  };

  const handlePreferenceToggle = (key: keyof PreferenceSettings) => {
    const updated = settingsApi.togglePreference(key);
    setPreferences(updated);
  };

  const handleDarkModeToggle = () => {
    const darkMode = settingsApi.toggleDarkMode();
    setPreferences(prev => ({ ...prev, darkMode }));
  };

  // ─── Save Settings ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      // Update profile in localStorage
      const updateData = {
        fullName: account.name,
        name: account.name,
        phone: account.phone,
        email: account.email,
        address: account.address,
      };

      console.log('📤 Saving settings locally:', updateData);

      // Update profile (local only - no API call)
      const updatedProfile = await driverApi.updateProfile(updateData);
      console.log('📥 Updated profile:', updatedProfile);
      setProfile(updatedProfile);

      // Update settings
      settingsApi.saveSettings({
        account,
        notifications,
        preferences,
      });

      // Dispatch event for other components (DO NOT refresh from API)
      window.dispatchEvent(new Event('profileUpdated'));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('❌ Error saving settings:', err);
      
      // Don't show error for 404 since we're using localStorage
      if (err.response?.status === 404) {
        console.log('ℹ️ Backend update endpoint not found, but settings saved locally');
        // Still save locally even if API fails
        try {
          const current = JSON.parse(localStorage.getItem('driverProfile') || '{}');
          const merged = {
            ...current,
            fullName: account.name,
            name: account.name,
            phone: account.phone,
            email: account.email,
            address: account.address,
          };
          localStorage.setItem('driverProfile', JSON.stringify(merged));
          
          settingsApi.saveSettings({
            account,
            notifications,
            preferences,
          });
          
          window.dispatchEvent(new Event('profileUpdated'));
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } catch (e) {
          console.error('Failed to save locally:', e);
          setError('Failed to save settings locally');
        }
      } else {
        setError(err.message || 'Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#12B2E4] border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">

        <SettingsHeader
          title="Settings"
          subtitle="Manage your driver account and application preferences"
        />

        {/* Success Message */}
        {saved && (
          <div className="flex items-center gap-3 p-3 sm:p-4 mb-4 sm:mb-5 font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <FaCheckCircle className="text-lg sm:text-xl text-green-600 dark:text-green-400 shrink-0" />
            Settings saved successfully
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-3 sm:p-4 mb-4 sm:mb-5 font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in duration-300">
            <span>❌</span>
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 dark:text-red-400 hover:text-red-900"
            >
              ×
            </button>
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
          onToggle={handleNotificationToggle}
        />

        <SettingsPreferences
          preferences={preferences}
          onToggle={handlePreferenceToggle}
        />

        <SettingsAppearance
          darkMode={preferences.darkMode}
          onToggle={handleDarkModeToggle}
        />

      </div>
    </div>
  );
};

export default SettingsPage;