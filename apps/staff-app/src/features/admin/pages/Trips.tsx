import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { Search, Download, Plus, Trash2, Flag, Clock, Eye, User, Edit2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripService } from '@/services/trip.service';
import { busService } from '@/services/bus.service';
import { driverService } from '@/services/driver.service';
import { Trip } from '@/types';

export function Trips() {
    const { confirm } = useConfirm();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data: trips = [], isLoading, error } = useQuery({
        queryKey: ['trips'],
        queryFn: () => tripService.getAll()
    });



    const deleteTripMutation = useMutation({
        mutationFn: (id: string) => tripService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        }
    });

    const startTripMutation = useMutation({
        mutationFn: (id: string) => tripService.start(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });

    const endTripMutation = useMutation({
        mutationFn: (id: string) => tripService.end(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });

    // Filtering
    const filteredTrips = trips.filter((trip: any) => {
        const matchesStatus = filterStatus === 'All' || trip.status === filterStatus.toLowerCase();
        if (!searchTerm) return matchesStatus;

        const plate = trip.bus?.plateNumber?.toLowerCase() || '';
        const driverName = trip.driver?.fullName?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        const matchesSearch = plate.includes(search) || driverName.includes(search) || (trip.tripNumber && trip.tripNumber.toLowerCase().includes(search));
        
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTrips.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTrips = filteredTrips.slice(startIndex, endIndex);



    const handleExport = () => {
        if (!filteredTrips.length) return;
        const csvContent = [
            ['Trip ID', 'Plate Number', 'Route', 'Driver', 'Scheduled Start', 'Status'].join(','),
            ...filteredTrips.map(trip => [
                `"${trip.tripNumber || `SB_${trip.id.substring(0, 4).toUpperCase()}`}"`,
                `"${trip.bus?.plateNumber || 'N/A'}"`,
                `"${trip.version?.route?.routeName || trip.route?.routeName || 'N/A'}"`,
                `"${trip.driver?.fullName || 'N/A'}"`,
                `"${trip.scheduledStart ? new Date(trip.scheduledStart).toLocaleString() : 'N/A'}"`,
                `"${trip.status}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Trips_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4 text-cyan-600 dark:text-cyan-400">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold tracking-wider uppercase">Loading Trips...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-500/10 rounded-2xl">
            <p className="font-semibold">Failed to load trips. Please try again later.</p>
        </div>
    );

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Trips & Dispatch</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor active journeys and schedule upcoming dispatches</p>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by plate number or driver..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors">
                        <option value="All">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/trips/new')}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Trip</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#F8F9FA] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider">TRIP ID / ROUTE</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider">ASSET INFO</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider">SCHEDULED START</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider">STATUS</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {currentTrips.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                                <Search className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No active trips found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentTrips.map((trip) => (
                                <tr key={trip.id} className="hover:bg-[#F8F9FA] transition-colors group cursor-pointer" onClick={() => navigate(`/dashboard/trips/${trip.id}`)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-[#EBF5FF] flex items-center justify-center flex-shrink-0 border border-blue-50">
                                                <Flag className="w-4 h-4 text-[#12B2E4]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 leading-tight">
                                                    {trip.tripNumber || `SB_${trip.id.substring(0, 4).toUpperCase()}`}
                                                </p>
                                                <p className="text-xs text-gray-400 font-semibold mt-0.5">{trip.version?.route?.routeName || trip.route?.routeName || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex -space-x-2">
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-bold text-gray-800 leading-tight">{trip.driver?.fullName || 'N/A'}</p>
                                                <p className="text-[11px] text-gray-400 font-semibold mt-0.5 font-mono uppercase">BUS: {trip.bus?.plateNumber?.substring(0, 7) || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm font-bold text-gray-700">
                                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                            {trip.scheduledStart ? new Date(trip.scheduledStart).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wide border ${trip.status === 'completed' ? 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5]' :
                                            trip.status === 'in_progress' ? 'bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE]' :
                                                trip.status === 'scheduled' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                                    'bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]'
                                            }`}>
                                            {trip.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            {trip.status === 'scheduled' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startTripMutation.mutate(trip.id);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-[#EFF6FF] hover:bg-blue-100 text-blue-600 rounded text-xs font-bold transition-colors border border-blue-100"
                                                >
                                                    Start
                                                </button>
                                            )}
                                            {trip.status === 'in_progress' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        endTripMutation.mutate(trip.id);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-xs font-bold transition-colors border border-emerald-100"
                                                >
                                                    End
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    alert('Edit Trip functionality is coming soon.');
                                                }}
                                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
                                                title="Edit Trip"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/dashboard/trips/${trip.id}`);
                                                }}
                                                className="p-1.5 hover:bg-cyan-50 text-cyan-600 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const isConfirmed = await confirm({ title: "Delete Trip", message: 'Are you sure?', confirmText: "Delete", cancelText: "Keep", isDanger: true });
                                                    if (isConfirmed) deleteTripMutation.mutate(trip.id);
                                                }}
                                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
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
                {filteredTrips.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Rows per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1 bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredTrips.length)} of {filteredTrips.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg disabled:opacity-50 transition-colors font-medium"
                            >
                                ← Back
                            </button>

                            <div className="flex items-center mx-2 gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors font-medium ${currentPage === i + 1
                                            ? 'bg-cyan-500 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg disabled:opacity-50 transition-colors font-medium"
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