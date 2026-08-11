// src/features/driver/pages/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import {
  ProfileHeader,
  ProfileStats,
  ProfileForm,
  ProfileLicense,
  ProfileCertifications,
  ProfileEmergency,
} from '../components/profile';
import { LoadingSpinner } from '../components/shared';
import { useDriverProfile } from '../hooks';

const ProfilePage: React.FC = () => {
  const { profile, updateProfile } = useDriverProfile();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState(profile);

  // ─── Load Profile ──────────────────────────────────────────────
  useEffect(() => {
    setFormData(profile);
    setTimeout(() => setLoading(false), 500);
  }, [profile]);

  // ─── Handle Input ──────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ─── Save Profile ──────────────────────────────────────────────
  const handleSave = () => {
    updateProfile(formData);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        
        {/* Success Message */}
        {saved && (
          <div className="flex items-center gap-3 p-4 mb-6 font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in duration-300">
            <span>✅</span>
            Profile updated successfully
          </div>
        )}

        {/* Header */}
        <ProfileHeader
          profile={formData}
          editing={editing}
          onEditToggle={() => setEditing(!editing)}
        />

        {/* Stats */}
        <ProfileStats
          rating={4.8}
          assignedBus="BUS-024"
          totalTrips={245}
        />

        {/* Form */}
        <ProfileForm
          profile={formData}
          editing={editing}
          onChange={handleChange}
          onSave={handleSave}
          saved={saved}
        />

        {/* License */}
        <ProfileLicense licenseNumber={''} licenseType={''} issueDate={''} expiryDate={''} />

        {/* Certifications */}
        <ProfileCertifications />

        {/* Emergency Contact */}
        <ProfileEmergency />

      </div>
    </div>
  );
};

export default ProfilePage;