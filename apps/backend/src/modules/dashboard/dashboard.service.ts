import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStats = async (userId: string = '') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalBuses,
        activeBuses,
        totalTrips,
        activeTrips,
        totalDrivers,
        incidentsToday
    ] = await Promise.all([
        prisma.bus.count({ where: { deletedAt: null } }),
        prisma.bus.count({ where: { deletedAt: null, maintenanceStatus: 'operational' } }),
        prisma.trip.count({ where: { deletedAt: null } }),
        prisma.trip.count({ where: { deletedAt: null, status: 'in_progress' } }),
        prisma.user.count({
            where: {
                deletedAt: null,
                userRoles: { some: { role: { roleName: 'DRIVER' } } }
            }
        }),
        prisma.incident.count({
            where: {
                deletedAt: null,
                createdAt: { gte: today }
            }
        })
    ]);

    // Generate real weekly performance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);
    
    const recentTrips = await prisma.trip.findMany({
        where: { scheduledStart: { gte: sevenDaysAgo }, deletedAt: null },
        include: { version: { include: { route: true } } }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyDataMap = new Map();
    for(let i=0; i<7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        weeklyDataMap.set(d.toDateString(), { day: days[d.getDay()], trips: 0 });
    }
    
    const routeTripCount: Record<string, { route: string, trips: number, exactRouteId: string }> = {};

    recentTrips.forEach(trip => {
        const dateStr = trip.scheduledStart.toDateString();
        if(weeklyDataMap.has(dateStr)) {
            const data = weeklyDataMap.get(dateStr);
            data.trips += 1;
        }
        
        // Group top routes
        const rName = trip.version?.route?.routeName || 'Unknown';
        if(!routeTripCount[rName]) {
            routeTripCount[rName] = { route: rName, trips: 0, exactRouteId: trip.version?.route?.id || '' };
        }
        routeTripCount[rName].trips += 1;
    });

    const weeklyPerformance = Array.from(weeklyDataMap.values());
    const topRoutes = Object.values(routeTripCount).sort((a,b) => b.trips - a.trips).slice(0, 5);

    // Fleet Status
    const maintenanceBuses = await prisma.bus.count({ where: { deletedAt: null, maintenanceStatus: 'in_maintenance' } });
    const retiredBuses = await prisma.bus.count({ where: { deletedAt: null, maintenanceStatus: 'retired' } });
    const inactiveBuses = totalBuses - activeBuses - maintenanceBuses - retiredBuses;
    const fleetStatus = [
        { name: 'Active', value: activeBuses, color: '#10b981' },
        { name: 'Maintenance', value: maintenanceBuses, color: '#f59e0b' },
        { name: 'Inactive/Retired', value: inactiveBuses + retiredBuses, color: '#ef4444' },
    ];

    // Critical Alerts
    // Critical Alerts - Now fetched dynamically per-admin from UNREAD high/urgent notifications
    const unreadCriticalNotifications = await (userId ? prisma.notificationUser.findMany({
        where: { userId, isRead: false, notification: { priority: { in: ['high', 'urgent'] } } },
        include: { notification: true },
        orderBy: { notification: { createdAt: 'desc' } },
        take: 3
    }) : Promise.resolve([]));
    
    const criticalAlerts = unreadCriticalNotifications.map(nu => ({
        type: nu.notification.priority === 'urgent' ? 'critical' : 'warning',
        icon: 'AlertTriangle',
        message: nu.notification.title.split('\n')[0] || nu.notification.title, // Use title for the dashboard short box
        time: nu.notification.createdAt.toISOString(),
        color: nu.notification.priority === 'urgent' ? 'red' : 'orange'
    }));

    const activeDrivers = activeTrips;

    // Real Operations status for today
    const completedTrips = await prisma.trip.count({ where: { deletedAt: null, status: 'completed' }});
    const cancelledTrips = await prisma.trip.count({ where: { deletedAt: null, status: 'cancelled' }});
    const scheduledTrips = await prisma.trip.count({ where: { deletedAt: null, status: 'scheduled' }});

    return {
        totalBuses,
        activeBuses,
        totalTrips,
        activeTrips,
        totalDrivers,
        activeDrivers,
        incidentsToday,
        weeklyPerformance,
        fleetStatus,
        topRoutes,
        criticalAlerts,
        completedTrips,
        cancelledTrips,
        scheduledTrips
    };
};

export const getRecentActivity = async () => {
    const recentLogs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: true }
    });

    return recentLogs.map(log => {
        let type = 'info';
        if (log.action === 'CREATE') type = 'success';
        if (log.action === 'DELETE') type = 'error';
        if (log.action === 'UPDATE') type = 'warning';

        return {
            id: log.id,
            title: `${log.entityName} ${log.action}`,
            description: log.description || 'System action executed.',
            timestamp: log.createdAt.toISOString(),
            type,
        };
    });
};
