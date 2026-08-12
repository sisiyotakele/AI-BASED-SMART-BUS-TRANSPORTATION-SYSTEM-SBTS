import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Stop } from '@/types';
import { terminalsApi } from '@/services/api/terminals.api';

interface StopModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StopFormData) => void;
    editData?: Stop | null;
}

interface StopFormData {
    stopName: string;
    stopCode: string;
    terminalId?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
}

// Dropdown will be populated dynamically from API

export function StopModal({ isOpen, onClose, onSubmit, editData }: StopModalProps) {
    const [formData, setFormData] = useState<StopFormData>({
        stopName: '',
        stopCode: '',
        terminalId: '',
        latitude: undefined,
        longitude: undefined,
        address: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: terminals = [], isLoading: isLoadingTerminals } = useQuery({
        queryKey: ['terminals'],
        queryFn: () => terminalsApi.getAll(),
        enabled: isOpen,
    });

    useEffect(() => {
        if (editData) {
            setFormData({
                stopName: editData.stopName || '',
                stopCode: editData.stopCode || '',
                terminalId: editData.terminalId || '',
                latitude: editData.latitude || undefined,
                longitude: editData.longitude || undefined,
                address: editData.address || '',
            });
        } else {
            setFormData({
                stopName: '',
                stopCode: '',
                terminalId: '',
                latitude: undefined,
                longitude: undefined,
                address: '',
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.stopName.trim()) {
            newErrors.stopName = 'Stop name is required';
        } else if (formData.stopName.length > 255) {
            newErrors.stopName = 'Stop name must be less than 255 characters';
        }

        if (!formData.stopCode.trim()) {
            newErrors.stopCode = 'Stop code is required';
        } else if (formData.stopCode.length > 255) {
            newErrors.stopCode = 'Stop code must be less than 255 characters';
        }

        if (formData.latitude !== undefined) {
            if (formData.latitude < -90 || formData.latitude > 90) {
                newErrors.latitude = 'Latitude must be between -90 and 90';
            }
        }

        if (formData.longitude !== undefined) {
            if (formData.longitude < -180 || formData.longitude > 180) {
                newErrors.longitude = 'Longitude must be between -180 and 180';
            }
        }

        // If one coordinate is provided, both should be provided
        if ((formData.latitude !== undefined && formData.longitude === undefined) ||
            (formData.latitude === undefined && formData.longitude !== undefined)) {
            newErrors.coordinates = 'Both latitude and longitude must be provided together';
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
            stopName: '',
            stopCode: '',
            terminalId: '',
            latitude: undefined,
            longitude: undefined,
            address: '',
        });
        setErrors({});
    };

    const handleChange = (field: keyof StopFormData, value: any) => {
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
                        {editData ? 'Edit Stop' : 'New Stop'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form id="stop-form" onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Stop Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Stop Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.stopName}
                                onChange={(e) => handleChange('stopName', e.target.value)}
                                placeholder="e.g., Meskel Square"
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.stopName ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.stopName && (
                                <p className="mt-1 text-sm text-red-500">{errors.stopName}</p>
                            )}
                        </div>

                        {/* Stop Code */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Stop Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.stopCode}
                                onChange={(e) => handleChange('stopCode', e.target.value)}
                                placeholder="e.g., MSQ-001"
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.stopCode ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.stopCode && (
                                <p className="mt-1 text-sm text-red-500">{errors.stopCode}</p>
                            )}
                        </div>
                    </div>

                    {/* Terminal */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Terminal (Optional)
                        </label>
                        <select
                            value={formData.terminalId}
                            onChange={(e) => handleChange('terminalId', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            <option value="">No terminal</option>
                            {isLoadingTerminals ? (
                                <option value="" disabled>Loading terminals...</option>
                            ) : (
                                terminals.map((terminal) => (
                                    <option key={terminal.id} value={terminal.id}>
                                        {terminal.terminalName}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Address (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="e.g., Meskel Square, Addis Ababa"
                            className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Latitude */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Latitude (Optional)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.latitude ?? ''}
                                onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                placeholder="e.g., 9.0106"
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.latitude ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.latitude && (
                                <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
                            )}
                        </div>

                        {/* Longitude */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Longitude (Optional)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.longitude ?? ''}
                                onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                placeholder="e.g., 38.7641"
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.longitude ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.longitude && (
                                <p className="mt-1 text-sm text-red-500">{errors.longitude}</p>
                            )}
                        </div>
                    </div>

                    {errors.coordinates && (
                        <p className="text-sm text-red-500">{errors.coordinates}</p>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-500/90 leading-relaxed">
                            <strong className="font-semibold text-blue-950 dark:text-blue-400">Note:</strong> GPS coordinates are optional but recommended for accurate route mapping and real-time tracking features.
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
                        form="stop-form"
                        className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                        {editData ? 'Update Stop' : 'Create Stop'}
                    </button>
                </div>
            </div>
        </div>
    );
}
