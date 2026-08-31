// src/features/driver/hooks/useDriverProfile.ts

import { useState, useEffect } from 'react';
import { DriverProfile } from '../types';
import { DEFAULT_DRIVER } from '../constants';
import { storage } from '../utils';

export const useDriverProfile = () => {
  const [profile, setProfile] = useState<DriverProfile>(() => {
    return storage.get<DriverProfile>('driverProfile', DEFAULT_DRIVER);
  });

  const loadProfile = () => {
    const saved = storage.get<DriverProfile>('driverProfile', DEFAULT_DRIVER);
    setProfile(saved);
  };

  const updateProfile = (data: Partial<DriverProfile>) => {
    const updated = { ...profile, ...data };
    storage.set('driverProfile', updated);
    setProfile(updated);
    window.dispatchEvent(new Event('profileUpdated'));
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    const handleUpdate = () => loadProfile();
    window.addEventListener('profileUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return { profile, setProfile, loadProfile, updateProfile };
};