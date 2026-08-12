import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TerminalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TerminalFormData) => void;
    editData?: any;
}

interface TerminalFormData {
    terminalName: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
    facilities?: string;
    status?: string;
    phoneNumber?: string;
    managerName?: string;
    email?: string;
}

export function TerminalModal({ isOpen, onClose, onSubmit, editData }: TerminalModalProps) {
    const [formData, setFormData] = useState<TerminalFormData>({
        terminalName: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        capacity: undefined,
        facilities: '',
        status: 'active',
        phoneNumber: '',
        managerName: '',
        email: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (editData) {
            setFormData({
                terminalName: editData.terminalName || '',
                address: editData.address || '',
                latitude: editData.latitude || undefined,
                longitude: editData.longitude || undefined,
                capacity: editData.capacity || undefined,
                facilities: editData.facilities || '',
                status: editData.status || 'active',
                phoneNumber: editData.phoneNumber || '',
                managerName: editData.managerName || '',
                email: editData.email || '',
            });
        } else {
            setFormData({
                terminalName: '',
                address: '',
                latitude: undefined,
                longitude: undefined,
                capacity: undefined,
                facilities: '',
                status: 'active',
                phoneNumber: '',
                managerName: '',
                email: '',
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.terminalName.trim()) {
            newErrors.terminalName = 'Terminal name is required';
        } else if (formData.terminalName.length > 255) {
            newErrors.terminalName = 'Terminal name must be less than 255 characters';
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

        if (formData.capacity !== undefined && formData.capacity <= 0) {
            newErrors.capacity = 'Capacity must be a positive number';
        }

        if (formData.phoneNumber && formData.phoneNumber.length > 20) {
            newErrors.phoneNumber = 'Phone number must be less than 20 characters';
        }

        if (formData.managerName && formData.managerName.length > 255) {
            newErrors.managerName = 'Manager name must be less than 255 characters';
        }

        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Invalid email format';
            } else if (formData.email.length > 255) {
                newErrors.email = 'Email must be less than 255 characters';
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

        onSubmit(formData);

        // Reset form
        setFormData({
            terminalName: '',
            address: '',
            latitude: undefined,
            longitude: undefined,
            capacity: undefined,
            facilities: '',
            status: 'active',
            phoneNumber: '',
            managerName: '',
            email: '',
        });
        setErrors({});
    };

    const handleChange = (field: keyof TerminalFormData, value: any) => {
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
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-slate-200 dark:border-navy-700 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700 shrink-0">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {editData ? 'Edit Terminal' : 'New Terminal'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form id="terminal-form" onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto">
                    {/* Terminal Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Terminal Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.terminalName}
                            onChange={(e) => handleChange('terminalName', e.target.value)}
                            placeholder="e.g., Central Terminal"
                            className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.terminalName ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                        />
                        {errors.terminalName && (
                            <p className="mt-1 text-sm text-red-500">{errors.terminalName}</p>
                        )}
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

                    {/* Capacity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Bus Capacity (Optional)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.capacity ?? ''}
                            onChange={(e) => handleChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="e.g., 50"
                            className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.capacity ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                        />
                        {errors.capacity && (
                            <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Maximum number of buses this terminal can accommodate</p>
                    </div>

                    {/* Facilities */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Facilities (Optional)
                        </label>
                        <textarea
                            value={formData.facilities}
                            onChange={(e) => handleChange('facilities', e.target.value)}
                            placeholder="e.g., Waiting Area, Restrooms, Ticket Office, Parking, WiFi"
                            rows={3}
                            className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">List available facilities separated by commas</p>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Operational Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Under Maintenance</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                placeholder="e.g., +251911234567"
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.phoneNumber ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.phoneNumber && (
                                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                            )}
                        </div>

                        {/* Manager Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Manager Name (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.managerName}
                                onChange={(e) => handleChange('managerName', e.target.value)}
                                placeholder="e.g., John Doe"
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.managerName ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.managerName && (
                                <p className="mt-1 text-sm text-red-500">{errors.managerName}</p>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email (Optional)
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="e.g., terminal@sbts.com"
                            className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-500/90 leading-relaxed">
                            <strong className="font-semibold text-blue-950 dark:text-blue-400">Note:</strong> Terminals serve as major hubs for buses and stops. Contact information helps with coordination and communication.
                        </p>
                    </div>
                </form>

                <div className="p-4 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3 bg-slate-50 dark:bg-navy-800/50 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors border border-slate-300 dark:border-navy-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="terminal-form"
                        className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                        {editData ? 'Update Terminal' : 'Create Terminal'}
                    </button>
                </div>
            </div>
        </div>
    );
}
