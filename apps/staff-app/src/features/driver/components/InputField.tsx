// src/features/driver/components/InputField.tsx

import type { ReactNode } from "react";

// ================================================================
// TYPES
// ================================================================

interface InputFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: ReactNode;
  error?: boolean | string;
  required?: boolean;
  disabled?: boolean;
}

// ================================================================
// INPUT FIELD COMPONENT
// ================================================================

const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  error,
  required = false,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col">
      {/* ─── Label ──────────────────────────────────────────────── */}
      <label
        htmlFor={name}
        className="mb-1 text-sm font-semibold text-gray-600"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {/* ─── Input Wrapper ──────────────────────────────────────── */}
      <div
        className={`
          flex items-center gap-2 p-3 rounded-lg border outline-none 
          transition-all duration-300
          ${
            error
              ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200"
              : "border-gray-300 hover:border-blue-600 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200"
          }
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {/* ─── Icon ──────────────────────────────────────────────── */}
        {icon && (
          <span className="flex-shrink-0 text-gray-400">
            {icon}
          </span>
        )}

        {/* ─── Input ─────────────────────────────────────────────── */}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            flex-1 bg-transparent text-sm outline-none 
            text-gray-800
            placeholder-gray-400
            ${disabled ? "cursor-not-allowed" : ""}
          `}
        />
      </div>

      {/* ─── Error Message ──────────────────────────────────────── */}
      {error && (
        <span className="mt-1 text-sm text-red-500">
          {typeof error === "string" ? error : "This field is required"}
        </span>
      )}
    </div>
  );
};

export default InputField;