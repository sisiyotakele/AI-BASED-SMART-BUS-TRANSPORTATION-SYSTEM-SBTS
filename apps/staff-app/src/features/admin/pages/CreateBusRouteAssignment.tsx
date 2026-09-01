import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { routeService } from '@/services/route.service';
import { busRouteAssignmentService } from '@/services/bus-route-assignment.service';

export interface AssignmentFormData {
    busId: string;
    routeId: string;
    scheduleId: string;
    versionId: string;
    assignedDate: string;
    endDate?: string;
}

export function CreateBusRouteAssignment() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const editData = location.state?.editData || null;
    const isEditMode = !!editData;

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
        }
    }, [editData]);

    // Fetch routes
    const { data: routes = [], isLoading: routesLoading } = useQuery({
        queryKey: ['routes-for-route-assign'],
        queryFn: () => routeService.getAll(),
    });

    // Fetch versions for selected route
    const { data: versionsData, isLoading: versionsLoading } = useQuery({
        queryKey: ['route-versions-assign', formData.routeId],
        queryFn: () => routeService.getVersions(formData.routeId),
        enabled: !!formData.routeId,
    });

    // Fetch schedule availability (isAssigned + availableBuses)
    const { data: scheduleAvailability, isLoading: availabilityLoading } = useQuery({
        queryKey: ['schedule-availability', formData.scheduleId],
        queryFn: () => busRouteAssignmentService.checkScheduleAvailability(formData.scheduleId),
        enabled: !!formData.scheduleId,
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

    const blockingBus = scheduleAvailability?.assignedBus || null;
    const scheduleIsBlocked = scheduleAvailability?.isAssigned && (!isEditMode || blockingBus?.id !== editData?.busId);

    let availableBuses: any[] = scheduleAvailability?.availableBuses ? [...scheduleAvailability.availableBuses] : [];

    // In edit mode, the backend globally excludes all assigned buses.
    // We need to inject the currently assigned bus back into the dropdown list so it remains selected.
    if (isEditMode && editData?.busId && !availableBuses.find(b => b.id === editData.busId)) {
        availableBuses = [
            { id: editData.busId, plateNumber: editData.busPlate || 'Current Bus', capacity: '-', model: 'Currently Assigned' },
            ...availableBuses
        ];
    }

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

    const createMutation = useMutation({
        mutationFn: (data: any) => busRouteAssignmentService.createAssignment(data),
        onSuccess: () => {
            toast.success('Assignment created successfully');
            navigate('/dashboard/bus-route-assignments');
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create assignment'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, payload: any }) => busRouteAssignmentService.updateAssignment(data.id, data.payload),
        onSuccess: () => {
            toast.success('Assignment updated successfully');
            navigate('/dashboard/bus-route-assignments');
        },
        onError: () => toast.error('Failed to update assignment'),
    });


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if (scheduleIsBlocked) return;

        const payload = {
            ...formData,
            endDate: formData.endDate || undefined
        };

        if (isEditMode) {
            updateMutation.mutate({ id: editData.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-navy-700 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/bus-route-assignments')}
                        className="p-2.5 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 rounded-xl transition-all text-slate-500 shadow-sm border border-slate-200 dark:border-navy-600 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {isEditMode ? 'Edit Bus Assignment' : 'New Bus Assignment'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Assign an operational bus to a specific schedule and route version</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/bus-route-assignments')}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-all shadow-sm"
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending || scheduleIsBlocked}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {createMutation.isPending || updateMutation.isPending
                            ? 'Processing...'
                            : isEditMode ? 'Save Changes' : 'Assign Bus'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-[2rem] shadow-xl border border-slate-200/60 dark:border-navy-700 overflow-hidden relative">

                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row">

                    {/* LEFT COLUMN: Route & Direction */}
                    <div className="lg:w-[40%] xl:w-1/3 p-8 lg:p-10 bg-slate-50/70 dark:bg-navy-800/50 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-navy-700/80">
                        <div className="mb-10">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Route Selection</h2>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Determine the pathway and operational direction</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                                    Operating Route
                                </label>
                                <select
                                    value={formData.routeId}
                                    onChange={e => handleChange('routeId', e.target.value)}
                                    className={`w-full px-4 py-3.5 bg-white dark:bg-navy-900 text-sm font-semibold text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-shadow shadow-sm hover:shadow-md ${errors.routeId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-navy-600'}`}
                                    disabled={routesLoading}
                                >
                                    <option value="" disabled className="text-slate-300">{routesLoading ? 'Loading...' : 'Select a route...'}</option>
                                    {(routes as any[]).map((r: any) => (
                                        <option key={r.id} value={r.id}>
                                            {r.routeName}
                                        </option>
                                    ))}
                                </select>
                                {errors.routeId && <p className="mt-2 text-xs text-red-500 font-bold">{errors.routeId}</p>}
                            </div>

                            {formData.routeId && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                                        Travel Direction
                                    </label>
                                    <div className="flex p-1.5 bg-slate-200/60 dark:bg-navy-900/60 backdrop-blur-sm rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => { handleChange('direction', 'forward'); }}
                                            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-lg transition-all duration-300 ${formData.direction === 'forward' ? 'bg-white dark:bg-navy-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200 dark:ring-navy-600/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            Forward
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { handleChange('direction', 'backward'); }}
                                            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-lg transition-all duration-300 ${formData.direction === 'backward' ? 'bg-white dark:bg-navy-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200 dark:ring-navy-600/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            Backward
                                        </button>
                                    </div>
                                </div>
                            )}

                            {formData.routeId && formData.direction && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                                        Route Version
                                    </label>
                                    {versionsLoading ? (
                                        <div className="p-4 bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 animate-pulse">
                                            <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-1/2 mb-2"></div>
                                            <div className="h-3 bg-slate-100 dark:bg-navy-800 rounded w-3/4"></div>
                                        </div>
                                    ) : directionalVersions.length === 0 ? (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center">
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">No Versions</p>
                                            <p className="text-[11px] text-amber-600/80 dark:text-amber-500/70 mt-1">Configure versions first</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {directionalVersions.map((v: any) => {
                                                const firstStop = v.routeStops?.[0]?.stop?.stopName || 'Start';
                                                const lastStop = v.routeStops?.[v.routeStops.length - 1]?.stop?.stopName || 'End';
                                                const isSelected = formData.versionId === v.id;
                                                return (
                                                    <label
                                                        key={v.id}
                                                        className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${isSelected
                                                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-md transform -translate-y-0.5'
                                                            : 'border-white dark:border-navy-800 bg-white dark:bg-navy-900/80 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800/80'}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="versionId"
                                                            value={v.id}
                                                            checked={formData.versionId === v.id}
                                                            onChange={() => handleChange('versionId', v.id)}
                                                            className="sr-only"
                                                        />
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-emerald-500 bg-white dark:bg-navy-900/50' : 'border-slate-300 dark:border-navy-600'}`}>
                                                                {isSelected && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-bold ${isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                                                                    Version {v.routeNumber || v.versionNumber || ''}
                                                                </p>
                                                                <p className={`text-[11px] font-medium mt-1 uppercase tracking-wider ${isSelected ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-slate-400'}`}>
                                                                    {firstStop} → {lastStop}
                                                                </p>
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
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Assignment Timing & Bus Selection */}
                    <div className="lg:w-[60%] xl:w-2/3 p-8 lg:p-12 w-full bg-white dark:bg-navy-900 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/30 dark:bg-emerald-900/10 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>

                        <div className="mb-12 border-l-4 border-emerald-500 pl-4 py-1">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Assignment Configuration</h2>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Map schedules to active vehicles seamlessly</p>
                        </div>

                        <div className="max-w-2xl space-y-10">

                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 transition-colors group-focus-within:text-emerald-600">
                                    Operational Schedule
                                </label>
                                <select
                                    value={formData.scheduleId}
                                    onChange={e => handleChange('scheduleId', e.target.value)}
                                    className={`w-full px-4 py-4 text-sm font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-all shadow-inner ${errors.scheduleId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-navy-700'}`}
                                    disabled={!formData.versionId}
                                >
                                    <option value="" disabled className="text-slate-400">
                                        {!formData.versionId
                                            ? 'Select a version first'
                                            : schedules.length === 0
                                                ? 'No active schedules for this version'
                                                : '— Select Schedule —'}
                                    </option>
                                    {schedules.map((s: any) => {
                                        const isOccupied = s.busRouteAssignments?.length > 0 && (!isEditMode || editData?.scheduleId !== s.id);
                                        const occupiedPlate = s.busRouteAssignments?.[0]?.bus?.plateNumber;
                                        return (
                                            <option key={s.id} value={s.id} disabled={isOccupied} className={isOccupied ? 'text-slate-400' : 'text-slate-900 dark:text-slate-200'}>
                                                {s.departureTime?.substring(11, 16)} — {s.dayOfWeek?.charAt(0).toUpperCase() + s.dayOfWeek?.slice(1)} ({s.scheduleName})
                                                {isOccupied ? ` [Assigned: ${occupiedPlate}]` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                {errors.scheduleId && <p className="mt-2 text-xs text-red-500 font-bold">{errors.scheduleId}</p>}
                            </div>

                            <hr className="border-t-2 border-dashed border-slate-100 dark:border-navy-700/50" />

                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 transition-colors group-focus-within:text-emerald-600">
                                    Assigned Bus
                                </label>
                                <select
                                    value={formData.busId}
                                    onChange={e => handleChange('busId', e.target.value)}
                                    className={`w-full px-4 py-4 text-sm font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-all shadow-inner ${errors.busId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-navy-700'}`}
                                    disabled={!formData.scheduleId || availabilityLoading || availableBuses.length === 0}
                                >
                                    <option value="" disabled className="text-slate-400">
                                        {!formData.scheduleId
                                            ? 'Select a schedule first'
                                            : availabilityLoading
                                            ? 'Loading operational fleet...'
                                            : availableBuses.length === 0
                                            ? 'No operational buses available'
                                            : '— Select Available Bus —'}
                                    </option>
                                    {availableBuses.map((b: any) => (
                                        <option key={b.id} value={b.id}>
                                            {b.plateNumber} — {b.model || 'Standard Bus'} ({b.capacity} seats)
                                        </option>
                                    ))}
                                </select>
                                {errors.busId && <p className="mt-2 text-xs text-red-500 font-bold">{errors.busId}</p>}
                            </div>

                            <div className="pt-6">
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-5 flex items-center">
                                    Validity Horizon <span className="ml-3 text-[9px] px-2 py-1 bg-slate-100 dark:bg-navy-800 text-slate-400 rounded-full font-bold">OPTIONAL</span>
                                </h3>
                                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-navy-900 p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.18)] rounded-2xl border border-slate-100 dark:border-navy-800">
                                    <div className="flex-1 w-full relative">
                                        <div className="px-4 pt-3 pb-1 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-navy-800 group focus-within:bg-slate-50 dark:focus-within:bg-navy-800/50 rounded-tl-xl sm:rounded-l-xl sm:rounded-tr-none transition-colors">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5 transition-colors group-focus-within:text-emerald-500">Launch Date</p>
                                            <input
                                                type="date"
                                                value={formData.assignedDate}
                                                onChange={e => handleChange('assignedDate', e.target.value)}
                                                className="w-full text-base font-bold bg-transparent text-slate-900 dark:text-white border-0 p-0 focus:ring-0 outline-none placeholder-slate-300"
                                            />
                                        </div>
                                        {errors.assignedDate && <p className="absolute -bottom-6 left-0 text-xs text-red-500 font-bold">{errors.assignedDate}</p>}
                                    </div>
                                    <div className="flex-1 w-full relative">
                                        <div className="px-4 pt-3 pb-1 group focus-within:bg-slate-50 dark:focus-within:bg-navy-800/50 rounded-b-xl sm:rounded-r-xl transition-colors">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5 transition-colors group-focus-within:text-emerald-500">End Date</p>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={e => handleChange('endDate', e.target.value)}
                                                className="w-full text-base font-bold bg-transparent text-slate-900 dark:text-white border-0 p-0 focus:ring-0 outline-none placeholder-slate-300"
                                            />
                                        </div>
                                        {errors.endDate && <p className="absolute -bottom-6 left-0 text-xs text-red-500 font-bold">{errors.endDate}</p>}
                                    </div>
                                </div>
                                <p className="text-[11px] font-medium text-slate-400 mt-6 text-center">
                                    If left blank, this bus is permanently docked to this schedule loop.
                                </p>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
