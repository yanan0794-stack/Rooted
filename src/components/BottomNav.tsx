import { Home as HomeIcon, Scan, Library, User } from 'lucide-react';
import type { View } from '../types';

export function BottomNav({
  activeView,
  onViewChange,
}: {
  activeView: View;
  onViewChange: (v: View) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-3 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.10),0_-2px_2px_rgba(0,0,0,0.06),0_0_2px_rgba(0,0,0,0.07)] md:max-w-md md:left-1/2 md:-translate-x-1/2">
      <button
        onClick={() => onViewChange('HOME')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeView === 'HOME' ? 'text-botanical-secondary' : 'text-botanical-outline hover:text-botanical-on-surface-variant'
        }`}
      >
        <HomeIcon className="w-6 h-6" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Home</span>
      </button>

      <button
        onClick={() => onViewChange('SCAN')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeView === 'SCAN' ? 'text-botanical-secondary' : 'text-botanical-outline hover:text-botanical-on-surface-variant'
        }`}
      >
        <Scan className="w-6 h-6" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Scan</span>
      </button>

      <button className="flex flex-col items-center gap-1 text-botanical-outline hover:text-botanical-on-surface-variant transition-colors">
        <Library className="w-6 h-6" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Library</span>
      </button>

      <button
        onClick={() => onViewChange('PROFILE')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeView === 'PROFILE' ? 'text-botanical-secondary' : 'text-botanical-outline hover:text-botanical-on-surface-variant'
        }`}
      >
        <User className="w-6 h-6" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Profile</span>
      </button>
    </nav>
  );
}
