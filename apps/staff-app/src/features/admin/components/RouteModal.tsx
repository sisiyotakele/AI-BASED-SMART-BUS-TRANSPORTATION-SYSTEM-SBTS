import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Stop, Route } from '@/types';

interface RouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RouteFormData) => void;
    editData?: Route | null;
    stops: Stop[];
}

interface RouteFormData {
    routeName: string;
    description?: string;
    startStopId: string;
    endStopId: string;
    status: string;
}

export function RouteModal({ isOpen, onClose, onSubmit, editData, stops }: RouteModalProps) {
    const [formData, setFormData] = useState<RouteFormData>({
        routeName: '',
        description: '',
        startStopId: '',
        endStopId: '',
        status: 'active',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (editData) {
            setFormData({
                routeName: editData.routeName || '',
                description: editData.description || '',
                startStopId: editData.startStopId || '',
                endStopId: editData.endStopId || '',
                status: (editData as any).status || 'active',
            });
        } else {
            setFormData({
                routeName: '',
                description: '',
                startStopId: '',
                endStopId: '',
                status: 'active',
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.routeName.trim()) {
            newErrors.routeName = 'Route name is required';
        } else if (formData.routeName.length > 255) {
            newErrors.routeName = 'Route name must be less than 255 characters';
        }

        if (!formData.startStopId) {
            newErrors.startStopId = 'Origin stop is required';
        }

        if (!formData.endStopId) {
            newErrors.endStopId = 'Destination stop is required';
        }

        if (formData.startStopId && formData.endStopId && formData.startStopId === formData.endStopId) {
            newErrors.endStopId = 'Destination must be different from origin';
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

        // Reset form
        setFormData({
            routeName: '',
            description: '',
            startStopId: '',
            endStopId: '',
            status: 'active',
        });
        setErrors({});
    };

    const handleChange = (field: keyof RouteFormData, value: any) => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-slate-200 dark:border-navy-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {editData ? 'Edit Route' : 'New Route'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form id="route-form" onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Route Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Route Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.routeName}
                            onChange={(e) => handleChange('routeName', e.target.value)}
                            placeholder="e.g., Route 101 - Meskel Square to Bole"
                            className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.routeName ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                        />
                        {errors.routeName && (
                            <p className="mt-1 text-sm text-red-500">{errors.routeName}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Brief description of the route..."
                            rows={3}
                            className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Operational Status 
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-300 dark:border-navy-600 text-sm"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Origin Stop */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Origin Stop <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.startStopId}
                                onChange={(e) => handleChange('startStopId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.startStopId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            >
                                <option value="">Select origin stop</option>
                                {stops.map((stop) => (
                                    <option key={stop.id} value={stop.id}>
                                        {stop.stopName} ({stop.stopCode})
                                    </option>
                                ))}
                            </select>
                            {errors.startStopId && (
                                <p className="mt-1 text-sm text-red-500">{errors.startStopId}</p>
                            )}
                        </div>

                        {/* Destination Stop */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Destination Stop <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.endStopId}
                                onChange={(e) => handleChange('endStopId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.endStopId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            >
                                <option value="">Select destination stop</option>
                                {stops.map((stop) => (
                                    <option
                                        key={stop.id}
                                        value={stop.id}
                                        disabled={stop.id === formData.startStopId}
                                    >
                                        {stop.stopName} ({stop.stopCode})
                                    </option>
                                ))}
                            </select>
                            {errors.endStopId && (
                                <p className="mt-1 text-sm text-red-500">{errors.endStopId}</p>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-500/90 leading-relaxed">
                            <strong className="font-semibold text-blue-950 dark:text-blue-400">Note:</strong> After creating the route, you can add intermediate stops and configure the sequence, estimated travel times, and distances.
                        </p>
                    </div>
                </form>

                <div className="p-4 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3 bg-slate-50 dark:bg-navy-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors border border-slate-300 dark:border-navy-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="route-form"
                        className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                        {editData ? 'Update Route' : 'Create Route'}
                    </button>
                </div>
            </div>
        </div>
    );
}
