// src/pages/HistoryPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { History, CheckCircle2, MapPin, Calendar, RefreshCw } from "lucide-react";
import { tripsApi, BackendTrip } from "@/lib/api";
import { normalizeTripHistoryItem } from "@/lib/liveData";

interface HistoryItem {
  id: string;
  date: string;
  route: string;
  bus: string;
  fare: string;
  status: string;
}


export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [tripHistory, setTripHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isGuestMode = !localStorage.getItem("token");

  const fetchCompletedTrips = useCallback(async () => {
    if (isGuestMode) {
      setTripHistory([]);
      setIsLoading(false);
      return;
    }

    setIsRefreshing(true);
    try {
      const res = await tripsApi.getTrips({ status: "completed" });
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        const fetched: HistoryItem[] = res.data.data.map((t: BackendTrip) => normalizeTripHistoryItem(t as unknown as Record<string, unknown>));
        setTripHistory(fetched);
      } else {
        setTripHistory([]);
      }
    } catch (err) {
      console.warn("Could not fetch completed trips from backend API:", err);
      setTripHistory([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isGuestMode]);

  useEffect(() => {
    fetchCompletedTrips();
  }, [fetchCompletedTrips]);

  return (
    <PassengerLayout pageTitle="Travel History">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Completed Trips</h3>
              <p className="text-xs text-slate-400">View past journeys and transaction fares</p>
            </div>
          </div>
          {!isGuestMode && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Total Trips: {tripHistory.length}</span>
              <button
                onClick={fetchCompletedTrips}
                disabled={isRefreshing}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Travel History"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
        </div>

        {isGuestMode ? (
          <div className="py-10 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Guest Mode Active — No Saved History</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are currently browsing as a guest. Personal travel history, ticket receipts, and frequent route logs are only saved for registered passenger accounts.
              </p>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 bg-[#2B4B9E] hover:bg-[#1f3879] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              Sign In to Track Travel History
            </button>
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold animate-pulse">
            Loading completed travel history...
          </div>
        ) : tripHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-semibold">
            No completed trips recorded for your account yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tripHistory.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.route}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.bus}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-800 block">{item.fare}</span>
                  <span className="text-[10px] font-bold text-emerald-600">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PassengerLayout>
  );
};

export default HistoryPage;
