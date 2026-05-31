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
    { label: 'Day Streak', value: '30', icon: <Star className="w-5 h-5" /> },
  ];

  const settingsRows: { icon: React.ReactNode; label: string; onClick?: () => void }[] = [
    { icon: <Clapperboard className="w-5 h-5" />, label: 'Growing Guide', onClick: onOpenGuide },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications' },
    { icon: <Shield className="w-5 h-5" />, label: 'Privacy' },
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support' },
  ];

  return (
    <div className="relative z-10 p-6 pt-20 pb-36 max-w-md mx-auto">
      <header className="fixed top-0 left-0 w-full z-50 bg-botanical-bg/70 backdrop-blur-xl px-6 py-4">
        <span className="text-2xl font-serif text-botanical-primary italic">Profile</span>
      </header>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 mt-6">
        <div className="w-24 h-24 rounded-full border-2 border-botanical-primary/30 overflow-hidden shadow-xl shadow-botanical-primary/10">
          <img src={user?.avatar ?? USER_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h2 className="font-serif text-3xl text-botanical-primary">{user?.name ?? 'Botanist'}</h2>
          <p className="text-botanical-on-surface-variant font-body text-sm mt-0.5">{user?.email}</p>
          {user?.provider && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-botanical-surface-high border border-botanical-outline/10 font-mono text-[10px] uppercase tracking-widest text-botanical-secondary">
              via {PROVIDER_LABEL[user.provider]}
            </span>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3 mt-10">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex flex-col items-center gap-1">
            <div className="text-botanical-primary">{icon}</div>
            <span className="font-serif text-2xl text-botanical-primary">{value}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-botanical-outline">{label}</span>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-botanical-outline ml-1 mb-3">Settings</p>
        {settingsRows.map(({ icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="w-full glass-card rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-botanical-surface-highest/40 transition-colors"
          >
            <div className="flex items-center gap-4 text-botanical-on-surface">
              <span className="text-botanical-primary">{icon}</span>
              <span className="font-body text-sm">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-botanical-outline" />
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors font-body text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
