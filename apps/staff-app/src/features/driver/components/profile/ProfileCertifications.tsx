// src/features/driver/components/profile/ProfileCertifications.tsx

import React from 'react';
import { FaCertificate } from 'react-icons/fa';

interface Certification {
  name: string;
  date: string;
  status: "Completed" | "In Progress" | "Expired";
}

interface ProfileCertificationsProps {
  certifications?: Certification[];
}

const DEFAULT_CERTIFICATIONS: Certification[] = [
  { name: "Professional driver training", date: "Completed 2025", status: "Completed" },
  { name: "Road safety certification", date: "Completed 2025", status: "Completed" },
];

export const ProfileCertifications: React.FC<ProfileCertificationsProps> = ({
  certifications = DEFAULT_CERTIFICATIONS,
}) => {
  return (
    <div className="p-6 mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <h2 className="flex items-center gap-2 mb-4 text-base font-bold text-gray-800 dark:text-white">
        <FaCertificate className="text-amber-600" />
        Certifications
      </h2>

      <div className="space-y-2">
        {certifications.map((cert, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{cert.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cert.date}</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full shrink-0 ${
              cert.status === "Completed" 
                ? "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30" 
                : cert.status === "In Progress"
                ? "text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30"
                : "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
            }`}>
              {cert.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};