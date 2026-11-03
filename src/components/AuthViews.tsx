import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type AuthViewMode =
  | 'login'
  | 'signup'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-password';

interface AuthViewsProps {
  mode: AuthViewMode;
  redirectAfterAuth?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  mode,
  redirectAfterAuth = 'dashboard',
  onNavigate,
}) => {
  const { setSession } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [verificationCode, setVerificationCode] = useState('');
  const [issuedVerificationCode, setIssuedVerificationCode] = useState('');
  const [pendingToken, setPendingToken] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  const [recoveryCode, setRecoveryCode] = useState('');
  const [issuedRecoveryCode, setIssuedRecoveryCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Strong password validation checks
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isStrongPassword = hasMinLen && hasUpper && hasLower && hasNumber;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid login credentials.');
        return;
      }
      setSession(data.token, data.user);
      onNavigate(data.user.role === 'admin' ? 'admin' : redirectAfterAuth || 'dashboard');
    } catch (err: any) {
      setError(err.message || 'Network error while signing in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Full Name, Email Address, and Password are required.');
      return;
    }
    if (!isStrongPassword) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create account.');
        return;
      }

      setPendingToken(data.token);
      setPendingUser(data.user);
      if (data.verificationCode) {
        setIssuedVerificationCode(data.verificationCode);
        setVerificationCode(data.verificationCode);
      }
      setSuccess(
        'Account registered! Verify your email below to activate your profile and access the Dashboard.'
      );
      onNavigate('verify-email');
    } catch (err: any) {
      setError(err.message || 'Network error during signup.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim() || !verificationCode.trim()) {
      setError('Please enter your email address and verification code.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Email verification failed.');
        return;
      }
      setSuccess(data.message || 'Email verified!');
      if (pendingToken && pendingUser) {
        setSession(pendingToken, { ...pendingUser, emailVerified: true });
        setTimeout(
          () =>
            onNavigate(
              pendingUser.role === 'admin'
                ? 'admin'
                : redirectAfterAuth || 'dashboard'
            ),
          600
        );
      } else {
        setTimeout(() => onNavigate('login'), 800);
      }
    } catch (err: any) {
      setError(err.message || 'Network error verifying email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to resend verification code.');
        return;
      }
      if (data.verificationCode) {
        setIssuedVerificationCode(data.verificationCode);
        setVerificationCode(data.verificationCode);
      }
      setSuccess(data.message || 'New verification code sent.');
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to process request.');
        return;
      }
      setSuccess(data.message);
      if (data.recoveryCode) {
        setIssuedRecoveryCode(data.recoveryCode);
        setRecoveryCode(data.recoveryCode);
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim() || !password) {
      setError('Email and new password are required.');
      return;
    }
    if (!isStrongPassword) {
      setError(
        'New password must be at least 8 characters and include uppercase, lowercase, and a number.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          recoveryCode,
          newPassword: password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }
      setSuccess(data.message);
      setTimeout(() => onNavigate('login'), 1000);
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C14] text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Attend AI Workspace</span>
        </button>

        <div className="bg-[#121420] border border-slate-800 rounded-xl p-7 shadow-xl space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-mono font-bold text-white text-sm">
              &lt;/&gt;
            </div>
            <div>
              <div className="text-base font-bold text-white leading-tight">Attend AI</div>
              <div className="text-xs text-slate-400">
                Email &amp; Password Authentication
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'signup' && 'Create your developer account'}
              {mode === 'verify-email' && 'Verify your email address'}
              {mode === 'forgot-password' && 'Recover your password'}
              {mode === 'reset-password' && 'Set a new password'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login' &&
                'Enter your registered email and password to track solved challenges and XP.'}
              {mode === 'signup' &&
                'Start debugging pre-written HTML, CSS, and JavaScript challenges.'}
              {mode === 'verify-email' &&
                'Enter the verification code sent to your email address to activate your account.'}
              {mode === 'forgot-password' &&
                'Enter your registered email to receive a password recovery token.'}
              {mode === 'reset-password' &&
                'Enter your email, recovery code, and your new strong password.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/70 text-emerald-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
              {issuedRecoveryCode && mode === 'forgot-password' && (
                <div className="pt-2 flex items-center justify-between border-t border-emerald-800/50">
                  <span className="font-mono text-emerald-300">
                    Token: {issuedRecoveryCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('reset-password')}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium cursor-pointer"
                  >
                    Proceed to Reset Password →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                  />
                  <span>Remember session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Strong password (8+ chars)"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                  <span className={hasMinLen ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ 8+ characters
                  </span>
                  <span className={hasUpper ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Uppercase letter (A-Z)
                  </span>
                  <span className={hasLower ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Lowercase letter (a-z)
                  </span>
                  <span className={hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Number (0-9)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* EMAIL VERIFICATION FORM */}
          {mode === 'verify-email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              {issuedVerificationCode && (
                <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/70 text-xs text-indigo-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Verification Code Issued:</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {issuedVerificationCode}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Email Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="VER-XXXXXX"
                  className="w-full px-3 py-2.5 text-sm font-mono bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Verifying Email...' : 'Verify Email & Continue'}
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={submitting}
                className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Verification Email</span>
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Sending Recovery Token...' : 'Send Password Reset Email'}
              </button>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Recovery Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="REC-XXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-mono bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 chars (A-Z, a-z, 0-9)"
                    className="w-full px-3 pr-10 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <span className={hasMinLen ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ 8+ characters
                  </span>
                  <span className={hasUpper ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Uppercase letter
                  </span>
                  <span className={hasLower ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Lowercase letter
                  </span>
                  <span className={hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Number
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 text-sm bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Switch Mode Footer Links */}
          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            {mode === 'login' && (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            )}
            {mode === 'signup' && (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            )}
            {(mode === 'forgot-password' ||
              mode === 'reset-password' ||
              mode === 'verify-email') && (
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Back to Sign In
                </button>
                {mode === 'forgot-password' && (
                  <button
                    type="button"
                    onClick={() => onNavigate('reset-password')}
                    className="text-slate-300 hover:text-white cursor-pointer"
                  >
                    Have a recovery code?
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
