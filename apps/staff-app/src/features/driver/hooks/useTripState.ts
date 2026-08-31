import { useState, useCallback } from 'react';
import { TripStatus } from '../types';
import { tripsApi } from '../services/api/trips';

interface UseTripStateReturn {
  tripStatus: TripStatus;
  startTrip: (tripId: string) => Promise<void>;
  pauseTrip: (tripId: string) => Promise<void>;
  resumeTrip: (tripId: string) => Promise<void>;
  endTrip: (tripId: string, showToast?: (msg: string) => void) => Promise<void>;
  isIdle: boolean;
  isRunning: boolean;
  isPaused: boolean;
  setTripStatus: (status: TripStatus) => void;
}

export const useTripState = (): UseTripStateReturn => {
  const [tripStatus, setTripStatus] = useState<TripStatus>('idle');

  const startTrip = useCallback(async (tripId: string) => {
    try {
      await tripsApi.startTrip(tripId);
      setTripStatus('running');
    } catch (error) {
      console.error('Failed to start trip API:', error);
      throw error;
    }
  }, []);

  const pauseTrip = useCallback(async (tripId: string) => {
    try {
      await tripsApi.pauseTrip(tripId);
      setTripStatus('paused');
    } catch (error) {
      console.error('Failed to pause trip API:', error);
      throw error;
    }
  }, []);

  const resumeTrip = useCallback(async (tripId: string) => {
    try {
      await tripsApi.resumeTrip(tripId);
      setTripStatus('running');
    } catch (error) {
      console.error('Failed to resume trip API:', error);
      throw error;
    }
  }, []);

  const endTrip = useCallback(async (tripId: string, showToast?: (msg: string) => void) => {
    try {
      await tripsApi.endTrip(tripId);
      setTripStatus('idle');
      if (showToast) {
        showToast('✅ Trip completed and saved');
      }
    } catch (error) {
      console.error('Failed to end trip API:', error);
      throw error;
    }
  }, []);

  return {
    tripStatus,
    startTrip,
    pauseTrip,
    resumeTrip,
    endTrip,
    isIdle: tripStatus === 'idle',
    isRunning: tripStatus === 'running',
    isPaused: tripStatus === 'paused',
    setTripStatus
  };
};