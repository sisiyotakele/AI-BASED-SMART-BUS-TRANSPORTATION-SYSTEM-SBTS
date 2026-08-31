// src/features/driver/hooks/useIncidents.ts

import { useState, useEffect, useCallback } from 'react';
import { IncidentReport } from '../types';
import { storage } from '../utils';

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadIncidents = useCallback(() => {
    setIsLoading(true);
    const saved = storage.get<IncidentReport[]>('incidents', []);
    setIncidents(saved);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadIncidents();
    const handleUpdate = () => loadIncidents();
    window.addEventListener('incidentUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('incidentUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadIncidents]);

  return { incidents, isLoading, loadIncidents };
};