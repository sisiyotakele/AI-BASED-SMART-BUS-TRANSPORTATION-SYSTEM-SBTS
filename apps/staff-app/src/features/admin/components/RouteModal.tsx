import { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { Route } from '@/types';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Terminal {
    id: string;
    terminalName: string;
    address?: string;
}

// Fetch all terminals
const fetchTerminals = async () => {
    const { data } = await api.get('/terminals');
    return data.data || [];
};

interface RouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RouteFormData) => void;
    editData?: Route | null;
}

interface RouteFormData {
    routeName: string;
    description?: string;
    startTerminalId: string;
    endTerminalId: string;
    status: string;
}

export function RouteModal({ isOpen, onClose, onSubmit, editData }: RouteModalProps) {
    const [formData, setFormData] = useState<RouteFormData>({
        routeName: '',
        description: '',
        startTerminalId: '',
        endTerminalId: '',
        status: 'active',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedStartTerminal, setSelectedStartTerminal] = useState<string>('');
    const [selectedEndTerminal, setSelectedEndTerminal] = useState<string>('');

    // Fetch terminals
    const { data: terminals = [] } = useQuery({
        queryKey: ['terminals'],
        queryFn: fetchTerminals,
        staleTime: 5 * 60 * 1000,
    });

    // Auto-generate route name when both terminals are selected
    useEffect(() => {
        if (selectedStartTerminal && selectedEndTerminal) {
            const startTerminal = terminals.find((t: Terminal) => t.id === selectedStartTerminal);
            const endTerminal = terminals.find((t: Terminal) => t.id === selectedEndTerminal);

            if (startTerminal && endTerminal) {
                const autoName = `${startTerminal.terminalName} ↔ ${endTerminal.terminalName}`;
                setFormData(prev => ({
                    ...prev,
                    routeName: autoName,
                    startTerminalId: selectedStartTerminal,
                    endTerminalId: selectedEndTerminal
                }));
            }
        }
    }, [selectedStartTerminal, selectedEndTerminal, terminals]);

    useEffect(() => {
        if (editData) {
            setFormData({
                routeName: editData.routeName || '',
                description: editData.description || '',
                startTerminalId: editData.startTerminalId || '',
                endTerminalId: editData.endTerminalId || '',
                status: (editData as any).status || 'active',
            });
            setSelectedStartTerminal(editData.startTerminalId || '');
            setSelectedEndTerminal(editData.endTerminalId || '');
        } else {
            setFormData({
                routeName: '',
                description: '',
                startTerminalId: '',
                endTerminalId: '',
                status: 'active',
            });
            setSelectedStartTerminal('');
            setSelectedEndTerminal('');
        }
        setErrors({});
    }, [editData, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedStartTerminal) {
            newErrors.startTerminal = 'Starting terminal is required';
        }

        if (!selectedEndTerminal) {
            newErrors.endTerminal = 'Destination terminal is required';
        }

        if (selectedStartTerminal && selectedEndTerminal && selectedStartTerminal === selectedEndTerminal) {
            newErrors.endTerminal = 'Destination must be different from starting terminal';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Send only terminal IDs and description - route name is auto-generated
        const submitData = {
            routeName: formData.routeName,
            description: formData.description,
            startTerminalId: formData.startTerminalId,
            endTerminalId: formData.endTerminalId,
            status: formData.status,
        };

        onSubmit(submitData);

        // Reset form
        setFormData({
            routeName: '',
            description: '',
            startTerminalId: '',
            endTerminalId: '',
            status: 'active',
        });
        setSelectedStartTerminal('');
        setSelectedEndTerminal('');
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
                    {/* Starting & Destination Terminals - First */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Starting Terminal */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Starting Terminal <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedStartTerminal}
                                    onChange={(e) => {
                                        setSelectedStartTerminal(e.target.value);
                                        if (errors.startTerminal) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.startTerminal;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                    className={`w-full px-3 py-1.5 pl-9 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm appearance-none cursor-pointer ${errors.startTerminal ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                >
                                    <option value="">-- Select Starting Terminal --</option>
                                    {terminals.map((terminal: Terminal) => (
                                        <option key={terminal.id} value={terminal.id}>
                                            {terminal.terminalName}
                                        </option>
                                    ))}
                                </select>
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            </div>
                            {errors.startTerminal && (
                                <p className="mt-1 text-sm text-red-500">{errors.startTerminal}</p>
                            )}
                        </div>

                        {/* Destination Terminal */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Destination Terminal <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedEndTerminal}
                                    onChange={(e) => {
                                        setSelectedEndTerminal(e.target.value);
                                        if (errors.endTerminal) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.endTerminal;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                    className={`w-full px-3 py-1.5 pl-9 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm appearance-none cursor-pointer ${errors.endTerminal ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                >
                                    <option value="">-- Select Destination Terminal --</option>
                                    {terminals.map((terminal: Terminal) => (
                                        <option
                                            key={terminal.id}
                                            value={terminal.id}
                                            disabled={terminal.id === selectedStartTerminal}
                                        >
                                            {terminal.terminalName}
                                        </option>
                                    ))}
                                </select>
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            </div>
                            {errors.endTerminal && (
                                <p className="mt-1 text-sm text-red-500">{errors.endTerminal}</p>
                            )}
                        </div>
                    </div>

                    {/* Route Name - Auto-generated, Read-only */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Route Name (Auto-generated)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.routeName}
                                readOnly
                                placeholder="Select terminals to see route name..."
                                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-navy-600 text-sm cursor-not-allowed"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                                ↔ Bidirectional
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Route name is automatically generated from selected terminals
                        </p>
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

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-500/90 leading-relaxed">
                            <strong className="font-semibold text-blue-950 dark:text-blue-400">Note:</strong> This creates a bidirectional route. Both Forward (A→B) and Backward (B→A) directions will have their own Route 1. You can add stops to each direction independently and create additional route variants (Route 2, Route 3...) as alternatives.
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
