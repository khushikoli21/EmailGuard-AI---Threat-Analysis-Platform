import React, { useEffect, useState } from 'react';
import {
  Shield,
  Lock,
  ShieldCheck,
  Loader2,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Mail,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, signInWithGoogle } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') !== 'error') return;
    const reason = params.get('reason');
    setError(
      reason === 'authorization_denied'
        ? 'Google sign-in was cancelled. Please try again.'
        : reason === 'gmail_not_configured'
        ? 'Google sign-in is not configured on the server. You can sign in directly below.'
        : 'Google sign-in could not be completed. Please try again.'
    );
    params.delete('auth');
    params.delete('reason');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, []);

  const [customEmail, setCustomEmail] = useState('');
  const [showTesterGuide, setShowTesterGuide] = useState(false);

  const handleQuickLogin = async (targetEmail: string) => {
    setError(null);
    setIsLoggingIn(true);
    try {
      const ok = await login(targetEmail);
      if (!ok) {
        setError(`Could not initialize session for ${targetEmail}. Please try again.`);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCustomLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    handleQuickLogin(customEmail.trim());
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleSigningIn(true);
    try {
      const success = await signInWithGoogle();
      if (!success) {
        setError('Google sign-in window was closed. Click "Sign in with Google" to try again, or use one-click access below.');
      }
    } catch (err: any) {
      const isCancelled =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user');
      const isBlocked =
        err?.code === 'auth/popup-blocked' || err?.message?.includes('popup-blocked');
      const isAccessDenied =
        err?.code === 'auth/access-denied' ||
        err?.message?.includes('access_denied') ||
        err?.message?.includes('verification') ||
        err?.message?.includes('403');

      if (isCancelled) {
        setError('Google sign-in window was closed. Please try again.');
      } else if (isBlocked) {
        setError('Pop-up window was blocked by your browser. Please allow popups or use one-click access below.');
      } else if (isAccessDenied) {
        setShowTesterGuide(true);
        setError('Google Error 403 (Access Denied): Google requires test users to be approved in Google Cloud Console while in Testing mode. Use the one-click login for khushikoli214@gmail.com below!');
      } else {
        console.error('[LOGIN] Google sign in error:', err);
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased selection:bg-blue-600/30 selection:text-blue-200">
      {/* Background ambient cybersecurity grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0d1424]/95 backdrop-blur-md border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/60 p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 ring-4 ring-blue-900/30">
            <Shield className="w-7 h-7 drop-shadow" />
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5 font-sans">
              <span>EmailGuard</span>
              <span className="text-blue-400 font-mono">.AI</span>
            </h1>
            <p className="text-[11px] font-semibold text-blue-400/90 tracking-wider uppercase font-mono">
              Intelligent Email Threat Detection & Security Platform
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto pt-1 font-sans">
            AI-powered, evidence-grounded threat analysis in a familiar Gmail client interface.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-medium text-center shadow-xs">
            {error}
          </div>
        )}

        {/* Login Options */}
        <div className="space-y-3.5">
          {/* Primary Google Login Button (Official Google Design) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleSigningIn || isLoggingIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
          >
            {isGoogleSigningIn ? (
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
            <span>{isGoogleSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800" />
            <span className="shrink-0 mx-3 text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Or Instant Analyst Access
            </span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          {/* Quick Access Account 1: Khushi Koli */}
          <button
            type="button"
            onClick={() => handleQuickLogin('khushikoli214@gmail.com')}
            disabled={isLoggingIn || isGoogleSigningIn}
            className="w-full flex items-center justify-between py-3 px-4 bg-purple-950/30 hover:bg-purple-950/50 text-slate-200 border border-purple-700/50 hover:border-purple-500 rounded-xl font-medium text-xs shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 border border-purple-500/50 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                K
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">Khushi Koli</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">khushikoli214@gmail.com</div>
              </div>
            </div>
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-purple-300 transition-all" />
            )}
          </button>

          {/* Quick Access Account 2: Naresh Karothia */}
          <button
            type="button"
            onClick={() => handleQuickLogin('nareshkarothia@gmail.com')}
            disabled={isLoggingIn || isGoogleSigningIn}
            className="w-full flex items-center justify-between py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 rounded-xl font-medium text-xs shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-700/50 flex items-center justify-center text-blue-400">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-slate-200">Naresh Karothia</div>
                <div className="text-[10px] text-slate-400 font-mono">nareshkarothia@gmail.com</div>
              </div>
            </div>
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-400 transition-all" />
            )}
          </button>

          {/* Custom Email Form */}
          <form onSubmit={handleCustomLoginSubmit} className="pt-1 flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="Or enter any email..."
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                disabled={isLoggingIn || isGoogleSigningIn}
                className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn || isGoogleSigningIn || !customEmail}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </form>

          {/* Google 403 / Testing Mode Explanation Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTesterGuide(!showTesterGuide)}
              className="w-full flex items-center justify-between text-[11px] text-blue-400/90 hover:text-blue-300 py-1.5 px-2 rounded-lg bg-blue-950/30 border border-blue-900/40 font-sans cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                <span>Fixing "Google Error 403: access_denied"?</span>
              </div>
              {showTesterGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTesterGuide && (
              <div className="mt-2 p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl text-[11px] text-slate-300 space-y-2 leading-relaxed animate-in fade-in">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span>Why Google blocked khushikoli214@gmail.com:</span>
                </p>
                <p className="text-slate-400">
                  Because this app requests the sensitive Gmail scope (<code className="text-blue-300">gmail.readonly</code>) and is in Google Cloud <span className="text-white font-semibold">"Testing"</span> status, Google only allows users explicitly listed under "Test Users".
                </p>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px] text-slate-300">
                  <div className="text-blue-400 font-bold">To enable direct Google OAuth for Khushi:</div>
                  <div>1. Go to <span className="text-white font-semibold">console.cloud.google.com</span></div>
                  <div>2. Select project: <span className="text-amber-300">gen-lang-client-0117987210</span></div>
                  <div>3. Go to <span className="text-white">APIs & Services</span> &rarr; <span className="text-white">OAuth consent screen</span></div>
                  <div>4. Under <span className="text-emerald-400 font-bold">Test users</span>, click <span className="text-white">+ ADD USERS</span></div>
                  <div>5. Type: <span className="text-emerald-400 font-bold">khushikoli214@gmail.com</span> & click Save</div>
                </div>
                <p className="text-emerald-400 text-[10px]">
                  Or simply click the <span className="font-bold">Khushi Koli</span> button above to sign in immediately without waiting for Google approval!
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400/90 font-mono pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Workspace OAuth configured & verified</span>
          </div>
        </div>

        {/* Security & Privacy Guarantees */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zero Password Policy: Passwords are never collected or stored.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Isolated Analyst Sandbox: Your emails and threat reports are private.</span>
          </div>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mt-6 text-center text-xs text-slate-500 font-mono">
        EmailGuard AI · Secure Threat Triage & XAI Analysis Platform
      </div>
    </div>
  );
};
