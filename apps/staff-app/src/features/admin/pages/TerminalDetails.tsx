import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { terminalsApi } from '@/services/api/terminals.api';
import { ArrowLeft, Building2, MapPin, User, Phone, Bus, Activity } from 'lucide-react';

export function TerminalDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: terminal, isLoading, error } = useQuery({
        queryKey: ['terminal', id],
        queryFn: () => terminalsApi.getById(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 text-cyan-600 dark:text-cyan-400">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold tracking-wider uppercase">Fetching Terminal Logistics...</p>
                </div>
            </div>
        );
    }

    if (error || !terminal) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Terminal Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    The requested terminal sector could not be located in the database.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/dashboard/terminals')} className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
                        Return to Terminals
                    </button>
                </div>
            </div>
        );
    }

    const assignedBuses = (terminal as any).buses || [];
    const operationalBuses = assignedBuses.filter((b: any) => b.maintenanceStatus === 'operational').length;
    const maintenanceBuses = assignedBuses.filter((b: any) => b.maintenanceStatus !== 'operational').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div
                        onClick={() => navigate('/dashboard/terminals')}
                        className="p-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-700 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {terminal.terminalName}
                            </h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                terminal.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                                    : terminal.status === 'maintenance'
                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-navy-800 dark:text-slate-400 dark:border-navy-600'
                            }`}>
                                {terminal.status || 'UNKNOWN'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {terminal.address || 'Address Not Specified'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                            <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{assignedBuses.length}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Total Fleet Size</p>
                </div>

                <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{operationalBuses}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Operational Buses</p>
                </div>

                <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                            <Activity className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{maintenanceBuses}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">In Maintenance</p>
                </div>

                <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm flex flex-col justify-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Management Details</p>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm">
                            <User className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                            <span className="text-slate-800 dark:text-slate-200 truncate">{terminal.managerName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
                            <span className="text-slate-800 dark:text-slate-200 font-mono truncate">{terminal.phoneNumber || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fleet List Container */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between bg-slate-50 dark:bg-navy-800">
                    <div className="flex items-center gap-2">
                        <Bus className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Stationed Fleet Inventory</h3>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                        {assignedBuses.length} Vehicles
                    </span>
                </div>

                <div className="p-5 flex-1 overflow-y-auto">
                    {assignedBuses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 dark:text-slate-400">
                            <Bus className="w-16 h-16 text-slate-200 dark:text-navy-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Fleet Data</h3>
                            <p className="max-w-md">There are currently no buses assigned to this terminal. Go to the Buses module to dispatch buses to this location.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-navy-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-navy-800/50">
                                        <th className="px-6 py-4 font-medium">Plate Number</th>
                                        <th className="px-6 py-4 font-medium">Model</th>
                                        <th className="px-6 py-4 font-medium">Maintenance Status</th>
                                        <th className="px-6 py-4 font-medium text-right">Identifier</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                                    {assignedBuses.map((bus: any) => (
                                        <tr key={bus.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-mono font-bold text-slate-900 dark:text-white tracking-widest">{bus.plateNumber}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 dark:text-slate-300">{bus.model}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${
                                                    bus.maintenanceStatus === 'operational'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                                        : bus.maintenanceStatus === 'in_maintenance'
                                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-400'
                                                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                                                }`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                                    <span className="capitalize">{bus.maintenanceStatus.replace('_', ' ')}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-xs text-slate-400 font-mono">ID: {bus.id.substring(0, 8)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
