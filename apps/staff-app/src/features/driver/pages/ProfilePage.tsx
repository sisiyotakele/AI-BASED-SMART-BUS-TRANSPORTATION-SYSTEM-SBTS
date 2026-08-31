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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  
  // ─── State ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  // ─── Error State ──────────────────────────────────────────────
  if (error && !profile) {
    return (
      <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
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
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        
        <button
          onClick={() => navigate('/driver')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

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

        {profile && (
          <ProfileHeader
            profile={profile}
            editing={editing}
            onEditToggle={handleEditToggle}
            onAvatarChange={handleAvatarChange}
            avatarPreview={avatarPreview}
          />
        )}

        {profile && (
          <ProfileLicense
            licenseNumber={profile.licenseNumber || (profile as any).driver?.licenseNumber || 'ETH-88492'}
            licenseType={(profile as any).licenseType || (profile as any).driver?.licenseCategory || 'Category C'}
            issueDate={(profile as any).issueDate || (profile as any).driver?.issueDate || '2024-01-10'}
            expiryDate={profile.licenseExpiry || (profile as any).driver?.licenseExpiry || (profile as any).licenseExpiryDate || '2028-12-31'}
          />
        )}

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
  );
};

export default ProfilePage;