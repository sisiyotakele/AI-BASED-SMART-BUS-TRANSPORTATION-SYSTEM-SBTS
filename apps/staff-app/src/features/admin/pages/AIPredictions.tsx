import { useState } from 'react';
import { Brain, Activity, TrendingUp, CheckCircle, XCircle, Power, Loader2, Database } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiPredictionService, AIModel } from '@/services/ai-prediction.service';

export function AIPredictions() {
    const queryClient = useQueryClient();

    // Fetch all models
    const { data: models = [], isLoading } = useQuery({
        queryKey: ['aiModels'],
        queryFn: () => aiPredictionService.getModels()
    });

    // Fetch active model specifically
    const { data: activeModel } = useQuery({
        queryKey: ['activeAIModel'],
        queryFn: () => aiPredictionService.getActiveModel(),
        retry: 1
    });

    const activateModelMutation = useMutation({
        mutationFn: (id: string) => aiPredictionService.activateModel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiModels'] });
            queryClient.invalidateQueries({ queryKey: ['activeAIModel'] });
            toast.success('AI Model successfully activated');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to activate model');
        }
    });

    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
    
    // Training Configuration State
    const [trainConfig, setTrainConfig] = useState({
        modelType: 'eta_prediction',
        dateRange: 'last_30_days',
        datasets: {
            trips: true,
            tracking: true,
            incidents: false
        }
    });

    const createModelMutation = useMutation({
        mutationFn: () => {
            // Calculate simulated dataset size based on selected configurations
            let baseParams = 10000;
            if (trainConfig.dateRange === 'last_6_months') baseParams *= 6;
            if (trainConfig.dateRange === 'last_year') baseParams *= 12;
            
            let datasetSize = 0;
            if (trainConfig.datasets.trips) datasetSize += baseParams * 0.4;
            if (trainConfig.datasets.tracking) datasetSize += baseParams * 0.5;
            if (trainConfig.datasets.incidents) datasetSize += baseParams * 0.05;

            return aiPredictionService.createModel({
                version: `2.${models.length + 1}.0`,
                accuracy: 0.85 + (Math.random() * 0.12),
                trainedAt: new Date().toISOString(),
                datasetSize: Math.floor(datasetSize),
                modelParameters: JSON.stringify({ 
                    type: trainConfig.modelType,
                    period: trainConfig.dateRange,
                    sources: Object.entries(trainConfig.datasets).filter(([_, v]) => v).map(([k]) => k)
                })
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiModels'] });
            toast.success('New AI Model successfully trained and registered!');
            setIsTrainingModalOpen(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to train new model');
        }
    });

    const handleActivate = (modelId: string) => {
        if (activeModel?.id === modelId) return;
        
        toast((t) => (
            <div>
                <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">Switch Active Model?</p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            toast.dismiss(t.id);
                            const loadingId = toast.loading('Activating model...');
                            activateModelMutation.mutate(modelId, {
                                onSettled: () => toast.dismiss(loadingId)
                            });
                        }}
                        className="px-3 py-1 bg-cyan-500 text-white rounded text-sm hover:bg-cyan-600"
                    >
                        Confirm
                    </button>
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded text-sm hover:bg-slate-300 dark:hover:bg-navy-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const avgAccuracy = models.length > 0 
        ? models.reduce((sum, m) => sum + Number(m.accuracy || 0), 0) / models.length 
        : 0;

    return (
        <>
            <div className="space-y-4">
                {/* Header with Stats */}
                <div className="bg-[#2B4B9E] rounded-2xl px-6 py-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                    <Brain className="w-48 h-48 -mt-12 -mr-12" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-xl drop-shadow-sm">AI Prediction Engine</h2>
                            <p className="text-cyan-100 text-sm opacity-90">Manage predictive routing and ETA models</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center border border-blue-400/20">
                                <Database className="w-5 h-5 text-blue-200" />
                            </div>
                            <div>
                                <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">Models</p>
                                <p className="text-xl font-bold text-white leading-tight">{models.length}</p>
                            </div>
                        </div>
                        
                        <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center border border-green-400/20">
                                <Activity className="w-5 h-5 text-green-200" />
                            </div>
                            <div>
                                <p className="text-xs text-green-200 font-medium uppercase tracking-wider">Active Version</p>
                                <p className="text-xl font-bold text-white leading-tight">{activeModel?.version || 'None'}</p>
                            </div>
                        </div>
                        
                        <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center border border-purple-400/20">
                                <TrendingUp className="w-5 h-5 text-purple-200" />
                            </div>
                            <div>
                                <p className="text-xs text-purple-200 font-medium uppercase tracking-wider">Avg Accuracy</p>
                                <p className="text-xl font-bold text-white leading-tight">{(avgAccuracy * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="pl-4 border-l border-white/20">
                            <button
                                onClick={() => setIsTrainingModalOpen(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-white text-[#2B4B9E] rounded-xl font-bold text-sm hover:bg-cyan-50 transition-colors shadow-lg shadow-black/20"
                            >
                                <Brain className="w-4 h-4" />
                                <span>Config AI Training</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Model Snapshot */}
                <div className="lg:col-span-1 border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Active Deployment</h3>
                        <div className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-center">
                        {activeModel ? (
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg mb-2 shadow-cyan-500/30">
                                    <Brain className="w-10 h-10" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">v{activeModel.version}</h4>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deployed Model</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="bg-slate-50 dark:bg-navy-800 p-3 rounded-xl border border-slate-100 dark:border-navy-700/50">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Accuracy Score</p>
                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{(activeModel.accuracy * 100).toFixed(2)}%</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-navy-800 p-3 rounded-xl border border-slate-100 dark:border-navy-700/50">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Dataset Size</p>
                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{activeModel.datasetSize.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                                    Trained on {new Date(activeModel.trainedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-slate-500 dark:text-slate-400">No active model found. Select from the roster.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Models Roster */}
                <div className="lg:col-span-2 border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-navy-800">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Model Repository</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Available machine learning routing models</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-navy-800/80 border-b border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Version</th>
                                    <th className="px-6 py-4">Accuracy</th>
                                    <th className="px-6 py-4">Parameters</th>
                                    <th className="px-6 py-4">Trained Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">Fetching Models...</p>
                                        </td>
                                    </tr>
                                ) : models.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <Brain className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">No models trained yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    models.map((model) => {
                                        const accuracyPct = model.accuracy * 100;
                                        return (
                                            <tr key={model.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800">
                                                            v
                                                        </div>
                                                        <span className="font-bold text-slate-800 dark:text-slate-100">{model.version}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-16 bg-slate-200 dark:bg-navy-700 rounded-full h-1.5 overflow-hidden flex">
                                                            <div 
                                                                className={`h-full rounded-full ${accuracyPct > 85 ? 'bg-green-500' : accuracyPct > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(100, Math.max(0, accuracyPct))}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{accuracyPct.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-navy-800 px-2 py-1 rounded border border-slate-200 dark:border-navy-700">
                                                        {model.modelParameters ? 'Hyper-Tuned' : 'Default Base'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {new Date(model.trainedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {model.isActive ? (
                                                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-semibold">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            <span>ACTIVE</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-navy-700 text-xs font-semibold">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span>INACTIVE</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleActivate(model.id)}
                                                        disabled={model.isActive || activateModelMutation.isPending}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ml-auto ${
                                                            model.isActive 
                                                            ? 'bg-slate-100 text-slate-400 dark:bg-navy-800 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-navy-700' 
                                                            : 'bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-900/40'
                                                        }`}
                                                    >
                                                        <Power className="w-3.5 h-3.5" />
                                                        <span>{model.isActive ? 'Deployed' : 'Activate Model'}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
        </div>
            
            {/* Modal */}
            {isTrainingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-navy-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Database className="w-5 h-5 text-cyan-500" />
                                Configure Neural Network
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select parameters to extract data and feed into our machine learning pipeline.</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Primary Objective</label>
                                <select 
                                    value={trainConfig.modelType}
                                    onChange={(e) => setTrainConfig({...trainConfig, modelType: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-navy-700 rounded-lg bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-shadow"
                                >
                                    <option value="eta_prediction">Live ETA Estimation Algorithms</option>
                                    <option value="route_optimization">Route Optimization Engine</option>
                                    <option value="predictive_maintenance">Predictive Maintenance Detection</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Historical Lookback Period</label>
                                <select 
                                    value={trainConfig.dateRange}
                                    onChange={(e) => setTrainConfig({...trainConfig, dateRange: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-navy-700 rounded-lg bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-shadow"
                                >
                                    <option value="last_30_days">Previous 30 Days (Fast Training)</option>
                                    <option value="last_6_months">Previous 6 Months (Recommended)</option>
                                    <option value="last_year">Previous 12 Months (Deep Learning)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Include Dataset Sources</label>
                                <div className="space-y-3">
                                    {Object.entries(trainConfig.datasets).map(([key, value]) => (
                                        <label key={key} className="flex items-start space-x-3 cursor-pointer group">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <input 
                                                    type="checkbox" 
                                                    checked={value}
                                                    onChange={(e) => setTrainConfig({
                                                        ...trainConfig,
                                                        datasets: { ...trainConfig.datasets, [key]: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 bg-slate-50 dark:bg-navy-900 border" 
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 uppercase tracking-wider">{key}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-100 dark:border-navy-700 flex justify-end gap-3">
                            <button
                                onClick={() => setIsTrainingModalOpen(false)}
                                className="px-4 py-2 border border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-700 font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => createModelMutation.mutate()}
                                disabled={createModelMutation.isPending}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl shadow-md hover:shadow-lg font-medium text-sm disabled:opacity-50 transition-all flex items-center justify-center min-w-[120px]"
                            >
                                {createModelMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start AI Training'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
