import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight, Droplets, Leaf, Loader2, ScanLine, Sun, Wind, Zap } from 'lucide-react';
import type { PlantResult } from '../types';

function formatScannedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently scanned';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function QuickFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-botanical-light-green/45 px-3 py-2">
      <div className="flex items-center gap-1.5 text-botanical-secondary">
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-1 text-xs font-semibold text-botanical-on-surface">{value || 'N/A'}</p>
    </div>
  );
}

export function LibraryView({ onOpenScanner }: { onOpenScanner: () => void }) {
  const [plants, setPlants] = useState<PlantResult[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;
    async function loadLibrary() {
      try {
        const res = await fetch('/api/library');
        if (!res.ok) throw new Error('Could not load your plant library.');
        const json = (await res.json()) as { plants?: PlantResult[] };
        if (!mounted) return;
        setPlants(json.plants ?? []);
        setExpandedId(json.plants?.[0]?.id ?? null);
        setStatus('ready');
      } catch {
        if (!mounted) return;
        setStatus('error');
      }
    }
    loadLibrary();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative z-10 p-6 pt-20 pb-36 max-w-2xl mx-auto">
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.10),0_2px_2px_rgba(0,0,0,0.06),0_0_2px_rgba(0,0,0,0.07)] px-6 py-4">
        <span className="text-xl font-bold text-botanical-primary tracking-tight">Library</span>
      </header>

      <section className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-botanical-secondary">Saved guides</p>
          <h1 className="mt-1 text-4xl font-semibold leading-tight text-botanical-primary tracking-tight">Plant Library</h1>
        </div>
        {status === 'ready' && (
          <span className="rounded-full bg-botanical-light-green px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-botanical-primary">
            {plants.length} saved
          </span>
        )}
      </section>

      {status === 'loading' && (
        <div className="mt-12 flex flex-col items-center gap-3 text-botanical-secondary">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-widest">Loading library</p>
        </div>
      )}

      {status === 'error' && (
        <div className="glass-card mt-10 rounded-xl p-6 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-botanical-outline" />
          <h2 className="mt-4 text-xl font-semibold text-botanical-primary">Library unavailable</h2>
          <p className="mt-2 text-sm leading-relaxed text-botanical-on-surface-variant">
            Your saved plant guides could not be loaded right now.
          </p>
        </div>
      )}

      {status === 'ready' && plants.length === 0 && (
        <div className="glass-card mt-10 rounded-xl p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-botanical-light-green text-botanical-secondary">
            <Leaf className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-botanical-primary">No saved plants yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-botanical-on-surface-variant">
            Scan a plant and Rooted will save its care guide here.
          </p>
          <button
            onClick={onOpenScanner}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-botanical-secondary px-5 py-2 text-sm font-semibold text-white active:scale-95 transition-all"
          >
            <ScanLine className="h-4 w-4" />
            Scan Plant
          </button>
        </div>
      )}

      {status === 'ready' && plants.length > 0 && (
        <div className="mt-6 space-y-3">
          {plants.map((plant, index) => {
            const expanded = expandedId === plant.id;
            const taskCount = plant.taskGroups.reduce((sum, group) => sum + group.tasks.length, 0);

            return (
              <motion.article
                key={`${plant.id}-${plant.jsonPath}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass-card overflow-hidden rounded-xl"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : plant.id)}
                  className="flex w-full items-center gap-4 p-4 text-left active:scale-[0.99] transition-all"
                  aria-expanded={expanded}
                >
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-botanical-surface-high">
                    {plant.imageSrc ? (
                      <img src={plant.imageSrc} alt={plant.plant} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-botanical-outline">
                        <Leaf className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-botanical-secondary">{formatScannedAt(plant.scannedAt)}</p>
                    <h2 className="mt-1 truncate text-lg font-bold text-botanical-primary">{plant.plant}</h2>
                    <p className="truncate text-xs italic text-botanical-on-surface-variant">{plant.scientificName}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-botanical-on-surface-variant">
                      {taskCount} care tasks
                    </p>
                  </div>
                  <ChevronRight className={`h-5 w-5 flex-shrink-0 text-botanical-outline transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>

                {expanded && (
                  <div className="border-t border-botanical-outline/10 px-4 pb-5 pt-4">
                    <p className="text-sm leading-relaxed text-botanical-on-surface-variant">{plant.description}</p>
                    {((plant.visualEvidence?.length ?? 0) > 0 || plant.diagnosticNotes) && (
                      <div className="mt-4 rounded-xl bg-botanical-surface px-3 py-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-botanical-secondary">Identification check</p>
                        {plant.visualEvidence?.slice(0, 3).map(item => (
                          <div key={item} className="flex items-start gap-2 text-xs leading-relaxed text-botanical-on-surface-variant">
                            <Leaf className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-botanical-secondary" />
                            <span>{item}</span>
                          </div>
                        ))}
                        {plant.diagnosticNotes && (
                          <p className="mt-2 text-xs leading-relaxed text-botanical-on-surface-variant">{plant.diagnosticNotes}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <QuickFact icon={<Zap className="h-3 w-3" />} label="Difficulty" value={plant.quickFacts.difficulty} />
                      <QuickFact icon={<Sun className="h-3 w-3" />} label="Light" value={plant.quickFacts.light} />
                      <QuickFact icon={<Droplets className="h-3 w-3" />} label="Water" value={plant.quickFacts.water} />
                      <QuickFact icon={<Wind className="h-3 w-3" />} label="Humidity" value={plant.quickFacts.humidity} />
                    </div>

                    {plant.tips.length > 0 && (
                      <div className="mt-5">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-botanical-secondary">Tips</p>
                        <div className="space-y-2">
                          {plant.tips.slice(0, 3).map(tip => (
                            <div key={tip} className="flex items-start gap-2 text-xs leading-relaxed text-botanical-on-surface-variant">
                              <Leaf className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-botanical-secondary" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
