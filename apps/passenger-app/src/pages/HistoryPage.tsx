// src/pages/HistoryPage.tsx
import React from "react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { History, CheckCircle2, MapPin, Calendar, CreditCard } from "lucide-react";

export const HistoryPage: React.FC = () => {
  const tripHistory = [
    { id: "TRP-882", date: "Jul 23, 2026", route: "Megenagna → Edna Mall", bus: "SBTS-BUS-114", fare: "12.00 ETB", status: "Completed" },
    { id: "TRP-881", date: "Jul 22, 2026", route: "CMC → Mexico", bus: "SBTS-BUS-092", fare: "18.00 ETB", status: "Completed" },
    { id: "TRP-880", date: "Jul 20, 2026", route: "Bole Atlas → Stadium", bus: "SBTS-BUS-044", fare: "15.00 ETB", status: "Completed" },
    { id: "TRP-879", date: "Jul 18, 2026", route: "Tor Hailoch → Megenagna", bus: "SBTS-BUS-114", fare: "20.00 ETB", status: "Completed" },
  ];

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
          <span className="text-xs font-semibold text-slate-500">Total Trips: {tripHistory.length}</span>
        </div>

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
      </div>
    </PassengerLayout>
  );
};

export default HistoryPage;