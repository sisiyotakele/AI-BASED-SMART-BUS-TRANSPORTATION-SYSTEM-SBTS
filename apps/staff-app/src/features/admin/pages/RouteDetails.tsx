import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { routeService } from '@/services/route.service';
import { stopService } from '@/services/stop.service';
import { ArrowLeft, MapPin, Activity, Navigation, Compass, Layers, ListOrdered, Plus, GitBranch } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export function RouteDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [isAddingStops, setIsAddingStops] = useState(false);
    const [selectedNewStop, setSelectedNewStop] = useState<string>('');

    const { data: route, isLoading, error } = useQuery({
        queryKey: ['route', id],
        queryFn: () => routeService.getById(id!),
        enabled: !!id,
    });

    const { data: allStops = [] } = useQuery({
        queryKey: ['stops'],
        queryFn: () => stopService.getAll()
    });

    useEffect(() => {
        if (route?.versions?.length && !selectedVersionId) {
            // default to most recent or active
            const active = route.versions.find((v: any) => v.isActive);
            setSelectedVersionId(active?.id || route.versions[0].id);
        }
    }, [route, selectedVersionId]);

    const activeVersion = route?.versions?.find((v: any) => v.id === selectedVersionId) || route?.versions?.[0];
    const routeStops = activeVersion?.routeStops || [];
    
    // Sort route stops by sequenceNumber
    const sortedStops = [...routeStops].sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);
    const isEditingAllowed = activeVersion && !activeVersion.isActive;

    const createVersionMutation = useMutation({
        mutationFn: async () => routeService.createVersion(id!),
        onSuccess: (newVersion) => {
            queryClient.invalidateQueries({ queryKey: ['route', id] });
            setSelectedVersionId(newVersion.id);
            toast.success('New draft version created! You can now add stops.');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create version')
    });

    const addStopMutation = useMutation({
        mutationFn: async ({ stopId, sequence }: { stopId: string, sequence: number }) => 
            routeService.addRouteStop(activeVersion!.id, { stopId, sequenceNumber: sequence, distanceKm: 0 }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['route', id] });
            setSelectedNewStop('');
            toast.success('Stop added to sequence.');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add stop')
    });

    const handleCreateVersion = () => {
        if (window.confirm('Create a new draft version from this route?')) {
            createVersionMutation.mutate();
        }
    };

    const handleAddStop = () => {
        if (!selectedNewStop) return;
        addStopMutation.mutate({ 
            stopId: selectedNewStop, 
            sequence: sortedStops.length + 1 
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 text-cyan-600 dark:text-cyan-400">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold tracking-wider uppercase">Gathering geographic intelligence...</p>
                </div>
            </div>
        );
    }

    if (error || !route) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <Navigation className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Route Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    The route parameters could not be located in the central database. It may have been deleted or strictly re-mapped.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/dashboard/routes')} className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
                        Return to Routes
                    </button>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    const startLat = Number(route.startStop?.latitude) || 9.0054;
    const startLng = Number(route.startStop?.longitude) || 38.7636;
    const endLat = Number(route.endStop?.latitude) || 9.0320;
    const endLng = Number(route.endStop?.longitude) || 38.7469;

    const mapCenter: [number, number] = [
        (startLat + endLat) / 2, 
        (startLng + endLng) / 2
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div
                        onClick={() => navigate('/dashboard/routes')}
                        className="p-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-700 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {route.routeName}
                            </h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                route.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-navy-800 dark:text-slate-400 dark:border-navy-600'
                            }`}>
                                {route.status || 'UNKNOWN'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">UUID: {route.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/dashboard/routes" className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium">
                        <ListOrdered className="w-4 h-4" />
                        Edit Sequence in Routes Grid
                    </Link>
                </div>
            </div>

            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between relative z-10 w-full mb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                            <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white relative z-10">{sortedStops.length}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 relative z-10 mt-1">Total Fixed Stops</p>
                </div>

                <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between relative z-10 w-full mb-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white relative z-10">{route.versions?.length || 1}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 relative z-10 mt-1">Active Mapping Versions</p>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                        <div className="w-[45%] text-center">
                            <div className="inline-flex items-center justify-center p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg mb-2">
                                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate" title={route.startStop?.stopName || route.startStopName || 'N/A'}>
                                {route.startStop?.stopName || route.startStopName || 'Origin Missing'}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">START STOP</p>
                        </div>
                        
                        <div className="w-[10%] flex flex-col justify-center items-center">
                            <div className="h-0.5 w-full bg-slate-200 dark:bg-navy-600 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-navy-900 border-2 border-slate-300 dark:border-navy-500 rounded-full"></div>
                            </div>
                        </div>

                        <div className="w-[45%] text-center">
                            <div className="inline-flex items-center justify-center p-2 bg-red-50 dark:bg-red-500/10 rounded-lg mb-2">
                                <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate" title={route.endStop?.stopName || route.endStopName || 'N/A'}>
                                {route.endStop?.stopName || route.endStopName || 'Destination Missing'}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">END STOP</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lower Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Route Sequence Timeline */}
                <div className="lg:col-span-1 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden flex flex-col h-[650px]">
                    <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex flex-col gap-3 bg-slate-50 dark:bg-navy-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ListOrdered className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Versions & Stops</h3>
                            </div>
                            <button onClick={handleCreateVersion} className="p-1.5 bg-white dark:bg-navy-700 border border-slate-300 dark:border-navy-600 rounded bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:opacity-80 transition" title="Create Draft Version">
                                <GitBranch className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <select 
                            value={selectedVersionId} 
                            onChange={(e) => setSelectedVersionId(e.target.value)}
                            className="w-full text-sm px-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                            {route.versions?.map((v: any) => (
                                <option key={v.id} value={v.id}>
                                    {v.versionName || `Version ${v.versionNumber}`} {v.isActive ? '(Active)' : '(Draft)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="p-5 flex-1 overflow-y-auto">
                        {sortedStops.length === 0 ? (
                            <div className="flex flex-col items-center flex-1 justify-center h-full text-center text-slate-500 dark:text-slate-400">
                                <MapPin className="w-12 h-12 mb-3 text-slate-300 dark:text-navy-600" />
                                <p className="text-sm">No sequence defined yet.<br />This route is missing intermediate waypoints.</p>
                            </div>
                        ) : (
                            <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-navy-600 before:to-transparent">
                                {sortedStops.map((rs: any, idx: number) => {
                                    const isFirst = idx === 0;
                                    const isLast = idx === sortedStops.length - 1;
                                    return (
                                        <div key={rs.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white dark:border-navy-900 bg-white dark:bg-navy-800 shadow absolute -left-3 md:left-1/2 md:-translate-x-1/2 z-10 text-[10px] font-bold text-slate-500">
                                                {isFirst ? (
                                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                                ) : isLast ? (
                                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                                ) : (
                                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                                )}
                                            </div>
                                            
                                            <div className="bg-slate-50 dark:bg-navy-800 p-3 rounded border border-slate-200 dark:border-navy-700 ml-4 md:ml-0 md:w-[calc(50%-2rem)] shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors w-full">
                                                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">Sequence {rs.sequenceNumber}</div>
                                                <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{rs.stop?.stopName || 'Unknown Stop'}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        
                        {isEditingAllowed && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-navy-700">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Add Intermediate Stop</div>
                                <div className="flex gap-2">
                                    <select 
                                        value={selectedNewStop}
                                        onChange={(e) => setSelectedNewStop(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    >
                                        <option value="">-- Choose Stop --</option>
                                        {allStops.map(stop => (
                                            <option key={stop.id} value={stop.id}>{stop.stopName} ({stop.stopCode})</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={handleAddStop}
                                        disabled={!selectedNewStop || addStopMutation.isPending}
                                        className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>

                {/* Main Interactive Map Viewer */}
                <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden flex flex-col h-[650px]">
                    <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between bg-slate-50 dark:bg-navy-800">
                        <div className="flex items-center gap-2">
                            <Compass className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Geospatial Overview</h3>
                        </div>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> OSM Hybrid Topology
                        </span>
                    </div>
                    
                    <div className="flex-1 w-full relative z-0">
                        <MapContainer
                            center={mapCenter}
                            zoom={12}
                            style={{ height: '100%', width: '100%', zIndex: 0 }}
                            zoomControl={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            
                            {/* Start Coordinate */}
                            {route.startStopName && (
                                <Marker position={[startLat, startLng]} icon={startIcon}>
                                    <Popup>
                                        <div className="text-sm font-bold">{route.startStop?.stopName || route.startStopName}</div>
                                        <div className="text-xs text-slate-500">Origin Stop</div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* End Coordinate */}
                            {route.endStopName && (
                                <Marker position={[endLat, endLng]} icon={endIcon}>
                                    <Popup>
                                        <div className="text-sm font-bold">{route.endStop?.stopName || route.endStopName}</div>
                                        <div className="text-xs text-slate-500">Terminal Destination</div>
                                    </Popup>
                                </Marker>
                            )}
                            
                            {/* Trajectory */}
                            {route.startStopName && route.endStopName && (
                                <Polyline
                                    positions={[
                                        [startLat, startLng],
                                        // insert intermediate GPS points if they exist
                                        ...sortedStops.map((rs: any) => [Number(rs.stop?.latitude), Number(rs.stop?.longitude)]),
                                        [endLat, endLng]
                                    ].filter(p => !isNaN(p[0]) && !isNaN(p[1])) as [number, number][]}
                                    color="#10B981"
                                    weight={4}
                                    opacity={0.6}
                                    dashArray="10, 10"
                                />
                            )}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
