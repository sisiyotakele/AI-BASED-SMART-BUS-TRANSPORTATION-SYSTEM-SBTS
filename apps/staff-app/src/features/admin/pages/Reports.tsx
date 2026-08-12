import { useState } from 'react';
import { Search, Download, Calendar, Filter, FileText, BarChart, TrendingUp, Users, Bus, Clock, DollarSign, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { reportService, ReportHistoryItem } from '@/services/report.service';

export function Reports() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('today');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [selectedReportType, setSelectedReportType] = useState<'trip' | 'fleet' | 'incident' | 'revenue'>('trip');

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleEmail, setScheduleEmail] = useState('');
    const [scheduleMessage, setScheduleMessage] = useState('');
    const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
    const [selectedReportDetails, setSelectedReportDetails] = useState<ReportHistoryItem | null>(null);
    
    const queryClient = useQueryClient();

    const createReportMutation = useMutation({
        mutationFn: (data: any) => reportService.createReport(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reportHistory'] });
            queryClient.invalidateQueries({ queryKey: ['reportStats'] });
        }
    });

    const { data: historyData, isLoading } = useQuery({
        queryKey: ['reportHistory', { page: currentPage, limit: itemsPerPage, filterType, searchTerm }],
        queryFn: () => reportService.getReportHistory({ 
            limit: itemsPerPage, 
            offset: (currentPage - 1) * itemsPerPage 
        })
    });

    const { data: statsData } = useQuery({
        queryKey: ['reportStats'],
        queryFn: () => reportService.getReportStats()
    });

    const currentReports = historyData?.reports || [];
    const totalReportsCount = historyData?.total || 0;
    const totalPages = Math.ceil(totalReportsCount / itemsPerPage) || 1;

    // Additional filtering (client side since backend doesn't support complex search yet)
    let displayReports = currentReports;
    if (searchTerm) {
        displayReports = displayReports.filter(r => r.reportName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterType !== 'all') {
        displayReports = displayReports.filter(r => r.reportType === filterType);
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'trip': return 'bg-blue-100 text-blue-700';
            case 'fleet': return 'bg-green-100 text-green-700';
            case 'incident': return 'bg-red-100 text-red-700';
            case 'revenue': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'trip': return <Users className="w-4 h-4" />;
            case 'fleet': return <Bus className="w-4 h-4" />;
            case 'incident': return <FileText className="w-4 h-4" />;
            case 'revenue': return <DollarSign className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const handleGenerateReport = async (format: 'pdf' | 'csv' | 'json' | 'excel' = 'pdf') => {
        const loadingId = toast.loading('Compiling report data on the backend...');
        
        try {
            await createReportMutation.mutateAsync({
                reportName: `${selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)} Performance Report`,
                reportType: selectedReportType,
                description: `Generated ${selectedReportType} metrics and performance indicators.`
            });

            // Extract the actual raw data vectors depending on active model
            let rawDataArray: any[] = [];
            if (selectedReportType === 'trip') rawDataArray = tripReportData?.trips || [];
            if (selectedReportType === 'fleet') rawDataArray = fleetReportData?.buses || [];
            if (selectedReportType === 'incident') rawDataArray = incidentReportData?.incidents || [];

            if (format === 'pdf') {
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text(`${previewData.title}`, 14, 22);
                doc.setFontSize(11);
                doc.setTextColor(100);
                doc.text(previewData.description, 14, 30);
                
                // 1. KPI Summary Table
                const kpiTableData = previewData.metrics.map((m: any) => [m.label, m.value, m.change]);
                autoTable(doc, { head: [['Metric', 'Value', 'Status']], body: kpiTableData, startY: 40 });
                
                // 2. Raw Database Records Table
                if (rawDataArray.length > 0) {
                    const headers = Object.keys(rawDataArray[0]).filter(k => !['id', 'createdAt', 'updatedAt'].includes(k));
                    const rows = rawDataArray.map(obj => headers.map(h => String(obj[h])));
                    autoTable(doc, { 
                        head: [headers.map(h => h.toUpperCase())], 
                        body: rows, 
                        startY: (doc as any).lastAutoTable.finalY + 15,
                        theme: 'striped',
                        styles: { fontSize: 8 }
                    });
                }
                
                doc.save(`${selectedReportType}_report_${new Date().getTime()}.pdf`);
            } else if (format === 'csv') {
                let csvContent = "data:text/csv;charset=utf-8,";
                if (rawDataArray.length > 0) {
                    const headers = Object.keys(rawDataArray[0]);
                    csvContent += headers.join(",") + "\\n";
                    csvContent += rawDataArray.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(",")).join("\\n");
                }
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `${selectedReportType}_raw_dump_${new Date().getTime()}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else if (format === 'json') {
                const exportPayload = {
                    metadata: previewData,
                    datasetLength: rawDataArray.length,
                    databaseRows: rawDataArray
                };
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
                const link = document.createElement("a");
                link.setAttribute("href", dataStr);
                link.setAttribute("download", `${selectedReportType}_raw_dump_${new Date().getTime()}.json`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
            
            toast.success('Report generated and saved to history!', { id: loadingId });
        } catch (error: any) {
            console.error('REPORT GEN ERROR:', error?.response?.data || error);
            const errMsg = error?.response?.data?.message || 'Failed to generate report';
            toast.error(errMsg, { id: loadingId });
        }
    };

    const handleDownloadRawData = () => {
        toast.promise(
            handleGenerateReport('json'),
            {
                loading: 'Compiling raw data dump...',
                success: 'Raw custom data exported!',
                error: 'Failed to export data.'
            }
        );
    };

    const handleConfirmSchedule = async () => {
        if (!scheduleEmail) {
            toast.error('Please enter an email address');
            return;
        }
        
        try {
            const desc = scheduleMessage 
                ? `Custom Message: "${scheduleMessage}" | Recurring report set for ${scheduleFrequency} delivery to ${scheduleEmail}` 
                : `Recurring report set for ${scheduleFrequency} delivery to ${scheduleEmail}`;

            await createReportMutation.mutateAsync({
                reportName: `Automated Scheduled ${selectedReportType} Report`,
                reportType: selectedReportType,
                description: desc,
                isScheduled: true,
                scheduleCron: scheduleFrequency === 'daily' ? '0 0 * * *' : scheduleFrequency === 'weekly' ? '0 0 * * 0' : '0 0 1 * *' 
            });
            
            toast.success(`Automated ${selectedReportType} reports scheduled to ${scheduleEmail}!`);
            setIsScheduleModalOpen(false);
            setScheduleEmail('');
            setScheduleMessage('');
        } catch (error) {
            toast.error('Failed to save schedule to the database.');
        }
    };

    const handleScheduleReport = () => {
        setIsScheduleModalOpen(true);
    };

    const handleDownloadReport = (report: ReportHistoryItem) => {
        toast.loading('Downloading historical report database payload...', { duration: 1500 });
        setTimeout(() => {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(`Historical Report: ${report.reportName}`, 14, 22);
            doc.setFontSize(10);
            doc.text(`Type: ${report.reportType.toUpperCase()} | Generated: ${new Date(report.createdAt).toLocaleString()}`, 14, 30);
            
            autoTable(doc, { 
                head: [['Property', 'Details']], 
                body: [
                    ['Report ID', report.id],
                    ['Description', report.description || 'Standard System Report'],
                    ['Author', report.creator?.fullName || 'System Generated'],
                    ['Status', report.status || 'COMPLETED']
                ], 
                startY: 40 
            });
            doc.save(`${report.reportName.replace(/\s+/g, '_')}_${report.id.slice(0, 5)}.pdf`);
        }, 1200);
    };

    const { data: tripReportData } = useQuery({
        queryKey: ['tripReport'],
        queryFn: () => reportService.getTripReport(),
        enabled: selectedReportType === 'trip'
    });

    const { data: fleetReportData } = useQuery({
        queryKey: ['fleetReport'],
        queryFn: () => reportService.getFleetReport(),
        enabled: selectedReportType === 'fleet'
    });

    const { data: incidentReportData } = useQuery({
        queryKey: ['incidentReport'],
        queryFn: () => reportService.getIncidentReport(),
        enabled: selectedReportType === 'incident'
    });

    const getReportPreviewData = () => {
        switch (selectedReportType) {
            case 'trip':
                const tStats = tripReportData?.stats || { totalTrips: 0, completed: 0, cancelled: 0, avgActualDuration: 0 };
                return {
                    title: 'Live Trip Performance Report',
                    description: 'Daily trip statistics directly from live tracking DB',
                    metrics: [
                        { label: 'Total Trips', value: tStats.totalTrips.toString(), change: 'Live', icon: TrendingUp, color: 'blue' },
                        { label: 'Completed', value: tStats.completed.toString(), change: 'Live', icon: CheckCircle, color: 'green' },
                        { label: 'Cancelled', value: tStats.cancelled.toString(), change: 'Live', icon: XCircle, color: 'red' },
                        { label: 'Avg. Duration (m)', value: `${tStats.avgActualDuration}m`, change: 'Live', icon: Clock, color: 'purple' },
                    ]
                };
            case 'fleet':
                const fStats = fleetReportData?.stats || { totalBuses: 0, operational: 0, inMaintenance: 0, totalCapacity: 0 };
                return {
                    title: 'Live Fleet Utilization Report',
                    description: 'Database-driven Bus utilization and maintenance metrics',
                    metrics: [
                        { label: 'Active Buses', value: fStats.totalBuses.toString(), change: 'Live', icon: Bus, color: 'blue' },
                        { label: 'Operational', value: fStats.operational.toString(), change: 'Live', icon: CheckCircle, color: 'green' },
                        { label: 'In Maintenance', value: fStats.inMaintenance.toString(), change: 'Live', icon: Wrench, color: 'yellow' },
                        { label: 'Total Capacity', value: fStats.totalCapacity.toString(), change: 'Live', icon: Users, color: 'purple' },
                    ]
                };
            case 'incident':
                const iStats = incidentReportData?.stats || { totalIncidents: 0, resolved: 0, pending: 0, bySeverity: { critical: 0 } };
                return {
                    title: 'Live Incident Analysis Report',
                    description: 'Real-time incident trends synced from driver logs',
                    metrics: [
                        { label: 'Total Incidents', value: iStats.totalIncidents.toString(), change: 'Live', icon: AlertCircle, color: 'red' },
                        { label: 'Pending', value: iStats.pending.toString(), change: 'Live', icon: Clock, color: 'blue' },
                        { label: 'Resolved', value: iStats.resolved.toString(), change: 'Live', icon: CheckCircle, color: 'green' },
                        { label: 'Critical', value: iStats.bySeverity?.critical?.toString() || '0', change: 'Live', icon: AlertTriangle, color: 'orange' },
                    ]
                };
        }
        
        return { title: '', description: '', metrics: [] };
    };

    // Mock icons for preview
    const CheckCircle = ({ className }: { className: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const XCircle = ({ className }: { className: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const Wrench = ({ className }: { className: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    const AlertCircle = ({ className }: { className: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const AlertTriangle = ({ className }: { className: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>;
    const Percent = ({ className }: { className: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;

    const previewData = getReportPreviewData();

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Analytics & Reports</h2>
                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <BarChart className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Reports:</span>
                                <span className="text-xs font-bold text-white">{statsData?.totalReports || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <Download className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Downloads:</span>
                                <span className="text-xs font-bold text-white">{statsData?.totalDownloads || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1 bg-purple-500/20 px-2 py-1 rounded shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-purple-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Scheduled:</span>
                                <span className="text-xs font-bold text-white">{statsData?.scheduledCount || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[180px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="text-xs text-slate-800 dark:text-slate-200 px-2 py-1.5 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="trip">Trip Reports</option>
                            <option value="fleet">Fleet Reports</option>
                            <option value="incident">Incident Reports</option>
                            <option value="revenue">Revenue Reports</option>
                            <option value="custom">Custom Reports</option>
                        </select>

                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="text-xs text-slate-800 dark:text-slate-200 px-2 py-1.5 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        <button
                            onClick={() => handleGenerateReport('pdf')}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium whitespace-nowrap"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>New Report</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Type Selection & Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Report Type Selector */}
                <div className="lg:col-span-1 bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-4 border border-slate-200 dark:border-navy-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Select Report Type</h3>
                    <div className="space-y-2">
                        {[
                            { id: 'trip', label: 'Trip Reports', icon: Users, description: 'Trip statistics and performance' },
                            { id: 'fleet', label: 'Fleet Reports', icon: Bus, description: 'Bus utilization and maintenance' },
                            { id: 'incident', label: 'Incident Reports', icon: FileText, description: 'Incident trends and analysis' },
                        ].map((type) => {
                            const Icon = type.icon;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedReportType(type.id as any)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedReportType === type.id
                                        ? 'bg-cyan-50 dark:bg-navy-800/60 border border-cyan-200 dark:border-navy-600 shadow-sm'
                                        : 'bg-slate-50 dark:bg-navy-800/30 hover:bg-slate-100 dark:hover:bg-navy-800/50 border border-slate-200 dark:border-navy-700'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedReportType === type.id ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' : 'bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-400'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{type.label}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{type.description}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Report Preview */}
                <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-4 border border-slate-200 dark:border-navy-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{previewData.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{previewData.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleGenerateReport('pdf')} className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex items-center gap-1">
                                <Download className="w-3.5 h-3.5" />
                                <span>Generate</span>
                            </button>
                            <button onClick={handleScheduleReport} className="px-3 py-1.5 text-xs bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-navy-600 rounded hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Schedule</span>
                            </button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {previewData.metrics.map((metric, index) => {
                            const Icon = metric.icon;
                            const colorClasses = {
                                blue: 'text-blue-600',
                                green: 'text-green-600',
                                red: 'text-red-600',
                                orange: 'text-orange-600',
                                yellow: 'text-yellow-600',
                                purple: 'text-purple-600',
                            };
                            return (
                                <div key={index} className="bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <Icon className={`w-4 h-4 ${colorClasses[metric.color as keyof typeof colorClasses]}`} />
                                        <span className={`text-xs font-medium ${metric.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {metric.change}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{metric.label}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Live Chart Implementation */}
                    <div className="border border-slate-200 dark:border-navy-700 rounded-xl p-4 bg-white dark:bg-navy-800/50">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Performance Trends</h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Activity Over Time</span>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {(() => {
                                    // Generate dynamic chart data based on active report mode
                                    let rawRows: any[] = [];
                                    if (selectedReportType === 'trip') rawRows = tripReportData?.trips || [];
                                    else if (selectedReportType === 'fleet') rawRows = fleetReportData?.buses || [];
                                    else if (selectedReportType === 'incident') rawRows = incidentReportData?.incidents || [];
                                    
                                    // Initialize true week buckets
                                    const daysMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
                                    
                                    // Aggregate real data rows by day of the week
                                    rawRows.forEach(row => {
                                        if (row.createdAt || row.actualStart || row.updatedAt) {
                                            const dateStr = row.createdAt || row.actualStart || row.updatedAt;
                                            const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
                                            if (daysMap[dayName as keyof typeof daysMap] !== undefined) {
                                                daysMap[dayName as keyof typeof daysMap]++;
                                            }
                                        }
                                    });

                                    const chartData = Object.keys(daysMap).map(key => ({
                                        name: key,
                                        value: daysMap[key as keyof typeof daysMap]
                                    }));

                                    return (
                                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                                                itemStyle={{ color: '#38bdf8' }}
                                                formatter={(val: number) => [selectedReportType === 'revenue' ? `₦${val.toLocaleString()}` : val, 'Count']}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="value" 
                                                stroke="#0ea5e9" 
                                                strokeWidth={3}
                                                fillOpacity={1} 
                                                fill="url(#colorValue)" 
                                            />
                                        </AreaChart>
                                    );
                                })()}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Reports Table */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-navy-700">
                <div className="p-4 border-b border-slate-200 dark:border-navy-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recently Generated Reports</h3>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">Sorted by most recent</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-navy-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Report Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Date Range</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Generated By</th>

                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">Loading reports...</p>
                                    </td>
                                </tr>
                            ) : displayReports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">No reports found</p>
                                    </td>
                                </tr>
                            ) : (
                                displayReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                                                    {getTypeIcon(report.reportType)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{report.reportName}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">ID: {report.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getTypeBadge(report.reportType)}`}>
                                                {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{report.description || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{report.creator?.fullName || 'System'}</p>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleDownloadReport(report)}
                                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    title="Download report"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedReportDetails(report)}
                                                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800 rounded transition-colors" 
                                                    title="View details"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setIsScheduleModalOpen(true)}
                                                    className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors" 
                                                    title="Schedule"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalReportsCount > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Rows per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100 text-sm"
                            >
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                                <option value={20}>20</option>
                            </select>
                            <span className="text-sm text-cyan-600 dark:text-cyan-400">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalReportsCount)} of {totalReportsCount} entries
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded disabled:text-slate-400 disabled:dark:text-slate-600 disabled:hover:bg-transparent transition-colors font-medium"
                            >
                                ← Back
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${currentPage === i + 1
                                        ? 'bg-emerald-500 text-white font-medium'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded disabled:text-slate-400 disabled:dark:text-slate-600 disabled:hover:bg-transparent transition-colors font-medium"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Export Section */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-4 border border-slate-200 dark:border-navy-700">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Export Options</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Download reports in various formats</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Format:</span>
                        <div className="flex bg-slate-100 dark:bg-navy-800 rounded-lg p-0.5">
                            <button onClick={() => handleGenerateReport('csv')} className="px-3 py-1 text-xs bg-white dark:bg-navy-700 text-slate-700 dark:text-slate-200 rounded shadow-sm">CSV (Beta)</button>
                            <button onClick={() => handleGenerateReport('json')} className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">JSON (Raw)</button>
                            <button onClick={() => handleGenerateReport('pdf')} className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">PDF</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border border-slate-200 dark:border-navy-700 rounded-xl p-4 bg-slate-50 dark:bg-navy-800/30">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Quick Export</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Export current view</p>
                            </div>
                        </div>
                        <button onClick={() => handleGenerateReport('pdf')} className="w-full mt-2 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1">
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Now</span>
                        </button>
                    </div>

                    <div className="border border-slate-200 dark:border-navy-700 rounded-xl p-4 bg-slate-50 dark:bg-navy-800/30">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Scheduled Export</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Set up automatic exports</p>
                            </div>
                        </div>
                        <button onClick={handleScheduleReport} className="w-full mt-2 px-3 py-1.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule Export</span>
                        </button>
                    </div>

                    <div className="border border-slate-200 dark:border-navy-700 rounded-xl p-4 bg-slate-50 dark:bg-navy-800/30">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Custom Export</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Create custom report template</p>
                            </div>
                        </div>
                        <button onClick={handleDownloadRawData} className="w-full mt-2 px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Export Raw Output</span>
                        </button>
                    </div>
                </div>
            </div>
            {/* Schedule Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200 dark:border-navy-700">
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Schedule Automated Report</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Select how often you want the {selectedReportType} report delivered automatically.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Recipient</label>
                                    <input 
                                        type="email" 
                                        value={scheduleEmail}
                                        onChange={(e) => setScheduleEmail(e.target.value)}
                                        placeholder="admin@smartbus.com"
                                        className="w-full px-3 py-2 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                                    <select 
                                        value={scheduleFrequency}
                                        onChange={(e) => setScheduleFrequency(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm text-slate-900 dark:text-slate-100"
                                    >
                                        <option value="daily">Daily Recap</option>
                                        <option value="weekly">Weekly Summary</option>
                                        <option value="monthly">Monthly Overview</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message to Recipient (Optional)</label>
                                    <textarea 
                                        value={scheduleMessage}
                                        onChange={(e) => setScheduleMessage(e.target.value)}
                                        placeholder="E.g., Team, here is the automated weekly snapshot for our fleet performance..."
                                        rows={3}
                                        className="w-full px-3 py-2 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm text-slate-900 dark:text-slate-100 resize-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-3">
                                <button 
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmSchedule}
                                    className="px-4 py-2 text-sm bg-cyan-500 text-white hover:bg-cyan-600 rounded-lg transition-colors font-medium"
                                >
                                    Confirm Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {selectedReportDetails && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-navy-700">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedReportDetails.reportName}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ID: {selectedReportDetails.id}</p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getTypeBadge(selectedReportDetails.reportType)}`}>
                                    {selectedReportDetails.reportType.toUpperCase()}
                                </span>
                            </div>
                            
                            <div className="space-y-4 mb-8 border border-slate-100 dark:border-navy-800 rounded-xl p-4 bg-slate-50 dark:bg-navy-800/30">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Generated By</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100">{selectedReportDetails.creator?.fullName || 'System'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Downloads</p>
                                        <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 inline-block px-2 py-0.5 rounded">{selectedReportDetails.downloads?.length || 0} times</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Last Generated</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100">{new Date(selectedReportDetails.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100">{selectedReportDetails.status.toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-200 dark:border-navy-700">
                                   <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</p>
                                   <p className="text-sm text-slate-700 dark:text-slate-300">{selectedReportDetails.description}</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => setSelectedReportDetails(null)}
                                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors font-medium"
                                >
                                    Close Window
                                </button>
                                <button 
                                    onClick={() => handleDownloadReport(selectedReportDetails)}
                                    className="px-4 py-2 flex items-center gap-2 text-sm bg-cyan-500 text-white hover:bg-cyan-600 rounded-lg transition-colors font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}