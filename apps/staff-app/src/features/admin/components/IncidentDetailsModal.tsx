import { useState } from 'react';
import { X, MapPin, Calendar, AlertTriangle, CheckCircle, Eye, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentService } from '@/services/incident.service';
import type { Incident } from '@/types';


interface IncidentDetailsModalProps {
    incident: Incident;
    onClose: () => void;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
    reported: ['investigating'],
    investigating: ['resolved'],
    resolved: ['closed'],
};

export function IncidentDetailsModal({ incident, onClose }: IncidentDetailsModalProps) {
    const [showResolveForm, setShowResolveForm] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const reviewMutation = useMutation({
        mutationFn: () => incidentService.review(incident.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            onClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to review incident');
        }
    });

    const resolveMutation = useMutation({
        mutationFn: () => incidentService.resolve(incident.id, resolutionNotes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            onClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to resolve incident');
        }
    });

    const canTransitionTo = (targetStatus: string) => {
        return VALID_TRANSITIONS[incident.status]?.includes(targetStatus) || false;
    };

    const handleReview = () => {
        reviewMutation.mutate();
    };

    const handleResolve = () => {
        if (!resolutionNotes.trim()) {
            setError('Resolution notes are required');
            return;
        }
        resolveMutation.mutate();
    };

    const getSeverityColor = (severity: Incident['severity']) => {
        switch (severity) {
            case 'critical':
                return 'text-red-600 bg-red-50';
            case 'high':
                return 'text-orange-600 bg-orange-50';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50';
            case 'low':
                return 'text-blue-600 bg-blue-50';
        }
    };

    const getStatusColor = (status: Incident['status']) => {
        switch (status) {
            case 'reported':
                return 'text-red-600 bg-red-50';
            case 'investigating':
                return 'text-yellow-600 bg-yellow-50';
            case 'resolved':
                return 'text-green-600 bg-green-50';
            case 'closed':
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Incident Details</h2>
                            <p className="text-sm text-gray-500">ID: {incident.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                    {/* Status and Severity */}
                    <div className="flex items-center space-x-4">
                        <div className={`px-4 py-1.5 rounded-lg font-medium ${getStatusColor(incident.status)}`}>
                            Status: {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        </div>
                        <div className={`px-4 py-1.5 rounded-lg font-medium ${getSeverityColor(incident.severity)}`}>
                            Severity: {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </div>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Bus Information</h3>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500">Plate Number</p>
                                    <p className="text-sm font-semibold text-gray-900">{incident.bus?.plateNumber || incident.trip?.bus?.plateNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Driver</p>
                                    <p className="text-sm text-gray-900">{incident.trip?.driver?.fullName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Trip ID</p>
                                    <p className="text-sm text-gray-900">{incident.tripId}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Incident Information</h3>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500">Type</p>
                                    <p className="text-sm font-semibold text-gray-900">{incident.incidentType}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Reported At</p>
                                    <p className="text-sm text-gray-900 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(incident.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {incident.resolvedAt && (
                                    <div>
                                        <p className="text-xs text-gray-500">Resolved At</p>
                                        <p className="text-sm text-gray-900 flex items-center">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            {new Date(incident.resolvedAt).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {incident.description && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Description</h3>
                            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{incident.description}</p>
                        </div>
                    )}

                    {/* Location */}
                    {incident.latitude && incident.longitude && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Location</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                                <MapPin className="w-4 h-4 text-cyan-600" />
                                <span>
                                    Latitude: {Number(incident.latitude).toFixed(6)}, Longitude: {Number(incident.longitude).toFixed(6)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Photo */}
                    {(incident as any).photoUrl && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Photo</h3>
                            <a
                                href={(incident as any).photoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-sm text-cyan-600 hover:text-cyan-700 bg-gray-50 p-4 rounded-lg"
                            >
                                <Eye className="w-4 h-4" />
                                <span>View Photo</span>
                            </a>
                        </div>
                    )}

                    {/* Resolution Notes */}
                    {incident.resolutionNotes && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Resolution Notes</h3>
                            <p className="text-sm text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200">
                                {incident.resolutionNotes}
                            </p>
                        </div>
                    )}

                    {/* Resolve Form */}
                    {showResolveForm && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Resolve Incident</h3>
                            <textarea
                                rows={3}
                                placeholder="Enter resolution notes..."
                                value={resolutionNotes}
                                onChange={(e) => {
                                    setResolutionNotes(e.target.value);
                                    setError('');
                                }}
                                className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 text-gray-900 dark:text-white border border-gray-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                            <div className="flex items-center space-x-2 mt-3">
                                <button
                                    onClick={handleResolve}
                                    disabled={resolveMutation.isPending}
                                    className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Resolution'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowResolveForm(false);
                                        setResolutionNotes('');
                                        setError('');
                                    }}
                                    className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
                    {canTransitionTo('investigating') && (
                        <button
                            onClick={handleReview}
                            disabled={reviewMutation.isPending}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                            {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : 'Start Investigation'}
                        </button>
                    )}

                    {canTransitionTo('resolved') && !showResolveForm && (
                        <button
                            onClick={() => setShowResolveForm(true)}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Resolve Incident
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
