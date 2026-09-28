import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import logoImage from '@/assets/logo.png';

// ── Step 1: Request reset ──────────────────────────────────────────────
const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ── Step 2: Reset with token ──────────────────────────────────────────
const resetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ForgotForm = z.infer<typeof forgotSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill token from URL if navigating via email link (?token=...)
  const tokenFromUrl = searchParams.get('token') || '';

  const [step, setStep] = useState<'request' | 'reset' | 'done'>(
    tokenFromUrl ? 'reset' : 'request'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Forms ──────────────────────────────────────────────────────────
  const forgotForm = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: tokenFromUrl },
  });

  const newPasswordValue = resetForm.watch('newPassword', '');

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

  // ── Handlers ──────────────────────────────────────────────────────
  const onRequestReset = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      toast.success('If this email exists, a reset link has been sent.');
      setStep('reset');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(data.token, data.newPassword);
      toast.success('Password reset successfully!');
      setStep('done');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired reset token');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared card wrapper ────────────────────────────────────────────
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/50 dark:from-slate-900 dark:via-[#0f172a] dark:to-blue-950 p-4 font-sans antialiased transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-400/10 dark:bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-xl dark:shadow-2xl p-8 space-y-7 transition-colors duration-300">
          {children}

          {/* Footer */}
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

  // ── Step: Request ──────────────────────────────────────────────────
  if (step === 'request') {
    return (
      <Card>
        {/* Header */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12B2E4] to-blue-600 dark:from-blue-600 dark:to-cyan-500 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/30">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Forgot Password</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-xs transition-colors">
              Enter your account email and we'll send you a reset link.
            </p>
          </div>
        </div>

        {/* Rate-limit notice */}
        <div className="flex items-start space-x-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-3.5 transition-colors">
          <span className="text-blue-500 dark:text-blue-400 text-sm mt-0.5">ℹ️</span>
          <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed transition-colors">
            For security, reset requests are limited to <strong>5 attempts per 15 minutes</strong>.
          </p>
        </div>

        <form onSubmit={forgotForm.handleSubmit(onRequestReset)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
              <input
                {...forgotForm.register('email')}
                type="email"
                id="forgot-email-input"
                placeholder="your@email.com"
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/70 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  forgotForm.formState.errors.email
                    ? 'border-red-400 dark:border-red-500/70 focus:ring-red-200 dark:focus:ring-red-500/30'
                    : 'border-slate-200 dark:border-slate-600/60 focus:border-[#12B2E4] dark:focus:border-cyan-500/70 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
                }`}
              />
            </div>
            {forgotForm.formState.errors.email && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 transition-colors">{forgotForm.formState.errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            id="forgot-password-submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#12B2E4] to-[#12B2E4] dark:from-cyan-600 dark:to-blue-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#12B2E4]/20 dark:shadow-cyan-600/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending...</span></>
            ) : (
              <><Mail className="w-4 h-4" /><span>Send Reset Link</span></>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center space-x-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </button>
        </form>
      </Card>
    );
  }

  // ── Step: Reset ────────────────────────────────────────────────────
  if (step === 'reset') {
    return (
      <Card>
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12B2E4] to-blue-600 dark:from-blue-600 dark:to-cyan-500 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Set New Password</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-xs transition-colors">
              Enter the reset token from your email and your new password.
            </p>
          </div>
        </div>

        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-5">
          {/* Token field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors">
              Reset Token
            </label>
            <input
              {...resetForm.register('token')}
              id="reset-token-input"
              placeholder="Paste the token from your email"
              disabled={isLoading}
              className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900/70 border rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                resetForm.formState.errors.token
                  ? 'border-red-400 dark:border-red-500/70 focus:ring-red-200 dark:focus:ring-red-500/30'
                  : 'border-slate-200 dark:border-slate-600/60 focus:border-[#12B2E4] dark:focus:border-cyan-500/70 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
              }`}
            />
            {resetForm.formState.errors.token && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 transition-colors">{resetForm.formState.errors.token.message}</p>
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
                {...resetForm.register('newPassword')}
                type={showNew ? 'text' : 'password'}
                id="reset-new-password-input"
                placeholder="Create a strong password"
                disabled={isLoading}
                className={`w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/70 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  resetForm.formState.errors.newPassword
                    ? 'border-red-400 dark:border-red-500/70 focus:ring-red-200 dark:focus:ring-red-500/30'
                    : 'border-slate-200 dark:border-slate-600/60 focus:border-[#12B2E4] dark:focus:border-cyan-500/70 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
                }`}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPasswordValue && (
              <div className="flex gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
              </div>
            )}
            {newPasswordValue && <p className={`text-xs font-medium ${strengthColor.replace('bg-', 'text-')}`}>{strengthLabel}</p>}
            {resetForm.formState.errors.newPassword && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 transition-colors">{resetForm.formState.errors.newPassword.message}</p>
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

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
              <input
                {...resetForm.register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                id="reset-confirm-password-input"
                placeholder="Re-enter new password"
                disabled={isLoading}
                className={`w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/70 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  resetForm.formState.errors.confirmPassword
                    ? 'border-red-400 dark:border-red-500/70 focus:ring-red-200 dark:focus:ring-red-500/30'
                    : 'border-slate-200 dark:border-slate-600/60 focus:border-[#12B2E4] dark:focus:border-cyan-500/70 focus:ring-blue-100 dark:focus:ring-cyan-500/20'
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 transition-colors">{resetForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            id="reset-password-submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#12B2E4] to-[#12B2E4] dark:from-cyan-600 dark:to-blue-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#12B2E4]/20 dark:shadow-cyan-600/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Resetting...</span></>
            ) : (
              <><Lock className="w-4 h-4" /><span>Reset Password</span></>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep('request')}
            className="w-full flex items-center justify-center space-x-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Request a new link</span>
          </button>
        </form>
      </Card>
    );
  }

  // ── Step: Done ─────────────────────────────────────────────────────
  return (
    <Card>
      <div className="flex flex-col items-center space-y-4 text-center py-4">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border-2 border-emerald-200 dark:border-emerald-500/50 transition-colors">
          <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Password Reset!</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 max-w-xs transition-colors">
            Your password has been updated successfully. You can now log in with your new credentials.
          </p>
        </div>
        <button
          onClick={() => navigate('/login', { replace: true })}
          id="go-to-login-btn"
          className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-[#12B2E4] to-[#12B2E4] dark:from-cyan-600 dark:to-blue-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#12B2E4]/20 dark:shadow-cyan-600/25"
        >
          Go to Login
        </button>
      </div>
    </Card>
  );
}
