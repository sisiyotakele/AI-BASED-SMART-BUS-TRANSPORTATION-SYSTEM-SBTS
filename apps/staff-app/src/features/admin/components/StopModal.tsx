import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Stop } from '@/types';
import { terminalsApi } from '@/services/api/terminals.api';
import { MapPin } from 'lucide-react';
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

interface StopModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StopFormData) => void;
    editData?: Stop | null;
}

interface StopFormData {
    stopName: string;
    stopCode: string;
    terminalId?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
}

// Dropdown will be populated dynamically from API

export function StopModal({ isOpen, onClose, onSubmit, editData }: StopModalProps) {
    const [formData, setFormData] = useState<StopFormData>({
        stopName: '',
        stopCode: '',
        terminalId: '',
        latitude: undefined,
        longitude: undefined,
        address: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Map State
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [tempMapLocation, setTempMapLocation] = useState<L.LatLng | null>(null);

    // Geocoding State
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeSuggestions, setGeocodeSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const stopNameRef = useRef<HTMLDivElement>(null);

    const { data: terminals = [], isLoading: isLoadingTerminals } = useQuery({
        queryKey: ['terminals'],
        queryFn: () => terminalsApi.getAll(),
        enabled: isOpen,
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (stopNameRef.current && !stopNameRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchGeocode = useCallback(async (query: string) => {
        if (!query || query.length < 3) {
            setGeocodeSuggestions([]);
            return;
        }

        setIsGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Addis Ababa, Ethiopia&format=json&limit=5&countrycodes=et&addressdetails=1`,
                { headers: { 'Accept': 'application/json' } }
            );

            if (response.ok) {
                const data = await response.json();
                setGeocodeSuggestions(data);
                setShowSuggestions(data.length > 0);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setIsGeocoding(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.stopName && formData.stopName.length > 2 && !editData && showSuggestions !== false) {
                fetchGeocode(formData.stopName);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [formData.stopName, fetchGeocode, editData, showSuggestions]);

    const handleSelectLocation = (suggestion: any) => {
        setFormData(prev => ({
            ...prev,
            stopName: suggestion.display_name.split(',')[0],
            address: suggestion.display_name,
            latitude: parseFloat(Number(suggestion.lat).toFixed(6)),
            longitude: parseFloat(Number(suggestion.lon).toFixed(6))
        }));
        setShowSuggestions(false);
    };

    useEffect(() => {
        if (editData) {
            setFormData({
                stopName: editData.stopName || '',
                stopCode: editData.stopCode || '',
                terminalId: editData.terminalId || '',
                latitude: editData.latitude || undefined,
                longitude: editData.longitude || undefined,
                address: editData.address || '',
            });
        } else {
            setFormData({
                stopName: '',
                stopCode: '',
                terminalId: '',
                latitude: undefined,
                longitude: undefined,
                address: '',
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.stopName.trim()) {
            newErrors.stopName = 'Stop name is required';
        } else if (formData.stopName.length > 255) {
            newErrors.stopName = 'Stop name must be less than 255 characters';
        }

        if (!formData.stopCode.trim()) {
            newErrors.stopCode = 'Stop code is required';
        } else if (formData.stopCode.length > 255) {
            newErrors.stopCode = 'Stop code must be less than 255 characters';
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
            stopName: '',
            stopCode: '',
            terminalId: '',
            latitude: undefined,
            longitude: undefined,
            address: '',
        });
        setErrors({});
    };

    const handleChange = (field: keyof StopFormData, value: any) => {
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
                        {editData ? 'Edit Stop' : 'New Stop'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form id="stop-form" onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Stop Name with Geocoding */}
                        <div className="relative" ref={stopNameRef}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Stop Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.stopName}
                                    onChange={(e) => {
                                        handleChange('stopName', e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    placeholder="e.g., Meskel Square"
                                    className={`w-full px-3 py-1.5 pr-8 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.stopName ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                                />
                                {isGeocoding && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                                    </div>
                                )}
                            </div>
                            
                            {showSuggestions && geocodeSuggestions.length > 0 && (
                                <div className="absolute z-[70] w-[200%] mt-1 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    <div className="p-2 border-b border-slate-100 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            Auto-fill Location Coordinates
                                        </p>
                                    </div>
                                    {geocodeSuggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelectLocation(suggestion)}
                                            className="w-full px-3 py-2 text-left hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors border-b border-slate-100 dark:border-navy-700 last:border-b-0"
                                        >
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                        {suggestion.display_name.split(',')[0]}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                        {suggestion.display_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {errors.stopName && (
                                <p className="mt-1 text-sm text-red-500">{errors.stopName}</p>
                            )}
                        </div>

                        {/* Stop Code */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Stop Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.stopCode}
                                onChange={(e) => handleChange('stopCode', e.target.value)}
                                placeholder="e.g., MSQ-001"
                                className={`w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border text-sm ${errors.stopCode ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-navy-600'}`}
                            />
                            {errors.stopCode && (
                                <p className="mt-1 text-sm text-red-500">{errors.stopCode}</p>
                            )}
                        </div>
                    </div>

                    {/* Terminal */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Terminal (Optional)
                        </label>
                        <select
                            value={formData.terminalId}
                            onChange={(e) => handleChange('terminalId', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            <option value="">No terminal</option>
                            {isLoadingTerminals ? (
                                <option value="" disabled>Loading terminals...</option>
                            ) : (
                                terminals.map((terminal) => (
                                    <option key={terminal.id} value={terminal.id}>
                                        {terminal.terminalName}
                                    </option>
                                ))
                            )}
                        </select>
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex justify-between items-end">
                                <span>Latitude (Optional)</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempMapLocation(formData.latitude && formData.longitude ? new L.LatLng(formData.latitude, formData.longitude) : new L.LatLng(9.0300, 38.7400));
                                        setIsMapModalOpen(true);
                                    }}
                                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:bg-cyan-100 bg-cyan-50 dark:bg-cyan-900/40 px-2 py-1 rounded-md transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    Choose on Map
                                </button>
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex justify-between items-end">
                                <span>Longitude (Optional)</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempMapLocation(formData.latitude && formData.longitude ? new L.LatLng(formData.latitude, formData.longitude) : new L.LatLng(9.0300, 38.7400));
                                        setIsMapModalOpen(true);
                                    }}
                                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:bg-cyan-100 bg-cyan-50 dark:bg-cyan-900/40 px-2 py-1 rounded-md transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    Choose on Map
                                </button>
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
                        form="stop-form"
                        className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                        {editData ? 'Update Stop' : 'Create Stop'}
                    </button>
                </div>
            </div>

            {/* Map Picker Modal (Higher z-index than the StopModal) */}
            {isMapModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-navy-700 flex flex-col h-[85vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pin Stop Location</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Click anywhere on the map to set the exact coordinates</p>
                            </div>
                            <button
                                onClick={() => setIsMapModalOpen(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 relative bg-slate-100 z-0">
                            <MapContainer
                                center={tempMapLocation || [9.03, 38.74]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationPickerMarker
                                    position={tempMapLocation}
                                    setPosition={setTempMapLocation}
                                />
                                {tempMapLocation && <MapUpdater center={[tempMapLocation.lat, tempMapLocation.lng]} />}
                            </MapContainer>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-navy-800/50 border-t border-slate-200 dark:border-navy-700 flex justify-between items-center">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {tempMapLocation ? (
                                    <>
                                        Selected: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{tempMapLocation.lat.toFixed(6)}, {tempMapLocation.lng.toFixed(6)}</span>
                                    </>
                                ) : (
                                    <span className="text-slate-500 italic">No location selected yet...</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsMapModalOpen(false)}
                                    className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (tempMapLocation) {
                                            handleChange('latitude', parseFloat(tempMapLocation.lat.toFixed(6)));
                                            handleChange('longitude', parseFloat(tempMapLocation.lng.toFixed(6)));
                                            setIsMapModalOpen(false);
                                        }
                                    }}
                                    disabled={!tempMapLocation}
                                    className="px-6 py-2 font-bold text-white bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-colors"
                                >
                                    Confirm Coordinates
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
