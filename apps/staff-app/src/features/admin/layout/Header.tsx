import { Bell, LogOut, ChevronRight, Menu, X, User, Settings, HelpCircle, Sun, Moon, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useTheme } from '@/contexts/ThemeContext';
import adminLogo from '../../../assets/admin-logo.jpg';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { socketService } from '@/services/socket.service';

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

// Sample notifications
const sampleNotifications: Notification[] = [
    {
        id: '1',
        type: 'warning',
        title: 'Bus Maintenance Due',
        message: 'Bus #123 requires scheduled maintenance within 24 hours',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        read: false,
    },
    {
        id: '2',
        type: 'info',
        title: 'New Trip Assignment',
        message: 'Trip #456 has been assigned to Route 101',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        read: false,
    },
    {
        id: '3',
        type: 'success',
        title: 'Route Optimization Complete',
        message: 'AI optimization completed for Route 5 - 12% efficiency improvement',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
    },
    {
        id: '4',
        type: 'error',
        title: 'Incident Reported',
        message: 'Minor accident reported on Route 3 near Terminal A',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        read: true,
    },
];

// Route configuration for breadcrumbs
const routeConfig: Record<string, { section: string; title: string; color: string }> = {
    '/dashboard': { section: '', title: 'Dashboard', color: '#00B4D8' },
    '/dashboard/trips': { section: 'Operations', title: 'Trip Management', color: '#00B4D8' },
    '/dashboard/tracking': { section: 'Operations', title: 'Live GPS Tracking', color: '#00B4D8' },
    '/dashboard/schedules': { section: 'Operations', title: 'Schedules', color: '#00B4D8' },
    '/dashboard/buses': { section: 'Fleet', title: 'Bus Management', color: '#FF9800' },
    '/dashboard/incidents': { section: 'Fleet', title: 'Incidents', color: '#FF9800' },
    '/dashboard/key-handovers': { section: 'Fleet', title: 'Key Handovers', color: '#FF9800' },
    '/dashboard/bus-route-assignments': { section: 'Assignments', title: 'Bus-Route Assignment', color: '#00BCD4' },
    '/dashboard/bus-driver-assignments': { section: 'Assignments', title: 'Driver Assignment', color: '#00BCD4' },
    '/dashboard/drivers': { section: 'Personnel', title: 'Driver Management', color: '#4CAF50' },
    '/dashboard/shifts': { section: 'Personnel', title: 'Shifts', color: '#4CAF50' },
    '/dashboard/routes': { section: 'Infrastructure', title: 'Routes', color: '#E91E63' },
    '/dashboard/stops': { section: 'Infrastructure', title: 'Stops', color: '#E91E63' },
    '/dashboard/terminals': { section: 'Infrastructure', title: 'Terminals', color: '#E91E63' },
    '/dashboard/pricing': { section: 'Financial', title: 'Pricing', color: '#10B981' },
    '/dashboard/ai-predictions': { section: 'AI & Analytics', title: 'AI Predictions', color: '#8B5CF6' },
    '/dashboard/users': { section: 'Administration', title: 'User Management', color: '#64748B' },
    '/dashboard/notifications': { section: 'Administration', title: 'Notifications', color: '#64748B' },
    '/dashboard/audit': { section: 'Administration', title: 'Audit Logs', color: '#64748B' },
    '/dashboard/settings': { section: 'Administration', title: 'Settings', color: '#64748B' },
};

interface HeaderProps {
    onToggleSidebar: () => void;
    sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();

    const { data: notificationsData = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationService.getNotifications(),
        refetchInterval: 30000 // refresh every 30s
    });

    const unreadCount = notificationsData.filter((n: any) => !n.isRead).length;
    const hasUnreadIncident = notificationsData.some((n: any) => !n.isRead && (n.notification?.notificationType === 'EMERGENCY' || n.notification?.notificationType === 'MAINTENANCE'));

    useEffect(() => {
        const handleNewNotification = (notification: any) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast(`New Notification: ${notification.title}`, { icon: '🔔' });
        };
        socketService.on('notification:new', handleNewNotification);
        return () => {
            socketService.off('notification:new', handleNewNotification);
        };
    }, [queryClient]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        if (isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const handleLogout = async () => {
        try {
            await authService.logout();
            clearAuth();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            clearAuth();
            navigate('/login');
        }
    };

    const currentRoute = routeConfig[location.pathname] || { section: '', title: 'Dashboard', color: '#00B4D8' };

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="h-16 flex items-center justify-between px-6">
                {/* Left Side - Navigation Breadcrumbs */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center"
                        title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        ) : (
                            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        )}
                    </button>

                    <div className="flex items-center space-x-2">
                        {currentRoute.section && (
                            <>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{currentRoute.section}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            </>
                        )}
                        <span
                            className="text-base font-semibold dark:brightness-125"
                            style={{ color: currentRoute.color }}
                        >
                            {currentRoute.title}
                        </span>
                    </div>
                </div>

                {/* Right Side - Controls, User Profile, and Sign Out */}
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-gray-600 dark:text-gray-300">{formatDate(currentTime)}</span>
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">{formatTime(currentTime)}</span>
                    </div>

                    {/* Notification Badge */}
                    <button
                        onClick={() => navigate('/dashboard/notifications')}
                        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                        title="View Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex w-5 h-5">
                                {hasUnreadIncident && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                )}
                                <span className="relative inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </span>
                        )}
                    </button>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5" />
                        ) : (
                            <Sun className="w-5 h-5" />
                        )}
                    </button>

                    {/* Profile Section with Dropdown */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                        >
                            <div className="text-right">
                                <p className="text-sm font-bold text-[#102B4E] dark:text-cyan-400">
                                    {user?.fullName || 'Samson Kassahun'}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                                    {user?.roles?.[0]?.roleName || 'Admin'}
                                </p>
                            </div>

                            {/* Avatar */}
                            <img
                                src={adminLogo}
                                alt="Admin Avatar"
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                {/* User Info Header */}
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {user?.fullName || 'Samson Kassahun'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'admin@shegerbus.et'}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-1">
                                        Role: {user?.roles?.[0]?.roleName || 'Staff'}
                                    </p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            navigate('/dashboard/settings');
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        <span>My Profile</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            navigate('/dashboard/settings');
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        <span>Settings</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            navigate('/dashboard/help');
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        <span>Help & Support</span>
                                    </button>
                                </div>

                                {/* Sign Out */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                                    <button
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="font-semibold">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}