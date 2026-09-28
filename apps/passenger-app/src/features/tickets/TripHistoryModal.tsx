// src/features/tickets/TripHistoryModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Bus, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { tripsApi } from '@/lib/api';
import { normalizeTripHistoryItem, NormalizedTripHistoryItem } from '@/lib/liveData';

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ isOpen, onClose }) => {
  const [trips, setTrips] = useState<NormalizedTripHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tripsApi.getTrips();
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const normalized = res.data.data.map((t: Record<string, unknown>) => normalizeTripHistoryItem(t));
        setTrips(normalized);
      } else {
        setTrips([]);
      }
    } catch (err: any) {
      console.warn('Could not fetch trip history:', err);
      setError('Could not load trips from server.');
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrips();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 transition-all">
      {/* Modal Popup Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Trip History</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Your recent bus rides & fares</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTrips}
              disabled={isLoading}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold">Loading trips...</span>
            </div>
          ) : error && trips.length === 0 ? (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-100 bg-rose-50/70 text-xs text-rose-600">
              {error}
            </div>
          ) : trips.length === 0 ? (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/70 text-xs text-slate-500 text-center py-8">
              No recent trips found on your account.
            </div>
          ) : (
            trips.map((trip) => {
              const routeParts = trip.route.split('→').map((s) => s.trim());
              const fromStop = routeParts[0] || 'Start Terminal';
              const toStop = routeParts[1] || 'Destination';

              return (
                <div
                  key={trip.id}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 text-[11px] sm:text-xs">{trip.date}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] sm:text-[11px] font-bold ${
                        trip.status === 'Completed' || trip.status === 'In_progress'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}
                    >
                      {trip.status === 'Completed' || trip.status === 'In_progress' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {trip.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Bus className="w-4 h-4 text-indigo-600 shrink-0" />
                      {trip.bus}
                    </span>
                    <span className="text-indigo-900 font-extrabold">{trip.fare}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-0.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{fromStop}</span>
                    <span className="text-slate-300">→</span>
                    <span className="truncate">{toStop}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};