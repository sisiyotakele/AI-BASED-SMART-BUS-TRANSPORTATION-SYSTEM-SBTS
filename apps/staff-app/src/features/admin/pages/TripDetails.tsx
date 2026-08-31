import { ArrowLeft, MapPin, Flag, Clock, User, PlayCircle, CheckCircle, Navigation, Map as MapIcon, ChevronRight, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import busImage from '@/assets/bus.jpeg';
import { tripService } from '@/services/trip.service';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
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
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

export function TripDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const { data: trip, isLoading, error } = useQuery({
        queryKey: ['trip', id],
        queryFn: () => tripService.getById(id!),
        enabled: !!id,
    });

    const startMutation = useMutation({ mutationFn: () => tripService.start(id!), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }) });
    const endMutation = useMutation({ mutationFn: () => tripService.end(id!), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }) });

    if (isLoading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div></div>;
    if (error || !trip) return <div className="p-8 text-center text-red-500">Trip not found.</div>;

    const route = trip.version?.route;
    const sortedStops = [...(trip.version?.routeStops || [])].sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);
    
    const formatTime = (d: string | Date | undefined) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
    const formatDate = (d: string | Date | undefined) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date';

    const startTerminal = route?.startTerminal;
    const endTerminal = route?.endTerminal;
    const startStopName = startTerminal?.terminalName || 'Start Terminal';
    const endStopName = endTerminal?.terminalName || 'End Terminal';
    const routeName = route?.routeName || 'Unknown Route';
    const tripName = trip.id ? `SB _ ${trip.id.substring(0, 3)}` : 'SB _ 221';
    const totalStops = sortedStops.length || 0;

    const startLat = Number(startTerminal?.latitude || 9.02497);
    const startLng = Number(startTerminal?.longitude || 38.74689);
    const endLat = Number(endTerminal?.latitude || 8.9806);
    const endLng = Number(endTerminal?.longitude || 38.7578);
    const mapCenter = [
        (startLat + endLat) / 2 || 9.0028,
        (startLng + endLng) / 2 || 38.7524
    ] as [number, number];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'in_progress': return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'scheduled': return 'bg-slate-50 border-slate-200 text-slate-700';
            case 'cancelled': return 'bg-red-50 border-red-200 text-red-700';
            case 'paused': return 'bg-amber-50 border-amber-200 text-amber-700';
            default: return 'bg-slate-50 border-slate-200 text-slate-700';
        }
    };

    const statusStyle = getStatusStyle(trip.status);

    return (
        <div className="space-y-4">
            {/* Very Top Header mimicking the image */}
            <div className="flex items-center gap-3 mb-6">
                <div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => navigate('/dashboard/trips')} className="hover:bg-slate-100 p-1.5 rounded pr-3">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                      </button>
                      <h1 className="text-xl font-bold text-slate-800">Trip Management</h1>
                   </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                
                {/* TOP ROW - MAIN DETAILS CARD */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    {/* Header: Title and Status */}
                    <div className="flex flex-wrap items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{tripName}</h2>
                            <span className="text-sm font-medium text-gray-400 mt-1">- {routeName}</span>
                        </div>
                        <div className={`flex items-center space-x-1.5 ${statusStyle} px-3 py-1.5 rounded-md border`}>
                            <CheckCircle className="w-4 h-4 ml-1 mr-1" />
                            <span className="text-sm font-semibold capitalize tracking-wide pr-1">
                                {trip.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Start / End Points Label Row */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <div className="flex items-center space-x-1.5 mb-1.5 text-gray-500">
                                <Flag className="w-3.5 h-3.5 fill-current" />
                                <span className="text-xs font-semibold tracking-wide">Start point</span>
                            </div>
                            <h3 className="text-[17px] font-bold text-gray-900 mb-1">{startStopName}</h3>
                            <p className="text-xs font-medium text-gray-400">Departure: {formatTime(trip.scheduledStart)} - {formatDate(trip.scheduledStart)}</p>
                        </div>
                        <div>
                            <div className="flex items-center space-x-1.5 mb-1.5 text-gray-500">
                                <MapPin className="w-3.5 h-3.5 fill-current" />
                                <span className="text-xs font-semibold tracking-wide">End point</span>
                            </div>
                            <h3 className="text-[17px] font-bold text-gray-900 mb-1">{endStopName}</h3>
                            <p className="text-xs font-medium text-gray-400">Arrival (est.): {formatTime(trip.scheduledEnd)} - {formatDate(trip.scheduledEnd)}</p>
                        </div>
                    </div>

                    {/* Middle Grey Track Box */}
                    <div className="bg-[#F8F9FA] rounded-xl p-4 mb-6 mt-6 flex flex-col justify-center relative">
                        <div className="flex items-center justify-between z-10 w-full mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-slate-700 rounded-full bg-white flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                                </div>
                                <span className="font-bold text-slate-800 text-[15px]">{startStopName}</span>
                                <span className="text-xs text-gray-400 ml-1 mt-0.5">stop #01</span>
                            </div>
                            
                            <div className="flex-1 flex justify-center">
                                <div className="flex items-center space-x-2 text-gray-400">
                                   <Navigation className="w-3.5 h-3.5 transform fill-gray-400" />
                                   <span className="text-xs font-medium">via Direct Route</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Flag className="w-4 h-4 text-[#12B2E4] fill-[#12B2E4]" />
                                <span className="font-bold text-slate-800 text-[15px]">{endStopName}</span>
                                <span className="text-xs text-gray-400 ml-1 mt-0.5">stop #{String(totalStops).padStart(2, '0')}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1.5 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-semibold">
                                {Math.round((new Date(trip.scheduledEnd).getTime() - new Date(trip.scheduledStart).getTime()) / 60000)} min
                            </span>
                        </div>
                    </div>

                    {/* Asset Info Card Row */}
                    <div className="bg-[#F8F9FA] rounded-xl p-4 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Driver */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded bg-[#EBF5FF] flex items-center justify-center shrink-0 border border-blue-100">
                                <User className="w-5 h-5 text-[#12B2E4]" />
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-gray-900 leading-tight">{trip.driver?.fullName || 'Unassigned'}</p>
                                <p className="text-[11px] text-gray-500 font-medium mt-1">
                                    Driver ID: {trip.driverId?.substring(0,4)}
                                </p>
                            </div>
                        </div>

                        {/* Bus */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                <img src={busImage} alt="Bus" className="w-10 h-10 object-contain mix-blend-multiply" />
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-gray-900 leading-tight border-l border-gray-200 pl-3">
                                    {trip.bus?.plateNumber || 'N/A'}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium mt-1 border-l border-gray-200 pl-3">
                                    {trip.bus?.capacity || 42}-seater
                                </p>
                            </div>
                        </div>

                        {/* Shift / Schedule */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200 shrink-0 border-l border-gray-200 ml-4">
                                <Clock className="w-5 h-5 text-gray-900" />
                            </div>
                            <div className="pl-1">
                                <p className="text-[14px] font-bold text-gray-900 leading-tight">
                                    {trip.schedule?.scheduleName?.toLowerCase().includes('shift') ? trip.schedule?.scheduleName : 'Scheduled shift'}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium mt-1 whitespace-nowrap">
                                    {formatDate(trip.scheduledStart)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                        {(!trip.status || trip.status === 'scheduled' || trip.status === 'paused') && (
                            <button 
                                onClick={() => startMutation.mutate()}
                                className="flex items-center gap-1.5 px-6 py-2.5 rounded font-bold transition-colors bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                            >
                                <PlayCircle className="w-4 h-4" />
                                <span>Start the Trip</span>
                            </button>
                        )}
                        
                        {trip.status === 'in_progress' && (
                            <button 
                                onClick={() => endMutation.mutate()}
                                className="flex items-center gap-1.5 px-6 py-2.5 rounded font-bold transition-colors bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span>End the Trip</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* BOTTOM ROW - MAP & SEQUENCE STACK (UNIFIED WITH ROUTES) */}

                <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                                Live Trip Sequence Timeline
                            </h3>
                        </div>
                        <div className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-navy-700 px-3 py-1 rounded-full">
                            {sortedStops.length + 2} Total Locations
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto relative min-h-[160px] custom-scrollbar">
                        <div className="flex items-start justify-between min-w-full w-max px-6 pt-16 pb-8 relative z-10 text-center">
                            {/* START TERMINAL */}
                            <div className="flex flex-col items-center flex-1 min-w-[120px] max-w-[200px] shrink-0 relative group">
                                {/* SVG Arrow Connection */}
                                <div className="absolute top-[24px] -translate-y-1/2 left-[50%] right-[calc(-50%+28px)] flex items-center z-0">
                                    <div className="h-[3px] bg-slate-200 dark:bg-navy-700 flex-1"></div>
                                    <ChevronRight className="w-5 h-5 text-slate-200 dark:text-navy-700 -ml-2" strokeWidth={3} />
                                </div>
                                
                                <div className="relative z-10 w-12 h-12 rounded-full border-[3px] border-white dark:border-navy-800 bg-emerald-500 shadow-lg flex items-center justify-center mb-3 text-white font-bold text-xs">
                                    {formatTime(trip.scheduledStart)}
                                </div>
                                <div className="px-2 w-full">
                                    <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Departed</div>
                                    <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight bg-white dark:bg-navy-800 rounded p-1 shadow-sm border border-slate-100 dark:border-navy-700 mx-auto max-w-[120px]">
                                        {startTerminal?.terminalName}
                                    </div>
                                </div>
                            </div>

                            {/* STOPS */}
                            {sortedStops.length === 0 ? (
                                <div className="min-w-[200px] flex-1 flex items-center justify-center -mt-6">
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-navy-900 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-xl text-slate-500">
                                        <p className="text-xs font-semibold">No stops added yet</p>
                                    </div>
                                </div>
                            ) : (
                                sortedStops.map((rs: any, index: number) => {
                                    const estDate = new Date(trip.scheduledStart);
                                    estDate.setMinutes(estDate.getMinutes() + (index * 8));

                                    return (
                                        <div key={rs.id} className="flex flex-col items-center flex-1 min-w-[120px] max-w-[200px] shrink-0 relative group">
                                            {/* SVG Arrow Connection */}
                                            <div className="absolute top-[24px] -translate-y-1/2 left-[50%] right-[calc(-50%+28px)] flex items-center z-0">
                                                <div className="h-[3px] bg-slate-200 dark:bg-navy-700 flex-1"></div>
                                                <ChevronRight className="w-5 h-5 text-slate-200 dark:text-navy-700 -ml-2" strokeWidth={3} />
                                            </div>

                                            <div className="relative z-10 w-10 h-10 mt-1 mb-2 rounded-full border-[3px] border-white dark:border-navy-800 bg-cyan-500 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform text-white font-bold text-[10px]">
                                                {formatTime(estDate)}
                                            </div>
                                            <div className="px-2 w-full mt-1">
                                                <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight bg-white dark:bg-navy-800 rounded p-1 shadow-sm border border-slate-100 dark:border-navy-700 mx-auto w-full max-w-[130px]">
                                                    {rs.stop?.stopName}
                                                </div>
                                                <div className="mt-1 text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded inline-block truncate max-w-[100px]">
                                                    Stop #{rs.sequenceNumber}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* END TERMINAL */}
                            <div className="flex flex-col items-center flex-1 min-w-[120px] max-w-[200px] shrink-0 relative group">
                                <div className="relative z-10 w-12 h-12 rounded-full border-[3px] border-white dark:border-navy-800 bg-red-500 shadow-lg flex items-center justify-center mb-3 text-white font-bold text-xs">
                                    {formatTime(trip.scheduledEnd)}
                                </div>
                                <div className="px-2 w-full">
                                    <div className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5">Arrival (est.)</div>
                                    <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight bg-white dark:bg-navy-800 rounded p-1 shadow-sm border border-slate-100 dark:border-navy-700 mx-auto max-w-[120px]">
                                        {endTerminal?.terminalName}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden flex flex-col h-[550px]">
                    <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between bg-slate-50 dark:bg-navy-800">
                        <div className="flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Live Route Real-World Map</h3>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative z-0">
                        <MapContainer
                            center={mapCenter}
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Start Terminal */}
                            {startTerminal && (
                                <Marker position={[startLat, startLng]} icon={startIcon}>
                                    <Popup>
                                        <div className="text-sm font-bold">{startTerminal.terminalName}</div>
                                        <div className="text-xs text-slate-500">Start Terminal</div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* End Terminal */}
                            {endTerminal && (
                                <Marker position={[endLat, endLng]} icon={endIcon}>
                                    <Popup>
                                        <div className="text-sm font-bold">{endTerminal.terminalName}</div>
                                        <div className="text-xs text-slate-500">End Terminal</div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Stop Markers */}
                            {sortedStops.map((rs: any, idx: number) => {
                                if (!rs.stop?.latitude || !rs.stop?.longitude) return null;
                                return (
                                    <Marker
                                        key={rs.id}
                                        position={[Number(rs.stop.latitude), Number(rs.stop.longitude)]}
                                    >
                                        <Popup>
                                            <div className="text-sm font-bold">{rs.stop.stopName}</div>
                                            <div className="text-xs text-slate-500">Sequence: {rs.sequenceNumber}</div>
                                        </Popup>
                                    </Marker>
                                );
                            })}

                            {/* Route Path connecting exactly the terminals and stops in sequence */}
                            {startTerminal && endTerminal && (
                                <Polyline
                                    positions={[
                                        [startLat, startLng],
                                        ...sortedStops
                                            .filter((rs: any) => rs.stop?.latitude && rs.stop?.longitude)
                                            .map((rs: any) => [Number(rs.stop.latitude), Number(rs.stop.longitude)]),
                                        [endLat, endLng]
                                    ] as [number, number][]}
                                    color="#06b6d4"
                                    weight={4}
                                    opacity={0.7}
                                />
                            )}
                        </MapContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
