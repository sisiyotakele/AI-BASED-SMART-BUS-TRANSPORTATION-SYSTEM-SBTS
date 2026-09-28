import { useState } from 'react';
import { Search, Download, Plus, Eye, AlertTriangle, AlertCircle, Info, XCircle, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { IncidentModal } from '@/features/admin/components/IncidentModal';
import { IncidentDetailsModal } from '@/features/admin/components/IncidentDetailsModal';
import 'leaflet/dist/leaflet.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentService } from '@/services/incident.service';
import type { Incident } from '@/types';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';

const getSeverityIcon = (severity: Incident['severity']) => {
    switch (severity) {
        case 'critical':
            return <XCircle className="w-4 h-4" />;
        case 'high':
            return <AlertTriangle className="w-4 h-4" />;
        case 'medium':
            return <AlertCircle className="w-4 h-4" />;
        case 'low':
            return <Info className="w-4 h-4" />;
    }
};

const getSeverityColor = (severity: Incident['severity']) => {
    switch (severity) {
        case 'critical':
            return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50';
        case 'high':
            return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50';
        case 'medium':
            return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50';
        case 'low':
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50';
    }
};

const getStatusColor = (status: Incident['status']) => {
    switch (status) {
        case 'reported':
            return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50';
        case 'investigating':
            return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50';
        case 'resolved':
            return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50';
        case 'closed':
            return 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600';
    }
};

const getStatusLabel = (status: Incident['status']) => {
    switch (status) {
        case 'reported':
            return 'Reported';
        case 'investigating':
            return 'Investigating';
        case 'resolved':
            return 'Resolved';
        case 'closed':
            return 'Closed';
    }
};

// Custom marker icons for incidents
const criticalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const highIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const mediumIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const lowIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const getIncidentIcon = (severity: Incident['severity']) => {
    switch (severity) {
        case 'critical': return criticalIcon;
        case 'high': return highIcon;
        case 'medium': return mediumIcon;
        case 'low': return lowIcon;
    }
};

export function Incidents() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'reported' | 'investigating' | 'resolved' | 'closed'>('all');
    const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [showMapView, setShowMapView] = useState(false);
    const [deleteIncidentId, setDeleteIncidentId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: allIncidents = [] } = useQuery({
        queryKey: ['incidents', filterStatus, filterSeverity],
        queryFn: () => incidentService.getAll(filterStatus, filterSeverity)
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => incidentService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            toast.success('Incident created successfully');
            setIsCreateModalOpen(false);
        },
        onError: () => toast.error('Failed to create incident')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => incidentService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            toast.success('Incident deleted successfully');
        },
        onError: () => toast.error('Failed to delete incident')
    });

    // Filtering
    const filteredIncidents = allIncidents.filter(incident => {
        const matchesSearch =
            (incident.bus?.plateNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (incident.trip?.driver?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (incident.incidentType?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Pagination
    const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentIncidents = filteredIncidents.slice(startIndex, endIndex);

    // Stats
    const reportedCount = allIncidents.filter(i => i.status === 'reported').length;
    const investigatingCount = allIncidents.filter(i => i.status === 'investigating').length;
    const criticalCount = allIncidents.filter(i => i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved').length;

    const handleCreateIncident = (incidentData: any) => {
        createMutation.mutate(incidentData);
    };

    const handleViewIncident = (incident: Incident) => {
        setSelectedIncident(incident);
    };

    const handleDeleteIncident = (incidentId: string) => {
        setDeleteIncidentId(incidentId);
    };

    const confirmDelete = () => {
        if (deleteIncidentId) {
            deleteMutation.mutate(deleteIncidentId);
            setDeleteIncidentId(null);
        }
    };

    const handleExport = () => {
        const headers = ['ID', 'Bus Plate', 'Driver', 'Incident Type', 'Severity', 'Status', 'Description', 'Reported At'];
        
        let csvContent = headers.join(',');
        
        if (filteredIncidents.length > 0) {
            const csvData = filteredIncidents.map(i => [
                i.id,
                i.bus?.plateNumber || i.trip?.bus?.plateNumber || 'N/A',
                i.trip?.driver?.fullName || 'N/A',
                i.incidentType || 'N/A',
                i.severity,
                i.status,
                `"${(i.description || '').replace(/"/g, '""')}"`,
                new Date(i.createdAt).toISOString()
            ]);
            csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        } else {
            toast.error('No incidents found to populate export. Exporting empty template.');
        }
        
        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `incidents_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (filteredIncidents.length > 0) {
                toast.success('Incidents successfully exported!');
            }
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to generate CSV export.');
        }
    };

    return (
        <div className="space-y-4">
            <IncidentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateIncident}
            />

            <ConfirmModal
                isOpen={!!deleteIncidentId}
                onCancel={() => setDeleteIncidentId(null)}
                onConfirm={confirmDelete}
                title="Delete Incident"
                message="Are you sure you want to delete this incident? This action cannot be undone."
                confirmText="Delete Incident"
                isDanger={true}
            />

            {selectedIncident && (
                <IncidentDetailsModal
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                />
            )}

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Incidents</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor and respond to operational incidents in real-time</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <AlertTriangle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{allIncidents.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CRITICAL:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{criticalCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">REPORTED:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{reportedCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">INVESTIGATING:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{investigatingCount}</span>
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
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <option value="all">All Status</option>
                        <option value="reported">Reported</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>

                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value as any)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <option value="all">All Severity</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <button 
                        onClick={handleExport}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={() => setShowMapView(true)}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <MapIcon className="w-4 h-4" />
                        <span>Map View</span>
                    </button>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center space-x-1.5 px-4 py-2.5 text-sm bg-[#2B4B9E] hover:bg-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-bold flex-shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Report Incident</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-navy-700">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-[#2B4B9E] text-white">
                            <tr className="h-[70px]">
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Bus/Driver</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Incident Type</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Severity</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Status</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-left">Reported At</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentIncidents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <AlertTriangle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">No incidents found</p>
                                    </td>
                                </tr>
                            ) : (
                                currentIncidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-slate-50 dark:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{incident.bus?.plateNumber || incident.trip?.bus?.plateNumber || 'N/A'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{incident.driver?.fullName || incident.trip?.driver?.fullName || 'Unassigned Driver'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{incident.incidentType}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                                                {getSeverityIcon(incident.severity)}
                                                <span className="capitalize">{incident.severity}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                                                {getStatusLabel(incident.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {new Date(incident.createdAt).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewIncident(incident)}
                                                    className="p-1 hover:bg-cyan-50 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4 text-cyan-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteIncident(incident.id)}
                                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Incident"
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
                {filteredIncidents.length > 0 && (
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
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredIncidents.length)} of {filteredIncidents.length} entries
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
                                    className={`px-3 py-1 text-sm rounded transition-colors ${currentPage === i + 1
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
                                className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded disabled:text-slate-400 dark:text-slate-500 disabled:hover:bg-transparent transition-colors font-medium"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Map View Modal */}
            {showMapView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-navy-700">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Incidents Map</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View all incidents on map by location</p>
                            </div>
                            <button
                                onClick={() => setShowMapView(false)}
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400 text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Map */}
                            <div className="flex-1">
                                <MapContainer
                                    center={[9.0320, 38.7469]}
                                    zoom={12}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    {filteredIncidents
                                        .filter(incident => incident.latitude && incident.longitude)
                                        .map((incident) => (
                                            <Marker
                                                key={incident.id}
                                                position={[incident.latitude!, incident.longitude!]}
                                                icon={getIncidentIcon(incident.severity)}
                                            >
                                                <Popup>
                                                    <div className="text-sm p-2">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            {getSeverityIcon(incident.severity)}
                                                            <p className="font-semibold">{incident.incidentType}</p>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{incident.description}</p>
                                                        <div className="space-y-1 text-xs">
                                                            <p><strong>Bus:</strong> {incident.bus?.plateNumber || 'N/A'}</p>
                                                            <p><strong>Driver:</strong> {incident.driver?.fullName || incident.trip?.driver?.fullName || 'Unassigned Driver'}</p>
                                                            <p>
                                                                <strong>Severity:</strong>{' '}
                                                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                                                                    {incident.severity}
                                                                </span>
                                                            </p>
                                                            <p>
                                                                <strong>Status:</strong>{' '}
                                                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                                                                    {getStatusLabel(incident.status)}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setShowMapView(false);
                                                                handleViewIncident(incident);
                                                            }}
                                                            className="mt-2 w-full px-2 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                                                        >
                                                            View Details
                                                        </button>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                </MapContainer>
                            </div>

                            {/* Legend */}
                            <div className="w-64 border-l border-slate-200 dark:border-navy-700 p-4 overflow-y-auto">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Legend</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-xs text-slate-700 dark:text-slate-300">Critical ({allIncidents.filter(i => i.severity === 'critical').length})</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                                        <span className="text-xs text-slate-700 dark:text-slate-300">High ({allIncidents.filter(i => i.severity === 'high').length})</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                        <span className="text-xs text-slate-700 dark:text-slate-300">Medium ({allIncidents.filter(i => i.severity === 'medium').length})</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                        <span className="text-xs text-slate-700 dark:text-slate-300">Low ({allIncidents.filter(i => i.severity === 'low').length})</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Filters</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Status</label>
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                                className="w-full mt-1 px-2 py-1.5 text-xs bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-navy-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="reported">Reported</option>
                                                <option value="investigating">Investigating</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Severity</label>
                                            <select
                                                value={filterSeverity}
                                                onChange={(e) => setFilterSeverity(e.target.value as any)}
                                                className="w-full mt-1 px-2 py-1.5 text-xs bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-navy-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="all">All Severity</option>
                                                <option value="critical">Critical</option>
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Statistics</h3>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Total Incidents:</span>
                                            <span className="font-semibold">{filteredIncidents.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">On Map:</span>
                                            <span className="font-semibold">
                                                {filteredIncidents.filter(i => i.latitude && i.longitude).length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Reported:</span>
                                            <span className="font-semibold text-red-600">
                                                {filteredIncidents.filter(i => i.status === 'reported').length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Resolved:</span>
                                            <span className="font-semibold text-green-600">
                                                {filteredIncidents.filter(i => i.status === 'resolved').length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-navy-700 flex justify-end">
                            <button
                                onClick={() => setShowMapView(false)}
                                className="px-4 py-2 text-sm bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:bg-slate-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteIncidentId}
                title="Delete Incident"
                message="Are you sure you want to delete this incident? This action cannot be undone."
                confirmText="Delete Incident"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteIncidentId(null)}
            />
        </div>
    );
}
