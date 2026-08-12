import { ArrowLeft, MapPin, Flag, Clock, User, PlayCircle, CheckCircle, Navigation } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import busImage from '@/assets/bus.jpeg';
import { tripService } from '@/services/trip.service';

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
    const stops = trip.version?.routeStops || [];
    
    const formatTime = (d: string | Date | undefined) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
    const formatDate = (d: string | Date | undefined) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date';

    const startStopName = route?.startStop?.stopName || 'Start Terminal';
    const endStopName = route?.endStop?.stopName || 'End Terminal';
    const routeName = route?.routeName || 'Unknown Route';
    const tripName = trip.id ? `SB _ ${trip.id.substring(0, 3)}` : 'SB _ 221';
    const totalStops = stops.length || 0;

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* LEFT COLUMN - MAIN DETAILS CARD */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
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
                    <div className="bg-[#F8F9FA] rounded-xl p-4 mb-8 grid grid-cols-3 gap-4">
                        {/* Driver */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded bg-[#EBF5FF] flex items-center justify-center shrink-0 border border-blue-100">
                                <User className="w-5 h-5 text-[#12B2E4]" />
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-gray-900 leading-tight">{trip.driver?.fullName || 'Unassigned'}</p>
                                <p className="text-[11px] text-gray-500 font-medium mt-1">
                                    Driver ID: {trip.driverId?.substring(0,4)} . 8 yrs exp.
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
                                    {trip.bus?.plateNumber || 'N/A'} . {trip.bus?.capacity || 42}-seater
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium mt-1 border-l border-gray-200 pl-3">
                                    SBTS electric . plate: {trip.bus?.plateNumber?.substring(0,7)}
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
                                    {trip.schedule?.scheduleName?.toLowerCase().includes('shift') ? trip.schedule?.scheduleName : 'Afternoon shift'}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium mt-1 whitespace-nowrap">
                                    {formatDate(trip.scheduledStart)} . {formatTime(trip.scheduledStart)} - {formatTime(trip.scheduledEnd)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Details Row */}
                    <div className="grid grid-cols-2 gap-4 pb-6 mb-2">
                        <div>
                            <span className="text-xs font-medium text-gray-400 block mb-1">Route line</span>
                            <h4 className="text-[14px] font-bold text-gray-800 mb-0.5">{routeName}</h4>
                            <p className="text-xs text-gray-500 font-medium">Distance: {stops.reduce((acc: number, val: any) => acc + Number(val.distanceKm || 0), 0).toFixed(1)} km . {stops.length} stops</p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-gray-400 block mb-1">Notes</span>
                            <h4 className="text-[14px] font-bold text-gray-800 mb-0.5">Regular express — no stops</h4>
                            <p className="text-xs text-gray-500 font-medium">Last updated: today 07:45</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-100">
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

                {/* RIGHT COLUMN - TIMELINE */}
                <div className="col-span-1 bg-white border-[3px] border-[#12B2E4] rounded relative">
                   {/* Header section with dashed line */}
                    <div className="border-b border-dashed border-[#12B2E4]">
                        <div className="flex items-center gap-2 w-max px-4 border-r border-dashed border-[#12B2E4] py-3">
                            <Clock className="w-6 h-6 text-black fill-white border border-black rounded-full p-0.5" strokeWidth={2.5} />
                            <h3 className="text-lg font-bold text-black tracking-tight">Trip timeline</h3>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-5">
                            
                            {/* Departure Start Node */}
                            <div className="flex items-center gap-4 text-sm relative">
                                <div className="w-[60px] text-[#12B2E4] font-bold">{formatTime(trip.scheduledStart)}</div>
                                <div className="flex flex-col items-center">
                                    <Flag className="w-3.5 h-3.5 text-[#12B2E4] fill-[#12B2E4] relative z-10" />
                                </div>
                                <div className="flex-1 font-medium text-black text-[13px]">
                                    Departed from {startStopName}
                                </div>
                            </div>

                            {/* Middle Stops Nodes */}
                            {stops.map((stopItem: any, index: number) => {
                                if (index === 0 || index === stops.length - 1) return null;
                                
                                const estDate = new Date(trip.scheduledStart);
                                estDate.setMinutes(estDate.getMinutes() + (index * 8));

                                return (
                                    <div key={stopItem.id} className="flex items-center gap-4 text-sm relative">
                                        <div className="w-[60px] text-[#12B2E4] font-bold">{formatTime(estDate)}</div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 bg-black rounded-full relative z-10 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="flex-1 font-medium text-black text-[13px]">
                                            Stop #{stopItem.sequenceNumber} . {stopItem.stop?.stopName} <span className="text-xs text-gray-500">({Math.floor(Math.random() * 8 + 1)} passengers)</span>
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="flex items-center gap-4 text-sm relative">
                                <div className="w-[60px] text-[#12B2E4] font-bold whitespace-nowrap">
                                    {formatTime(trip.scheduledEnd)} <span className="text-[#12B2E4] font-medium text-xs">(est.)</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Flag className="w-3.5 h-3.5 text-[#12B2E4] fill-[#12B2E4] relative z-10" />
                                </div>
                                <div className="flex-1 font-medium text-black text-[13px]">
                                    Arrival at {endStopName} (scheduled)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
