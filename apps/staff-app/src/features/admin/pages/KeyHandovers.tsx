import { useState } from 'react';
import { Search, Download, Plus, Key, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { KeyHandoverModal } from '@/features/admin/components/KeyHandoverModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keyHandoverService, KeyHandover } from '@/services/key-handover.service';
import toast from 'react-hot-toast';


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

    const handleCreateHandover = (handoverData: any) => {
        createMutation.mutate(handoverData);
    };

    const handleConfirmFrom = (handoverId: string) => {
        confirmFromMutation.mutate(handoverId);
    };

    const handleConfirmTo = (handoverId: string) => {
        confirmToMutation.mutate(handoverId);
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

            {/* Strict Single-Line Non-Scrollable Header */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">
                    
                    {/* Left: Title & Inline Compact Stats (Full Words, No Abbreviations) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Key Handovers</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <Key className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{handovers.length}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-yellow-500/20 px-2 py-1 rounded shrink-0">
                                <Clock className="w-3.5 h-3.5 text-yellow-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Pending:</span>
                                <span className="text-xs font-bold text-white">{pendingCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Confirmed:</span>
                                <span className="text-xs font-bold text-white">{confirmedCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded shrink-0">
                                <Key className="w-3.5 h-3.5 text-blue-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Today:</span>
                                <span className="text-xs font-bold text-white">{todayCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search, Date, Status, Export & Action Buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[150px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                        </div>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs text-slate-800 dark:text-slate-200 px-2 py-1.5 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer"
                        />

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="text-xs text-slate-800 dark:text-slate-200 px-2 py-1.5 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                        </select>

                        <button 
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium whitespace-nowrap shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Handover</span>
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Bus</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Terminal</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">From Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">To Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Handover Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Confirmations</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
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
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{handover.busPlate}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{handover.terminalName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {handover.fromDriver ? (
                                                <div>
                                                    <p className="text-sm text-slate-900 dark:text-slate-100">{handover.fromDriver}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{handover.fromShift}</p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm text-slate-900 dark:text-slate-100">{handover.toDriver}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{handover.toShift}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {new Date(handover.handoverTime).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(handover.status as any)}`}>
                                                {getStatusIcon(handover.status)}
                                                <span className="capitalize">{handover.status.replace('_', ' ')}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
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
        </div>
    );
}