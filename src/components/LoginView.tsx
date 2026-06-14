import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import type { AuthUser } from '../types';
import { mockUser } from '../auth';
import { GoogleIcon, AppleIcon, XBrandIcon } from './AuthIcons';

export function LoginView({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [linkStep, setLinkStep] = useState<'idle' | 'input' | 'sent'>('idle');
  const [linkEmail, setLinkEmail] = useState('');

  const loginWithProvider = (provider: 'google' | 'apple' | 'x') => {
    if (loading) return;
    setLoading(provider);
    setTimeout(() => { onLogin(mockUser(provider)); }, 1400);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading('email');
    setTimeout(() => { onLogin(mockUser('email', formEmail || undefined)); }, 900);
  };

  const handleSendLink = () => {
    if (!linkEmail.trim() || loading) return;
    setLoading('link');
    setTimeout(() => {
      setLoading(null);
      setLinkStep('sent');
      setTimeout(() => { onLogin(mockUser('link', linkEmail)); }, 4000);
    }, 1000);
  };

  const inputClass =
    'w-full bg-white border border-botanical-outline rounded-lg px-4 py-3.5 text-botanical-on-surface placeholder:text-botanical-on-surface-variant focus:outline-none focus:border-botanical-secondary focus:ring-2 focus:ring-botanical-secondary/20 transition-all text-sm';

  const socialBtnClass =
    'flex items-center justify-center gap-3 bg-white border border-botanical-outline hover:bg-botanical-surface-high transition-colors py-3 rounded-full w-full text-sm font-semibold text-botanical-on-surface disabled:opacity-50 active:scale-[0.98]';

  return (
    <div className="relative z-10 flex flex-col min-h-screen bg-botanical-bg">
      <header className="p-6">
        <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_1px_1px_rgba(0,0,0,0.24)] hover:bg-botanical-surface-high transition-colors">
          <X className="w-5 h-5 text-botanical-on-surface-variant" />
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-full max-w-md">
          {/* Brand mark */}
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <span className="text-3xl font-bold text-botanical-primary tracking-tight">Rooted</span>
            <p className="text-botanical-on-surface-variant text-sm mt-2 leading-relaxed">
              Step back into the quiet hum of your indoor sanctuary.
            </p>
          </motion.div>

          {/* ── Main card ── */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="glass-panel p-7 rounded-2xl"
          >
            <form className="space-y-4" onSubmit={handleEmailSubmit}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-botanical-primary ml-0.5">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-botanical-primary ml-0.5">Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                />
              </div>

              {/* Primary CTA — Green Accent full-pill */}
              <button
                type="submit"
                disabled={!!loading}
                className="w-full bg-botanical-secondary text-white font-semibold text-base py-4 rounded-full shadow-sm hover:opacity-90 transition-all active:scale-[0.95] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading === 'email' && <Loader2 className="w-5 h-5 animate-spin" />}
                Sign In
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-2">
                <div className="flex-grow border-t border-botanical-outline" />
                <span className="mx-4 text-[11px] font-semibold uppercase tracking-widest text-botanical-on-surface-variant">or continue with</span>
                <div className="flex-grow border-t border-botanical-outline" />
              </div>

              {/* Social auth — outlined dark pills */}
              <div className="flex flex-col gap-2.5">
                <button type="button" disabled={!!loading} onClick={() => loginWithProvider('google')} className={socialBtnClass}>
                  {loading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </button>

                <button type="button" disabled={!!loading} onClick={() => loginWithProvider('apple')} className={socialBtnClass}>
                  {loading === 'apple' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AppleIcon />}
                  Continue with Apple
                </button>

                <button type="button" disabled={!!loading} onClick={() => loginWithProvider('x')} className={socialBtnClass}>
                  {loading === 'x' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XBrandIcon />}
                  Continue with X
                </button>

                {linkStep === 'idle' && (
                  <button type="button" disabled={!!loading} onClick={() => setLinkStep('input')} className={socialBtnClass}>
                    <Mail className="w-4 h-4" />
                    Continue with Magic Link
                  </button>
                )}

                {linkStep === 'input' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={linkEmail}
                        onChange={e => setLinkEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendLink()}
                        autoFocus
                        className="flex-1 bg-white border border-botanical-outline rounded-lg px-4 py-3 text-sm text-botanical-on-surface placeholder:text-botanical-on-surface-variant focus:outline-none focus:border-botanical-secondary focus:ring-2 focus:ring-botanical-secondary/20 transition-all"
                      />
                      <button
                        type="button"
                        disabled={!!loading || !linkEmail.trim()}
                        onClick={handleSendLink}
                        className="px-5 py-3 bg-botanical-secondary text-white rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2 hover:opacity-90"
                      >
                        {loading === 'link' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                      </button>
                    </div>
                    <button type="button" onClick={() => { setLinkStep('idle'); setLinkEmail(''); }} className="text-botanical-on-surface-variant text-xs font-semibold uppercase tracking-widest hover:text-botanical-on-surface transition-colors self-center">
                      Cancel
                    </button>
                  </div>
                )}

                {linkStep === 'sent' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 py-4">
                    <CheckCircle2 className="w-8 h-8 text-botanical-secondary" />
                    <p className="text-sm text-botanical-on-surface text-center">
                      Link sent to <span className="font-semibold text-botanical-primary">{linkEmail}</span>
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-botanical-on-surface-variant animate-pulse">Signing you in…</p>
                  </motion.div>
                )}
              </div>
            </form>
          </motion.div>

          {/* Footer links */}
          <footer className="mt-8 flex flex-col items-center gap-3">
            <a href="#" className="text-botanical-secondary font-semibold text-sm hover:underline underline-offset-4 decoration-botanical-secondary/40">
              Forgot password?
            </a>
            <div className="flex items-center gap-1.5 text-botanical-on-surface-variant text-sm">
              <span>New here?</span>
              <a href="#" className="font-semibold text-botanical-primary hover:underline underline-offset-4 decoration-botanical-primary/40">
                Join us
              </a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
