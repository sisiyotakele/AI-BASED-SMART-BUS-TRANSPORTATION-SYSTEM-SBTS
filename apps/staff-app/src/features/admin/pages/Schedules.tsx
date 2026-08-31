import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { Search, Calendar, Plus, Clock, MapPin, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '@/services/schedule.service';
import { routeService } from '@/services/route.service';
import { RouteSchedule } from '@/types';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function Schedules() {
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDay, setSelectedDay] = useState<string>('Monday');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data: schedules = [], isLoading, error } = useQuery({
        queryKey: ['schedules'],
        queryFn: () => scheduleService.getAll()
    });

    const deleteScheduleMutation = useMutation({
        mutationFn: (id: string) => scheduleService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast.success('Schedule deleted successfully');
        },
        onError: () => toast.error('Failed to delete schedule')
    });

    const toggleActiveScheduleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => scheduleService.update(id, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
        }
    });

    const filteredSchedules = schedules.filter(schedule => {
        const matchesSearch =
            schedule.scheduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (schedule.route?.routeName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDay = schedule.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase();
        const matchesActive =
            filterActive === 'all' ||
            (filterActive === 'active' && schedule.isActive) ||
            (filterActive === 'inactive' && !schedule.isActive);

        return matchesSearch && matchesDay && matchesActive;
    });

    const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSchedules = filteredSchedules.slice(startIndex, endIndex);

    const activeCount = schedules.filter(s => s.isActive).length;
    const inactiveCount = schedules.filter(s => !s.isActive).length;

    const schedulesByDay = daysOfWeek.map(day => ({
        day,
        count: schedules.filter(s => s.dayOfWeek?.toLowerCase() === day.toLowerCase()).length
    }));

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to delete this schedule?', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteScheduleMutation.mutate(id);
        }
    };

    const handleExport = () => {
        const headers = ['Schedule Name', 'Route', 'Day', 'Departure Time', 'Status', 'Effective From', 'Effective Until'];
        let csvContent = headers.join(',');

        if (filteredSchedules.length > 0) {
            const csvData = filteredSchedules.map(s => [
                s.scheduleName,
                s.route?.routeName || 'N/A',
                s.dayOfWeek,
                s.departureTime.includes('T') ? new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : s.departureTime,
                s.isActive ? 'Active' : 'Inactive',
                s.effectiveFrom ? new Date(s.effectiveFrom).toLocaleDateString() : 'N/A',
                s.effectiveUntil ? new Date(s.effectiveUntil).toLocaleDateString() : 'N/A'
            ]);
            csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        } else {
            toast.error('No schedules found to export. Downloading template.');
        }

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `schedules_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (filteredSchedules.length > 0) toast.success('Export successful');
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
            <p>Failed to load schedules. Please try again later.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Strict Single-Line Non-Scrollable Header with Original Padding */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">

                    {/* Left: Title & Inline Compact Stats */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Route Schedule</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{schedules.length}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <Clock className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Active:</span>
                                <span className="text-xs font-bold text-white">{activeCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-gray-500/20 px-2 py-1 rounded shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Inactive:</span>
                                <span className="text-xs font-bold text-white">{inactiveCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search, Filter & Action Buttons */}
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

                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value as any)}
                            className="text-xs text-slate-800 dark:text-slate-200 px-2 py-1.5 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>

                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-transparent dark:border-navy-600 rounded hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>

                        <button
                            onClick={() => navigate('/dashboard/schedules/create')}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Schedule</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Day of Week Tabs */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-navy-700">
                <div className="flex border-b border-slate-200 dark:border-navy-700">
                    {daysOfWeek.map(day => {
                        const dayCount = schedulesByDay.find(d => d.day === day)?.count || 0;
                        return (
                            <button
                                key={day}
                                onClick={() => {
                                    setSelectedDay(day);
                                    setCurrentPage(1);
                                }}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${selectedDay === day
                                    ? 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800'
                                    }`}
                            >
                                <div className="flex flex-col items-center">
                                    <span>{day}</span>
                                    {dayCount > 0 && (
                                        <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${selectedDay === day
                                            ? 'bg-cyan-200 text-cyan-700 dark:bg-cyan-800 dark:text-cyan-200'
                                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                            {dayCount}
                                        </span>
                                    )}
                                </div>
                                {selectedDay === day && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Schedules Table */}
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-navy-800/50 border-b border-slate-200 dark:border-navy-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Schedule Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Route</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Departure Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Effective Period</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                            {currentSchedules.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No schedules found for {selectedDay}</p>
                                        <button
                                            onClick={() => navigate('/dashboard/schedules/create')}
                                            className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                                        >
                                            + Add Schedule for {selectedDay}
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                currentSchedules.map(schedule => (
                                    <tr key={schedule.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{schedule.scheduleName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{schedule.route?.routeName || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{
                                                // Handle `departureTime` if it's full datetime or just time string
                                                schedule.departureTime.includes('T') ?
                                                    new Date(schedule.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                                    schedule.departureTime
                                            }</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                onClick={() => {
                                                    toggleActiveScheduleMutation.mutate({ id: schedule.id, isActive: !schedule.isActive });
                                                }}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${schedule.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                {schedule.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                                {schedule.effectiveFrom && (
                                                    <div>From: {new Date(schedule.effectiveFrom).toLocaleDateString()}</div>
                                                )}
                                                {schedule.effectiveUntil && (
                                                    <div>Until: {new Date(schedule.effectiveUntil).toLocaleDateString()}</div>
                                                )}
                                                {!schedule.effectiveFrom && !schedule.effectiveUntil && (
                                                    <span className="text-slate-400 dark:text-slate-500">Ongoing</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => navigate(`/dashboard/schedules/edit?id=${schedule.id}`)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-navy-700 rounded transition-colors" title="Edit">
                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Delete">
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
                {filteredSchedules.length > 0 && (
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
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredSchedules.length)} of {filteredSchedules.length} entries
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded disabled:text-gray-400 disabled:hover:bg-transparent transition-colors font-medium"
                            >
                                ← Back
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${currentPage === i + 1
                                        ? 'bg-emerald-500 text-white font-medium'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded disabled:text-gray-400 disabled:hover:bg-transparent transition-colors font-medium"
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