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
            case 'alert': return <AlertCircle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            case 'success': return <CheckCheck className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'alert': return 'bg-red-100 text-red-700 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'success': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
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

    const handleDelete = (_notifId: string) => {
        toast.error('Delete is not supported by the API');
    };

    return (
        <div className="space-y-4">
            {/* Strict Single-Line Non-Scrollable Header with Original Padding */}
            <div className="bg-[#2B4B9E] rounded-lg px-6 py-4 text-white">
                <div className="flex items-center justify-between gap-2 w-full">

                    {/* Left: Title & Inline Compact Stats (Full Words, No Abbreviations) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Notifications</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <Bell className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total:</span>
                                <span className="text-xs font-bold text-white">{totalNotifications}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-red-500/20 px-2 py-1 rounded shrink-0">
                                <Bell className="w-3.5 h-3.5 text-red-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Unread:</span>
                                <span className="text-xs font-bold text-white">{unreadCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search, Filters & Action Buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[150px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1 text-xs text-gray-800 bg-white rounded border border-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 placeholder-gray-400"
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="text-xs text-gray-800 px-2 py-1 rounded bg-white border border-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 shrink-0 cursor-pointer"
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
                            className="text-xs text-gray-800 px-2 py-1 rounded bg-white border border-transparent focus:outline-none focus:ring-1 focus:ring-cyan-400 shrink-0 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </select>

                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark All Read</span>
                        </button>


                    </div>

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
                            className={`bg-white rounded-lg shadow border-l-4 ${notif.isRead ? 'opacity-70' : ''} ${notif.type === 'alert'
                                ? 'border-l-red-500'
                                : notif.type === 'warning'
                                    ? 'border-l-yellow-500'
                                    : notif.type === 'success'
                                        ? 'border-l-green-500'
                                        : 'border-l-blue-500'
                                } hover:shadow-md transition-shadow`}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getTypeColor(notif.type)}`}>
                                            {getTypeIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h3 className="text-base font-semibold text-gray-900">{notif.title}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(notif.priority?.toLowerCase())}`}>
                                                    {(notif.priority || 'normal').toUpperCase()}
                                                </span>
                                                <span>•</span>
                                                <span>{new Date(notif.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        {!notif.isRead && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                title="Mark as read"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notif.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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