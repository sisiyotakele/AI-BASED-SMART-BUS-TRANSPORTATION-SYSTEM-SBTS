// src/pages/LandingPage.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bus, 
  MapPin, 
  QrCode, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Zap, 
  Users, 
  CheckCircle2,
  Navigation
} from "lucide-react";
import shegerlogo from "../assets/sheger-logo.jpg";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-sky-500 selection:text-white flex flex-col">
      
      {/* 1. PUBLIC LANDING HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 p-0.5 border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden">
            <img src={shegerlogo} alt="Sheger Bus Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">Sheger Bus</h1>
            <p className="text-[11px] text-slate-400 font-semibold -mt-0.5">Smart Transit System</p>
          </div>
        </Link>

        {/* Navigation Links & Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => {
              localStorage.setItem("isGuest", "true");
              localStorage.removeItem("token");
              navigate("/dashboard");
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <span>Guest Mode</span>
          </button>

          <Link 
            to="/trip" 
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1B2A4A] transition-colors px-2.5 py-1.5"
          >
            <MapPin className="w-4 h-4 text-sky-500" />
            <span>Explore Routes</span>
          </Link>
          
          <Link 
            to="/login"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#1B2A4A] hover:bg-slate-100 rounded-xl transition-all"
          >
            Sign In
          </Link>

          <Link 
            to="/register"
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#1B2A4A] hover:bg-[#111C33] rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
          >
            <span>Sign Up</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        
        {/* 2. HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-8 max-w-7xl mx-auto">
          {/* Subtle Background Accent Blurs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-200/40 via-indigo-100/30 to-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-600 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Next-Gen Smart Transit for Addis Ababa</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight">
                Ride Smarter with <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#1B2A4A] via-sky-600 to-[#1B2A4A] bg-clip-text text-transparent">
                  Real-Time Sheger Bus
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Track live bus GPS locations, predict peak congestion with AI, and book cashless digital boarding passes effortlessly across Addis Ababa corridors.
              </p>

              {/* Hero Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => {
                    localStorage.setItem("isGuest", "true");
                    localStorage.removeItem("token");
                    navigate("/dashboard");
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#1B2A4A] hover:bg-[#111C33] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-base"
                >
                  <span>Continue as Guest</span>
                  <ArrowRight className="w-5 h-5 text-sky-400" />
                </button>

                <button
                  onClick={() => navigate("/trip")}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300/80 font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 text-base shadow-xs"
                >
                  <Navigation className="w-4 h-4 text-sky-500" />
                  <span>Explore Routes</span>
                </button>
              </div>

              {/* Quick Trust Badges */}
              <div className="pt-6 border-t border-slate-200/60 grid grid-cols-3 gap-4 text-center lg:text-left max-w-md mx-auto lg:mx-0">
                <div>
                  <h4 className="text-2xl font-black text-[#1B2A4A]">120+</h4>
                  <p className="text-xs text-slate-500 font-medium">Active Sheger Buses</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-sky-600">98%</h4>
                  <p className="text-xs text-slate-500 font-medium">On-Time Accuracy</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-emerald-600">250k+</h4>
                  <p className="text-xs text-slate-500 font-medium">Daily Commutes</p>
                </div>
              </div>

            </div>

            {/* Right Hero Visual Feature Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xl space-y-5">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Telemetry</span>
                </div>

                {/* Simulated Bus Telemetry Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                        <Bus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Route 12 Express</h4>
                        <p className="text-xs text-slate-500">Megenagna → Bole Airport</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      ETA 4 min
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>CMC Stop</span>
                      <span className="font-bold text-sky-600">82% on path</span>
                      <span>Bole Airport</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#1B2A4A] h-2 rounded-full w-[82%] transition-all duration-500" />
                    </div>
                  </div>
                </div>

                {/* Simulated AI Traffic Warning Card */}
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">AI Congestion Alert</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Light congestion near Megenagna round-about. Recommending Route 04 shortcut.
                    </p>
                  </div>
                </div>

                {/* Simulated QR Pass */}
                <div className="p-4 bg-[#1B2A4A] text-white rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-sky-300">Digital Boarding Pass</span>
                    <p className="font-extrabold text-sm">PASS-SBTS-9948</p>
                    <p className="text-xs text-slate-300">Valid for 1 Ride (15 ETB)</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl text-slate-900">
                    <QrCode className="w-8 h-8" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* 3. CORE FEATURES GRID */}
        <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl font-extrabold text-slate-900">Everything You Need For A Seamless Commute</h2>
              <p className="text-slate-500 text-sm">
                Built specifically for Sheger Bus commuters in Addis Ababa, bringing real-time precision and cash-free ease to every journey.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Feature 1 */}
              <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-6 transition-all space-y-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Live GPS Tracking</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Track actual bus locations live on the interactive map with accurate station-by-station arrival countdowns.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-6 transition-all space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#1B2A4A] flex items-center justify-center border border-indigo-100">
                  <Sparkles className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">AI Traffic Insights</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Smart congestion predictions analyze peak hours to suggest the fastest alternative lines and optimal departure times.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-6 transition-all space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Cashless QR Tickets</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Generate instant digital boarding passes directly on your mobile device. Scan and board without physical cash.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-6 transition-all space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Navigation className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Multi-Line Planner</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Search any origin and destination across Addis Ababa to view direct routes, transfers, and estimated fare costs.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* 4. CALL TO ACTION BANNER */}
        <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-[#1B2A4A] via-[#16223D] to-[#1B2A4A] rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left max-w-xl">
              <h2 className="text-3xl font-extrabold tracking-tight">Ready to transform your daily bus commute?</h2>
              <p className="text-slate-300 text-sm">
                Join thousands of passengers moving faster across Addis Ababa with Sheger Smart Bus.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => navigate("/register")}
                className="w-full sm:w-auto px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-lg text-center"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all cursor-pointer text-center border border-white/20"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 px-4 sm:px-8 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={shegerlogo} alt="Logo" className="w-6 h-6 rounded-md object-cover" />
            <span className="font-bold text-slate-700 text-sm">Sheger Bus Transit System</span>
          </div>
          <p>© 2026 Sheger Bus Transportation System (SBTS). All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
