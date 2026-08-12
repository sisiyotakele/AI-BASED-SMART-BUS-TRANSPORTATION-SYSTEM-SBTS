import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { busService } from '@/services/bus.service';
import { shiftService } from '@/services/shift.service';

interface BusDriverAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssignmentFormData) => void;
    editData?: Partial<AssignmentFormData> | null;
}

interface AssignmentFormData {
    busId: string;
    shiftId: string;
    assignedDate: string;
    status: 'active' | 'cancelled';
}

const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export function BusDriverAssignmentModal({ isOpen, onClose, onSubmit, editData }: BusDriverAssignmentModalProps) {
    const [formData, setFormData] = useState<AssignmentFormData>({
        busId: '',
        shiftId: '',
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'active',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedShift, setSelectedShift] = useState<any | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    busId: editData.busId || '',
                    shiftId: editData.shiftId || '',
                    assignedDate: editData.assignedDate || new Date().toISOString().split('T')[0],
                    status: editData.status || 'active',
                });
            } else {
                setFormData({
                    busId: '',
                    shiftId: '',
                    assignedDate: new Date().toISOString().split('T')[0],
                    status: 'active',
                });
            }
            setErrors({});
        }
    }, [isOpen, editData]);

    const { data: buses = [], isLoading: busesLoading } = useQuery({
        queryKey: ['buses-modal'],
        queryFn: () => busService.getAll(),
        enabled: isOpen,
    });

    const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
        queryKey: ['shifts-modal'],
        queryFn: () => shiftService.getAll(),
        enabled: isOpen,
    });

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.busId) {
            newErrors.busId = 'Bus is required';
        }

        if (!formData.shiftId) {
            newErrors.shiftId = 'Shift is required';
        }

        if (!formData.assignedDate) {
            newErrors.assignedDate = 'Assigned date is required';
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
            busId: '',
            shiftId: '',
            assignedDate: new Date().toISOString().split('T')[0],
            status: 'active',
        });
        setSelectedShift(null);
        setErrors({});
    };

    const handleChange = (field: keyof AssignmentFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Update selected shift when shift changes
        if (field === 'shiftId') {
            const shift = (shifts as any[]).find((s: any) => s.id === value);
            setSelectedShift(shift || null);
            // Auto-set assigned date to shift date
            if (shift?.shiftDate) {
                setFormData((prev) => ({ ...prev, assignedDate: shift.shiftDate.split('T')[0] }));
            }
        }

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const selectedBus = (buses as any[]).find((b: any) => b.id === formData.busId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {editData ? 'Edit Driver Assignment' : 'New Driver Assignment'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-navy-800 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Shift (First) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Shift (Driver) <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.shiftId}
                                onChange={(e) => handleChange('shiftId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.shiftId ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                                disabled={shiftsLoading}
                            >
                                <option value="">{shiftsLoading ? 'Loading shifts...' : 'Select a shift'}</option>
                                {(shifts as any[]).map((shift: any) => (
                                    <option key={shift.id} value={shift.id}>
                                        {shift.driver?.fullName || 'Unknown Driver'} - {shift.shiftName} ({formatTime(shift.shiftStart)} - {formatTime(shift.shiftEnd)})
                                    </option>
                                ))}
                            </select>
                            {errors.shiftId && (
                                <p className="mt-1 text-sm text-red-500">{errors.shiftId}</p>
                            )}
                        </div>

                        {/* Bus (Second) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Bus <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.busId}
                                onChange={(e) => handleChange('busId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.busId ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                                disabled={busesLoading}
                            >
                                <option value="">{busesLoading ? 'Loading buses...' : 'Select a bus'}</option>
                                {(buses as any[])
                                    .filter((bus: any) => bus.maintenanceStatus === 'operational')
                                    .map((bus: any) => (
                                    <option key={bus.id} value={bus.id}>
                                        {bus.plateNumber}
                                    </option>
                                ))}
                            </select>
                            {errors.busId && (
                                <p className="mt-1 text-sm text-red-500">{errors.busId}</p>
                            )}
                        </div>

                        {/* Assigned Date */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Assigned Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.assignedDate}
                                onChange={(e) => handleChange('assignedDate', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.assignedDate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.assignedDate && (
                                <p className="mt-1 text-sm text-red-500">{errors.assignedDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Selected Shift Info */}
                    {selectedShift && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Shift Details:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-300">
                                <div>
                                    <span className="font-medium text-blue-900 dark:text-blue-100">Driver:</span> {selectedShift.driver?.fullName || 'Unknown'}
                                </div>
                                <div>
                                    <span className="font-medium text-blue-900 dark:text-blue-100">Shift:</span> {selectedShift.shiftName}
                                </div>
                                <div>
                                    <span className="font-medium text-blue-900 dark:text-blue-100">Time:</span> {formatTime(selectedShift.shiftStart)} - {formatTime(selectedShift.shiftEnd)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
                        <p className="text-sm text-yellow-900 dark:text-yellow-200">
                            <strong>Important:</strong> The system will verify:
                        </p>
                        <ul className="text-sm text-yellow-800 dark:text-yellow-300 mt-2 space-y-1 ml-4 list-disc">
                            <li>Bus is operational</li>
                            <li>Driver's license is not expired</li>
                            <li>Bus is not already assigned on this date</li>
                            <li>Shift is not already assigned to another bus on this date</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-900 border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 text-sm font-medium text-white bg-[#2D4A8E] rounded-lg hover:bg-[#243a70] transition-colors"
                        >
                            {editData ? 'Update Assignment' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
