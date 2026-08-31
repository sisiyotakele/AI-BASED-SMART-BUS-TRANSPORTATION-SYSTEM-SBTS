// src/features/driver/components/map/RouteLine.tsx

import React, { useEffect, useMemo } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { LatLng } from '../../constants/map';

interface RouteLineProps {
  stops: LatLng[];
  progress: number;
}

const getProgressRoute = (stops: LatLng[], progress: number): LatLng[] => {
  if (!stops || stops.length === 0) return [];
  
  const totalSegments = stops.length - 1;
  const totalProgress = progress / 100;
  const progressSegments = totalProgress * totalSegments;

  const result: LatLng[] = [];
  let accumulated = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    if (accumulated + 1 <= progressSegments) {
      result.push(stops[i]);
      if (i === stops.length - 2) {
        result.push(stops[i + 1]);
      }
    } else if (accumulated < progressSegments) {
      const fraction = progressSegments - accumulated;
      const lat = stops[i][0] + (stops[i + 1][0] - stops[i][0]) * fraction;
      const lng = stops[i][1] + (stops[i + 1][1] - stops[i][1]) * fraction;
      result.push([lat, lng] as LatLng);
      break;
    }
    accumulated += 1;
  }

  if (result.length === 0 && stops.length > 0) result.push(stops[0]);
  return result;
};

export const RouteLine: React.FC<RouteLineProps> = ({ stops, progress }) => {
  const map = useMap();

  // ─── Fit bounds to stops ──────────────────────────────────────
  useEffect(() => {
    if (stops && stops.length > 0) {
      map.fitBounds(stops, { padding: [60, 60], maxZoom: 18 });
    }
  }, [map, stops]);

  // ─── Memoize route calculations ───────────────────────────────
  const progressRoute = useMemo(() => getProgressRoute(stops, progress), [stops, progress]);

  if (!stops || stops.length === 0) return null;

  return (
    <>
      {/* Background route */}
      <Polyline
        positions={stops}
        pathOptions={{
          color: '#93c5fd',
          weight: 10,
          opacity: 0.15,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Secondary route */}
      <Polyline
        positions={stops}
        pathOptions={{
          color: '#93c5fd',
          weight: 6,
          opacity: 0.4,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Main route */}
      <Polyline
        positions={stops}
        pathOptions={{
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Progress route */}
      <Polyline
        positions={progressRoute}
        pathOptions={{
          color: '#12B2E4',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Dashed route overlay */}
      <Polyline
        positions={stops}
        pathOptions={{
          color: '#3b82f6',
          weight: 1.5,
          opacity: 0.15,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '8, 6',
        }}
      />
    </>
  );
};