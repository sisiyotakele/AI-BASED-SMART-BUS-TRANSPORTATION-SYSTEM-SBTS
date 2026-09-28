import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { Search, Download, Plus, Calendar, CheckCircle, XCircle, Users, Loader2 } from 'lucide-react';
import { BusDriverAssignmentModal } from '@/features/admin/components/BusDriverAssignmentModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { busDriverAssignmentService, BusDriverAssignment } from '@/services/bus-driver-assignment.service';
import { shiftService } from '@/services/shift.service';
import toast from 'react-hot-toast';

const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export function BusDriverAssignments() {
    const { confirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'cancelled'>('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<any>(null);

    const queryClient = useQueryClient();

    const { data: rawData = [], isLoading } = useQuery({
        queryKey: ['bus-driver-assignments'],
        queryFn: () => busDriverAssignmentService.getAssignments(),
    });

    const assignments = rawData.map((a: BusDriverAssignment) => ({
        id: a.id,
        busId: a.busId,
        shiftId: a.shiftId,
        busPlate: a.bus?.plateNumber || 'Unknown',
        driverName: a.shift?.driver?.fullName || 'Unassigned',
        shiftName: a.shift?.shiftName || 'Unknown Shift',
        shiftTime: a.shift && a.shift.shiftStart && a.shift.shiftEnd ? `${formatTime(a.shift.shiftStart as unknown as string)} - ${formatTime(a.shift.shiftEnd as unknown as string)}` : '—',
        assignedDate: a.assignedDate,
        status: a.status,
    }));

    // Filtering
    const filteredAssignments = assignments.filter((assignment: any) => {
        const matchesSearch =
            assignment.busPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.shiftName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
        const matchesDate = !selectedDate || assignment.assignedDate.startsWith(selectedDate);
        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination
    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

    // Stats
    const activeCount = assignments.filter((a: any) => a.status === 'active').length;
    const cancelledCount = assignments.filter((a: any) => a.status === 'cancelled').length;
    const todayCount = assignments.filter((a: any) => {
        const today = new Date().toISOString().split('T')[0];
        return a.assignedDate?.startsWith(today);
    }).length;

    const createMutation = useMutation({
        mutationFn: (data: any) => busDriverAssignmentService.createAssignmentWithShift(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bus-driver-assignments'] });
            toast.success('Shift created and bus assigned successfully');
            setIsModalOpen(false);
            setEditingAssignment(null);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create shift & assign bus. Please check for overlap.'),
    });


    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            if (data.shiftId) {
                // Update existing shift
                await shiftService.update(data.shiftId, {
                    driverId: data.driverId,
                    shiftName: data.shiftName,
                    shiftStart: data.shiftStart,
                    shiftEnd: data.shiftEnd,
                    shiftDate: data.assignedDate,
                });

                // Update assignment
                return busDriverAssignmentService.updateAssignment(id, {
                    busId: data.busId,
                    assignedDate: data.assignedDate,
                    status: data.status
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bus-driver-assignments'] });
            toast.success('Unified assignment updated successfully');
            setIsModalOpen(false);
            setEditingAssignment(null);
        },
        onError: () => toast.error('Failed to update assignment'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => busDriverAssignmentService.deleteAssignment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bus-driver-assignments'] });
            toast.success('Assignment cancelled');
        },
        onError: () => toast.error('Failed to cancel assignment'),
    });

    const handleCreateAssignment = async (assignmentData: any) => {
        if (editingAssignment) {
            updateMutation.mutate({ id: editingAssignment.id, data: assignmentData });
        } else {
            createMutation.mutate(assignmentData);
        }
    };

    const handleCancel = async (assignmentId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to cancel this assignment?', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteMutation.mutate(assignmentId);
        }
    };

    const handleExport = () => {
        const headers = ['Bus', 'Driver', 'Shift', 'Shift Time', 'Assigned Date', 'Status'];
        let csvContent = headers.join(',');

        if (filteredAssignments.length > 0) {
            const csvData = filteredAssignments.map((a: any) => [
                a.busPlate,
                a.driverName,
                a.shiftName,
                a.shiftTime,
                a.assignedDate,
                a.status
            ]);
            csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        } else {
            toast.error('No assignments found to export. Downloading template.');
        }

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `driver_assignments_export_${new Date().toISOString().split('T')[0]}.csv`;
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
            <BusDriverAssignmentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAssignment(null);
                }}
                onSubmit={handleCreateAssignment}
                editData={editingAssignment}
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Driver Shift Assignment</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and assign driver shifts efficiently</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{assignments.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ACTIVE:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{activeCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CANCELLED:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{cancelledCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <button 
                        onClick={handleExport}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
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
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Driver</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Shift</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Shift Time</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Assigned Date</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Status</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-right">Actions</th>
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
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
                                            <span className="text-sm text-slate-900 dark:text-slate-100">{assignment.driverName}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{assignment.shiftName}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">{assignment.shiftTime}</span>
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
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {assignment.status === 'active' ? 'Active' : 'Cancelled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {assignment.status === 'active' && (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingAssignment({
                                                                id: assignment.id,
                                                                busId: assignment.busId,
                                                                shiftId: assignment.shiftId,
                                                                assignedDate: assignment.assignedDate ? new Date(assignment.assignedDate).toISOString().split('T')[0] : '',
                                                                status: assignment.status
                                                            });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(assignment.id)}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                                                    >
                                                        Cancel Assignment
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