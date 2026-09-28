import { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tripService } from '@/services/trip.service';

interface IncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: IncidentFormData) => void;
}

interface IncidentFormData {
    tripId: string;
    incidentType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
    latitude?: number;
    longitude?: number;
    photoUrl?: string;
}


const incidentTypes = [
    'Mechanical Failure',
    'Accident',
    'Passenger Complaint',
    'Traffic Violation',
    'Delay',
    'Medical Emergency',
    'Equipment Malfunction',
    'Security Issue',
    'Weather Related',
    'Other',
];

export function IncidentModal({ isOpen, onClose, onSubmit }: IncidentModalProps) {
    const [formData, setFormData] = useState<IncidentFormData>({
        tripId: '',
        incidentType: '',
        severity: 'medium',
        description: '',
        latitude: undefined,
        longitude: undefined,
        photoUrl: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.tripId) {
            newErrors.tripId = 'Trip is required';
        }

        if (!formData.incidentType) {
            newErrors.incidentType = 'Incident type is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const { data: activeTrips = [], isLoading: tripsLoading } = useQuery({
        queryKey: ['activeTrips'],
        queryFn: () => tripService.getAll({ status: 'in_progress' }), // Assuming we only report on active/recently active. Feel free to remove status to show all.
        enabled: isOpen,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitData: IncidentFormData = {
            ...formData,
            description: formData.description || undefined,
            latitude: formData.latitude || undefined,
            longitude: formData.longitude || undefined,
            photoUrl: formData.photoUrl || undefined,
        };

        onSubmit(submitData);

        // Reset form
        setFormData({
            tripId: '',
            incidentType: '',
            severity: 'medium',
            description: '',
            latitude: undefined,
            longitude: undefined,
            photoUrl: '',
        });
        setErrors({});
    };

    const handleChange = (field: keyof IncidentFormData, value: any) => {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Report New Incident</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Trip */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trip <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.tripId}
                                onChange={(e) => handleChange('tripId', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.tripId ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            >
                                <option value="">Select a trip</option>
                                {tripsLoading ? (
                                    <option value="" disabled>Loading trips...</option>
                                ) : (
                                    activeTrips.map((trip) => (
                                        <option key={trip.id} value={trip.id}>
                                            {trip.tripNumber} - {trip.bus?.plateNumber} ({trip.driver?.fullName})
                                        </option>
                                    ))
                                )}
                            </select>
                            {errors.tripId && (
                                <p className="mt-1 text-sm text-red-500">{errors.tripId}</p>
                            )}
                        </div>

                        {/* Incident Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Incident Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.incidentType}
                                onChange={(e) => handleChange('incidentType', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.incidentType ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            >
                                <option value="">Select type</option>
                                {incidentTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            {errors.incidentType && (
                                <p className="mt-1 text-sm text-red-500">{errors.incidentType}</p>
                            )}
                        </div>

                        {/* Severity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Severity <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.severity}
                                onChange={(e) => handleChange('severity', e.target.value as any)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Describe the incident..."
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Latitude (Optional)
                            </label>
                            <input
                                type="number"
                                step="any"
                                placeholder="e.g., 9.0084"
                                value={formData.latitude || ''}
                                onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Longitude (Optional)
                            </label>
                            <input
                                type="number"
                                step="any"
                                placeholder="e.g., 38.7636"
                                value={formData.longitude || ''}
                                onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Photo Upload */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Photo (Optional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            handleChange('photoUrl', reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                            />
                            {formData.photoUrl && formData.photoUrl.startsWith('data:') && (
                                <img src={formData.photoUrl} alt="Preview" className="mt-2 h-24 object-cover rounded shadow-sm" />
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 text-sm font-medium text-white bg-[#2D4A8E] rounded-lg hover:bg-[#243a70] transition-colors"
                        >
                            Report Incident
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
