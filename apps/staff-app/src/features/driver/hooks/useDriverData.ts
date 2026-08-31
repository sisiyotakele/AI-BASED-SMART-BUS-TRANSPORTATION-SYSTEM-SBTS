// apps/staff-app/src/features/driver/hooks/useDriverData.ts

import { useState, useEffect } from 'react';
import { driverApi } from '../services/api/driver';
import { tripsApi } from '../services/api/trips';

// ─── Types ──────────────────────────────────────────────────────────
interface DriverProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  experience: number;
  rating: number;
  totalTrips: number;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
  };
}

interface Trip {
  id: string;
  tripId: string;
  route: string;
  routeCode: string;
  date: string;
  time: string;
  status: string;
  bus: string;
  stops: number;
  distance: string;
  duration: string;
}

interface UseDriverDataReturn {
  profile: DriverProfile | null;
  currentTrip: Trip | null;
  upcomingTrips: Trip[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDriverData = (): UseDriverDataReturn => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch profile
      const profileData = await driverApi.getProfile();
      setProfile(profileData as any);

      // Fetch current trip
      const tripData = await tripsApi.getCurrentTrip();
      setCurrentTrip(tripData);

      // Fetch upcoming trips
      const tripsData = await tripsApi.getMyTrips({ status: 'scheduled' });
      setUpcomingTrips(tripsData.trips || []);
      
    } catch (err: unknown) {
      console.error('Error fetching driver data:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch driver data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { 
    profile, 
    currentTrip, 
    upcomingTrips, 
    loading, 
    error, 
    refetch: fetchData 
  };
};