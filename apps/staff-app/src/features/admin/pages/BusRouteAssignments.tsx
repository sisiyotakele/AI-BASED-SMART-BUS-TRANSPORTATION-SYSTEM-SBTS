import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { Search, Download, Plus, XCircle, Calendar, CheckCircle, AlertCircle, Loader2, Bus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { busRouteAssignmentService, BusRouteAssignment } from '@/services/bus-route-assignment.service';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const calculateDuration = (start: string, end?: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
        return `${diffDays} days`;
    } else {
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;
        return `${months}m ${days > 0 ? days + 'd' : ''}`.trim();
    }
};

export function BusRouteAssignments() {
    const { confirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const { data: assignmentsData = [], isLoading } = useQuery({
        queryKey: ['bus-route-assignments'],
        queryFn: () => busRouteAssignmentService.getAssignments()
    });

    const assignments = assignmentsData.map((a: BusRouteAssignment) => ({
        id: a.id,
        busId: a.busId,
        routeId: a.routeId,
        busPlate: a.bus?.plateNumber || 'Unknown',
        routeName: a.route?.routeName || 'Unknown',
        scheduleName: (a as any).schedule?.scheduleName || '-',
        departureTime: (a as any).schedule?.departureTime ? (a as any).schedule.departureTime.substring(11, 16) : '-',
        assignedDate: a.assignedDate,
        endDate: a.endDate,
        isActive: a.isActive,
    }));

    // Filtering
    const filteredAssignments = assignments.filter((assignment: any) => {
        const matchesSearch =
            assignment.busPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.routeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && assignment.isActive) ||
            (filterStatus === 'inactive' && !assignment.isActive);
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

    // Stats
    const activeCount = assignments.filter((a: any) => a.isActive).length;
    const inactiveCount = assignments.filter((a: any) => !a.isActive).length;
    const expiringCount = assignments.filter((a: any) => {
        if (!a.endDate || !a.isActive) return false;
        const end = new Date(a.endDate);
        const today = new Date();
        const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
    }).length;
    const deactivateMutation = useMutation({
        mutationFn: (id: string) => busRouteAssignmentService.deactivateAssignment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bus-route-assignments'] });
            toast.success('Assignment deactivated');
        },
        onError: () => toast.error('Failed to deactivate assignment'),
    });

    const handleDeactivate = async (assignmentId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to deactivate this assignment?', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deactivateMutation.mutate(assignmentId);
        }
    };

    const handleExport = () => {
        const headers = ['Bus', 'Route', 'Assigned Date', 'End Date', 'Duration', 'Status'];
        let csvContent = headers.join(',');

        if (filteredAssignments.length > 0) {
            const csvData = filteredAssignments.map((a: any) => [
                a.busPlate,
                a.routeName,
                a.assignedDate,
                a.endDate || 'Ongoing',
                calculateDuration(a.assignedDate, a.endDate),
                a.isActive ? 'Active' : 'Inactive'
            ]);
            csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        } else {
            toast.error('No assignments found to export. Downloading template.');
        }

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `route_assignments_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (filteredAssignments.length > 0) toast.success('Export successful');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Bus-Route Assignment</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and monitor bus to route assignments</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Bus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{assignments.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ACTIVE:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{activeCount}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">EXPIRING:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{expiringCount}</span>
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

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <button 
                        onClick={handleExport}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={() => navigate('/dashboard/bus-route-assignments/create')}
                        className="flex items-center space-x-1.5 px-4 py-2.5 text-sm bg-[#2B4B9E] hover:bg-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-bold flex-shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Assignment</span>
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
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Route</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Assigned Date</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">End Date</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Schedule</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Status</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-navy-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
                                        <p className="text-gray-500">Loading assignments...</p>
                                    </td>
                                </tr>
                            ) : currentAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No assignments found</p>
                                    </td>
                                </tr>
                            ) : (
                                currentAssignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assignment.busPlate}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{assignment.routeName}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {new Date(assignment.assignedDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {assignment.endDate ? (
                                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                                    {new Date(assignment.endDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400 dark:text-slate-500">Ongoing</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{assignment.scheduleName}</span>
                                                <span className="text-xs text-slate-500">{assignment.departureTime}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.isActive
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                {assignment.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {assignment.isActive && (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => navigate('/dashboard/bus-route-assignments/edit', { state: { editData: assignment } })}
                                                        className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md hover:bg-amber-100 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeactivate(assignment.id)}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 transition-colors"
                                                    >
                                                        Deactivate
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredAssignments.length > 0 && (
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
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredAssignments.length)} of {filteredAssignments.length} entries
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
                                        : 'text-gray-600 hover:bg-gray-100'
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