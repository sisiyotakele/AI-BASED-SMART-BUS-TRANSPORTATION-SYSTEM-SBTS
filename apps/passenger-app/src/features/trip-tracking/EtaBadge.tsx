import React from "react";
import { Clock } from "lucide-react";

interface EtaBadgeProps {
  minutes: number;
}

export const EtaBadge: React.FC<EtaBadgeProps> = ({ minutes }) => {
  const isImminent = minutes <= 3;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
        isImminent
          ? "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse"
          : "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      <Clock className="w-3 h-3" />
      {isImminent ? "Arriving Soon" : `${minutes} min ETA`}
    </span>
  );
};