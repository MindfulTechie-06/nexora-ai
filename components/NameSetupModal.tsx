'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '../lib/types';
import { updateAuthProfile } from '../lib/insforge';
import { User, Sparkles, AlertCircle, Loader2, ArrowRight, X } from 'lucide-react';

interface NameSetupModalProps {
  isOpen: boolean;
  initialDisplayName?: string;
  initialUsername?: string;
  onSuccess: (updatedProfile: Profile) => void;
  onClose?: () => void;
}

export default function NameSetupModal({
  isOpen,
  initialDisplayName = '',
  initialUsername = '',
  onSuccess,
  onClose,
}: NameSetupModalProps) {
  if (!isOpen) return null;

  return (
    <NameSetupModalDialog
      key={`${initialDisplayName}:${initialUsername}`}
      initialDisplayName={initialDisplayName}
      initialUsername={initialUsername}
      onSuccess={onSuccess}
      onClose={onClose}
    />
  );
}

function NameSetupModalDialog({
  initialDisplayName,
  initialUsername,
  onSuccess,
  onClose,
}: {
  initialDisplayName: string;
  initialUsername: string;
  onSuccess: (updatedProfile: Profile) => void;
  onClose?: () => void;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(Boolean(initialUsername));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayName(val);
    if (!isUsernameManuallyEdited) {
      const slug = val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      setUsername(slug);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUsernameManuallyEdited(true);
    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDisplay = displayName.trim();
    const cleanUser = username.trim().toLowerCase();

    if (!cleanDisplay) {
      setError('Please provide your display name.');
      return;
    }

    if (!cleanUser) {
      setError('Please choose a username.');
      return;
    }

    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUser)) {
      setError('Username may only contain lowercase letters, numbers, and underscores.');
      return;
    }

    setLoading(true);

    try {
      const res = await updateAuthProfile(cleanDisplay, cleanUser);

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (res.profile) {
        onSuccess(res.profile);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile name.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div
      id="name-setup-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-setup-title"
      className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-950/50 relative overflow-hidden my-auto transition-colors">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-indigo-500/15 dark:bg-indigo-500/20 blur-2xl pointer-events-none rounded-full" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer z-20"
            title="Close"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/25 mb-3 text-white">
            <User className="w-6 h-6" />
          </div>
          <h2 id="name-setup-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <span>Set Up Your Profile</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Choose your display name and unique handle for messaging and live presence.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Name Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* USERNAME Input */}
          <div>
            <label htmlFor="input-modal-username" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Unique Username (@handle)
            </label>
            <div className="relative">
              <input
                id="input-modal-username"
                type="text"
                required
                placeholder="alex_rivera"
                value={username}
                onChange={handleUsernameChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 font-mono transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Used for mentions, search, and direct chat links
            </p>
          </div>

          {/* DISPLAY NAME Input */}
          <div>
            <label htmlFor="input-modal-displayname" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              id="input-modal-displayname"
              type="text"
              required
              placeholder="Alex Rivera"
              value={displayName}
              onChange={handleDisplayNameChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              The full name shown in conversation headers and live presence
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              id="btn-modal-save-name"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save & Continue</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
