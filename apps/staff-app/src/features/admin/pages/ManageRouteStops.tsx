import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { routeService } from '@/services/route.service';
import { stopService } from '@/services/stop.service';
import { ArrowLeft, MapPin, Plus, Trash2, Save, GitBranch, ArrowUpDown, GripVertical, X, Search, Loader2, Map as MapIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '@/contexts/ConfirmContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapUpdater({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, positions]);
    return null;
}

export function ManageRouteStops() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { confirm } = useConfirm();

    const [selectedDirection, setSelectedDirection] = useState<'forward' | 'backward'>('forward');
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [editingStops, setEditingStops] = useState<any[]>([]);
    const [selectedNewStopId, setSelectedNewStopId] = useState<string>('');
    const [isCreateStopModalOpen, setIsCreateStopModalOpen] = useState(false);
    const [newStopData, setNewStopData] = useState({
        stopName: '',
        stopCode: '',
        latitude: '',
        longitude: '',
        address: ''
    });
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodingSuggestions, setGeocodingSuggestions] = useState<any[]>([]);

    // Fetch route with versions
    const { data: route, isLoading } = useQuery({
        queryKey: ['route', id],
        queryFn: () => routeService.getById(id!),
        enabled: !!id,
    });

    // Fetch all stops
    const { data: allStops = [] } = useQuery({
        queryKey: ['stops'],
        queryFn: () => stopService.getAll()
    });

    // Fetch route variants
    const { data: routeVariants, refetch: refetchRouteVariants } = useQuery({
        queryKey: ['route-variants', id],
        queryFn: () => routeService.getVersions(id!),
        enabled: !!id,
    });

    // Get versions for selected direction
    const selectedDirectionVariants = selectedDirection === 'forward'
        ? (routeVariants?.forward || [])
        : (routeVariants?.backward || []);

    // Auto-select first version when direction changes
    useEffect(() => {
        if (selectedDirectionVariants.length > 0 && !selectedVersionId) {
            setSelectedVersionId(selectedDirectionVariants[0].id);
        }
    }, [selectedDirectionVariants, selectedVersionId]);

    // Load stops for selected version
    useEffect(() => {
        if (selectedVersionId) {
            const version = selectedDirectionVariants.find((v: any) => v.id === selectedVersionId);
            if (version?.routeStops) {
                const sorted = [...version.routeStops].sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);
                setEditingStops(sorted.map((rs: any) => ({
                    id: rs.id,
                    stopId: rs.stopId,
                    stopName: rs.stop?.stopName || 'Unknown',
                    stopCode: rs.stop?.stopCode || '',
                    sequenceNumber: rs.sequenceNumber
                })));
            } else {
                setEditingStops([]);
            }
        }
    }, [selectedVersionId, selectedDirectionVariants]);

    // Create new route variant
    const createRouteMutation = useMutation({
        mutationFn: async () => {
            const nextNumber = selectedDirectionVariants.length + 1;
            return routeService.createVersion(id!, {
                direction: selectedDirection,
                routeName: `Route ${nextNumber}`,
                routeStops: []
            });
        },
        onSuccess: (newVersion) => {
            refetchRouteVariants();
            setSelectedVersionId(newVersion.id);
            toast.success('New route created successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to create route');
        }
    });

    // Save stops
    const saveStopsMutation = useMutation({
        mutationFn: async () => {
            if (!selectedVersionId || editingStops.length === 0) {
                throw new Error('Please add at least one stop');
            }

            const mappedStops = editingStops.map((stop, index) => ({
                stopId: stop.stopId,
                sequenceNumber: index + 1,
                distanceKm: 0,
                estimatedMinutes: 0
            }));

            return routeService.overwriteVersionStops(selectedVersionId, { routeStops: mappedStops });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['route', id] });
            refetchRouteVariants();
            toast.success('Stops saved successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to save stops');
        }
    });

    // Delete route version
    const deleteRouteMutation = useMutation({
        mutationFn: (versionId: string) => routeService.deleteVersion(versionId),
        onSuccess: () => {
            refetchRouteVariants();
            setSelectedVersionId('');
            toast.success('Route deleted successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to delete route');
        }
    });

    // Activate/Deactivate route
    const toggleActiveMutation = useMutation({
        mutationFn: ({ versionId, activate }: { versionId: string, activate: boolean }) =>
            activate ? routeService.activateVersion(versionId) : routeService.deactivateVersion(versionId),
        onSuccess: () => {
            refetchRouteVariants();
            toast.success('Route status updated');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update route status');
        }
    });

    // Create new stop mutation
    const createStopMutation = useMutation({
        mutationFn: async (data: any) => stopService.create(data),
        onSuccess: (newStop) => {
            queryClient.invalidateQueries({ queryKey: ['stops'] });
            toast.success('Stop created successfully!');
            // Auto-add the newly created stop to the route
            setEditingStops(prev => [...prev, {
                id: `temp-${Date.now()}`,
                stopId: newStop.id,
                stopName: newStop.stopName,
                stopCode: newStop.stopCode,
                sequenceNumber: prev.length + 1
            }]);
            setIsCreateStopModalOpen(false);
            setNewStopData({
                stopName: '',
                stopCode: '',
                latitude: '',
                longitude: '',
                address: ''
            });
            setGeocodingSuggestions([]);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to create stop');
        }
    });

    // Geocoding function - search for location coordinates
    const searchLocation = useCallback(async (query: string) => {
        if (!query || query.length < 3) {
            setGeocodingSuggestions([]);
            return;
        }

        setIsGeocoding(true);
        try {
            // Using Nominatim API (OpenStreetMap) with Ethiopia bounds
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}, Addis Ababa, Ethiopia` +
                `&format=json` +
                `&limit=5` +
                `&countrycodes=et` +
                `&addressdetails=1`,
                {
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setGeocodingSuggestions(data);

                // Auto-fill first result if only one found
                if (data.length === 1) {
                    setNewStopData(prev => ({
                        ...prev,
                        latitude: data[0].lat,
                        longitude: data[0].lon,
                        address: data[0].display_name
                    }));
                    setGeocodingSuggestions([]);
                }
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setIsGeocoding(false);
        }
    }, []);

    // Debounced search when stop name changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (newStopData.stopName) {
                searchLocation(newStopData.stopName);
            }
        }, 800); // Wait 800ms after user stops typing

        return () => clearTimeout(timer);
    }, [newStopData.stopName, searchLocation]);

    const handleSelectSuggestion = (suggestion: any) => {
        setNewStopData({
            ...newStopData,
            latitude: suggestion.lat,
            longitude: suggestion.lon,
            address: suggestion.display_name
        });
        setGeocodingSuggestions([]);
    };

    const handleAddStop = () => {
        if (!selectedNewStopId) {
            toast.error('Please select a stop');
            return;
        }

        const stopObj = allStops.find((s: any) => s.id === selectedNewStopId);
        if (stopObj) {
            setEditingStops(prev => [...prev, {
                id: `temp-${Date.now()}`,
                stopId: stopObj.id,
                stopName: stopObj.stopName,
                stopCode: stopObj.stopCode,
                sequenceNumber: prev.length + 1
            }]);
            setSelectedNewStopId('');
        }
    };

    const handleCreateStop = () => {
        if (!newStopData.stopName || !newStopData.stopCode) {
            toast.error('Stop name and code are required');
            return;
        }

        if (!newStopData.latitude || !newStopData.longitude) {
            toast.error('Please click on the map to set the stop location');
            return;
        }

        createStopMutation.mutate({
            ...newStopData,
            latitude: parseFloat(newStopData.latitude),
            longitude: parseFloat(newStopData.longitude)
        });
    };

    const handleRemoveStop = (index: number) => {
        setEditingStops(prev => prev.filter((_, i) => i !== index));
    };

    const handleMoveStop = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === editingStops.length - 1) return;

        const newStops = [...editingStops];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
        setEditingStops(newStops);
    };

    const handleDeleteRoute = async (versionId: string, routeName: string) => {
        const isConfirmed = await confirm({
            title: 'Delete Route',
            message: `Are you sure you want to delete "${routeName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            isDanger: true
        });

        if (isConfirmed) {
            deleteRouteMutation.mutate(versionId);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Route Not Found</h2>
                <button onClick={() => navigate('/dashboard/routes')} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                    Back to Routes
                </button>
            </div>
        );
    }

    const selectedVersion = selectedDirectionVariants.find((v: any) => v.id === selectedVersionId);

    const startTerminal = selectedDirection === 'forward' ? route.startTerminal : route.endTerminal;
    const endTerminal = selectedDirection === 'forward' ? route.endTerminal : route.startTerminal;

    // Intelligent Coordinate Resolution for Start Terminal
    let startLat = startTerminal?.latitude ? Number(startTerminal.latitude) : 0;
    let startLng = startTerminal?.longitude ? Number(startTerminal.longitude) : 0;
    
    if (!startLat || !startLng) {
        const firstStopId = editingStops.length > 0 ? editingStops[0].stopId : null;
        const firstStop = allStops.find((s: any) => s.id === firstStopId);
        startLat = firstStop?.latitude ? Number(firstStop.latitude) : 9.0054;
        startLng = firstStop?.longitude ? Number(firstStop.longitude) : 38.7636;
    }

    // Intelligent Coordinate Resolution for End Terminal
    let endLat = endTerminal?.latitude ? Number(endTerminal.latitude) : 0;
    let endLng = endTerminal?.longitude ? Number(endTerminal.longitude) : 0;

    if (!endLat || !endLng) {
        const lastStopId = editingStops.length > 0 ? editingStops[editingStops.length - 1].stopId : null;
        const lastStop = allStops.find((s: any) => s.id === lastStopId);
        endLat = lastStop?.latitude ? Number(lastStop.latitude) : 9.0320;
        endLng = lastStop?.longitude ? Number(lastStop.longitude) : 38.7469;
    }

    const mapCenter: [number, number] = [
        (startLat + endLat) / 2 || 9.0054,
        (startLng + endLng) / 2 || 38.7636
    ];

    const polylinePositions: [number, number][] = [];
    polylinePositions.push([startLat, startLng]);
    editingStops.forEach(stop => {
        const originalStop = allStops.find((s: any) => s.id === stop.stopId);
        if (originalStop?.latitude && originalStop?.longitude) {
            polylinePositions.push([Number(originalStop.latitude), Number(originalStop.longitude)]);
        }
    });
    polylinePositions.push([endLat, endLng]);

    return (
        <div className="space-y-6">
            {/* Create Stop Modal */}
            {isCreateStopModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-navy-700">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Stop</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        Stop will be added to the route automatically
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateStopModalOpen(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Stop Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newStopData.stopName}
                                            onChange={(e) => setNewStopData({ ...newStopData, stopName: e.target.value })}
                                            placeholder="e.g., Bole Michael, Meskel Square"
                                            className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                        {isGeocoding && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Location Suggestions */}
                                    {geocodingSuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            <div className="p-2 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900">
                                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                    Select location to auto-fill coordinates:
                                                </p>
                                            </div>
                                            {geocodingSuggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => handleSelectSuggestion(suggestion)}
                                                    className="w-full text-left px-3 py-2 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors border-b border-slate-100 dark:border-navy-700 last:border-0"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                                {suggestion.display_name.split(',')[0]}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                {suggestion.display_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Stop Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStopData.stopCode}
                                        onChange={(e) => setNewStopData({ ...newStopData, stopCode: e.target.value })}
                                        placeholder="e.g., STP-BOLE-01"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Latitude *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStopData.latitude}
                                        readOnly
                                        placeholder="Auto-filled from location"
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Longitude *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStopData.longitude}
                                        readOnly
                                        placeholder="Auto-filled from location"
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={newStopData.address}
                                    onChange={(e) => setNewStopData({ ...newStopData, address: e.target.value })}
                                    placeholder="Auto-filled from location or enter manually"
                                    rows={2}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                />
                            </div>

                            {!newStopData.latitude && !isGeocoding && newStopData.stopName && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-amber-700 dark:text-amber-400">
                                        <span className="font-semibold">Searching for location...</span>
                                        <p className="mt-1">Type a more specific location name if coordinates don't appear automatically.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsCreateStopModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateStop}
                                    disabled={!newStopData.stopName || !newStopData.stopCode || !newStopData.latitude || !newStopData.longitude || createStopMutation.isPending}
                                    className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    {createStopMutation.isPending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            <span>Create & Add Stop</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => navigate('/dashboard/routes')}
                        className="p-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Route Stops</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{route.routeName}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Route Versions */}
                <div className="lg:col-span-1 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Direction</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedDirection('forward');
                                    setSelectedVersionId('');
                                }}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm ${selectedDirection === 'forward'
                                    ? 'bg-cyan-500 text-white shadow-lg'
                                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-50'
                                    }`}
                            >
                                <div className="text-xs opacity-75 mb-1">Forward</div>
                                <div className="font-bold text-xs">
                                    {route.startTerminal?.terminalName} → {route.endTerminal?.terminalName}
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedDirection('backward');
                                    setSelectedVersionId('');
                                }}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm ${selectedDirection === 'backward'
                                    ? 'bg-cyan-500 text-white shadow-lg'
                                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-50'
                                    }`}
                            >
                                <div className="text-xs opacity-75 mb-1">Backward</div>
                                <div className="font-bold text-xs">
                                    {route.endTerminal?.terminalName} → {route.startTerminal?.terminalName}
                                </div>
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Available Routes</h3>
                            <button
                                onClick={() => createRouteMutation.mutate()}
                                disabled={createRouteMutation.isPending}
                                className="p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                                title="Add Route"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {selectedDirectionVariants.map((variant: any) => (
                                <div
                                    key={variant.id}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedVersionId === variant.id
                                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                        : 'border-slate-200 dark:border-navy-700 hover:border-slate-300'
                                        }`}
                                    onClick={() => setSelectedVersionId(variant.id)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {variant.routeName}
                                            {variant.isPrimary && <span className="ml-2 text-yellow-500">⭐</span>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleActiveMutation.mutate({ versionId: variant.id, activate: !variant.isActive });
                                                }}
                                                className={`px-2 py-1 text-xs rounded ${variant.isActive
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                {variant.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                            {!variant.isPrimary && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteRoute(variant.id, variant.routeName);
                                                    }}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {variant.stopCount || 0} stops
                                    </div>
                                </div>
                            ))}

                            {selectedDirectionVariants.length === 0 && (
                                <div className="text-center text-slate-500 py-8">
                                    <p className="text-sm">No routes yet</p>
                                    <p className="text-xs mt-1">Click + to create one</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Stop Management */}
                <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm p-6 space-y-6">
                    {selectedVersionId ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Editing: {selectedVersion?.routeName}
                                </h3>
                                <button
                                    onClick={() => saveStopsMutation.mutate()}
                                    disabled={saveStopsMutation.isPending || editingStops.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Stops
                                </button>
                            </div>

                            {/* Add Stop Section */}
                            <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Add Stop to Route
                                </label>
                                <div className="flex gap-2 mb-3">
                                    <select
                                        value={selectedNewStopId}
                                        onChange={(e) => setSelectedNewStopId(e.target.value)}
                                        className="flex-1 px-4 py-2 bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <option value="">-- Select existing stop --</option>
                                        {allStops.map((stop: any) => (
                                            <option key={stop.id} value={stop.id}>
                                                {stop.stopName} ({stop.stopCode})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAddStop}
                                        disabled={!selectedNewStopId}
                                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>
                                <div className="pt-3 border-t border-slate-200 dark:border-navy-700">
                                    <button
                                        onClick={() => setIsCreateStopModalOpen(true)}
                                        className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create New Stop
                                    </button>
                                </div>
                            </div>

                            {/* Sequence Map & Configuration Stack - COMPLETE REDESIGN */}
                            <div className="flex flex-col gap-6">

                                {/* Top: Horizontal Timeline Sequence Editor */}
                                <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                                <GripVertical className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                                                Stop Sequence Order Manager
                                            </h3>
                                        </div>
                                        <div className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-navy-700 px-3 py-1 rounded-full">
                                            {editingStops.length} Customizable Stops
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto relative min-h-[180px] custom-scrollbar">
                                        
                                        <div className="flex items-start justify-between min-w-full w-max px-6 pt-16 pb-8 relative z-10 text-center">
                                            
                                            {/* START TERMINAL */}
                                            <div className="flex flex-col items-center flex-1 min-w-[120px] max-w-[200px] shrink-0 relative group">
                                                {/* SVG Arrow Connection */}
                                                <div className="absolute top-[24px] -translate-y-1/2 left-[50%] right-[calc(-50%+28px)] flex items-center z-0">
                                                    <div className="h-[3px] bg-slate-200 dark:bg-navy-700 flex-1"></div>
                                                    <ChevronRight className="w-5 h-5 text-slate-200 dark:text-navy-700 -ml-2" strokeWidth={3} />
                                                </div>

                                                <div className="relative z-10 w-12 h-12 rounded-full border-[3px] border-white dark:border-navy-800 bg-emerald-500 shadow-lg flex items-center justify-center mb-3">
                                                    <MapPin className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="px-2 w-full">
                                                    <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Start Terminal</div>
                                                    <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight bg-white dark:bg-navy-800 rounded p-1 shadow-sm border border-slate-100 dark:border-navy-700 mx-auto max-w-[120px]">
                                                        {startTerminal?.terminalName}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* STOPS */}
                                            {editingStops.length === 0 ? (
                                                <div className="min-w-[200px] flex-1 flex items-center justify-center -mt-6">
                                                    <div className="px-4 py-2 bg-slate-50 dark:bg-navy-900 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-xl text-slate-500">
                                                        <p className="text-xs font-semibold">No route stops added yet</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                editingStops.map((stop, index) => (
                                                    <div key={stop.id} className="flex flex-col items-center flex-1 min-w-[120px] max-w-[200px] shrink-0 relative group cursor-pointer">
                                                        {/* SVG Arrow Connection */}
                                                        <div className="absolute top-[24px] -translate-y-1/2 left-[50%] right-[calc(-50%+28px)] flex items-center z-0">
                                                            <div className="h-[3px] bg-slate-200 dark:bg-navy-700 flex-1"></div>
                                                            <ChevronRight className="w-5 h-5 text-slate-200 dark:text-navy-700 -ml-2" strokeWidth={3} />
                                                        </div>

                                                        <div className="relative z-10 w-10 h-10 mt-1 mb-2 rounded-full border-[3px] border-white dark:border-navy-800 bg-cyan-500 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <span className="font-bold text-white text-xs">{index + 1}</span>
                                                            
                                                            {/* Manage Hover Actions with Invisible Bridge */}
                                                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 pb-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all scale-95 group-hover:scale-100 z-50">
                                                                <div className="bg-white dark:bg-navy-700 rounded-lg shadow-xl border border-slate-200 dark:border-navy-600 p-1 flex gap-1 relative">
                                                                    {/* Invisible bridge to prevent hover loss */}
                                                                    <div className="absolute w-full h-6 -bottom-6 left-0"></div>
                                                                    
                                                                    <button onClick={() => handleMoveStop(index, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-navy-600 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30">
                                                                        <ChevronLeft className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleRemoveStop(index)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded text-slate-600 dark:text-slate-300">
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleMoveStop(index, 'down')} disabled={index === editingStops.length - 1} className="p-1 hover:bg-slate-100 dark:hover:bg-navy-600 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30">
                                                                        <ChevronRight className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="px-2 w-full">
                                                            <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight bg-white dark:bg-navy-800 rounded p-1 shadow-sm border border-slate-100 dark:border-navy-700 mx-auto w-full max-w-[130px] transition group-hover:border-cyan-400">
                                                                {stop.stopName}
                                                            </div>
                                                            <div className="mt-1 text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded inline-block truncate max-w-[100px]">
                                                                {stop.stopCode}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}

                                            {/* END TERMINAL */}
                                            <div className="flex flex-col items-center flex-1 min-w-[120px] max-w-[200px] shrink-0 relative group">
                                                <div className="relative z-10 w-12 h-12 rounded-full border-[3px] border-white dark:border-navy-800 bg-red-500 shadow-lg flex items-center justify-center mb-3">
                                                    <MapPin className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="px-2 w-full">
                                                    <div className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5">End Terminal</div>
                                                    <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight bg-white dark:bg-navy-800 rounded p-1 shadow-sm border border-slate-100 dark:border-navy-700 mx-auto max-w-[120px]">
                                                        {endTerminal?.terminalName}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                {/* Bottom: Route Map */}
                                <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-sm flex flex-col relative z-0 h-[500px]">
                                    <div className="p-3 border-b border-slate-200 dark:border-navy-700 bg-white/90 dark:bg-navy-900/90 backdrop-blur flex items-center gap-2 absolute top-0 left-0 right-0 z-[400] shadow-sm">
                                        <MapIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Live Route Editor Map</h3>
                                    </div>
                                    <div className="pt-12 h-full w-full">
                                        <MapContainer
                                            center={mapCenter}
                                            zoom={12}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                attribution='&copy; OpenStreetMap'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <MapUpdater positions={polylinePositions} />
                                            <Marker position={[startLat, startLng]} icon={startIcon}>
                                                <Popup>
                                                    <div className="text-sm font-bold text-emerald-600">{startTerminal?.terminalName}</div>
                                                    <div className="text-xs text-slate-500">Start Terminal</div>
                                                </Popup>
                                            </Marker>
                                            <Marker position={[endLat, endLng]} icon={endIcon}>
                                                <Popup>
                                                    <div className="text-sm font-bold text-red-500">{endTerminal?.terminalName}</div>
                                                    <div className="text-xs text-slate-500">End Terminal</div>
                                                </Popup>
                                            </Marker>
                                            {/* Stop Markers */}
                                            {editingStops.map((stop, index) => {
                                                const originalStop = allStops.find((s: any) => s.id === stop.stopId);
                                                if (!originalStop?.latitude || !originalStop?.longitude) return null;
                                                return (
                                                    <Marker
                                                        key={stop.id}
                                                        position={[Number(originalStop.latitude), Number(originalStop.longitude)]}
                                                    >
                                                        <Popup>
                                                            <div className="text-sm font-bold text-cyan-600">{stop.stopName}</div>
                                                            <div className="text-xs text-slate-500">Sequence: {index + 1}</div>
                                                        </Popup>
                                                    </Marker>
                                                );
                                            })}
                                            {/* Route Polyline connecting all points */}
                                            {polylinePositions.length > 1 && (
                                                <Polyline
                                                    positions={polylinePositions}
                                                    color="#06b6d4"
                                                    weight={4}
                                                    opacity={0.7}
                                                />
                                            )}
                                        </MapContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <GitBranch className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">Select a route to manage stops</p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm">Choose from the left panel or create a new one</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
