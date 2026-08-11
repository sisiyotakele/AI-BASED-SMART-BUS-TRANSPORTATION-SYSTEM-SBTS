// src/features/driver/components/map/StopMarkers.tsx

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import { LatLng } from '../../constants/map';

interface StopMarkersProps {
  stops: LatLng[];
  stopNames: string[];
  currentStop: number;
  onStopClick?: (index: number) => void;
}

// ─── Stop Icon Factory ────────────────────────────────────────────
const createStopIcon = (kind: "done" | "current" | "next" | "upcoming") => {
  const configs = {
    done: { 
      size: 14, 
      bg: '#10b981', 
      border: '#fff',
      shadow: '0 2px 8px rgba(16,185,129,0.4)',
      inner: '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><path d="M5 12l4 4 10-10"/></svg>'
    },
    current: { 
      size: 18, 
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)', 
      border: '#fff',
      shadow: '0 0 0 4px rgba(245,158,11,0.2), 0 2px 12px rgba(245,158,11,0.4)',
      inner: '<div style="width:8px;height:8px;border-radius:9999px;background:white;opacity:0.5;position:absolute;top:5px;left:5px;"></div>'
    },
    next: { 
      size: 14, 
      bg: '#fff', 
      border: '#3b82f6',
      shadow: '0 2px 8px rgba(59,130,246,0.3)',
      inner: '<div style="width:6px;height:6px;border-radius:9999px;background:#3b82f6;position:absolute;top:4px;left:4px;"></div>'
    },
    upcoming: { 
      size: 10, 
      bg: '#fff', 
      border: '#d1d5db',
      shadow: '0 1px 4px rgba(0,0,0,0.05)',
      inner: ''
    },
  };

  const config = configs[kind];
  
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="
          width:${config.size}px;
          height:${config.size}px;
          border-radius:9999px;
          background:${config.bg};
          border:2px solid ${config.border};
          box-shadow:${config.shadow};
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
          ${kind === 'current' ? 'animation: pulse-stop 1.5s infinite;' : ''}
        ">
          ${config.inner}
        </div>
        ${kind === 'current' ? `
          <style>
            @keyframes pulse-stop {
              0%, 100% { 
                transform: scale(1); 
                box-shadow: 0 0 0 4px rgba(245,158,11,0.2), 0 2px 12px rgba(245,158,11,0.4);
              }
              50% { 
                transform: scale(1.15); 
                box-shadow: 0 0 0 8px rgba(245,158,11,0.1), 0 2px 16px rgba(245,158,11,0.5);
              }
            }
          </style>
        ` : ''}
      </div>
    `,
    iconSize: [config.size + 8, config.size + 8],
    iconAnchor: [(config.size + 8) / 2, (config.size + 8) / 2],
    popupAnchor: [0, -config.size],
  });
};

export const StopMarkers: React.FC<StopMarkersProps> = ({
  stops,
  stopNames,
  currentStop,
  onStopClick,
}) => {
  const getStopKind = (index: number): "done" | "current" | "next" | "upcoming" => {
    if (index < currentStop) return 'done';
    if (index === currentStop) return 'current';
    if (index === currentStop + 1) return 'next';
    return 'upcoming';
  };

  return (
    <>
      {stops.map((stop, index) => {
        const kind = getStopKind(index);
        const icon = createStopIcon(kind);
        
        return (
          <Marker
            key={index}
            position={stop}
            icon={icon}
            eventHandlers={{
              click: () => onStopClick?.(index),
            }}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-gray-900 dark:text-white">{stopNames[index]}</strong>
                <br />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {kind === 'current' 
                    ? '🟡 Current stop' 
                    : kind === 'next' 
                    ? '🔵 Next stop' 
                    : `${index + 1} of ${stops.length}`}
                </span>
                {kind === 'current' && (
                  <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ⏱️ Arriving now
                  </div>
                )}
                {kind === 'next' && (
                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    ⏱️ Next stop
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};