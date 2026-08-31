// src/features/driver/hooks/useTrips.ts

import { useState } from 'react';
import { Trip } from '../types';
import { SAMPLE_TRIPS } from '../constants/trips';

interface UseTripsReturn {
  trips: Trip[];
  filteredTrips: Trip[];
  totalTrips: number;
  completedTrips: number;
  totalDistance: number;
  mostRecentDate: string;
  uniqueRoutes: string[];
  filterTrips: (filters: {
    search: string;
    status: string;
    route: string;
    startDate: string;
    endDate: string;
  }) => void;
}

export const useTrips = (): UseTripsReturn => {
  const [trips] = useState<Trip[]>(SAMPLE_TRIPS as unknown as Trip[]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>(SAMPLE_TRIPS as unknown as Trip[]);

  const totalTrips = trips.length;
  const completedTrips = trips.filter((t) => t.status === "Completed").length;
  const totalDistance = trips.reduce((acc, t) => {
    const km = parseFloat(t.distance.replace('km', ''));
    return acc + km;
  }, 0);
  const mostRecentDate = trips.reduce((max, t) => (t.date > max ? t.date : max), trips[0]?.date || "");
  const uniqueRoutes = Array.from(new Set(trips.map((t) => t.route)));

  const filterTrips = (filters: {
    search: string;
    status: string;
    route: string;
    startDate: string;
    endDate: string;
  }) => {
    const { search, status, route, startDate, endDate } = filters;
    const filtered = trips.filter((trip) => {
      const matchesSearch =
        trip.route.toLowerCase().includes(search.toLowerCase()) ||
        trip.tripId.toLowerCase().includes(search.toLowerCase()) ||
        trip.bus.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All Status" || trip.status === status;
      const matchesRoute = route === "All Routes" || trip.route === route;
      const matchesDate = trip.date >= startDate && trip.date <= endDate;
      return matchesSearch && matchesStatus && matchesRoute && matchesDate;
    });
    setFilteredTrips(filtered);
  };

  return {
    trips,
    filteredTrips,
    totalTrips,
    completedTrips,
    totalDistance,
    mostRecentDate,
    uniqueRoutes,
    filterTrips,
  };
};