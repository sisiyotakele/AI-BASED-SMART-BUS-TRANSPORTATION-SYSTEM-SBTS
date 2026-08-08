// src/features/dashboard/AiTrafficAndQuickActions.tsx
import React from "react";
import { Sparkles, Clock, TrendingUp } from "lucide-react";

export const AiTrafficAndQuickActions: React.FC = () => {
  return (
    <div className="w-full">
      {/* 1. AI TRAFFIC PREDICTION CARD ONLY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          {/* Card Title Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                AI Traffic & Delay Prediction
              </h3>
            </div>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
              AI Powered
            </span>
          </div>

          {/* Main Traffic Metrics */}
          <div className="flex items-center gap-5 my-3">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500"
                  strokeDasharray="65, 100"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-base font-extrabold text-slate-900 leading-none">65%</span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5">load</span>
              </div>
            </div>

            <div>
              <div className="text-xl font-black text-amber-600 flex items-center gap-2">
                Moderate Traffic
              </div>
              <p className="text-xs text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 inline" />
                +8 min estimated delay on Route 12
              </p>
              
              <div className="mt-2 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-4">
                  <span>Recommended Speed: <strong className="text-slate-700">35–45 km/h</strong></span>
                  <span>AI Confidence: <strong className="text-slate-700">91%</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Traffic Bar Graph Simulation */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-end justify-between h-14 gap-1.5 px-2">
              {[30, 50, 75, 90, 60, 40, 35, 55, 70, 85].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full rounded-xs transition-all ${
                      height > 75 ? "bg-amber-500" : "bg-indigo-200"
                    }`} 
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-[9px] text-slate-400">{i + 6}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Suggested Alternate Route Box */}
        <div className="mt-4 bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Suggested Alternate Route:</strong> Via Sarbet bypass — saves ~6 min.
            </span>
          </div>
          <span className="font-bold text-amber-700 text-[11px] whitespace-nowrap ml-2">
            89% confidence
          </span>
        </div>
      </div>
    </div>
  );
};

export default AiTrafficAndQuickActions;