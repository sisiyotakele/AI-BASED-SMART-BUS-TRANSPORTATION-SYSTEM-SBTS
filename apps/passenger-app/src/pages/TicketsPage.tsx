// src/pages/TicketsPage.tsx
import React from "react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { Ticket, QrCode, Calendar, ArrowRight, Download } from "lucide-react";

export const TicketsPage: React.FC = () => {
  return (
    <PassengerLayout pageTitle="My Trips & Tickets">
      {/* Active Digital Bus Pass */}
      <div className="bg-gradient-to-r from-[#1B2A4A] to-[#283863] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Active Pass
            </span>
            <h2 className="text-xl font-bold">Route 12 Express Boarding Pass</h2>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Megenagna</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span>Bole Airport</span>
            </div>
            <div className="pt-2 text-xs text-slate-400 font-mono">
              Pass ID: <strong className="text-white">SBTS-QR-994821</strong>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl shrink-0 shadow-lg flex flex-col items-center">
            <QrCode className="w-28 h-28 text-slate-900" />
            <span className="text-[10px] font-bold text-slate-600 mt-1">Scan at Bus Entrance</span>
          </div>
        </div>
      </div>

      {/* Booked Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm">Upcoming Travel Pass Reservations</h3>
          <button className="text-xs text-indigo-600 font-bold hover:underline">Book New Ticket</button>
        </div>

        <div className="space-y-3">
          {[
            { id: "TCK-102", route: "Megenagna → Bole", date: "Jul 24, 2026", time: "08:30 AM", status: "Confirmed", fare: "15.00 ETB" },
            { id: "TCK-103", route: "Bole → CMC", date: "Jul 25, 2026", time: "05:15 PM", status: "Confirmed", fare: "15.00 ETB" },
          ].map((ticket) => (
            <div key={ticket.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{ticket.route}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3 inline" />
                    {ticket.date} • {ticket.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-extrabold text-slate-800">{ticket.fare}</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                  {ticket.status}
                </span>
                <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 bg-white cursor-pointer">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PassengerLayout>
  );
};

export default TicketsPage;