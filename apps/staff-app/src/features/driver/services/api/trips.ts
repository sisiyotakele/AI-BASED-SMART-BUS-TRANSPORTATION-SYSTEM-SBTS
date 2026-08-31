// apps/staff-app/src/features/driver/services/api/trips.ts

import { apiClient } from './client';
import { authStorage } from '@/lib/auth-storage';

export interface Trip {
  id: string;
  tripId: string;
  route: string;
  routeCode: string;
  date: string;
  time: string;
  status: string;
  bus: string;
  bus_id?: string;
  stops: number;
  distance: string;
  duration: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  passengers?: number;
  onTime?: boolean;
  fuelUsed?: string;
  startStop?: string;
  endStop?: string;
  estimatedArrival?: string;
  routeCoordinates?: [number, number][];
  routeStopNames?: string[];
}

export interface ExtendedTrip extends Trip {
  routeType?: string;
  startStop?: string;
  endStop?: string;
  scheduledDeparture?: string;
  actualDeparture?: string;
  scheduledArrival?: string;
  actualArrival?: string;
  traffic?: string;
  rating?: number;
  notes?: string;
  city?: string;
}

export const tripsApi = {
  /**
   * Get trips for the current driver
   */
  getMyTrips: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ trips: Trip[]; total: number }> => {
    const driverId = authStorage.getCurrentUserId('driver');
    
    if (!driverId) {
      console.warn('No driver ID found in localStorage');
      return { trips: [], total: 0 };
    }

    // Map frontend params to API expected format
    const apiParams: any = {
      driverId: driverId,
    };
    
    if (params?.status) apiParams.status = params.status;
    if (params?.startDate) apiParams.startDate = params.startDate;
    if (params?.endDate) apiParams.endDate = params.endDate;
    if (params?.page) apiParams.page = params.page;
    if (params?.limit) apiParams.limit = params.limit;

    const response = await apiClient.get('/trips', {
      params: apiParams,
    });
    
    // The data is an array directly
    const tripsData = response.data?.data || response.data || [];
    const trips = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];
    
    // Map the API fields to your Trip interface
    const mappedTrips: Trip[] = trips.map((t: any) => {
      const routeData = t.version?.route || t.route || {};
      const routeStopsArr = t.version?.routeStops || routeData.stops || [];
      const routeCoordinates = routeStopsArr.map((s: any) => {
        const stop = s.stop || s;
        return [parseFloat(stop.latitude || 0), parseFloat(stop.longitude || 0)];
      });
      const routeStopNames = routeStopsArr.map((s: any) => {
        const stop = s.stop || s;
        return stop.stopName || stop.name || 'Unknown Stop';
      });

      return {
        id: t.id || '',
        tripId: t.id || '',
        route: routeData.routeName || t.routeName || t.route_name || 'Unknown Route',
        routeCode: routeData.routeCode || t.routeCode || '',
        date: t.scheduledStart ? new Date(t.scheduledStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: t.scheduledStart ? new Date(t.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        status: t.status || 'scheduled',
        bus: t.bus?.plateNumber || t.busId || t.bus_id || 'Unknown Bus',
        bus_id: t.busId || t.bus_id || '',
        stops: routeStopsArr.length || t.stops || 0,
        distance: routeData.distance || t.distance || '0 km',
        duration: t.duration || '0 min',
        scheduledStart: t.scheduledStart || '',
        scheduledEnd: t.scheduledEnd || '',
        startStop: routeStopsArr[0]?.stop?.name || t.startStop || undefined,
        endStop: routeStopsArr[routeStopsArr.length - 1]?.stop?.name || t.endStop || undefined,
        routeCoordinates: routeCoordinates.length ? routeCoordinates : undefined,
        routeStopNames: routeStopNames.length ? routeStopNames : undefined,
      };
    });
    
    return {
      trips: mappedTrips,
      total: mappedTrips.length,
    };
  },

  /**
   * Get current active trip for the driver
   */
  getCurrentTrip: async (): Promise<Trip | null> => {
    const driverId = authStorage.getCurrentUserId('driver');
    
    if (!driverId) {
      console.warn('No driver ID found in localStorage');
      return null;
    }

    try {
      // Fetch in_progress trips first
      let { data } = await apiClient.get(`/trips?driverId=${driverId}&status=in_progress`);
      
      // If no active trip, fetch scheduled trips prioritizing today
      if (!data?.data || data.data.length === 0) {
          const res = await apiClient.get(`/trips?driverId=${driverId}&status=scheduled`);
          data = res.data;
      }
      
      const tripsData = data?.data || data || [];
      const trips = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];
      
      if (trips.length > 0) {
        const t = trips[0];
        const routeData = t.version?.route || t.route || {};
        
        const routeStopsArr = t.version?.routeStops || routeData.stops || [];
        const routeCoordinates = routeStopsArr.map((s: any) => {
          const stop = s.stop || s;
          return [parseFloat(stop.latitude || 0), parseFloat(stop.longitude || 0)];
        });
        const routeStopNames = routeStopsArr.map((s: any) => {
          const stop = s.stop || s;
          return stop.stopName || stop.name || 'Unknown Stop';
        });

        let calculatedDuration = 0;
        let calculatedDistance = 0;
        routeStopsArr.forEach((s: any) => {
          calculatedDuration += s.estimatedMinutes || 0;
          calculatedDistance += parseFloat(s.distanceKm || 0);
        });
        const durationStr = t.duration || (calculatedDuration ? `${calculatedDuration} min` : '45 min');
        const distanceStr = t.distance || (calculatedDistance ? `${calculatedDistance.toFixed(1)} km` : '12.5 km');

        return {
          id: t.id || '',
          tripId: t.id || '',
          route: routeData.routeName || t.routeName || 'Unknown Route',
          routeCode: routeData.routeCode || t.routeCode || '',
          date: t.scheduledStart ? new Date(t.scheduledStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: t.scheduledStart ? new Date(t.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          status: t.status || 'in_progress',
          bus: t.bus?.plateNumber || t.busId || 'Unknown Bus',
          bus_id: t.busId || '',
          stops: routeStopsArr.length || t.stops || 0,
          distance: distanceStr,
          duration: durationStr,
          scheduledStart: t.scheduledStart || '',
          scheduledEnd: t.scheduledEnd || '',
          startStop: routeStopsArr[0]?.stop?.stopName || routeStopsArr[0]?.stop?.name || t.startStop || undefined,
          endStop: routeStopsArr[routeStopsArr.length - 1]?.stop?.stopName || routeStopsArr[routeStopsArr.length - 1]?.stop?.name || t.endStop || undefined,
          routeCoordinates: routeCoordinates.length ? routeCoordinates : undefined,
          routeStopNames: routeStopNames.length ? routeStopNames : undefined,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching current trip:', error);
      return null;
    }
  },

  /**
   * Get trip by ID
   */
  getTripById: async (id: string): Promise<Trip> => {
    const response = await apiClient.get(`/trips/${id}`);
    const t = response.data?.data || response.data;
    const routeData = t.version?.route || t.route || {};
    
    const routeStopsArr = t.version?.routeStops || routeData.stops || [];
    const routeCoordinates = routeStopsArr.map((s: any) => {
      const stop = s.stop || s;
      return [parseFloat(stop.latitude || 0), parseFloat(stop.longitude || 0)];
    });
    const routeStopNames = routeStopsArr.map((s: any) => {
      const stop = s.stop || s;
      return stop.stopName || stop.name || 'Unknown Stop';
    });

    let calculatedDuration = 0;
    let calculatedDistance = 0;
    routeStopsArr.forEach((s: any) => {
      calculatedDuration += s.estimatedMinutes || 0;
      calculatedDistance += parseFloat(s.distanceKm || 0);
    });
    const durationStr = t.duration || (calculatedDuration ? `${calculatedDuration} min` : '45 min');
    const distanceStr = t.distance || (calculatedDistance ? `${calculatedDistance.toFixed(1)} km` : '12.5 km');

    return {
      id: t.id || '',
      tripId: t.id || '',
      route: routeData.routeName || t.routeName || 'Unknown Route',
      routeCode: routeData.routeCode || t.routeCode || '',
      date: t.scheduledStart ? new Date(t.scheduledStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: t.scheduledStart ? new Date(t.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      status: t.status || 'scheduled',
      bus: t.bus?.plateNumber || t.busId || 'Unknown Bus',
      bus_id: t.busId || '',
      stops: routeStopsArr.length || t.stops || 0,
      distance: distanceStr,
      duration: durationStr,
      scheduledStart: t.scheduledStart || '',
      scheduledEnd: t.scheduledEnd || '',
      startStop: routeStopsArr[0]?.stop?.stopName || routeStopsArr[0]?.stop?.name || t.startStop || undefined,
      endStop: routeStopsArr[routeStopsArr.length - 1]?.stop?.stopName || routeStopsArr[routeStopsArr.length - 1]?.stop?.name || t.endStop || undefined,
      routeCoordinates: routeCoordinates.length ? routeCoordinates : undefined,
      routeStopNames: routeStopNames.length ? routeStopNames : undefined,
    };
  },

  /**
   * Start a trip
   */
  startTrip: async (id: string): Promise<Trip> => {
    const response = await apiClient.patch(`/trips/${id}/start`);
    return response.data?.data || response.data;
  },

  /**
   * Pause a trip
   */
  pauseTrip: async (id: string): Promise<Trip> => {
    const response = await apiClient.patch(`/trips/${id}/pause`);
    return response.data?.data || response.data;
  },

  /**
   * Resume a trip
   */
  resumeTrip: async (id: string): Promise<Trip> => {
    const response = await apiClient.patch(`/trips/${id}/resume`);
    return response.data?.data || response.data;
  },

  /**
   * End a trip
   */
  endTrip: async (id: string): Promise<Trip> => {
    const response = await apiClient.patch(`/trips/${id}/end`);
    return response.data?.data || response.data;
  },
};