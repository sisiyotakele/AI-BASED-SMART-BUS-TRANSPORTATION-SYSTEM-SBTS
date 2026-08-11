// src/features/driver/components/modals/HandoverModal.tsx

import React from 'react';
import Button from '../Button';

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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Initiate Handover
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-lg sm:text-xl"
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
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-gray-50 dark:bg-gray-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Next Driver *
            </label>
            <input
              type="text"
              value={nextDriver}
              onChange={(e) => setNextDriver(e.target.value)}
              placeholder="Enter next driver's name"
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Vehicle Condition
            </label>
            <select
              value={vehicleCondition}
              onChange={(e) => setVehicleCondition(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow"
            >
              {conditions.map((c) => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any important info for the next driver..."
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow resize-none"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-600 dark:text-blue-400">
            <p>🔑 The next driver must accept this handover at the same location.</p>
            <p>GPS will verify both drivers are at the same location.</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5 sm:mt-6">
          <Button text="Cancel" variant="outline" fullWidth onClick={onClose} />
          <Button text="Initiate Handover" variant="primary" fullWidth onClick={onSubmit} />
        </div>
      </div>
    </div>
  );
};