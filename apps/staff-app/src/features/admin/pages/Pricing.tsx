import { useConfirm } from '@/contexts/ConfirmContext';
import { useState } from 'react';
import { Search, Download, Plus, DollarSign, Edit2, Trash2, TrendingUp, TrendingDown, Calendar, Calculator, Loader2 } from 'lucide-react';
import { PricingModal } from '@/features/admin/components/PricingModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingService, PriceData } from '@/services/pricing.service';
import { routeService } from '@/services/route.service';
import { stopService } from '@/services/stop.service';
import toast from 'react-hot-toast';

export function Pricing() {
    const { confirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<PriceData | null>(null);

    // Calculator state
    const [calcRouteId, setCalcRouteId] = useState('');
    const [calcFromStopId, setCalcFromStopId] = useState('');
    const [calcToStopId, setCalcToStopId] = useState('');
    const [calcResult, setCalcResult] = useState<{ price: number; type: string } | null>(null);
    const [calcLoading, setCalcLoading] = useState(false);

    const queryClient = useQueryClient();

    const { data: pricesResponse, isLoading } = useQuery({
        queryKey: ['pricing', filterStatus],
        queryFn: () => pricingService.getPrices({
            isActive: filterStatus === 'all' ? undefined : filterStatus === 'active',
        }),
    });

    const { data: statsData } = useQuery({
        queryKey: ['pricing-stats'],
        queryFn: () => pricingService.getStats(),
    });

    const { data: routesData = [] } = useQuery({
        queryKey: ['routes-calc'],
        queryFn: () => routeService.getAll(),
    });

    const { data: stopsData = [] } = useQuery({
        queryKey: ['stops-calc'],
        queryFn: () => stopService.getAll(),
    });

    const calcSelectedRoute = (routesData as any[]).find(r => r.id === calcRouteId);
    let calcAvailableStops = [] as any[];
    if (calcSelectedRoute) {
        const stopsMap = new Map();
        if (calcSelectedRoute.startStop) stopsMap.set(calcSelectedRoute.startStop.id, calcSelectedRoute.startStop);
        if (calcSelectedRoute.endStop) stopsMap.set(calcSelectedRoute.endStop.id, calcSelectedRoute.endStop);
        calcSelectedRoute.versions?.[0]?.routeStops?.forEach((rs: any) => {
            if (rs.stop) stopsMap.set(rs.stop.id, rs.stop);
        });
        calcAvailableStops = Array.from(stopsMap.values());
    } else {
        calcAvailableStops = stopsData;
    }

    const allPrices: PriceData[] = pricesResponse?.data || [];

    // Map to flat structure
    const prices = allPrices.map((p: PriceData) => ({
        ...p,
        routeName: p.route?.routeName || 'Unknown Route',
        fromStopName: p.fromStop?.stopName || 'Unknown Stop',
        toStopName: p.toStop?.stopName || 'Unknown Stop',
    }));

    // Client-side search filter (status already filtered server-side)
    const filteredPrices = prices.filter((price: any) => {
        return (
            price.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            price.fromStopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            price.toStopName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredPrices.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPrices = filteredPrices.slice(startIndex, endIndex);

    // Stats from API or derived
    const activeCount = statsData?.active ?? prices.filter((p: any) => p.isActive).length;
    const inactiveCount = statsData?.inactive ?? prices.filter((p: any) => !p.isActive).length;
    const avgBasePrice = statsData?.avgBasePrice ?? (prices.length > 0 ? prices.reduce((s: number, p: any) => s + Number(p.basePrice), 0) / prices.length : 0);

    const createMutation = useMutation({
        mutationFn: (data: any) => pricingService.createPrice(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
            queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
            toast.success('Price created successfully');
            setIsModalOpen(false);
        },
        onError: () => toast.error('Failed to create price'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => pricingService.updatePrice(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
            queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
            toast.success('Price updated successfully');
            setIsModalOpen(false);
            setEditingPrice(null);
        },
        onError: () => toast.error('Failed to update price'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => pricingService.deletePrice(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
            queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
            toast.success('Price deleted');
        },
        onError: () => toast.error('Failed to delete price'),
    });

    const handleCreatePrice = async (priceData: any) => {
        createMutation.mutate(priceData);
    };

    const handleEditPrice = async (price: PriceData) => {
        setEditingPrice(price);
        setIsModalOpen(true);
    };

    const handleUpdatePrice = async (priceData: any) => {
        if (editingPrice) {
            updateMutation.mutate({ id: editingPrice.id, data: priceData });
        }
    };

    const handleDeletePrice = async (priceId: string) => {
        const isConfirmed = await confirm({ title: "Confirm Action", message: 'Are you sure you want to delete this price?', confirmText: "Confirm", isDanger: true });
        if (isConfirmed) {
            deleteMutation.mutate(priceId);
        }
    };

    const handleExport = () => {
        if (!prices.length) {
            toast.error('No prices to export.');
            return;
        }

        const headers = ['Route', 'From Stop', 'To Stop', 'Base Price', 'Effective From', 'Effective Until', 'Status'];
        let csvContent = headers.join(',');

        const csvData = prices.map((p: any) => [
            p.routeName,
            p.fromStopName,
            p.toStopName,
            p.basePrice,
            new Date(p.effectiveFrom).toLocaleDateString(),
            p.effectiveUntil ? new Date(p.effectiveUntil).toLocaleDateString() : 'Ongoing',
            p.isActive ? 'Active' : 'Inactive'
        ]);
        csvContent = [headers.join(','), ...csvData.map(row => row.map(v => `"${v}"`).join(','))].join('\n');

        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pricing_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Export successful');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const handleCalculate = async () => {
        if (!calcRouteId || !calcFromStopId || !calcToStopId) {
            toast.error('Please select route, origin, and destination');
            return;
        }
        setCalcLoading(true);
        try {
            const result = await pricingService.calculatePrice({
                routeId: calcRouteId,
                fromStopId: calcFromStopId,
                toStopId: calcToStopId,
                isPeak: false,
            });
            setCalcResult(result);
        } catch {
            toast.error('No price found for that combination');
        } finally {
            setCalcLoading(false);
        }
    };

    const handleModalClose = async () => {
        setIsModalOpen(false);
        setEditingPrice(null);
    };

    return (
        <div className="space-y-4">
            <PricingModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={editingPrice ? handleUpdatePrice : handleCreatePrice}
                editData={editingPrice}
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Pricing Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and monitor all route pricing rules</p>
                </div>
            </div>

            {/* Control Bar with Inline Stats */}
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col xl:flex-row gap-4 justify-between items-center overflow-x-auto w-full">
                
                {/* Stats Pills */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <DollarSign className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL RULES:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{prices.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ACTIVE:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{activeCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">INACTIVE:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{inactiveCount}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg whitespace-nowrap">
                        <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AVG PRICE:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{avgBasePrice.toFixed(2)} ETB</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-1 items-center justify-end gap-3 w-full xl:w-auto overflow-x-auto">
                    <div className="relative min-w-[150px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search prices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <button 
                        onClick={handleExport}
                        className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-1.5 px-4 py-2.5 text-sm bg-[#2B4B9E] hover:bg-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-bold flex-shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Price</span>
                    </button>
                </div>
            </div>

            {/* Price Calculator */}
            <div className="bg-gradient-to-br from-blue-50 to-[#2B4B9E]/10 dark:from-navy-900/50 dark:to-blue-900/10 rounded-2xl shadow-sm p-6 border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center space-x-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2B4B9E] to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Price Calculator</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select value={calcRouteId} onChange={(e) => { setCalcRouteId(e.target.value); setCalcFromStopId(''); setCalcToStopId(''); }} className="px-3 py-2 border border-blue-300/50 dark:border-blue-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4B9E] bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-100 text-sm transition-colors cursor-pointer">
                        <option value="">Select Route</option>
                        {(routesData as any[]).map((r: any) => (
                            <option key={r.id} value={r.id}>{r.routeName || r.name}</option>
                        ))}
                    </select>
                    
                    <select
                        value={calcFromStopId}
                        onChange={(e) => setCalcFromStopId(e.target.value)}
                        className="px-3 py-2 border border-blue-300/50 dark:border-blue-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4B9E] bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-100 text-sm cursor-pointer"
                    >
                        <option value="">Select Origin</option>
                        {calcAvailableStops.map((stop: any) => (
                            <option key={stop.id} value={stop.id}>
                                {stop.stopName}
                            </option>
                        ))}
                    </select>

                    <select
                        value={calcToStopId}
                        onChange={(e) => setCalcToStopId(e.target.value)}
                        className="px-3 py-2 border border-blue-300/50 dark:border-blue-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4B9E] bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-100 text-sm cursor-pointer"
                    >
                        <option value="">Select Destination</option>
                        {calcAvailableStops.map((stop: any) => (
                            <option
                                key={stop.id}
                                value={stop.id}
                                disabled={stop.id === calcFromStopId}
                            >
                                {stop.stopName}
                            </option>
                        ))}
                    </select>

                    <button onClick={handleCalculate} disabled={calcLoading} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm shadow-sm flex items-center justify-center gap-2">
                        {calcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                        Calculate
                    </button>
                </div>
                {calcResult && (
                    <div className="mt-5 p-5 bg-white/60 dark:bg-navy-800/60 rounded-xl border border-blue-200/50 dark:border-blue-800/30 backdrop-blur-sm transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Calculated Price ({calcResult.type})</p>
                                <p className="text-3xl font-black text-[#2B4B9E] dark:text-blue-400">{Number(calcResult.price).toFixed(2)} <span className="text-xl font-bold opacity-75">ETB</span></p>
                            </div>
                            <DollarSign className="w-16 h-16 text-[#2B4B9E] opacity-10 dark:opacity-20" />
                        </div>
                    </div>
                )}
            </div>

            {/* Table View */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#2B4B9E] text-white">
                            <tr className="h-[70px]">
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">Route</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">Path</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">Base Price</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">Effective Period</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase">Status</th>
                                <th className="px-6 text-sm font-medium text-white tracking-wide uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-navy-700 bg-white dark:bg-navy-900">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mx-auto mb-4" />
                                        <p className="text-lg">Loading prices...</p>
                                    </td>
                                </tr>
                            ) : currentPrices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-lg">No prices found</p>
                                    </td>
                                </tr>
                            ) : (
                                currentPrices.map((price) => (
                                    <tr key={price.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{price.routeName}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">From</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 leading-none">{price.fromStopName}</span>
                                                </div>
                                                <span className="text-slate-300 dark:text-slate-600 font-bold">→</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">To</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 leading-none">{price.toStopName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-1">
                                                <span className="text-[18px] font-black text-cyan-600 dark:text-cyan-400 leading-none">{Number(price.basePrice).toFixed(2)}</span>
                                                <span className="text-xs text-cyan-600/70 dark:text-cyan-400/70 font-bold pt-1">ETB</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                    {new Date(price.effectiveFrom).toLocaleDateString()}
                                                    {price.effectiveUntil ? (
                                                        <>
                                                            <span className="text-slate-300 dark:text-slate-600 font-bold mx-2">→</span>
                                                            {new Date(price.effectiveUntil).toLocaleDateString()}
                                                        </>
                                                    ) : (
                                                        <span className="ml-2 text-[10px] uppercase font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">Ongoing</span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded text-xs font-bold cursor-pointer tracking-wide ${price.isActive ? 'bg-[#ECFDF5] text-[#10B981] border border-[#D1FAE5] dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300'}`}>
                                                {price.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditPrice(price)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrice(price.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
                {filteredPrices.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-navy-800/40">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Rows per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-colors cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredPrices.length)} of {filteredPrices.length} entries
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded disabled:text-slate-400 dark:disabled:text-slate-600 disabled:hover:bg-transparent transition-colors font-semibold"
                            >
                                ← Back
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1.5 text-sm rounded font-semibold transition-colors ${
                                        currentPage === i + 1
                                            ? 'bg-emerald-500 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded disabled:text-slate-400 dark:disabled:text-slate-600 disabled:hover:bg-transparent transition-colors font-semibold"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}