import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { RouteSchedule, Route } from '@/types';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    editData?: RouteSchedule | null;
    routes: Route[];
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ScheduleModal({ isOpen, onClose, onSubmit, editData, routes }: ScheduleModalProps) {
    const [formData, setFormData] = useState<any>({
        routeId: '',
        versionId: '',
        scheduleName: '',
        dayOfWeek: ['monday'],
        departureTime: '',
        frequencyMinutes: '',
        isActive: true,
        effectiveFrom: '',
        effectiveUntil: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (editData) {
            setFormData({
                routeId: editData.routeId || '',
                versionId: editData.versionId || '',
                scheduleName: editData.scheduleName || '',
                dayOfWeek: editData.dayOfWeek ? [editData.dayOfWeek.toLowerCase()] : ['monday'],
                departureTime: editData.departureTime || '',
                frequencyMinutes: editData.frequencyMinutes?.toString() || '',
                isActive: editData.isActive ?? true,
                effectiveFrom: editData.effectiveFrom ? new Date(editData.effectiveFrom).toISOString().split('T')[0] : '',
                effectiveUntil: editData.effectiveUntil ? new Date(editData.effectiveUntil).toISOString().split('T')[0] : '',
            });
        } else {
            setFormData({
                routeId: '',
                versionId: '',
                scheduleName: '',
                dayOfWeek: ['monday'],
                departureTime: '',
                frequencyMinutes: '',
                isActive: true,
                effectiveFrom: '',
                effectiveUntil: '',
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.scheduleName.trim()) newErrors.scheduleName = 'Schedule name is required';
        if (!formData.routeId) newErrors.routeId = 'Route is required';
        if (!formData.dayOfWeek || formData.dayOfWeek.length === 0) newErrors.dayOfWeek = 'Select at least one day';
        
        let finalVersionId = formData.versionId;
        if (!finalVersionId && formData.routeId) {
            const route = routes.find(r => r.id === formData.routeId);
            if (route && route.versions && route.versions.length > 0) {
                const activeVersion = route.versions.find(v => v.isActive) || route.versions[0];
                finalVersionId = activeVersion.id;
            }
        }
        if (!finalVersionId) {
            newErrors.routeId = 'Selected route has no active versions setup';
        }

        if (!formData.departureTime) newErrors.departureTime = 'Departure time is required';
        
        // For standard schedules, backend expects time format HH:MM
        if (formData.departureTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.departureTime)) {
            newErrors.departureTime = 'Invalid time format (HH:MM)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        let finalVersionId = formData.versionId;
        if (!finalVersionId && formData.routeId) {
            const route = routes.find(r => r.id === formData.routeId);
            if (route && route.versions && route.versions.length > 0) {
                const activeVersion = route.versions.find(v => v.isActive) || route.versions[0];
                finalVersionId = activeVersion.id;
            }
        }

        const submitData = {
            ...formData,
            versionId: finalVersionId,
            frequencyMinutes: formData.frequencyMinutes ? parseInt(formData.frequencyMinutes) : undefined,
            effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).toISOString() : undefined,
            effectiveUntil: formData.effectiveUntil ? new Date(formData.effectiveUntil).toISOString() : undefined,
        };

        onSubmit(submitData);
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {editData ? 'Edit Schedule' : 'New Schedule'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-navy-800 rounded transition-colors">
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Schedule Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.scheduleName}
                                onChange={(e) => handleChange('scheduleName', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.scheduleName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                                placeholder="e.g. Morning Rush - Route 1"
                            />
                            {errors.scheduleName && <p className="mt-1 text-sm text-red-500">{errors.scheduleName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Route <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.routeId}
                                onChange={(e) => handleChange('routeId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.routeId ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            >
                                <option value="">Select Route</option>
                                {routes.map(r => (
                                    <option key={r.id} value={r.id}>{r.routeName}</option>
                                ))}
                            </select>
                            {errors.routeId && <p className="mt-1 text-sm text-red-500">{errors.routeId}</p>}
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Days of Week <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map((day) => {
                                    const lowerDay = day.toLowerCase();
                                    const isSelected = formData.dayOfWeek.includes(lowerDay);
                                    return (
                                        <button
                                            type="button"
                                            key={lowerDay}
                                            onClick={() => {
                                                const newDays = isSelected
                                                    ? formData.dayOfWeek.filter((d: string) => d !== lowerDay)
                                                    : [...formData.dayOfWeek, lowerDay];
                                                handleChange('dayOfWeek', newDays);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                                isSelected
                                                    ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-700'
                                                    : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-navy-600 hover:border-slate-300 dark:hover:border-navy-500'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.dayOfWeek && <p className="mt-1 text-sm text-red-500">{errors.dayOfWeek}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Departure Time (HH:MM) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={formData.departureTime}
                                onChange={(e) => handleChange('departureTime', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.departureTime ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.departureTime && <p className="mt-1 text-sm text-red-500">{errors.departureTime}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Frequency (Minutes)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.frequencyMinutes}
                                onChange={(e) => handleChange('frequencyMinutes', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="E.g. 15"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Effective From (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveFrom}
                                onChange={(e) => handleChange('effectiveFrom', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Effective Until (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveUntil}
                                onChange={(e) => handleChange('effectiveUntil', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div className="col-span-2 flex items-center pt-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => handleChange('isActive', e.target.checked)}
                                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Active Schedule
                            </label>
                        </div>
                    </div>

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
                            {editData ? 'Update Schedule' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
