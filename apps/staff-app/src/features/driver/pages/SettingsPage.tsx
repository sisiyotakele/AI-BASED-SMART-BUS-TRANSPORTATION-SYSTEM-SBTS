// src/features/driver/pages/SettingsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaSync, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import {
  SettingsHeader,
  SettingsAccount,
  SettingsNotifications,
  SettingsPreferences,
  SettingsAppearance,
} from '../components/settings';
import { driverApi, DriverProfile } from '../services/api/driver';
import { settingsApi, AccountSettings, NotificationSettings, PreferenceSettings } from '../services/api/settings';
import { useDriverProfile } from '../hooks';
import { getGreeting, getInitials } from '../utils';
import { DEFAULT_DRIVER } from '../constants';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile: localProfile } = useDriverProfile();
  
  // ─── State ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ─── Derived Values ──────────────────────────────────────────
  const driverName = profile?.fullName || 
    profile?.name || 
    localProfile?.name || 
    DEFAULT_DRIVER.name;
    
  const driverEmail = profile?.email || 
    localProfile?.email || 
    'driver@sbts.com';
    
  const driverInitials = getInitials(driverName);
  const greeting = getGreeting();

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

  // ─── Navigation ──────────────────────────────────────────────
  const goToDashboard = () => {
    setShowProfileMenu(false);
    navigate('/driver');
  };

  const goToProfile = () => {
    setShowProfileMenu(false);
    navigate('/driver/profile');
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    navigate('/login');
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
      <div className="min-h-screen p-4 sm:p-6 bg-[#EDF0F8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#12B2E4] border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#EDF0F8] font-['Inter',sans-serif] p-3 sm:p-5 lg:p-7">
      <div className="w-full max-w-[1180px] mx-auto">

        {/* ─── HEADER ────────────────────────────────────────────── */}
        <header className="shrink-0 bg-gradient-to-r from-[#0B1739] via-[#12204A] to-[#2B4B9E] rounded-[16px] sm:rounded-[20px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 flex flex-wrap items-center justify-between text-white relative">
          {/* Decorative circle */}
          <div className="absolute inset-0 rounded-[16px] sm:rounded-[20px] overflow-hidden pointer-events-none">
            <div className="absolute right-[-60px] top-[-90px] w-[200px] h-[200px] lg:w-[260px] lg:h-[260px] rounded-full bg-[rgba(18,178,228,0.28)]" />
          </div>

          <div className="relative z-10 flex items-center gap-3 sm:gap-4 flex-1 min-w-[180px]">
            {/* Back Button */}
            <button
              onClick={goToDashboard}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium transition-all active:scale-95"
            >
              <FaArrowLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] sm:text-[13.5px] font-medium text-white/65 mb-0.5 sm:mb-1">
                {greeting}
              </p>
              <h1 className="font-['Space_Grotesk',sans-serif] text-[20px] sm:text-[23px] lg:text-[26px] font-bold tracking-[-0.02em]">
                Settings
              </h1>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 mt-2 sm:mt-0">
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <FaSync className="animate-spin" size={12} />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <FaSave size={12} />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </button>

            {/* Profile Avatar */}
            <div className="relative ml-1">
              <div
                onClick={() => setShowProfileMenu(v => !v)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] flex items-center justify-center font-['Space_Grotesk',sans-serif] font-semibold text-sm border-2 border-white/30 cursor-pointer transition-all"
              >
                {driverInitials}
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-56 py-3 z-50 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
                  <div className="px-5 pb-3 mb-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{driverEmail}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Driver Account</p>
                  </div>
                  <button onClick={goToProfile} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <svg className="w-4 h-4 text-[#2B4B9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    View Profile
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── CONTENT ────────────────────────────────────────────── */}
        <div className="mt-4 sm:mt-6">

          {/* Success Message */}
          {saved && (
            <div className="flex items-center gap-3 p-3 sm:p-4 mb-4 sm:mb-5 font-semibold text-green-700 bg-green-100 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <FaCheckCircle className="text-lg sm:text-xl text-green-600 shrink-0" />
              Settings saved successfully
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-3 sm:p-4 mb-4 sm:mb-5 font-semibold text-red-700 bg-red-100 border border-red-200 rounded-lg animate-in fade-in duration-300">
              <span>❌</span>
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}

          {/* Settings Sections */}
          <div className="space-y-4 sm:space-y-5">
            <SettingsAccount
              account={account}
              onChange={handleAccountChange}
            />

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

            {/* Save Button at Bottom */}
            <button
              className="flex items-center justify-center w-full gap-2 py-3 sm:py-3.5 font-semibold text-white rounded-xl bg-gradient-to-r from-[#2B4B9E] to-[#12B2E4] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-all shadow-lg shadow-[#2B4B9E]/20"
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
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;