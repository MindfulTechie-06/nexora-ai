'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleOAuthCallback } from '../../../lib/insforge';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      // Check for OAuth error directly returned in query string
      const oauthError = searchParams.get('error') || searchParams.get('insforge_error');
      const errorDesc = searchParams.get('error_description');
      if (oauthError) {
        setStatus('error');
        setErrorMessage(errorDesc || oauthError || 'OAuth authentication was cancelled or rejected.');
        return;
      }

      // Check for authorization code
      const code = searchParams.get('insforge_code') || searchParams.get('code') || undefined;

      try {
        const { profile, error } = await handleOAuthCallback(code);

        if (error || !profile) {
          setStatus('error');
          setErrorMessage(error || 'Failed to complete OAuth authentication with InsForge.');
          return;
        }

        setStatus('success');
        // Brief pause to display success state before redirecting to chat
        setTimeout(() => {
          router.replace('/chat');
        }, 900);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred during OAuth processing.';
        setStatus('error');
        setErrorMessage(msg);
      }
    }

    processCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex items-center justify-center p-4 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
        {status === 'processing' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Completing Authentication</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Verifying your credentials and restoring your session with InsForge...
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authenticated!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Connecting you to Nexora AI Chat...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Failed</h2>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-2 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-2xl border border-rose-200 dark:border-rose-500/20 text-left">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/auth?mode=login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/25"
              >
                <span>Back to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
