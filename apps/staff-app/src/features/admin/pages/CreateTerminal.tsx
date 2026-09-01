import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search, User, ArrowLeft, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { terminalsApi } from '@/services/api/terminals.api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPickerMarker({ position, setPosition }: { position: L.LatLng | null; setPosition: (pos: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position === null ? null : <Marker position={position} />;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

// Fetch all managers from backend - only active ones
const fetchManagers = async () => {
    const { data } = await api.get('/users', {
        params: {
            role: 'MANAGER',
            isActive: 'true'
        },
    });
    return data.data?.filter((manager: any) => manager.isActive === true) || [];
};

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

export function CreateTerminal() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { id } = useParams(); // If we ever want to use this for editing

    // Check if we have edit data from state (if navigated from edit button)
    const editData = location.state?.editData;
    const isEditMode = !!editData || !!id;

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
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeSuggestions, setGeocodeSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [existingTerminals, setExistingTerminals] = useState<any[]>([]);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [tempMapLocation, setTempMapLocation] = useState<L.LatLng | null>(null);
    const addressRef = useRef<HTMLDivElement>(null);
    const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
    const managerDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (addressRef.current && !addressRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target as Node)) {
                setIsManagerDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Fetch managers
    const { data: managers = [] } = useQuery({
        queryKey: ['managers'],
        queryFn: fetchManagers,
        staleTime: 5 * 60 * 1000,
    });

    // Create terminal mutation
    const createMutation = useMutation({
        mutationFn: terminalsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['terminals'] });
            toast.success('Terminal created successfully');
            navigate('/dashboard/terminals');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create terminal');
        },
    });

    // Update terminal mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => terminalsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['terminals'] });
            toast.success('Terminal updated successfully');
            navigate('/dashboard/terminals');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update terminal');
        },
    });

    // Fetch existing terminals for prioritization
    useEffect(() => {
        const fetchTerminals = async () => {
            try {
                const { data } = await api.get('/terminals');
                setExistingTerminals(data.data || []);
            } catch (error) {
                console.error('Failed to fetch terminals:', error);
            }
        };
        fetchTerminals();
    }, []);

    // Set initial data if in edit mode
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
        }
    }, [editData]);

    const geocodeLocation = async (query: string) => {
        if (!query || query.length < 3) {
            setGeocodeSuggestions([]);
            return;
        }

        setIsGeocoding(true);
        try {
            const matchingTerminals = existingTerminals.filter(terminal =>
                terminal.terminalName?.toLowerCase().includes(query.toLowerCase()) ||
                terminal.address?.toLowerCase().includes(query.toLowerCase())
            ).filter(terminal => terminal.latitude && terminal.longitude);

            const cleanQuery = query
                .replace(/\b(bus|terminal|station|stop|depot)\b/gi, '')
                .trim();
            const searchQuery = cleanQuery.length >= 3 ? cleanQuery : query;

            const searchParams = new URLSearchParams({
                q: `${searchQuery}, Addis Ababa, Ethiopia`,
                format: 'json',
                limit: '8',
                addressdetails: '1',
                'accept-language': 'en',
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${searchParams}`,
                { headers: { 'User-Agent': 'SBTS-Staff-App/1.0' } }
            );

            if (response.ok) {
                const osmData = await response.json();
                let finalOsmData = osmData;
                if (osmData.length === 0 && cleanQuery !== query) {
                    const fallbackParams = new URLSearchParams({
                        q: `${query}, Addis Ababa`,
                        format: 'json',
                        limit: '8',
                        addressdetails: '1',
                        'accept-language': 'en',
                    });
                    const fallbackResponse = await fetch(
                        `https://nominatim.openstreetmap.org/search?${fallbackParams}`,
                        { headers: { 'User-Agent': 'SBTS-Staff-App/1.0' } }
                    );
                    if (fallbackResponse.ok) {
                        finalOsmData = await fallbackResponse.json();
                    }
                }

                const terminalSuggestions = matchingTerminals.map(terminal => ({
                    display_name: `🏢 ${terminal.terminalName} (Existing Terminal)`,
                    lat: terminal.latitude,
                    lon: terminal.longitude,
                    isExistingTerminal: true,
                    address: terminal.address,
                }));

                const osmSuggestions = finalOsmData.map((item: any) => ({
                    ...item,
                    isExistingTerminal: false,
                }));

                const combined = [...terminalSuggestions, ...osmSuggestions];
                setGeocodeSuggestions(combined);
                setShowSuggestions(combined.length > 0);
            } else {
                toast.error('Failed to fetch location suggestions');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            toast.error('Could not connect to geocoding service');
        } finally {
            setIsGeocoding(false);
        }
    };

    useEffect(() => {
        const searchQuery = formData.address || formData.terminalName;
        if (!searchQuery || searchQuery.length < 3) {
            setGeocodeSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            geocodeLocation(searchQuery);
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [formData.address, formData.terminalName]);

    const handleSelectLocation = (suggestion: any) => {
        setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(suggestion.lat),
            longitude: parseFloat(suggestion.lon),
            address: suggestion.isExistingTerminal
                ? suggestion.address
                : (suggestion.display_name || prev.address),
        }));
        setShowSuggestions(false);
        setGeocodeSuggestions([]);
    };

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

        if (isEditMode && editData?.id) {
            updateMutation.mutate({ id: editData.id, data: formData });
        } else if (isEditMode && id) {
            updateMutation.mutate({ id: id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleChange = (field: keyof TerminalFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    return (
        <div className="space-y-6 w-full pb-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard/terminals')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg text-slate-500 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isEditMode ? 'Edit Terminal' : 'Create New Terminal'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isEditMode ? 'Update existing terminal details' : 'Add a new terminal to the system'}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700">
                <form id="terminal-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Terminal Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                                Terminal Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.terminalName}
                                onChange={(e) => handleChange('terminalName', e.target.value)}
                                placeholder="e.g., Central Terminal"
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.terminalName ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-navy-600'}`}
                            />
                            {errors.terminalName && (
                                <p className="mt-1 text-sm text-red-500">{errors.terminalName}</p>
                            )}
                        </div>

                        {/* Address with Geocoding */}
                        <div className="relative md:col-span-2" ref={addressRef}>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                                Address (Optional)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="e.g., Meskel Square, Addis Ababa"
                                    className="w-full px-4 py-2 pr-10 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-navy-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                {isGeocoding && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                                    </div>
                                )}
                                {!isGeocoding && geocodeSuggestions.length > 0 && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Search className="w-5 h-5 text-cyan-500" />
                                    </div>
                                )}
                            </div>

                            {/* Geocoding Suggestions Dropdown */}
                            {showSuggestions && geocodeSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {geocodeSuggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelectLocation(suggestion)}
                                            className={`w-full px-4 py-3 text-left transition-colors border-b border-slate-100 dark:border-navy-700 last:border-b-0 ${suggestion.isExistingTerminal
                                                ? 'bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'
                                                : 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {suggestion.isExistingTerminal ? (
                                                    <div className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0 text-lg leading-none">🏢</div>
                                                ) : (
                                                    <MapPin className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${suggestion.isExistingTerminal
                                                        ? 'text-emerald-900 dark:text-emerald-300'
                                                        : 'text-slate-900 dark:text-white'
                                                        }`}>
                                                        {suggestion.display_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                        📍 {parseFloat(suggestion.lat).toFixed(4)}, {parseFloat(suggestion.lon).toFixed(4)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Latitude */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5 flex justify-between items-end">
                                <span>Latitude</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempMapLocation(formData.latitude && formData.longitude ? new L.LatLng(formData.latitude, formData.longitude) : new L.LatLng(9.0300, 38.7400));
                                        setIsMapModalOpen(true);
                                    }}
                                    className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:bg-cyan-100 bg-cyan-50 dark:bg-cyan-900/40 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Choose on Map
                                </button>
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.latitude ?? ''}
                                onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                placeholder="e.g., 9.0106"
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.latitude ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-navy-600'}`}
                            />
                            {errors.latitude && (
                                <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
                            )}
                        </div>

                        {/* Longitude */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5 flex justify-between items-end">
                                <span>Longitude</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempMapLocation(formData.latitude && formData.longitude ? new L.LatLng(formData.latitude, formData.longitude) : new L.LatLng(9.0300, 38.7400));
                                        setIsMapModalOpen(true);
                                    }}
                                    className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:bg-cyan-100 bg-cyan-50 dark:bg-cyan-900/40 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Choose on Map
                                </button>
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.longitude ?? ''}
                                onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                placeholder="e.g., 38.7641"
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.longitude ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-navy-600'}`}
                            />
                            {errors.longitude && (
                                <p className="mt-1 text-sm text-red-500">{errors.longitude}</p>
                            )}
                        </div>



                        {errors.coordinates && (
                            <p className="md:col-span-2 text-sm text-red-500">{errors.coordinates}</p>
                        )}

                        {/* Capacity */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                                Bus Capacity (Optional)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.capacity ?? ''}
                                onChange={(e) => handleChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="e.g., 50"
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.capacity ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-navy-600'}`}
                            />
                            {errors.capacity && (
                                <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                                Operational Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-navy-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="maintenance">Under Maintenance</option>
                            </select>
                        </div>

                        {/* Facilities */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                                Facilities (Optional)
                            </label>
                            <textarea
                                value={formData.facilities}
                                onChange={(e) => handleChange('facilities', e.target.value)}
                                placeholder="e.g., Waiting Area, Restrooms, Ticket Office, Parking, WiFi"
                                rows={3}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-navy-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Manager Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                                Terminal Manager (Optional)
                            </label>
                            <div className="relative" ref={managerDropdownRef}>
                                <div
                                    onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
                                    className={`w-full px-4 py-2 pl-10 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white rounded-xl flex items-center justify-between cursor-pointer border hover:border-cyan-500 transition-colors ${errors.managerName ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-navy-600'}`}
                                >
                                    <div className="flex items-center">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <span className={formData.managerName ? "font-medium" : "text-slate-400"}>
                                            {formData.managerName || "Choose a Terminal Manager..."}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isManagerDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {isManagerDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1">
                                        <button
                                            type="button"
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-navy-700/50 last:border-b-0"
                                            onClick={() => {
                                                handleChange('managerName', '');
                                                setFormData(prev => ({ ...prev, email: '', phoneNumber: '' }));
                                                setIsManagerDropdownOpen(false);
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">None (Clear Selection)</p>
                                            </div>
                                        </button>
                                        {managers.map((manager: any) => (
                                            <button
                                                key={manager.id}
                                                type="button"
                                                className="w-full px-4 py-3 text-left hover:bg-cyan-50 dark:hover:bg-navy-700/50 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-navy-700/50 last:border-b-0 group"
                                                onClick={() => {
                                                    handleChange('managerName', manager.fullName);
                                                    if (manager.email) setFormData(prev => ({ ...prev, email: manager.email }));
                                                    if (manager.phone) setFormData(prev => ({ ...prev, phoneNumber: manager.phone }));
                                                    setIsManagerDropdownOpen(false);
                                                }}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${formData.managerName === manager.fullName ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50'}`}>
                                                    {manager.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-semibold ${formData.managerName === manager.fullName ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
                                                        {manager.fullName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{manager.email}</p>
                                                </div>
                                                {formData.managerName === manager.fullName && (
                                                    <Check className="w-5 h-5 text-cyan-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {managers.length === 0 && (
                                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                                    ⚠️ No managers found. Create a user with MANAGER role first.
                                </p>
                            )}
                            {errors.managerName && (
                                <p className="mt-1 text-sm text-red-500">{errors.managerName}</p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                                Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                placeholder="e.g., +251911234567"
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.phoneNumber ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-navy-600'}`}
                            />
                            {errors.phoneNumber && (
                                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                                Email (Optional)
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="e.g., terminal@sbts.com"
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-navy-800/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-navy-600'}`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/terminals')}
                            className="px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-[#12B2E4] hover:bg-cyan-500 rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-cyan-500/20 disabled:opacity-70"
                        >
                            {(createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {isEditMode ? 'Update Terminal' : 'Create Terminal'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Map Modal */}
            {isMapModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-5xl border border-slate-200 dark:border-navy-700 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700 shrink-0">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Choose Exact Location
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Click anywhere on the map to drop a pin.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMapModalOpen(false)}
                                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors p-2"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="h-[65vh] min-h-[500px] w-full bg-slate-100 z-0 relative">
                            <MapContainer
                                center={tempMapLocation ? [tempMapLocation!.lat, tempMapLocation!.lng] : [9.0300, 38.7400]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <LocationPickerMarker
                                    position={tempMapLocation}
                                    setPosition={setTempMapLocation}
                                />
                                {tempMapLocation && (
                                    <MapUpdater center={[tempMapLocation!.lat, tempMapLocation!.lng]} />
                                )}
                            </MapContainer>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-navy-700 flex justify-between items-center bg-slate-50 dark:bg-navy-800/50">
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {tempMapLocation ? `Selected: ${tempMapLocation!.lat.toFixed(5)}, ${tempMapLocation!.lng.toFixed(5)}` : "No location selected"}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsMapModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-navy-600 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-navy-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (tempMapLocation) {
                                            setFormData(prev => ({
                                                ...prev,
                                                latitude: tempMapLocation.lat,
                                                longitude: tempMapLocation.lng
                                            }));
                                            
                                            // clear coordinate errors
                                            if (errors.latitude || errors.longitude || errors.coordinates) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.latitude;
                                                    delete newErrors.longitude;
                                                    delete newErrors.coordinates;
                                                    return newErrors;
                                                });
                                            }
                                        }
                                        setIsMapModalOpen(false);
                                    }}
                                    disabled={!tempMapLocation}
                                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Confirm Location
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
