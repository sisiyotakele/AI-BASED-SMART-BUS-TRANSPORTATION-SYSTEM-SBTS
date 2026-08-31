import React, { useState } from "react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { 
  AlertTriangle, 
  Send, 
  Camera, 
  MapPin, 
  Bus, 
  CheckCircle2, 
  Clock,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type IncidentType = "bus_delayed" | "overcrowding" | "safety" | "other";

export const IncidentReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidentType, setIncidentType] = useState<IncidentType>("bus_delayed");
  const [description, setDescription] = useState("");
  const [routeInfo, setRouteInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mock past reports
  const [pastReports] = useState([
    {
      id: "INC-2026-081",
      type: "Overcrowding",
      route: "Route 12",
      status: "Resolved",
      date: "Aug 10, 2026",
    },
    {
      id: "INC-2026-085",
      type: "Bus Delayed",
      route: "Route 04",
      status: "In Progress",
      date: "Aug 12, 2026",
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setDescription("");
        setRouteInfo("");
      }, 3000);
    }, 1500);
  };

  return (
    <PassengerLayout pageTitle="Report an Issue">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              Report an Issue
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
              Help us improve Sheger Bus by reporting delays, safety concerns, or overcrowding.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-sm sm:text-base font-bold transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              {isSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Report Submitted successfully!</h3>
                  <p className="text-slate-500 max-w-sm">
                    Thank you for your feedback. Our team will review your report and take appropriate action.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Incident Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-extrabold text-slate-800">What is the issue?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIncidentType("bus_delayed")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          incidentType === "bus_delayed" 
                          ? "border-[#2B4B9E] bg-blue-50/50 flex items-center gap-3" 
                          : "border-slate-100 bg-white hover:border-slate-200 flex items-center gap-3 text-slate-500"
                        }`}
                      >
                        <Clock className={`w-5 h-5 ${incidentType === "bus_delayed" ? "text-[#2B4B9E]" : ""}`} />
                        <span className={`font-bold ${incidentType === "bus_delayed" ? "text-[#2B4B9E]" : ""}`}>Bus hasn't arrived</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIncidentType("overcrowding")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          incidentType === "overcrowding" 
                          ? "border-amber-500 bg-amber-50/50 flex items-center gap-3" 
                          : "border-slate-100 bg-white hover:border-slate-200 flex items-center gap-3 text-slate-500"
                        }`}
                      >
                        <Bus className={`w-5 h-5 ${incidentType === "overcrowding" ? "text-amber-600" : ""}`} />
                        <span className={`font-bold ${incidentType === "overcrowding" ? "text-amber-700" : ""}`}>Severe Overcrowding</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIncidentType("safety")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          incidentType === "safety" 
                          ? "border-rose-500 bg-rose-50/50 flex items-center gap-3" 
                          : "border-slate-100 bg-white hover:border-slate-200 flex items-center gap-3 text-slate-500"
                        }`}
                      >
                        <AlertTriangle className={`w-5 h-5 ${incidentType === "safety" ? "text-rose-600" : ""}`} />
                        <span className={`font-bold ${incidentType === "safety" ? "text-rose-700" : ""}`}>Safety Concern</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIncidentType("other")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          incidentType === "other" 
                          ? "border-slate-800 bg-slate-50 flex items-center gap-3" 
                          : "border-slate-100 bg-white hover:border-slate-200 flex items-center gap-3 text-slate-500"
                        }`}
                      >
                        <MapPin className={`w-5 h-5 ${incidentType === "other" ? "text-slate-800" : ""}`} />
                        <span className={`font-bold ${incidentType === "other" ? "text-slate-800" : ""}`}>Station/Other Issue</span>
                      </button>
                    </div>
                  </div>

                  {/* Route/Stop Info */}
                  <div className="space-y-2">
                    <label className="text-sm font-extrabold text-slate-800 flex items-center justify-between">
                      <span>Route or Stop (Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Route 12 or Mexico Stop"
                      value={routeInfo}
                      onChange={(e) => setRouteInfo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-3 text-slate-800 focus:outline-[#2B4B9E] transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-extrabold text-slate-800">Description</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please provide details about what happened..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-3 text-slate-800 focus:outline-[#2B4B9E] transition-all resize-none"
                    />
                  </div>

                  {/* Photo Attachment (Mock) */}
                  <div className="space-y-2">
                    <label className="text-sm font-extrabold text-slate-800">Attach Photo (Optional)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer">
                      <Camera className="w-8 h-8 mb-2 text-slate-400" />
                      <p className="text-sm font-bold text-slate-600">Tap to upload or take a photo</p>
                      <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="w-full sm:w-auto text-white text-sm sm:text-base font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 hover:shadow-lg"
                    style={{ backgroundColor: "#2B4B9E" }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><Clock className="w-5 h-5 animate-spin" /> Submitting...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="w-5 h-5" /> Submit Report</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar / Track Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-[#1B2A4A] to-[#283863] rounded-2xl p-6 text-white shadow-md">
              <h3 className="font-extrabold text-lg flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Emergency?
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                For severe medical emergencies or accidents, please contact the authorities immediately.
              </p>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-all text-white">
                Call Emergency Line: 991
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4">Past Reports</h3>
              <div className="space-y-3">
                {pastReports.map(report => (
                  <div key={report.id} className="p-3 border border-slate-100 bg-slate-50 rounded-xl transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">{report.type}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        report.status === "Resolved" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{report.route}</span>
                      <span>{report.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </PassengerLayout>
  );
};

export default IncidentReportPage;
