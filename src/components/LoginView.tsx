import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import type { AuthUser } from '../types';
import { mockUser } from '../auth';
import { LEAF_DETAIL, SUCCULENT_MACRO } from '../constants';
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

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      <header className="p-6">
        <button className="p-2 rounded-full hover:bg-botanical-surface transition-colors">
          <X className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-full max-w-md">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-body text-botanical-on-surface-variant text-lg text-center max-w-[280px] mx-auto leading-relaxed mb-8"
          >
            Step back into the quiet hum of your indoor sanctuary.
          </motion.p>

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-8 rounded-[40px] border border-botanical-outline/10 shadow-2xl"
          >
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-botanical-primary ml-1">Identity</label>
                <input
                  type="email"
                  placeholder="Email address"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full bg-botanical-surface-highest/30 border-none rounded-xl px-4 py-4 text-botanical-on-surface placeholder:text-botanical-outline focus:ring-1 focus:ring-botanical-primary/40 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-botanical-primary ml-1">Key</label>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-botanical-surface-highest/30 border-none rounded-xl px-4 py-4 text-botanical-on-surface placeholder:text-botanical-outline focus:ring-1 focus:ring-botanical-primary/40 transition-all outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!!loading}
                className="w-full bg-gradient-to-br from-botanical-primary to-botanical-primary-container text-botanical-primary-container font-serif italic text-xl py-5 rounded-xl shadow-lg hover:shadow-botanical-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading === 'email' && <Loader2 className="w-5 h-5 animate-spin" />}
                Enter Grove
              </button>

              <div className="relative flex items-center justify-center py-4">
                <div className="flex-grow border-t border-botanical-outline/10" />
                <span className="mx-4 font-mono text-[10px] uppercase tracking-widest text-botanical-outline">or continue with</span>
                <div className="flex-grow border-t border-botanical-outline/10" />
              </div>

              <div className="flex flex-col gap-3">
                <button type="button" disabled={!!loading} onClick={() => loginWithProvider('google')} className="flex items-center justify-center gap-3 bg-botanical-surface-high/50 hover:bg-botanical-surface-highest transition-colors border border-botanical-outline/10 py-3 rounded-xl w-full text-sm font-body disabled:opacity-60">
                  {loading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </button>

                <button type="button" disabled={!!loading} onClick={() => loginWithProvider('apple')} className="flex items-center justify-center gap-3 bg-botanical-surface-high/50 hover:bg-botanical-surface-highest transition-colors border border-botanical-outline/10 py-3 rounded-xl w-full text-sm font-body disabled:opacity-60">
                  {loading === 'apple' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AppleIcon />}
                  Continue with Apple
                </button>

                <button type="button" disabled={!!loading} onClick={() => loginWithProvider('x')} className="flex items-center justify-center gap-3 bg-botanical-surface-high/50 hover:bg-botanical-surface-highest transition-colors border border-botanical-outline/10 py-3 rounded-xl w-full text-sm font-body disabled:opacity-60">
                  {loading === 'x' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XBrandIcon />}
                  Continue with X
                </button>

                {linkStep === 'idle' && (
                  <button type="button" disabled={!!loading} onClick={() => setLinkStep('input')} className="flex items-center justify-center gap-3 bg-botanical-surface-high/50 hover:bg-botanical-surface-highest transition-colors border border-botanical-outline/10 py-3 rounded-xl w-full text-sm font-body disabled:opacity-60">
                    <Mail className="w-4 h-4" />
                    Continue with Link
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
                        className="flex-1 bg-botanical-surface-highest/30 border border-botanical-outline/20 rounded-xl px-4 py-3 text-sm text-botanical-on-surface placeholder:text-botanical-outline focus:ring-1 focus:ring-botanical-primary/40 transition-all outline-none"
                      />
                      <button
                        type="button"
                        disabled={!!loading || !linkEmail.trim()}
                        onClick={handleSendLink}
                        className="px-4 py-3 bg-botanical-primary/20 hover:bg-botanical-primary/30 border border-botanical-primary/30 rounded-xl text-botanical-primary text-sm font-body transition-colors disabled:opacity-40 flex items-center gap-2"
                      >
                        {loading === 'link' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                      </button>
                    </div>
                    <button type="button" onClick={() => { setLinkStep('idle'); setLinkEmail(''); }} className="text-botanical-outline text-xs font-mono uppercase tracking-widest hover:text-botanical-on-surface transition-colors self-center">
                      Cancel
                    </button>
                  </div>
                )}

                {linkStep === 'sent' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 py-4">
                    <CheckCircle2 className="w-8 h-8 text-botanical-primary" />
                    <p className="font-body text-sm text-botanical-on-surface text-center">
                      Link sent to <span className="text-botanical-primary">{linkEmail}</span>
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-botanical-outline animate-pulse">Signing you in…</p>
                  </motion.div>
                )}
              </div>
            </form>
          </motion.div>

          <footer className="mt-12 flex flex-col items-center space-y-4">
            <a href="#" className="font-serif italic text-botanical-secondary hover:text-botanical-primary transition-colors text-lg underline decoration-botanical-outline/20 underline-offset-4">Forgot password?</a>
            <div className="flex items-center gap-2 text-botanical-on-surface-variant font-body">
              <span>New here?</span>
              <a href="#" className="font-serif italic text-botanical-on-surface hover:text-botanical-secondary transition-colors underline underline-offset-4 decoration-botanical-primary/20">Join us</a>
            </div>
          </footer>
        </div>
      </main>

      <div className="absolute bottom-12 left-12 hidden lg:block opacity-30 select-none pointer-events-none">
        <img src={LEAF_DETAIL} alt="" className="w-64 h-80 object-cover rounded-full mix-blend-screen" />
      </div>
      <div className="absolute top-24 right-12 hidden lg:block opacity-20 select-none pointer-events-none">
        <img src={SUCCULENT_MACRO} alt="" className="w-48 h-48 object-cover rounded-full mix-blend-screen transform rotate-12" />
      </div>
    </div>
  );
}
