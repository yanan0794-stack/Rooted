import { motion } from 'motion/react';
import { Sprout, Trophy, Star, Clapperboard, Bell, Shield, HelpCircle, ChevronRight, LogOut } from 'lucide-react';
import type { AuthUser } from '../types';
import { USER_AVATAR } from '../constants';

const PROVIDER_LABEL: Record<AuthUser['provider'], string> = {
  google: 'Google',
  apple: 'Apple',
  x: 'X',
  link: 'Magic Link',
  email: 'Email',
};

export function ProfileView({
  user,
  onLogout,
  onOpenGuide,
}: {
  user: AuthUser | null;
  onLogout: () => void;
  onOpenGuide: () => void;
}) {
  const stats = [
    { label: 'Plants', value: '7', icon: <Sprout className="w-5 h-5" /> },
    { label: 'Badges', value: '3', icon: <Trophy className="w-5 h-5" /> },
    { label: 'Streak', value: '30', icon: <Star className="w-5 h-5" /> },
  ];

  const settingsRows: { icon: React.ReactNode; label: string; onClick?: () => void }[] = [
    { icon: <Clapperboard className="w-5 h-5" />, label: 'Growing Guide', onClick: onOpenGuide },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications' },
    { icon: <Shield className="w-5 h-5" />, label: 'Privacy' },
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support' },
  ];

  return (
    <div className="relative z-10 p-6 pt-20 pb-36 max-w-md mx-auto">
      {/* ── White sticky header ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.10),0_2px_2px_rgba(0,0,0,0.06),0_0_2px_rgba(0,0,0,0.07)] px-6 py-4">
        <span className="text-xl font-bold text-botanical-primary tracking-tight">Profile</span>
      </header>

      {/* ── Avatar & identity ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 mt-6">
        <div className="w-24 h-24 rounded-full border-2 border-botanical-secondary/25 overflow-hidden shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_4px_8px_rgba(0,0,0,0.12)]">
          <img src={user?.avatar ?? USER_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h2 className="font-bold text-2xl text-botanical-primary tracking-tight">{user?.name ?? 'Botanist'}</h2>
          <p className="text-botanical-on-surface-variant text-sm mt-0.5">{user?.email}</p>
          {user?.provider && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-botanical-light-green text-botanical-primary text-[11px] font-semibold uppercase tracking-widest">
              via {PROVIDER_LABEL[user.provider]}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Stats row — three white cards ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3 mt-8">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="glass-card rounded-xl p-4 flex flex-col items-center gap-1.5">
            <div className="text-botanical-secondary">{icon}</div>
            <span className="font-bold text-2xl text-botanical-primary">{value}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-botanical-on-surface-variant">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Settings rows ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-botanical-on-surface-variant ml-1 mb-3">Settings</p>
        {settingsRows.map(({ icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="w-full glass-card rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_4px_8px_rgba(0,0,0,0.08)] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-4 text-botanical-on-surface">
              <span className="text-botanical-secondary">{icon}</span>
              <span className="font-semibold text-sm">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-botanical-outline" />
          </button>
        ))}
      </motion.div>

      {/* ── Sign out — outlined red pill ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 active:scale-[0.98] transition-all text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
