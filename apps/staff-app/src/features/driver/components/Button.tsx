// src/features/driver/components/Button.tsx

import React from "react";

interface ButtonProps {
  text: string;
  type?: "button" | "submit" | "reset";
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "outlineDanger"
    | "ghost"
    | "danger"
    | "success"
    | "accent"
    | "warning";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  text,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  onClick,
  className = "",
  icon,
}) => {
  const variants = {
    primary: "bg-[#12B2E4] hover:bg-[#0e9ed4] text-white border border-transparent",
    secondary: "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-transparent",
    outline: "bg-white dark:bg-gray-800 hover:bg-[#12B2E4]/5 dark:hover:bg-[#12B2E4]/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-[#12B2E4]",
    outlineDanger: "bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800",
    ghost: "bg-transparent hover:text-gray-800 dark:hover:text-white text-gray-600 dark:text-gray-400 border border-transparent",
    danger: "bg-red-500 hover:bg-red-600 text-white border border-transparent",
    success: "bg-green-500 hover:bg-green-600 text-white border border-transparent",
    accent: "bg-[#2B4B9E] hover:bg-[#1f3a7a] text-white border border-transparent",
    warning: "bg-amber-500 hover:bg-amber-600 text-white border border-transparent",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-3 gap-2",
  };

  const disabledStyles =
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-none";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        rounded-lg font-medium transition-colors duration-200
        whitespace-nowrap touch-manipulation
        ${fullWidth ? "w-full" : ""}
        ${variants[variant]}
        ${sizes[size]}
        ${disabledStyles}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {text}
    </button>
  );
};

export default Button;