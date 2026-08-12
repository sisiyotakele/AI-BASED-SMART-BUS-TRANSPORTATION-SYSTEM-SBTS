import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PricingFormData) => void;
    editData?: any;
}

interface PricingFormData {
    routeId: string;
    fromStopId: string;
    toStopId: string;
    basePrice: number;
    peakPrice?: number;
    offPeakPrice?: number;
    effectiveFrom: string;
    effectiveUntil?: string;
}

import { useQuery } from '@tanstack/react-query';
import { routeService } from '@/services/route.service';
import { stopService } from '@/services/stop.service';

export function PricingModal({ isOpen, onClose, onSubmit, editData }: PricingModalProps) {
    const [formData, setFormData] = useState<PricingFormData>({
        routeId: '',
        fromStopId: '',
        toStopId: '',
        basePrice: 0,
        peakPrice: undefined,
        offPeakPrice: undefined,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveUntil: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: routesData = [] } = useQuery({
        queryKey: ['routes'],
        queryFn: () => routeService.getAll(),
        enabled: isOpen,
    });

    const { data: stopsData = [] } = useQuery({
        queryKey: ['stops'],
        queryFn: () => stopService.getAll(),
        enabled: isOpen,
    });

    const selectedRoute = routesData.find((r: any) => r.id === formData.routeId);
    let availableStops = [] as any[];
    
    if (selectedRoute) {
        const stopsMap = new Map();
        if (selectedRoute.startStop) stopsMap.set(selectedRoute.startStop.id, selectedRoute.startStop);
        if (selectedRoute.endStop) stopsMap.set(selectedRoute.endStop.id, selectedRoute.endStop);
        selectedRoute.versions?.[0]?.routeStops?.forEach((rs: any) => {
            if (rs.stop) stopsMap.set(rs.stop.id, rs.stop);
        });
        availableStops = Array.from(stopsMap.values());
    } else {
        availableStops = stopsData;
    }

    useEffect(() => {
        if (editData) {
            setFormData({
                routeId: editData.routeId || '',
                fromStopId: editData.fromStopId || '',
                toStopId: editData.toStopId || '',
                basePrice: editData.basePrice || 0,
                peakPrice: editData.peakPrice || undefined,
                offPeakPrice: editData.offPeakPrice || undefined,
                effectiveFrom: editData.effectiveFrom?.split('T')[0] || new Date().toISOString().split('T')[0],
                effectiveUntil: editData.effectiveUntil?.split('T')[0] || '',
            });
        } else {
            setFormData({
                routeId: '',
                fromStopId: '',
                toStopId: '',
                basePrice: 0,
                peakPrice: undefined,
                offPeakPrice: undefined,
                effectiveFrom: new Date().toISOString().split('T')[0],
                effectiveUntil: '',
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.routeId) {
            newErrors.routeId = 'Route is required';
        }

        if (!formData.fromStopId) {
            newErrors.fromStopId = 'Origin stop is required';
        }

        if (!formData.toStopId) {
            newErrors.toStopId = 'Destination stop is required';
        }

        if (formData.fromStopId && formData.toStopId && formData.fromStopId === formData.toStopId) {
            newErrors.toStopId = 'Destination must be different from origin';
        }

        if (!formData.basePrice || formData.basePrice <= 0) {
            newErrors.basePrice = 'Base price must be greater than 0';
        }

        if (formData.peakPrice !== undefined && formData.peakPrice < formData.basePrice) {
            newErrors.peakPrice = 'Peak price must be greater than or equal to base price';
        }

        if (formData.offPeakPrice !== undefined && formData.offPeakPrice > formData.basePrice) {
            newErrors.offPeakPrice = 'Off-peak price must be less than or equal to base price';
        }

        if (!formData.effectiveFrom) {
            newErrors.effectiveFrom = 'Effective from date is required';
        }

        if (formData.effectiveFrom && formData.effectiveUntil && formData.effectiveFrom >= formData.effectiveUntil) {
            newErrors.effectiveUntil = 'Effective until must be after effective from date';
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
            routeId: '',
            fromStopId: '',
            toStopId: '',
            basePrice: 0,
            peakPrice: undefined,
            offPeakPrice: undefined,
            effectiveFrom: new Date().toISOString().split('T')[0],
            effectiveUntil: '',
        });
        setErrors({});
    };

    const handleChange = (field: keyof PricingFormData, value: any) => {
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
                        {editData ? 'Edit Price' : 'New Price'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form id="pricing-form" onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Route */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Route <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.routeId}
                            onChange={(e) => handleChange('routeId', e.target.value)}
                            className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.routeId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                        >
                            <option value="">Select route</option>
                            {routesData.map((route) => (
                                <option key={route.id} value={route.id}>
                                    {route.routeName}
                                </option>
                            ))}
                        </select>
                        {errors.routeId && (
                            <p className="mt-1 text-sm text-red-500">{errors.routeId}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* From Stop */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                From Stop <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.fromStopId}
                                onChange={(e) => handleChange('fromStopId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.fromStopId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            >
                                <option value="">Select origin</option>
                                {availableStops.map((stop) => (
                                    <option key={stop.id} value={stop.id}>
                                        {stop.stopName}
                                    </option>
                                ))}
                            </select>
                            {errors.fromStopId && (
                                <p className="mt-1 text-sm text-red-500">{errors.fromStopId}</p>
                            )}
                        </div>

                        {/* To Stop */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                To Stop <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.toStopId}
                                onChange={(e) => handleChange('toStopId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.toStopId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            >
                                <option value="">Select destination</option>
                                {availableStops.map((stop) => (
                                    <option
                                        key={stop.id}
                                        value={stop.id}
                                        disabled={stop.id === formData.fromStopId}
                                    >
                                        {stop.stopName}
                                    </option>
                                ))}
                            </select>
                            {errors.toStopId && (
                                <p className="mt-1 text-sm text-red-500">{errors.toStopId}</p>
                            )}
                        </div>
                    </div>

                    {/* Price Fields */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Base Price */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Base Price (ETB) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.basePrice || ''}
                                onChange={(e) => handleChange('basePrice', parseFloat(e.target.value) || 0)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.basePrice ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.basePrice && (
                                <p className="mt-1 text-sm text-red-500">{errors.basePrice}</p>
                            )}
                        </div>

                        {/* Peak Price */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Peak Price (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.peakPrice ?? ''}
                                onChange={(e) => handleChange('peakPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.peakPrice ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.peakPrice && (
                                <p className="mt-1 text-sm text-red-500">{errors.peakPrice}</p>
                            )}
                        </div>

                        {/* Off-Peak Price */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Off-Peak (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.offPeakPrice ?? ''}
                                onChange={(e) => handleChange('offPeakPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.offPeakPrice ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.offPeakPrice && (
                                <p className="mt-1 text-sm text-red-500">{errors.offPeakPrice}</p>
                            )}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Effective From */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Effective From <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveFrom}
                                onChange={(e) => handleChange('effectiveFrom', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.effectiveFrom ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.effectiveFrom && (
                                <p className="mt-1 text-sm text-red-500">{errors.effectiveFrom}</p>
                            )}
                        </div>

                        {/* Effective Until */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Effective Until (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveUntil}
                                onChange={(e) => handleChange('effectiveUntil', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.effectiveUntil ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.effectiveUntil && (
                                <p className="mt-1 text-sm text-red-500">{errors.effectiveUntil}</p>
                            )}
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Leave empty for indefinite</p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-900 dark:text-yellow-500/90">
                                <p className="font-medium mb-1">Pricing Rules:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-xs opacity-90">
                                    <li>Peak price must be ≥ base price</li>
                                    <li>Off-peak price must be ≤ base price</li>
                                    <li>Effective until date is optional</li>
                                </ul>
                            </div>
                        </div>
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
                        form="pricing-form"
                        className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                        {editData ? 'Update Price' : 'Create Price'}
                    </button>
                </div>
            </div>
        </div>
    );
}
