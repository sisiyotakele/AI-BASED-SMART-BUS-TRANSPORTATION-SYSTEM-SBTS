import { useState } from 'react';
import { Search, Download, Plus, Key, CheckCircle, Clock, Loader2, Trash2 } from 'lucide-react';
import { KeyHandoverModal } from '@/features/admin/components/KeyHandoverModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keyHandoverService, KeyHandover } from '@/services/key-handover.service';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ConfirmModal';


const getStatusColor = (status: KeyHandover['status']) => {
    switch (status) {
        case 'confirmed':
            return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50';
        case 'pending':
            return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50';
        default:
            return 'bg-blue-100 text-blue-700';
    }
};


const getStatusIcon = (status: string) => {
    switch (status) {
        case 'confirmed':
            return <CheckCircle className="w-4 h-4" />;
        case 'pending':
            return <Clock className="w-4 h-4" />;
        default:
            return <Clock className="w-4 h-4" />
    }
};

export function KeyHandovers() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteHandoverId, setDeleteHandoverId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: handoversData = [], isLoading } = useQuery({
        queryKey: ['key-handovers'],
        queryFn: () => keyHandoverService.getHandovers()
    });

    // Map backend data to local structure
    const handovers = handoversData.map((h: KeyHandover) => ({
        id: h.id,
        busPlate: h.bus?.plateNumber || 'Unknown',
        terminalName: h.terminal?.terminalName || 'Unknown',
        fromDriver: h.fromShift?.driver?.fullName,
        fromShift: h.fromShift?.shiftName || 'N/A',
        toDriver: h.toShift?.driver?.fullName || 'Unknown',
        toShift: h.toShift?.shiftName || 'N/A',
        status: h.status,
        handoverTime: h.handoverTime,
        confirmedByFrom: h.confirmedByFrom,
        confirmedByTo: h.confirmedByTo
    }));

    // Filtering
    const filteredHandovers = handovers.filter(handover => {
        const matchesSearch =
            handover.busPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            handover.toDriver.toLowerCase().includes(searchTerm.toLowerCase()) ||
            handover.fromDriver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            handover.terminalName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || handover.status.includes(filterStatus);
        const matchesDate = !selectedDate || handover.handoverTime.startsWith(selectedDate);
        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination
    const totalPages = Math.ceil(filteredHandovers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentHandovers = filteredHandovers.slice(startIndex, endIndex);

    // Stats
    const pendingCount = handovers.filter(h => h.status === 'pending').length;
    const confirmedCount = handovers.filter(h => h.status.includes('confirmed')).length;
    const todayCount = handovers.filter(h => {
        const today = new Date().toISOString().split('T')[0];
        return h.handoverTime.startsWith(today);
    }).length;

    const createMutation = useMutation({
        mutationFn: (data: any) => keyHandoverService.createHandover(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['key-handovers'] });
            toast.success('Handover created successfully');
            setIsCreateModalOpen(false);
        },
        onError: () => toast.error('Failed to create handover')
    });

    const confirmFromMutation = useMutation({
        mutationFn: (id: string) => keyHandoverService.confirmFrom(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['key-handovers'] });
            toast.success('Confirmed by outgoing driver');
        },
        onError: () => toast.error('Failed to confirm')
    });

    const confirmToMutation = useMutation({
        mutationFn: (id: string) => keyHandoverService.confirmTo(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['key-handovers'] });
            toast.success('Confirmed by incoming driver');
        },
        onError: () => toast.error('Failed to confirm')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => keyHandoverService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['key-handovers'] });
            toast.success('Handover deleted successfully');
        },
        onError: () => toast.error('Failed to delete handover')
    });

    const handleCreateHandover = (handoverData: any) => {
        createMutation.mutate(handoverData);
    };

    const handleConfirmFrom = (handoverId: string) => {
        confirmFromMutation.mutate(handoverId);
    };

    const handleConfirmTo = (handoverId: string) => {
        confirmToMutation.mutate(handoverId);
    };

    const handleDelete = (handoverId: string) => {
        setDeleteHandoverId(handoverId);
    };

    const confirmDelete = () => {
        if (deleteHandoverId) {
            deleteMutation.mutate(deleteHandoverId);
            setDeleteHandoverId(null);
        }
    };

    const handleExport = () => {
        const headers = ['ID', 'Bus', 'Terminal', 'From Driver', 'To Driver', 'Handover Time', 'Status', 'Confirmations'];
        let csvContent = headers.join(',');

        if (filteredHandovers.length > 0) {
            const csvData = filteredHandovers.map(h => [
                h.id,
                h.busPlate,
                h.terminalName,
                h.fromDriver ? `${h.fromDriver} (${h.fromShift})` : 'N/A',
                `${h.toDriver} (${h.toShift})`,
                new Date(h.handoverTime).toISOString(),
                h.status,
                `From: ${h.confirmedByFrom ? 'Yes' : 'No'} | To: ${h.confirmedByTo ? 'Yes' : 'No'}`
            ]);
            csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        } else {
            toast.error('No handovers found to export. Downloading template.');
        }

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `handovers_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (filteredHandovers.length > 0) toast.success('Export successful');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="space-y-4">
            <KeyHandoverModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateHandover}
            />

            <ConfirmModal
                isOpen={!!deleteHandoverId}
                onCancel={() => setDeleteHandoverId(null)}
                onConfirm={confirmDelete}
                title="Delete Key Handover"
                message="Are you sure you want to delete this handover record? This action cannot be undone."
                confirmText="Delete Handover"
                isDanger={true}
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Key Handovers</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track bus key handovers between drivers</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Key className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{handovers.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PENDING:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{pendingCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CONFIRMED:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{confirmedCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TODAY:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{todayCount}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-1 items-center justify-end gap-3 w-full xl:w-auto overflow-x-auto">
                    <div className="relative min-w-[150px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                        />
                    </div>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition-colors text-sm font-medium flex-shrink-0"
                    />

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                    </select>

                    <button 
                        onClick={handleExport}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center space-x-1.5 px-4 py-2.5 text-sm bg-[#2B4B9E] hover:bg-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-bold flex-shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Handover</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-navy-700">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-[#2B4B9E] text-white">
                            <tr className="h-[70px]">
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Bus</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Terminal</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">From Driver</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">To Driver</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Handover Time</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Status</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Confirmations</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">Loading handovers...</p>
                                    </td>
                                </tr>
                            ) : currentHandovers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Key className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">No handovers found</p>
                                    </td>
                                </tr>
                            ) : (
                                currentHandovers.map((handover) => (
                                    <tr key={handover.id} className="hover:bg-slate-50 dark:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{handover.busPlate}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{handover.terminalName}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {handover.fromDriver ? (
                                                <div>
                                                    <p className="text-sm text-slate-900 dark:text-slate-100">{handover.fromDriver}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{handover.fromShift}</p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="text-sm text-slate-900 dark:text-slate-100">{handover.toDriver}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{handover.toShift}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {new Date(handover.handoverTime).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(handover.status as any)}`}>
                                                {getStatusIcon(handover.status)}
                                                <span className="capitalize">{handover.status.replace('_', ' ')}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-2">
                                                {handover.fromDriver && (
                                                    <div className={`flex items-center space-x-1 ${handover.confirmedByFrom ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-xs">From</span>
                                                    </div>
                                                )}
                                                <div className={`flex items-center space-x-1 ${handover.confirmedByTo ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-xs">To</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {handover.fromDriver && !handover.confirmedByFrom && handover.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleConfirmFrom(handover.id)}
                                                        className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30 rounded hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                                                    >
                                                        Confirm From
                                                    </button>
                                                )}
                                                {!handover.confirmedByTo && handover.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleConfirmTo(handover.id)}
                                                        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                    >
                                                        Confirm To
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(handover.id)}
                                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Handover"
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
                {filteredHandovers.length > 0 && (
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
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredHandovers.length)} of {filteredHandovers.length} entries
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

            <ConfirmModal
                isOpen={!!deleteHandoverId}
                title="Delete Key Handover"
                message="Are you sure you want to delete this handover? This action cannot be undone."
                confirmText="Delete Handover"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteHandoverId(null)}
            />
        </div>
    );
}