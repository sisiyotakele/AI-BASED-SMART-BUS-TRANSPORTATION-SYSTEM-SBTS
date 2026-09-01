import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { busService } from '@/services/bus.service';
import { driverService } from '@/services/driver.service';

interface BusDriverAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssignmentWithShiftData) => void;
    editData?: any | null;
    defaultDriverId?: string;
}

export interface AssignmentWithShiftData {
    driverId: string;
    assignedDate: string;
    shiftStart: string;
    shiftEnd: string;
    busId: string;
    shiftName?: string;
}

export function BusDriverAssignmentModal({ isOpen, onClose, onSubmit, editData, defaultDriverId }: BusDriverAssignmentModalProps) {
    const [formData, setFormData] = useState<AssignmentWithShiftData>({
        driverId: defaultDriverId || '',
        assignedDate: new Date().toISOString().split('T')[0],
        shiftStart: '06:00',
        shiftEnd: '14:00',
        busId: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (defaultDriverId) {
            setFormData(prev => ({ ...prev, driverId: defaultDriverId }));
        }
    }, [defaultDriverId]);


    // Fetch drivers
    const { data: drivers = [], isLoading: driversLoading } = useQuery({
        queryKey: ['drivers-for-assignment-modal'],
        queryFn: () => driverService.getAll(),
        enabled: isOpen,
    });

    // Fetch buses
    const { data: buses = [], isLoading: busesLoading } = useQuery({
        queryKey: ['buses-for-assignment-modal'],
        queryFn: () => busService.getAll(),
        enabled: isOpen,
    });

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    driverId: editData.driverId || editData.shift?.driverId || '',
                    assignedDate: editData.assignedDate ? editData.assignedDate.split('T')[0] : new Date().toISOString().split('T')[0],
                    shiftStart: editData.shiftStart || '06:00',
                    shiftEnd: editData.shiftEnd || '14:00',
                    busId: editData.busId || '',
                });
            } else {
                setFormData({
                    driverId: '',
                    assignedDate: new Date().toISOString().split('T')[0],
                    shiftStart: '06:00',
                    shiftEnd: '14:00',
                    busId: '',
                });
            }
            setErrors({});
        }
    }, [isOpen, editData]);

    const handleChange = (field: keyof AssignmentWithShiftData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!formData.driverId) e.driverId = 'Driver is required';
        if (!formData.assignedDate) e.assignedDate = 'Date is required';
        if (!formData.shiftStart) e.shiftStart = 'Shift start time is required';
        if (!formData.shiftEnd) e.shiftEnd = 'Shift end time is required';
        if (!formData.busId) e.busId = 'Bus is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit(formData);
    };

    if (!isOpen) return null;

    const operationalBuses = (buses as any[]).filter(b => b.maintenanceStatus === 'operational' || b.id === formData.busId);

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-navy-700">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-navy-900 border-b border-slate-100 dark:border-navy-700/80">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {editData ? 'Edit Driver Shift Assignment' : 'Create Driver Assignment'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Link operational personnel to fleet vehicles</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {/* Driver */}
                    <div className="space-y-2.5">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Operating Driver <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                            value={formData.driverId}
                            onChange={e => handleChange('driverId', e.target.value)}
                            className={`w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-all text-sm font-semibold ${errors.driverId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-navy-700'}`}
                            disabled={driversLoading}
                        >
                            <option value="">{driversLoading ? 'Loading drivers...' : '— Select Driver —'}</option>
                            {(drivers as any[]).map((d: any) => {
                                const name = d.user?.fullName || d.fullName || 'Driver';
                                const license = d.licenseNumber ? `(${d.licenseNumber})` : '';
                                return (
                                    <option key={d.id} value={d.id}>
                                        {name} {license}
                                    </option>
                                );
                            })}
                        </select>
                        {errors.driverId && <p className="text-xs text-red-500 font-bold">{errors.driverId}</p>}
                    </div>

                    {/* Date */}
                    <div className="space-y-2.5">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Effective Date <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.assignedDate}
                            onChange={e => handleChange('assignedDate', e.target.value)}
                            className={`w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-all text-sm font-bold ${errors.assignedDate ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-navy-700'}`}
                        />
                        {errors.assignedDate && <p className="text-xs text-red-500 font-bold">{errors.assignedDate}</p>}
                    </div>

                    {/* Shift Start & End */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Shift Start <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.shiftStart}
                                onChange={e => handleChange('shiftStart', e.target.value)}
                                className={`w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-all text-sm font-bold ${errors.shiftStart ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-navy-700'}`}
                            />
                            {errors.shiftStart && <p className="text-xs text-red-500 font-bold">{errors.shiftStart}</p>}
                        </div>

                        <div className="space-y-2.5">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Shift End <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.shiftEnd}
                                onChange={e => handleChange('shiftEnd', e.target.value)}
                                className={`w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-all text-sm font-bold ${errors.shiftEnd ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-navy-700'}`}
                            />
                            {errors.shiftEnd && <p className="text-xs text-red-500 font-bold">{errors.shiftEnd}</p>}
                        </div>
                    </div>

                    {/* Bus */}
                    <div className="space-y-2.5">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Assigned Bus <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                            value={formData.busId}
                            onChange={e => handleChange('busId', e.target.value)}
                            className={`w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-900/50 dark:hover:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-all text-sm font-semibold ${errors.busId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-navy-700'}`}
                            disabled={busesLoading}
                        >
                            <option value="">{busesLoading ? 'Loading buses...' : '— Select Bus —'}</option>
                            {operationalBuses.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                    {b.plateNumber} — {b.model || 'Bus'} ({b.capacity} seats)
                                </option>
                            ))}
                        </select>
                        {errors.busId && <p className="text-xs text-red-500 font-bold">{errors.busId}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-100 dark:border-navy-700/80">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-500/20"
                        >
                            {editData ? 'Update Assignment' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
