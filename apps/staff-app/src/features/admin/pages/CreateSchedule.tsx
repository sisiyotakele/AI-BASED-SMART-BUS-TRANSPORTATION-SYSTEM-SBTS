import { useState, useEffect } from 'react';
import { MapPin, CalendarDays, ArrowLeft, Save, ChevronUp, ChevronDown, Clock, Route, Check, CalendarRange } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routeService } from '@/services/route.service';
import { scheduleService } from '@/services/schedule.service';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CreateSchedule() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const scheduleId = searchParams.get('id');
    const isEditMode = !!scheduleId;

    const [formData, setFormData] = useState<any>({
        routeId: '',
        direction: 'forward',
        versionId: '',
        scheduleName: '',
        dayOfWeek: ['monday'],
        departureTime: '',
        isActive: true,
        effectiveFrom: '',
        effectiveUntil: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [selectedVersion, setSelectedVersion] = useState<any>(null);

    // Fetch schedule for editing
    const { data: editSchedule } = useQuery({
        queryKey: ['schedule', scheduleId],
        queryFn: () => scheduleService.getById(scheduleId!),
        enabled: isEditMode,
    });

    // Fetch all routes
    const { data: routes = [], isLoading: routesLoading } = useQuery({
        queryKey: ['routes-for-schedule'],
        queryFn: () => routeService.getAll(),
    });

    // Fetch versions when route is selected
    const { data: versionsData, isLoading: versionsLoading } = useQuery({
        queryKey: ['route-versions', formData.routeId],
        queryFn: () => routeService.getVersions(formData.routeId),
        enabled: !!formData.routeId,
    });

    const allVersions: any[] = versionsData
        ? [
            ...(versionsData.forward || []).map((v: any) => ({ ...v, direction: 'forward' })),
            ...(versionsData.backward || []).map((v: any) => ({ ...v, direction: 'backward' }))
        ]
        : [];

    // Load edit data
    useEffect(() => {
        if (editSchedule) {
            setFormData({
                routeId: editSchedule.routeId || '',
                versionId: editSchedule.versionId || '',
                scheduleName: editSchedule.scheduleName || '',
                dayOfWeek: editSchedule.dayOfWeek ? [editSchedule.dayOfWeek.toLowerCase()] : ['monday'],
                departureTime: editSchedule.departureTime || '',
                isActive: editSchedule.isActive ?? true,
                effectiveFrom: editSchedule.effectiveFrom ? new Date(editSchedule.effectiveFrom).toISOString().split('T')[0] : '',
                effectiveUntil: editSchedule.effectiveUntil ? new Date(editSchedule.effectiveUntil).toISOString().split('T')[0] : '',
            });
        }
    }, [editSchedule]);

    // Update selected route
    useEffect(() => {
        if (formData.routeId && routes.length) {
            const r = routes.find((ro: any) => ro.id === formData.routeId);
            setSelectedRoute(r || null);
            if (!isEditMode) {
                setFormData((prev: any) => ({ ...prev, versionId: '', direction: 'forward' }));
                setSelectedVersion(null);
            }
        }
    }, [formData.routeId, routes, isEditMode]);

    // Update selected version
    useEffect(() => {
        if (formData.versionId && allVersions.length) {
            const v = allVersions.find(v => v.id === formData.versionId);
            setSelectedVersion(v || null);
            if (v) {
                setFormData((prev: any) => ({ ...prev, direction: v.direction }));
            }
        }
    }, [formData.versionId, allVersions]);

    const createScheduleMutation = useMutation({
        mutationFn: async (data: any) => {
            if (Array.isArray(data.dayOfWeek)) {
                const promises = data.dayOfWeek.map((day: string) => scheduleService.create({ ...data, dayOfWeek: day }));
                await Promise.all(promises);
            } else {
                await scheduleService.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast.success('Schedule(s) created successfully!');
            navigate('/dashboard/schedules');
        },
        onError: () => toast.error('Failed to create schedule(s)')
    });

    const updateScheduleMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => {
            const finalData = { ...data };
            if (Array.isArray(finalData.dayOfWeek)) {
                finalData.dayOfWeek = finalData.dayOfWeek[0];
            }
            return scheduleService.update(id, finalData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast.success('Schedule updated successfully!');
            navigate('/dashboard/schedules');
        },
        onError: () => toast.error('Failed to update schedule')
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.scheduleName.trim()) newErrors.scheduleName = 'Schedule name is required';
        if (!formData.routeId) newErrors.routeId = 'Route is required';
        if (!formData.versionId) newErrors.versionId = 'Direction / version is required';
        if (!formData.dayOfWeek || formData.dayOfWeek.length === 0) newErrors.dayOfWeek = 'Select at least one day';
        if (!formData.departureTime) newErrors.departureTime = 'Departure time is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const submitData = {
            ...formData,
            effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).toISOString() : undefined,
            effectiveUntil: formData.effectiveUntil ? new Date(formData.effectiveUntil).toISOString() : undefined,
        };

        if (isEditMode && scheduleId) {
            updateScheduleMutation.mutate({ id: scheduleId, data: submitData });
        } else {
            createScheduleMutation.mutate(submitData);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    };

    // Build stops preview from selected version
    const stops: any[] = selectedVersion?.routeStops
        ? [...selectedVersion.routeStops].sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber)
        : [];

    // --- Compact Time Picker Logic ---
    const parseTime = (time24: string) => {
        if (!time24) return { h: '07', m: '00', p: 'AM' };
        const [H, M] = time24.split(':');
        const hNum = parseInt(H, 10);
        const p = hNum >= 12 ? 'PM' : 'AM';
        let h12 = hNum % 12;
        if (h12 === 0) h12 = 12;
        return { h: h12.toString().padStart(2, '0'), m: M, p };
    };

    const handleTimeChange = (type: 'h' | 'm' | 'p', val: string) => {
        const curr = parseTime(formData.departureTime);
        curr[type] = val;
        let H = parseInt(curr.h, 10);
        if (curr.p === 'PM' && H !== 12) H += 12;
        if (curr.p === 'AM' && H === 12) H = 0;
        const newTime24 = `${H.toString().padStart(2, '0')}:${curr.m}`;
        handleChange('departureTime', newTime24);
    };

    const handleTimeScroll = (type: 'h' | 'm', dir: 1 | -1) => {
        const curr = parseTime(formData.departureTime);
        if (type === 'h') {
            let h = parseInt(curr.h, 10) + dir;
            if (h > 12) h = 1;
            if (h < 1) h = 12;
            handleTimeChange('h', h.toString().padStart(2, '0'));
        } else {
            let m = parseInt(curr.m, 10) + dir;
            if (m > 59) m = 0;
            if (m < 0) m = 59;
            handleTimeChange('m', m.toString().padStart(2, '0'));
        }
    };

    const initialTime = parseTime(formData.departureTime);

    return (
        <div className="space-y-6">
            {/* Minimal Premium Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-navy-700 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/schedules')}
                        className="p-2.5 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 rounded-xl transition-all text-slate-500 shadow-sm border border-slate-200 dark:border-navy-600 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {isEditMode ? 'Edit Schedule configurations' : 'New Schedule definition'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/schedules')}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-all shadow-sm"
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {createScheduleMutation.isPending || updateScheduleMutation.isPending
                            ? 'Processing...'
                            : isEditMode ? 'Save Changes' : 'Create Schedule'}
                    </button>
                </div>
            </div>

            {/* Master Form Card */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-navy-700 overflow-hidden relative">
                {/* Top decorative line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                
                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row">

                    {/* LEFT COLUMN: Route & Direction */}
                    <div className="lg:w-1/3 p-6 lg:p-8 bg-slate-50/80 dark:bg-navy-800/50 border-b lg:border-b-0 lg:border-r border-slate-200/70 dark:border-navy-700/80 relative overflow-hidden">
                        {/* Decorative background circle */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100/40 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
                        
                        <div className="mb-8 relative z-10">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Route Selection</h2>
                            <p className="text-[11px] text-slate-500 mt-1">Determine path trajectory</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                    Operating Route
                                </label>
                                <select
                                    value={formData.routeId}
                                    onChange={e => handleChange('routeId', e.target.value)}
                                    className={`w-full px-3 py-2.5 bg-white dark:bg-navy-800 text-sm text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${errors.routeId ? 'border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                    disabled={routesLoading}
                                >
                                    <option value="">{routesLoading ? 'Loading...' : 'Select a route...'}</option>
                                    {(routes as any[]).map((r: any) => (
                                        <option key={r.id} value={r.id}>
                                            {r.routeName}
                                        </option>
                                    ))}
                                </select>
                                {errors.routeId && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.routeId}</p>}
                            </div>

                            {formData.routeId && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                        Travel Direction
                                    </label>
                                    <div className="flex p-1 bg-slate-200/50 dark:bg-navy-900 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => { handleChange('direction', 'forward'); handleChange('versionId', ''); }}
                                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${formData.direction === 'forward' ? 'bg-white dark:bg-navy-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            Forward
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { handleChange('direction', 'backward'); handleChange('versionId', ''); }}
                                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${formData.direction === 'backward' ? 'bg-white dark:bg-navy-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            Backward
                                        </button>
                                    </div>
                                </div>
                            )}

                            {formData.routeId && formData.direction && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                        Route Version
                                    </label>
                                    {versionsLoading ? (
                                        <p className="text-sm text-slate-500 italic">Loading versions...</p>
                                    ) : allVersions.filter(v => v.direction === formData.direction).length === 0 ? (
                                        <p className="text-sm text-amber-600">No versions configured.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {allVersions.filter(v => v.direction === formData.direction).map((v: any) => {
                                                const firstStop = v.routeStops?.[0]?.stop?.stopName || 'Start';
                                                const lastStop = v.routeStops?.[v.routeStops.length - 1]?.stop?.stopName || 'End';
                                                return (
                                                    <label
                                                        key={v.id}
                                                        className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.versionId === v.id
                                                            ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm'
                                                            : 'border-slate-200 dark:border-navy-600 hover:border-blue-300 dark:hover:border-blue-500/50 bg-white dark:bg-navy-800 hover:shadow-sm'}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="versionId"
                                                            value={v.id}
                                                            checked={formData.versionId === v.id}
                                                            onChange={() => handleChange('versionId', v.id)}
                                                            className="sr-only"
                                                        />
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${formData.versionId === v.id ? 'border-blue-500' : 'border-slate-300 dark:border-navy-500'}`}>
                                                                {formData.versionId === v.id && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">Version {v.routeNumber || v.versionNumber || ''}</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{firstStop} to {lastStop}</p>
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {errors.versionId && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.versionId}</p>}
                                </div>
                            )}

                            {/* Route Preview (stops) */}
                            {selectedVersion && stops.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-navy-700">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Stop Sequence</p>
                                    <div className="space-y-1 pl-1">
                                        {stops.map((rs: any, i: number) => (
                                            <div key={rs.id || i} className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === 0 || i === stops.length - 1 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                    {i < stops.length - 1 && <div className="w-px h-full bg-slate-200 dark:bg-navy-600 my-1" />}
                                                </div>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 py-1 font-medium">
                                                    {rs.stop?.stopName || `Stop ${i + 1}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Schedule Timing */}
                    <div className="lg:w-2/3 p-6 lg:p-10 relative z-10 w-full overflow-hidden">
                        {/* Decorative background circle */}
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/30 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="mb-10 flex justify-between items-center bg-slate-50 dark:bg-navy-800 p-4 rounded-2xl border border-slate-100 dark:border-navy-700">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Timing Configuration</h2>
                                <p className="text-[11px] text-slate-500 mt-1">Fine-tune deployment metrics</p>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <span className={`text-xs font-semibold uppercase tracking-widest ${formData.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                    {formData.isActive ? 'Active Schedule' : 'Inactive'}
                                </span>
                                <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200 dark:bg-navy-700 border border-slate-300 dark:border-navy-600 shadow-inner group-hover:border-slate-400 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => handleChange('isActive', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-6 peer-checked:bg-emerald-400 shadow-sm flex items-center justify-center">
                                        {formData.isActive && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className={`absolute inset-0 bg-emerald-500 transition-opacity rounded-full ${formData.isActive ? 'opacity-100' : 'opacity-0'} -z-10`} />
                                </div>
                            </label>
                        </div>

                        <div className="max-w-xl space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                        Schedule Label
                                    </label>
                                    <select
                                        value={formData.scheduleName}
                                        onChange={e => handleChange('scheduleName', e.target.value)}
                                        className={`w-full px-4 py-2.5 text-sm bg-white dark:bg-navy-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${errors.scheduleName ? 'border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                    >
                                        <option value="">Select label...</option>
                                        <option value="Morning Peak Service">Morning Peak</option>
                                        <option value="Mid-Day Service">Mid-Day</option>
                                        <option value="Evening Peak Service">Evening Peak</option>
                                        <option value="Night Service">Night</option>
                                        <option value="Weekend Special">Weekend Special</option>
                                        <option value="Standard Daily">Standard Daily</option>
                                    </select>
                                    {errors.scheduleName && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.scheduleName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                        Departure Time
                                    </label>
                                    <div className={`flex items-stretch bg-white dark:bg-navy-800 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 border overflow-hidden ${errors.departureTime ? 'border-red-500 focus-within:border-red-500' : 'border-slate-300 dark:border-navy-600 focus-within:border-blue-500'}`}>
                                        <div className="flex items-center justify-center pl-3 pr-2 text-slate-400 bg-slate-50 dark:bg-navy-900 border-r border-slate-200 dark:border-navy-700">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        
                                        <div className="flex flex-1 items-center justify-center p-1 font-mono text-lg font-bold text-slate-700 dark:text-slate-200">
                                            {/* Hours */}
                                            <div className="flex flex-col items-center group/h relative w-12">
                                                <button type="button" onClick={() => handleTimeScroll('h', 1)} className="text-slate-300 hover:text-blue-500 absolute -top-3 opacity-0 group-hover/h:opacity-100 transition-opacity"><ChevronUp className="w-4 h-4" /></button>
                                                <input 
                                                    type="number" 
                                                    value={initialTime.h} 
                                                    onChange={e => handleTimeChange('h', e.target.value.padStart(2, '0'))}
                                                    min="1" max="12"
                                                    className="w-full text-center bg-transparent border-none focus:ring-0 p-1 rounded hover:bg-slate-50 dark:hover:bg-navy-700 appearance-none m-0"
                                                />
                                                <button type="button" onClick={() => handleTimeScroll('h', -1)} className="text-slate-300 hover:text-blue-500 absolute -bottom-3 opacity-0 group-hover/h:opacity-100 transition-opacity"><ChevronDown className="w-4 h-4" /></button>
                                            </div>
                                            <span className="text-slate-300 mx-1">:</span>
                                            {/* Minutes */}
                                            <div className="flex flex-col items-center group/m relative w-12">
                                                <button type="button" onClick={() => handleTimeScroll('m', 1)} className="text-slate-300 hover:text-blue-500 absolute -top-3 opacity-0 group-hover/m:opacity-100 transition-opacity"><ChevronUp className="w-4 h-4" /></button>
                                                <input 
                                                    type="number" 
                                                    value={initialTime.m} 
                                                    onChange={e => handleTimeChange('m', e.target.value.padStart(2, '0'))}
                                                    min="0" max="59"
                                                    className="w-full text-center bg-transparent border-none focus:ring-0 p-1 rounded hover:bg-slate-50 dark:hover:bg-navy-700 appearance-none m-0"
                                                />
                                                <button type="button" onClick={() => handleTimeScroll('m', -1)} className="text-slate-300 hover:text-blue-500 absolute -bottom-3 opacity-0 group-hover/m:opacity-100 transition-opacity"><ChevronDown className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col border-l border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-900 w-12 text-[10px] font-bold">
                                            <button 
                                                type="button" 
                                                onClick={() => handleTimeChange('p', 'AM')}
                                                className={`flex-1 transition-colors ${initialTime.p === 'AM' ? 'bg-blue-600 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800'}`}
                                            >AM</button>
                                            <div className="h-px bg-slate-200 dark:bg-navy-700 w-full" />
                                            <button 
                                                type="button" 
                                                onClick={() => handleTimeChange('p', 'PM')}
                                                className={`flex-1 transition-colors ${initialTime.p === 'PM' ? 'bg-blue-600 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800'}`}
                                            >PM</button>
                                        </div>
                                    </div>
                                    {errors.departureTime && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.departureTime}</p>}
                                </div>
                            </div>

                            <div className="pt-2">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-navy-700/50 pb-2">
                                    Operational Execution Days
                                </h3>
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                    {daysOfWeek.map(day => {
                                        const lower = day.toLowerCase();
                                        const selected = formData.dayOfWeek.includes(lower);
                                        return (
                                            <button
                                                type="button"
                                                key={lower}
                                                onClick={() => {
                                                    const next = selected
                                                        ? formData.dayOfWeek.filter((d: string) => d !== lower)
                                                        : [...formData.dayOfWeek, lower];
                                                    handleChange('dayOfWeek', next);
                                                }}
                                                className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all border ${selected
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                                    : 'bg-white dark:bg-navy-800 text-slate-500 border-slate-200 dark:border-navy-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-navy-700'}`}
                                            >
                                                <span className="text-[11px] uppercase tracking-widest font-bold">
                                                    {day.slice(0, 3)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.dayOfWeek && <p className="mt-2 text-xs text-red-500 font-medium">{errors.dayOfWeek}</p>}
                            </div>

                            <div className="pt-2">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-navy-700/50 pb-2">
                                    Validity Horizon <span className="text-slate-400 font-normal text-[11px] uppercase ml-1">(Optional)</span>
                                </h3>
                                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 dark:bg-navy-800/30 p-4 rounded-2xl border border-slate-100 dark:border-navy-700/50">
                                    <div className="flex-1 w-full relative">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Launch Config</p>
                                        <input
                                            type="date"
                                            value={formData.effectiveFrom}
                                            onChange={e => handleChange('effectiveFrom', e.target.value)}
                                            className="w-full pl-3 pr-10 py-2.5 text-sm font-semibold bg-white dark:bg-navy-800 text-slate-900 dark:text-white border border-slate-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow outline-none"
                                        />
                                    </div>
                                    <div className="hidden sm:block pt-5 text-slate-300 dark:text-slate-600">→</div>
                                    <div className="flex-1 w-full relative">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Expire Config</p>
                                        <input
                                            type="date"
                                            value={formData.effectiveUntil}
                                            onChange={e => handleChange('effectiveUntil', e.target.value)}
                                            className="w-full pl-3 pr-10 py-2.5 text-sm font-semibold bg-white dark:bg-navy-800 text-slate-900 dark:text-white border border-slate-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow outline-none"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3 text-center italic">
                                    If left blank, this schedule will execute in perpetuity.
                                </p>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
