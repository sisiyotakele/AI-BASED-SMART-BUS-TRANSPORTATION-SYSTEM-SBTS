import { useConfirm } from '@/contexts/ConfirmContext';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Plus, Building2, Edit2, Trash2, MapPin, Users, Phone, Mail, User } from 'lucide-react';
import { TerminalModal } from '@/features/admin/components/TerminalModal';
import { terminalsApi, Terminal } from '@/services/api/terminals.api';
import toast from 'react-hot-toast';

export function Terminals() {
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);

    // Fetch terminals
    const { data: terminals = [], isLoading, error } = useQuery({
        queryKey: ['terminals', searchTerm],
        queryFn: () => terminalsApi.getAll(searchTerm),
    });

    // Create terminal mutation
    const createMutation = useMutation({
        mutationFn: terminalsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['terminals'] });
            toast.success('Terminal created successfully');
            setIsModalOpen(false);
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
            setIsModalOpen(false);
            setEditingTerminal(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update terminal');
        },
    });

    // Delete terminal mutation
    const deleteMutation = useMutation({
        mutationFn: terminalsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['terminals'] });
            toast.success('Terminal deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete terminal');
        },
    });

    // Filtering
    const filteredTerminals = terminals;

    // Pagination
    const totalPages = Math.ceil(filteredTerminals.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTerminals = filteredTerminals.slice(startIndex, endIndex);

    // Stats
    const totalCapacity = terminals.reduce((sum, t) => sum + (t.capacity || 0), 0);
    const totalTerminals = terminals.length;

    const handleCreateTerminal = async (terminalData: any) => {
        createMutation.mutate(terminalData);
    };

    const handleEditTerminal = async (terminal: Terminal) => {
        setEditingTerminal(terminal);
        setIsModalOpen(true);
    };

    const handleUpdateTerminal = async (terminalData: any) => {
        if (editingTerminal) {
            updateMutation.mutate({ id: editingTerminal.id, data: terminalData });
        }
    };

    const handleDeleteTerminal = async (terminalId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to delete this terminal? This will affect all buses and stops assigned to it.', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteMutation.mutate(terminalId);
        }
    };

    const handleModalClose = async () => {
        setIsModalOpen(false);
        setEditingTerminal(null);
    };

    const handleExport = () => {
        if (!filteredTerminals.length) {
            toast.error('No terminals to export.');
            return;
        }

        const headers = ['Terminal Name', 'Status', 'Capacity', 'Address', 'Manager Name', 'Phone Number', 'Email'];
        let csvContent = headers.join(',');

        const csvData = filteredTerminals.map(t => [
            t.terminalName,
            t.status || 'active',
            (t.capacity || 0).toString(),
            t.address || 'N/A',
            t.managerName || 'N/A',
            t.phoneNumber || 'N/A',
            t.email || 'N/A'
        ]);
        csvContent = [headers.join(','), ...csvData.map(row => row.map(v => `"${v}"`).join(','))].join('\n');

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `terminals_export_${new Date().toISOString().split('T')[0]}.csv`;
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
                    <p className="text-red-600 dark:text-red-400 text-lg mb-2">Failed to load terminals</p>
                    <p className="text-red-400 text-sm mb-4">{error?.message || String(error)}</p>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['terminals'] })}
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
            <TerminalModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={editingTerminal ? handleUpdateTerminal : handleCreateTerminal}
                editData={editingTerminal}
            />

            {/* Strict Single-Line Non-Scrollable Header with Original Padding */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">

                    {/* Left: Title & Inline Compact Stats (Full Words, No Abbreviations) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Terminals</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{totalTerminals}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded shrink-0">
                                <Users className="w-3.5 h-3.5 text-blue-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Capacity:</span>
                                <span className="text-xs font-bold text-white">{totalCapacity}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search, Export & Action Buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[180px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium whitespace-nowrap border border-transparent"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Terminal</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Cards Grid */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-navy-700">
                {currentTerminals.length === 0 ? (
                    <div className="text-center py-12">
                        <Building2 className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">No terminals found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentTerminals.map((terminal) => (
                            <div
                                key={terminal.id}
                                className="border border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-800/50 rounded-xl p-4 hover:shadow-lg hover:border-cyan-400 dark:hover:border-cyan-600 transition-all duration-200 group flex flex-col h-full"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4 gap-2">
                                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-[#12B2E4] dark:bg-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-transparent dark:border-cyan-500/20">
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-full">
                                                    {terminal.terminalName}
                                                </h3>
                                                {terminal.status && (
                                                    <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${terminal.status === 'active'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                                                        : terminal.status === 'maintenance'
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
                                                        }`}>
                                                        {terminal.status}
                                                    </span>
                                                )}
                                            </div>
                                            {terminal.address && (
                                                <div className="flex items-start space-x-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-1">{terminal.address}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                        <button
                                            onClick={() => handleEditTerminal(terminal)}
                                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTerminal(terminal.id)}
                                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-2 text-center border border-transparent dark:border-blue-500/20">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Capacity</p>
                                        <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                                            {terminal.capacity || '-'}
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-2 text-center border border-transparent dark:border-emerald-500/20">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Status</p>
                                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300 capitalize">
                                            {terminal.status || 'Active'}
                                        </p>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                {(terminal.managerName || terminal.phoneNumber || terminal.email) && (
                                    <div className="border-t border-slate-100 dark:border-navy-700 pt-3 space-y-2">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact:</p>
                                        {terminal.managerName && (
                                            <div className="flex items-center space-x-2 text-xs">
                                                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">{terminal.managerName}</span>
                                            </div>
                                        )}
                                        {terminal.phoneNumber && (
                                            <div className="flex items-center space-x-2 text-xs">
                                                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="text-slate-700 dark:text-slate-300">{terminal.phoneNumber}</span>
                                            </div>
                                        )}
                                        {terminal.email && (
                                            <div className="flex items-center space-x-2 text-xs">
                                                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="text-slate-700 dark:text-slate-300">{terminal.email}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Facilities */}
                                {terminal.facilities && (
                                    <div className="border-t border-slate-100 dark:border-navy-700 pt-3 mt-3">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Facilities:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {terminal.facilities.split(',').slice(0, 4).map((facility, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-300"
                                                >
                                                    {facility.trim()}
                                                </span>
                                            ))}
                                            {terminal.facilities.split(',').length > 4 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-300">
                                                    +{terminal.facilities.split(',').length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Assigned Buses removed for concise view */}

                                {/* Coordinates */}
                                {terminal.latitude && terminal.longitude && (
                                    <div className="border-t border-slate-100 dark:border-navy-700 pt-3 mt-4">
                                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                            <span>📍 GPS Bounds:</span>
                                            <span className="font-semibold">{Number(terminal.latitude).toFixed(4)}, {Number(terminal.longitude).toFixed(4)}</span>
                                        </p>
                                    </div>
                                )}

                                {/* Action Bar */}
                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-navy-700">
                                    <Link 
                                        to={`/dashboard/terminals/${terminal.id}`}
                                        className="w-full py-2 bg-slate-50 dark:bg-navy-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/30"
                                    >
                                        <Building2 className="w-4 h-4" />
                                        Enter Terminal Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {filteredTerminals.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Items per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-colors cursor-pointer"
                            >
                                <option value={9}>9</option>
                                <option value={18}>18</option>
                                <option value={36}>36</option>
                            </select>
                            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredTerminals.length)} of {filteredTerminals.length} entries
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
                                    className={`px-3 py-1.5 text-sm rounded font-semibold transition-colors ${currentPage === i + 1
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