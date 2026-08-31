import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Bus, Activity, ShieldCheck } from "lucide-react";
import "@/styles/auth.css";
import { authApi, getApiDiagnosticError, normalizeUserProfile, type ApiDiagnosticError } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import busImg from "../../assets/bus.jpg";
import shegerLogo from "../../assets/sheger-logo.jpg";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, enterGuestMode } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<ApiDiagnosticError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Manual validation to prevent empty credentials submission
    if (!formData.email.trim() || !formData.password.trim()) {
      setError({
        type: 'validation',
        message: '⚠️ Missing Credentials',
        detail: 'Please enter both your email address and password to login.',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.login(formData);
      const { accessToken, refreshToken, user: rawUser } = res.data.data || {};

      if (!accessToken || !refreshToken) {
        setError({
          type: 'server',
          message: '🛑 Login Response Error',
          detail: 'Invalid response from server. Missing authentication tokens.',
        });
        return;
      }

      login(accessToken, refreshToken, normalizeUserProfile(rawUser));
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getApiDiagnosticError(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container min-h-screen flex flex-col lg:flex-row">
      {/* Left Branding Hero Section — HIDDEN on mobile, visible lg+ */}
      <div className="auth-hero-sidebar hidden lg:flex relative w-full lg:w-1/2 min-h-screen flex-col justify-between p-8 sm:p-12 overflow-hidden bg-slate-950 text-white">
        
        {/* 1. BACKGROUND IMAGE (assets/bus.jpg) */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${busImg})` }}
        />

        {/* 2. GRADIENT OVERLAY FOR READABILITY */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-slate-950/50 backdrop-blur-[1px]" />

        {/* 3. HEADER & LOGO */}
        <Link to="/" className="relative z-10 flex items-center gap-3 hover:opacity-90 transition-opacity" title="Back to Landing Page">
          <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-sky-400/40 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
            <img 
              src={shegerLogo} 
              alt="Sheger Bus Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="font-extrabold text-lg tracking-wider text-white">SHEGER BUS</span>
        </Link>

        {/* 4. HERO BODY & FEATURE CARDS */}
        <div className="relative z-10 my-auto py-8 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Sheger Bus System
            </h1>
            <p className="text-sm sm:text-base text-slate-200 font-medium mt-2 max-w-md">
              AI-powered transportation system for smarter and safer journeys across Addis Ababa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
            <div className="bg-slate-900/80 border border-slate-700/60 backdrop-blur-md p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
              <Activity className="h-5 w-5 text-sky-400 mb-2 shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-white">Live Tracking</h4>
                <p className="text-[10px] text-slate-300 mt-0.5">Track buses in real time</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 backdrop-blur-md p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
              <Bus className="h-5 w-5 text-sky-400 mb-2 shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-white">AI Traffic</h4>
                <p className="text-[10px] text-slate-300 mt-0.5">Smart route prediction</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 backdrop-blur-md p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
              <ShieldCheck className="h-5 w-5 text-sky-400 mb-2 shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-white">Safe Trips</h4>
                <p className="text-[10px] text-slate-300 mt-0.5">Better passenger experience</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. FOOTER */}
        <div className="relative z-10 text-xs font-medium text-slate-300">
          © {new Date().getFullYear()} SBTS Passenger Portal
        </div>
      </div>

      {/* Right Form Section */}
      <div className="auth-form-container flex-1 flex flex-col justify-center items-center min-h-screen p-5 sm:p-10 bg-slate-50">
        <div className="auth-card bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md relative">

          {/* Mobile-only top branding */}
          <div className="flex lg:hidden items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-slate-200 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img src={shegerLogo} alt="Sheger Bus Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 tracking-wide">SHEGER BUS</span>
              <p className="text-[10px] text-slate-400 -mt-0.5">Smart Transit System</p>
            </div>
            <Link to="/" className="ml-auto text-[11px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1">
              ← Home
            </Link>
          </div>

          {/* Back to Landing Page Button — desktop only */}
          <div className="hidden lg:block mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#1B2A4A] hover:text-white text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200/80"
            >
              <span>← Back to Landing Page</span>
            </Link>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
              Passenger Login
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Welcome back! Please login to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-bold text-sm text-red-700 flex items-center gap-2">
                <span className="text-base">⚠️</span>
                {error.message}
              </p>
              {error.bullets && error.bullets.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {error.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : error.detail ? (
                <p className="mt-1.5 text-xs text-red-600 leading-relaxed">{error.detail}</p>
              ) : null}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="form-group space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Email Address
              </label>
              <div className="input-field-wrapper relative flex items-center">
                <Mail className="input-icon-left w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Password
              </label>
              <div className="input-field-wrapper relative flex items-center">
                <Lock className="input-icon-left w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="auth-input w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-icon-right absolute right-3 text-slate-400 hover:text-slate-700"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-600 hover:underline font-bold"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: "#2B4B9E" }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <div className="space-y-3">
            {/* Nav to Register Button */}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer shadow-xs"
            >
              <span>Create an Account (Sign Up)</span>
            </button>

            {/* Continue as Guest Button */}
            <button
              type="button"
              onClick={() => {
                enterGuestMode();
                navigate("/dashboard");
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
            >
              <span>Continue as Guest (Limited Access)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;