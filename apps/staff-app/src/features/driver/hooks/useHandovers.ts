// src/features/driver/hooks/useHandovers.ts

import { useState, useEffect, useCallback } from 'react';
import { ShiftHandover, HandoverStatus } from '../types';
import { storage } from '../utils';

export const useHandovers = () => {
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHandovers = useCallback(() => {
    setIsLoading(true);
    const saved = storage.get<ShiftHandover[]>('shiftHandovers', []);
    setHandovers(saved);
    setIsLoading(false);
  }, []);

  const saveHandovers = useCallback((data: ShiftHandover[]) => {
    storage.set('shiftHandovers', data);
    setHandovers(data);
    window.dispatchEvent(new Event('handoverUpdated'));
    window.dispatchEvent(new Event('storage'));
  }, []);

  const createHandover = useCallback((handover: Omit<ShiftHandover, 'id'>) => {
    const newHandover: ShiftHandover = {
      ...handover,
      id: Date.now(),
    };
    const updated = [newHandover, ...handovers];
    saveHandovers(updated);
    return newHandover;
  }, [handovers, saveHandovers]);

  const updateHandoverStatus = useCallback((id: number, status: HandoverStatus) => {
    const updated = handovers.map((h) =>
      h.id === id ? { ...h, status } : h
    );
    saveHandovers(updated);
  }, [handovers, saveHandovers]);

  // ─── getPendingHandovers - This is what MyTripPage is calling ───
  const getPendingHandovers = useCallback((driverName: string) => {
    return handovers.filter(
      (h) => h.status === 'Pending' && h.nextDriver === driverName
    );
  }, [handovers]);

  // ─── getHandoverById - For accepting/rejecting ────────────────
  const getHandoverById = useCallback((id: number) => {
    return handovers.find((h) => h.id === id);
  }, [handovers]);

  useEffect(() => {
    loadHandovers();
    const handleUpdate = () => loadHandovers();
    window.addEventListener('handoverUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('handoverUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadHandovers]);

  return {
    handovers,
    isLoading,
    loadHandovers,
    saveHandovers,
    createHandover,
    updateHandoverStatus,
    getPendingHandovers,  // ← Make sure this is exported
    getHandoverById,
  };
};