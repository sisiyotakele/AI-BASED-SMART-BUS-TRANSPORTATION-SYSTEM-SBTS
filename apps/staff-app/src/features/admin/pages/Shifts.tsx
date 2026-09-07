import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Plus, Edit2, Trash2, Clock, CheckCircle, XCircle, Calendar, Power } from 'lucide-react';
import { ShiftModal } from '@/features/admin/components/ShiftModal';
import { shiftService } from '@/services/shift.service';
import { Shift } from '@/types';
import toast from 'react-hot-toast';

const formatTime = (timeStr: string) => {
    // If it's already HH:mm, return it
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    return new Date(dateStr).toISOString().split('T')[0];
};

const calculateDuration = (start: string, end: string) => {
    const formattedStart = formatTime(start);
    const formattedEnd = formatTime(end);
    const [startHour, startMin] = formattedStart.split(':').map(Number);
    const [endHour, endMin] = formattedEnd.split(':').map(Number);

    let hours = endHour - startHour;
    let minutes = endMin - startMin;

    if (hours < 0) hours += 24; // Handle overnight shifts
    if (minutes < 0) {
        hours -= 1;
        minutes += 60;
    }

    return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`.trim();
};

export function Shifts() {
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    // Fetch Shifts
    const { data: rawShifts = [], isLoading, error } = useQuery({
        queryKey: ['shifts', selectedDate],
        queryFn: () => shiftService.getAll(undefined, selectedDate || undefined),
    });

    const shifts = rawShifts.map((s) => ({
        ...s,
        shiftStart: formatTime(s.shiftStart),
        shiftEnd: formatTime(s.shiftEnd),
        shiftDate: formatDate(s.shiftDate),
    }));

    // Mutations
    const createMutation = useMutation({
        mutationFn: shiftService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success('Shift added successfully');
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add shift');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Shift> }) => shiftService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success('Shift updated successfully');
            setIsModalOpen(false);
            setEditingShift(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update shift');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: shiftService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success('Shift deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete shift');
        }
    });

    // Filtering
    const filteredShifts = shifts.filter(shift => {
        const driverName = shift.driver?.fullName || 'Unknown';
        const matchesSearch =
            driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shift.shiftName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && shift.isActive) ||
            (filterStatus === 'inactive' && !shift.isActive);
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredShifts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentShifts = filteredShifts.slice(startIndex, endIndex);

    // Stats
    const activeCount = shifts.filter(s => s.isActive).length;
    const inactiveCount = shifts.filter(s => !s.isActive).length;
    const todayCount = shifts.filter(s => {
        const today = new Date().toISOString().split('T')[0];
        return s.shiftDate === today;
    }).length;

    const handleAddShift = async () => {
        setEditingShift(null);
        setIsModalOpen(true);
    };

    const handleEditShift = async (shift: Shift) => {
        setEditingShift(shift);
        setIsModalOpen(true);
    };

    const handleSubmitShift = async (shiftData: Partial<Shift>) => {
        if (editingShift) {
            updateMutation.mutate({ id: editingShift.id, data: shiftData });
        } else {
            createMutation.mutate(shiftData);
        }
    };

    const handleDeleteShift = async (shiftId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to delete this shift?', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteMutation.mutate(shiftId);
        }
    };

    const handleToggleStatus = async (shiftId: string, currentStatus: boolean) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this shift?`, confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            updateMutation.mutate({ id: shiftId, data: { isActive: !currentStatus } });
        }
    };

    const handleExport = () => {
        const headers = ['Driver Name', 'Shift Name', 'Shift Date', 'Start Time', 'End Time', 'Duration', 'Status'];
        let csvContent = headers.join(',');

        if (filteredShifts.length > 0) {
            const csvData = filteredShifts.map(s => [
                s.driver?.fullName || 'Unknown',
                s.shiftName,
                s.shiftDate,
                s.shiftStart,
                s.shiftEnd,
                calculateDuration(s.shiftStart, s.shiftEnd),
                s.isActive ? 'Active' : 'Inactive'
            ]);
            csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        } else {
            toast.error('No shifts found to export. Downloading template.');
        }

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `shifts_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (filteredShifts.length > 0) toast.success('Export successful');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500">
            <p>Failed to load shifts. Please try again later.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <ShiftModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingShift(null);
                }}
                onSubmit={handleSubmitShift}
                shift={editingShift}
            />

            {/* Strict Single-Line Non-Scrollable Header with Original Padding */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">

                    {/* Left: Title & Inline Compact Stats (Full Words, No Abbreviations) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap"> Shifts</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <Clock className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{shifts.length}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Active:</span>
                                <span className="text-xs font-bold text-white">{activeCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-gray-500/20 px-2 py-1 rounded shrink-0">
                                <XCircle className="w-3.5 h-3.5 text-gray-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Inactive:</span>
                                <span className="text-xs font-bold text-white">{inactiveCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-blue-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Today:</span>
                                <span className="text-xs font-bold text-white">{todayCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search, Date, Status, Export & Action Buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[150px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                            />
                        </div>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-xs text-slate-800 dark:text-slate-100 px-2 py-1 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer transition-colors"
                        />

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
                            onClick={handleAddShift}
                            className="flex items-center space-x-1.5 px-4 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-bold flex-shrink-0 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Shift</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Shifts Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {
                    currentShifts.length === 0 ? (
                        <div className="col-span-full bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-12 text-center">
                            <Clock className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">No shifts found</p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm">Try adjusting your filters or add a new shift</p>
                            <button
                                onClick={handleAddShift}
                                className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-cyan-500 transition-colors"
                            >
                                Add First Shift
                            </button>
                        </div>
                    ) : (
                        currentShifts.map((shift) => (
                            <div
                                key={shift.id}
                                className="group relative flex flex-col bg-white dark:bg-navy-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-navy-700 overflow-hidden hover:-translate-y-1"
                            >
                                {/* Decorative top gradient border */}
                                <div className={`h-1.5 w-full ${shift.isActive ? 'bg-gradient-to-r from-emerald-400 to-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`} />

                                <div className="p-4 flex-1 flex flex-col">
                                    {/* Header & Status */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="min-w-0 pr-2">
                                            <h3 className="text-base font-bold text-slate-800 dark:text-white truncate" title={shift.shiftName}>
                                                {shift.shiftName}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                                <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                                <span className="truncate">
                                                    {new Date(shift.shiftDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleStatus(shift.id, shift.isActive)}
                                            className={`group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all duration-200 shadow-sm hover:shadow-md ${shift.isActive
                                                ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600 ring-2 ring-emerald-500/20'
                                                : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 dark:bg-navy-800 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-700'
                                                }`}
                                        >
                                            <Power className={`w-3.5 h-3.5 transition-transform ${shift.isActive ? 'text-white' : 'text-slate-400'}`} />
                                            {shift.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>

                                    {/* Time & Duration Compact Box */}
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-navy-800/50 rounded-xl p-3 mb-4 border border-slate-100 dark:border-navy-700/50">
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5 tracking-wider">Schedule</span>
                                            <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                                                <Clock className="w-3.5 h-3.5 mr-1.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                                <span className="truncate">{shift.shiftStart} <span className="text-slate-300 dark:text-slate-600 font-normal mx-0.5">→</span> {shift.shiftEnd}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end shrink-0 pl-2">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wider">Duration</span>
                                            <span className="text-[11px] font-black text-cyan-700 dark:text-cyan-300 bg-cyan-100/60 dark:bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-200/50 dark:border-cyan-500/10">
                                                {calculateDuration(shift.shiftStart, shift.shiftEnd)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer: Driver & Actions */}
                                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-navy-800">
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 ring-2 ring-white dark:ring-navy-900">
                                                {(shift.driver?.fullName || 'Unknown').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                                                {shift.driver?.fullName || 'Unknown'}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => handleEditShift(shift)}
                                                className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-navy-700 rounded-md transition-colors"
                                                title="Edit Shift"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteShift(shift.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                                                title="Delete Shift"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
            </div>

            {/* Pagination */}
            {filteredShifts.length > 0 && (
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Rows per page:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-1 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-colors"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredShifts.length)} of {filteredShifts.length} entries
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
    );
}