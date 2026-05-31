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

      <button className="flex flex-col items-center text-botanical-outline opacity-60 hover:opacity-100 transition-all">
        <Library className="w-6 h-6" />
        <span className="font-mono text-[9px] uppercase tracking-wider mt-1">Library</span>
      </button>

      <button
        onClick={() => onViewChange('PROFILE')}
        className={`flex flex-col items-center transition-all ${activeView === 'PROFILE' ? 'text-botanical-primary bg-botanical-surface-high px-6 py-2 rounded-2xl scale-110' : 'text-botanical-outline opacity-60 hover:opacity-100'}`}
      >
        <User className="w-6 h-6" />
        <span className="font-mono text-[9px] uppercase tracking-wider mt-1">Profile</span>
      </button>
    </nav>
  );
}
