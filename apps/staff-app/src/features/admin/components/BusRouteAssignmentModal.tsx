import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { busService } from '@/services/bus.service';
import { routeService } from '@/services/route.service';

interface BusRouteAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssignmentFormData) => void;
    editData?: any;
}

interface AssignmentFormData {
    busId: string;
    routeId: string;
    versionId: string;
    assignedDate: string;
    endDate?: string;
}

export function BusRouteAssignmentModal({ isOpen, onClose, onSubmit, editData }: BusRouteAssignmentModalProps) {
    const [formData, setFormData] = useState<AssignmentFormData>({
        busId: '',
        routeId: '',
        versionId: '',
        assignedDate: new Date().toISOString().split('T')[0],
        endDate: '',
    });

    useEffect(() => {
        if (editData) {
            setFormData({
                busId: editData.busId || '',
                routeId: editData.routeId || '',
                versionId: editData.versionId || '',
                assignedDate: editData.assignedDate ? new Date(editData.assignedDate).toISOString().split('T')[0] : '',
                endDate: editData.endDate ? new Date(editData.endDate).toISOString().split('T')[0] : '',
            });
        } else {
            setFormData({
                busId: '',
                routeId: '',
                versionId: '',
                assignedDate: new Date().toISOString().split('T')[0],
                endDate: '',
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const { data: buses = [], isLoading: busesLoading } = useQuery({
        queryKey: ['buses-simple'],
        queryFn: () => busService.getAll(),
        enabled: isOpen,
    });

    const { data: routesData = [], isLoading: routesLoading } = useQuery({
        queryKey: ['routes-simple'],
        queryFn: () => routeService.getAll(),
        enabled: isOpen,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.busId) {
            newErrors.busId = 'Bus is required';
        }

        if (!formData.routeId) {
            newErrors.routeId = 'Route is required';
        }

        if (!formData.assignedDate) {
            newErrors.assignedDate = 'Assigned date is required';
        }

        // Validate end date is after assigned date
        if (formData.endDate && formData.assignedDate) {
            const start = new Date(formData.assignedDate);
            const end = new Date(formData.endDate);
            if (end <= start) {
                newErrors.endDate = 'End date must be after assigned date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Use first route version if available, else pass empty string
        const routeObj = (routesData as any[]).find((r: any) => r.id === formData.routeId);
        const versionId = routeObj?.versions?.[0]?.id || formData.versionId || '';

        const submitData: AssignmentFormData = {
            ...formData,
            versionId,
            endDate: formData.endDate || undefined,
        };

        onSubmit(submitData);

        // Reset form
        setFormData({
            busId: '',
            routeId: '',
            versionId: '',
            assignedDate: new Date().toISOString().split('T')[0],
            endDate: '',
        });
        setErrors({});
    };

    const handleChange = (field: keyof AssignmentFormData, value: any) => {
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

    const selectedBus = buses.find((b: any) => b.id === formData.busId);
    const compatibleRoutes = (routesData as any[]).filter(r => {
        if (!selectedBus?.terminalId) return false;
        const startTerminal = r.startStop?.terminalId;
        const endTerminal = r.endStop?.terminalId;
        return startTerminal === selectedBus.terminalId || endTerminal === selectedBus.terminalId;
    });
    
    // Sort array by name for cleaner display
    const sortByName = (a: any, b: any) => (a.routeName || a.name || '').localeCompare(b.routeName || b.name || '');
    const compatibleSorted = [...compatibleRoutes].sort(sortByName);
    
    const otherRoutes = (routesData as any[]).filter(r => !compatibleRoutes.find(cr => cr.id === r.id)).sort(sortByName);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {editData ? 'Edit Assignment' : 'New Bus-Route Assignment'}
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
                        {/* Bus */}
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
                                {buses.map((bus: any) => (
                                    <option key={bus.id} value={bus.id}>
                                        {bus.plateNumber}
                                    </option>
                                ))}
                            </select>
                            {errors.busId && (
                                <p className="mt-1 text-sm text-red-500">{errors.busId}</p>
                            )}
                        </div>

                        {/* Route */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Route <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.routeId}
                                onChange={(e) => handleChange('routeId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.routeId ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                                disabled={routesLoading || !formData.busId}
                            >
                                <option value="">
                                    {!formData.busId ? 'Select a bus first...' : (routesLoading ? 'Loading routes...' : 'Select a route')}
                                </option>
                                
                                {formData.busId && compatibleSorted.length > 0 && (
                                    <optgroup label="Compatible Routes (Matches Bus Terminal)">
                                        {compatibleSorted.map((route: any) => (
                                            <option key={route.id} value={route.id}>
                                                {route.routeName || route.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                
                                <optgroup label={formData.busId && compatibleSorted.length > 0 ? "Other Routes (Cross-Terminal Warning)" : "All Routes"}>
                                    {otherRoutes.map((route: any) => (
                                        <option key={route.id} value={route.id}>
                                            {route.routeName || route.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            {errors.routeId && (
                                <p className="mt-1 text-sm text-red-500">{errors.routeId}</p>
                            )}
                        </div>

                        {/* Assigned Date */}
                        <div>
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

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.endDate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.endDate && (
                                <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Leave empty for ongoing assignment
                            </p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> This will assign the selected bus to the selected route.
                            The assignment will be active from the assigned date. If an end date is specified,
                            the assignment will automatically become inactive after that date.
                        </p>
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
                            {editData ? 'Update Assignment' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
