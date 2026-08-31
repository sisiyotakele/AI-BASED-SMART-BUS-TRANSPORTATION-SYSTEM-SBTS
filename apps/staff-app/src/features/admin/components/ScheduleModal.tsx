import { useState, useEffect } from 'react';
import { X, MapPin, ChevronDown, RadioTower, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { routeService } from '@/services/route.service';
import { RouteSchedule } from '@/types';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    editData?: RouteSchedule | null;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ScheduleModal({ isOpen, onClose, onSubmit, editData }: ScheduleModalProps) {
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

    // Fetch all routes
    const { data: routes = [], isLoading: routesLoading } = useQuery({
        queryKey: ['routes-for-schedule'],
        queryFn: () => routeService.getAll(),
        enabled: isOpen,
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

    useEffect(() => {
        if (editData) {
            setFormData({
                routeId: editData.routeId || '',
                versionId: editData.versionId || '',
                scheduleName: editData.scheduleName || '',
                dayOfWeek: editData.dayOfWeek ? [editData.dayOfWeek.toLowerCase()] : ['monday'],
                departureTime: editData.departureTime || '',
                isActive: editData.isActive ?? true,
                effectiveFrom: editData.effectiveFrom ? new Date(editData.effectiveFrom).toISOString().split('T')[0] : '',
                effectiveUntil: editData.effectiveUntil ? new Date(editData.effectiveUntil).toISOString().split('T')[0] : '',
            });
        } else {
            setFormData({
                routeId: '', direction: 'forward', versionId: '', scheduleName: '',
                dayOfWeek: ['monday'], departureTime: '',
                isActive: true, effectiveFrom: '', effectiveUntil: '',
            });
            setSelectedRoute(null);
            setSelectedVersion(null);
        }
        setErrors({});
    }, [editData, isOpen]);

    // Update selected route
    useEffect(() => {
        if (formData.routeId && routes.length) {
            const r = routes.find((ro: any) => ro.id === formData.routeId);
            setSelectedRoute(r || null);
            setFormData((prev: any) => ({ ...prev, versionId: '', direction: 'forward' }));
            setSelectedVersion(null);
        }
    }, [formData.routeId, routes]);

    // Update selected version
    useEffect(() => {
        if (formData.versionId && allVersions.length) {
            const v = allVersions.find(v => v.id === formData.versionId);
            setSelectedVersion(v || null);
        }
    }, [formData.versionId, allVersions]);

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
        onSubmit({
            ...formData,
            effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).toISOString() : undefined,
            effectiveUntil: formData.effectiveUntil ? new Date(formData.effectiveUntil).toISOString() : undefined,
        });
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    };

    // Build stops preview from selected version
    const stops: any[] = selectedVersion?.routeStops
        ? [...selectedVersion.routeStops].sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber)
        : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto flex flex-col border border-slate-200 dark:border-navy-700">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-900 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-cyan-500" />
                            {editData ? 'Edit Schedule' : 'Create Schedule'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Define a recurring departure time for a route direction</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-navy-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Step 1: Route */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Route <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.routeId}
                            onChange={e => handleChange('routeId', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.routeId ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                            disabled={routesLoading}
                        >
                            <option value="">{routesLoading ? 'Loading routes...' : '— Select Route —'}</option>
                            {(routes as any[]).map((r: any) => (
                                <option key={r.id} value={r.id}>
                                    {r.routeName}{r.routeCode ? ` (${r.routeCode})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.routeId && <p className="mt-1 text-xs text-red-500">{errors.routeId}</p>}
                    </div>

                    {/* Step 2: Direction (Forward / Backward) */}
                    {formData.routeId && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Direction <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4 p-1">
                                <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border transition-all ${formData.direction === 'forward' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-navy-700 hover:border-cyan-300'}`}>
                                    <input type="radio" name="direction" value="forward" checked={formData.direction === 'forward'} onChange={() => { handleChange('direction', 'forward'); handleChange('versionId', ''); }} className="accent-cyan-500" />
                                    <span className="text-sm font-bold">Forward</span>
                                </label>
                                <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border transition-all ${formData.direction === 'backward' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-navy-700 hover:border-cyan-300'}`}>
                                    <input type="radio" name="direction" value="backward" checked={formData.direction === 'backward'} onChange={() => { handleChange('direction', 'backward'); handleChange('versionId', ''); }} className="accent-cyan-500" />
                                    <span className="text-sm font-bold">Backward</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Route Version (cascades from Route + Direction) */}
                    {formData.routeId && formData.direction && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Select Version <span className="text-red-500">*</span>
                            </label>
                            {versionsLoading ? (
                                <div className="text-sm text-slate-400 py-2 flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    Loading versions…
                                </div>
                            ) : allVersions.filter(v => v.direction === formData.direction).length === 0 ? (
                                <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                                    ⚠ No {formData.direction} versions found for this route.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {allVersions.filter(v => v.direction === formData.direction).map((v: any) => {
                                        const firstStop = v.routeStops?.[0]?.stop?.stopName;
                                        const lastStop = v.routeStops?.[v.routeStops.length - 1]?.stop?.stopName;
                                        const label = v.direction === 'forward' ? 'Forward' : 'Backward';
                                        const dirLabel = firstStop && lastStop ? `${firstStop} → ${lastStop}` : `Version ${v.routeNumber || v.versionNumber || ''}`;
                                        return (
                                            <label
                                                key={v.id}
                                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.versionId === v.id
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
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{label} - {v.routeName || `Version ${v.routeNumber}`}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{dirLabel}</p>
                                                    {!v.isActive && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">INACTIVE</span>}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            {errors.versionId && <p className="mt-1 text-xs text-red-500">{errors.versionId}</p>}
                        </div>
                    )}

                    {/* Step 3: Route Preview (stops) */}
                    {selectedVersion && stops.length > 0 && (
                        <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" /> Route Preview
                            </p>
                            <div className="space-y-0">
                                {stops.map((rs: any, i: number) => (
                                    <div key={rs.id || i} className="flex items-center gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full border-2 ${i === 0 || i === stops.length - 1 ? 'border-cyan-500 bg-cyan-500' : 'border-gray-400 bg-white dark:bg-navy-800'}`} />
                                            {i < stops.length - 1 && <div className="w-0.5 h-5 bg-gray-300 dark:bg-navy-600" />}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 py-1 font-medium">
                                            {rs.stop?.stopName || `Stop ${i + 1}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Schedule Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Schedule Name <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.scheduleName}
                            onChange={e => handleChange('scheduleName', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.scheduleName ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                        >
                            <option value="">— Select Schedule Name —</option>
                            <option value="Morning Peak Service">Morning Peak Service</option>
                            <option value="Mid-Day Service">Mid-Day Service</option>
                            <option value="Evening Peak Service">Evening Peak Service</option>
                            <option value="Night Service">Night Service</option>
                            <option value="Weekend Special">Weekend Special</option>
                            <option value="Standard Daily">Standard Daily</option>
                        </select>
                        {errors.scheduleName && <p className="mt-1 text-xs text-red-500">{errors.scheduleName}</p>}
                    </div>

                    {/* Days of Week */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Days of Operation <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
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
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selected
                                            ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                                            : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-navy-600 hover:border-cyan-300'}`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.dayOfWeek && <p className="mt-1 text-xs text-red-500">{errors.dayOfWeek}</p>}
                    </div>

                    {/* Departure Time */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Departure Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={formData.departureTime}
                            onChange={e => handleChange('departureTime', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.departureTime ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                        />
                        {errors.departureTime && <p className="mt-1 text-xs text-red-500">{errors.departureTime}</p>}
                    </div>

                    {/* Effective Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Effective From <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveFrom}
                                onChange={e => handleChange('effectiveFrom', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white border border-gray-200 dark:border-navy-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Effective To <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveUntil}
                                onChange={e => handleChange('effectiveUntil', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white border border-gray-200 dark:border-navy-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {!formData.effectiveUntil && (
                                <p className="text-xs text-slate-400 mt-1">No end date — schedule runs indefinitely</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isActiveSchedule" checked={formData.isActive}
                            onChange={e => handleChange('isActive', e.target.checked)}
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded" />
                        <label htmlFor="isActiveSchedule" className="text-sm font-medium text-gray-900 dark:text-gray-300">Active Schedule</label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-navy-700">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800 border border-gray-300 dark:border-navy-600 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit"
                            className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">
                            {editData ? 'Update Schedule' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
