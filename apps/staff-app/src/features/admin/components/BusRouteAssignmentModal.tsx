import { useState, useEffect, useMemo } from 'react';
import { X, Bus, AlertTriangle, CheckCircle, MapPin, Route as RouteIcon, Info, ChevronRight, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { routeService } from '@/services/route.service';
import { busRouteAssignmentService } from '@/services/bus-route-assignment.service';

interface BusRouteAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssignmentFormData) => void;
    editData?: any;
}

export interface AssignmentFormData {
    busId: string;
    routeId: string;
    scheduleId: string;
    versionId: string;
    assignedDate: string;
    endDate?: string;
}

export function BusRouteAssignmentModal({ isOpen, onClose, onSubmit, editData }: BusRouteAssignmentModalProps) {
    const [formData, setFormData] = useState<AssignmentFormData & { direction: string }>({
        busId: '',
        routeId: '',
        direction: 'forward',
        versionId: '',
        scheduleId: '',
        assignedDate: new Date().toISOString().split('T')[0],
        endDate: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch routes
    const { data: routes = [], isLoading: routesLoading } = useQuery({
        queryKey: ['routes-for-route-assign'],
        queryFn: () => routeService.getAll(),
        enabled: isOpen,
    });

    // Fetch versions for selected route
    const { data: versionsData, isLoading: versionsLoading } = useQuery({
        queryKey: ['route-versions-assign', formData.routeId],
        queryFn: () => routeService.getVersions(formData.routeId),
        enabled: isOpen && !!formData.routeId,
    });

    // Fetch schedule availability (isAssigned + availableBuses)
    const { data: scheduleAvailability, isLoading: availabilityLoading } = useQuery({
        queryKey: ['schedule-availability', formData.scheduleId],
        queryFn: () => busRouteAssignmentService.checkScheduleAvailability(formData.scheduleId),
        enabled: isOpen && !!formData.scheduleId,
    });

    const allVersions: any[] = useMemo(() => {
        if (!versionsData) return [];
        return [
            ...(versionsData.forward || []).map((v: any) => ({ ...v, direction: 'forward' })),
            ...(versionsData.backward || []).map((v: any) => ({ ...v, direction: 'backward' }))
        ];
    }, [versionsData]);

    const directionalVersions = useMemo(() => {
        return allVersions.filter(v => v.direction === formData.direction);
    }, [allVersions, formData.direction]);

    const selectedVersion = useMemo(() => {
        return allVersions.find(v => v.id === formData.versionId);
    }, [allVersions, formData.versionId]);

    const schedules: any[] = selectedVersion?.schedules || [];

    const availableBuses: any[] = scheduleAvailability?.availableBuses || [];
    const scheduleIsBlocked = scheduleAvailability?.isAssigned ?? false;
    const blockingBus = scheduleAvailability?.assignedBus || null;

    useEffect(() => {
        if (editData) {
            setFormData({
                busId: editData.busId || '',
                routeId: editData.routeId || '',
                direction: 'forward',
                versionId: editData.versionId || '',
                scheduleId: editData.scheduleId || '',
                assignedDate: editData.assignedDate ? new Date(editData.assignedDate).toISOString().split('T')[0] : '',
                endDate: editData.endDate ? new Date(editData.endDate).toISOString().split('T')[0] : '',
            });
        } else {
            setFormData({
                busId: '',
                routeId: '',
                direction: 'forward',
                versionId: '',
                scheduleId: '',
                assignedDate: new Date().toISOString().split('T')[0],
                endDate: ''
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => {
            const next = { ...prev, [field]: value };
            if (field === 'routeId' || field === 'direction') {
                next.versionId = '';
                next.scheduleId = '';
                next.busId = '';
            } else if (field === 'versionId') {
                next.scheduleId = '';
                next.busId = '';
            } else if (field === 'scheduleId') {
                next.busId = '';
            }
            return next;
        });

        if (errors[field]) {
            setErrors(prev => {
                const n = { ...prev };
                delete n[field];
                return n;
            });
        }
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!formData.routeId) e.routeId = 'Please select a route';
        if (!formData.versionId) e.versionId = 'Please select a route version';
        if (!formData.scheduleId) e.scheduleId = 'Please select a schedule';
        if (!formData.busId) e.busId = 'Please select an available bus';
        if (!formData.assignedDate) e.assignedDate = 'Effective From date is required';
        if (formData.endDate && formData.assignedDate && new Date(formData.endDate) <= new Date(formData.assignedDate)) {
            e.endDate = 'End date must be after start date';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if (scheduleIsBlocked) return;

        onSubmit({
            ...formData,
            endDate: formData.endDate || undefined
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-navy-700 overflow-hidden">

                {/* Styled Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#2B4B9E] to-[#1E3678] text-white shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                            <Bus className="w-5 h-5 text-cyan-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-wide">
                                {editData ? 'Edit Bus-Route Assignment' : 'Assign Bus to Route'}
                            </h2>
                            <p className="text-xs text-cyan-100/80">Configure route version, schedule, and assign available vehicle</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">

                    {/* 1. Select Route */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                            1. Select Route <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.routeId}
                            onChange={e => handleChange('routeId', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.routeId ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                            disabled={routesLoading}
                        >
                            <option value="">{routesLoading ? 'Loading routes...' : '— Select Route —'}</option>
                            {(routes as any[]).map((r: any) => (
                                <option key={r.id} value={r.id}>
                                    {r.routeName} {r.routeCode ? `(${r.routeCode})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.routeId && <p className="mt-1 text-xs text-red-500">{errors.routeId}</p>}
                    </div>

                    {/* 2. Direction Switcher */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                            2. Direction <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled={!formData.routeId}
                                onClick={() => handleChange('direction', 'forward')}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    formData.direction === 'forward'
                                        ? 'border-cyan-500 bg-cyan-500 text-white shadow-md'
                                        : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:border-cyan-300 bg-slate-50 dark:bg-navy-800/60'
                                }`}
                            >
                                <span>Forward ↗</span>
                            </button>
                            <button
                                type="button"
                                disabled={!formData.routeId}
                                onClick={() => handleChange('direction', 'backward')}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    formData.direction === 'backward'
                                        ? 'border-cyan-500 bg-cyan-500 text-white shadow-md'
                                        : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:border-cyan-300 bg-slate-50 dark:bg-navy-800/60'
                                }`}
                            >
                                <span>Backward ↙</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Interactive Route Version Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                3. Route Version <span className="text-red-500">*</span>
                            </label>
                            {directionalVersions.length > 0 && (
                                <span className="text-xs text-slate-400 font-medium">
                                    {directionalVersions.length} {formData.direction} version(s) found
                                </span>
                            )}
                        </div>

                        {!formData.routeId ? (
                            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-800/40 text-center">
                                <RouteIcon className="w-6 h-6 text-slate-400 mx-auto mb-1 opacity-60" />
                                <p className="text-xs text-slate-500">Select a route first to load versions.</p>
                            </div>
                        ) : versionsLoading ? (
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-700 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                Loading versions...
                            </div>
                        ) : directionalVersions.length === 0 ? (
                            /* Empty State when version doesn't exist */
                            <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0 mt-0.5">
                                    <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                                        No {formData.direction.toUpperCase()} Version Available
                                    </h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                                        This route does not have an active <strong>{formData.direction}</strong> version configured yet.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('direction', formData.direction === 'forward' ? 'backward' : 'forward')}
                                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                                    >
                                        Switch to {formData.direction === 'forward' ? 'Backward ↙' : 'Forward ↗'} direction
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Visual Version Cards */
                            <div className="space-y-2.5">
                                {directionalVersions.map((v: any) => {
                                    const rs = v.routeStops || [];
                                    const firstStop = rs[0]?.stop?.stopName;
                                    const lastStop = rs[rs.length - 1]?.stop?.stopName;
                                    const pathText = firstStop && lastStop ? `${firstStop} → ${lastStop}` : null;
                                    const isSelected = formData.versionId === v.id;

                                    return (
                                        <div
                                            key={v.id}
                                            onClick={() => handleChange('versionId', v.id)}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/40 shadow-sm ring-1 ring-cyan-500'
                                                    : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800/80 hover:border-cyan-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 dark:border-navy-600'
                                                }`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                        {v.routeName || `Version ${v.routeNumber}`}
                                                    </p>
                                                    {pathText && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-cyan-500 inline shrink-0" />
                                                            {pathText}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300">
                                                    {rs.length} stops
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 uppercase">
                                                    V{v.routeNumber || v.versionNumber || '1'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {errors.versionId && <p className="mt-1 text-xs text-red-500">{errors.versionId}</p>}
                    </div>

                    {/* 4. Schedule Dropdown */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                            4. Schedule <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.scheduleId}
                            onChange={e => handleChange('scheduleId', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.scheduleId ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                            disabled={!formData.versionId}
                        >
                            <option value="">
                                {!formData.versionId
                                    ? 'Select a version first'
                                    : schedules.length === 0
                                    ? 'No active schedules for this version'
                                    : '— Select Schedule —'}
                            </option>
                            {schedules.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                    {s.departureTime?.substring(11, 16)} — {s.dayOfWeek?.charAt(0).toUpperCase() + s.dayOfWeek?.slice(1)} ({s.scheduleName})
                                </option>
                            ))}
                        </select>
                        {errors.scheduleId && <p className="mt-1 text-xs text-red-500">{errors.scheduleId}</p>}
                    </div>

                    {/* Schedule Availability Check */}
                    {formData.scheduleId && (
                        availabilityLoading ? (
                            <div className="text-xs text-slate-400 py-1 flex items-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                Checking schedule availability...
                            </div>
                        ) : scheduleIsBlocked && blockingBus ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400">Schedule Already Occupied</p>
                                    <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                                        Bus <strong>{blockingBus.plateNumber}</strong> is already assigned to this schedule.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>Schedule is available — {availableBuses.length} bus(es) eligible for assignment.</span>
                            </div>
                        )
                    )}

                    {/* 5. Select Bus */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                            5. Select Bus <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.busId}
                            onChange={e => handleChange('busId', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.busId ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                            disabled={!formData.scheduleId || scheduleIsBlocked || availabilityLoading || availableBuses.length === 0}
                        >
                            <option value="">
                                {!formData.scheduleId
                                    ? 'Select a schedule first'
                                    : scheduleIsBlocked
                                    ? 'Schedule unavailable'
                                    : availableBuses.length === 0
                                    ? 'No operational buses available'
                                    : '— Select Available Bus —'}
                            </option>
                            {availableBuses.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                    {b.plateNumber} — {b.model || 'Bus'} (Capacity: {b.capacity})
                                </option>
                            ))}
                        </select>
                        {errors.busId && <p className="mt-1 text-xs text-red-500">{errors.busId}</p>}
                    </div>

                    {/* 6. Effective Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                                Effective From <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.assignedDate}
                                onChange={e => handleChange('assignedDate', e.target.value)}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.assignedDate ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                            />
                            {errors.assignedDate && <p className="mt-1 text-xs text-red-500">{errors.assignedDate}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                                Effective To <span className="text-slate-400 font-normal lowercase">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={e => handleChange('endDate', e.target.value)}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.endDate ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                            />
                            {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-navy-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={scheduleIsBlocked}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {editData ? 'Update Assignment' : 'Assign Bus'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
