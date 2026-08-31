import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { routeService } from '@/services/route.service';
import { ArrowLeft, MapPin, ChevronRight, Navigation, Map as MapIcon, ArrowRight, Route as RouteIcon, Info, Bus, Compass } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

    const [selectedDirection, setSelectedDirection] = useState<'forward' | 'backward'>('forward');
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');

    const { data: route, isLoading, error } = useQuery({
        queryKey: ['route', id],
        queryFn: () => routeService.getById(id!),
        enabled: !!id,
        refetchInterval: 2000,
    });

    const { data: routeVariants } = useQuery({
        queryKey: ['route-variants', id],
        queryFn: () => routeService.getVersions(id!),
        enabled: !!id,
        refetchInterval: 2000,
    });

    const selectedDirectionVariants = selectedDirection === 'forward'
        ? (routeVariants?.forward || [])
        : (routeVariants?.backward || []);

    useEffect(() => {
        if (selectedDirectionVariants.length > 0 && !selectedVersionId) {
            setSelectedVersionId(selectedDirectionVariants[0].id);
        } else if (selectedDirectionVariants.length === 0) {
            setSelectedVersionId('');
        }
    }, [selectedDirectionVariants, selectedVersionId]);

    const selectedVersion = selectedDirectionVariants.find((v: any) => v.id === selectedVersionId);
    const routeStops = selectedVersion?.routeStops || [];
    const sortedStops = [...routeStops].sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !route) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Route Not Found</h2>
                <button onClick={() => navigate('/dashboard/routes')} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                    Back to Routes
                </button>
            </div>
        );
    }

    // Identify dynamic Start and End Terminals based purely on Direction!
    const activeStartTerminal = selectedDirection === 'forward' ? route.startTerminal : route.endTerminal;
    const activeEndTerminal = selectedDirection === 'forward' ? route.endTerminal : route.startTerminal;

    // Base default terminals for route desc regardless of direction
    const baseStart = route.startTerminal?.terminalName;
    const baseEnd = route.endTerminal?.terminalName;

    const startLat = Number(activeStartTerminal?.latitude) || 9.0054;
    const startLng = Number(activeStartTerminal?.longitude) || 38.7636;
    const endLat = Number(activeEndTerminal?.latitude) || 9.0320;
    const endLng = Number(activeEndTerminal?.longitude) || 38.7469;

    const mapCenter: [number, number] = [
        (startLat + endLat) / 2,
        (startLng + endLng) / 2
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            
            {/* Descriptive Header Section */}
            <div className="bg-white dark:bg-navy-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-navy-700 p-8 md:p-10 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-cyan-50 dark:from-navy-800 to-transparent rounded-full translate-x-1/3 -translate-y-1/3 opacity-50 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start gap-6">
                        <button
                            onClick={() => navigate('/dashboard/routes')}
                            className="mt-1 w-12 h-12 flex items-center justify-center bg-white dark:bg-navy-800 border-2 border-slate-100 dark:border-navy-700 rounded-full hover:bg-slate-50 dark:hover:bg-navy-700 hover:scale-105 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${route.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                    : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400 border border-slate-200 dark:border-navy-700'
                                    }`}>
                                    {route.status} ROUTE
                                </span>
                                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                    <RouteIcon className="w-4 h-4" />
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {route.routeName}
                            </h1>
                            <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium max-w-xl text-base flex items-center gap-2">
                                <Info className="w-5 h-5 text-cyan-500" />
                                {route.description || `Primary transit corridor connecting ${baseStart} and ${baseEnd}.`}
                            </p>
                        </div>
                    </div>
                    
                    {/* Visual Route Indicator */}
                    <div className="px-6 py-5 bg-slate-50 dark:bg-navy-800 rounded-2xl border border-slate-100 dark:border-navy-700 shadow-inner flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">From</div>
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-navy-700 max-w-[120px] truncate">{baseStart}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        <div className="text-center">
                            <div className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">To</div>
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-navy-700 max-w-[120px] truncate">{baseEnd}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Travel Path Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Direction Settings */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-navy-700">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Compass className="w-5 h-5 text-cyan-500" />
                        1. Select Route Direction
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setSelectedDirection('forward'); setSelectedVersionId(''); }}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${selectedDirection === 'forward'
                                ? 'border-cyan-500 ring-4 ring-cyan-50 dark:ring-cyan-900/20 bg-cyan-50/50 dark:bg-cyan-900/10'
                                : 'border-slate-100 dark:border-navy-700 bg-white dark:bg-navy-900 hover:border-cyan-200 dark:hover:border-cyan-700 shadow-sm'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDirection === 'forward' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`}>Forward Path</span>
                            </div>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">{route.startTerminal?.terminalName}</div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><ArrowRight className="w-3 h-3 block opacity-50" /> {route.endTerminal?.terminalName}</div>
                        </button>
                        
                        <button
                            onClick={() => { setSelectedDirection('backward'); setSelectedVersionId(''); }}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${selectedDirection === 'backward'
                                ? 'border-cyan-500 ring-4 ring-cyan-50 dark:ring-cyan-900/20 bg-cyan-50/50 dark:bg-cyan-900/10'
                                : 'border-slate-100 dark:border-navy-700 bg-white dark:bg-navy-900 hover:border-cyan-200 dark:hover:border-cyan-700 shadow-sm'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDirection === 'backward' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`}>Backward Path</span>
                            </div>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">{route.endTerminal?.terminalName}</div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><ArrowRight className="w-3 h-3 block opacity-50" /> {route.startTerminal?.terminalName}</div>
                        </button>
                    </div>
                </div>

                {/* Variant Configuration Settings */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-navy-700">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <RouteIcon className="w-5 h-5 text-indigo-500" />
                        2. Select Route Variant 
                    </h3>
                    
                    {selectedDirectionVariants.length === 0 ? (
                        <div className="h-[84px] bg-slate-50 dark:bg-navy-800 rounded-xl border border-dashed border-slate-200 dark:border-navy-600 flex items-center justify-center text-sm font-semibold text-slate-400 italic">
                            No variant configurations exist for this direction.
                        </div>
                    ) : (
                        <div className="flex overflow-x-auto gap-3 custom-scrollbar pb-2">
                            {selectedDirectionVariants.map((variant: any) => (
                                <button
                                    key={variant.id}
                                    onClick={() => setSelectedVersionId(variant.id)}
                                    className={`min-w-[180px] p-4 rounded-xl border-2 text-left transition-all shadow-sm ${selectedVersionId === variant.id
                                        ? 'border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20 bg-indigo-50/50 dark:bg-indigo-900/10'
                                        : 'border-slate-100 dark:border-navy-700 bg-white dark:bg-navy-900 hover:border-indigo-200 dark:hover:border-indigo-700'
                                    }`}
                                >
                                    <div className="font-bold text-[13px] text-slate-800 dark:text-slate-100 line-clamp-1">{variant.routeName}</div>
                                    <div className={`mt-2 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${
                                        selectedVersionId === variant.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-slate-100 text-slate-500 dark:bg-navy-800'
                                    }`}>
                                        <MapPin className="w-3 h-3" /> {variant.stopCount || 0} Scheduled Stops
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stop Sequence Visualization */}
            {selectedVersionId && (
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50/80 dark:bg-navy-800/80 flex justify-between items-center">
                        <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-emerald-500" />
                            Comprehensive Stop Sequence
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-1 bg-white dark:bg-navy-900 rounded-md border border-slate-200 dark:border-navy-700 shadow-sm">
                                {sortedStops.length + 2} TOUCHPOINTS
                            </span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto relative min-h-[190px] custom-scrollbar py-8">
                        <div className="flex items-start justify-between min-w-full w-max px-8 pt-4 relative z-10 text-center">
                            
                            {/* START TERMINAL - Dynamically reflects Forward/Backward selection */}
                            <div className="flex flex-col items-center flex-1 min-w-[130px] max-w-[200px] shrink-0 relative group">
                                <div className="absolute top-[28px] -translate-y-1/2 left-[50%] right-[calc(-50%+30px)] flex items-center z-0">
                                    <div className="h-[3px] bg-slate-200 dark:bg-navy-700 flex-1"></div>
                                    <ChevronRight className="w-5 h-5 text-slate-200 dark:text-navy-700 -ml-2" strokeWidth={3} />
                                </div>

                                <div className="relative z-10 w-14 h-14 rounded-full border-[4px] border-white dark:border-navy-800 bg-emerald-500 shadow-lg flex items-center justify-center mb-4">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <div className="px-2 w-full flex flex-col items-center">
                                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2">Depart</span>
                                    <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                                        {activeStartTerminal?.terminalName}
                                    </div>
                                </div>
                            </div>

                            {/* STOPS */}
                            {sortedStops.length === 0 ? (
                                <div className="min-w-[250px] flex-1 flex items-center justify-center">
                                    <div className="px-6 py-3 border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl bg-slate-50 dark:bg-navy-800/50">
                                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">EXPRESS DIRECT CORRIDOR</p>
                                    </div>
                                </div>
                            ) : (
                                sortedStops.map((rs: any) => (
                                    <div key={rs.id} className="flex flex-col items-center flex-1 min-w-[130px] max-w-[200px] shrink-0 relative group">
                                        <div className="absolute top-[28px] -translate-y-1/2 left-[50%] right-[calc(-50%+30px)] flex items-center z-0">
                                            <div className="h-[3px] bg-slate-200 dark:bg-navy-700 flex-1"></div>
                                            <ChevronRight className="w-5 h-5 text-slate-200 dark:text-navy-700 -ml-2" strokeWidth={3} />
                                        </div>

                                        <div className="relative z-10 w-10 h-10 mt-2 mb-4 rounded-full border-[3px] border-white dark:border-navy-800 bg-cyan-500 shadow-md flex items-center justify-center text-white font-extrabold text-sm hover:scale-110 transition-transform">
                                            {rs.sequenceNumber}
                                        </div>
                                        <div className="px-2 w-full flex flex-col items-center">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 shadow-sm border border-slate-100 dark:border-navy-700 rounded bg-slate-50 dark:bg-navy-800 px-1">{rs.stop?.stopCode}</span>
                                            <div className="font-bold text-[13px] text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight w-full max-w-[140px] mx-auto">
                                                {rs.stop?.stopName}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* END TERMINAL - Dynamically reflects Forward/Backward selection */}
                            <div className="flex flex-col items-center flex-1 min-w-[130px] max-w-[200px] shrink-0 relative group">
                                <div className="relative z-10 w-14 h-14 rounded-full border-[4px] border-white dark:border-navy-800 bg-red-500 shadow-lg flex items-center justify-center mb-4">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <div className="px-2 w-full flex flex-col items-center">
                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2">Arrive</span>
                                    <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                                        {activeEndTerminal?.terminalName}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Geography Plotting Container */}
            {selectedVersionId && (
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden flex flex-col h-[600px] relative">
                    <div className="absolute top-4 left-4 z-[1000] bg-white/90 dark:bg-navy-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-slate-200/50 dark:border-navy-700/50 flex items-center gap-3">
                        <MapIcon className="w-5 h-5 text-cyan-500" />
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest line-clamp-1">Geographic Overview</div>
                            <div className="text-sm font-bold text-slate-800 dark:text-white leading-none mt-1">Real-World Polyline</div>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full relative z-0">
                        <MapContainer
                            key={`${selectedDirection}-${selectedVersionId}`}
                            center={mapCenter}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {activeStartTerminal && (
                                <Marker position={[startLat, startLng]} icon={startIcon}>
                                    <Popup>
                                        <div className="font-bold text-emerald-600 uppercase text-xs tracking-wider mb-1">Origin Terminal</div>
                                        <div className="font-bold text-slate-800">{activeStartTerminal.terminalName}</div>
                                    </Popup>
                                </Marker>
                            )}

                            {activeEndTerminal && (
                                <Marker position={[endLat, endLng]} icon={endIcon}>
                                    <Popup>
                                        <div className="font-bold text-red-500 uppercase text-xs tracking-wider mb-1">Destination Terminal</div>
                                        <div className="font-bold text-slate-800">{activeEndTerminal.terminalName}</div>
                                    </Popup>
                                </Marker>
                            )}

                            {sortedStops.map((rs: any) => {
                                if (!rs.stop?.latitude || !rs.stop?.longitude) return null;
                                return (
                                    <Marker
                                        key={rs.id}
                                        position={[Number(rs.stop.latitude), Number(rs.stop.longitude)]}
                                    >
                                        <Popup>
                                            <div className="bg-cyan-100 text-cyan-700 text-[10px] px-2 py-0.5 rounded font-black inline-block mb-1">STOP #{rs.sequenceNumber}</div>
                                            <div className="font-bold text-slate-800 leading-tight">{rs.stop.stopName}</div>
                                        </Popup>
                                    </Marker>
                                );
                            })}

                            {activeStartTerminal && activeEndTerminal && (
                                <Polyline
                                    positions={[
                                        [startLat, startLng],
                                        ...sortedStops
                                            .filter((rs: any) => rs.stop?.latitude && rs.stop?.longitude)
                                            .map((rs: any) => [Number(rs.stop.latitude), Number(rs.stop.longitude)]),
                                        [endLat, endLng]
                                    ] as [number, number][]}
                                    color="#0ea5e9" // Tailwind sky-500
                                    weight={5}
                                    opacity={0.8}
                                />
                            )}
                        </MapContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
