import React, { useEffect, useState } from 'react';
import { Shield, Lock, ShieldCheck, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') !== 'error') return;
    const reason = params.get('reason');
    setError(reason === 'authorization_denied'
      ? 'Google sign-in was cancelled. Please try again.'
      : reason === 'gmail_not_configured'
        ? 'Google sign-in is not configured on the server.'
        : 'Google sign-in could not be completed. Please try again.');
    params.delete('auth');
    params.delete('reason');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, []);

  const handleGoogleLogin = () => {
    setError(null);
    // Clear the old demo bearer token so it cannot override the OAuth session cookie.
    try { localStorage.removeItem('emailguard_token'); } catch { /* storage may be unavailable */ }
    const signInWindow = window.open('/api/auth/google', '_blank');
    if (!signInWindow) {
      setError('Google sign-in tab was blocked. Allow pop-ups for localhost, then try again.');
      return;
    }
    signInWindow.opener = null;
    setIsRedirecting(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Background ambient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-300/40 p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 ring-4 ring-blue-50">
            <Shield className="w-7 h-7" />
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              <span>EmailGuard</span>
              <span className="text-blue-600 font-mono">.AI</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 tracking-wide uppercase font-mono">
              Intelligent Email Threat Detection & Security Platform
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto pt-1 font-sans">
            AI-powered, evidence-grounded threat analysis in a familiar Gmail client interface.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium text-center">
            {error}
          </div>
        )}

        {/* Primary Google Login Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isRedirecting}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-blue-50/50 text-slate-800 border border-slate-200 hover:border-blue-300 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
          >
            {isRedirecting ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            )}
            <span className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors">
              Continue with Google
            </span>
          </button>

          <p className="text-[11px] text-center text-slate-400 font-sans">
            Choose the Google account you want to use for EmailGuard.
          </p>
        </div>

        {/* Security & Privacy Guarantees */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Zero Password Policy: Passwords are never collected or stored.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>User Data Isolation: Your emails and threat reports are strictly private.</span>
          </div>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mt-6 text-center text-xs text-slate-400 font-mono">
        EmailGuard AI · Secure Threat Triage & XAI Analysis Platform
      </div>
    </div>
  );
};
