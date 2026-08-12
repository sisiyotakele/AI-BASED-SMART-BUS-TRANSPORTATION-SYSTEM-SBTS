import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';

export const AuthSwitcher: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="auth-card bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md relative">
      {/* Mobile‑only branding */}
      <div className="flex lg:hidden items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-full bg-gray-200" />
        <div>
          <span className="font-extrabold text-sm text-slate-900 tracking-wide">SHEGER BUS</span>
          <p className="text-[10px] text-slate-400 -mt-0.5">Smart Transit System</p>
        </div>
        <Link to="/" className="ml-auto text-[11px] font-semibold text-slate-500 hover:underline flex items-center gap-1">← Home</Link>
      </div>

      {/* Tab navigation */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setActiveTab('login')}
          className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-colors ${activeTab === 'login' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}`}
        >
          Login
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-colors ${activeTab === 'register' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}`}
        >
          Sign Up
        </button>
      </div>

      {/* Render selected form */}
      {activeTab === 'login' ? <LoginPage /> : <RegisterPage />}
    </div>
  );
};
