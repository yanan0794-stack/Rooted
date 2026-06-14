/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AuthUser, View } from './types';
import { getStoredUser, persistUser, removeUser } from './auth';
import { LoginView } from './components/LoginView';
import { HomeView } from './components/HomeView';
import { ScannerView } from './components/Scanner';
import { ProfileView } from './components/ProfileView';
import { BottomNav } from './components/BottomNav';
import { GrowingGuidePanel } from './components/GrowingGuidePanel';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(() =>
    getStoredUser() ? 'HOME' : 'LOGIN'
  );
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [showGuide, setShowGuide] = useState(false);

  const handleLogin = (authUser: AuthUser) => {
    persistUser(authUser);
    setUser(authUser);
    setCurrentView('HOME');
  };

  const handleLogout = () => {
    removeUser();
    setUser(null);
    setCurrentView('LOGIN');
  };

  return (
    <div className="relative min-h-screen bg-botanical-bg text-botanical-on-surface overflow-x-hidden selection:bg-botanical-secondary selection:text-white">
      <AnimatePresence mode="wait">
        {currentView === 'LOGIN' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <LoginView onLogin={handleLogin} />
          </motion.div>
        )}
        {currentView === 'HOME' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <HomeView user={user} onOpenProfile={() => setCurrentView('PROFILE')} />
          </motion.div>
        )}
        {currentView === 'PROFILE' && (
          <motion.div key="profile" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="w-full">
            <ProfileView user={user} onLogout={handleLogout} onOpenGuide={() => setShowGuide(true)} />
          </motion.div>
        )}
        {currentView === 'SCAN' && (
          <motion.div key="scan" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="w-full">
            <ScannerView onBack={() => setCurrentView('HOME')} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentView !== 'LOGIN' && currentView !== 'SCAN' && showGuide && (
          <GrowingGuidePanel onDismiss={() => setShowGuide(false)} />
        )}
      </AnimatePresence>

      {currentView !== 'LOGIN' && currentView !== 'SCAN' && (
        <BottomNav activeView={currentView} onViewChange={setCurrentView} />
      )}
    </div>
  );
}
