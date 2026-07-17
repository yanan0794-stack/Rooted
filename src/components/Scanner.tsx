import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Shield, Camera, Bolt, Leaf, Check, Sun, Droplets, Wind, Zap, Play, Pause, Clapperboard, BadgeCheck, Volume2 } from 'lucide-react';
import type { PlantResult, VideoGuideScene } from '../types';
import { SUCCULENT_MACRO } from '../constants';

const MAX_SCAN_EDGE = 1440;
const SCAN_JPEG_QUALITY = 0.82;

function fitDimensions(width: number, height: number, maxEdge = MAX_SCAN_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function resizeImageData(data: string) {
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const size = fitDimensions(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        resolve(data);
        return;
      }

      context.drawImage(image, 0, 0, size.width, size.height);
      resolve(canvas.toDataURL('image/jpeg', SCAN_JPEG_QUALITY));
    };
    image.onerror = () => resolve(data);
    image.src = data;
  });
}

function captureVideoFrame(video: HTMLVideoElement) {
  const size = fitDimensions(video.videoWidth, video.videoHeight);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d', { alpha: false });
  context?.translate(canvas.width, 0);
  context?.scale(-1, 1);
  context?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', SCAN_JPEG_QUALITY);
}

function QuickFactCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-botanical-surface rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-botanical-secondary w-3 h-3">{icon}</span>
        <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-outline">{label}</p>
      </div>
      <p className="font-body text-xs text-botanical-on-surface font-medium">{value || '—'}</p>
    </div>
  );
}

function fallbackVideoScenes(result: PlantResult): VideoGuideScene[] {
  const lightTask = result.taskGroups.find(group => group.category === 'Light')?.tasks[0];
  const waterTask = result.taskGroups.find(group => group.category === 'Watering')?.tasks[0];
  const careTask = result.taskGroups.find(group => group.tasks.length > 0)?.tasks[0];

  return [
    {
      title: `Meet ${result.plant}`,
      caption: result.description,
      detail: result.scientificName,
      duration: 7,
    },
    {
      title: 'Light',
      caption: result.quickFacts.light || 'Place it where the light matches its natural habit.',
      detail: lightTask?.detail ?? '',
      duration: 6,
    },
    {
      title: 'Water',
      caption: result.quickFacts.water || 'Check the soil before watering.',
      detail: waterTask?.detail ?? '',
      duration: 6,
    },
    {
      title: 'Care Rhythm',
      caption: result.tips[0] || careTask?.detail || 'Keep care steady and adjust with the season.',
      detail: careTask?.frequency ?? '',
      duration: 6,
    },
  ].filter(scene => scene.caption);
}

function formatVideoTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function AiVideoGuide({ result }: { result: PlantResult }) {
  const scenes = useMemo(() => {
    const guideScenes = result.videoGuide?.scenes?.filter(scene => scene.title && scene.caption) ?? [];
    return guideScenes.length ? guideScenes : fallbackVideoScenes(result);
  }, [result]);
  const totalDuration = useMemo(() => scenes.reduce((sum, scene) => sum + (scene.duration || 6), 0), [scenes]);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voiceMode, setVoiceMode] = useState<'idle' | 'loading' | 'elevenlabs' | 'browser' | 'setup'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const elevenLabsEnabledRef = useRef<boolean | null>(null);
  const lastSpokenIndexRef = useRef(-1);
  const playbackTokenRef = useRef(0);

  useEffect(() => {
    setElapsed(0);
    setPlaying(false);
    setVoiceMode('idle');
    elevenLabsEnabledRef.current = null;
    playbackTokenRef.current += 1;
    lastSpokenIndexRef.current = -1;
    try { audioSourceRef.current?.stop(); } catch {}
    audioSourceRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [result.id]);

  useEffect(() => {
    if (!playing || totalDuration <= 0) return;
    const id = window.setInterval(() => {
      setElapsed(current => {
        const next = current + 0.1;
        if (next >= totalDuration) {
          playbackTokenRef.current += 1;
          try { audioSourceRef.current?.stop(); } catch {}
          audioSourceRef.current = null;
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          setVoiceMode('idle');
          setPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, totalDuration]);

  let sceneStart = 0;
  let activeIndex = 0;
  for (let index = 0; index < scenes.length; index += 1) {
    const duration = scenes[index].duration || 6;
    if (elapsed <= sceneStart + duration || index === scenes.length - 1) {
      activeIndex = index;
      break;
    }
    sceneStart += duration;
  }

  const activeScene = scenes[activeIndex] ?? scenes[0];
  const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  const getAudioContext = () => {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;
    if (context.state === 'suspended') void context.resume();
    return context;
  };

  const playAudioCue = () => {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.14);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
  };

  const sceneText = (scene: VideoGuideScene) =>
    `${scene.title}. ${scene.caption}${scene.detail ? `. ${scene.detail}` : ''}`;

  const stopNarration = () => {
    playbackTokenRef.current += 1;
    try { audioSourceRef.current?.stop(); } catch {}
    audioSourceRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setVoiceMode('idle');
  };

  const speakWithBrowserVoice = (index: number) => {
    const scene = scenes[index];
    if (!scene) return;
    lastSpokenIndexRef.current = index;

    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sceneText(scene));
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find(voice => voice.lang.toLowerCase().startsWith('en') && /samantha|ava|victoria|zira|jenny|aria|rachel|female|girl/i.test(voice.name)) ??
      voices.find(voice => voice.lang.toLowerCase().startsWith('en')) ??
      null;
    utterance.rate = 0.9;
    utterance.pitch = 1.08;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();
    setVoiceMode('browser');
  };

  const ensureElevenLabsEnabled = async () => {
    if (elevenLabsEnabledRef.current !== null) return elevenLabsEnabledRef.current;

    try {
      const res = await fetch('/api/narrate');
      const json = await res.json().catch(() => null);
      const enabled = Boolean(json?.enabled);
      elevenLabsEnabledRef.current = enabled;
      return enabled;
    } catch {
      elevenLabsEnabledRef.current = false;
      return false;
    }
  };

  const playElevenLabsAudio = async (index: number, token: number) => {
    const scene = scenes[index];
    const context = getAudioContext();
    if (!scene || !context) return false;
    if (!(await ensureElevenLabsEnabled())) {
      setVoiceMode('setup');
      return false;
    }

    const text = sceneText(scene);
    let buffer = audioCacheRef.current.get(text);
    if (!buffer) {
      const res = await fetch('/api/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return false;
      if (!res.headers.get('Content-Type')?.includes('audio/')) {
        const json = await res.json().catch(() => null);
        if (json?.enabled === false) {
          elevenLabsEnabledRef.current = false;
          setVoiceMode('setup');
        }
        return false;
      }
      buffer = await context.decodeAudioData(await res.arrayBuffer());
      audioCacheRef.current.set(text, buffer);
    }

    if (token !== playbackTokenRef.current) return true;

    try { audioSourceRef.current?.stop(); } catch {}
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
    audioSourceRef.current = source;
    lastSpokenIndexRef.current = index;
    setVoiceMode('elevenlabs');
    return true;
  };

  const playSceneNarration = async (index: number, token: number) => {
    lastSpokenIndexRef.current = index;
    setVoiceMode('loading');
    playAudioCue();

    const playedElevenLabs = await playElevenLabsAudio(index, token).catch(() => false);
    if (token !== playbackTokenRef.current) return;
    if (!playedElevenLabs) speakWithBrowserVoice(index);
  };

  const togglePlayback = () => {
    if (playing) {
      stopNarration();
      setPlaying(false);
      return;
    }

    const restart = elapsed >= totalDuration;
    const sceneIndex = restart ? 0 : activeIndex;
    if (restart) setElapsed(0);
    const token = playbackTokenRef.current + 1;
    playbackTokenRef.current = token;
    setPlaying(true);
    void playSceneNarration(sceneIndex, token);
  };

  useEffect(() => {
    if (!playing || lastSpokenIndexRef.current === activeIndex) return;
    const token = playbackTokenRef.current + 1;
    playbackTokenRef.current = token;
    try { audioSourceRef.current?.stop(); } catch {}
    audioSourceRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    void playSceneNarration(activeIndex, token);
  }, [playing, activeIndex]);

  useEffect(() => {
    return () => {
      playbackTokenRef.current += 1;
      try { audioSourceRef.current?.stop(); } catch {}
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      void audioContextRef.current?.close();
    };
  }, []);

  if (!activeScene) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-botanical-primary-container text-white shadow-lg">
      <div className="relative aspect-video overflow-hidden">
        <motion.img
          src={result.imageSrc}
          alt={result.plant}
          className="h-full w-full object-cover"
          animate={playing ? { scale: 1.18, x: activeIndex % 2 === 0 ? '-5%' : '5%', y: activeIndex % 3 === 0 ? '-3%' : '2%' } : { scale: 1.02, x: '0%', y: '0%' }}
          transition={{ duration: Math.max(6, activeScene.duration || 6), ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />
        {playing && (
          <>
            <motion.div
              className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['0%', '430%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-32 w-44 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-botanical-primary/70 shadow-[0_0_28px_rgba(149,212,179,0.45)]"
              animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        )}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
          <Clapperboard className="h-3.5 w-3.5 text-botanical-primary" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest">AI Video Guide</span>
        </div>
        {playing && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
            <Volume2 className="h-3.5 w-3.5 text-botanical-primary" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
              {voiceMode === 'elevenlabs' ? 'ElevenLabs' : voiceMode === 'loading' ? 'Loading Voice' : voiceMode === 'setup' ? 'Browser Voice' : 'Narrating'}
            </span>
          </div>
        )}
        <button
          onClick={togglePlayback}
          className={`absolute inset-0 z-10 ${playing ? 'cursor-pointer' : 'flex items-center justify-center'}`}
          title={playing ? 'Pause video guide' : 'Play video guide'}
          aria-label={playing ? 'Pause video guide' : 'Play video guide'}
        >
          {!playing && (
            <motion.span
              whileTap={{ scale: 0.9 }}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/50 backdrop-blur-md"
            >
              <Play className="ml-1 h-7 w-7" />
            </motion.span>
          )}
        </button>
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeIndex}-${activeScene.title}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              <p className="font-serif text-lg leading-tight">{activeScene.title}</p>
              <p className="font-body text-sm leading-snug text-white/90">{activeScene.caption}</p>
              {activeScene.detail && (
                <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-light-green">{activeScene.detail}</p>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {scenes.map((scene, index) => (
              <div
                key={`${scene.title}-${index}`}
                className={`h-1.5 rounded-full ${index <= activeIndex ? 'bg-botanical-primary' : 'bg-white/25'}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="bg-botanical-surface px-4 py-3 text-botanical-on-surface">
        <div
          className="h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-botanical-surface-high"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setElapsed(Math.max(0, Math.min(totalDuration, ((event.clientX - rect.left) / rect.width) * totalDuration)));
          }}
        >
          <div className="h-full rounded-full bg-botanical-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            onClick={togglePlayback}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-botanical-primary text-white"
            title={playing ? 'Pause video guide' : 'Play video guide'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-botanical-primary">{result.videoGuide?.title || `${result.plant} AI Care Video`}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-outline">
              Scene {activeIndex + 1}/{scenes.length}
            </p>
          </div>
          <span className="font-mono text-[9px] text-botanical-outline">{formatVideoTime(elapsed)} / {formatVideoTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}

function PlantResultPanel({
  result,
  onDismiss,
  onToggle,
}: {
  result: PlantResult;
  onDismiss: () => void;
  onToggle: (groupIdx: number, taskId: string) => void;
}) {
  const totalTasks = result.taskGroups.reduce((sum, g) => sum + g.tasks.length, 0);
  const doneCount = result.taskGroups.reduce((sum, g) => sum + g.tasks.filter(t => t.done).length, 0);
  const confidence = Math.round((result.confidence || 0) * 100);
  const visualEvidence = result.visualEvidence?.filter(Boolean).slice(0, 3) ?? [];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="absolute inset-x-0 bottom-0 z-30 max-h-[90%] overflow-y-auto bg-botanical-bg rounded-t-[40px] border-t border-botanical-outline/10 shadow-2xl"
    >
      <div className="sticky top-0 bg-botanical-bg rounded-t-[40px] flex justify-center pt-3 pb-1 z-10">
        <div className="w-10 h-1 rounded-full bg-botanical-surface-high" />
      </div>

      <div className="px-6 pb-12">
        {/* Plant header */}
        <div className="flex items-start gap-4 mt-3 mb-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
            <img src={result.imageSrc} alt={result.plant} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-secondary mb-1">Identified plant</p>
            <h2 className="font-serif text-xl text-botanical-primary leading-tight">{result.plant}</h2>
            <p className="font-mono text-[10px] text-botanical-outline italic mb-1">{result.scientificName}</p>
            <p className="font-body text-xs text-botanical-on-surface-variant leading-relaxed">{result.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-botanical-light-green px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-botanical-primary">
                <BadgeCheck className="h-3 w-3" />
                {confidence}% confidence
              </span>
              {result.alternatives.slice(0, 1).map(alternative => (
                <span key={alternative} className="rounded-full bg-botanical-surface-high px-2.5 py-1 text-[10px] font-semibold text-botanical-on-surface-variant">
                  Alt: {alternative}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onDismiss} className="w-8 h-8 rounded-full bg-botanical-surface-high flex items-center justify-center flex-shrink-0">
            <X className="w-4 h-4 text-botanical-outline" />
          </button>
        </div>

        {/* Quick facts grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <QuickFactCard icon={<Zap className="w-3 h-3" />} label="Difficulty" value={result.quickFacts.difficulty} />
          <QuickFactCard icon={<Sun className="w-3 h-3" />} label="Light" value={result.quickFacts.light} />
          <QuickFactCard icon={<Droplets className="w-3 h-3" />} label="Water" value={result.quickFacts.water} />
          <QuickFactCard icon={<Wind className="w-3 h-3" />} label="Humidity" value={result.quickFacts.humidity} />
        </div>

        {(visualEvidence.length > 0 || result.diagnosticNotes) && (
          <div className="mb-6 rounded-xl bg-botanical-surface px-4 py-3">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-botanical-secondary">Identification check</p>
            {visualEvidence.length > 0 && (
              <div className="space-y-1.5">
                {visualEvidence.map(item => (
                  <div key={item} className="flex items-start gap-2 text-xs leading-relaxed text-botanical-on-surface-variant">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-botanical-secondary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
            {result.diagnosticNotes && (
              <p className="mt-2 text-xs leading-relaxed text-botanical-on-surface-variant">{result.diagnosticNotes}</p>
            )}
          </div>
        )}

        <AiVideoGuide result={result} />

        {/* Care guide header */}
        <div className="flex items-baseline justify-between mb-5">
          <h3 className="font-serif text-2xl text-botanical-primary">Care Guide</h3>
          <span className="font-mono text-[9px] uppercase tracking-widest text-botanical-secondary">
            {doneCount}/{totalTasks} done
          </span>
        </div>

        {/* Task groups */}
        <div className="space-y-7">
          {result.taskGroups.map((group, gi) => (
            <div key={group.category}>
              <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-secondary mb-2 pl-1">
                {group.category}
              </p>
              <div className="space-y-2">
                {group.tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => onToggle(gi, task.id)}
                    className="w-full flex items-start gap-3 p-4 rounded-2xl glass-card text-left transition-all active:scale-[0.98]"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${task.done ? 'bg-botanical-primary border-botanical-primary' : 'border-botanical-outline/40'}`}>
                      {task.done && <Check className="w-3 h-3 text-botanical-bg" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-body text-sm font-semibold leading-snug ${task.done ? 'line-through text-botanical-outline' : 'text-botanical-on-surface'}`}>
                        {task.title}
                      </p>
                      <p className={`font-body text-xs mt-1 leading-relaxed ${task.done ? 'text-botanical-outline/60' : 'text-botanical-on-surface-variant'}`}>
                        {task.detail}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-secondary mt-1.5">
                        {task.frequency}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pro tips */}
        {result.tips.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-secondary mb-3 pl-1">Pro Tips</p>
            <div className="space-y-2">
              {result.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-botanical-primary-container/20">
                  <Leaf className="w-4 h-4 text-botanical-primary flex-shrink-0 mt-0.5" />
                  <p className="font-body text-xs text-botanical-on-surface-variant leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ScannerView({ onBack }: { onBack: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<'loading' | 'active' | 'denied' | 'error'>('loading');
  const [phase, setPhase] = useState<'idle' | 'saving' | 'analyzing' | 'done' | 'retry' | 'error'>('idle');
  const [result, setResult] = useState<PlantResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (mounted) setCamState('active');
      } catch (err) {
        if (!mounted) return;
        const name = (err as DOMException)?.name;
        setCamState(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error');
      }
    }
    startCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  const showRetryMessage = (message: string) => {
    setErrorMessage(message);
    setPhase('retry');
    setTimeout(() => setPhase('idle'), 4500);
  };

  const handleImageData = async (data: string, filename: string) => {
    setErrorMessage('');
    setPhase('analyzing');
    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: data, filename }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = typeof json?.error === 'string' ? json.error : 'Plant identification failed';
        if (res.status === 422) {
          showRetryMessage(message);
          return;
        }
        throw new Error(message);
      }
      if (json?.ok === false) {
        showRetryMessage(typeof json.error === 'string' ? json.error : 'Try another clear plant photo.');
        return;
      }

      setResult({
        id: json.id,
        scannedAt: json.scannedAt,
        plant: json.plant,
        scientificName: json.scientificName,
        description: json.description,
        imageUrl: json.imageUrl,
        imageSrc: data,
        jsonPath: json.jsonPath,
        confidence: typeof json.confidence === 'number' ? json.confidence : 0,
        alternatives: Array.isArray(json.alternatives) ? json.alternatives : [],
        visualEvidence: Array.isArray(json.visualEvidence) ? json.visualEvidence : [],
        diagnosticNotes: typeof json.diagnosticNotes === 'string' ? json.diagnosticNotes : '',
        quickFacts: json.quickFacts ?? { difficulty: '', light: '', water: '', humidity: '' },
        taskGroups: (json.taskGroups ?? []).map((group: any, gi: number) => ({
          category: group.category,
          tasks: (group.tasks ?? []).map((task: any, ti: number) => ({
            id: `${gi}-${ti}`,
            title: task.title,
            detail: task.detail,
            frequency: task.frequency,
            done: false,
          })),
        })),
        tips: json.tips ?? [],
        videoGuide: json.videoGuide ?? { title: `${json.plant ?? 'Plant'} AI Care Video`, scenes: [] },
      });
      setPhase('done');
    } catch (err) {
      console.error('Plant ID failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Plant identification failed');
      setPhase('error');
      setTimeout(() => setPhase('idle'), 5000);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || camState !== 'active' || phase !== 'idle') return;
    handleImageData(captureVideoFrame(video), `plant_${Date.now()}.jpg`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    handleImageData(await resizeImageData(data), file.name);
  };

  const toggleTask = (groupIdx: number, taskId: string) =>
    setResult(prev =>
      prev
        ? {
            ...prev,
            taskGroups: prev.taskGroups.map((g, gi) =>
              gi === groupIdx
                ? { ...g, tasks: g.tasks.map(t => (t.id === taskId ? { ...t, done: !t.done } : t)) }
                : g
            ),
          }
        : null
    );

  const busy = phase !== 'idle' && phase !== 'done';

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a110d] flex flex-col">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <header className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full ${camState === 'active' ? 'bg-botanical-primary animate-pulse' : 'bg-white/30'}`} />
          <span className="font-mono text-[10px] uppercase tracking-widest">
            {phase === 'analyzing' ? 'Identifying Plant…' : phase === 'saving' ? 'Saving…' : phase === 'retry' ? 'Try Another Scan' : camState === 'loading' ? 'Starting Camera…' : camState === 'active' ? 'Digital Greenhouse' : 'Camera Unavailable'}
          </span>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-grow relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
          className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-500 ${camState === 'active' ? 'opacity-100' : 'opacity-0'}`}
        />

        {camState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-botanical-primary animate-spin" />
          </div>
        )}
        {camState === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-10 text-center">
            <Shield className="w-14 h-14 text-botanical-outline" />
            <p className="font-serif text-botanical-primary text-2xl">Camera Access Denied</p>
            <p className="font-body text-white/50 text-sm leading-relaxed">Allow camera access in your browser settings, then reopen the scanner.</p>
          </div>
        )}
        {camState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-10 text-center">
            <X className="w-14 h-14 text-red-400" />
            <p className="font-serif text-botanical-primary text-2xl">Camera Unavailable</p>
            <p className="font-body text-white/50 text-sm leading-relaxed">No camera found. Use the gallery button to upload a photo instead.</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 pointer-events-none" />

        {camState === 'active' && phase === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 md:w-96 md:h-96 relative">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-botanical-primary rounded-tl-3xl opacity-60" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-botanical-primary rounded-tr-3xl opacity-60" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-botanical-primary rounded-bl-3xl opacity-60" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-botanical-primary rounded-br-3xl opacity-60" />
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 w-full h-[1px] bg-botanical-primary/40 shadow-[0_0_15px_#95d4b3]"
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {busy && (
            <motion.div
              key={phase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm pointer-events-none"
            >
              {phase === 'saving' && (
                <>
                  <Loader2 className="w-10 h-10 text-botanical-primary animate-spin" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white">Saving photo…</p>
                </>
              )}
              {phase === 'analyzing' && (
                <>
                  <div className="relative">
                    <Leaf className="w-10 h-10 text-botanical-primary" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-3 border-2 border-t-botanical-primary border-botanical-primary/20 rounded-full"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white">Identifying plant</p>
                    <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Powered by Qianfan Vision</p>
                  </div>
                </>
              )}
              {phase === 'error' && (
                <>
                  <X className="w-10 h-10 text-red-400" />
                  <div className="max-w-xs px-4 text-center space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-red-300">Something went wrong</p>
                    {errorMessage && (
                      <p className="font-body text-xs leading-relaxed text-white/60 break-words">{errorMessage}</p>
                    )}
                  </div>
                </>
              )}
              {phase === 'retry' && (
                <>
                  <Leaf className="w-10 h-10 text-botanical-primary" />
                  <div className="max-w-xs px-4 text-center space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-botanical-primary">Try another scan</p>
                    {errorMessage && (
                      <p className="font-body text-xs leading-relaxed text-white/70 break-words">{errorMessage}</p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-8">
          <div className="px-6 py-2.5 bg-botanical-primary/40 backdrop-blur-md rounded-full text-white font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${camState === 'active' ? 'bg-botanical-primary animate-pulse' : 'bg-white/30'}`} />
            {camState === 'active' ? 'Aim at a plant and shoot' : 'Camera Offline'}
          </div>
          <div className="flex items-center gap-12">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shadow-xl opacity-80 hover:opacity-100 transition-opacity disabled:opacity-30"
              title="Upload from gallery"
            >
              <img src={SUCCULENT_MACRO} className="w-full h-full object-cover" alt="Upload from gallery" />
            </button>
            <button
              onClick={handleCapture}
              disabled={camState !== 'active' || busy}
              className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-white active:scale-90 transition-all shadow-[0_0_40px_rgba(149,212,179,0.3)] disabled:opacity-40 disabled:active:scale-100"
            >
              <div className="w-20 h-20 rounded-full border border-botanical-bg flex items-center justify-center bg-gradient-to-br from-white to-botanical-primary/20">
                <div className="w-14 h-14 rounded-full border-2 border-botanical-bg/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-botanical-bg" />
                </div>
              </div>
              <div className="absolute -inset-2 border border-white/20 rounded-full animate-ping opacity-20 pointer-events-none" />
            </button>
            <button className="w-14 h-14 rounded-full bg-botanical-primary-container/40 backdrop-blur-xl flex items-center justify-center text-white border border-white/10">
              <Bolt className="w-6 h-6" />
            </button>
          </div>
          <span className="font-mono text-white/90 text-[10px] font-bold uppercase tracking-widest">Identify Flora</span>
        </div>

        <AnimatePresence>
          {result && (
            <PlantResultPanel
              result={result}
              onDismiss={() => { setResult(null); setPhase('idle'); }}
              onToggle={toggleTask}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
