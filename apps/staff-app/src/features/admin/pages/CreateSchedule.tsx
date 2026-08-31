import { useState, useEffect } from 'react';
import { MapPin, CalendarDays, ArrowLeft, Save } from 'lucide-react';
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

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-navy-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard/schedules')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CalendarDays className="w-6 h-6 text-cyan-500" />
                                {isEditMode ? 'Edit Schedule' : 'Create New Schedule'}
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Define a recurring departure time for a route direction
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Route Selection Section */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-navy-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-cyan-500" />
                        Route & Direction
                    </h2>

                    <div className="space-y-5">
                        {/* Step 1: Route */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Route <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.routeId}
                                onChange={e => handleChange('routeId', e.target.value)}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.routeId ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                                disabled={routesLoading}
                            >
                                <option value="">{routesLoading ? 'Loading routes...' : '— Select Route —'}</option>
                                {(routes as any[]).map((r: any) => (
                                    <option key={r.id} value={r.id}>
                                        {r.routeName}{r.routeCode ? ` (${r.routeCode})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.routeId && <p className="mt-1.5 text-sm text-red-500">{errors.routeId}</p>}
                        </div>

                        {/* Step 2: Direction (Forward / Backward) */}
                        {formData.routeId && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Direction <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-6 py-4 rounded-xl border-2 transition-all ${formData.direction === 'forward' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-navy-700 hover:border-cyan-300'}`}>
                                        <input type="radio" name="direction" value="forward" checked={formData.direction === 'forward'} onChange={() => { handleChange('direction', 'forward'); handleChange('versionId', ''); }} className="accent-cyan-500" />
                                        <span className="text-base font-bold">→ Forward</span>
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-6 py-4 rounded-xl border-2 transition-all ${formData.direction === 'backward' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-navy-700 hover:border-cyan-300'}`}>
                                        <input type="radio" name="direction" value="backward" checked={formData.direction === 'backward'} onChange={() => { handleChange('direction', 'backward'); handleChange('versionId', ''); }} className="accent-cyan-500" />
                                        <span className="text-base font-bold">← Backward</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Route Version */}
                        {formData.routeId && formData.direction && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Select Version <span className="text-red-500">*</span>
                                </label>
                                {versionsLoading ? (
                                    <div className="text-sm text-slate-400 py-4 flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                        Loading versions…
                                    </div>
                                ) : allVersions.filter(v => v.direction === formData.direction).length === 0 ? (
                                    <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                                        ⚠ No {formData.direction} versions found for this route.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {allVersions.filter(v => v.direction === formData.direction).map((v: any) => {
                                            const firstStop = v.routeStops?.[0]?.stop?.stopName;
                                            const lastStop = v.routeStops?.[v.routeStops.length - 1]?.stop?.stopName;
                                            const label = v.direction === 'forward' ? 'Forward' : 'Backward';
                                            const dirLabel = firstStop && lastStop ? `${firstStop} → ${lastStop}` : `Version ${v.routeNumber || v.versionNumber || ''}`;
                                            return (
                                                <label
                                                    key={v.id}
                                                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.versionId === v.id
                                                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                                        : 'border-gray-200 dark:border-navy-700 hover:border-cyan-300'}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="versionId"
                                                        value={v.id}
                                                        checked={formData.versionId === v.id}
                                                        onChange={() => handleChange('versionId', v.id)}
                                                        className="mt-1 accent-cyan-500"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-base text-gray-900 dark:text-white">{label} - {v.routeName || `Version ${v.routeNumber}`}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{dirLabel}</p>
                                                        {!v.isActive && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">INACTIVE</span>}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                                {errors.versionId && <p className="mt-1.5 text-sm text-red-500">{errors.versionId}</p>}
                            </div>
                        )}

                        {/* Route Preview (stops) */}
                        {selectedVersion && stops.length > 0 && (
                            <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-5 border border-slate-200 dark:border-navy-700">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Route Stops Preview
                                </p>
                                <div className="space-y-0">
                                    {stops.map((rs: any, i: number) => (
                                        <div key={rs.id || i} className="flex items-center gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-4 h-4 rounded-full border-2 ${i === 0 || i === stops.length - 1 ? 'border-cyan-500 bg-cyan-500' : 'border-gray-400 bg-white dark:bg-navy-800'}`} />
                                                {i < stops.length - 1 && <div className="w-0.5 h-6 bg-gray-300 dark:bg-navy-600" />}
                                            </div>
                                            <p className="text-base text-gray-700 dark:text-gray-300 py-1.5 font-medium">
                                                {rs.stop?.stopName || `Stop ${i + 1}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Schedule Details Section */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-navy-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-cyan-500" />
                        Schedule Details
                    </h2>

                    <div className="space-y-5">
                        {/* Schedule Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Schedule Name <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.scheduleName}
                                onChange={e => handleChange('scheduleName', e.target.value)}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.scheduleName ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                            >
                                <option value="">— Select Schedule Name —</option>
                                <option value="Morning Peak Service">Morning Peak Service</option>
                                <option value="Mid-Day Service">Mid-Day Service</option>
                                <option value="Evening Peak Service">Evening Peak Service</option>
                                <option value="Night Service">Night Service</option>
                                <option value="Weekend Special">Weekend Special</option>
                                <option value="Standard Daily">Standard Daily</option>
                            </select>
                            {errors.scheduleName && <p className="mt-1.5 text-sm text-red-500">{errors.scheduleName}</p>}
                        </div>

                        {/* Days of Week */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                Days of Operation <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-3">
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
                                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selected
                                                ? 'bg-cyan-500 text-white border-cyan-500 shadow-md'
                                                : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-navy-600 hover:border-cyan-300'}`}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.dayOfWeek && <p className="mt-1.5 text-sm text-red-500">{errors.dayOfWeek}</p>}
                        </div>

                        {/* Departure Time */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Departure Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.departureTime}
                                onChange={e => handleChange('departureTime', e.target.value)}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.departureTime ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                            />
                            {errors.departureTime && <p className="mt-1.5 text-sm text-red-500">{errors.departureTime}</p>}
                        </div>

                        {/* Effective Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Effective From <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.effectiveFrom}
                                    onChange={e => handleChange('effectiveFrom', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white border border-gray-200 dark:border-navy-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Effective To <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.effectiveUntil}
                                    onChange={e => handleChange('effectiveUntil', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white border border-gray-200 dark:border-navy-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                {!formData.effectiveUntil && (
                                    <p className="text-sm text-slate-400 mt-1.5">No end date — schedule runs indefinitely</p>
                                )}
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
                            <input
                                type="checkbox"
                                id="isActiveSchedule"
                                checked={formData.isActive}
                                onChange={e => handleChange('isActive', e.target.checked)}
                                className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="isActiveSchedule" className="text-base font-medium text-gray-900 dark:text-gray-300 cursor-pointer flex-1">
                                Active Schedule
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-navy-700">
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/schedules')}
                            className="px-6 py-3 text-base 
                            font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800 border-2 border-gray-300 dark:border-navy-600 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                            className="px-6 py-3 text-base font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {createScheduleMutation.isPending || updateScheduleMutation.isPending
                                ? 'Saving...'
                                : isEditMode
                                    ? 'Update Schedule'
                                    : 'Create Schedule'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
