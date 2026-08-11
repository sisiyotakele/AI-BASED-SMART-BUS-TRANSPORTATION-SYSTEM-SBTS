// src/features/driver/components/ToggleSwitch.tsx

import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label className={`relative inline-block w-10 h-5 sm:w-12 sm:h-6 flex-shrink-0 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="opacity-0 w-0 h-0 absolute"
      />
      <span
        className={`
          absolute inset-0 rounded-full transition-all duration-300 ease-in-out
          ${checked 
            ? "bg-[#12B2E4]" 
            : "bg-gray-300 dark:bg-gray-600"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span
          className={`
            absolute h-4 w-4 sm:h-5 sm:w-5 left-0.5 top-0.5 bg-white rounded-full 
            transition-all duration-300 ease-in-out shadow-md
            ${checked ? "translate-x-[18px] sm:translate-x-6" : "translate-x-0"}
          `}
        />
      </span>
    </label>
  );
};

export default ToggleSwitch;