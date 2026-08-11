// src/features/driver/hooks/useGeolocation.ts

import { useState, useCallback } from 'react';

interface GeoLocation {
  latitude: number;
  longitude: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getCurrentPosition = useCallback((): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported');
        setIsLoading(false);
        resolve(null);
        return;
      }

      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          setError(null);
          setIsLoading(false);
          resolve(coords);
        },
        () => {
          setError('Unable to get location');
          setIsLoading(false);
          resolve(null);
        }
      );
    });
  }, []);

  const getLocationString = useCallback((): string => {
    if (!location) return 'Waiting...';
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }, [location]);

  return { location, error, isLoading, getCurrentPosition, getLocationString };
};