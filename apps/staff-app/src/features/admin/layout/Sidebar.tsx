import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard,
    Bus,
    Route,
    MapPin,
    Users,
    AlertTriangle,
    Calendar,
    Clock,
    Key,
    UserCircle,
    Map,
    Shield,
    Settings,
    History,
    Building2,
    Bell,
    DollarSign,
    Brain,
    BarChart,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logoImage from '../../../assets/logo.png';

interface NavItem {
    name: string;
    href: string;
    icon: any;
}



interface NavSection {
    title: string;
    items: NavItem[];
}

const navigationSections: NavSection[] = [
    {
        title: '',
        items: [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },
    // PHASE 1: System Setup (Infrastructure)
    {
        title: 'INFRASTRUCTURE SETUP',
        items: [
            {
                name: 'Terminals',
                href: '/dashboard/terminals',
                icon: Building2,
            },
            {
                name: 'Routes',
                href: '/dashboard/routes',
                icon: Route,
            },
            {
                name: 'Stops',
                href: '/dashboard/stops',
                icon: MapPin,
            },
            {
                name: 'Pricing',
                href: '/dashboard/pricing',
                icon: DollarSign,
            },
        ],
    },
    // PHASE 2: Resource Registration
    {
        title: 'RESOURCE REGISTRATION',
        items: [
            {
                name: 'Bus Management',
                href: '/dashboard/buses',
                icon: Bus,
            },
            {
                name: 'Roles & Permissions',
                href: '/dashboard/roles',
                icon: Shield,
            },
            {
                name: 'User Management',
                href: '/dashboard/users',
                icon: Users,
            },
            {
                name: 'Driver Management',
                href: '/dashboard/drivers',
                icon: UserCircle,
            },
        ],
    },
    // PHASE 3: Daily Dispatch & Planning
    {
        title: 'DAILY DISPATCH FLOW',
        items: [
            {
                name: 'Route Schedule',
                href: '/dashboard/schedules',
                icon: Calendar,
            },
            {
                name: 'Bus-Route Assignment',
                href: '/dashboard/bus-route-assignments',
                icon: Map,
            },
            {
                name: 'Driver Shift Assignment',
                href: '/dashboard/bus-driver-assignments',
                icon: UserCircle,
            },
            {
                name: 'Trip Management',
                href: '/dashboard/trips',
                icon: Route,
            },
        ],
    },
    // PHASE 4: Live Operations
    {
        title: 'LIVE OPERATIONS',
        items: [
            {
                name: 'Key Handovers',
                href: '/dashboard/key-handovers',
                icon: Key,
            },
            {
                name: 'Live GPS Tracking',
                href: '/dashboard/tracking',
                icon: MapPin,
            },
            {
                name: 'Incidents',
                href: '/dashboard/incidents',
                icon: AlertTriangle,
            },
            {
                name: 'Notifications',
                href: '/dashboard/notifications',
                icon: Bell,
            },
        ],
    },
    // PHASE 5: Monitoring & Management
    {
        title: 'MONITORING & ANALYTICS',
        items: [
            {
                name: 'AI Predictions',
                href: '/dashboard/ai-predictions',
                icon: Brain,
            },
            {
                name: 'Analytics & Reports',
                href: '/dashboard/reports',
                icon: BarChart,
            },
            {
                name: 'Audit Logs',
                href: '/dashboard/audit',
                icon: History,
            },
            {
                name: 'Settings',
                href: '/dashboard/settings',
                icon: Settings,
            },
        ],
    },
];

export function Sidebar() {
    const user = useAuthStore((state) => state.user);
    const isSuperAdmin = user?.roles?.some((role: any) =>
        typeof role === 'string' ? role === 'SUPER_ADMIN' : role?.roleName === 'SUPER_ADMIN'
    ) ?? false;

    return (
        <aside className="w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
            {/* Logo */}
            <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 flex items-center">
                <img src={logoImage} alt="SBTS Logo" className="h-12 w-auto block object-contain" />
                <span className="ml-3 text-lg font-bold text-[#12B2E4]">
                    SHEGER BUS
                </span>
            </div>

            {/* Navigation (Hidden Scrollbar) */}
            <nav className="flex-1 overflow-y-auto py-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {navigationSections.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        {section.title && (
                            <div className="px-2 mb-3">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                    {section.title}
                                </span>
                            </div>
                        )}
                        <div className="space-y-1">
                                {section.items.filter(item => {
                                    if (item.name === 'Roles & Permissions') {
                                        return isSuperAdmin;
                                    }
                                    return true;
                                }).map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.href}
                                        end={item.href === '/dashboard'}
                                        className="flex items-center group relative"
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {/* Cyan accent bar with glow */}
                                                {isActive && (
                                                    <div className="absolute left-0 w-1 h-full bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                                                )}

                                                {/* Main button */}
                                                <div className={cn(
                                                    'flex items-center space-x-3 px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-300 flex-1 ml-1 border',
                                                    isActive
                                                        ? 'bg-[#2B4B9E] text-white border-transparent shadow-lg shadow-[#2B4B9E]/20 dark:shadow-cyan-900/20'
                                                        : 'bg-transparent border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-800/40 hover:text-[#2B4B9E] dark:hover:text-white hover:border-gray-200 dark:hover:border-navy-700/50 group-hover:translate-x-1'
                                                )}>
                                                    <item.icon className={cn(
                                                        "w-5 h-5 flex-shrink-0 transition-transform duration-300",
                                                        isActive ? "opacity-100 scale-110" : "opacity-60 group-hover:scale-110 group-hover:opacity-100"
                                                    )} />
                                                    <span className="truncate tracking-wide text-[15px]">{item.name}</span>
                                                </div>
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}