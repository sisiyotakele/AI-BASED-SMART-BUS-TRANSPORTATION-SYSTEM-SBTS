import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Driver } from '@/types';
import { Terminal } from '@/services/api/terminals.api';

interface DriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Driver> & { password?: string }) => void;
    driver?: Driver | null;
    terminals: Terminal[];
}

export function DriverModal({ isOpen, onClose, onSubmit, driver, terminals }: DriverModalProps) {
    const [formData, setFormData] = useState<Partial<Driver> & { password?: string }>({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        licenseNumber: '',
        licenseExpiry: '',
        homeTerminalId: '',
        department: '',
        preferredLanguage: '',
        isActive: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (driver) {
            setFormData({
                fullName: driver.fullName,
                email: driver.email,
                phone: driver.phone,
                licenseNumber: driver.licenseNumber,
                licenseExpiry: driver.licenseExpiry.split('T')[0], // format date for input
                homeTerminalId: driver.homeTerminalId || '',
                department: driver.department || '',
                preferredLanguage: driver.preferredLanguage || '',
                isActive: driver.isActive ?? true,
            });
        } else {
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                password: '',
                licenseNumber: '',
                licenseExpiry: '',
                homeTerminalId: '',
                department: '',
                preferredLanguage: '',
                isActive: true,
            });
        }
        setErrors({});
    }, [driver, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName || !formData.fullName.trim() || formData.fullName.length < 2) {
            newErrors.fullName = 'Full name is required (min 2 characters)';
        }

        if (!formData.email || !formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Valid email is required';
        }

        if (!formData.phone || !formData.phone.trim() || formData.phone.length < 10) {
            newErrors.phone = 'Valid phone number is required (min 10 characters)';
        }

        if (!driver && (!formData.password || formData.password.length < 8)) {
            newErrors.password = 'Password is required (min 8 characters)';
        }

        if (!formData.licenseNumber || !formData.licenseNumber.trim()) {
            newErrors.licenseNumber = 'License number is required';
        }

        if (!formData.licenseExpiry) {
            newErrors.licenseExpiry = 'License expiry date is required';
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
            homeTerminalId: formData.homeTerminalId || undefined,
            department: formData.department || undefined,
            preferredLanguage: formData.preferredLanguage || undefined,
        };

        // Only include password for new drivers
        if (!driver) {
            submitData.password = formData.password;
        }

        onSubmit(submitData);
    };

    const handleChange = (field: string, value: any) => {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {driver ? 'Edit Driver' : 'Add New Driver'}
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
                        {/* Full Name */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Abebe Girma"
                                value={formData.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.fullName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.fullName && (
                                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                placeholder="driver@sheger.et"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                placeholder="+251911234567"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                            )}
                        </div>

                        {/* Password - only for new drivers */}
                        {!driver && (
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="Min 8 characters"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                                )}
                            </div>
                        )}

                        {/* License Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                License Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., DL-123456"
                                value={formData.licenseNumber}
                                onChange={(e) => handleChange('licenseNumber', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.licenseNumber ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.licenseNumber && (
                                <p className="mt-1 text-sm text-red-500">{errors.licenseNumber}</p>
                            )}
                        </div>

                        {/* License Expiry */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                License Expiry <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.licenseExpiry}
                                onChange={(e) => handleChange('licenseExpiry', e.target.value)}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.licenseExpiry ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-navy-600'}`}
                            />
                            {errors.licenseExpiry && (
                                <p className="mt-1 text-sm text-red-500">{errors.licenseExpiry}</p>
                            )}
                        </div>

                        {/* Home Terminal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Home Terminal (Optional)
                            </label>
                            <select
                                value={formData.homeTerminalId}
                                onChange={(e) => handleChange('homeTerminalId', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Not assigned</option>
                                {terminals.map((terminal) => (
                                    <option key={terminal.id} value={terminal.id}>
                                        {terminal.terminalName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.isActive ? 'active' : 'inactive'}
                                onChange={(e) => handleChange('isActive', e.target.value === 'active')}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Preferred Language */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Preferred Language (Optional)
                            </label>
                            <select
                                value={formData.preferredLanguage}
                                onChange={(e) => handleChange('preferredLanguage', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Select language</option>
                                <option value="Amharic">Amharic</option>
                                <option value="English">English</option>
                                <option value="Oromiffa">Oromiffa</option>
                                <option value="Tigrinya">Tigrinya</option>
                            </select>
                        </div>
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
                            {driver ? 'Update Driver' : 'Add Driver'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
