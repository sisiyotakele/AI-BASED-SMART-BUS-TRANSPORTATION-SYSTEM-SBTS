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

            {/* Strict Single-Line Non-Scrollable Header with Original Padding */}
            <div className="bg-[#2B4B9E] dark:bg-navy-900 border border-transparent dark:border-navy-700 rounded-2xl px-6 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2 w-full">
                    
                    {/* Left: Title & Inline Compact Stats (Full Words, No Abbreviations) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-white font-semibold text-base whitespace-nowrap">Pricing Management</h2>

                        <div className="flex items-center gap-1.5 pl-3 border-l border-cyan-400/40">
                            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded shrink-0">
                                <DollarSign className="w-3.5 h-3.5 text-cyan-100" />
                                <span className="text-[10px] text-cyan-100 uppercase">Total Rules:</span>
                                <span className="text-xs font-bold text-white">{prices.length}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-green-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Active:</span>
                                <span className="text-xs font-bold text-white">{activeCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-gray-500/20 px-2 py-1 rounded shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Inactive:</span>
                                <span className="text-xs font-bold text-white">{inactiveCount}</span>
                            </div>

                            <div className="flex items-center space-x-1 bg-yellow-500/20 px-2 py-1 rounded shrink-0">
                                <TrendingUp className="w-3.5 h-3.5 text-yellow-300" />
                                <span className="text-[10px] text-cyan-100 uppercase">Average Price:</span>
                                <span className="text-xs font-bold text-white">{avgBasePrice.toFixed(2)} ETB</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search, Status Filter, Export & Action Buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 max-w-[150px]">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="text-xs text-slate-800 dark:text-slate-100 px-2 py-1 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0 cursor-pointer transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <button 
                            onClick={handleExport}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors shrink-0 font-medium"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shrink-0 font-medium whitespace-nowrap border border-transparent"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Price</span>
                        </button>
                    </div>

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

                    <button onClick={handleCalculate} disabled={calcLoading} className="px-4 py-2 bg-[#2B4B9E] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center justify-center gap-2">
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

            {/* Cards Grid */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-12 text-center border border-slate-200 dark:border-navy-700">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Loading prices...</p>
                    </div>
                ) : currentPrices.length === 0 ? (
                    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm p-12 text-center border border-slate-200 dark:border-navy-700">
                        <DollarSign className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">No prices found</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentPrices.map((price) => (
                                <div
                                    key={price.id}
                                    className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-navy-700 transition-all duration-300 overflow-hidden flex flex-col group"
                                >
                                    {/* Card Header */}
                                    <div className="border-b border-slate-100 dark:border-navy-700 px-5 py-4 bg-slate-50/50 dark:bg-navy-800/40">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-slate-900 dark:text-white font-bold text-base transition-colors">{price.routeName}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${price.isActive
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                }`}>
                                                {price.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 flex-1 flex flex-col space-y-4">
                                        {/* Route Info */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">From</p>
                                                <p className="text-slate-900 dark:text-slate-200 font-bold truncate">{price.fromStopName}</p>
                                            </div>
                                            <div className="px-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 flex items-center justify-center">
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">→</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 text-right min-w-0">
                                                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">To</p>
                                                <p className="text-slate-900 dark:text-slate-200 font-bold truncate">{price.toStopName}</p>
                                            </div>
                                        </div>

                                        {/* Base Price */}
                                        <div className="border border-slate-100 dark:border-navy-700 rounded-xl p-3 bg-slate-50/80 dark:bg-navy-800/50 flex flex-col items-center justify-center">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Base Price</p>
                                            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                                                {Number(price.basePrice).toFixed(2)}
                                                <span className="text-sm text-cyan-600/70 dark:text-cyan-400/70 ml-1 font-bold">ETB</span>
                                            </p>
                                        </div>



                                        {/* Effective Period */}
                                        <div className="mt-auto border-t border-slate-100 dark:border-navy-700 pt-4 pb-1">
                                            <div className="flex items-start space-x-2.5">
                                                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug">
                                                        {new Date(price.effectiveFrom).toLocaleDateString()}
                                                        {price.effectiveUntil && (
                                                            <span className="font-bold text-slate-400 dark:text-slate-500 mx-1.5">→</span>
                                                        )}
                                                        {price.effectiveUntil && new Date(price.effectiveUntil).toLocaleDateString()}
                                                        {!price.effectiveUntil && (
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1.5 uppercase text-[10px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded">(Ongoing)</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 dark:border-navy-700">
                                            <button
                                                onClick={() => handleEditPrice(price)}
                                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors border border-transparent dark:border-blue-500/10"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeletePrice(price.id)}
                                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors border border-transparent dark:border-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {filteredPrices.length > 0 && (
                            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cards per page:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-1 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-colors cursor-pointer"
                                    >
                                        <option value={9}>9</option>
                                        <option value={18}>18</option>
                                        <option value={30}>30</option>
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
                                            className={`px-3 py-1.5 text-sm rounded font-semibold transition-colors ${currentPage === i + 1
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
                    </>
                )}
            </div>
        </div>
    );
}