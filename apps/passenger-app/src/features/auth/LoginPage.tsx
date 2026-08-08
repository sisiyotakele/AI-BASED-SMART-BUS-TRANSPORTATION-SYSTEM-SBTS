import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Bus, Activity, ShieldCheck } from "lucide-react";
import "@/styles/auth.css";
import { authApi } from "@/lib/api"; // ← Step 1: Use typed authApi instead of raw axios instance
import { Link, useNavigate } from "react-router-dom";
import busImg from "../../assets/bus.jpg";
import shegerLogo from "../../assets/sheger-logo.jpg";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 2: Call the correct real endpoint POST /auth/login via authApi
      const res = await authApi.login(formData);

      // Step 3: Swagger returns { data: { accessToken, refreshToken, user } }
      // Save both tokens — accessToken for API calls, refreshToken to auto-renew sessions
      const { accessToken, refreshToken } = res.data.data;
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.removeItem("isGuest"); // Clear any guest session

      navigate("/dashboard");
    } catch (err: any) {
      // Step 4 & 5: No more mock bypass — show the real error from the server
      // Swagger error shape: { success: false, message: "..." }
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.details ||
        "Login failed. Please check your credentials and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container min-h-screen flex flex-col lg:flex-row">
      {/* Left Branding Hero Section with bus.jpg background */}
      <div className="auth-hero-sidebar relative w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 sm:p-12 overflow-hidden bg-slate-950 text-white">
        
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
      <div className="auth-form-container flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50">
        <div className="auth-card bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md relative">
          {/* Back to Landing Page Button */}
          <div className="mb-4">
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
            <div className="auth-error-box mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
              {error}
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
              className="w-full py-3 bg-[#1B2A4A] hover:bg-[#283863] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
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

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => {
              // Mock Google sign-in for development
              console.log("Google Sign-In clicked");
              localStorage.setItem("token", "google-auth-token");
              localStorage.setItem("authProvider", "google");
              localStorage.removeItem("isGuest");
              navigate("/dashboard");
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Continue as Guest Button */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("isGuest", "true");
              localStorage.removeItem("token");
              navigate("/dashboard");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#1B2A4A] hover:text-white transition-all cursor-pointer shadow-2xs group"
          >
            <span>Continue as Guest (No Sign Up)</span>
          </button>

          <p className="auth-bottom-text text-center text-xs text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link text-indigo-600 font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;