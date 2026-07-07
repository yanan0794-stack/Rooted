import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Shield, Camera, Bolt, Leaf, Check, Sun, Droplets, Wind, Zap } from 'lucide-react';
import type { PlantResult } from '../types';
import { SUCCULENT_MACRO } from '../constants';

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

        {/* Saved path */}
        <div className="bg-botanical-surface rounded-xl px-4 py-3 mb-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-botanical-outline mb-1">Guide saved to</p>
          <p className="font-mono text-[10px] text-botanical-secondary break-all">{result.jsonPath}</p>
        </div>

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
  const [phase, setPhase] = useState<'idle' | 'saving' | 'analyzing' | 'done' | 'error'>('idle');
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

  const handleImageData = async (data: string, filename: string) => {
    setErrorMessage('');
    setPhase('saving');
    let filePath = '';
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data }),
      });
      if (!res.ok) throw new Error('Upload failed');
      filePath = (await res.json()).path;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
      setPhase('error');
      setTimeout(() => setPhase('idle'), 2500);
      return;
    }

    setPhase('analyzing');
    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: data, imagePath: filePath }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Plant identification failed' }));
        throw new Error(error);
      }
      const json = await res.json();

      setResult({
        id: json.id,
        scannedAt: json.scannedAt,
        plant: json.plant,
        scientificName: json.scientificName,
        description: json.description,
        imageUrl: json.imageUrl,
        imageSrc: data,
        jsonPath: json.jsonPath,
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
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.translate(canvas.width, 0);
    context?.scale(-1, 1);
    context?.drawImage(video, 0, 0);
    handleImageData(canvas.toDataURL('image/jpeg', 0.9), `plant_${Date.now()}.jpg`);
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
    handleImageData(data, file.name);
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
            {phase === 'analyzing' ? 'Identifying Plant…' : phase === 'saving' ? 'Saving…' : camState === 'loading' ? 'Starting Camera…' : camState === 'active' ? 'Digital Greenhouse' : 'Camera Unavailable'}
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
