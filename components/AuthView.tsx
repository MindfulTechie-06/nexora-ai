'use client';

import React, { useState } from 'react';
import { authSignIn, authSignUp, getStoredConfig, saveStoredConfig } from '../lib/insforge';
import { Profile } from '../lib/types';
import {
  MessageSquare,
  Sparkles,
  Shield,
  ArrowRight,
  Settings,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';

interface AuthViewProps {
  onAuthenticated: (profile: Profile) => void;
}

export default function AuthView({ onAuthenticated }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Backend config inline toggle
  const [showConfig, setShowConfig] = useState(false);
  const [baseUrl, setBaseUrl] = useState(() => getStoredConfig().baseUrl);
  const [anonKey, setAnonKey] = useState(() => getStoredConfig().anonKey);
  const [configSaved, setConfigSaved] = useState(false);

  const isBackendConfigured = Boolean(
    baseUrl && baseUrl !== 'https://your-app.region.insforge.app'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (isSignUp) {
      if (!username.trim()) {
        setError('Please provide a unique username.');
        return;
      }
      if (!displayName.trim()) {
        setError('Please provide your display name.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const res = await authSignUp(email.trim(), password, username.trim(), displayName.trim());
        if (res.error) {
          setError(res.error);
        } else if (res.profile) {
          onAuthenticated(res.profile);
        }
      } else {
        const res = await authSignIn(email.trim(), password);
        if (res.error) {
          setError(res.error);
        } else if (res.profile) {
          onAuthenticated(res.profile);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    saveStoredConfig(baseUrl.trim(), anonKey.trim());
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-lg shadow-indigo-500/25 mb-4">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Nexora AI Chat
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time, persistent messaging powered by InsForge BaaS
          </p>
        </div>

        {/* Backend configuration alert if missing */}
        {!isBackendConfigured && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Backend Endpoint Needed
              </span>
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-[11px] underline hover:text-amber-200 cursor-pointer"
              >
                {showConfig ? 'Hide Settings' : 'Configure URL'}
              </button>
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              Connect your InsForge project endpoint and public anon key in <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300">.env.local</code> or the configuration box below.
            </p>
          </div>
        )}

        {/* Inline Backend Configuration Box */}
        {showConfig && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-3">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-400" />
              InsForge Backend Configuration
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-app.region.insforge.app"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Public Anon Key</label>
              <input
                type="text"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="your-anon-key-here"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              {configSaved && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveConfig}
                className="ml-auto px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          {/* Tab selector */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl mb-6 border border-slate-800/50">
            <button
              id="tab-signin"
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    id="input-username"
                    type="text"
                    required
                    placeholder="alex_rivera"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    id="input-displayname"
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="input-email"
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="input-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create InsForge Account' : 'Sign In to Nexora'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              InsForge JWT Auth
            </span>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Backend Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
