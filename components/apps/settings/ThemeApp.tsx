
import React from 'react';
import { Moon, Sun } from 'lucide-react';

export const ThemeApp = ({ isDark, toggle }: { isDark: boolean, toggle: () => void }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-transparent text-neutral-200">
      <h2 className="text-xl font-bold mb-8 text-neutral-300">System Theme</h2>
      <button 
        onClick={toggle}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl border ${
            isDark 
                ? 'bg-indigo-500/20 text-yellow-200 border-indigo-500/30 hover:bg-indigo-500/30' 
                : 'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30'
        }`}
      >
        {isDark ? <Moon size={48} /> : <Sun size={48} />}
      </button>
      <p className="mt-6 text-neutral-500 text-sm font-medium uppercase tracking-wider">{isDark ? "Dark Mode" : "Light Mode"}</p>
    </div>
  );
};
