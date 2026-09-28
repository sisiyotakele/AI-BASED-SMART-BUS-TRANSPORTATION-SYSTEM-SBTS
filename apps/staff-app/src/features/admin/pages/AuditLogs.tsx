import { useState } from 'react';
import { Search, FileText, Download, Eye, User, Calendar, Loader2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditLog, auditLogService } from '@/services/audit-log.service';

export function AuditLogs() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterEntity, setFilterEntity] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const { data: auditResponse, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['audit-logs', { action: filterAction, entityName: filterEntity }],
        queryFn: () => auditLogService.getAuditLogs({
            action: filterAction === 'all' ? undefined : filterAction,
            entityName: filterEntity === 'all' ? undefined : filterEntity,
        }),
        refetchInterval: 5000, // Real-time polling every 5s
        staleTime: 2000,
    });

    const logs = auditResponse || [];
    
    // Pagination
    const totalLogs = logs.length;
    const totalPages = Math.ceil(totalLogs / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentLogs = logs.slice(startIndex, endIndex);

    // Stats Calculation
    const uniqueUsers = new Set(logs.map((l: AuditLog) => l.userId)).size;
    const today = new Date();
    const todayLogsArr = logs.filter((l: AuditLog) => new Date(l.createdAt).toDateString() === today.toDateString());
    const todayLogs = todayLogsArr.length;

    // Last 7 days logs
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const last7DaysLogs = logs.filter((l: AuditLog) => new Date(l.createdAt) >= sevenDaysAgo).length;

    // Action Distribution
    const actionCounts = { CREATE: 0, UPDATE: 0, DELETE: 0, OTHER: 0 };
    logs.forEach((l: AuditLog) => {
        if (l.action === 'CREATE') actionCounts.CREATE++;
        else if (l.action === 'UPDATE') actionCounts.UPDATE++;
        else if (l.action === 'DELETE') actionCounts.DELETE++;
        else actionCounts.OTHER++;
    });
    
    // Entity Distribution
    const entityCountMap: Record<string, number> = {};
    logs.forEach((l: AuditLog) => {
        entityCountMap[l.entityName] = (entityCountMap[l.entityName] || 0) + 1;
    });
    const topEntities = Object.entries(entityCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Most Active User
    const userCountMap: Record<string, { count: number, name: string }> = {};
    logs.forEach((l: AuditLog) => {
        const id = l.userId || 'system';
        const name = l.user?.fullName || 'System';
        if (!userCountMap[id]) userCountMap[id] = { count: 0, name };
        userCountMap[id].count++;
    });
    const sortedUsers = Object.values(userCountMap).sort((a, b) => b.count - a.count);
    const mostActiveUser = sortedUsers[0] || { name: 'None', count: 0 };
    
    const todayUserCountMap: Record<string, number> = {};
    todayLogsArr.forEach((l: AuditLog) => {
        const id = l.userId || 'system';
        todayUserCountMap[id] = (todayUserCountMap[id] || 0) + 1;
    });
    const mostActiveUserTodayActions = sortedUsers[0] && userCountMap[sortedUsers[0].name === 'System' ? 'system' : '']?.count || 0; // rough fallback

    // Most Modified Entity
    const mostModifiedEntity = topEntities[0] ? topEntities[0][0] : 'None';
    const mostModifiedEntityTotal = topEntities[0] ? topEntities[0][1] : 0;
    const mostModifiedEntityToday = topEntities[0] ? todayLogsArr.filter((l:AuditLog) => l.entityName === mostModifiedEntity).length : 0;

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700';
            case 'UPDATE': return 'bg-blue-100 text-blue-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
    };

    
    const exportToCSV = (dataToExport = logs) => {
        if (!dataToExport || dataToExport.length === 0) return;
        const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address', 'Description'];
        const rows = dataToExport.map((log: AuditLog) => [
            new Date(log.createdAt).toISOString(),
            log.user?.fullName || 'System',
            log.action,
            log.entityName,
            log.entityId || '',
            log.ipAddress || '',
            log.description ? `"${log.description.replace(/"/g, '""')}"` : ''
        ]);
        const csvContent = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportToJSON = (dataToExport = logs) => {
        if (!dataToExport || dataToExport.length === 0) return;
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };


    const exportToPDF = (dataToExport = logs) => {
        if (!dataToExport || dataToExport.length === 0) return;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('System Audit Logs', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        
        const tableColumn = ["Date", "Time", "User", "Action", "Entity", "IP Address"];
        const tableRows = dataToExport.map((log: AuditLog) => [
            new Date(log.createdAt).toLocaleDateString(),
            new Date(log.createdAt).toLocaleTimeString(),
            log.user?.fullName || 'System',
            log.action,
            log.entityName,
            log.ipAddress || '-'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [43, 75, 158] }
        });

        doc.save(`audit_logs_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportTodayLogs = () => {

        exportToCSV(todayLogsArr);
    };

    const handleCloseDetails = () => {
        setSelectedLog(null);
    };

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Audit Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Monitor system events and user actions</p>
                </div>

                {/* Control Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-navy-800 p-1.5 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm">
                    {/* Stats Pills */}
                    <div className="flex items-center gap-2 px-2 border-r border-slate-200 dark:border-navy-700">
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-navy-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-navy-700">
                            <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total:</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{totalLogs}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-navy-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-navy-700">
                            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Users:</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{uniqueUsers}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-navy-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-navy-700">
                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Today:</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{todayLogs}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="relative min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-navy-900 rounded-lg border-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400 transition-all font-medium"
                        />
                    </div>
                    
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-navy-900 rounded-lg border-none focus:ring-2 focus:ring-cyan-500 cursor-pointer font-medium"
                    >
                        <option value="all">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                    </select>

                    <select
                        value={filterEntity}
                        onChange={(e) => setFilterEntity(e.target.value)}
                        className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-navy-900 rounded-lg border-none focus:ring-2 focus:ring-cyan-500 cursor-pointer font-medium"
                    >
                        <option value="all">All Entities</option>
                        <option value="User">User</option>
                        <option value="Bus">Bus</option>
                        <option value="Trip">Trip</option>
                        <option value="Route">Route</option>
                        <option value="Price">Price</option>
                        <option value="Incident">Incident</option>
                    </select>

                    <div className="relative group flex items-center pr-1 gap-2">
                        <button onClick={() => refetch()} className="p-2 bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-navy-600" title="Refresh data">
                           <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-cyan-600' : ''}`} />
                        </button>
                        <button className="flex items-center space-x-1.5 px-4 py-2 text-sm bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium">
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                        {/* Dropdown */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                            <div className="py-1">
                                <button onClick={() => exportToCSV()} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700 flex items-center gap-2 transition-colors">
                                    <FileText className="w-4 h-4 text-cyan-600" />
                                    <span>Export as CSV</span>
                                </button>
                                <button onClick={() => exportToJSON()} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700 flex items-center gap-2 transition-colors">
                                    <FileText className="w-4 h-4 text-cyan-600" />
                                    <span>Export as JSON</span>
                                </button>
                                <button onClick={() => exportToPDF()} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700 flex items-center gap-2 transition-colors">
                                    <FileText className="w-4 h-4 text-cyan-600" />
                                    <span>Export as PDF</span>
                                </button>
                                <div className="border-t border-slate-200 dark:border-navy-700 my-1"></div>
                                <button onClick={exportTodayLogs} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700 flex items-center gap-2 transition-colors">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <span>Export Today's Logs</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Stat Card 1: Total Logs */}
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Total Logs</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{totalLogs}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xs text-gray-500">Last 7 days: {last7DaysLogs} logs</p>
                    </div>
                </div>

                {/* Stat Card 2: Activity Level */}
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Activity Level</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{totalLogs > 0 ? (todayLogs/totalLogs > 0.5 ? 'High' : 'Normal') : 'Low'}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${todayLogs/totalLogs > 0.5 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, Math.max(5, (todayLogs / (totalLogs || 1)) * 100))}%` }}></div>
                            </div>
                            <span className={`text-xs ${todayLogs/totalLogs > 0.5 ? 'text-green-600' : 'text-blue-600'}`}>{Math.round((todayLogs / (totalLogs || 1)) * 100)}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Share of total logs today</p>
                    </div>
                </div>

                {/* Stat Card 3: Top User */}
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Most Active User</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{mostActiveUser.name}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xs text-gray-500">Total actions: {mostActiveUser.count}</p>
                    </div>
                </div>

                {/* Stat Card 4: Most Modified Entity */}
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Most Modified Entity</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{mostModifiedEntity}</p>
                            <p className="text-xs text-gray-500">{mostModifiedEntityToday} modifications today</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xs text-gray-500">Total modifications: {mostModifiedEntityTotal}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Action Distribution Chart */}
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">Action Distribution</h3>
                        <span className="text-xs text-gray-500">Last 30 days</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="text-sm text-gray-700">Create</span>
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${totalLogs ? (actionCounts.CREATE / totalLogs) * 100 : 0}%` }}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{actionCounts.CREATE}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span className="text-sm text-gray-700">Update</span>
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${totalLogs ? (actionCounts.UPDATE / totalLogs) * 100 : 0}%` }}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{actionCounts.UPDATE}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span className="text-sm text-gray-700">Delete</span>
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${totalLogs ? (actionCounts.DELETE / totalLogs) * 100 : 0}%` }}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{actionCounts.DELETE}</span>
                        </div>
                    </div>
                </div>

                {/* Entity Distribution Chart */}
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">Entity Distribution</h3>
                        <span className="text-xs text-gray-500">Top 5 entities</span>
                    </div>
                    <div className="space-y-3">
                        {topEntities.length > 0 ? topEntities.map(([entity, count], index) => (
                            <div key={entity} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 w-24 overflow-hidden text-ellipsis whitespace-nowrap">
                                    <div className={`w-3 h-3 rounded shrink-0 ${index === 0 ? 'bg-cyan-500' : index === 1 ? 'bg-teal-500' : index === 2 ? 'bg-indigo-500' : index === 3 ? 'bg-purple-500' : 'bg-pink-500'}`}></div>
                                    <span className="text-xs text-gray-700 truncate">{entity}</span>
                                </div>
                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${index === 0 ? 'bg-cyan-500' : index === 1 ? 'bg-teal-500' : index === 2 ? 'bg-indigo-500' : index === 3 ? 'bg-purple-500' : 'bg-pink-500'}`}
                                        style={{ width: `${totalLogs ? (count / totalLogs) * 100 : 0}%` }}></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900 shrink-0 min-w-[20px] text-right">{count}</span>
                            </div>
                        )) : (
                            <div className="text-sm text-gray-500 text-center py-4">No entity actions found</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="bg-[#2B4B9E] h-[70px]">
                            <th className="px-6 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-xl">Timestamp</th>
                            <th className="px-6 text-left text-xs font-medium text-white uppercase tracking-wider">User</th>
                            <th className="px-6 text-left text-xs font-medium text-white uppercase tracking-wider">Action</th>
                            <th className="px-6 text-left text-xs font-medium text-white uppercase tracking-wider">Entity</th>
                            <th className="px-6 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                            <th className="px-6 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
                                    <p className="text-gray-500">Loading audit logs...</p>
                                </td>
                            </tr>
                        ) : currentLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No audit logs found</p>
                                </td>
                            </tr>
                        ) : (
                            currentLogs.map((log: AuditLog) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="text-xs text-gray-600">
                                            <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                                            <div className="text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                                {log.user?.fullName ? log.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '?'}
                                            </div>
                                            <span className="text-sm text-gray-900">{log.user?.fullName || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionBadge(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{log.entityName}</p>
                                            {log.entityId && (
                                                <p className="text-xs text-gray-500">ID: {log.entityId}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm text-gray-600 max-w-xs truncate">{log.description || '-'}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button
                                            onClick={() => handleViewDetails(log)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="View details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {logs.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Rows per page:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-cyan-600">
                            Showing {startIndex + 1} to {Math.min(endIndex, totalLogs)} of {totalLogs} entries
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

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Audit Log Details</h2>
                            <button
                                onClick={handleCloseDetails}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Timestamp</label>
                                    <p className="text-sm text-gray-900 mt-1">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">User</label>
                                    <p className="text-sm text-gray-900 mt-1">{selectedLog.user?.fullName || 'System'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Action</label>
                                    <p className="text-sm text-gray-900 mt-1">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Entity</label>
                                    <p className="text-sm text-gray-900 mt-1">{selectedLog.entityName}</p>
                                </div>
                                {selectedLog.entityId && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Entity ID</label>
                                        <p className="text-sm text-gray-900 mt-1">{selectedLog.entityId}</p>
                                    </div>
                                )}
                                {selectedLog.ipAddress && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">IP Address</label>
                                        <p className="text-sm text-gray-900 mt-1 font-mono">{selectedLog.ipAddress}</p>
                                    </div>
                                )}
                            </div>
                            {selectedLog.description && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Description</label>
                                    <p className="text-sm text-gray-900 mt-1">{selectedLog.description}</p>
                                </div>
                            )}
                            {(selectedLog.oldValues || selectedLog.newValues) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    {selectedLog.oldValues && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center mb-2">
                                                <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                                                Old Values
                                            </label>
                                            <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                                                {typeof selectedLog.oldValues === 'string'
                                                    ? (() => {
                                                        try { return JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2); }
                                                        catch { return selectedLog.oldValues; }
                                                      })()
                                                    : JSON.stringify(selectedLog.oldValues, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {selectedLog.newValues && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center mb-2">
                                                <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                                                New Values
                                            </label>
                                            <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                                                {typeof selectedLog.newValues === 'string'
                                                    ? (() => {
                                                        try { return JSON.stringify(JSON.parse(selectedLog.newValues), null, 2); }
                                                        catch { return selectedLog.newValues; }
                                                      })()
                                                    : JSON.stringify(selectedLog.newValues, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

