// src/features/driver/components/map/RouteLine.tsx

import React, { useEffect, useMemo } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { LatLng } from '../../constants/map';

interface RouteLineProps {
  stops: LatLng[];
  progress: number;
}

const getTraveledRoute = (stops: LatLng[], progress: number): LatLng[] => {
  if (!stops || stops.length === 0) return [];
  const totalSegments = stops.length - 1;
  const totalProgress = Math.min(Math.max(progress / 100, 0), 1);
  const progressSegments = totalProgress * totalSegments;
  const result: LatLng[] = [];
  let accumulated = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (accumulated + 1 <= progressSegments) {
      result.push(stops[i]);
      if (i === stops.length - 2) result.push(stops[i + 1]);
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

const getRemainingRoute = (stops: LatLng[], progress: number): LatLng[] => {
  if (!stops || stops.length === 0) return [];
  const totalSegments = stops.length - 1;
  const totalProgress = Math.min(Math.max(progress / 100, 0), 1);
  const progressSegments = totalProgress * totalSegments;
  const result: LatLng[] = [];
  let accumulated = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (accumulated + 1 > progressSegments) {
      result.push(stops[i]);
      if (i === stops.length - 2) result.push(stops[i + 1]);
    } else if (accumulated < progressSegments && accumulated + 1 > progressSegments) {
      const fraction = progressSegments - accumulated;
      const lat = stops[i][0] + (stops[i + 1][0] - stops[i][0]) * fraction;
      const lng = stops[i][1] + (stops[i + 1][1] - stops[i][1]) * fraction;
      result.push([lat, lng] as LatLng);
    }
    accumulated += 1;
  }
  return result;
};

export const RouteLine: React.FC<RouteLineProps> = ({ stops, progress }) => {
  const map = useMap();
  
  useEffect(() => {
    if (stops && stops.length > 0) {
      map.fitBounds(stops, { padding: [60, 60], maxZoom: 18 });
    }
  }, [map, stops]);

  const traveledRoute = useMemo(() => getTraveledRoute(stops, progress), [stops, progress]);
  const remainingRoute = useMemo(() => getRemainingRoute(stops, progress), [stops, progress]);

  // Don't render anything if no stops
  if (!stops || stops.length === 0) return null;

  return (
    <>
      <Polyline positions={stops} pathOptions={{ color: '#E5E7EB', weight: 8, opacity: 0.4, lineCap: 'round', lineJoin: 'round' }} />
      {traveledRoute.length > 1 && (
        <Polyline positions={traveledRoute} pathOptions={{ color: '#10B981', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
      )}
      {remainingRoute.length > 1 && (
        <Polyline positions={remainingRoute} pathOptions={{ color: '#3B82F6', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
      )}
      {traveledRoute.length > 1 && (
        <Polyline positions={traveledRoute} pathOptions={{ color: '#10B981', weight: 14, opacity: 0.15, lineCap: 'round', lineJoin: 'round' }} />
      )}
      {remainingRoute.length > 1 && (
        <Polyline positions={remainingRoute} pathOptions={{ color: '#3B82F6', weight: 2, opacity: 0.2, lineCap: 'round', lineJoin: 'round', dashArray: '8, 6' }} />
      )}
    </>
  );
};