import React from 'react';
import { RotateCcw, BarChart2, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onReset: () => void;
  onOpenCompare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  onToggleTheme,
  onReset,
  onOpenCompare,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        {/* LEFT: ARQ SIMULATOR */}
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-lime-400 border border-black dark:border-white"></span>
          <span className="font-black text-sm tracking-tight uppercase text-neutral-900 dark:text-neutral-100 font-mono">
            ARQ SIMULATOR
          </span>
        </div>

        {/* RIGHT: Compare | Reset | Theme */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-3 py-1 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white bg-transparent text-neutral-800 dark:text-neutral-200 transition-colors uppercase text-[11px] font-bold"
          >
            <BarChart2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Compare</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1 border border-neutral-300 dark:border-neutral-700 hover:border-red-500 hover:text-red-500 bg-transparent text-neutral-800 dark:text-neutral-200 transition-colors uppercase text-[11px] font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-800 dark:text-neutral-200 transition-colors"
            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-lime-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-900" />}
          </button>
        </div>
      </div>
    </header>
  );
};
