/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings, 
  Check, 
  Droplets, 
  Sun, 
  Scissors, 
  Award, 
  Waves, 
  Leaf, 
  Lock, 
  Plus, 
  Home as HomeIcon, 
  Maximize, 
  Trophy,
  Camera,
  Bolt,
  Scan,
  User,
  BookOpen,
  Library,
  Menu
} from 'lucide-react';
import { View, Quest, Badge } from './types';

// Components should ideally be in separate files, but for the sake of speed and brevity in this turn, 
// I'll define the main views within App.tsx or as local sub-components.

const USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCa5i2t-7cSOefy4PhGgP2hUXUQC71gqzMcT6z8mZxviDV4J-AdiiPanZOvDC2oLyk1f2lAyY62ui-sgDxyEbQ26hRf662qDx6WixfCwLKwQTXkYXtWYa9xGTfOFoNeMk08PZjMaWSdJ6LQlVAEZs-YZjx4r05ZOBkpXRsJKWy6VCwyKRZ4RvbX1wxIjW58keE0358ASAXM8ovS2qZ62ci-6ELbMc0OdWGR03MONHw3ouMhtugElL4DrVhxOJBR2Dj9JR3jeO6crP0";
const LEAF_DETAIL = "https://lh3.googleusercontent.com/aida-public/AB6AXuBIT-4BGCSwERRikgjWKCJ_uIdI-3DguFuImRhDs8C85NzW5Kfuj35DbijUnhQw45IUi9Yc5tuEJGYK42KUU7z96MVBuPh8pUOsAhuiVheP4Veolo8HvLgBOs7DlWhK8ltSneV2pdBu-7n99JXu0_FYWx9yYDZb2LuRZXMGg6V8xcory1Gh0DKbwLi5LtQSgkwf6iPzP4TNum7UL5_Fcc9TfW_jcImguKwFuqHJGgbH_6TmM5RRa7AOgjNoEGJ9f2XML_pbuKQBNcg";
const SUCCULENT_MACRO = "https://lh3.googleusercontent.com/aida-public/AB6AXuAVHNT5XBa5dL4E8c39McIbtG82tAUJ2wF6bw0AtXEzJVc4jwilxZDO_GXaCfhWHEdJeXRdAii2st9YazAj42DLtRxn7I8CZfZzten7Y-2ZMkkDQ2iN1dhV_cHiCfc73-N89B10KQaq8WXCCT9fqwPj2POF5qzSgiDsJUpHbEviYMjddWN8MpFbVtHLtkz0zdZMIvcNE9tpev0X_qXBQIXEeDyD-QaxGpLpEKMa0l8b4OV984oBYWMzaE5mNUyi3wT6W_sJ_TwFI1M";
const CAMERA_FEED = "https://lh3.googleusercontent.com/aida-public/AB6AXuDxovKsaHpBOHUGWBR47NZljS63fqgWUpwQCgqIY7SzVb32L5rmDXnKRgVxCFme8n-ltzZrn0Hwyin3qU2Mdtfgx7qasT0ESgzNusrB3rbl1ISN7igTbeS2TPD28JYp543HjZDLwFav6dNsv2-peDI2IuqcuLyjX7uBQIcqAu5IM5c-iofsMYR9PK7fWSMml6hS3wNSw9dae9d_0JS1FC3E4scfIqcQ8SB-2BsppFlKye4z-My6MeeZ57zDITiY7kKp4V88xAL92U4";

export default function App() {
  const [currentView, setCurrentView] = useState<View>('LOGIN');

  return (
    <div className="relative min-h-screen bg-botanical-bg text-botanical-on-surface overflow-x-hidden selection:bg-botanical-primary selection:text-botanical-primary-container">
      {/* Background Ambience */}
      <div className="fixed inset-0 organic-texture z-0 opacity-10" />
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-botanical-primary-container rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-botanical-surface-highest rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'LOGIN' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <LoginView onEnter={() => setCurrentView('HOME')} />
          </motion.div>
        )}
        {currentView === 'HOME' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <HomeView onOpenScanner={() => setCurrentView('SCAN')} />
          </motion.div>
        )}
        {currentView === 'SCAN' && (
          <motion.div 
            key="scan"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full"
          >
            <ScannerView onBack={() => setCurrentView('HOME')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Navigation - Only shown after login, and maybe not on scanner if it's full screen */}
      {currentView !== 'LOGIN' && currentView !== 'SCAN' && (
        <BottomNav activeView={currentView} onViewChange={setCurrentView} />
      )}
    </div>
  );
}

function LoginView({ onEnter }: { onEnter: () => void }) {
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
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onEnter(); }}>
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-botanical-primary ml-1">Identity</label>
                <input 
                  type="email" 
                  placeholder="Email address"
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
                className="w-full bg-gradient-to-br from-botanical-primary to-botanical-primary-container text-botanical-primary-container font-serif italic text-xl py-5 rounded-xl shadow-lg hover:shadow-botanical-primary/20 transition-all active:scale-[0.98]"
              >
                Enter Grove
              </button>

              <div className="relative flex items-center justify-center py-4">
                <div className="flex-grow border-t border-botanical-outline/10" />
                <span className="mx-4 font-mono text-[10px] uppercase tracking-widest text-botanical-outline">or continue with</span>
                <div className="flex-grow border-t border-botanical-outline/10" />
              </div>

              <div className="flex flex-col gap-3">
                {['Google', 'Apple', 'X'].map((provider) => (
                  <button 
                    key={provider}
                    type="button"
                    className="flex items-center justify-center gap-3 bg-botanical-surface-high/50 hover:bg-botanical-surface-highest transition-colors border border-botanical-outline/10 py-3 rounded-xl w-full text-sm font-body"
                  >
                    Continue with {provider}
                  </button>
                ))}
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

      {/* Hero Images for Login */}
      <div className="absolute bottom-12 left-12 hidden lg:block opacity-30 select-none pointer-events-none">
        <img src={LEAF_DETAIL} alt="" className="w-64 h-80 object-cover rounded-full mix-blend-screen" />
      </div>
      <div className="absolute top-24 right-12 hidden lg:block opacity-20 select-none pointer-events-none">
        <img src={SUCCULENT_MACRO} alt="" className="w-48 h-48 object-cover rounded-full mix-blend-screen transform rotate-12" />
      </div>
    </div>
  );
}

function HomeView({ onOpenScanner }: { onOpenScanner: () => void }) {
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
            <img src={USER_AVATAR} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-serif text-botanical-primary italic">Obsidian Grove</span>
        </div>
        <button className="text-botanical-primary hover:opacity-80 transition-opacity">
          <Settings className="w-6 h-6" />
        </button>
      </header>

      <section className="mt-8 space-y-4">
        <h1 className="font-serif text-5xl text-botanical-primary leading-tight">Good morning,<br/>Botanist.</h1>
        <p className="text-botanical-on-surface-variant text-lg font-body">Your greenhouse is thriving. Let's tend to it.</p>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-botanical-primary">Daily Quests</h2>
          <span className="font-mono text-botanical-secondary text-xs uppercase tracking-widest">{quests.length} To Do</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {quests.map((quest) => (
            <div key={quest.id} className="glass-card rounded-2xl p-5 flex items-center justify-between group transition-all hover:bg-botanical-surface-highest/40">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-xl bg-botanical-surface-high flex items-center justify-center text-botanical-primary group-hover:scale-110 transition-transform`}>
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
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className={`glass-card rounded-3xl p-6 flex flex-col justify-between aspect-square relative overflow-hidden ${badge.type === 'featured' ? 'bg-gradient-to-br from-botanical-surface-highest/50 to-botanical-primary-container/20 md:col-span-1' : 'opacity-80'}`}
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

function ScannerView({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a110d] flex flex-col">
      <header className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-botanical-primary animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest">Digital Greenhouse</span>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-grow relative">
        <img src={CAMERA_FEED} alt="Scanner View" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
        
        {/* Viewfinder Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 h-72 md:w-96 md:h-96 relative">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-botanical-primary rounded-tl-3xl shadow-glow opacity-60" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-botanical-primary rounded-tr-3xl shadow-glow opacity-60" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-botanical-primary rounded-bl-3xl shadow-glow opacity-60" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-botanical-primary rounded-br-3xl shadow-glow opacity-60" />
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-[1px] bg-botanical-primary/40 shadow-[0_0_15px_#95d4b3]" 
            />
          </div>
        </div>

        {/* HUD Elements */}
        <div className="absolute top-24 left-6 space-y-4">
          <div className="bg-botanical-primary-container/40 backdrop-blur-lg px-4 py-3 rounded-2xl border border-white/10 flex items-start gap-3 max-w-[200px]">
            <Sun className="text-botanical-primary w-5 h-5 mt-1" />
            <div>
              <p className="text-[9px] uppercase font-bold text-white/60 tracking-wider">Environment</p>
              <p className="text-white text-xs font-semibold">Perfect Lighting</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-8">
          <div className="px-6 py-2.5 bg-botanical-primary/40 backdrop-blur-md rounded-full text-white font-mono text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-botanical-primary animate-pulse" />
            Centering Specimen
          </div>

          <div className="flex items-center gap-12">
            <button className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shadow-xl opacity-80">
              <img src={SUCCULENT_MACRO} className="w-full h-full object-cover" alt="Gallery" />
            </button>
            
            <button className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-white active:scale-90 transition-all shadow-[0_0_40px_rgba(149,212,179,0.3)]">
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
      </div>
    </div>
  );
}

function BottomNav({ activeView, onViewChange }: { activeView: View, onViewChange: (v: View) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-10 pt-4 bg-botanical-bg/80 backdrop-blur-3xl rounded-t-[40px] shadow-[0_-15px_30px_rgba(0,0,0,0.3)] border-t border-botanical-outline/5 md:max-w-md md:left-1/2 md:-translate-x-1/2">
      <button 
        onClick={() => onViewChange('HOME')}
        className={`flex flex-col items-center transition-all ${activeView === 'HOME' ? 'text-botanical-primary bg-botanical-surface-high px-6 py-2 rounded-2xl scale-110' : 'text-botanical-outline opacity-60 hover:opacity-100'}`}
      >
        <HomeIcon className="w-6 h-6" />
        <span className="font-mono text-[9px] uppercase tracking-wider mt-1">Home</span>
      </button>
      
      <button 
        onClick={() => onViewChange('SCAN')}
        className={`flex flex-col items-center transition-all transform hover:scale-110 active:scale-95 ${activeView === 'SCAN' ? 'text-botanical-primary' : 'text-botanical-outline opacity-60 hover:opacity-100'}`}
      >
        <div className="p-3 bg-botanical-primary text-botanical-bg rounded-2xl shadow-lg shadow-botanical-primary/20 -mt-8 mb-1">
          <Scan className="w-7 h-7" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider">Scan</span>
      </button>

      <button 
        className="flex flex-col items-center text-botanical-outline opacity-60 hover:opacity-100 transition-all"
      >
        <Library className="w-6 h-6" />
        <span className="font-mono text-[9px] uppercase tracking-wider mt-1">Library</span>
      </button>

      <button 
        className="flex flex-col items-center text-botanical-outline opacity-60 hover:opacity-100 transition-all"
      >
        <User className="w-6 h-6" />
        <span className="font-mono text-[9px] uppercase tracking-wider mt-1">Profile</span>
      </button>
    </nav>
  );
}
