// User & Auth Types
export interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    isActive: boolean;
    department?: string;
    roles: Role[];
    createdAt: string;
    updatedAt: string;
}

export interface Driver extends User {
    licenseNumber: string;
    licenseExpiry: string;
    preferredLanguage?: string;
    homeTerminalId?: string;
    homeTerminal?: Terminal;
}

export interface Shift {
    id: string;
    driverId: string;
    shiftName: string;
    shiftStart: string;
    shiftEnd: string;
    shiftDate: string;
    isActive: boolean;
    driver?: {
        id: string;
        fullName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Permission {
    id: string;
    permissionName: string;
    resource: string;
    action: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Role {
    id: string;
    roleName: string;
    description?: string;
    permissions?: Permission[];
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    mustChangePassword?: boolean;
    user: User;
}

// Bus Types
export interface Bus {
    id: string;
    plateNumber: string;
    model: string;
    capacity: number;
    maintenanceStatus: 'operational' | 'in_maintenance' | 'retired';
    terminalId?: string;
    terminal?: Terminal;
    createdAt: string;
    updatedAt: string;
}

export interface Route {
    id: string;
    routeName: string;
    description?: string;
    startTerminalId: string;
    startTerminal?: Terminal;
    endTerminalId: string;
    endTerminal?: Terminal;
    versions?: RouteVersion[];
    stopCount?: number;
    status?: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface RouteVersion {
    id: string;
    routeId: string;
    routeNumber: number;  // Changed from versionNumber
    routeName: string;    // Changed from versionName
    direction: 'forward' | 'backward';  // NEW
    isPrimary: boolean;   // NEW
    isActive: boolean;
    effectiveFrom?: string;
    effectiveUntil?: string;
    stopCount?: number;
    route?: Route;
    routeStops?: RouteStop[];
    createdAt: string;
    updatedAt: string;
}

export interface RouteVariantsResponse {
    forward: RouteVersion[];
    backward: RouteVersion[];
}

export interface RouteStop {
    id: string;
    versionId: string;
    stopId: string;
    sequenceNumber: number;
    distanceFromPreviousKm?: number;
    stop?: Stop;
}

export interface Stop {
    id: string;
    stopName: string;
    stopCode: string;
    terminalId?: string;
    terminal?: Terminal;
    terminalName?: string;
    latitude: number;
    longitude: number;
    address?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RouteSchedule {
    id: string;
    routeId: string;
    versionId: string;
    scheduleName: string;
    dayOfWeek: string;
    departureTime: string;
    frequencyMinutes?: number;
    isActive: boolean;
    effectiveFrom?: string;
    effectiveUntil?: string;
    route?: Route;
    createdAt: string;
    updatedAt: string;
}

// Terminal Types
export interface Terminal {
    id: string;
    terminalName: string;
    latitude: number;
    longitude: number;
    address?: string;
    capacity?: number;
    facilities?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Trip {
    id: string;
    tripNumber: string;
    routeId: string;
    route?: Route;
    busId: string;
    bus?: Bus;
    driverId: string;
    driver?: User;
    versionId: string;
    version?: RouteVersion;
    scheduleId?: string;
    schedule?: RouteSchedule;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart?: string;
    actualEnd?: string;
    status: 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
    passengerCount?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Tracking Types
export interface Tracking {
    id: string;
    busId: string;
    driverId?: string;
    tripId?: string;
    terminalId?: string;
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
    altitude?: number;
    recordedAt: string;
    timestamp: string; // Used by frontend for latest update time
    bus?: Bus;
    driver?: User;
    trip?: Trip;
}

// Incident Types
export interface Incident {
    id: string;
    incidentType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    status: 'reported' | 'investigating' | 'resolved' | 'closed';
    busId?: string;
    bus?: Bus;
    tripId?: string;
    trip?: Trip;
    driver?: User;
    reportedById: string;
    reportedBy?: User;
    assignedToId?: string;
    assignedTo?: User;
    resolutionNotes?: string;
    resolvedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Notification Types
export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
    totalBuses: number;
    activeBuses: number;
    totalTrips: number;
    activeTrips: number;
    totalDrivers: number;
    activeDrivers: number;
    completedTrips?: number;
    cancelledTrips?: number;
    scheduledTrips?: number;
    incidentsToday: number;
    weeklyPerformance?: { day: string, trips: number, revenue?: number }[];
    fleetStatus?: { name: string, value: number, color: string }[];
    topRoutes?: { route: string, trips: number, onTime?: number, exactRouteId: string }[];
    criticalAlerts?: { type: string, icon: string, message: string, time: string, color: string }[];
}

// Pagination
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

// API Response
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    meta?: PaginationMeta;
}
