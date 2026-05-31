import { Settings, Droplets, Sun, Scissors, Check, Trophy, Waves, Leaf, Lock, Plus } from 'lucide-react';
import type { AuthUser, Quest, Badge } from '../types';
import { USER_AVATAR } from '../constants';

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
    <div className="relative z-10 p-6 pt-24 pb-32 max-w-4xl mx-auto">
      <header className="fixed top-0 left-0 w-full z-50 bg-botanical-bg/70 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-botanical-secondary/30 flex items-center justify-center bg-botanical-surface overflow-hidden shadow-lg shadow-botanical-primary/10">
            <img src={user?.avatar ?? USER_AVATAR} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-serif text-botanical-primary italic">Obsidian Grove</span>
        </div>
        <button onClick={onOpenProfile} className="text-botanical-primary hover:opacity-80 transition-opacity" title="Profile">
          <Settings className="w-6 h-6" />
        </button>
      </header>

      <section className="mt-8 space-y-4">
        <h1 className="font-serif text-5xl text-botanical-primary leading-tight">Good morning,<br />Botanist.</h1>
        <p className="text-botanical-on-surface-variant text-lg font-body">Your greenhouse is thriving. Let's tend to it.</p>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-botanical-primary">Daily Quests</h2>
          <span className="font-mono text-botanical-secondary text-xs uppercase tracking-widest">{quests.length} To Do</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {quests.map(quest => (
            <div key={quest.id} className="glass-card rounded-2xl p-5 flex items-center justify-between group transition-all hover:bg-botanical-surface-highest/40">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-botanical-surface-high flex items-center justify-center text-botanical-primary group-hover:scale-110 transition-transform">
                  {quest.icon === 'water' && <Droplets className="w-7 h-7" />}
                  {quest.icon === 'sun' && <Sun className="w-7 h-7" />}
                  {quest.icon === 'cut' && <Scissors className="w-7 h-7" />}
                </div>
                <div>
                  <h3 className="font-body font-semibold text-botanical-on-surface">{quest.title}</h3>
                  <p className="text-botanical-on-surface-variant text-sm">{quest.description}</p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-full border border-botanical-primary/40 flex items-center justify-center text-botanical-primary hover:bg-botanical-primary hover:text-botanical-bg transition-colors">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="font-serif text-2xl font-bold text-botanical-on-surface">Badges</h2>
          <button className="bg-botanical-surface-high text-botanical-primary px-4 py-2 rounded-xl font-bold text-xs tracking-widest hover:bg-botanical-surface transition-colors flex items-center gap-2">
            <Plus className="w-3 h-3" /> MORE
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`glass-card rounded-3xl p-6 flex flex-col justify-between aspect-square relative overflow-hidden ${badge.type === 'featured' ? 'bg-gradient-to-br from-botanical-surface-highest/50 to-botanical-primary-container/20' : 'opacity-80'}`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-botanical-primary-container/20 blur-[50px]" />
              <div className="space-y-4 relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${badge.type === 'featured' ? 'bg-botanical-primary/20 text-botanical-primary' : 'bg-botanical-surface-high text-botanical-outline'}`}>
                  {badge.icon === 'trophy' && <Trophy className="w-6 h-6" />}
                  {badge.icon === 'waves' && <Waves className="w-6 h-6" />}
                  {badge.icon === 'leaf' && <Leaf className="w-6 h-6" />}
                  {badge.icon === 'lock' && <Lock className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-serif text-lg text-botanical-primary">{badge.title}</h4>
                  <p className="text-botanical-on-surface-variant text-[10px] leading-relaxed">{badge.description}</p>
                </div>
              </div>
              <div className="mt-4 font-mono text-[9px] text-botanical-secondary tracking-widest uppercase relative z-10">
                {badge.earned ? 'Earned' : 'Locked'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
