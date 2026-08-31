import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackingService } from '@/services/tracking.service';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/auth.store';
import type { Tracking } from '@/types';

export function useLiveTracking() {
    const token = useAuthStore((state) => state.accessToken);
    const [liveLocations, setLiveLocations] = useState<Record<string, Tracking>>({});

    const { data: initialLocations = [], isLoading, error } = useQuery({
        queryKey: ['trackingLocations'],
        queryFn: () => trackingService.getAllActiveLocations(),
    });

    useEffect(() => {
        if (initialLocations.length > 0) {
            const locationMap: Record<string, Tracking> = {};
            initialLocations.forEach(loc => {
                const key = loc.tripId || loc.busId;
                locationMap[key] = loc;
            });
            setLiveLocations(prev => ({ ...locationMap, ...prev }));
        }
    }, [initialLocations]);

    useEffect(() => {
        if (!token) return;

        socketService.connect(token);
        socketService.subscribe('tracking');

        const handleLocationUpdate = (data: any) => {
            const key = data.tripId || data.busId;
            setLiveLocations(prev => ({
                ...prev,
                [key]: {
                    ...(prev[key] || {}),
                    ...data,
                    timestamp: new Date().toISOString()
                }
            }));
        };

        socketService.on('bus:location:update', handleLocationUpdate);

        return () => {
            socketService.off('bus:location:update', handleLocationUpdate);
            socketService.unsubscribe('tracking');
        };
    }, [token]);

    return {
        locations: Object.values(liveLocations),
        isLoading,
        error
    };
}
