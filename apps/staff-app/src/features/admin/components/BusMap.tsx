import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, Navigation } from 'lucide-react';
import type { Tracking } from '@/types';

interface BusMapProps {
    locations?: Tracking[];
}

export function BusMap({ locations = [] }: BusMapProps) {
    const center: [number, number] = [9.0320, 38.7469]; // Addis Ababa

    const getStatus = (speed: number = 0) => {
        if (speed > 5) return 'active';
        if (speed > 0 && speed <= 5) return 'idle';
        return 'stopped';
    };

    const createBusIcon = (status: string) => {
        const color = status === 'active' ? '#10b981' : status === 'idle' ? '#f59e0b' : '#ef4444';
        return new DivIcon({
            className: 'custom-bus-icon',
            html: `
                <div style="
                    background-color: ${color};
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 6v6"></path>
                        <path d="M15 6v6"></path>
                        <path d="M2 12h19.6"></path>
                        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
                        <circle cx="7" cy="18" r="2"></circle>
                        <circle cx="16" cy="18" r="2"></circle>
                    </svg>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });
    };

    const activeCount = locations.filter(l => getStatus(l.speed) === 'active').length;
    const idleCount = locations.filter(l => getStatus(l.speed) === 'idle').length;
    const stoppedCount = locations.filter(l => getStatus(l.speed) === 'stopped').length;

    return (
        <div className="relative h-full w-full rounded-lg overflow-hidden">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {locations.filter(loc => loc.latitude && loc.longitude).map((bus) => {
                    const status = getStatus(bus.speed);
                    return (
                        <Marker
                            key={bus.busId}
                            position={[bus.latitude, bus.longitude]}
                            icon={createBusIcon(status)}
                        >
                            <Popup>
                                <div className="p-2">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Bus className="w-5 h-5 text-[#2D7A8E]" />
                                        <p className="font-bold text-gray-900">{bus.bus?.plateNumber || 'Unknown Bus'}</p>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-700">
                                            <span className="font-semibold">Route:</span> {bus.trip?.route?.routeName || 'N/A'}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-semibold">Driver:</span> {bus.trip?.driver?.fullName || 'N/A'}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-semibold">Speed:</span> {Math.round(bus.speed || 0)} km/h
                                        </p>
                                        <div className="flex items-center space-x-1">
                                            <Navigation className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600">Heading: {bus.direction || 0}°</span>
                                        </div>
                                        <div className="mt-2 pt-2 border-t">
                                            <span
                                                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : status === 'idle'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                            {status === 'active' && (
                                <Circle
                                    center={[bus.latitude, bus.longitude]}
                                    radius={150}
                                    pathOptions={{
                                        color: '#10b981',
                                        fillColor: '#10b981',
                                        fillOpacity: 0.1,
                                        weight: 1,
                                    }}
                                />
                            )}
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
                <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-600">Active ({activeCount})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs text-gray-600">Slow ({idleCount})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs text-gray-600">Stopped ({stoppedCount})</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
