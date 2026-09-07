import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { Search, Download, Plus, MapPin, Edit2, Trash2, Navigation2 } from 'lucide-react';
import { StopModal } from '@/features/admin/components/StopModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stopService } from '@/services/stop.service';
import { Stop } from '@/types';
import toast from 'react-hot-toast';

export function Stops() {
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTerminal, setFilterTerminal] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStop, setEditingStop] = useState<Stop | null>(null);

    const { data: stops = [], isLoading, error } = useQuery({
        queryKey: ['stops', searchTerm],
        queryFn: () => stopService.getAll(searchTerm)
    });

    const createStopMutation = useMutation({
        mutationFn: (data: Partial<Stop>) => stopService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stops'] });
            setIsModalOpen(false);
        }
    });

    const updateStopMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Stop> }) => stopService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stops'] });
            setIsModalOpen(false);
            setEditingStop(null);
        }
    });

    const deleteStopMutation = useMutation({
        mutationFn: (id: string) => stopService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stops'] })
    });

    const filteredStops = stops;

    // Pagination
    const totalPages = Math.ceil(filteredStops.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentStops = filteredStops.slice(startIndex, endIndex);

    // Stats
    const totalRoutes = 0; // Not available from backend yet
    const withTerminal = 0; // Not available from backend yet
    const withCoordinates = stops.filter(s => s.latitude && s.longitude).length;

    const handleCreateStop = async (stopData: any) => {
        createStopMutation.mutate(stopData);
    };

    const handleEditStop = async (stop: Stop) => {
        setEditingStop(stop);
        setIsModalOpen(true);
    };

    const handleUpdateStop = async (stopData: any) => {
        if (editingStop) {
            updateStopMutation.mutate({ id: editingStop.id, data: stopData });
        }
    };

    const handleDeleteStop = async (stopId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to delete this stop?', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteStopMutation.mutate(stopId);
        }
    };

    const handleModalClose = async () => {
        setIsModalOpen(false);
        setEditingStop(null);
    };

    const handleExport = () => {
        if (!stops.length) {
            toast.error('No stops to export.');
            return;
        }

        const headers = ['Stop Name', 'Stop Code', 'Address', 'Latitude', 'Longitude'];
        let csvContent = headers.join(',');

        const csvData = stops.map(s => [
            s.stopName,
            s.stopCode,
            s.address || 'N/A',
            s.latitude || 'N/A',
            s.longitude || 'N/A'
        ]);
        csvContent = [headers.join(','), ...csvData.map(row => row.map(v => `"${v}"`).join(','))].join('\n');

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `stops_export_${new Date().toISOString().split('T')[0]}.csv`;
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
            <p>Failed to load stops. Please try again later.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <StopModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={editingStop ? handleUpdateStop : handleCreateStop}
                editData={editingStop}
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Stops Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and monitor all transit stops</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{stops.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Navigation2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL ROUTES:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{totalRoutes}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WITH TERMINAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{withTerminal}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MAPPED:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{withCoordinates}</span>
                    </div>
                </div>

                {/* Actions: Search, Filter, Export & New Stop */}
                <div className="flex flex-1 items-center justify-end gap-3 w-full xl:w-auto overflow-x-auto">
                    <div className="relative min-w-[150px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search stops..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                        />
                    </div>

                    <select
                        value={filterTerminal}
                        onChange={(e) => setFilterTerminal(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="all">All Terminals</option>
                        <option value="none">No Terminal</option>
                    </select>

                    <button 
                        onClick={handleExport}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-1.5 px-4 py-2.5 text-sm bg-[#2B4B9E] hover:bg-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-bold flex-shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Stop</span>
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-[#2B4B9E] text-white">
                            <tr className="h-[70px]">
                                <th className="px-6 text-left text-sm font-medium text-white uppercase tracking-wide">Stop Name</th>
                                <th className="px-6 text-left text-sm font-medium text-white uppercase tracking-wide">Code</th>
                                <th className="px-6 text-left text-sm font-medium text-white uppercase tracking-wide">Address</th>
                                <th className="px-6 text-left text-sm font-medium text-white uppercase tracking-wide">Coordinates</th>
                                <th className="px-6 text-right text-sm font-medium text-white uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                            {currentStops.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400 text-lg">No stops found</p>
                                    </td>
                                </tr>
                            ) : (
                                currentStops.map((stop) => (
                                    <tr key={stop.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <MapPin className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{stop.stopName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300 border border-slate-200 dark:border-navy-600">
                                                {stop.stopCode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                                            {stop.address || '-'}
                                        </td>
                                        <td className="px-6 py-5">
                                            {stop.latitude && stop.longitude ? (
                                                <div className="flex items-center space-x-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                    <span className="font-semibold text-xs uppercase tracking-wider">GPS:</span>
                                                    <span className="font-mono bg-slate-50 dark:bg-navy-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                                                        {Number(stop.latitude).toFixed(4)}, {Number(stop.longitude).toFixed(4)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditStop(stop)}
                                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStop(stop.id)}
                                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredStops.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-navy-800/40">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Rows per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-colors cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredStops.length)} of {filteredStops.length} entries
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded disabled:text-slate-400 dark:disabled:text-slate-600 disabled:hover:bg-transparent transition-colors font-semibold"
                            >
                                ← Back
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1.5 text-sm rounded font-semibold transition-colors ${
                                        currentPage === i + 1
                                            ? 'bg-emerald-500 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded disabled:text-slate-400 dark:disabled:text-slate-600 disabled:hover:bg-transparent transition-colors font-semibold"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}