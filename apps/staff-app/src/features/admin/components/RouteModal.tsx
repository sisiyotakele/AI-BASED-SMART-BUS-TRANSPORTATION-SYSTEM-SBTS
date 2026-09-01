import { useState, useEffect, useRef } from 'react';
import { X, Building2, ChevronDown, Check } from 'lucide-react';
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
    const [isStartDropdownOpen, setIsStartDropdownOpen] = useState(false);
    const startDropdownRef = useRef<HTMLDivElement>(null);
    const [isEndDropdownOpen, setIsEndDropdownOpen] = useState(false);
    const endDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (startDropdownRef.current && !startDropdownRef.current.contains(event.target as Node)) {
                setIsStartDropdownOpen(false);
            }
            if (endDropdownRef.current && !endDropdownRef.current.contains(event.target as Node)) {
                setIsEndDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Fetch terminals
    const { data: terminals = [] } = useQuery({
        queryKey: ['terminals'],
        queryFn: fetchTerminals,
        staleTime: 5 * 60 * 1000,
    });



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

        if (!formData.routeName || !formData.routeName.trim()) {
            newErrors.routeName = 'Route name is required';
        }

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

        const submitData = {
            routeName: formData.routeName,
            description: formData.description,
            startTerminalId: selectedStartTerminal,
            endTerminalId: selectedEndTerminal,
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
                            <div className="relative" ref={startDropdownRef}>
                                <div
                                    onClick={() => {
                                        setIsStartDropdownOpen(!isStartDropdownOpen);
                                        setIsEndDropdownOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 pl-9 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg flex items-center justify-between cursor-pointer border hover:border-cyan-500 transition-colors text-sm ${errors.startTerminal ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                >
                                    <div className="flex items-center">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                        <span className={selectedStartTerminal ? "font-medium" : "text-slate-400 dark:text-slate-500"}>
                                            {selectedStartTerminal ? terminals.find((t: Terminal) => t.id === selectedStartTerminal)?.terminalName : "-- Select Starting Terminal --"}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isStartDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                                
                                {isStartDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1 text-sm">
                                        {terminals.map((terminal: Terminal) => (
                                            <button
                                                key={terminal.id}
                                                type="button"
                                                className="w-full px-4 py-2.5 text-left hover:bg-cyan-50 dark:hover:bg-navy-700/50 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-navy-700/50 last:border-b-0 group"
                                                onClick={() => {
                                                    setSelectedStartTerminal(terminal.id);
                                                    
                                                    if (selectedEndTerminal) {
                                                        const endT = terminals.find((t: Terminal) => t.id === selectedEndTerminal);
                                                        if (endT) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                routeName: `${terminal.terminalName} ↔ ${endT.terminalName}`
                                                            }));
                                                        }
                                                    }

                                                    if (errors.startTerminal) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.startTerminal;
                                                            return newErrors;
                                                        });
                                                    }
                                                    setIsStartDropdownOpen(false);
                                                }}
                                            >
                                                <span className={`font-semibold ${selectedStartTerminal === terminal.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-300'}`}>
                                                    {terminal.terminalName}
                                                </span>
                                                {selectedStartTerminal === terminal.id && (
                                                    <Check className="w-4 h-4 text-cyan-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                            <div className="relative" ref={endDropdownRef}>
                                <div
                                    onClick={() => {
                                        setIsEndDropdownOpen(!isEndDropdownOpen);
                                        setIsStartDropdownOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 pl-9 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg flex items-center justify-between cursor-pointer border hover:border-cyan-500 transition-colors text-sm ${errors.endTerminal ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                >
                                    <div className="flex items-center">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                        <span className={selectedEndTerminal ? "font-medium" : "text-slate-400 dark:text-slate-500"}>
                                            {selectedEndTerminal ? terminals.find((t: Terminal) => t.id === selectedEndTerminal)?.terminalName : "-- Select Destination Terminal --"}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isEndDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                                
                                {isEndDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1 text-sm">
                                        {terminals.map((terminal: Terminal) => (
                                            <button
                                                key={terminal.id}
                                                type="button"
                                                disabled={terminal.id === selectedStartTerminal}
                                                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between border-b border-slate-100 dark:border-navy-700/50 last:border-b-0 group ${terminal.id === selectedStartTerminal ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-navy-900/50' : 'hover:bg-cyan-50 dark:hover:bg-navy-700/50 cursor-pointer'}`}
                                                onClick={() => {
                                                    if (terminal.id !== selectedStartTerminal) {
                                                        setSelectedEndTerminal(terminal.id);

                                                        if (selectedStartTerminal) {
                                                            const startT = terminals.find((t: Terminal) => t.id === selectedStartTerminal);
                                                            if (startT) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    routeName: `${startT.terminalName} ↔ ${terminal.terminalName}`
                                                                }));
                                                            }
                                                        }

                                                        if (errors.endTerminal) {
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors.endTerminal;
                                                                return newErrors;
                                                            });
                                                        }
                                                        setIsEndDropdownOpen(false);
                                                    }
                                                }}
                                            >
                                                <span className={`font-semibold ${selectedEndTerminal === terminal.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-300'}`}>
                                                    {terminal.terminalName}
                                                    {terminal.id === selectedStartTerminal && <span className="ml-2 text-xs font-normal text-slate-400">(Selected as Start)</span>}
                                                </span>
                                                {selectedEndTerminal === terminal.id && (
                                                    <Check className="w-4 h-4 text-cyan-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.endTerminal && (
                                <p className="mt-1 text-sm text-red-500">{errors.endTerminal}</p>
                            )}
                        </div>
                    </div>

                    {/* Route Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Route Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.routeName}
                                onChange={(e) => handleChange('routeName', e.target.value)}
                                placeholder="e.g., Piassa to Bole..."
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm ${errors.routeName ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                                ↔ Bidirectional
                            </div>
                        </div>
                        {errors.routeName && (
                            <p className="mt-1 text-sm text-red-500">{errors.routeName}</p>
                        )}
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
