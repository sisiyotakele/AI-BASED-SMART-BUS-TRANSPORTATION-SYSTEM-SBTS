import { X, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Bus, User, RouteSchedule } from '@/types';

interface CreateTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (tripData: any) => void;
    buses: Bus[];
    drivers: User[];
    schedules: RouteSchedule[];
}

export function CreateTripModal({ isOpen, onClose, onSubmit, buses, drivers, schedules }: CreateTripModalProps) {
    const [formData, setFormData] = useState({
        busId: '',
        driverId: '',
        scheduleId: '',
        scheduledStart: '',
        scheduledEnd: '',
        notes: '',
    });

    if (!isOpen) return null;

    const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sid = e.target.value;
        const selectedSchedule = schedules.find(s => s.id === sid);
        
        let startStr = formData.scheduledStart;
        let endStr = formData.scheduledEnd;

        if (selectedSchedule && selectedSchedule.departureTime) {
            let timeString = selectedSchedule.departureTime;
            
            // Extract HH:mm from ISO
            if (timeString.includes('T')) {
                const date = new Date(timeString);
                timeString = `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
            } else if (timeString.includes(':')) {
                timeString = timeString.substring(0, 5); 
            } else {
                timeString = "08:00"; 
            }
            
            // Map to today's date in local time
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            
            startStr = `${todayStr}T${timeString}`;
            
            // Estimate ending time 2 hours later
            const startObj = new Date(startStr);
            startObj.setHours(startObj.getHours() + 2);
            endStr = `${startObj.getFullYear()}-${(startObj.getMonth()+1).toString().padStart(2, '0')}-${startObj.getDate().toString().padStart(2, '0')}T${startObj.getHours().toString().padStart(2, '0')}:${startObj.getMinutes().toString().padStart(2, '0')}`;
        }

        setFormData({
            ...formData,
            scheduleId: sid,
            scheduledStart: startStr,
            scheduledEnd: endStr
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Construct standard ISO strings for datetime
        // Normally this would combine start day + time from schedule, but we mock it here or require full datetime input
        const selectedSchedule = schedules.find(s => s.id === formData.scheduleId);
        onSubmit({
            ...formData,
            versionId: selectedSchedule?.versionId || '123e4567-e89b-12d3-a456-426614174000'
        });
        
        // Reset and close
        setFormData({
            busId: '',
            driverId: '',
            scheduleId: '',
            scheduledStart: '',
            scheduledEnd: '',
            notes: '',
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-navy-700">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-navy-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Create Trip Dispatch</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Schedule a new journey</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Base Schedule <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.scheduleId}
                                onChange={handleScheduleChange}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                required
                            >
                                <option value="">Select Schedule...</option>
                                {schedules.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.scheduleName} ({s.route?.routeName || 'Unknown Route'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Assigned Bus <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.busId}
                                onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                required
                            >
                                <option value="">Select Fleet Vehicle...</option>
                                {buses.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.plateNumber} ({b.model})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Assigned Driver <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.driverId}
                                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                required
                            >
                                <option value="">Select Driver...</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.fullName} (ID: {d.id.substring(0,6)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                                <span>Scheduled Start <span className="text-red-500">*</span></span>
                                <span className="text-xs text-cyan-600 font-normal">Auto-filled</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.scheduledStart}
                                onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                                <span>Scheduled End <span className="text-red-500">*</span></span>
                                <span className="text-xs text-cyan-600 font-normal">Estimated</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.scheduledEnd}
                                onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Trip notes (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="e.g. VIP Transport, Expressway only"
                            rows={3}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-navy-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm"
                        >
                            Schedule Trip
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
