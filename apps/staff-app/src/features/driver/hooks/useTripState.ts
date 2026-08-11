// src/features/driver/hooks/useTripState.ts

import { useState, useCallback } from 'react';
import { TripStatus, CompletedTrip } from '../types';
import { storage } from '../utils';
import { ROUTE } from '../constants';

// Remove this if it's not needed:
// import { SAMPLE_TRIPS } from '../constants';

interface UseTripStateReturn {
  tripStatus: TripStatus;
  startTrip: () => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  endTrip: (showToast?: (msg: string) => void) => void;
  isIdle: boolean;
  isRunning: boolean;
  isPaused: boolean;
}

export const useTripState = (): UseTripStateReturn => {
  const [tripStatus, setTripStatus] = useState<TripStatus>('idle');

  const startTrip = useCallback(() => {
    setTripStatus('running');
  }, []);

  const pauseTrip = useCallback(() => {
    setTripStatus('paused');
  }, []);

  const resumeTrip = useCallback(() => {
    setTripStatus('running');
  }, []);

  const endTrip = useCallback((showToast?: (msg: string) => void) => {
    const completedTrip: CompletedTrip = {
      id: Date.now(),
      route: `${ROUTE.start} → ${ROUTE.destination}`,
      date: new Date().toLocaleDateString(),
      startTime: "8:00 AM",
      endTime: new Date().toLocaleTimeString(),
      distance: ROUTE.distance,
      status: "Completed",
    };

    const oldTrips = storage.get<CompletedTrip[]>('completedTrips', []);
    storage.set('completedTrips', [completedTrip, ...oldTrips]);

    setTripStatus('idle');

    if (showToast) {
      showToast('✅ Trip completed and saved');
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
  };
};