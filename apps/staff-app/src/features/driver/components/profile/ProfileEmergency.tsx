// src/features/driver/components/profile/ProfileEmergency.tsx

import React from 'react';
import { FaPhoneAlt } from 'react-icons/fa';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

interface ProfileEmergencyProps {
  contact?: EmergencyContact;
}

const DEFAULT_CONTACT: EmergencyContact = {
  name: "Family contact",
  relationship: "Wife",
  phone: "+251 987030010",
  isPrimary: true,
};

export const ProfileEmergency: React.FC<ProfileEmergencyProps> = ({
  contact = DEFAULT_CONTACT,
}) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <h2 className="flex items-center gap-2 mb-4 text-base font-bold text-gray-800 dark:text-white">
        <FaPhoneAlt className="text-red-600" />
        Emergency contact
      </h2>

      <div className="flex items-center gap-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-center justify-center w-10 h-10 text-white bg-orange-500 rounded-full shrink-0">
          <FaPhoneAlt className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{contact.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Relationship: {contact.relationship}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone}</p>
        </div>
        {contact.isPrimary && (
          <span className="px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full shrink-0">
            Primary
          </span>
        )}
      </div>
    </div>
  );
};