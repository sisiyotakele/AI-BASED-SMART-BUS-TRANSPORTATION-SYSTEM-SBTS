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

            {/* Strict Single-Line Non-Scrollable Header */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">
                    
                    {/* Left: Title & Compact Stats */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Bus Fleet</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <BusIcon className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{buses.length}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <Settings className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">operations:</span>
                                <span className="text-xs font-bold text-white">{operationalCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-orange-500/20 px-2 py-1 rounded shrink-0">
                                <Wrench className="w-3.5 h-3.5 text-orange-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Maintenance:</span>
                                <span className="text-xs font-bold text-white">{maintenanceCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-slate-50 dark:bg-navy-800/500/20 px-2 py-1 rounded shrink-0">
                                <BusIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                <span className="text-[10px] text-cyan-100 uppercase">Retired:</span>
                                <span className="text-xs font-bold text-white">{retiredCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Flexible Search, Filter & Action Buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[180px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="text-xs text-slate-800 dark:text-slate-200 px-2 py-1.5 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="operational">Operational</option>
                            <option value="in_maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>

                        <button 
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>

                        <button
                            onClick={handleAddBus}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Bus</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-navy-700">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-navy-800/50 border-b border-slate-200 dark:border-navy-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Plate Number</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Terminal</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
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
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{bus.plateNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{bus.model}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bus.maintenanceStatus)}`}>
                                                {getStatusLabel(bus.maintenanceStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {bus.terminal ? bus.terminal.terminalName : <span className="text-slate-400 dark:text-slate-500">Not assigned</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
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