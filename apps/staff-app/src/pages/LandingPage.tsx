import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
    Bus,
    MapPin,
    Users,
    Calendar,
    BarChart3,
    Shield,
    ArrowRight,
    Sparkles,
    Moon,
    Sun
} from 'lucide-react';
import logo from '../assets/logo.png';
import shegerBus from '../assets/sheger.jpeg';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../store/auth.store';

export function LandingPage() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const clearAuth = useAuthStore((state) => state.clearAuth);

    useEffect(() => {
        // Explicitly destroy any persistent session when on the public landing page.
        // This ensures the user MUST supply credentials again if they attempt to access Help Portal or Dashboard.
        clearAuth();
    }, [clearAuth]);


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200 dark:border-navy-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 p-0.5 border border-slate-200 flex items-center justify-center overflow-hidden">
                            <img src={logo} alt="Sheger Bus Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight transition-colors">
                                Sheger Bus
                            </h1>
                            <p className="text-xs text-slate-400 font-semibold -mt-0.5">
                                Staff Management Portal
                            </p>
                        </div>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-full transition-colors"
                            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#2B4B9E] to-cyan-600 hover:from-[#1e3a80] hover:to-cyan-700 text-white font-semibold rounded-full shadow-lg shadow-cyan-600/20 transition-all hover:-translate-y-0.5"
                        >
                            <span>Get Started</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-16 pb-24 px-6">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-200/40 via-blue-100/30 to-teal-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left Content */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            {/* Badge Removed */}

                            {/* Headline */}
                            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight transition-colors">
                                Manage Addis Ababa's{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-[#2B4B9E] dark:from-cyan-400 dark:to-blue-400">
                                    Smart Bus Fleet
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                Comprehensive staff portal for managing routes, buses, drivers, trips, and
                                real-time operations across the Sheger Bus Transportation System.
                            </p>

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#2B4B9E] to-cyan-600 hover:from-[#1e3a80] hover:to-cyan-700 text-white font-bold rounded-xl shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
                                >
                                    <span>Access Staff Portal</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="pt-8 border-t border-slate-200 dark:border-navy-800 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0">
                                <div>
                                    <h4 className="text-3xl font-black text-[#2B4B9E] dark:text-blue-400">120+</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Buses</p>
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-cyan-600 dark:text-cyan-400">98%</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">On-Time Rate</p>
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-teal-600 dark:text-teal-400">250k+</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Daily Passengers</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Visual */}
                        <div className="lg:col-span-5">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-[#2B4B9E] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <div className="relative">
                                    <img
                                        src={shegerBus}
                                        alt="Sheger Bus"
                                        className="rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent rounded-2xl" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="bg-white/95 dark:bg-navy-900/90 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/20 dark:border-navy-700/50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                    Live Operations
                                                </span>
                                                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                    Online
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <div>
                                                    <p className="text-xl font-black text-[#2B4B9E] dark:text-blue-400">45</p>
                                                    <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Active Trips</p>
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black text-cyan-600 dark:text-cyan-400">112</p>
                                                    <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Buses On Road</p>
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black text-teal-600 dark:text-teal-400">89</p>
                                                    <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Drivers Active</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-white dark:bg-navy-900 border-y border-slate-200 dark:border-navy-800 px-6 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 transition-colors">
                                Complete Fleet Management Suite
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">
                                Everything you need to manage operations, personnel, and resources efficiently.
                            </p>
                        </div>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-slate-50 dark:bg-navy-900/50 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-6 transition-all space-y-4 shadow-sm hover:shadow-md">
                                <div className="w-12 h-12 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-100 dark:border-cyan-800">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                    Real-Time GPS Tracking
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    Monitor all buses live on an interactive map with detailed trip progress and
                                    location data.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-slate-50 dark:bg-navy-900/50 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-6 transition-all space-y-4 shadow-sm hover:shadow-md">
                                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                    Schedule Management
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    Create and manage route schedules, driver shifts, and bus assignments
                                    seamlessly.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-slate-50 dark:bg-navy-900/50 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-6 transition-all space-y-4 shadow-sm hover:shadow-md">
                                <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-800">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Driver Management</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    Manage driver profiles, assignments, shifts, and performance tracking in one
                                    place.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-slate-50 dark:bg-navy-900/50 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-6 transition-all space-y-4 shadow-sm hover:shadow-md">
                                <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800">
                                    <Bus className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Fleet Operations</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    Comprehensive bus fleet management including maintenance, incidents, and key
                                    handovers.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="bg-slate-50 dark:bg-navy-900/50 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-6 transition-all space-y-4 shadow-sm hover:shadow-md">
                                <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">AI Analytics</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    Leverage AI-powered predictions for traffic patterns, ETAs, and operational
                                    optimization.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="bg-slate-50 dark:bg-navy-900/50 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-6 transition-all space-y-4 shadow-sm hover:shadow-md">
                                <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-800">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">User & Access Control</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    Role-based permissions, audit logs, and complete user management for secure
                                    operations.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-r from-[#2D7A8E] via-[#236274] to-[#2D7A8E] rounded-2xl p-12 text-white shadow-2xl">
                            <div className="text-center space-y-6">
                                <h2 className="text-4xl font-extrabold">
                                    Ready to manage the fleet?
                                </h2>
                                <p className="text-cyan-100 text-lg">
                                    Access the staff portal to start managing operations, buses, drivers, and
                                    routes.
                                </p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-white text-[#2D7A8E] font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg"
                                >
                                    <span>Access Staff Portal</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#D4E8E5] dark:bg-navy-950 border-t border-slate-200 dark:border-navy-800 px-6 py-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Company Info */}
                        <div className="space-y-4">
                            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-max">
                                <div className="w-10 h-10 bg-white dark:bg-navy-900 rounded-lg flex items-center justify-center shadow-sm">
                                    <img src={logo} alt="Sheger Bus Logo" className="w-6 h-6 object-contain" />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white text-lg">Sheger Bus</span>
                            </Link>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Your trusted transportation system for Addis Ababa. We help commuters travel
                                efficiently with real-time tracking and smart route management.
                            </p>
                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#2D7A8E]" />
                                    <span>Addis Ababa, Ethiopia</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#2D7A8E]">📞</span>
                                    <span>+251 11 XXX XXXX</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#2D7A8E]">✉</span>
                                    <span>info@shegerbus.et</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li>
                                    <Link to="/login" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Staff Portal
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/help" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Help Portal
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/help/documentation" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Tech Documentation
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Core Modules</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li>
                                    <Link to="/dashboard/tracking" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Live Bus Tracking
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/routes" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Route Management
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/schedules" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Schedule Operations
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/pricing" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Fare Configuration
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Operations</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li>
                                    <Link to="/dashboard/trips" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Trip Dispatcher
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/incidents" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Incident Console
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/roles" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Access Controls
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/reports" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                        Analytics Engine
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-slate-300 dark:border-navy-800">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                © 2026 Sheger Bus Transportation System. All rights reserved.
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <a href="#" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                    Privacy Policy
                                </a>
                                <span>•</span>
                                <a href="#" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                    Terms of Service
                                </a>
                                <span>•</span>
                                <a href="#" className="hover:text-[#2D7A8E] dark:hover:text-cyan-400 transition-colors">
                                    Cookie Policy
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
