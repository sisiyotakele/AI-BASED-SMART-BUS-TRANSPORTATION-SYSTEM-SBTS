// src/features/driver/components/modals/HandoverModal.tsx

import React from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  currentDriver: string;
  nextDriver: string;
  setNextDriver: (value: string) => void;
  vehicleCondition: string;
  setVehicleCondition: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  conditions: string[];
  loading?: boolean; // ← ADD THIS LINE
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentDriver,
  nextDriver,
  setNextDriver,
  vehicleCondition,
  setVehicleCondition,
  notes,
  setNotes,
  conditions,
  loading = false, // ← ADD THIS LINE
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Shift Handover</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Current Driver
            </label>
            <input
              type="text"
              value={currentDriver}
              disabled
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Next Driver Name *
            </label>
            <input
              type="text"
              value={nextDriver}
              onChange={(e) => setNextDriver(e.target.value)}
              placeholder="Enter next driver's name"
              disabled={loading}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Vehicle Condition
            </label>
            <select
              value={vehicleCondition}
              onChange={(e) => setVehicleCondition(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition.charAt(0).toUpperCase() + condition.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Handover Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any important information for the next driver..."
              rows={3}
              disabled={loading}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400">
            <p>📅 Handover Time: {new Date().toLocaleString()}</p>
            <p>⚠️ Please ensure all items are transferred properly</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 py-3 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Complete Handover'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};