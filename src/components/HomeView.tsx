import { Settings, Droplets, Sun, Scissors, Check, Trophy, Waves, Leaf, Lock, Plus } from 'lucide-react';
import type { AuthUser, Quest, Badge } from '../types';
import { RootedLogo } from './RootedLogo';

export function HomeView({
  user,
  onOpenProfile,
}: {
  user: AuthUser | null;
  onOpenProfile: () => void;
}) {
  const quests: Quest[] = [
    { id: '1', title: 'Watering', description: 'Hydrate the Monstera', icon: 'water', color: 'primary', completed: false },
    { id: '2', title: 'Find Sunlight', description: 'Move the Succulents', icon: 'sun', color: 'secondary', completed: false },
    { id: '3', title: 'Tidy Up', description: 'Prune the Ficus', icon: 'cut', color: 'primary', completed: false },
  ];

  const badges: Badge[] = [
    { id: '1', title: 'Top Gardener', description: 'You cared for plants for 30 days straight!', icon: 'trophy', earned: true, type: 'featured' },
    { id: '2', title: 'Water Expert', description: 'Proper hydration levels maintained.', icon: 'waves', earned: true, type: 'standard' },
    { id: '3', title: 'Seedling', description: 'Just starting the journey.', icon: 'leaf', earned: true, type: 'standard' },
    { id: '4', title: 'Locked', description: 'Keep growing to unlock.', icon: 'lock', earned: false, type: 'locked' },
  ];

  return (
    <div className="relative z-10 p-6 pt-24 pb-36 max-w-2xl mx-auto">
      {/* ── Top nav: white bar with Starbucks triple shadow ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.10),0_2px_2px_rgba(0,0,0,0.06),0_0_2px_rgba(0,0,0,0.07)] flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2.5">
          <RootedLogo size={36} />
          <span className="text-xl font-bold text-botanical-primary tracking-tight">Rooted</span>
        </div>
        <button
          onClick={onOpenProfile}
          className="text-botanical-on-surface-variant hover:text-botanical-primary transition-colors"
          title="Profile"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* ── Hero ── */}
      <section className="mt-6 space-y-2">
        <h1 className="font-sans font-semibold text-5xl text-botanical-primary leading-tight tracking-tight">
          Good morning,<br />Botanist.
        </h1>
        <p className="text-botanical-on-surface-variant text-base">Your greenhouse is thriving. Let's tend to it.</p>
      </section>

      {/* ── Daily Quests ── */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-sans font-semibold text-2xl text-botanical-on-surface tracking-tight">Daily Quests</h2>
          <span className="text-botanical-on-surface-variant text-xs font-semibold uppercase tracking-widest">{quests.length} To Do</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {quests.map(quest => (
            <div
              key={quest.id}
              className="glass-card rounded-xl p-5 flex items-center justify-between hover:shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_4px_8px_rgba(0,0,0,0.08)] transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-botanical-secondary/10 flex items-center justify-center text-botanical-secondary flex-shrink-0">
                  {quest.icon === 'water' && <Droplets className="w-6 h-6" />}
                  {quest.icon === 'sun' && <Sun className="w-6 h-6" />}
                  {quest.icon === 'cut' && <Scissors className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-semibold text-botanical-on-surface text-sm">{quest.title}</h3>
                  <p className="text-botanical-on-surface-variant text-xs mt-0.5">{quest.description}</p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-full bg-botanical-light-green flex items-center justify-center text-botanical-secondary hover:bg-botanical-secondary hover:text-white active:scale-95 transition-all flex-shrink-0">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Badges — House Green feature band ── */}
      <section className="mt-10">
        <div className="bg-botanical-primary-container rounded-2xl overflow-hidden">
          <div className="px-6 py-7">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-2xl text-white tracking-tight">Badges</h2>
              <button className="bg-botanical-secondary text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all">
                <Plus className="w-3 h-3" /> More
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`rounded-xl p-5 flex flex-col min-h-[150px] ${
                    badge.type === 'featured'
                      ? 'border border-botanical-gold/50 bg-white/5'
                      : badge.earned
                      ? 'bg-white/5'
                      : 'bg-white/[0.03]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      badge.type === 'featured'
                        ? 'bg-botanical-gold/20 text-botanical-gold'
                        : badge.earned
                        ? 'bg-white/15 text-white/80'
                        : 'bg-white/5 text-white/20'
                    }`}
                  >
                    {badge.icon === 'trophy' && <Trophy className="w-5 h-5" />}
                    {badge.icon === 'waves' && <Waves className="w-5 h-5" />}
                    {badge.icon === 'leaf' && <Leaf className="w-5 h-5" />}
                    {badge.icon === 'lock' && <Lock className="w-5 h-5" />}
                  </div>
                  <div className="mt-3 flex-1">
                    <h4
                      className={`font-semibold text-sm leading-snug ${
                        badge.type === 'featured'
                          ? 'text-botanical-gold'
                          : badge.earned
                          ? 'text-white'
                          : 'text-white/25'
                      }`}
                    >
                      {badge.title}
                    </h4>
                    <p className={`text-[11px] mt-1 leading-relaxed ${badge.earned ? 'text-white/50' : 'text-white/20'}`}>
                      {badge.description}
                    </p>
                  </div>
                  <div className={`mt-3 text-[10px] font-semibold uppercase tracking-widest ${badge.earned ? 'text-botanical-secondary' : 'text-white/20'}`}>
                    {badge.earned ? 'Earned' : 'Locked'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
