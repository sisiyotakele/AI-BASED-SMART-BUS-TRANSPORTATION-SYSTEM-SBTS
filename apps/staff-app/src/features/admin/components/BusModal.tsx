import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Terminal } from '@/services/api/terminals.api';
import { Bus } from '@/types';

interface BusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Bus>) => void;
    bus?: Bus | null;
    terminals: Terminal[];
}

export function BusModal({ isOpen, onClose, onSubmit, bus, terminals }: BusModalProps) {
    const [formData, setFormData] = useState<Partial<Bus>>({
        plateNumber: '',
        model: 'Standard',
        maintenanceStatus: 'operational',
        terminalId: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (bus) {
            setFormData({
                plateNumber: bus.plateNumber,
                model: bus.model || 'Standard',
                maintenanceStatus: bus.maintenanceStatus,
                terminalId: bus.terminalId || '',
            });
        } else {
            setFormData({
                plateNumber: '',
                model: 'Standard',
                maintenanceStatus: 'operational',
                terminalId: '',
            });
        }
        setErrors({});
    }, [bus, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.plateNumber || !formData.plateNumber.trim()) {
            newErrors.plateNumber = 'Plate number is required';
        }

        if (!formData.terminalId) {
            newErrors.terminalId = 'Assigned terminal is required';
        }

        if (!formData.model) {
            newErrors.model = 'Bus model is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitData = {
            ...formData,
            terminalId: formData.terminalId || undefined,
        };

        onSubmit(submitData);
    };

    const handleChange = (field: keyof Bus, value: any) => {
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
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto border border-slate-200 dark:border-navy-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {bus ? 'Edit Bus' : 'Add New Bus'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form id="bus-form" onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Plate Number */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Plate Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., AA-SB-001"
                            value={formData.plateNumber || ''}
                            onChange={(e) => handleChange('plateNumber', e.target.value)}
                            className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.plateNumber ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                        />
                        {errors.plateNumber && (
                            <p className="mt-1 text-sm text-red-500">{errors.plateNumber}</p>
                        )}
                    </div>

                    {/* Bus Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Bus Model <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.model || 'Standard'}
                            onChange={(e) => handleChange('model', e.target.value)}
                            className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.model ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                        >
                            <option value="Standard">Standard</option>
                            <option value="Double Standard">Double Standard</option>
                        </select>
                        {errors.model && (
                            <p className="mt-1 text-sm text-red-500">{errors.model}</p>
                        )}
                    </div>

                    {/* Maintenance Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Maintenance Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.maintenanceStatus || 'operational'}
                            onChange={(e) => handleChange('maintenanceStatus', e.target.value as any)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            <option value="operational">Operational</option>
                            <option value="in_maintenance">In Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>

                    {/* Terminal */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Assigned Terminal <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.terminalId || ''}
                            onChange={(e) => handleChange('terminalId', e.target.value)}
                            className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.terminalId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                        >
                            <option value="" disabled>Select terminal</option>
                            {terminals.map((terminal) => (
                                <option key={terminal.id} value={terminal.id}>
                                    {terminal.terminalName}
                                </option>
                            ))}
                        </select>
                        {errors.terminalId && (
                            <p className="mt-1 text-sm text-red-500">{errors.terminalId}</p>
                        )}
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
                        form="bus-form"
                        className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                        {bus ? 'Update Bus' : 'Add Bus'}
                    </button>
                </div>
            </div>
        </div>
    );
}
