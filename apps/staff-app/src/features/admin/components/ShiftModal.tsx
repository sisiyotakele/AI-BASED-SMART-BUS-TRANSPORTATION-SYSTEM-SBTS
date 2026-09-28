import { useState, useEffect, useMemo } from 'react';
import { X, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { shiftService } from '@/services/shift.service';
import { driverService } from '@/services/driver.service';
import { Shift } from '@/types';

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Shift>) => void;
    shift?: Shift | null;
}

const shiftTemplates = [
    { name: 'Morning Shift', start: '06:00', end: '14:00' },
    { name: 'Afternoon Shift', start: '14:00', end: '22:00' },
    { name: 'Night Shift', start: '22:00', end: '06:00' },
    { name: 'Standard Day', start: '08:00', end: '17:00' },
    { name: 'AM Peak', start: '06:00', end: '10:00' },
    { name: 'PM Peak', start: '15:00', end: '19:00' },
];

function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

function overlaps(existStart: string, existEnd: string, newStart: string, newEnd: string): boolean {
    // Handle overnight shifts by treating them within a 0-1440 range
    const normExistEnd = existEnd < existStart ? toMinutes(existEnd) + 1440 : toMinutes(existEnd);
    const normNewEnd = newEnd < newStart ? toMinutes(newEnd) + 1440 : toMinutes(newEnd);
    const eS = toMinutes(existStart), nS = toMinutes(newStart);
    return eS < normNewEnd && nS < normExistEnd;
}

function formatTimeStr(raw: any): string {
    if (!raw) return '';
    if (typeof raw === 'string' && /^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
    try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    } catch { }
    return String(raw).slice(0, 5);
}

export function ShiftModal({ isOpen, onClose, onSubmit, shift }: ShiftModalProps) {
    const [formData, setFormData] = useState<Partial<Shift>>({
        driverId: '',
        shiftName: '',
        shiftStart: '',
        shiftEnd: '',
        shiftDate: new Date().toISOString().split('T')[0],
        isActive: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch all drivers
    const { data: drivers = [], isLoading: driversLoading } = useQuery({
        queryKey: ['drivers'],
        queryFn: () => driverService.getAll(),
        enabled: isOpen,
    });

    // Fetch existing shifts for selected driver+date to check overlap
    const { data: driverShifts = [] } = useQuery({
        queryKey: ['shifts-for-driver', formData.driverId, formData.shiftDate],
        queryFn: () => shiftService.getAll(formData.driverId as string, formData.shiftDate as string),
        enabled: !!formData.driverId && !!formData.shiftDate,
    });

    const selectedDriver = useMemo(
        () => (drivers as any[]).find((d: any) => d.id === formData.driverId),
        [drivers, formData.driverId]
    );

    // Overlap check
    const overlapWarning = useMemo(() => {
        if (!formData.shiftStart || !formData.shiftEnd || !driverShifts.length) return null;
        const conflicting = (driverShifts as Shift[]).filter(s => {
            if (shift && s.id === shift.id) return false; // skip self when editing
            const sStart = formatTimeStr(s.shiftStart);
            const sEnd = formatTimeStr(s.shiftEnd);
            if (!sStart || !sEnd) return false;
            return overlaps(sStart, sEnd, formData.shiftStart as string, formData.shiftEnd as string);
        });
        return conflicting.length > 0 ? conflicting : null;
    }, [driverShifts, formData.shiftStart, formData.shiftEnd, shift]);

    useEffect(() => {
        if (shift) {
            setFormData({
                driverId: shift.driverId,
                shiftName: shift.shiftName,
                shiftStart: formatTimeStr(shift.shiftStart),
                shiftEnd: formatTimeStr(shift.shiftEnd),
                shiftDate: shift.shiftDate ? String(shift.shiftDate).split('T')[0] : new Date().toISOString().split('T')[0],
                isActive: shift.isActive,
            });
        } else {
            setFormData({
                driverId: '', shiftName: '', shiftStart: '', shiftEnd: '',
                shiftDate: new Date().toISOString().split('T')[0], isActive: true,
            });
        }
        setErrors({});
    }, [shift, isOpen]);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!formData.driverId) e.driverId = 'Driver is required';
        if (!formData.shiftName?.trim()) e.shiftName = 'Shift name is required';
        if (!formData.shiftStart) e.shiftStart = 'Start time is required';
        if (!formData.shiftEnd) e.shiftEnd = 'End time is required';
        if (!formData.shiftDate) e.shiftDate = 'Shift date is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if (overlapWarning) {
            if (!window.confirm('⚠️ This shift overlaps with an existing one. Proceed anyway?')) return;
        }
        onSubmit(formData);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const applyTemplate = (t: typeof shiftTemplates[0]) => {
        setFormData(prev => ({ ...prev, shiftName: t.name, shiftStart: t.start, shiftEnd: t.end }));
        setErrors({});
    };

    if (!isOpen) return null;

    const existingShiftsForDay = (driverShifts as Shift[]).filter(s => !shift || s.id !== shift.id);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-slate-200 dark:border-navy-700">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-900 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-500" />
                            {shift ? 'Edit Driver Shift' : 'Create Driver Shift'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Define a working period for a driver on a specific date</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-navy-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Quick Templates */}
                {!shift && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-navy-800/50 border-b border-gray-100 dark:border-navy-700">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Templates</p>
                        <div className="flex flex-wrap gap-2">
                            {shiftTemplates.map(t => {
                                const active = formData.shiftName === t.name && formData.shiftStart === t.start;
                                return (
                                    <button
                                        key={t.name}
                                        type="button"
                                        onClick={() => applyTemplate(t)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${active
                                            ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
                                            : 'bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-600 text-gray-700 dark:text-gray-300 hover:border-cyan-300'}`}
                                    >
                                        {t.name} · {t.start}–{t.end}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Driver Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Driver <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.driverId || ''}
                            onChange={e => handleChange('driverId', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.driverId ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                            disabled={driversLoading}
                        >
                            <option value="">{driversLoading ? 'Loading drivers…' : '— Select Driver —'}</option>
                            {(drivers as any[]).map((d: any) => (
                                <option key={d.id} value={d.id}>{d.fullName || d.user?.fullName}</option>
                            ))}
                        </select>
                        {errors.driverId && <p className="mt-1 text-xs text-red-500">{errors.driverId}</p>}
                    </div>

                    {/* Driver Info Card */}
                    {selectedDriver && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-200 text-sm">
                                    {(selectedDriver.fullName || '?').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-blue-900 dark:text-blue-100">{selectedDriver.fullName || selectedDriver.user?.fullName}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                        License: {selectedDriver.licenseNumber || 'N/A'} · Status: {selectedDriver.isActive !== false ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            </div>
                            {existingShiftsForDay.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                                        Existing shifts on {formData.shiftDate}:
                                    </p>
                                    {existingShiftsForDay.map((s: any) => (
                                        <div key={s.id} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 rounded px-2 py-1 mb-1">
                                            {formatTimeStr(s.shiftStart)} – {formatTimeStr(s.shiftEnd)} ({s.shiftName})
                                        </div>
                                    ))}
                                </div>
                            )}
                            {existingShiftsForDay.length === 0 && formData.shiftDate && (
                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> No existing shifts on {formData.shiftDate}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Overlap Warning */}
                    {overlapWarning && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-red-700 dark:text-red-400">⚠ Shift Overlap Detected</p>
                                {overlapWarning.map((s: any) => (
                                    <p key={s.id} className="text-xs text-red-600 dark:text-red-400">
                                        Conflicts with: {s.shiftName} ({formatTimeStr(s.shiftStart)}–{formatTimeStr(s.shiftEnd)})
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date + Shift Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Shift Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.shiftDate as string}
                                onChange={e => handleChange('shiftDate', e.target.value)}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftDate ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                            />
                            {errors.shiftDate && <p className="mt-1 text-xs text-red-500">{errors.shiftDate}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Shift Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Morning Shift"
                                value={formData.shiftName as string}
                                onChange={e => handleChange('shiftName', e.target.value)}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftName ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                            />
                            {errors.shiftName && <p className="mt-1 text-xs text-red-500">{errors.shiftName}</p>}
                        </div>
                    </div>

                    {/* Start + End Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.shiftStart as string}
                                onChange={e => handleChange('shiftStart', e.target.value)}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftStart ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                            />
                            {errors.shiftStart && <p className="mt-1 text-xs text-red-500">{errors.shiftStart}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                End Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.shiftEnd as string}
                                onChange={e => handleChange('shiftEnd', e.target.value)}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftEnd ? 'border-red-500' : 'border-gray-200 dark:border-navy-700'}`}
                            />
                            {errors.shiftEnd && <p className="mt-1 text-xs text-red-500">{errors.shiftEnd}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="shiftIsActive" checked={!!formData.isActive}
                            onChange={e => handleChange('isActive', e.target.checked)}
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded" />
                        <label htmlFor="shiftIsActive" className="text-sm font-medium text-gray-900 dark:text-gray-300">Active Shift</label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-navy-700">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800 border border-gray-300 dark:border-navy-600 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-sm ${overlapWarning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                        >
                            {overlapWarning ? '⚠ Create Anyway' : (shift ? 'Update Shift' : 'Create Shift')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
