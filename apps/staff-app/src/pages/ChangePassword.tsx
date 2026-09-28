import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import logoImage from '@/assets/logo.png';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export function ChangePassword() {
  const navigate = useNavigate();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPasswordValue = watch('newPassword', '');

  const passwordStrength = (() => {
    let score = 0;
    if (newPasswordValue.length >= 8) score++;
    if (/[A-Z]/.test(newPasswordValue)) score++;
    if (/[a-z]/.test(newPasswordValue)) score++;
    if (/[0-9]/.test(newPasswordValue)) score++;
    if (/[^A-Za-z0-9]/.test(newPasswordValue)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength] || '';
  const strengthColor = [
    '',
    'bg-red-500',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-lime-500',
    'bg-emerald-500',
  ][passwordStrength] || '';

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully! Please log in again.');
      clearAuth();
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (isAuthenticated) {
      navigate(-1);
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/50 dark:from-slate-900 dark:via-[#0f172a] dark:to-blue-950 p-4 font-sans antialiased transition-colors duration-300">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-400/10 dark:bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-xl dark:shadow-2xl p-8 space-y-7 transition-colors duration-300">
          {/* Header */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12B2E4] to-blue-600 dark:from-blue-600 dark:to-cyan-500 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Set New Password
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-xs transition-colors">
                Your administrator assigned a temporary password. Please create a secure new one to continue.
              </p>
            </div>
          </div>

          {/* Security notice */}
          <div className="flex items-start space-x-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 transition-colors">
            <span className="text-amber-500 dark:text-amber-400 text-lg mt-0.5">⚠️</span>
            <p className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed transition-colors">
              This is a <strong>one-time requirement</strong>. Your account was set up by an administrator and you must change the password before accessing the system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Current (admin-assigned) password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors">
                Current (Admin-Assigned) Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
                <input
                  {...register('currentPassword')}
                  type={showCurrent ? 'text' : 'password'}
                  id="current-password-input"
                  placeholder="Enter your current password"
                  disabled={isLoading}
                  className={`w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/70 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.currentPassword
                      ? 'border-red-400 dark:border-red-500/70 focus:ring-red-200 dark:focus:ring-red-500/30'
                      : 'border-slate-200 dark:border-slate-600/60 focus:border-[#12B2E4] dark:focus:border-cyan-500/70 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 transition-colors">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
                <input
                  {...register('newPassword')}
                  type={showNew ? 'text' : 'password'}
                  id="new-password-input"
                  placeholder="Create a strong password"
                  disabled={isLoading}
                  className={`w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/70 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.newPassword
                      ? 'border-red-400 dark:border-red-500/70 focus:ring-red-200 dark:focus:ring-red-500/30'
                      : 'border-slate-200 dark:border-slate-600/60 focus:border-[#12B2E4] dark:focus:border-cyan-500/70 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {newPasswordValue && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength ? strengthColor : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthColor.replace('bg-', 'text-')}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}

              {errors.newPassword && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 transition-colors">{errors.newPassword.message}</p>
              )}

              {/* Requirements list */}
              <ul className="mt-2 space-y-1">
                {[
                  { label: 'At least 8 characters', met: newPasswordValue.length >= 8 },
                  { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(newPasswordValue) },
                  { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(newPasswordValue) },
                  { label: 'Number (0-9)', met: /[0-9]/.test(newPasswordValue) },
                  { label: 'Special character (!@#$%...)', met: /[^A-Za-z0-9]/.test(newPasswordValue) },
                ].map((req) => (
                  <li
                    key={req.label}
                    className={`flex items-center space-x-2 text-xs transition-colors ${
                      req.met ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                      req.met
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 text-transparent'
                    }`}>
                      {req.met && (
                        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span>{req.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  id="confirm-password-input"
                  placeholder="Re-enter new password"
                  disabled={isLoading}
                  className={`w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/70 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword
                      ? 'border-red-400 dark:border-red-500/70 focus:ring-red-200 dark:focus:ring-red-500/30'
                      : 'border-slate-200 dark:border-slate-600/60 focus:border-[#12B2E4] dark:focus:border-cyan-500/70 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 transition-colors">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="change-password-submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#12B2E4] to-[#12B2E4] dark:from-cyan-600 dark:to-blue-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#12B2E4]/20 dark:shadow-cyan-600/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Set New Password</span>
                </>
              )}
            </button>
          </form>

          {/* Footer branding */}
          <div className="flex items-center justify-center space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 transition-colors">
            <img
              src={logoImage}
              alt="SBTS Logo"
              className="h-6 w-6 object-contain opacity-70"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 transition-colors">Sheger Bus Transit System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
