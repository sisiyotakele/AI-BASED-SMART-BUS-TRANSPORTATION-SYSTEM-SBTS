import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

export function Breadcrumbs() {
    const location = useLocation();

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const paths = location.pathname.split('/').filter(Boolean);

        if (paths.length === 0 || paths[0] !== 'dashboard') {
            return [];
        }

        const breadcrumbs: BreadcrumbItem[] = [
            { label: 'Dashboard', path: '/dashboard' },
        ];

        // Map routes to readable labels
        const routeLabels: Record<string, string> = {
            trips: 'Trip Management',
            tracking: 'Live Tracking',
            schedules: 'Schedules',
            buses: 'Bus Management',
            incidents: 'Incidents',
            'key-handovers': 'Key Handovers',
            'bus-route-assignments': 'Bus-Route Assignments',
            'bus-driver-assignments': 'Driver Assignments',
            drivers: 'Driver Management',
            shifts: 'Shifts',
            routes: 'Routes',
            stops: 'Stops',
            terminals: 'Terminals',
            pricing: 'Pricing',
            'ai-predictions': 'AI Predictions',
            reports: 'Reports & Analytics',
            users: 'User Management',
            notifications: 'Notifications',
            audit: 'Audit Logs',
            settings: 'Settings',
        };

        // Build breadcrumbs from paths
        for (let i = 1; i < paths.length; i++) {
            const segment = paths[i];
            const label = routeLabels[segment] || segment;
            const path = i === paths.length - 1 ? undefined : `/dashboard/${paths.slice(1, i + 1).join('/')}`;

            breadcrumbs.push({ label, path });
        }

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    if (breadcrumbs.length === 0) {
        return null;
    }

    return (
        <nav className="flex items-center space-x-2 text-sm">
            <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
                <Home className="w-4 h-4" />
            </Link>

            {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {crumb.path ? (
                        <Link
                            to={crumb.path}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className="text-gray-900 dark:text-white font-medium">
                            {crumb.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
