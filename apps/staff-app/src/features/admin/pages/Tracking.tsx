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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Live GPS Tracking</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor real-time bus locations and active routes</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Navigation className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL ACTIVE:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{activeBuses.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MOVING:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{onTimeCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SLOW:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{delayedCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">STOPPED:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{stoppedCount}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-1 items-center justify-end gap-3 w-full xl:w-auto overflow-x-auto">
                    <div className="relative min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search buses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                        />
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
