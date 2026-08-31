import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, Edit2, Trash2, Navigation, GitBranch, X, Eye, Download, ListOrdered, Power, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { RouteModal } from '@/features/admin/components/RouteModal';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routeService } from '@/services/route.service';
import { stopService } from '@/services/stop.service';
import { Route } from '@/types';

interface MapPoint {
    id: string;
    name: string;
    lat: number;
    lon: number;
}

interface MapPoint {
    id: string;
    name: string;
    lat: number;
    lon: number;
}

export function Routes() {
    const { confirm } = useConfirm();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);

    const [showMapEditor, setShowMapEditor] = useState(false);
    const [selectedRouteForMap, setSelectedRouteForMap] = useState<Route | null>(null);
    const [selectedDirection, setSelectedDirection] = useState<'forward' | 'backward'>('forward');

    // Version/Stop editor state
    const [editingStops, setEditingStops] = useState<MapPoint[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [selectedNewStopId, setSelectedNewStopId] = useState<string>('');
    const [stopSearchTerm, setStopSearchTerm] = useState<string>('');
    const [newVersionName, setNewVersionName] = useState<string>('');

    // Data fetching
    const { data: routes = [], isLoading, error } = useQuery({
        queryKey: ['routes', searchTerm],
        queryFn: () => routeService.getAll(searchTerm)
    });

    const { data: stops = [] } = useQuery({
        queryKey: ['stops'],
        queryFn: () => stopService.getAll()
    });

    const { data: routeVariants, refetch: refetchRouteVariants } = useQuery({
        queryKey: ['route-variants', selectedRouteForMap?.id],
        queryFn: () => routeService.getVersions(selectedRouteForMap!.id),
        enabled: !!selectedRouteForMap,
    });

    const updateRouteStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: 'active' | 'inactive' }) =>
            routeService.update(id, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] })
    });

    const deleteRouteMutation = useMutation({
        mutationFn: (id: string) => routeService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] })
    });

    const createRouteMutation = useMutation({
        mutationFn: (data: Partial<Route>) => routeService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            setIsModalOpen(false);
        }
    });

    const updateRouteMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Route> }) => routeService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            setIsModalOpen(false);
            setEditingRoute(null);
        }
    });

    // Filtering
    const filteredRoutes = routes.filter(route => {
        const statusMatch = filterStatus === 'all' || route.status === filterStatus;
        return statusMatch;
    });

    // Stats
    const activeCount = routes.filter(r => r.status === 'active').length;
    const totalStops = routes.reduce((sum, r) => sum + (r.stopCount || 0), 0);

    const handleCreateRoute = async (routeData: any) => {
        createRouteMutation.mutate(routeData);
    };

    const handleEditRoute = async (route: Route) => {
        setEditingRoute(route);
        setIsModalOpen(true);
    };

    const handleUpdateRoute = async (routeData: any) => {
        if (editingRoute) {
            updateRouteMutation.mutate({ id: editingRoute.id, data: routeData });
        }
    };

    const handleDeleteRoute = async (routeId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to delete this route? This action cannot be undone.', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteRouteMutation.mutate(routeId);
        }
    };

    const handleModalClose = async () => {
        setIsModalOpen(false);
        setEditingRoute(null);
    };

    const handleRemoveStop = async (stopId: string) => {
        setEditingStops(prev => prev.filter(s => s.id !== stopId));
    };

    const handleSaveRoute = async () => {
        if (!selectedRouteForMap || editingStops.length === 0) return;

        try {
            const targetVersionId = selectedVersionId;

            if (!targetVersionId) {
                toast.error('Please select a route first or click "Add Route" to create a new one');
                return;
            }

            const mappedStops = editingStops.map((stop, index) => ({
                stopId: stop.id,
                sequenceNumber: index + 1,
                distanceKm: 0
            }));

            // Update existing route's stops
            await routeService.overwriteVersionStops(targetVersionId, { routeStops: mappedStops });
            toast.success('Route stops updated successfully!');

            queryClient.invalidateQueries({ queryKey: ['route', selectedRouteForMap.id] });
            refetchRouteVariants();
            setEditingStops([]);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to save route stops');
        }
    };

    const handleAddStopToList = () => {
        if (!selectedNewStopId) return;

        const stopObj = stops.find(s => s.id === selectedNewStopId);
        if (stopObj) {
            setEditingStops(prev => [...prev, {
                id: stopObj.id,
                name: stopObj.stopName,
                lat: Number(stopObj.latitude) || 0,
                lon: Number(stopObj.longitude) || 0
            }]);
            setSelectedNewStopId('');
        }
    };

    const handleOpenMapEditor = async (route: Route) => {
        setSelectedRouteForMap(route);
        setSelectedDirection('forward'); // Default to forward
        setShowMapEditor(true);
        setEditingStops([]);
        setSelectedVersionId('');
        setNewVersionName('');
    };

    const handleExport = () => {
        if (!filteredRoutes.length) {
            toast.error('No routes to export.');
            return;
        }

        const headers = ['Route Name', 'Route ID', 'Start Stop', 'End Stop', 'Stop Count', 'Status'];
        let csvContent = headers.join(',');

        const csvData = filteredRoutes.map(r => [
            r.routeName,
            r.id,
            r.startTerminal?.terminalName || 'N/A',
            r.endTerminal?.terminalName || 'N/A',
            (r.stopCount || 0).toString(),
            r.status || 'unknown'
        ]);
        csvContent = [headers.join(','), ...csvData.map(row => row.map(v => `"${v}"`).join(','))].join('\n');

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `routes_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Export successful');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500">
            <p>Failed to load routes. Please try again later.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <RouteModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={editingRoute ? handleUpdateRoute : handleCreateRoute}
                editData={editingRoute}
            />

            {/* Header */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Route Management</h2>
                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <Navigation className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{routes.length}</span>
                            </div>
                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <GitBranch className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Active:</span>
                                <span className="text-xs font-bold text-white">{activeCount}</span>
                            </div>
                            <div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded shrink-0">
                                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total Stops:</span>
                                <span className="text-xs font-bold text-white">{totalStops}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[150px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 transition-colors"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="text-xs text-slate-800 dark:text-slate-100 px-2 py-1 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>


                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Route</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap text-left border-collapse min-w-max">
                        <thead className="bg-slate-50 dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Route Info & Stops</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Route ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-navy-700/50">
                            {filteredRoutes.map((route) => (
                                <tr key={route.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                    <td className="px-6 py-4 w-[250px]">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">{route.routeName}</div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 w-max shadow-sm">
                                                <ListOrdered className="w-3.5 h-3.5" />
                                                <span>{route.versions?.find((v: any) => v.isPrimary)?.stopCount || route.stopCount || 0} Total Active Stops</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                                        {route.id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-slate-300">
                                            <MapPin className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                            <span className="font-medium">
                                                {route.startTerminal?.terminalName || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-slate-300">
                                            <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                            <span className="font-medium">
                                                {route.endTerminal?.terminalName || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${route.status === 'active' ? 'bg-green-100/50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newStatus = route.status === 'active' ? 'inactive' : 'active';
                                                updateRouteStatusMutation.mutate({ id: route.id, status: newStatus });
                                            }}
                                        >
                                            {route.status ? route.status.toUpperCase() : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/dashboard/routes/${route.id}`);
                                                }}
                                                className="text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 p-1.5 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/dashboard/routes/${route.id}/manage-stops`);
                                                }}
                                                className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-2 py-1.5 rounded transition-colors font-medium border border-emerald-200 dark:border-emerald-800"
                                                title="Manage Routes & Stops"
                                            >
                                                <ListOrdered className="w-3.5 h-3.5" />
                                                <span>Routes</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditRoute(route);
                                                }}
                                                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-1.5 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRoute(route.id);
                                                }}
                                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRoutes.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No routes found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Stops & Routes Modal */}
            {showMapEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-navy-700">

                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Route Configuration & Stops Manager</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configuring Stops for: {selectedRouteForMap?.routeName}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowMapEditor(false);
                                    setEditingStops([]);
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-white dark:bg-navy-900 rounded-full shadow-sm border border-slate-200 dark:border-navy-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                            {/* Left Side: Version selector & Stop Sequence */}
                            <div className="flex-1 flex flex-col bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-700 h-[60vh] overflow-y-auto">

                                {/* Direction Toggle */}
                                <div className="p-6 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 block">Select Direction</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDirection('forward');
                                                setSelectedVersionId('');
                                                setEditingStops([]);
                                            }}
                                            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm ${selectedDirection === 'forward'
                                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 border border-slate-200 dark:border-navy-600'
                                                }`}
                                        >
                                            <span className="block text-xs opacity-75 mb-0.5">Forward</span>
                                            <span className="block font-bold">
                                                {selectedRouteForMap?.startTerminal?.terminalName || 'Start'} → {selectedRouteForMap?.endTerminal?.terminalName || 'End'}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDirection('backward');
                                                setSelectedVersionId('');
                                                setEditingStops([]);
                                            }}
                                            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm ${selectedDirection === 'backward'
                                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 border border-slate-200 dark:border-navy-600'
                                                }`}
                                        >
                                            <span className="block text-xs opacity-75 mb-0.5">Backward</span>
                                            <span className="block font-bold">
                                                {selectedRouteForMap?.endTerminal?.terminalName || 'End'} → {selectedRouteForMap?.startTerminal?.terminalName || 'Start'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Available Routes</label>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!selectedRouteForMap) return;
                                                try {
                                                    const currentRoutes = selectedDirection === 'forward'
                                                        ? (routeVariants?.forward || [])
                                                        : (routeVariants?.backward || []);
                                                    const nextNumber = currentRoutes.length + 1;

                                                    await routeService.createVersion(selectedRouteForMap.id, {
                                                        direction: selectedDirection,
                                                        routeName: `Route ${nextNumber}`,
                                                        routeStops: []
                                                    });

                                                    toast.success(`Route ${nextNumber} created successfully! Add stops below.`);
                                                    refetchRouteVariants();
                                                } catch (error: any) {
                                                    toast.error(error.response?.data?.message || 'Failed to create route');
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add Route</span>
                                        </button>
                                    </div>

                                    {/* Routes List */}
                                    <div className="space-y-2">
                                        {(selectedDirection === 'forward' ? (routeVariants?.forward || []) : (routeVariants?.backward || [])).map((route: any) => (
                                            <div
                                                key={route.id}
                                                className={`relative rounded-lg border-2 transition-all ${selectedVersionId === route.id
                                                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                                    : 'border-slate-200 dark:border-navy-600 hover:border-cyan-300 dark:hover:border-cyan-700 bg-white dark:bg-navy-800'
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedVersionId(route.id);
                                                        if (route.routeStops) {
                                                            setEditingStops(route.routeStops.map((rs: any) => ({
                                                                id: rs.stop.id,
                                                                name: rs.stop.stopName,
                                                                lat: 0,
                                                                lon: 0
                                                            })));
                                                        } else {
                                                            setEditingStops([]);
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {route.isPrimary && <span className="text-yellow-500">⭐</span>}
                                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                                {route.routeName || `Route ${route.routeNumber}`}
                                                            </span>
                                                            {route.isPrimary && (
                                                                <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                                                                    PRIMARY
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${route.isActive
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                            }`}>
                                                            {route.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {route.stopCount || 0} stops
                                                    </div>
                                                </button>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1 px-4 pb-3 pt-0">
                                                    {/* Activate/Deactivate Button */}
                                                    <button
                                                        type="button"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                if (route.isActive) {
                                                                    await routeService.deactivateVersion(route.id);
                                                                    toast.success('Route deactivated');
                                                                } else {
                                                                    await routeService.activateVersion(route.id);
                                                                    toast.success('Route activated');
                                                                }
                                                                refetchRouteVariants();
                                                            } catch (error: any) {
                                                                toast.error(error.response?.data?.message || 'Failed to update route status');
                                                            }
                                                        }}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${route.isActive
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                            }`}
                                                        title={route.isActive ? 'Deactivate route' : 'Activate route'}
                                                    >
                                                        {route.isActive ? (
                                                            <>
                                                                <XCircle className="w-3 h-3" />
                                                                <span>Deactivate</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-3 h-3" />
                                                                <span>Activate</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* Delete Button - Only for non-primary routes */}
                                                    {!route.isPrimary && (
                                                        <button
                                                            type="button"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const confirmed = await confirm({
                                                                    title: `Delete ${route.routeName || `Route ${route.routeNumber}`}?`,
                                                                    message: route.isActive
                                                                        ? 'This route is currently ACTIVE. Please deactivate it first before deleting.'
                                                                        : 'This action cannot be undone. All stops associated with this route will be removed.',
                                                                    confirmText: 'Delete',
                                                                    isDanger: true
                                                                });

                                                                if (confirmed) {
                                                                    try {
                                                                        await routeService.deleteVersion(route.id);
                                                                        toast.success('Route deleted');
                                                                        refetchRouteVariants();
                                                                        if (selectedVersionId === route.id) {
                                                                            setSelectedVersionId('');
                                                                            setEditingStops([]);
                                                                        }
                                                                    } catch (error: any) {
                                                                        toast.error(error.response?.data?.message || 'Failed to delete route');
                                                                    }
                                                                }
                                                            }}
                                                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                            title="Delete route"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            <span>Delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {(selectedDirection === 'forward' ? (routeVariants?.forward || []) : (routeVariants?.backward || [])).length === 0 && (
                                            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                                                No routes yet. Click "Add Route" to create Route 1.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Draft Sequences ({editingStops.length})</label>
                                        {editingStops.length > 0 && (
                                            <button
                                                onClick={() => setEditingStops([])}
                                                className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-md transition-colors"
                                            >
                                                Clear Sequence
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-6">
                                        {editingStops.length === 0 ? (
                                            <div className="text-center p-8 bg-slate-50 dark:bg-navy-800/50 rounded-xl border border-dashed border-slate-300 dark:border-navy-600">
                                                <ListOrdered className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-navy-600" />
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Sequence is currently empty.</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add physical stops from the right panel to begin.</p>
                                            </div>
                                        ) : (
                                            editingStops.map((stop, index) => {
                                                const isStart = index === 0;
                                                const isEnd = index === editingStops.length - 1;

                                                return (
                                                    <div key={stop.id} className="group flex items-start gap-3 p-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors relative">
                                                        <div className={`mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-bold shadow-sm shrink-0
                                                            ${isStart ? 'bg-emerald-500' : isEnd ? 'bg-red-500' : 'bg-slate-400 dark:bg-navy-600'}
                                                        `}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-8">
                                                            <div className="font-semibold text-slate-900 dark:text-white text-sm truncate pr-2" title={stop.name}>
                                                                {stop.name}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveStop(stop.id)}
                                                            className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all"
                                                            title="Remove stop from list"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Stop Picker */}
                            <div className="w-full md:w-[380px] bg-slate-50 dark:bg-navy-800 p-6 flex flex-col shrink-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-navy-700 h-[30vh] md:h-auto">
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Add Location</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 tracking-wide leading-relaxed">Search your database for physical terminals to structure your sequence.</p>
                                </div>

                                <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl p-4 shadow-sm flex flex-col flex-1">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">DB Directory</label>

                                    <div className="space-y-4 flex-1 flex flex-col mt-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search stops..."
                                                value={stopSearchTerm}
                                                onChange={e => setStopSearchTerm(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                                            />
                                        </div>
                                        <select
                                            value={selectedNewStopId}
                                            onChange={(e) => setSelectedNewStopId(e.target.value)}
                                            size={10}
                                            className="w-full flex-1 px-3 py-2 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm overflow-y-auto"
                                        >
                                            {stops.filter(s => s.stopName.toLowerCase().includes(stopSearchTerm.toLowerCase())).map(stop => (
                                                <option key={stop.id} value={stop.id} className="py-1.5 px-1 border-b border-slate-200/50 dark:border-navy-700/50 truncate">
                                                    {stop.stopName} ({stop.stopCode})
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={handleAddStopToList}
                                            disabled={!selectedNewStopId}
                                            className="w-full py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Push to Sequence
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Options */}
                        <div className="p-4 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3 bg-white dark:bg-navy-900 shrink-0">
                            <button
                                onClick={() => {
                                    setShowMapEditor(false);
                                    setEditingStops([]);
                                }}
                                className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors border border-slate-300 dark:border-navy-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRoute}
                                disabled={editingStops.length === 0}
                                className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                Commit Version
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
