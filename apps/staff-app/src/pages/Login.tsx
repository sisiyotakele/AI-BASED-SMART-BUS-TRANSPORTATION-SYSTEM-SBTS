import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { getActivePortal, setPortalHint } from '@/lib/auth-storage';
import shegerBusImage from '@/assets/sheger.jpeg';
import logoImage from '@/assets/logo.png';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data.email, data.password);
      let from = location.state?.from?.pathname || '/';

      const roleNames = (response.user.roles || [])
        .map((r: any) => {
          if (typeof r === 'string') return r.toUpperCase();
          return (r.roleName || r.name || '').toUpperCase();
        })
        .filter(Boolean);
      const hasDriverRole = roleNames.includes('DRIVER');
      const hasAdminAccess = roleNames.some((role) => role !== 'DRIVER' && role !== 'PASSENGER');
      const canAccessDriver = hasDriverRole;
      const canAccessAdmin = hasAdminAccess;

      if (from.startsWith('/driver') && canAccessDriver) {
        // Keep requested driver path.
      } else if (from.startsWith('/dashboard') && canAccessAdmin) {
        // Keep requested admin path.
      } else if (canAccessAdmin) {
        from = '/dashboard';
      } else if (canAccessDriver) {
        from = '/driver';
      } else {
        from = '/';
      }

        const targetPortal = from.startsWith('/driver')
        ? 'driver'
        : from.startsWith('/dashboard')
          ? 'admin'
          : getActivePortal();

        setPortalHint(targetPortal);
        setAuth(response.user, response.accessToken, response.refreshToken, targetPortal);

      // If admin assigned this password, force the user to change it first
      if (response.mustChangePassword) {
        toast('Please set a new password before continuing.', { icon: '🔒' });
        navigate('/change-password', { replace: true });
        return;
      }

        toast.success('Welcome back!');
      
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', 'admin@sbts.com', { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
    setCopied(true);
    toast.success('Demo credentials loaded!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-navy-900 font-sans antialiased selection:bg-blue-500 selection:text-white transition-colors duration-300">
      {/* Left Side - Visual Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 border-r border-transparent dark:border-navy-800">
        <img
          src={shegerBusImage}
          alt="Sheger Bus Fleet"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transform hover:scale-100 transition-transform duration-1000 ease-out brightness-90"
          onError={(e) => {
            e.currentTarget.src = '/bus.jpeg';
          }}
        />
        {/* Soft Multi-layer Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-blue-900/30" />

        {/* Hero Text Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full w-full">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-lg tracking-wide text-white/90">
              SBTS Enterprise
            </span>
          </div>

          <div className="space-y-4 max-w-lg mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
              Next-Gen Transit Management
            </span>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Smart Mass Transportation Operations
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Real-time telemetry, fleet tracking, and automated schedules built for reliable urban mobility.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-navy-900 dark:via-[#11192b] dark:to-navy-800 transition-colors duration-300">
        <div className="w-full max-w-md space-y-8">
          {/* Header with Centered Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-white dark:bg-navy-800 rounded-2xl border border-blue-100 dark:border-navy-700 shadow-md">
                <img
                  src={logoImage}
                  alt="Sheger Logo"
                  className="h-14 w-14 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              SHEGER BUS
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto uppercase tracking-wider">
              Sheger Mass Transport Service Enterprise
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-navy-900 border ${errors.email ? 'border-red-400 dark:border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-navy-700 focus:border-[#2B4B9E] dark:focus:border-cyan-500 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
                    } rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all shadow-sm`}
                  placeholder="admin@sbts.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full pl-10 pr-11 py-2.5 bg-white dark:bg-navy-900 border ${errors.password ? 'border-red-400 dark:border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-navy-700 focus:border-[#2B4B9E] dark:focus:border-cyan-500 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
                    } rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all shadow-sm`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Form Controls */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 text-[#2B4B9E] dark:text-cyan-600 border-slate-300 dark:border-navy-700 rounded focus:ring-[#2B4B9E] dark:focus:ring-cyan-500 focus:ring-offset-0 dark:focus:ring-offset-navy-900 cursor-pointer dark:bg-navy-900"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  Keep me signed in
                </span>
              </label>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold text-[#2B4B9E] dark:text-cyan-400 hover:text-[#1e3a80] dark:hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#12B2E4] to-[#12B2E4] dark:from-cyan-600 dark:to-blue-600 hover:from-[#12B2E4] hover:to-[#12B2E4] dark:hover:from-cyan-500 dark:hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#2B4B9E]/25 dark:shadow-cyan-600/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Demo Helper Panel */}
          <div className="p-4 bg-slate-100/70 dark:bg-navy-900/50 border border-slate-200/80 dark:border-navy-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Demo Account Access
              </span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#2B4B9E] dark:text-cyan-400 hover:text-[#1e3a80] dark:hover:text-cyan-300 bg-white dark:bg-navy-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-navy-700 shadow-xs hover:border-[#2B4B9E]/30 dark:hover:border-cyan-500/50 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Loaded</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#2B4B9E] dark:text-cyan-400" />
                    <span>Auto-fill</span>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white dark:bg-navy-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-navy-600 text-slate-600 dark:text-slate-300">
              <div>
                <span className="block text-[10px] uppercase font-sans font-bold text-slate-400 dark:text-slate-500">Email</span>
                <span className="truncate block font-medium text-slate-800 dark:text-slate-200">admin@sbts.com</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-sans font-bold text-slate-400 dark:text-slate-500">Password</span>
                <span className="truncate block font-medium text-slate-800 dark:text-slate-200">Password123!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}