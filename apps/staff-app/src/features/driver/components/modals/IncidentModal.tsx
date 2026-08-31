// src/features/driver/components/modals/IncidentModal.tsx

import React from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';

interface Incident {
  id: number;
  type: string;
  description: string;
  location: string;
  time: string;
  status: "Reported" | "In Progress" | "Resolved";
}

interface IncidentModalProps {
  isOpen: boolean;
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (id: number, status: "Reported" | "In Progress" | "Resolved") => void;
  loading?: boolean;
}

const STATUS_OPTIONS = ["Reported", "In Progress", "Resolved"];

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  incident,
  onClose,
  onUpdateStatus,
  loading = false,
}) => {
  if (!isOpen || !incident) return null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(incident.id, e.target.value as "Reported" | "In Progress" | "Resolved");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Incident Details
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              #{incident.id.toString().slice(-6)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Type</label>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{incident.type}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Description</label>
            <p className="text-sm text-gray-700 dark:text-gray-300">{incident.description}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Location</label>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{incident.location}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Reported Time</label>
            <p className="text-sm text-gray-600 dark:text-gray-400">{incident.time}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status</label>
            <div className="mt-1">
              <select
                value={incident.status}
                onChange={handleStatusChange}
                disabled={loading}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {loading && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Updating status...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentModal;