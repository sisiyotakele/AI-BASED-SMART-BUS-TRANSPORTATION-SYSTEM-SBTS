import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { Search, Download, Plus, XCircle, Calendar, CheckCircle, AlertCircle, Loader2, Edit2 } from 'lucide-react';
import { BusRouteAssignmentModal } from '@/features/admin/components/BusRouteAssignmentModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { busRouteAssignmentService, BusRouteAssignment } from '@/services/bus-route-assignment.service';
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<any>(null);

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

    const createMutation = useMutation({
        mutationFn: (data: any) => busRouteAssignmentService.createAssignment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bus-route-assignments'] });
            toast.success('Assignment created successfully');
            setIsModalOpen(false);
            setEditingAssignment(null);
        },
        onError: () => toast.error('Failed to create assignment'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, payload: any }) => busRouteAssignmentService.updateAssignment(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bus-route-assignments'] });
            toast.success('Assignment updated successfully');
            setIsModalOpen(false);
            setEditingAssignment(null);
        },
        onError: () => toast.error('Failed to update assignment'),
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => busRouteAssignmentService.deactivateAssignment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bus-route-assignments'] });
            toast.success('Assignment deactivated');
        },
        onError: () => toast.error('Failed to deactivate assignment'),
    });

    const handleCreateAssignment = async (assignmentData: any) => {
        if (editingAssignment) {
            updateMutation.mutate({ id: editingAssignment.id, payload: assignmentData });
        } else {
            createMutation.mutate(assignmentData);
        }
    };

    const handleEdit = (assignment: any) => {
        setEditingAssignment(assignment);
        setIsModalOpen(true);
    };

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
            <BusRouteAssignmentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAssignment(null);
                }}
                onSubmit={handleCreateAssignment}
                editData={editingAssignment}
            />

            {/* Strict Single-Line Non-Scrollable Header */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">

                    {/* Left: Title & Inline Compact Stats (Full Words, No Abbreviations) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Bus-Route Assignments</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{assignments.length}</span>
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

                            <div className="flex items-center space-x-1 bg-orange-500/20 px-2 py-1 rounded shrink-0">
                                <AlertCircle className="w-3.5 h-3.5 text-orange-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Expiring:</span>
                                <span className="text-xs font-bold text-white">{expiringCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search, Filter, Export & Action Buttons */}
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
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <button 
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-transparent dark:border-navy-600 rounded hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Assignment</span>
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Route</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Assigned Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">End Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
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
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assignment.busPlate}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{assignment.routeName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {new Date(assignment.assignedDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
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
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {calculateDuration(assignment.assignedDate, assignment.endDate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {assignment.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {assignment.isActive && (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(assignment)}
                                                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeactivate(assignment.id)}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
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