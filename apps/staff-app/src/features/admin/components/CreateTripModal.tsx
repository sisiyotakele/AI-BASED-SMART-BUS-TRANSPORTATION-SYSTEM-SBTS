import { X, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Route as RouteIcon, Bus as BusIcon, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleService } from '@/services/schedule.service';
import { tripService } from '@/services/trip.service';

interface CreateTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (tripData: { scheduleId: string; tripDate: string }) => void;
    buses?: any[];
    drivers?: any[];
}

export function CreateTripModal({ isOpen, onClose, onSubmit }: CreateTripModalProps) {
    const todayStr = new Date().toISOString().split('T')[0];
    const [tripDate, setTripDate] = useState<string>(todayStr);
    const [scheduleId, setScheduleId] = useState<string>('');
    const [previewData, setPreviewData] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Fetch active schedules
    const { data: schedules = [] } = useQuery({
        queryKey: ['schedules-list'],
        queryFn: () => scheduleService.getAll(),
        enabled: isOpen
    });

    useEffect(() => {
        if (!isOpen) {
            setTripDate(new Date().toISOString().split('T')[0]);
            setScheduleId('');
            setPreviewData(null);
            setPreviewError('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

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
                    console.error('Failed to preview schedule details:', err);
                    setPreviewError(err.response?.data?.message || err.message || 'Failed to load schedule resolution details');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scheduleId || !tripDate || !previewData?.isReady) return;

        try {
            setIsSubmitting(true);
            await onSubmit({ scheduleId, tripDate });
            onClose();
        } catch (err: any) {
            setPreviewError(err.response?.data?.message || err.message || 'Failed to create trip');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-navy-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white rounded-t-3xl">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                            <RouteIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Create Trip</h2>
                            <p className="text-sm text-cyan-100 mt-0.5">Generate trip automatically from schedule and driver assignments</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* 1. Trip Date */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                <Calendar className="w-4 h-4 text-cyan-600" />
                                1. Trip Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={tripDate}
                                onChange={(e) => setTripDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                        </div>

                        {/* 2. Schedule */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                <Clock className="w-4 h-4 text-cyan-600" />
                                2. Schedule <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={scheduleId}
                                onChange={(e) => setScheduleId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                required
                            >
                                <option value="">Select schedule...</option>
                                {schedules.map((s: any) => {
                                    const rName = s.route?.routeName || s.routeName || 'Route';
                                    const dir = s.version?.direction === 'backward' ? 'Backward' : 'Forward';
                                    const dep = s.departureTime ? new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '06:00';
                                    return (
                                        <option key={s.id} value={s.id}>
                                            {rName} — {dir} — {dep}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    {/* Preview Section */}
                    {loadingPreview && (
                        <div className="p-8 text-center bg-slate-50 dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700">
                            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resolving schedule details and driver assignments...</p>
                        </div>
                    )}

                    {previewError && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-sm text-rose-700 dark:text-rose-300">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Trip Validation Error</p>
                                <p className="text-xs mt-0.5">{previewError}</p>
                            </div>
                        </div>
                    )}

                    {previewData && !loadingPreview && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            {/* Resolved Route & Relationships Overview */}
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-navy-800 dark:to-navy-800/60 p-5 rounded-2xl border border-slate-200 dark:border-navy-700 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-navy-700">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Route & Direction</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                                            {previewData.schedule.routeName}
                                            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50 px-2.5 py-0.5 rounded-full uppercase">
                                                {previewData.schedule.direction}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Departure</p>
                                        <p className="text-base font-black text-slate-900 dark:text-white">{previewData.schedule.departureTime}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <span>{previewData.schedule.startTerminalName}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-cyan-500" />
                                        <span>{previewData.schedule.endTerminalName}</span>
                                    </div>
                                    <span className="font-semibold bg-slate-200 dark:bg-navy-700 px-2.5 py-1 rounded-md">
                                        {previewData.schedule.stopsCount} Stops
                                    </span>
                                </div>

                                {/* Bus, Driver, Shift Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                    {/* Bus */}
                                    <div className={`p-3 rounded-xl border ${previewData.checks.busAssigned ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <BusIcon className={`w-4 h-4 ${previewData.checks.busAssigned ? 'text-emerald-600' : 'text-rose-500'}`} />
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bus</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {previewData.bus ? previewData.bus.plateNumber : 'No bus assigned'}
                                        </p>
                                        {previewData.bus?.model && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{previewData.bus.model}</p>
                                        )}
                                    </div>

                                    {/* Driver */}
                                    <div className={`p-3 rounded-xl border ${previewData.checks.driverAssigned ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <UserIcon className={`w-4 h-4 ${previewData.checks.driverAssigned ? 'text-emerald-600' : 'text-rose-500'}`} />
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Driver</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {previewData.driver ? previewData.driver.fullName : 'No driver assigned'}
                                        </p>
                                    </div>

                                    {/* Shift */}
                                    <div className={`p-3 rounded-xl border ${previewData.shift ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className={`w-4 h-4 ${previewData.shift ? 'text-emerald-600' : 'text-rose-500'}`} />
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Shift</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {previewData.shift ? `${previewData.shift.shiftStart}–${previewData.shift.shiftEnd}` : 'No shift'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Validation Status Checklist */}
                            <div className="bg-slate-50 dark:bg-navy-800 p-4 rounded-2xl border border-slate-200 dark:border-navy-700 space-y-2 text-xs font-medium">
                                <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Validation Status</p>
                                
                                <div className="flex items-center gap-2">
                                    {previewData.checks.busAssigned ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-rose-500" />
                                    )}
                                    <span className={previewData.checks.busAssigned ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                                        Bus assigned {previewData.bus ? `(${previewData.bus.plateNumber})` : ''}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {previewData.checks.driverAssigned ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-rose-500" />
                                    )}
                                    <span className={previewData.checks.driverAssigned ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                                        Driver assigned {previewData.driver ? `(${previewData.driver.fullName})` : ''}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {previewData.checks.assignmentValid ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-rose-500" />
                                    )}
                                    <span className={previewData.checks.assignmentValid ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                                        Driver-Bus assignment valid
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {previewData.isReady ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-rose-500" />
                                    )}
                                    <span className={previewData.isReady ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                                        {previewData.validationMessage}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-navy-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!previewData?.isReady || loadingPreview || isSubmitting}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-cyan-600/30 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating Trip...
                                </>
                            ) : (
                                'Generate Trip'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
