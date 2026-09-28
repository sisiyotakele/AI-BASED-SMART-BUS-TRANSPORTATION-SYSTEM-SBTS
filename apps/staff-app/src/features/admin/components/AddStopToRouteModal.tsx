import { useState, useEffect } from 'react';
import { X, MapPin, Plus, ListOrdered } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stopService } from '@/services/stop.service';
import { routeService } from '@/services/route.service';
import toast from 'react-hot-toast';

interface AddStopToRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    versionId: string;
    routeName: string;
    currentStopCount: number;
}

export function AddStopToRouteModal({ isOpen, onClose, versionId, routeName, currentStopCount }: AddStopToRouteModalProps) {
    const queryClient = useQueryClient();
    const [selectedStopId, setSelectedStopId] = useState('');
    const [isCreatingStop, setIsCreatingStop] = useState(false);
    
    // New stop creation fields
    const [newStopData, setNewStopData] = useState({
        stopName: '',
        stopCode: '',
        latitude: '',
        longitude: '',
        address: ''
    });

    const { data: stops = [] } = useQuery({
        queryKey: ['stops'],
        queryFn: () => stopService.getAll(),
        enabled: isOpen
    });

    const addStopMutation = useMutation({
        mutationFn: async (stopId: string) => 
            routeService.addRouteStop(versionId, {
                stopId,
                sequenceNumber: currentStopCount + 1,
                distanceKm: 0
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['route'] });
            toast.success('Stop added successfully!');
            setSelectedStopId('');
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to add stop');
        }
    });

    const createStopMutation = useMutation({
        mutationFn: async (data: any) => stopService.create(data),
        onSuccess: (newStop) => {
            queryClient.invalidateQueries({ queryKey: ['stops'] });
            toast.success('Stop created successfully!');
            // Automatically add the newly created stop to the route
            addStopMutation.mutate(newStop.id);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to create stop');
        }
    });

    const handleAddExistingStop = () => {
        if (!selectedStopId) {
            toast.error('Please select a stop');
            return;
        }
        addStopMutation.mutate(selectedStopId);
    };

    const handleCreateAndAddStop = () => {
        if (!newStopData.stopName || !newStopData.stopCode) {
            toast.error('Stop name and code are required');
            return;
        }

        createStopMutation.mutate({
            ...newStopData,
            latitude: newStopData.latitude ? parseFloat(newStopData.latitude) : null,
            longitude: newStopData.longitude ? parseFloat(newStopData.longitude) : null
        });
    };

    useEffect(() => {
        if (!isOpen) {
            setSelectedStopId('');
            setIsCreatingStop(false);
            setNewStopData({
                stopName: '',
                stopCode: '',
                latitude: '',
                longitude: '',
                address: ''
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-navy-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Stop</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {routeName} • Sequence #{currentStopCount + 1}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Toggle between adding existing vs creating new */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsCreatingStop(false)}
                            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm ${!isCreatingStop
                                ? 'bg-cyan-500 text-white shadow-lg'
                                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                                }`}
                        >
                            <ListOrdered className="w-4 h-4 mx-auto mb-1" />
                            Add Existing Stop
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreatingStop(true)}
                            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm ${isCreatingStop
                                ? 'bg-cyan-500 text-white shadow-lg'
                                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                                }`}
                        >
                            <Plus className="w-4 h-4 mx-auto mb-1" />
                            Create New Stop
                        </button>
                    </div>

                    {!isCreatingStop ? (
                        /* Add Existing Stop */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Select Stop *
                                </label>
                                <select
                                    value={selectedStopId}
                                    onChange={(e) => setSelectedStopId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="">-- Choose a stop --</option>
                                    {stops.map((stop: any) => (
                                        <option key={stop.id} value={stop.id}>
                                            {stop.stopName} ({stop.stopCode})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    {stops.length} stops available
                                </p>
                            </div>

                            <button
                                onClick={handleAddExistingStop}
                                disabled={!selectedStopId || addStopMutation.isPending}
                                className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                {addStopMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Adding Stop...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        <span>Add Stop to Route</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Create New Stop */
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Stop Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStopData.stopName}
                                        onChange={(e) => setNewStopData({ ...newStopData, stopName: e.target.value })}
                                        placeholder="e.g., Bole Michael"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
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
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={newStopData.latitude}
                                        onChange={(e) => setNewStopData({ ...newStopData, latitude: e.target.value })}
                                        placeholder="e.g., 9.0054"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={newStopData.longitude}
                                        onChange={(e) => setNewStopData({ ...newStopData, longitude: e.target.value })}
                                        placeholder="e.g., 38.7636"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                                    placeholder="Full address of the stop location"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleCreateAndAddStop}
                                disabled={!newStopData.stopName || !newStopData.stopCode || createStopMutation.isPending}
                                className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                {createStopMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Creating Stop...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        <span>Create & Add to Route</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
