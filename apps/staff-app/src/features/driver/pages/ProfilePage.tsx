// src/features/driver/pages/ProfilePage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ProfileHeader,
  ProfileForm,
  ProfileLicense,
} from '../components/profile';
import { LoadingSpinner } from '../components/shared';
import { driverApi, DriverProfile } from '../services/api/driver';
import { useDriverProfile } from '../hooks';
import { getGreeting, getInitials } from '../utils';
import { DEFAULT_DRIVER } from '../constants';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile: localProfile } = useDriverProfile();
  
  // ─── State ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Separate state for form data
  const [formData, setFormData] = useState<Partial<DriverProfile>>({
    fullName: '',
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // ─── Derived Values ──────────────────────────────────────────
  const driverName = profile?.fullName || 
    profile?.name || 
    localProfile?.name || 
    DEFAULT_DRIVER.name;
    
  const driverEmail = profile?.email || 
    localProfile?.email || 
    '';
    
  const driverInitials = getInitials(driverName);
  const greeting = getGreeting();

  // ─── Load Profile ──────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await driverApi.getProfile();
      console.log('📋 Profile loaded:', data);
      
      setProfile(data);
      setFormData({
        fullName: data.fullName || data.name || '',
        name: data.name || data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      });
      
    } catch (err: any) {
      console.error('❌ Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
      
      const saved = localStorage.getItem('driverProfile');
      if (saved) {
        try {
          const cached = JSON.parse(saved);
          setProfile(cached);
          setFormData({
            fullName: cached.fullName || cached.name || '',
            name: cached.name || cached.fullName || '',
            phone: cached.phone || '',
            email: cached.email || '',
            address: cached.address || '',
          });
        } catch {
          // Use default
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ─── Handle Input Changes ─────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`📝 Input changed: ${name} = "${value}"`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ─── Handle Avatar Upload ─────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setAvatarFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ─── Save Profile ─────────────────────────────────────────────
  const handleSave = async () => {
    setError(null);
    setSaved(false);
    
    try {
      console.log('📤 Saving profile with data:', formData);
      
      const updated = await driverApi.updateProfile(formData);
      
      setProfile(updated);
      localStorage.setItem('driverProfile', JSON.stringify(updated));
      
      window.dispatchEvent(new Event('profileUpdated'));
      
      setSaved(true);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('❌ Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    }
  };

  // ─── Handle Edit Toggle ──────────────────────────────────────
  const handleEditToggle = () => {
    console.log(`🔄 Toggling edit mode: ${editing} -> ${!editing}`);
    if (editing) {
      // Cancel - reset form data
      setFormData({
        fullName: profile?.fullName || profile?.name || '',
        name: profile?.name || profile?.fullName || '',
        phone: profile?.phone || '',
        email: profile?.email || '',
        address: profile?.address || '',
      });
      setAvatarPreview(null);
      setAvatarFile(null);
      setError(null);
    }
    setEditing(!editing);
  };

  // ─── Navigation ──────────────────────────────────────────────
  const goToDashboard = () => {
    setShowProfileMenu(false);
    navigate('/driver');
  };
  
  const goToSettings = () => {
    setShowProfileMenu(false);
    navigate('/driver/settings');
  };
  
  const handleLogout = () => {
    setShowProfileMenu(false);
    navigate('/login');
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 bg-[#EDF0F8]">
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────
  if (error && !profile) {
    return (
      <div className="min-h-screen p-4 sm:p-6 bg-[#EDF0F8] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Profile
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadProfile}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Profile Info */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              {/* Avatar */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] flex items-center justify-center font-['Space_Grotesk',sans-serif] font-bold text-xl sm:text-2xl border-2 border-white/30 shadow-lg flex-shrink-0">
                {driverInitials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="font-['Space_Grotesk',sans-serif] text-[18px] sm:text-[22px] lg:text-[24px] font-bold tracking-[-0.02em]">
                    {driverName}
                  </h1>
                  <span className="text-[10px] sm:text-[11px] font-medium text-white/60">
                    Professional Driver
                  </span>
                </div>
                <p className="text-[11px] sm:text-[12px] text-white/50 font-mono truncate">
                  Driver ID: {profile?.id || ''}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                  {profile?.licenseNumber && (
                    <>
                      <span className="text-white/30">|</span>
                      <span className="text-[10px] sm:text-[11px] text-white/70">
                        License: <span className="text-white font-medium">{profile.licenseNumber}</span>
                      </span>
                    </>
                  )}
                  {profile?.licenseExpiry && (
                    <>
                      <span className="text-white/30">|</span>
                      <span className="text-[10px] sm:text-[11px] text-white/70">
                        Exp: <span className="text-white font-medium">{profile.licenseExpiry}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 mt-2 sm:mt-0">
            {/* Edit Profile Button */}
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[12px] sm:text-[13px] font-medium transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="hidden sm:inline">{editing ? 'Cancel' : 'Edit Profile'}</span>
            </button>

            {/* Verified Badge - only show if profile is verified */}
            {profile?.verified && (
              <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
                </svg>
                Verified
              </span>
            )}

            {/* Profile Avatar Menu */}
            <div className="relative ml-1">
              <div
                onClick={() => setShowProfileMenu(v => !v)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] flex items-center justify-center font-['Space_Grotesk',sans-serif] font-semibold text-sm border-2 border-white/30 cursor-pointer transition-all"
              >
                {driverInitials}
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-56 py-3 z-50 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
                  <div className="px-5 pb-3 mb-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{driverEmail}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Driver Account</p>
                  </div>
                  <button onClick={goToSettings} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <svg className="w-4 h-4 text-[#2B4B9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Settings
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
          {saved && (
            <div className="flex items-center gap-3 p-4 mb-6 font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in duration-300">
              <span>✅</span>
              Profile updated successfully
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in duration-300">
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

          {/* ─── Driving License Card ────────────────────────────── */}
          {profile && (profile.licenseNumber || profile.licenseExpiry) && (
            <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-[#E5E9F3]">
                <h3 className="text-[15px] font-semibold text-gray-800 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#2B4B9E]">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M8 4v4" />
                    <path d="M16 4v4" />
                    <path d="M2 10h20" />
                  </svg>
                  Driving License
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">License Number</p>
                    <p className="text-[15px] font-semibold text-gray-800 mt-1">{profile.licenseNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">License Type</p>
                    <p className="text-[15px] font-semibold text-gray-800 mt-1">{profile.licenseType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Issue Date</p>
                    <p className="text-[15px] font-semibold text-gray-800 mt-1">{profile.issueDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Expiry Date</p>
                    <p className="text-[15px] font-semibold text-gray-800 mt-1">{profile.licenseExpiry || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Profile Form (Edit Mode) ────────────────────────── */}
          {profile && (
            <ProfileForm
              profile={profile}
              editing={editing}
              formData={formData}
              onChange={handleChange}
              onSave={handleSave}
              saved={saved}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;