import { useState } from 'react';
import { Search, MapPin, Clock, Users, Navigation, Activity, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BusMap } from '@/features/admin/components/BusMap';

import { useLiveTracking } from '@/hooks/useLiveTracking';

const getStatusColor = (speed: number = 0) => {
    if (speed > 5) return 'bg-green-100 text-green-700'; // Moving
    if (speed > 0 && speed <= 5) return 'bg-orange-100 text-orange-700'; // Slow
    return 'bg-red-100 text-red-700'; // Stopped
};

const getStatusDot = (speed: number = 0) => {
    if (speed > 5) return 'bg-green-500';
    if (speed > 0 && speed <= 5) return 'bg-orange-500';
    return 'bg-red-500';
};

const getStatusText = (speed: number = 0) => {
    if (speed > 5) return 'On Time';
    if (speed > 0 && speed <= 5) return 'Delayed';
    return 'Stopped';
};

export function TrackingPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBus, setSelectedBus] = useState<string | null>(null);

    const { locations: activeBuses, isLoading, error } = useLiveTracking();

    const filteredBuses = activeBuses.filter(loc => {
        const busNumber = loc.bus?.plateNumber || '';
        const driverName = loc.trip?.driver?.fullName || '';
        const routeName = loc.trip?.route?.routeName || '';
        const searchLower = searchTerm.toLowerCase();

        return busNumber.toLowerCase().includes(searchLower) ||
            driverName.toLowerCase().includes(searchLower) ||
            routeName.toLowerCase().includes(searchLower);
    });

    if (isLoading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500">
            <p>Failed to load tracking data.</p>
        </div>
    );

    const onTimeCount = activeBuses.filter(b => (b.speed || 0) > 5).length;
    const delayedCount = activeBuses.filter(b => (b.speed || 0) > 0 && (b.speed || 0) <= 5).length;
    const stoppedCount = activeBuses.filter(b => (b.speed || 0) === 0).length;

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="bg-[#2B4B9E] rounded-t-lg px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Navigation className="w-6 h-6 text-white" />
                        <div>
                            <h2 className="text-white font-semibold text-lg">Live GPS Tracking</h2>
                            <p className="text-cyan-100 text-sm">{activeBuses.length} buses active</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search buses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-64"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Active</p>
                            <p className="text-2xl font-bold text-gray-900">{activeBuses.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Navigation className="w-6 h-6 text-cyan-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Moving</p>
                            <p className="text-2xl font-bold text-green-600">
                                {onTimeCount}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Slow</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {delayedCount}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Stopped</p>
                            <p className="text-2xl font-bold text-red-600">
                                {stoppedCount}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-4">
                {/* Map Area (2 columns) */}
                <div className="col-span-2 bg-white rounded-lg shadow overflow-hidden">
                    <div className="h-[600px]">
                        <BusMap locations={activeBuses} />
                    </div>
                </div>

                {/* Bus List (1 column) */}
                <div className="col-span-1 bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Active Buses</h3>
                    </div>

                    <div className="overflow-y-auto max-h-[600px]">
                        {filteredBuses.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No active buses found.
                            </div>
                        ) : filteredBuses.map((loc) => (
                            <div
                                key={loc.id}
                                className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${selectedBus === loc.busId ? 'bg-cyan-50 border-l-4 border-l-cyan-500' : ''}`}
                                onClick={() => setSelectedBus(loc.busId)}
                            >
                                {/* Bus Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${getStatusDot(loc.speed)}`}></div>
                                        <span className="font-bold text-gray-900">{loc.bus?.plateNumber || 'Unknown'}</span>
                                        <span className="text-xs text-gray-500">{loc.bus?.model}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(loc.speed)}`}>
                                        {getStatusText(loc.speed)}
                                    </span>
                                </div>

                                {/* Route */}
                                <p className="text-sm text-gray-700 mb-2 font-medium">{loc.trip?.route?.routeName || 'No Active Route'}</p>

                                {/* Driver */}
                                <div className="flex items-center space-x-2 mb-2">
                                    <Users className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-600">{loc.driver?.fullName || 'N/A'}</span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="flex items-center space-x-1">
                                        <Users className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-600">
                                            {loc.trip?.passengerCount || 0}/{loc.bus?.capacity || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Activity className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-600">{Math.round(loc.speed || 0)} km/h</span>
                                    </div>
                                </div>

                                {/* Last Update */}
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                    <span className="text-xs text-gray-400">
                                        Updated {new Date(loc.timestamp).toLocaleTimeString()}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const targetTripId = loc.tripId || loc.trip?.id;
                                            if (targetTripId) {
                                                navigate(`/dashboard/trips/${targetTripId}`);
                                            }
                                        }}
                                        disabled={!loc.tripId && !loc.trip?.id}
                                        className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center space-x-1 disabled:opacity-50"
                                    >
                                        <span>View Trip</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Ensure backward compatibility with routing if it was named Tracking 
export const Tracking = TrackingPage;
