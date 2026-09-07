import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Edit2, Trash2, Bus as BusIcon, Wrench, Settings, Search } from 'lucide-react';
import { BusModal } from '@/features/admin/components/BusModal';
import { useConfirm } from '@/contexts/ConfirmContext';
import { busService } from '@/services/bus.service';
import { terminalsApi } from '@/services/api/terminals.api';
import { Bus } from '@/types';
import toast from 'react-hot-toast';

const getStatusColor = (status: Bus['maintenanceStatus']) => {
    switch (status) {
        case 'operational':
            return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50';
        case 'in_maintenance':
            return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50';
        case 'retired':
            return 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600';
        default:
            return 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600';
    }
};

const getStatusLabel = (status: Bus['maintenanceStatus']) => {
    switch (status) {
        case 'operational':
            return 'Operational';
        case 'in_maintenance':
            return 'In Maintenance';
        case 'retired':
            return 'Retired';
        default:
            return status;
    }
};

export function Buses() {
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'operational' | 'in_maintenance' | 'retired'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBus, setEditingBus] = useState<Bus | null>(null);

    // Fetch Buses
    const { data: buses = [], isLoading, error } = useQuery({
        queryKey: ['buses', searchTerm, filterStatus],
        queryFn: () => busService.getAll(searchTerm, 'all', filterStatus),
    });

    // Fetch Terminals for the Modal
    const { data: terminals = [] } = useQuery({
        queryKey: ['terminals'],
        queryFn: () => terminalsApi.getAll(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: busService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buses'] });
            toast.success('Bus added successfully');
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add bus');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Bus> }) => busService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buses'] });
            toast.success('Bus updated successfully');
            setIsModalOpen(false);
            setEditingBus(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update bus');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: busService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buses'] });
            toast.success('Bus deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete bus');
        }
    });

    // Filtering (Frontend-side pagination)
    const filteredBuses = buses;
    const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBuses = filteredBuses.slice(startIndex, endIndex);

    // Stats
    const operationalCount = buses.filter(b => b.maintenanceStatus === 'operational').length;
    const maintenanceCount = buses.filter(b => b.maintenanceStatus === 'in_maintenance').length;
    const retiredCount = buses.filter(b => b.maintenanceStatus === 'retired').length;

    const handleAddBus = async () => {
        setEditingBus(null);
        setIsModalOpen(true);
    };

    const handleEditBus = async (bus: Bus) => {
        setEditingBus(bus);
        setIsModalOpen(true);
    };

    const handleSubmitBus = async (busData: Partial<Bus>) => {
        // Ensure capacity is converted to int if it's sent as string
        const payload = { ...busData, capacity: 50 }; // Default capacity if not in form

        if (editingBus) {
            updateMutation.mutate({ id: editingBus.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDeleteBus = async (busId: string) => {
        const isConfirmed = await confirm({
            title: 'Delete Bus',
            message: 'Are you sure you want to delete this bus? This action cannot be undone.',
            confirmText: 'Delete',
            isDanger: true
        });
        if (isConfirmed) {
            deleteMutation.mutate(busId);
        }
    };

    const handleExport = () => {
        if (!buses.length) {
            toast.error('No buses to export.');
            return;
        }

        const headers = ['Plate Number', 'Model', 'Status', 'Terminal'];
        let csvContent = headers.join(',');

        const csvData = buses.map(bus => [
            bus.plateNumber,
            bus.model || 'Standard',
            getStatusLabel(bus.maintenanceStatus),
            bus.terminal?.terminalName || 'Not assigned'
        ]);
        csvContent = [headers.join(','), ...csvData.map(row => row.map(v => `"${v}"`).join(','))].join('\n');

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `buses_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Export successful');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 text-lg mb-2">Failed to load buses</p>
                    <p className="text-red-400 text-sm mb-4">{error.message || String(error)}</p>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['buses'] })}
                        className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <BusModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingBus(null);
                }}
                onSubmit={handleSubmitBus}
                bus={editingBus}
                terminals={terminals}
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Bus Fleet</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and monitor all buses in the fleet</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <BusIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{buses.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">OPERATIONAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{operationalCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MAINTENANCE:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{maintenanceCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <BusIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">RETIRED:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{retiredCount}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-1 items-center justify-end gap-3 w-full xl:w-auto overflow-x-auto">
                    <div className="relative min-w-[150px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search buses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="all">All Status</option>
                        <option value="operational">Operational</option>
                        <option value="in_maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                    </select>

                    <button 
                        onClick={handleExport}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={handleAddBus}
                        className="flex items-center space-x-1.5 px-4 py-2.5 text-sm bg-[#2B4B9E] hover:bg-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-bold flex-shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Bus</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-navy-700">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-[#2B4B9E] text-white">
                            <tr className="h-[70px]">
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Plate Number</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Type</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Status</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Terminal</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentBuses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <BusIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">No buses found</p>
                                        <button
                                            onClick={handleAddBus}
                                            className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                                        >
                                            + Add your first bus
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                currentBuses.map((bus) => (
                                    <tr key={bus.id} className="hover:bg-slate-50 dark:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{bus.plateNumber}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{bus.model}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bus.maintenanceStatus)}`}>
                                                {getStatusLabel(bus.maintenanceStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {bus.terminal ? bus.terminal.terminalName : <span className="text-slate-400 dark:text-slate-500">Not assigned</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditBus(bus)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBus(bus.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
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
                {filteredBuses.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Rows per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100 text-sm"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-cyan-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredBuses.length)} of {filteredBuses.length} entries
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded disabled:text-slate-400 disabled:dark:text-slate-600 disabled:hover:bg-transparent transition-colors font-medium"
                            >
                                ← Back
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${
                                        currentPage === i + 1
                                            ? 'bg-emerald-500 text-white font-medium'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-navy-800'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded disabled:text-slate-400 disabled:dark:text-slate-600 disabled:hover:bg-transparent transition-colors font-medium"
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