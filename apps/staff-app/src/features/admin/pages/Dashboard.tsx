import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import {
    Clock, Bus, Users, Navigation, TrendingUp, AlertTriangle,
    MapPin, Activity, CheckCircle, XCircle, Bell, Map, ArrowRight, Loader2
} from 'lucide-react';
import { 
    AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BusMap } from '@/features/admin/components/BusMap';
import { useLiveTracking } from '@/hooks/useLiveTracking';

const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-3.5 rounded-xl shadow-xl text-white text-xs space-y-2">
                <p className="font-semibold text-slate-300 border-b border-slate-700/60 pb-1">{label} Performance</p>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-cyan-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Trips
                    </span>
                    <span className="font-bold text-white">{payload[0].value}</span>
                </div>
            </div>
        );
    }
    return null;
};

export function Dashboard() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: dashboardService.getStats
    });

    const { data: recentBackendActivity, isLoading: activityLoading } = useQuery({
        queryKey: ['dashboardActivity'],
        queryFn: dashboardService.getRecentActivity
    });

    const { locations } = useLiveTracking();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getActivityDot = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'info': return 'bg-blue-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-[#2B4B9E] to-blue-800 dark:from-navy-900 dark:to-cyan-900/50 rounded-2xl px-6 py-5 shadow-xl relative overflow-hidden border border-blue-700/50 dark:border-cyan-800/30">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 dark:bg-cyan-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-white font-bold text-xl">Dashboard Overview</h2>
                    <p className="text-sm text-cyan-100/80 mt-1">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {currentTime.toLocaleTimeString()}
                    </p>
                </div>
            </div>

            {/* Critical Alerts */}
            {(stats?.criticalAlerts && stats.criticalAlerts.length > 0) && (
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 transition-shadow hover:shadow-md p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 animate-pulse">
                                <Bell className="w-4 h-4 text-red-500 dark:text-red-400" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center">
                                Critical Alerts
                                <span className="text-xs bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2.5 py-0.5 rounded-full ml-3 border border-red-200 dark:border-red-500/20">
                                    {stats.criticalAlerts.length} Action{stats.criticalAlerts.length > 1 ? 's' : ''} Needed
                                </span>
                            </h3>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard/notifications')}
                            className="text-sm px-4 py-1.5 rounded-full text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-navy-600 focus:outline-none"
                        >
                            View All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(stats?.criticalAlerts || []).map((alert: any, index: number) => {
                            const IconComponent = alert.icon === 'AlertTriangle' ? AlertTriangle : Clock;
                            const isCritical = alert.type === 'critical';
                            
                            const severityBorder = isCritical
                                ? 'border-red-200 dark:border-red-500/30'
                                : 'border-orange-200 dark:border-orange-500/30';
                            
                            const isRed = alert.color === 'red';
                            
                            return (
                                <div key={index} className={`flex flex-col justify-between bg-slate-50/50 dark:bg-navy-800/50 p-4 rounded-xl border ${severityBorder} transition-all duration-300 hover:shadow-sm cursor-pointer group`}>
                                    <div className="flex items-start space-x-3">
                                        <div className={`mt-0.5 p-2 rounded-lg transition-colors ${
                                            isRed 
                                                ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-500/20' 
                                                : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-200 dark:group-hover:bg-orange-500/20'
                                        }`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{alert.message}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center">
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${isRed ? 'bg-red-500' : 'bg-orange-400'}`}></span>
                                                    {alert.time}
                                                </p>
                                                <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Key Metrics Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Active Buses */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-6 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Buses</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : stats?.activeBuses}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 ring-8 ring-blue-50/50 dark:ring-blue-900/10 flex items-center justify-center">
                            <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium mr-1.5">{statsLoading ? '-' : stats?.totalBuses}</span>
                        <span className="text-slate-500 dark:text-slate-400">total buses</span>
                    </div>
                </div>
                
                {/* Active Trips */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-6 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Trips</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : stats?.activeTrips}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 ring-8 ring-blue-50/50 dark:ring-blue-900/10 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium mr-1.5">{statsLoading ? '-' : stats?.totalTrips}</span>
                        <span className="text-slate-500 dark:text-slate-400">total trips</span>
                    </div>
                </div>

                {/* Active Drivers */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-6 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Drivers</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : stats?.activeDrivers}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 ring-8 ring-blue-50/50 dark:ring-blue-900/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium mr-1.5">{statsLoading ? '-' : stats?.totalDrivers}</span>
                        <span className="text-slate-500 dark:text-slate-400">total drivers</span>
                    </div>
                </div>

                {/* Incidents Today */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-6 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Incidents Today</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : stats?.incidentsToday}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 ring-8 ring-blue-50/50 dark:ring-blue-900/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => navigate('/dashboard/audit-logs')}>
                            Check System Logs
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Grid - Fleet, Operations, Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fleet Status */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 transition-shadow hover:shadow-md">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Fleet Status</h3>
                        <Bus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-center mb-4">
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={stats?.fleetStatus || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {(stats?.fleetStatus || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm text-gray-700 dark:text-slate-300">Active</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {stats?.fleetStatus?.find(f => f.name === 'Operational' || f.name === 'Active')?.value || 0} 
                                    <span className="text-slate-500 ml-1 text-xs">
                                        ({Math.round(((stats?.fleetStatus?.find(f => f.name === 'Operational' || f.name === 'Active')?.value || 0) / (stats?.totalBuses || 1)) * 100)}%)
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <span className="text-sm text-gray-700 dark:text-slate-300">Maintenance</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {stats?.fleetStatus?.find(f => f.name === 'Maintenance' || f.name === 'in_maintenance')?.value || 0} 
                                    <span className="text-slate-500 ml-1 text-xs">
                                        ({Math.round(((stats?.fleetStatus?.find(f => f.name === 'Maintenance' || f.name === 'in_maintenance')?.value || 0) / (stats?.totalBuses || 1)) * 100)}%)
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm text-gray-700 dark:text-slate-300">Inactive/Retired</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {stats?.fleetStatus?.find(f => f.name === 'Retired' || f.name === 'retired')?.value || 0} 
                                    <span className="text-slate-500 ml-1 text-xs">
                                        ({Math.round(((stats?.fleetStatus?.find(f => f.name === 'Retired' || f.name === 'retired')?.value || 0) / (stats?.totalBuses || 1)) * 100)}%)
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-navy-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Fleet</span>
                                <span className="font-bold text-gray-900">{stats?.totalBuses || 0} buses</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Operations */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 transition-shadow hover:shadow-md">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Today's Operations</h3>
                        <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Completed</p>
                                    <p className="text-xl font-bold text-gray-900">{stats?.completedTrips || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Navigation className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Active</p>
                                    <p className="text-xl font-bold text-gray-900">{stats?.activeTrips || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Pending / Scheduled</p>
                                    <p className="text-xl font-bold text-gray-900">{stats?.scheduledTrips || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-500/10 rounded-lg flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Cancelled</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.cancelledTrips || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Driver & Crew Status */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 transition-shadow hover:shadow-md flex flex-col h-[420px]">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between shrink-0">
                        <h3 className="font-bold text-gray-900 dark:text-white">Crew Status</h3>
                        <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="p-6 flex flex-col flex-1 justify-between">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-navy-700">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium tracking-wide">Total Drivers</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalDrivers || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-navy-700">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-500/10 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium tracking-wide">On Duty Now</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.activeDrivers || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-navy-700">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium tracking-wide">Incidents Today</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.incidentsToday || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium tracking-wide">Avg Occupancy</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">76%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Bus Map */}
                <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden transition-shadow hover:shadow-md">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Live Bus Locations</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time tracking of active buses</p>
                        </div>
                        <Map className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="h-[400px]">
                        <BusMap locations={locations} />
                    </div>
                </div>

                {/* Top Routes */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 transition-shadow hover:shadow-md">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Top Routes</h3>
                        <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {(stats?.topRoutes || []).map((route: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-800/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-lg bg-[#2D7A8E] flex items-center justify-center text-white font-bold text-sm`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{route.route}</p>
                                            <p className="text-xs text-gray-600">{route.trips} trips</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-green-600">{route.onTime}%</p>
                                        <p className="text-xs text-gray-600">on-time</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Performance Chart */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 transition-all hover:shadow-md overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Weekly Performance</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Trips completed vs revenue generated</p>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50"></span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">Daily Tracked Trips</span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={stats?.weeklyPerformance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                                dy={10}
                            />
                            <YAxis 
                                yAxisId="left" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                tickFormatter={(val) => `$${val / 1000}k`}
                            />
                            <Tooltip content={<CustomChartTooltip />} />
                            <Area 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="trips" 
                                stroke="#06b6d4" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorTrips)" 
                                name="Trips" 
                                activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 transition-shadow hover:shadow-md">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-navy-700">
                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-navy-700">
                    {activityLoading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-500" />
                            Loading activity...
                        </div>
                    ) : (recentBackendActivity && recentBackendActivity.length > 0) ? (
                        recentBackendActivity.map((activity: any, index: number) => (
                            <div key={index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors">
                                <div className="flex items-start space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${getActivityDot(activity.type)} mt-2`}></div>
                                    <div className="flex-1 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{activity.title || 'System Alert'}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{activity.message || activity.description}</p>
                                        </div>
                                        <div className="flex items-center space-x-1 shrink-0 ml-4">
                                            <Clock className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : activity.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Activity className="w-8 h-8 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm">No recent activity found in the system logs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}