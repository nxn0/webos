
import React, { useState, useMemo } from 'react';
import { AppId, Category } from '../../types';
import { CATEGORIES, APPS_MAP } from '../../config';
import { Monitor, Search, User } from 'lucide-react';

interface StartMenuProps {
  isOpen: boolean;
  onAppClick: (appId: AppId) => void;
  onClose: () => void;
  onShutdown: () => void;
  userName: string;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onAppClick, onClose, onShutdown, userName }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('Productivity');
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten apps for search
  const allApps = useMemo(() => {
    return Object.values(APPS_MAP).flat();
  }, []);

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allApps.filter(app => app.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, allApps]);

  if (!isOpen) return null;

  return (
    <div 
      className="absolute bottom-12 md:bottom-12 top-14 md:top-auto left-2 w-[calc(100vw-16px)] md:w-[480px] h-[calc(100vh-100px)] md:h-[380px] bg-neutral-900/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden z-[100] transition-all animate-in slide-in-from-bottom-2 origin-bottom-left text-white"
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* Search Bar */}
      <div className="p-3 border-b border-white/10 bg-white/5">
        <div className="relative">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
            type="text" 
            placeholder="Search apps..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full bg-black/40 hover:bg-black/50 px-10 py-2.5 rounded-lg text-sm font-medium outline-none focus:ring-2 ring-blue-500/50 text-white border border-white/5 transition-all placeholder:text-neutral-500"
            />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Categories (Hidden if searching) */}
        {!searchQuery && (
          <div className="w-32 md:w-36 bg-black/20 flex flex-col py-2 border-r border-white/10 overflow-y-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-left px-4 py-3 text-xs md:text-sm font-bold transition-all duration-200 border-l-4 ${
                  activeCategory === cat 
                    ? 'bg-white/10 text-white border-blue-400' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Apps Grid */}
        <div className={`flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-3 content-start overflow-y-auto ${searchQuery ? 'w-full' : ''}`}>
          {(searchQuery ? filteredApps : APPS_MAP[activeCategory]).map((app) => (
            <button
              key={app.id}
              onClick={() => { onAppClick(app.id); onClose(); setSearchQuery(''); }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition-all group animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Liquid Glass Icon */}
              <div className="w-10 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/15 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300">
                {React.cloneElement(app.icon as React.ReactElement<any>, { size: 20, className: "text-neutral-200 group-hover:text-white drop-shadow-md" })}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-neutral-300 text-center truncate w-full group-hover:text-white drop-shadow-sm">
                {app.name}
              </span>
            </button>
          ))}
          {searchQuery && filteredApps.length === 0 && (
            <div className="col-span-full text-center text-neutral-400 mt-10 text-sm font-medium">No apps found for "{searchQuery}"</div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-3 bg-black/40 border-t border-white/10 flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg border border-white/20">
                <User size={14}/>
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{userName}</span>
            </div>
        </div>
        <button 
            onClick={() => { onClose(); onShutdown(); }} 
            className="text-neutral-400 hover:text-red-300 transition-colors p-2 hover:bg-white/10 rounded-full" 
            title="Shut Down"
        >
            <Monitor size={18} />
        </button>
      </div>
    </div>
  );
};
