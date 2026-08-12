import { useState } from 'react';
import { BookOpen, Terminal as TerminalIcon, Shield, Server, MapPin, Search, ChevronRight, Activity, Database, ListChecks, Play, Car, Map, User, Cog, CheckCircle2 } from 'lucide-react';

const sections = [
    {
        id: 'overview',
        title: 'Platform Overview',
        icon: <BookOpen className="w-4 h-4" />,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Platform Overview</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    The Smart Bus Transportation System (SBTS) is an enterprise-grade transit operations platform. It unifies vehicle telemetry, intelligent routing, scalable cloud architecture, and personnel management into a centralized control hub.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                        <Server className="w-5 h-5 mr-2" /> Node.js & PostgreSQL Backend
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                        The backend operates on an asynchronous Node.js layer communicating with a relational PostgreSQL database via Prisma ORM. This ensures strict ACID compliance for trip scheduling, transaction logs, and route geography storage.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'manual',
        title: 'Step-by-Step User Manual',
        icon: <ListChecks className="w-4 h-4" />,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Admin Step-by-Step Operations Manual</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    If you are setting up the system from scratch, or need to dispatch a brand new trip, follow this exact sequence of operations. The system's relational database requires parent entities to exist before you can schedule trips.
                </p>
                
                <div className="space-y-4 mt-6">
                    {/* Step 1 */}
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-cyan-600 w-12 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-lg">1</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-cyan-600" /> Create Physical Infrastructure
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <strong>Where:</strong> Terminals & Stops modules.<br/>
                                <strong>Action:</strong> First, create a <strong>Terminal</strong> (e.g., "Megenagna Hub"). Then, map out your <strong>Bus Stops</strong> on the map. You cannot create routes until stops exist.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-cyan-600 w-12 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-lg">2</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                                <Car className="w-4 h-4 mr-2 text-cyan-600" /> Register the Fleet (Buses)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <strong>Where:</strong> Buses module.<br/>
                                <strong>Action:</strong> Register your buses with their license plates and capacity. You will need to assign each bus to a "Home Terminal" you created in Step 1.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-cyan-600 w-12 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-lg">3</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                                <User className="w-4 h-4 mr-2 text-cyan-600" /> Register Personnel (Drivers)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <strong>Where:</strong> Drivers & Users module.<br/>
                                <strong>Action:</strong> Create driver accounts. Ensure they have active licenses. Drivers need these accounts to log into the Driver App.
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-cyan-600 w-12 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-lg">4</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                                <Map className="w-4 h-4 mr-2 text-cyan-600" /> Connect Stops into Routes
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <strong>Where:</strong> Routes module.<br/>
                                <strong>Action:</strong> Create a Route (e.g., "Route 72: Bole to Piassa"). Define the sequence of stops by selecting the stops you created in Step 1.
                            </p>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-cyan-600 w-12 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-lg">5</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                                <Cog className="w-4 h-4 mr-2 text-cyan-600" /> Make Operational Assignments
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <strong>Where:</strong> Bus-Driver Assignments & Bus-Route Assignments.<br/>
                                <strong>Action:</strong> The system requires you to authorize which Drivers are allowed to drive which Buses, and which Buses are allowed to operate on which Routes.
                            </p>
                        </div>
                    </div>

                    {/* Step 6 */}
                    <div className="flex border-2 border-emerald-500 dark:border-emerald-600 rounded-xl overflow-hidden shadow-lg relative">
                        <div className="absolute top-0 right-0 p-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="bg-emerald-500 w-12 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-lg">6</span>
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 flex-1">
                            <h3 className="font-bold text-emerald-900 dark:text-emerald-400 flex items-center">
                                <Play className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> Schedule & Dispatch Trips!
                            </h3>
                            <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-2">
                                <strong>Where:</strong> Shedules & Trips module.<br/>
                                <strong>Action:</strong> Now that the infrastructure is linked, you can generate a Trip. Select a Route, assign an Authorized Bus and Driver, and set a departure time. When the driver logs in, they will see this trip and press "Start Trip" to begin GPS tracking!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'fleet',
        title: 'Fleet & Hardware',
        icon: <TerminalIcon className="w-4 h-4" />,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Fleet Management Engine</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Buses are tracked not just as static assets, but as dynamic entity nodes featuring real-time lifecycle states: Operational, In Maintenance, and Retired.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-sm">
                        <Activity className="w-6 h-6 text-emerald-500 mb-3" />
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Automated Maintenance Tracking</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Whenever a critical incident is logged, buses automatically transition out of active routing status to prevent schedule corruption.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-sm">
                        <Database className="w-6 h-6 text-indigo-500 mb-3" />
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Terminal Assignment</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            The relational architecture ties each Bus Node to a parent Terminal Node, allowing accurate regional payload distribution and capacity analytics.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'telemetry',
        title: 'Live Telemetry & GPS',
        icon: <MapPin className="w-4 h-4" />,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Real-Time Telemetry Pipeline</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    The platform relies on a high-throughput geospatial pipeline to synchronize thousands of coordinate updates per minute across the active fleet.
                </p>
                <div className="pl-4 border-l-4 border-cyan-500">
                    <h4 className="font-bold text-gray-900 dark:text-white">Geospatial Processing</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                        The Map interface translates raw lat/lng arrays into smooth interpolation lines using Mapbox GL. Route versions allow strict segment locking—if a bus deviates from its Versioned Route path by more than 50 meters, an automated incident anomaly is logged.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'security',
        title: 'Security & Access',
        icon: <Shield className="w-4 h-4" />,
        content: (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Zero-Trust & Audit System</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Every system mutation—whether an admin overriding a trip schedule or a manager terminating an employee account—is permanently cryptographically hashed into the Audit Logs.
                </p>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mt-4">
                    <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2 text-cyan-500" /> <strong>Role-Based Access Control (RBAC):</strong> Granular permissions enforced via JWT Middleware.</li>
                    <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2 text-cyan-500" /> <strong>Mutation Tracking:</strong> Tracks IP, Timestamp, User Identity, and Payload Diffs.</li>
                    <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2 text-cyan-500" /> <strong>Rate Limiting:</strong> Hardened API gateways to prevent DDoS on tracking endpoints.</li>
                </ul>
            </div>
        )
    }
];

export function Documentation() {
    const [activeSection, setActiveSection] = useState(sections[1].id);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSections = sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-navy-900 rounded-3xl shadow-lg border border-slate-200 dark:border-navy-700 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-72 bg-slate-50 dark:bg-navy-800/50 border-r border-slate-200 dark:border-navy-700 flex flex-col">
                <div className="p-5 border-b border-slate-200 dark:border-navy-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Documentation</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-700 dark:text-slate-200 transition-colors"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {filteredSections.length > 0 ? filteredSections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeSection === section.id
                                    ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-navy-700'
                                }`}
                        >
                            <span className={`mr-3 ${activeSection === section.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'} transition-colors`}>
                                {section.icon}
                            </span>
                            {section.title}
                        </button>
                    )) : (
                        <p className="text-xs text-center text-slate-400 py-4">No sections found.</p>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-navy-700 bg-slate-100/50 dark:bg-navy-900/50">
                    <p className="text-[10px] text-center text-slate-500 font-mono uppercase tracking-widest">SBTS Core v4.2.0 Rev: C</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-navy-900">
                <div className="max-w-4xl mx-auto p-10 pb-20">
                    {activeSection ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {sections.find(s => s.id === activeSection)?.content}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a topic to read</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
