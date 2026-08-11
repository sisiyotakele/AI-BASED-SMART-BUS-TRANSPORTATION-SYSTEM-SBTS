// src/features/driver/components/incident/IncidentForm.tsx

import React from 'react';
import { FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../Button';

interface IncidentFormProps {
  type: string;
  setType: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  location: string;
  onSubmit: () => void;
  error: string;
  types: string[];
}

export const IncidentForm: React.FC<IncidentFormProps> = ({
  type,
  setType,
  description,
  setDescription,
  location,
  onSubmit,
  error,
  types,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
        <span>📝</span> Report Incident
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Incident Type <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow"
          >
            <option value="">Select incident type</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Location <span className="text-red-500">*</span>
          </label>
          <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 font-mono">
            {location || "Fetching GPS..."}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="Describe the issue in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow resize-none"
        />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <FaExclamationTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        className="w-full mt-4 py-3 bg-[#12B2E4] hover:bg-[#0e9ed4] text-white font-semibold rounded-xl transition-all shadow-md shadow-[#12B2E4]/20 hover:shadow-lg flex items-center justify-center gap-2 touch-manipulation"
      >
        <FaCheck className="w-4 h-4" />
        Submit Report
      </button>
    </div>
  );
};