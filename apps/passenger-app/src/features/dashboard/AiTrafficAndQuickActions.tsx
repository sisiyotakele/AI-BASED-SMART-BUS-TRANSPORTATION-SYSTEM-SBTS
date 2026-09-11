// src/features/dashboard/AiTrafficAndQuickActions.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Clock, RefreshCw } from "lucide-react";
import { aiIntegrationApi, AiCombinedPrediction } from "@/lib/api";

export const AiTrafficAndQuickActions: React.FC = () => {
  const [prediction, setPrediction] = useState<AiCombinedPrediction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTrafficPrediction = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await aiIntegrationApi.predictCombined({
        origin_lat: 9.0215, // Megenagna Station
        origin_lon: 38.7989,
        dest_lat: 9.0125,   // Tor Hailoch
        dest_lon: 38.7230,
        direction: "Forward",
        timestamp: new Date().toISOString(),
      });
      const raw = res.data?.data || res.data;
      if (raw) {
        setPrediction({
          congestion_level: String(raw.traffic_level),
          estimated_duration_minutes: Number(raw.estimated_duration_minutes),
          estimated_arrival: String(raw.estimated_arrival),
          confidence_score: Number(raw.traffic_confidence) * 100,
        });
      }
    } catch (err) {
      setPrediction(null);
      console.warn("Could not fetch live AI traffic predictions from backend, using current telemetry model:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrafficPrediction();
  }, [fetchTrafficPrediction]);

  return (
    <div className="w-full">
      {/* 1. AI TRAFFIC PREDICTION CARD ONLY */}
      <div
        className="rounded-2xl border border-[#325B96] p-5 shadow-md flex flex-col justify-between"
        style={{ background: "linear-gradient(180deg, #1C3D6E 0%, #16325C 100%)" }}
      >
        <div>
          {/* Card Title Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(56,189,248,0.15)" }}>
                <Sparkles className="w-4 h-4" style={{ color: "#38BDF8" }} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#7DD3FC" }}>
                AI Traffic & Delay Prediction
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchTrafficPrediction}
                disabled={isLoading}
                className="p-1 rounded-lg hover:bg-white/10 text-blue-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Re-run AI ML Prediction"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(56,189,248,0.15)", color: "#7DD3FC", border: "1px solid rgba(56,189,248,0.3)" }}>
                AI Powered
              </span>
            </div>
          </div>

          <div className="my-3 text-white">
            {prediction ? (
              <>
                <div className="text-xl font-black capitalize">{prediction.congestion_level}</div>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#7DD3FC]">
                  <Clock className="h-3.5 w-3.5" />
                  Estimated duration: {prediction.estimated_duration_minutes} minutes
                </p>
                <p className="mt-2 text-xs text-blue-100">
                  Arrival: {new Date(prediction.estimated_arrival || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  <span className="ml-4">Confidence: {Math.round(prediction.confidence_score || 0)}%</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-blue-100">Prediction unavailable</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTrafficAndQuickActions;
