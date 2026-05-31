import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, ChevronRight, X } from 'lucide-react';
import { LEAF_DETAIL, SUCCULENT_MACRO } from '../constants';

// Paste a YouTube embed URL here to show a real video, e.g. https://www.youtube.com/embed/VIDEO_ID
const GROW_VIDEO_URL = '';

export function GrowingGuidePanel({ onDismiss }: { onDismiss: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { setPlaying(false); return 100; }
        return p + 0.2;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  const totalSecs = 342;
  const elapsed = Math.floor((progress / 100) * totalSecs);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-24 left-0 right-0 z-40 px-4 md:max-w-md md:left-1/2 md:-translate-x-1/2"
    >
      <div className="glass-card rounded-3xl overflow-hidden border border-botanical-outline/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setExpanded(e => !e)}>
            <img src={LEAF_DETAIL} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => !e)}>
            <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-secondary">Growing Guide</p>
            <p className="font-serif text-botanical-primary text-sm truncate">How to Grow Your Plants</p>
          </div>
          {!expanded && (
            <button
              onClick={() => { setExpanded(true); setPlaying(true); }}
              className="w-9 h-9 rounded-full bg-botanical-primary/20 flex items-center justify-center text-botanical-primary hover:bg-botanical-primary/30 transition-colors flex-shrink-0"
            >
              <Play className="w-4 h-4 ml-0.5" />
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)} className="w-8 h-8 flex items-center justify-center text-botanical-outline hover:text-botanical-on-surface transition-colors flex-shrink-0">
            <ChevronRight className={`w-5 h-5 transition-transform ${expanded ? '-rotate-90' : 'rotate-90'}`} />
          </button>
          <button onClick={onDismiss} className="w-8 h-8 flex items-center justify-center text-botanical-outline hover:text-botanical-on-surface transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded video + controls */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="relative mx-4 rounded-2xl overflow-hidden aspect-video bg-botanical-surface-high">
                {GROW_VIDEO_URL ? (
                  <iframe src={GROW_VIDEO_URL} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <div className="w-full h-full relative overflow-hidden">
                    <motion.img
                      src={SUCCULENT_MACRO}
                      alt="Growing Guide"
                      className="w-full h-full object-cover"
                      animate={playing ? { scale: 1.08 } : { scale: 1 }}
                      transition={{ duration: 30, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <button onClick={() => setPlaying(p => !p)} className="absolute inset-0 flex items-center justify-center">
                      <motion.div whileTap={{ scale: 0.9 }} className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        {playing ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-1" />}
                      </motion.div>
                    </button>
                    {playing && (
                      <div className="absolute bottom-3 left-4 flex items-center gap-2 pointer-events-none">
                        <div className="flex gap-[3px] items-end h-4">
                          {[0, 1, 2, 3].map(i => (
                            <motion.div
                              key={i}
                              className="w-1 bg-botanical-primary rounded-full"
                              animate={{ height: ['4px', `${10 + i * 4}px`, '4px'] }}
                              transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[9px] text-white/80 uppercase tracking-wider">Playing</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-4 py-4 space-y-3">
                <div className="space-y-1.5">
                  <div
                    className="w-full h-1.5 bg-botanical-surface-high rounded-full overflow-hidden cursor-pointer"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setProgress(((e.clientX - rect.left) / rect.width) * 100);
                    }}
                  >
                    <div className="h-full bg-botanical-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-botanical-outline">
                    <span>{fmt(elapsed)}</span>
                    <span>{fmt(totalSecs)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPlaying(p => !p)}
                    className="w-10 h-10 rounded-full bg-botanical-primary flex items-center justify-center text-botanical-bg shadow-lg shadow-botanical-primary/20 hover:bg-botanical-primary/90 transition-colors flex-shrink-0"
                  >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-botanical-on-surface text-sm font-medium truncate">How to Grow Your Plants</p>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-outline">Rooted · Growing Guide</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
