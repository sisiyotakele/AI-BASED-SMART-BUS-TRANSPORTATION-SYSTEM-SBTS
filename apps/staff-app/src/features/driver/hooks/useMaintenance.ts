// src/features/driver/hooks/useMaintenance.ts

import { useState, useEffect, useCallback } from 'react';
import { MaintenanceRequest } from '../types';
import { storage } from '../utils';

export const useMaintenance = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = useCallback(() => {
    setIsLoading(true);
    const saved = storage.get<MaintenanceRequest[]>('maintenanceRequests', []);
    setRequests(saved);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRequests();
    const handleUpdate = () => loadRequests();
    window.addEventListener('maintenanceUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('maintenanceUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadRequests]);

  return { requests, isLoading, loadRequests };
};