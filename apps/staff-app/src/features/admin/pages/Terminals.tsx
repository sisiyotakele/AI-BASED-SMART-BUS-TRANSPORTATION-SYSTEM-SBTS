import { useConfirm } from '@/contexts/ConfirmContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Plus, Building2, Edit2, Trash2, MapPin, Users, Phone, Mail, User, Eye } from 'lucide-react';
import { terminalsApi, Terminal } from '@/services/api/terminals.api';
import toast from 'react-hot-toast';

export function Terminals() {
    const { confirm } = useConfirm();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    const [filterStatus, setFilterStatus] = useState('All');

    // Fetch terminals
    const { data: terminals = [], isLoading, error } = useQuery({
        queryKey: ['terminals', searchTerm],
        queryFn: () => terminalsApi.getAll(searchTerm),
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
    const filteredTerminals = terminals.filter((terminal) => {
        if (filterStatus !== 'All' && terminal.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredTerminals.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTerminals = filteredTerminals.slice(startIndex, endIndex);

    // Stats
    const totalCapacity = terminals.reduce((sum, t) => sum + (t.capacity || 0), 0);
    const totalTerminals = terminals.length;

    const handleEditTerminal = (terminal: Terminal) => {
        navigate(`/dashboard/terminals/${terminal.id}/edit`, { state: { editData: terminal } });
    };

    const handleDeleteTerminal = async (terminalId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to delete this terminal? This will affect all buses and stops assigned to it.', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteMutation.mutate(terminalId);
        }
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

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Terminals Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and monitor all bus terminals across the network</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Building2 className="w-4 h-4 text-cyan-500" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{totalTerminals}</span>
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">STATUS:</span>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider focus:outline-none cursor-pointer"
                        >
                            <option value="All">ALL ({terminals.length})</option>
                            <option value="active">ACTIVE ({terminals.filter(t => t.status === 'active').length})</option>
                            <option value="maintenance">MAINTENANCE ({terminals.filter(t => t.status === 'maintenance').length})</option>
                            <option value="closed">CLOSED ({terminals.filter(t => t.status === 'closed').length})</option>
                        </select>
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL CAPACITY:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{totalCapacity}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-1 items-center justify-end gap-3 w-full xl:w-auto overflow-x-auto">
                    <div className="relative min-w-[200px] max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search terminals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                        />
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/terminals/create')}
                        className="flex items-center space-x-1.5 px-4 py-2.5 text-sm bg-[#2B4B9E] hover:bg-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-bold flex-shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Terminal</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-navy-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#2B4B9E] text-white">
                            <tr className="h-[70px]">
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">TERMINAL NAME</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">ADDRESS</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">CAPACITY</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">CONTACT</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">STATUS</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-navy-700 bg-white dark:bg-navy-900">
                            {currentTerminals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-navy-800 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-navy-700">
                                                <Building2 className="w-6 h-6 text-gray-400 dark:text-slate-500" />
                                            </div>
                                            <p className="text-gray-500 dark:text-slate-400 font-medium">No terminals found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentTerminals.map((terminal) => (
                                <tr key={terminal.id} className="hover:bg-[#F8F9FA] dark:hover:bg-navy-800/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-[#EBF5FF] dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 border border-blue-50 dark:border-blue-800/30">
                                                <Building2 className="w-4 h-4 text-[#12B2E4] dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                                    {terminal.terminalName}
                                                </p>
                                                {terminal.facilities && (
                                                    <p className="text-sm text-gray-400 dark:text-slate-400 font-semibold mt-0.5 max-w-[200px] truncate">
                                                        {terminal.facilities}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1.5 text-base font-semibold text-gray-700 dark:text-slate-300">
                                            <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                            <span className="truncate max-w-[150px]">{terminal.address || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-base font-bold text-gray-800 dark:text-slate-200 bg-slate-50 dark:bg-navy-800 px-3 py-1 rounded-md border border-slate-100 dark:border-navy-700">
                                            {terminal.capacity || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {terminal.managerName ? (
                                            <div className="flex flex-col">
                                                <span className="text-base font-bold text-gray-800 dark:text-slate-200">{terminal.managerName}</span>
                                                <span className="text-sm text-gray-400 dark:text-slate-500">{terminal.phoneNumber || terminal.email || '-'}</span>
                                            </div>
                                        ) : (
                                            <span className="text-base text-gray-400 dark:text-slate-500 font-medium">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide border ${terminal.status === 'active'
                                            ? 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5] dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30'
                                            : terminal.status === 'maintenance'
                                                ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A] dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30'
                                                : 'bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2] dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30'
                                            }`}>
                                            {terminal.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/dashboard/terminals/${terminal.id}`}
                                                className="p-1.5 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleEditTerminal(terminal)}
                                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded transition-colors"
                                                title="Edit Terminal"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTerminal(terminal.id)}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                                                title="Delete Terminal"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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