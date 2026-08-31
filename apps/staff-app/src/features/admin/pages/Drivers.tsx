import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Plus, Edit2, Trash2, UserCheck, UserX, Calendar, Bus as BusIcon } from 'lucide-react';
import { DriverModal } from '@/features/admin/components/DriverModal';
import { BusDriverAssignmentModal } from '@/features/admin/components/BusDriverAssignmentModal';
import { driverService } from '@/services/driver.service';
import { shiftService } from '@/services/shift.service';
import { busDriverAssignmentService } from '@/services/bus-driver-assignment.service';
import { terminalsApi } from '@/services/api/terminals.api';
import { Driver } from '@/types';
import toast from 'react-hot-toast';

const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0; // Expiring within 90 days
};

const isLicenseExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
};

export function Drivers() {
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assigningDriver, setAssigningDriver] = useState<Driver | null>(null);

    // Fetch Drivers
    const { data: drivers = [], isLoading, error } = useQuery({
        queryKey: ['drivers', searchTerm, filterStatus],
        queryFn: () => {
            const isActive = filterStatus === 'all' ? undefined : filterStatus === 'active';
            return driverService.getAll(searchTerm, 'all', isActive);
        }
    });

    // Fetch Terminals for Modal
    const { data: terminals = [] } = useQuery({
        queryKey: ['terminals'],
        queryFn: () => terminalsApi.getAll(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: driverService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast.success('Driver added successfully');
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add driver');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) => driverService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast.success('Driver updated successfully');
            setIsModalOpen(false);
            setEditingDriver(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update driver');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: driverService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast.success('Driver deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete driver');
        }
    });

    const assignShiftBusMutation = useMutation({
        mutationFn: async (data: any) => {
            // 1. Create Shift first
            const shift = await shiftService.create({
                driverId: data.driverId,
                shiftName: data.shiftName,
                shiftStart: data.shiftStart,
                shiftEnd: data.shiftEnd,
                shiftDate: data.assignedDate,
                isActive: true
            });
            // 2. Create the Bus-Driver Assignment using the new shift ID
            return busDriverAssignmentService.createAssignment({
                busId: data.busId,
                shiftId: shift.id,
                assignedDate: data.assignedDate,
                status: data.status || 'active'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['bus-driver-assignments'] });
            toast.success('Shift and bus assigned successfully');
            setIsAssignModalOpen(false);
            setAssigningDriver(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign shift and bus. Check for overlapping shifts.');
        }
    });

    // Filtering (Frontend-side pagination)
    const filteredDrivers = drivers;
    const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDrivers = filteredDrivers.slice(startIndex, endIndex);

    // Stats
    const activeCount = drivers.filter(d => d.isActive).length;
    const inactiveCount = drivers.filter(d => !d.isActive).length;
    const expiringLicensesCount = drivers.filter(d => isLicenseExpiringSoon(d.licenseExpiry)).length;

    const handleAddDriver = async () => {
        setEditingDriver(null);
        setIsModalOpen(true);
    };

    const handleEditDriver = async (driver: Driver) => {
        setEditingDriver(driver);
        setIsModalOpen(true);
    };

    const handleSubmitDriver = async (driverData: Partial<Driver>) => {
        if (editingDriver) {
            updateMutation.mutate({ id: editingDriver.id, data: driverData });
        } else {
            createMutation.mutate(driverData);
        }
    };

    const handleDeleteDriver = async (driverId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to delete this driver?', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteMutation.mutate(driverId);
        }
    };

    const handleToggleStatus = async (driverId: string, currentStatus: boolean) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this driver?`, confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            updateMutation.mutate({ id: driverId, data: { isActive: !currentStatus } });
        }
    };

    const handleAssignShiftBus = (driver: Driver) => {
        setAssigningDriver(driver);
        setIsAssignModalOpen(true);
    };

    const handleAssignSubmit = (data: any) => {
        if (!assigningDriver) return;
        assignShiftBusMutation.mutate({
            ...data,
            driverId: assigningDriver.id,
        });
    };

    const handleExport = () => {
        const headers = ['Full Name', 'Department', 'Email', 'Phone', 'License Number', 'License Expiry', 'Home Terminal', 'Preferred Language', 'Status'];
        let csvContent = headers.join(',');

        if (filteredDrivers.length > 0) {
            const csvData = filteredDrivers.map(d => [
                d.fullName,
                d.department || 'N/A',
                d.email,
                d.phone,
                d.licenseNumber,
                new Date(d.licenseExpiry).toLocaleDateString(),
                d.homeTerminal?.terminalName || 'Not assigned',
                d.preferredLanguage || 'N/A',
                d.isActive ? 'Active' : 'Inactive'
            ]);
            csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        } else {
            toast.error('No drivers found to export. Downloading template.');
        }

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `drivers_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (filteredDrivers.length > 0) toast.success('Export successful');
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
        <div className="flex items-center justify-center h-96 text-red-600">
            Failed to load drivers
        </div>
    );

    return (
        <div className="space-y-4">
            <DriverModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDriver(null);
                }}
                onSubmit={handleSubmitDriver}
                driver={editingDriver}
                terminals={terminals}
            />

            <BusDriverAssignmentModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setAssigningDriver(null);
                }}
                onSubmit={handleAssignSubmit}
                editData={null}
                defaultDriverId={assigningDriver?.id}
            />

            {/* Strict Single-Line Non-Scrollable Header */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">

                    {/* Left: Title & Inline Compact Stats (Full Words, No Abbreviations) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Drivers</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <UserCheck className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{drivers.length}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <UserCheck className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Active:</span>
                                <span className="text-xs font-bold text-white">{activeCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-gray-500/20 px-2 py-1 rounded shrink-0">
                                <UserX className="w-3.5 h-3.5 text-gray-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Inactive:</span>
                                <span className="text-xs font-bold text-white">{inactiveCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-orange-500/20 px-2 py-1 rounded shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-orange-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Expiring:</span>
                                <span className="text-xs font-bold text-white">{expiringLicensesCount}</span>
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
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-transparent dark:border-navy-600 rounded hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>

                        <button
                            onClick={handleAddDriver}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Driver</span>
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">License</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Home Terminal</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                            {currentDrivers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No drivers found</p>
                                    </td>
                                </tr>
                            ) : (
                                currentDrivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{driver.fullName}</p>
                                                {driver.department && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{driver.department}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">{driver.email}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{driver.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{driver.licenseNumber}</p>
                                                <p className={`text-xs ${isLicenseExpired(driver.licenseExpiry)
                                                    ? 'text-red-600 dark:text-red-400 font-semibold'
                                                    : isLicenseExpiringSoon(driver.licenseExpiry)
                                                        ? 'text-orange-600 dark:text-orange-400'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                    Exp: {new Date(driver.licenseExpiry).toLocaleDateString()}
                                                    {isLicenseExpired(driver.licenseExpiry) && ' (Expired)'}
                                                    {isLicenseExpiringSoon(driver.licenseExpiry) && !isLicenseExpired(driver.licenseExpiry) && ' (Expiring Soon)'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {driver.homeTerminal?.terminalName || <span className="text-slate-400 dark:text-slate-500">Not assigned</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(driver.id, driver.isActive)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${driver.isActive
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                                                    } transition-colors cursor-pointer`}
                                            >
                                                {driver.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleAssignShiftBus(driver)}
                                                    className="p-1 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded transition-colors"
                                                    title="Assign Shift & Bus"
                                                >
                                                    <BusIcon className="w-4 h-4 text-cyan-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditDriver(driver)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-navy-800 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDriver(driver.id)}
                                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
                {filteredDrivers.length > 0 && (
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
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredDrivers.length)} of {filteredDrivers.length} entries
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