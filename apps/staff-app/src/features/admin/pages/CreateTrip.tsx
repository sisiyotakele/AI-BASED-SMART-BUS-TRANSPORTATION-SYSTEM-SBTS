import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '@/services/schedule.service';
import { tripService } from '@/services/trip.service';
import { routeService } from '@/services/route.service';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export function CreateTrip() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const todayStr = new Date().toISOString().split('T')[0];
    const [tripDate, setTripDate] = useState<string>(todayStr);
    const [routeId, setRouteId] = useState<string>('');
    const [scheduleId, setScheduleId] = useState<string>('');
    const [previewData, setPreviewData] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<string>('');

    // Fetch active routes
    const { data: routes = [], isLoading: routesLoading } = useQuery({
        queryKey: ['routes'],
        queryFn: () => routeService.getAll()
    });

    // Fetch active schedules
    const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
        queryKey: ['schedules-list'],
        queryFn: () => scheduleService.getAll(),
    });

    // Filter schedules by selected route
    const filteredSchedules = schedules.filter((s: any) => 
        (s.routeId === routeId) || (s.version?.routeId === routeId) || (s.route?.id === routeId)
    );

    // Fetch schedule resolution details whenever scheduleId or tripDate changes
    useEffect(() => {
        if (!scheduleId || !tripDate) {
            setPreviewData(null);
            setPreviewError('');
            return;
        }

        let isMounted = true;
        setLoadingPreview(true);
        setPreviewError('');

        tripService.previewSchedule(scheduleId, tripDate)
            .then(data => {
                if (isMounted) {
                    setPreviewData(data);
                }
            })
            .catch(err => {
                if (isMounted) {
                    setPreviewError(err.response?.data?.message || err.message || 'Failed to validate dispatch requirements');
                    setPreviewData(null);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoadingPreview(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [scheduleId, tripDate]);

    const createTripMutation = useMutation({
        mutationFn: (data: { scheduleId: string; tripDate: string }) => tripService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast.success('Trip generated and dispatched successfully');
            navigate('/dashboard/trips');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || err.message || 'Failed to create trip');
        }
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!scheduleId || !tripDate) {
            toast.error("Please configure all required fields first.");
            return;
        }
        if (!previewData?.isReady) {
            toast.error("Cannot execute: Dispatch validation failed.");
            return;
        }
        createTripMutation.mutate({ scheduleId, tripDate });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-navy-700 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/trips')}
                        className="p-2.5 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 rounded-xl transition-all text-slate-500 shadow-sm border border-slate-200 dark:border-navy-600 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Execute New Trip
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Materialize a precise trip sequence from an overarching operational schedule</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/trips')}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-all shadow-sm"
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!previewData?.isReady || createTripMutation.isPending}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 fill-current" />
                        {createTripMutation.isPending ? 'Generating...' : 'Create Trip'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-[2rem] shadow-xl border border-slate-200/60 dark:border-navy-700 overflow-hidden relative">
                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row">
                    
                    {/* LEFT COLUMN: Route & Constraints */}
                    <div className="lg:w-[40%] xl:w-1/3 p-8 lg:p-10 bg-slate-50/70 dark:bg-navy-800/50 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-navy-700/80">
                        <div className="mb-10">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Target Pipeline</h2>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Determine the transit route and exact operating timeline.</p>
                        </div>

                        <div className="space-y-8">
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 transition-colors group-focus-within:text-emerald-600">
                                    Parent Route
                                </label>
                                <select
                                    value={routeId}
                                    onChange={e => {
                                        setRouteId(e.target.value);
                                        setScheduleId(''); // reset schedule when route changes
                                    }}
                                    className={`w-full px-4 py-4 text-sm font-semibold bg-white hover:bg-slate-50 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-200 dark:border-navy-600 transition-shadow shadow-sm`}
                                    disabled={routesLoading}
                                >
                                    <option value="" disabled className="text-slate-400">{routesLoading ? 'Loading routes...' : '— Select Core Route —'}</option>
                                    {(routes as any[]).map((r: any) => (
                                        <option key={r.id} value={r.id} className="text-slate-900 dark:text-white">
                                            {r.routeName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <hr className="border-t-2 border-dashed border-slate-100 dark:border-navy-700/50" />

                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 transition-colors group-focus-within:text-emerald-600">
                                    Target Execution Date
                                </label>
                                <input
                                    type="date"
                                    value={tripDate}
                                    onChange={(e) => setTripDate(e.target.value)}
                                    className="w-full px-4 py-4 bg-white hover:bg-slate-50 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-200 dark:border-navy-600 transition-all text-sm font-semibold shadow-sm"
                                    required
                                />
                                <p className="text-[11px] font-medium text-slate-400 mt-3">
                                    The active horizon for resolving exact fleet allocations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Orchestration */}
                    <div className="lg:w-[60%] xl:w-2/3 p-8 lg:p-12 w-full bg-white dark:bg-navy-900 relative">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-100/30 dark:bg-cyan-900/10 rounded-full blur-3xl -z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
                        
                        <div className="mb-12 border-l-4 border-cyan-500 pl-4 py-1">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Assignment & Pre-Flight Analysis</h2>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Lock in the active matrix and automatically validate dispatch readiness requirements.</p>
                        </div>

                        <div className="space-y-10">
                            
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 transition-colors group-focus-within:text-cyan-600">
                                    Master Schedule Matrix
                                </label>
                                <select
                                    value={scheduleId}
                                    onChange={(e) => setScheduleId(e.target.value)}
                                    className="w-full px-4 py-4 bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-slate-200 dark:border-navy-700 transition-all text-sm font-semibold shadow-inner"
                                    required
                                    disabled={!routeId || schedulesLoading}
                                >
                                    <option value="" disabled className="text-slate-400">
                                        {!routeId ? 'Awaiting route selection...' : schedulesLoading ? 'Loading schedules...' : filteredSchedules.length === 0 ? 'No bound schedules found' : '— Select Execution Block —'}
                                    </option>
                                    {filteredSchedules.map((s: any) => {
                                        const rName = s.route?.routeName || s.routeName || 'Route';
                                        const dir = s.version?.direction === 'backward' ? 'Return' : 'Outbound';
                                        const dep = s.departureTime ? new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '06:00';
                                        return (
                                            <option key={s.id} value={s.id} className="text-slate-900 dark:text-white">
                                                {dep} — {rName} [{dir}]
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <hr className="border-t-2 border-dashed border-slate-100 dark:border-navy-700/50" />
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400 mb-5">
                                    Dispatch Integrity Metrics
                                </label>

                                {loadingPreview ? (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700">
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">Running Environmental Validations...</p>
                                    </div>
                                ) : previewError ? (
                                    <div className="p-5 bg-rose-50 dark:bg-rose-900/10 border-l-4 border-rose-500 rounded-r-xl text-rose-700 dark:text-rose-400 text-xs font-semibold shadow-sm">
                                        Pre-flight Intercept: {previewError}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className={`p-4 rounded-xl border ${previewData?.checks.busAssigned ? 'bg-cyan-50/30 border-cyan-200 dark:bg-cyan-900/10 dark:border-cyan-900/30' : 'bg-slate-50 dark:bg-navy-800/50 border-slate-200 dark:border-navy-700'}`}>
                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Fleet Vehicle</p>
                                                <p className={`text-sm font-bold ${previewData?.bus ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {previewData?.bus ? previewData.bus.plateNumber : 'Pending Schedule'}
                                                </p>
                                            </div>
                                            <div className={`p-4 rounded-xl border ${previewData?.checks.driverAssigned ? 'bg-cyan-50/30 border-cyan-200 dark:bg-cyan-900/10 dark:border-cyan-900/30' : 'bg-slate-50 dark:bg-navy-800/50 border-slate-200 dark:border-navy-700'}`}>
                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Operating Driver</p>
                                                <p className={`text-sm font-bold ${previewData?.driver ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {previewData?.driver ? previewData.driver.fullName : 'Pending Schedule'}
                                                </p>
                                            </div>
                                            <div className={`p-4 rounded-xl border ${previewData?.shift ? 'bg-cyan-50/30 border-cyan-200 dark:bg-cyan-900/10 dark:border-cyan-900/30' : 'bg-slate-50 dark:bg-navy-800/50 border-slate-200 dark:border-navy-700'}`}>
                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Shift Block</p>
                                                <p className={`text-sm font-bold text-mono ${previewData?.shift ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {previewData?.shift ? `${previewData.shift.shiftStart} — ${previewData.shift.shiftEnd}` : 'Pending Schedule'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Plaque */}
                                        <div className={`px-5 py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-xl border-l-4 shadow-sm ${previewData?.isReady ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-slate-50 dark:bg-navy-800/50 border-slate-300 dark:border-navy-700'}`}>
                                            <p className={`text-[11px] font-black uppercase tracking-widest leading-relaxed ${previewData?.isReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'} flex items-center gap-2.5`}>
                                                <span className={`w-2.5 h-2.5 rounded-full ${previewData?.isReady ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-400'}`}></span>
                                                {previewData?.validationMessage || 'AWAITING USER CONFIGURATION'}
                                            </p>
                                            <button
                                                type="submit"
                                                onClick={(e) => { 
                                                    // Ensure we don't trigger form submit twice if it's already a submit button,
                                                    // but just in case, we can rely on standard onSubmit handler logic implicitly.
                                                }}
                                                disabled={!previewData?.isReady || createTripMutation.isPending}
                                                className={`px-8 py-3 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 dark:bg-slate-800 rounded-xl transition-all ${!previewData?.isReady || createTripMutation.isPending ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:-translate-y-0.5'}`}
                                            >
                                                {createTripMutation.isPending ? 'GENERATING...' : 'CREATE TRIP'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
