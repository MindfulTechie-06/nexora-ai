'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  authSignIn,
  authSignUp,
  authSignInOAuth,
  getCurrentAuthProfile,
  isProfileNameSetupNeeded,
} from '../../lib/insforge';
import { Profile } from '../../lib/types';
import NameSetupModal from '../../components/NameSetupModal';
import ThemeToggle from '../../components/ThemeToggle';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Mail,
  Lock,
  User,
  ShieldCheck,
} from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.893.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [userModeOverride, setUserModeOverride] = useState<'login' | 'signup' | null>(null);
  const mode = userModeOverride ?? queryMode;

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile setup modal state (only for genuine edge cases where profile lacks name)
  const [showNameModal, setShowNameModal] = useState(false);
  const [authenticatedProfile, setAuthenticatedProfile] = useState<Profile | null>(null);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);

  // If already authenticated and profile is complete, redirect to /chat
  useEffect(() => {
    getCurrentAuthProfile().then((profile) => {
      if (profile && !isProfileNameSetupNeeded(profile)) {
        router.replace('/chat');
      }
    });
  }, [router]);

  const toggleMode = (newMode: 'login' | 'signup') => {
    setUserModeOverride(newMode);
    setError(null);
    setSuccessMessage(null);
    setShowForgotPassword(false);
    const params = new URLSearchParams(window.location.search);
    params.set('mode', newMode);
    router.replace(`/auth?${params.toString()}`);
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'discord') => {
    setError(null);
    setOauthLoading(provider);

    try {
      const res = await authSignInOAuth(provider);

      if (res.error) {
        setError(res.error);
        setOauthLoading(null);
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to initiate ${provider} authentication.`;
      setError(msg);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic inline validations
    if (!email.trim() || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your password confirmation.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const cleanName = displayName.trim() || email.split('@')[0];
        const res = await authSignUp(email.trim(), password, undefined, cleanName);

        if (res.error) {
          setError(res.error);
        } else if (res.profile) {
          // Check if profile setup is genuinely required
          if (isProfileNameSetupNeeded(res.profile)) {
            setAuthenticatedProfile(res.profile);
            setShowNameModal(true);
          } else {
            setSuccessMessage('Account created successfully! Taking you to chat...');
            setTimeout(() => {
              router.push('/chat');
            }, 600);
          }
        }
      } else {
        const res = await authSignIn(email.trim(), password);

        if (res.error) {
          setError(res.error);
        } else if (res.profile) {
          // Requirement 3 & 4: If profile already has valid username and display name,
          // use those existing values automatically and DO NOT ask user again!
          if (isProfileNameSetupNeeded(res.profile)) {
            setAuthenticatedProfile(res.profile);
            setShowNameModal(true);
          } else {
            setSuccessMessage('Signed in successfully! Redirecting to chat...');
            setTimeout(() => {
              router.push('/chat');
            }, 600);
          }
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNameSetupSuccess = (updatedProfile: Profile) => {
    setAuthenticatedProfile(updatedProfile);
    setShowNameModal(false);
    setSuccessMessage('Profile saved successfully! Redirecting...');
    setTimeout(() => {
      router.push('/chat');
    }, 600);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address to receive reset instructions.');
      return;
    }
    setError(null);
    setForgotPasswordSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Background ambient decorative glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[28rem] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[24rem] h-[24rem] bg-violet-500/10 dark:bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
      </div>

      {/* Top Header / Nav strip */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors py-1.5 px-3 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Centered Authentication Card (Reference 2 & Reference 5 inspired) */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-6 sm:py-8">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-indigo-950/40 backdrop-blur-xl relative overflow-hidden transition-all">
          {/* Subtle Top Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Card Header & Brand Icon */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center mb-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-transform duration-200">
                <MessageSquare className="w-6 h-6" />
              </div>
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {showForgotPassword
                ? 'Reset Password'
                : mode === 'signup'
                ? 'Create an Account'
                : 'Welcome Back'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {showForgotPassword
                ? 'Enter your registered email and we will help you regain access.'
                : mode === 'signup'
                ? 'Join Nexora AI for real-time messaging, channels, and live presence.'
                : 'Enter your credentials to continue to your conversations.'}
            </p>
          </div>

          {/* Mode Switcher Pills (Login vs Signup) */}
          {!showForgotPassword && (
            <div className="grid grid-cols-2 p-1 mb-5 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                id="tab-auth-login"
                onClick={() => toggleMode('login')}
                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-auth-signup"
                onClick={() => toggleMode('signup')}
                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Alerts (Error / Success) */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Forgot Password Flow */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotPasswordSubmitted ? (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-indigo-500 mx-auto" />
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    If an account exists for <span className="font-semibold text-indigo-600 dark:text-indigo-400">{email}</span>, password reset instructions have been sent.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordSubmitted(false);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold mt-2 cursor-pointer inline-block"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="input-forgot-email" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="input-forgot-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    Send Reset Instructions
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel and return to Sign In
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            <>
              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Display Name (Only in Signup Mode) */}
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="input-signup-displayname" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="input-signup-displayname"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label htmlFor="input-auth-email" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-auth-password" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="input-auth-confirm-password" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="input-auth-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary Submit Button */}
                <div className="pt-2">
                  <button
                    id="btn-auth-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Social Login Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Social OAuth Buttons (Google, GitHub, Discord) */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Google */}
                <button
                  id="btn-oauth-google"
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={Boolean(oauthLoading)}
                  className="flex items-center justify-center py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors disabled:opacity-50 cursor-pointer text-slate-700 dark:text-slate-300"
                  title="Sign in with Google"
                  aria-label="Sign in with Google"
                >
                  {oauthLoading === 'google' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    <GoogleIcon />
                  )}
                </button>

                {/* GitHub */}
                <button
                  id="btn-oauth-github"
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={Boolean(oauthLoading)}
                  className="flex items-center justify-center py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors disabled:opacity-50 cursor-pointer text-slate-700 dark:text-slate-300"
                  title="Sign in with GitHub"
                  aria-label="Sign in with GitHub"
                >
                  {oauthLoading === 'github' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    <GitHubIcon />
                  )}
                </button>

                {/* Discord */}
                <button
                  id="btn-oauth-discord"
                  type="button"
                  onClick={() => handleOAuth('discord')}
                  disabled={Boolean(oauthLoading)}
                  className="flex items-center justify-center py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors disabled:opacity-50 cursor-pointer text-[#5865F2]"
                  title="Sign in with Discord"
                  aria-label="Sign in with Discord"
                >
                  {oauthLoading === 'discord' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    <DiscordIcon />
                  )}
                </button>
              </div>

              {/* Mode switch link */}
              <div className="text-center mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode(mode === 'signup' ? 'login' : 'signup')}
                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold cursor-pointer ml-1"
                  >
                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </div>
            </>
          )}

          {/* Trust footnote */}
          <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted with PostgreSQL Row-Level Security</span>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto text-center py-2">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Nexora AI. All rights reserved. Real-time messaging platform.
        </p>
      </footer>

      {/* Profile Name Setup Modal (Rendered ONLY when required for genuinely incomplete profiles) */}
      {showNameModal && authenticatedProfile && (
        <NameSetupModal
          isOpen={showNameModal}
          initialDisplayName={authenticatedProfile.display_name}
          initialUsername={authenticatedProfile.username}
          onSuccess={handleNameSetupSuccess}
          onClose={() => {
            setShowNameModal(false);
            router.push('/chat');
          }}
        />
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
