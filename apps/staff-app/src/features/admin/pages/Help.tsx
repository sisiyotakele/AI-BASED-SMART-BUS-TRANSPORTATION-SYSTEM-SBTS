import { HelpCircle, FileText, LifeBuoy, Mail, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Help() {
    const sops = [
        {
            title: "Adding a New Driver / Employee",
            description: "Step-by-step procedure to onboard a new driver, generate their system access, and assign their ID.",
            category: "Personnel"
        },
        {
            title: "Handling a Bus Breakdown (Incident Report)",
            description: "How to process an emergency bus breakdown ticket, reroute active passengers, and dispatch maintenance.",
            category: "Operations"
        },
        {
            title: "Modifying Active Trip Schedules",
            description: "Procedures for safely adjusting schedules of trips currently in progress without causing GPS tracking errors.",
            category: "Schedules"
        },
        {
            title: "Assigning Buses to New Routes",
            description: "Standard operating procedure for linking designated bus models to appropriate terminal route geometries.",
            category: "Infrastructure"
        }
    ];

    return (
        <div className="max-w-5xl mx-auto py-6">
            <div className="flex flex-col mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <HelpCircle className="w-6 h-6 mr-3 text-cyan-600 dark:text-cyan-400" />
                    Help & Support Portal
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Access standard operating procedures (SOPs) or contact the technical support team.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-br from-[#2B4B9E] to-cyan-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                    <LifeBuoy className="w-8 h-8 mb-4 text-cyan-100" />
                    <h3 className="text-lg font-bold mb-1">Technical Support</h3>
                    <p className="text-sm text-cyan-100 mb-4 opacity-90">Having system issues? Reach out to our 24/7 IT desk.</p>
                    <a href="mailto:support@shegerbus.et" className="inline-flex items-center text-sm font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors px-4 py-2 rounded-lg">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact IT Support
                    </a>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <FileText className="w-8 h-8 mb-4 text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Documentation</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Read the full technical manual for the smart system.</p>
                    </div>
                    <Link 
                        to="/dashboard/help/documentation" 
                        className="mt-4 flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors w-max"
                    >
                        Read Deep Documentation <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Standard Operating Procedures (SOPs)</h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sops.map((sop, idx) => (
                        <div key={idx} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group flex items-start justify-between">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center mb-1">
                                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-3">
                                        {sop.category}
                                    </span>
                                    <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                        {sop.title}
                                    </h4>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{sop.description}</p>
                            </div>
                            <div className="pt-2 text-gray-300 dark:text-gray-600 group-hover:text-cyan-500 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
