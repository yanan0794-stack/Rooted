import { useState } from 'react';
import {
  Settings,
  Droplets,
  Sun,
  Scissors,
  Check,
  Trophy,
  Waves,
  Leaf,
  Lock,
  Plus,
  Minus,
  Flame,
  Scan,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { AuthUser, Quest, Badge } from '../types';
import { ACHIEVEMENT_BADGES } from '../constants';
import { RootedLogo } from './RootedLogo';

const badgeIcons: Record<Badge['icon'], LucideIcon> = {
  trophy: Trophy,
  waves: Waves,
  leaf: Leaf,
  lock: Lock,
  sun: Sun,
  flame: Flame,
  scan: Scan,
  scissors: Scissors,
  shield: ShieldCheck,
};

function getBadgeProgress(badge: Badge) {
  return Math.min(100, Math.round((badge.progress / Math.max(badge.goal, 1)) * 100));
}

export function HomeView({
  user,
  onOpenProfile,
}: {
  user: AuthUser | null;
  onOpenProfile: () => void;
}) {
  const [showAllBadges, setShowAllBadges] = useState(false);

  const quests: Quest[] = [
    { id: '1', title: 'Watering', description: 'Hydrate the Monstera', icon: 'water', color: 'primary', completed: false },
    { id: '2', title: 'Find Sunlight', description: 'Move the Succulents', icon: 'sun', color: 'secondary', completed: false },
    { id: '3', title: 'Tidy Up', description: 'Prune the Ficus', icon: 'cut', color: 'primary', completed: false },
  ];

  const badges = showAllBadges ? ACHIEVEMENT_BADGES : ACHIEVEMENT_BADGES.slice(0, 4);
  const earnedBadgeCount = ACHIEVEMENT_BADGES.filter(badge => badge.earned).length;
  const activeBadgeCount = ACHIEVEMENT_BADGES.filter(badge => !badge.earned && badge.progress > 0).length;

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
              <button
                onClick={() => setShowAllBadges(current => !current)}
                className="bg-botanical-secondary text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all"
                aria-expanded={showAllBadges}
                aria-label={showAllBadges ? 'Show fewer badges' : 'Show all badges'}
              >
                {showAllBadges ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showAllBadges ? 'Less' : 'More'}
              </button>
            </div>
            {showAllBadges && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl bg-white/10 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Earned</p>
                  <p className="text-xl font-bold text-white mt-0.5">{earnedBadgeCount}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Active</p>
                  <p className="text-xl font-bold text-white mt-0.5">{activeBadgeCount}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Total</p>
                  <p className="text-xl font-bold text-white mt-0.5">{ACHIEVEMENT_BADGES.length}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map(badge => {
                const BadgeIcon = badgeIcons[badge.icon];
                const progress = getBadgeProgress(badge);
                const isLocked = badge.type === 'locked';
                const statusLabel = badge.earned ? 'Earned' : isLocked ? 'Locked' : 'In Progress';

                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl p-5 flex flex-col min-h-[176px] transition-all ${
                      badge.type === 'featured'
                        ? 'border border-botanical-gold/50 bg-white/5'
                        : isLocked
                        ? 'bg-white/[0.03]'
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                          badge.type === 'featured'
                            ? 'bg-botanical-gold/20 text-botanical-gold'
                            : badge.earned
                            ? 'bg-white/15 text-white/85'
                            : isLocked
                            ? 'bg-white/5 text-white/25'
                            : 'bg-botanical-secondary/20 text-white'
                        }`}
                      >
                        <BadgeIcon className="w-5 h-5" />
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                          badge.type === 'featured'
                            ? 'bg-botanical-gold/15 text-botanical-gold'
                            : badge.earned
                            ? 'bg-white/10 text-white/70'
                            : isLocked
                            ? 'bg-white/5 text-white/25'
                            : 'bg-botanical-secondary/20 text-botanical-light-green'
                        }`}
                      >
                        {badge.level}
                      </span>
                    </div>
                    <div className="mt-3 flex-1">
                      <h4
                        className={`font-semibold text-sm leading-snug ${
                          badge.type === 'featured'
                            ? 'text-botanical-gold'
                            : isLocked
                            ? 'text-white/30'
                            : 'text-white'
                        }`}
                      >
                        {badge.title}
                      </h4>
                      <p className={`text-[11px] mt-1 leading-relaxed ${isLocked ? 'text-white/22' : 'text-white/55'}`}>
                        {badge.description}
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-start justify-between gap-2 text-[10px] font-semibold uppercase tracking-widest">
                        <span
                          className={
                            badge.earned
                              ? 'text-botanical-secondary'
                              : isLocked
                              ? 'text-white/25'
                              : 'text-botanical-light-green'
                          }
                        >
                          {statusLabel}
                        </span>
                        <span className={`${isLocked ? 'text-white/25' : 'text-white/50'} max-w-[58%] text-right normal-case tracking-normal leading-snug`}>
                          {badge.result}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            badge.type === 'featured' ? 'bg-botanical-gold' : isLocked ? 'bg-white/20' : 'bg-botanical-secondary'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
