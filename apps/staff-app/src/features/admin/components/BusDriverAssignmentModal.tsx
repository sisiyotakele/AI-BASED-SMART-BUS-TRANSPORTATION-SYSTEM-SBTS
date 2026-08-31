import { useState, useEffect } from 'react';
import { X, Users, Bus, Calendar, Clock } from 'lucide-react';
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
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#2B4B9E] to-[#1E3678] text-white shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                            <Users className="w-5 h-5 text-cyan-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-wide">
                                {editData ? 'Edit Driver Shift & Bus Assignment' : 'Create Shift & Assign Bus'}
                            </h2>
                            <p className="text-xs text-cyan-100/80">Configure shift details and assign vehicle in one step</p>
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
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Driver */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            Driver <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.driverId}
                            onChange={e => handleChange('driverId', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.driverId ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
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
                        {errors.driverId && <p className="mt-1 text-xs text-red-500">{errors.driverId}</p>}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.assignedDate}
                            onChange={e => handleChange('assignedDate', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.assignedDate ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                        />
                        {errors.assignedDate && <p className="mt-1 text-xs text-red-500">{errors.assignedDate}</p>}
                    </div>

                    {/* Shift Start & End */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                Shift Start <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.shiftStart}
                                onChange={e => handleChange('shiftStart', e.target.value)}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.shiftStart ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                            />
                            {errors.shiftStart && <p className="mt-1 text-xs text-red-500">{errors.shiftStart}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                Shift End <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.shiftEnd}
                                onChange={e => handleChange('shiftEnd', e.target.value)}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.shiftEnd ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                            />
                            {errors.shiftEnd && <p className="mt-1 text-xs text-red-500">{errors.shiftEnd}</p>}
                        </div>
                    </div>

                    {/* Bus */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Bus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            Bus <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.busId}
                            onChange={e => handleChange('busId', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.busId ? 'border-red-500' : 'border-slate-200 dark:border-navy-700'}`}
                            disabled={busesLoading}
                        >
                            <option value="">{busesLoading ? 'Loading buses...' : '— Select Bus —'}</option>
                            {operationalBuses.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                    {b.plateNumber} — {b.model || 'Bus'} ({b.capacity} seats)
                                </option>
                            ))}
                        </select>
                        {errors.busId && <p className="mt-1 text-xs text-red-500">{errors.busId}</p>}
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
                            className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-sm"
                        >
                            {editData ? 'Update Assignment' : 'Create Shift & Assign Bus'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
