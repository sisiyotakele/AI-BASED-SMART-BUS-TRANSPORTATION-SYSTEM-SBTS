import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { ArrowLeft, UserCircle, Phone, Mail, Shield, Clock, ShieldAlert } from 'lucide-react';
import React from 'react';

export function UserDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: user, isLoading, error } = useQuery({
        queryKey: ['user', id],
        queryFn: () => userService.getUser(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 text-cyan-600 dark:text-cyan-400">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold tracking-wider uppercase">Loading User Profile...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">User Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    The requested account profile could not be located in the database.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/dashboard/users')} className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
                        Return to Users
                    </button>
                </div>
            </div>
        );
    }

    const { roles = [] } = user;

    return (
        <div className="space-y-6">
            {/* Unified Header */}
            <div className="bg-white dark:bg-navy-900 shadow-sm rounded-2xl border border-slate-200 dark:border-navy-700 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full">
                    <button
                        onClick={() => navigate('/dashboard/users')}
                        className="p-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors shrink-0 text-slate-600 dark:text-slate-300"
                        title="Back to Users"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-navy-900/20 border border-cyan-100 dark:border-cyan-800/30 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                            {user.fullName.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">{user.fullName}</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-xs mt-0.5 truncate">UUID: {user.id}</p>
                    </div>
                </div>

                <div className="flex shrink-0 w-full md:w-auto">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border shadow-sm w-full md:w-auto justify-center ${
                        user.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                    }`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current mr-2"></div>
                        {user.isActive ? 'Active System Account' : 'Suspended Identity'}
                    </span>
                </div>
            </div>

            {/* Matrix Data */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Contact & Meta */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 dark:border-navy-800">
                            Professional Contact Methods
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex space-x-3 p-4 bg-[#F5F0F0] dark:bg-navy-800 rounded-xl border border-slate-100 dark:border-navy-700">
                                <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Corporate Email</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex space-x-3 p-4 bg-[#F5F0F0] dark:bg-navy-800 rounded-xl border border-slate-100 dark:border-navy-700">
                                <Phone className="w-5 h-5 text-indigo-500 shrink-0" />
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Direct Line</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm">
                         <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 dark:border-navy-800 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-cyan-500" /> Authorized Roles
                        </h3>
                        {roles.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No roles assigned</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {roles.map((role: string) => (
                                    <span key={role} className="px-3 py-1.5 bg-white dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-cyan-500/20 rounded-lg text-xs font-bold uppercase tracking-wide">
                                        {role.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Information Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 dark:border-navy-800">
                            Audit & Activity Lifecycle
                        </h3>
                        <div className="space-y-5">
                            <div className="flex items-start gap-4 p-4 bg-[#F5F0F0] dark:bg-navy-800 rounded-xl border border-slate-100 dark:border-navy-700">
                                <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Created</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                                        {new Date(user.createdAt).toLocaleDateString(undefined, { 
                                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[#F5F0F0] dark:bg-navy-800 rounded-xl border border-slate-100 dark:border-navy-700 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                <UserCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Authenticated Login</p>
                                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        }) : 'Never Logged In'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
