import { useState } from 'react';
import { Bell, Search, Plus, CheckCheck, Eye, Trash2, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, Notification } from '@/services/notification.service';
import toast from 'react-hot-toast';

export function Notifications() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const queryClient = useQueryClient();

    const { data: notificationsData = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationService.getNotifications()
    });

    const handovers = notificationsData.map((n: Notification) => ({
        id: n.id,
        type: n.notification.notificationType === 'EMERGENCY' ? 'alert' 
            : n.notification.notificationType === 'TRIP_UPDATE' ? 'info'
            : n.notification.notificationType === 'MAINTENANCE' ? 'warning'
            : 'info',
        priority: n.notification.priority,
        title: n.notification.title,
        message: n.notification.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
    }));

    // Filtering
    const filteredNotifications = handovers.filter((notif: any) => {
        const matchesSearch =
            notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || notif.type === filterType;
        const matchesRead =
            filterRead === 'all' ||
            (filterRead === 'read' && notif.isRead) ||
            (filterRead === 'unread' && !notif.isRead);
        return matchesSearch && matchesType && matchesRead;
    });

    // Pagination
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentNotifications = filteredNotifications.slice(startIndex, endIndex);

    // Stats
    const totalNotifications = handovers.length;
    const unreadCount = handovers.filter((n: any) => !n.isRead).length;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertCircle className="w-5 h-5 text-rose-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'success': return <CheckCheck className="w-5 h-5 text-emerald-500" />;
            default: return <Info className="w-5 h-5 text-cyan-500" />;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 border border-rose-200 dark:border-rose-900/30';
            case 'medium': return 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 border border-amber-200 dark:border-amber-900/30';
            default: return 'bg-slate-50 dark:bg-navy-800 text-slate-500 border border-slate-200 dark:border-navy-700';
        }
    };

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: () => toast.error('Failed to mark as read')
    });

    const handleMarkAsRead = (notifId: string) => {
        markAsReadMutation.mutate(notifId);
    };

    const handleMarkAllAsRead = () => {
        const unreadIds = handovers
            .filter((n: any) => !n.isRead)
            .map((n: any) => n.id);
        if (unreadIds.length === 0) return;
        // Fire a mark-as-read for each unread notification
        Promise.all(unreadIds.map((id: string) => notificationService.markAsRead(id)))
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                toast.success('All notifications marked as read');
            })
            .catch(() => toast.error('Failed to mark all as read'));
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Notification deleted');
        },
        onError: () => toast.error('Failed to delete notification')
    });

    const handleDelete = (notifId: string) => {
        deleteMutation.mutate(notifId);
    };

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Notifications</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">View system alerts, messages, and updates</p>
                </div>

                {/* Control Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-navy-800 p-1.5 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm">
                    
                    {/* Stats Pills */}
                    <div className="flex items-center gap-2 px-2 border-r border-slate-200 dark:border-navy-700">
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-navy-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-navy-700">
                            <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total:</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{totalNotifications}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-navy-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-navy-700">
                            <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unread:</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{unreadCount}</span>
                        </div>
                    </div>

                    {/* Actions: Search, Filter, Mark As Read */}
                    <div className="relative min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-navy-900 rounded-lg border-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400 transition-all font-medium"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-navy-900 rounded-lg border-none focus:ring-2 focus:ring-cyan-500 cursor-pointer font-medium"
                    >
                        <option value="all">All Types</option>
                        <option value="alert">Alert</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                        <option value="info">Info</option>
                    </select>

                    <select
                        value={filterRead}
                        onChange={(e) => setFilterRead(e.target.value as any)}
                        className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-navy-900 rounded-lg border-none focus:ring-2 focus:ring-cyan-500 cursor-pointer font-medium"
                    >
                        <option value="all">All Status</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                    </select>

                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center space-x-1.5 px-4 py-2 text-sm bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium mr-1"
                    >
                        <CheckCheck className="w-4 h-4" />
                        <span>Mark All Read</span>
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Loading notifications...</p>
                    </div>
                ) : currentNotifications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No notifications found</p>
                    </div>
                ) : (
                    currentNotifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`bg-white dark:bg-[#1a2332] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden ${!notif.isRead ? 'bg-cyan-50/10 dark:bg-cyan-900/10' : ''}`}
                        >
                            {!notif.isRead && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
                            )}
                            <div className="p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shrink-0">
                                            {getTypeIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 mt-0.5">
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex-1">
                                                    <h3 className={`text-sm font-bold uppercase tracking-wide md:tracking-wider ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    {notif.message.includes('\n') ? (
                                                        <div className="mt-2.5 flex flex-col gap-1.5 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                                            {notif.message.split('\n').map((line, i) => {
                                                                const parts = line.split(': ');
                                                                if (parts.length < 2) return <p key={i} className="text-sm font-medium text-gray-800 dark:text-gray-200">{line}</p>;
                                                                const key = parts[0];
                                                                const value = parts.slice(1).join(': ');
                                                                return (
                                                                    <div key={i} className="flex items-start text-sm">
                                                                        <span className="font-bold text-gray-500 dark:text-gray-400 w-28 shrink-0 uppercase text-[10px] tracking-wider mt-0.5">{key}:</span>
                                                                        <span className="text-gray-800 dark:text-gray-200 font-semibold">{value}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className={`text-sm mt-1 leading-relaxed ${!notif.isRead ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                                            {notif.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-3">
                                                <span className={`px-2 py-0.5 rounded-md ${getPriorityBadge(notif.priority?.toLowerCase())}`}>
                                                    {(notif.priority || 'normal')}
                                                </span>
                                                <span>•</span>
                                                <span>{new Date(notif.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 shrink-0">
                                        {!notif.isRead && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-lg hover:bg-emerald-100 hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-1.5"
                                                title="Mark as read"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Mark Read</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notif.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {filteredNotifications.length > 0 && (
                <div className="bg-white rounded-lg shadow px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Items per page:</span>
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
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length} entries
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
    );
}