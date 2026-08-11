// src/features/driver/components/modals/IncidentModal.tsx

import React from 'react';
import Button from '../Button';
import { IncidentReport } from '../../types';

interface IncidentModalBaseProps {
  onClose: () => void;
}

interface IncidentReportModalProps extends IncidentModalBaseProps {
  isOpen: boolean;
  onSubmit: () => void;
  reason: string;
  setReason: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  location: string;
  reasons: string[];
  incident?: undefined;
  onUpdateStatus?: undefined;
}

interface IncidentDetailModalProps extends IncidentModalBaseProps {
  incident: IncidentReport | null;
  onUpdateStatus: (id: number, newStatus: IncidentReport['status']) => void;
  isOpen?: boolean;
  onSubmit?: undefined;
  reason?: undefined;
  setReason?: undefined;
  message?: undefined;
  setMessage?: undefined;
  location?: undefined;
  reasons?: undefined;
}

type IncidentModalProps = IncidentReportModalProps | IncidentDetailModalProps;

export const IncidentModal: React.FC<IncidentModalProps> = (props) => {
  const isDetailMode = 'incident' in props;

  if (isDetailMode) {
    const { incident, onClose, onUpdateStatus } = props;
    if (!incident) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Incident Details</h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-lg sm:text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/60">
              <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{incident.type}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/60">
              <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{incident.description}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/60">
              <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{incident.location}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/60">
              <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{incident.time}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <select
                value={incident.status}
                onChange={(e) => onUpdateStatus(incident.id, e.target.value as IncidentReport['status'])}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow"
              >
                <option value="Reported">Reported</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-5 sm:mt-6">
            <Button text="Close" variant="outline" fullWidth onClick={onClose} />
          </div>
        </div>
      </div>
    );
  }

  const {
    isOpen,
    onClose,
    onSubmit,
    reason,
    setReason,
    message,
    setMessage,
    location,
    reasons,
  } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Report Incident</h3>
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
              Incident Type
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow"
            >
              <option value="">Select a reason</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what happened..."
              rows={4}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow resize-none"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400">
            <p>📍 GPS: {location}</p>
            <p>🕐 Time: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5 sm:mt-6">
          <Button text="Cancel" variant="outline" fullWidth onClick={onClose} />
          <Button text="Submit" variant="primary" fullWidth onClick={onSubmit} />
        </div>
      </div>
    </div>
  );
};