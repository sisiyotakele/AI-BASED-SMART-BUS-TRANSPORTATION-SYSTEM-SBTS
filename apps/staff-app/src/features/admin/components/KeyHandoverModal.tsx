import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { busService } from '@/services/bus.service';
import { terminalsApi } from '@/services/api/terminals.api';
import { shiftService } from '@/services/shift.service';

interface KeyHandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: HandoverFormData) => void;
}

interface HandoverFormData {
    busId: string;
    terminalId: string;
    fromShiftId?: string;
    toShiftId: string;
    handoverTime: string;
    notes?: string;
}

export function KeyHandoverModal({ isOpen, onClose, onSubmit }: KeyHandoverModalProps) {
    const [formData, setFormData] = useState<HandoverFormData>({
        busId: '',
        terminalId: '',
        fromShiftId: '',
        toShiftId: '',
        handoverTime: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch dynamic data
    const { data: buses = [], isLoading: isLoadingBuses } = useQuery({
        queryKey: ['buses'],
        queryFn: () => busService.getAll()
    });

    const { data: terminals = [], isLoading: isLoadingTerminals } = useQuery({
        queryKey: ['terminals'],
        queryFn: () => terminalsApi.getAll()
    });

    const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => shiftService.getAll()
    });

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.busId) newErrors.busId = 'Bus is required';
        if (!formData.terminalId) newErrors.terminalId = 'Terminal is required';
        if (!formData.toShiftId) newErrors.toShiftId = 'Incoming shift is required';
        if (!formData.handoverTime) newErrors.handoverTime = 'Handover time is required';

        if (formData.fromShiftId === formData.toShiftId && formData.toShiftId) {
            newErrors.toShiftId = 'Incoming shift cannot be the same as outgoing shift';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        const submitData: HandoverFormData = {
            ...formData,
            fromShiftId: formData.fromShiftId || undefined,
            notes: formData.notes || undefined,
            handoverTime: new Date(formData.handoverTime).toISOString(),
        };

        onSubmit(submitData);

        // Reset form
        setFormData({
            busId: '',
            terminalId: '',
            fromShiftId: '',
            toShiftId: '',
            handoverTime: '',
            notes: '',
        });
        setErrors({});
    };

    const handleChange = (field: keyof HandoverFormData, value: any) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };
            
            // Auto-select the bus's home terminal if the bus changes and no terminal is selected,
            // or if we want to default to the newly selected bus's home terminal.
            if (field === 'busId') {
                const selectedBus = buses.find(b => b.id === value);
                if (selectedBus?.terminalId) {
                    newData.terminalId = selectedBus.terminalId;
                }
            }
            
            return newData;
        });

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const selectedBus = buses.find(b => b.id === formData.busId);

    const isLoading = isLoadingBuses || isLoadingTerminals || isLoadingShifts;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Key Handover</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-navy-800 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">Loading components...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Bus */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Bus <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.busId}
                                    onChange={(e) => handleChange('busId', e.target.value)}
                                    className={`w-full px-3 py-2 bg-white dark:bg-navy-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.busId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                >
                                    <option value="">Select a bus</option>
                                    {buses.map((bus) => (
                                        <option key={bus.id} value={bus.id}>
                                            {bus.plateNumber} {bus.model ? `(${bus.model})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.busId && (
                                    <p className="mt-1 text-sm text-red-500">{errors.busId}</p>
                                )}
                            </div>

                            {/* Terminal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Terminal Location <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.terminalId}
                                    onChange={(e) => handleChange('terminalId', e.target.value)}
                                    className={`w-full px-3 py-2 bg-white dark:bg-navy-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.terminalId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                >
                                    <option value="">Select a terminal</option>
                                    {terminals.map((terminal) => {
                                        const isHomeTerminal = selectedBus && selectedBus.terminalId === terminal.id;
                                        return (
                                            <option 
                                                key={terminal.id} 
                                                value={terminal.id}
                                                className={isHomeTerminal ? "font-bold text-cyan-600 bg-cyan-50 dark:bg-navy-700" : ""}
                                            >
                                                {terminal.terminalName} {isHomeTerminal ? '(Home Terminal)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                {errors.terminalId && (
                                    <p className="mt-1 text-sm text-red-500">{errors.terminalId}</p>
                                )}
                            </div>

                            {/* From Shift */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Outgoing Shift (Optional)
                                </label>
                                <select
                                    value={formData.fromShiftId}
                                    onChange={(e) => handleChange('fromShiftId', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-navy-800 text-gray-900 dark:text-white border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="">No outgoing shift (Depot)</option>
                                    {shifts.map((shift) => (
                                        <option key={shift.id} value={shift.id}>
                                            {shift.shiftName} - {shift.driver?.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* To Shift */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Incoming Shift <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.toShiftId}
                                    onChange={(e) => handleChange('toShiftId', e.target.value)}
                                    className={`w-full px-3 py-2 bg-white dark:bg-navy-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.toShiftId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                >
                                    <option value="">Select a shift</option>
                                    {shifts.map((shift) => (
                                        <option key={shift.id} value={shift.id}>
                                            {shift.shiftName} - {shift.driver?.fullName}
                                        </option>
                                    ))}
                                </select>
                                {errors.toShiftId && (
                                    <p className="mt-1 text-sm text-red-500">{errors.toShiftId}</p>
                                )}
                            </div>

                            {/* Handover Time */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Handover Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.handoverTime}
                                    onChange={(e) => handleChange('handoverTime', e.target.value)}
                                    className={`w-full px-3 py-2 bg-white dark:bg-navy-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.handoverTime ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                />
                                {errors.handoverTime && (
                                    <p className="mt-1 text-sm text-red-500">{errors.handoverTime}</p>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Any special instructions or observations..."
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-navy-800 text-gray-900 dark:text-white border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-navy-700 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Handover
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
