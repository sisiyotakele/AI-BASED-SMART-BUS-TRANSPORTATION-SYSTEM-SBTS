// src/features/tickets/TripHistoryModal.tsx
import React from 'react';
import { X, Clock, MapPin, Bus, CheckCircle2, AlertCircle } from 'lucide-react';

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_HISTORY = [
  {
    id: 'tx-101',
    date: 'Today, 2:15 PM',
    from: 'Megenagna Terminal',
    to: 'Bole Brass',
    busNumber: 'Route 12 Express',
    fare: '15.00 ETB',
    status: 'Completed',
  },
  {
    id: 'tx-102',
    date: 'Yesterday, 8:40 AM',
    from: 'Alem Gena',
    to: 'Mexico Square',
    busNumber: 'Route 34',
    fare: '10.00 ETB',
    status: 'Completed',
  },
  {
    id: 'tx-103',
    date: '24 Jul 2026, 5:10 PM',
    from: 'CMC Square',
    to: 'Stadium',
    busNumber: 'Route 08',
    fare: '12.00 ETB',
    status: 'Cancelled',
  },
];

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ isOpen, onClose }) => {
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
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {MOCK_HISTORY.map((trip) => (
            <div
              key={trip.id}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400 text-[11px] sm:text-xs">{trip.date}</span>
                <span
                  className={`px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] sm:text-[11px] font-bold ${
                    trip.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  {trip.status === 'Completed' ? (
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
                  {trip.busNumber}
                </span>
                <span className="text-indigo-900 font-extrabold">{trip.fare}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{trip.from}</span>
                <span className="text-slate-300">→</span>
                <span className="truncate">{trip.to}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};