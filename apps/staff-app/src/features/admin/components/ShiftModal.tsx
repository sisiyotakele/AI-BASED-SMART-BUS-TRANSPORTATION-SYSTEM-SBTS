import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle } from 'lucide-react';
import { Shift, Driver } from '@/types';

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Shift>) => void;
    shift?: Shift | null;
    drivers: Driver[];
}

const shiftTemplates = [
    { name: 'Morning Shift', start: '06:00', end: '14:00' },
    { name: 'Afternoon Shift', start: '14:00', end: '22:00' },
    { name: 'Evening Shift', start: '22:00', end: '06:00' },
    { name: 'Standard Day', start: '08:00', end: '17:00' },
    { name: 'AM Peak', start: '06:00', end: '10:00' },
    { name: 'PM Peak', start: '15:00', end: '19:00' },
];

export function ShiftModal({ isOpen, onClose, onSubmit, shift, drivers }: ShiftModalProps) {
    const [formData, setFormData] = useState<Partial<Shift>>({
        driverId: '',
        shiftName: '',
        shiftStart: '',
        shiftEnd: '',
        shiftDate: '',
        isActive: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (shift) {
            setFormData({
                driverId: shift.driverId,
                shiftName: shift.shiftName,
                shiftStart: shift.shiftStart,
                shiftEnd: shift.shiftEnd,
                shiftDate: shift.shiftDate,
                isActive: shift.isActive,
            });
        } else {
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                driverId: '',
                shiftName: '',
                shiftStart: '',
                shiftEnd: '',
                shiftDate: today,
                isActive: true,
            });
        }
        setErrors({});
    }, [shift, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.driverId) {
            newErrors.driverId = 'Driver is required';
        }

        if (!formData.shiftName || !formData.shiftName.trim()) {
            newErrors.shiftName = 'Shift name is required';
        }

        if (!formData.shiftStart) {
            newErrors.shiftStart = 'Start time is required';
        }

        if (!formData.shiftEnd) {
            newErrors.shiftEnd = 'End time is required';
        }

        if (!formData.shiftDate) {
            newErrors.shiftDate = 'Shift date is required';
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (formData.shiftStart && !timeRegex.test(formData.shiftStart)) {
            newErrors.shiftStart = 'Invalid time format (use HH:MM)';
        }
        if (formData.shiftEnd && !timeRegex.test(formData.shiftEnd)) {
            newErrors.shiftEnd = 'Invalid time format (use HH:MM)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        onSubmit(formData);
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const applyTemplate = (template: typeof shiftTemplates[0]) => {
        setFormData((prev) => ({
            ...prev,
            shiftName: template.name,
            shiftStart: template.start,
            shiftEnd: template.end,
        }));
        setErrors({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {shift ? 'Edit Shift' : 'Add New Shift'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-navy-800 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Shift Templates */}
                {!shift && (
                    <div className="p-4 bg-gray-50 dark:bg-navy-800/50 border-b border-gray-200 dark:border-navy-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Templates:</p>
                        <div className="flex flex-wrap gap-2">
                            {shiftTemplates.map((template) => {
                                const isSelected = 
                                    formData.shiftName === template.name && 
                                    formData.shiftStart === template.start && 
                                    formData.shiftEnd === template.end;

                                return (
                                    <button
                                        key={template.name}
                                        type="button"
                                        onClick={() => applyTemplate(template)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200 flex items-center justify-center gap-2 ${
                                            isSelected
                                                ? 'bg-[#2D4A8E] border-[#2D4A8E] text-white shadow-md ring-2 ring-[#2D4A8E] ring-offset-1 dark:ring-offset-navy-900'
                                                : 'bg-white dark:bg-navy-800 border-gray-300 dark:border-navy-500 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-navy-700 hover:border-gray-400 shadow-sm active:bg-gray-200 dark:active:bg-navy-600'
                                        }`}
                                    >
                                        {isSelected ? (
                                            <CheckCircle className="w-4 h-4 text-white shrink-0" />
                                        ) : (
                                            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                        )}
                                        <div className="flex flex-col items-start text-left ml-1">
                                            <span>{template.name}</span>
                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {template.start} - {template.end}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Driver */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Driver <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.driverId || ''}
                                onChange={(e) => handleChange('driverId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.driverId ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            >
                                <option value="">Select a driver</option>
                                {drivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.fullName}
                                    </option>
                                ))}
                            </select>
                            {errors.driverId && (
                                <p className="mt-1 text-sm text-red-500">{errors.driverId}</p>
                            )}
                        </div>

                        {/* Shift Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Shift Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Morning Shift"
                                value={formData.shiftName}
                                onChange={(e) => handleChange('shiftName', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.shiftName && (
                                <p className="mt-1 text-sm text-red-500">{errors.shiftName}</p>
                            )}
                        </div>

                        {/* Shift Date */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Shift Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.shiftDate}
                                onChange={(e) => handleChange('shiftDate', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftDate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.shiftDate && (
                                <p className="mt-1 text-sm text-red-500">{errors.shiftDate}</p>
                            )}
                        </div>

                        {/* Shift Start */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.shiftStart}
                                onChange={(e) => handleChange('shiftStart', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftStart ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.shiftStart && (
                                <p className="mt-1 text-sm text-red-500">{errors.shiftStart}</p>
                            )}
                        </div>

                        {/* Shift End */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.shiftEnd}
                                onChange={(e) => handleChange('shiftEnd', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftEnd ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.shiftEnd && (
                                <p className="mt-1 text-sm text-red-500">{errors.shiftEnd}</p>
                            )}
                        </div>

                        {/* Is Active */}
                        <div className="col-span-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => handleChange('isActive', e.target.checked)}
                                    className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Shift</span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-navy-700 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                            {shift ? 'Update Shift' : 'Add Shift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
