
import React, { useState, useEffect, useRef } from 'react';
import { AppId } from '../../types';
import { LayoutGrid, ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, X } from 'lucide-react';

interface TaskbarProps {
  openWindows: { id: string; appId: AppId; title: string; isMinimized: boolean }[];
  activeWindowId: string | null;
  onStartClick: () => void;
  onWindowClick: (id: string) => void;
  isStartOpen: boolean;
  accentColor: string;
}

interface CalendarEvent {
    id: string;
    title: string;
}

// --- Mini Calendar Widget ---
const MiniCalendar = () => {
    const [viewDate, setViewDate] = useState(new Date()); // The month being viewed
    const [selectedDate, setSelectedDate] = useState(new Date()); // The specific day selected
    const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
    const [newEvent, setNewEvent] = useState("");

    useEffect(() => {
        try {
            const saved = localStorage.getItem('os_calendar_events');
            if (saved) {
                // Migrate legacy format if needed, or just parse
                const parsed = JSON.parse(saved);
                setEvents(parsed);
            }
        } catch (e) { console.error("Failed to load events", e); }
    }, []);

    const saveEvents = (updatedEvents: Record<string, CalendarEvent[]>) => {
        setEvents(updatedEvents);
        localStorage.setItem('os_calendar_events', JSON.stringify(updatedEvents));
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const days = [];
    for(let i=0; i<firstDay; i++) days.push(null);
    for(let i=1; i<=daysInMonth; i++) days.push(i);

    const today = new Date();
    const isCurrentMonth = today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const currentEvents = events[selectedDateStr] || [];

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.trim()) return;
        const updated = { ...events };
        if (!updated[selectedDateStr]) updated[selectedDateStr] = [];
        updated[selectedDateStr].push({ id: Date.now().toString(), title: newEvent.trim() });
        saveEvents(updated);
        setNewEvent("");
    };

    const handleDeleteEvent = (id: string) => {
        const updated = { ...events };
        updated[selectedDateStr] = updated[selectedDateStr].filter(evt => evt.id !== id);
        saveEvents(updated);
    };

    const handleDayClick = (day: number) => {
        setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    };

    return (
        <div className="absolute bottom-10 right-2 w-80 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 text-white z-[1001] flex flex-col gap-4">
            
            {/* Header / Month Nav */}
            <div className="flex items-center justify-between">
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1))} className="p-1 hover:bg-white/10 rounded transition-colors"><ChevronLeft size={16}/></button>
                <span className="font-bold text-sm text-white">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1))} className="p-1 hover:bg-white/10 rounded transition-colors"><ChevronRight size={16}/></button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
                <div className="grid grid-cols-7 text-center gap-1">
                    {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] text-neutral-400 font-bold">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map((d, i) => {
                        if (d === null) return <div key={i}></div>;
                        
                        const dateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), d).toISOString().split('T')[0];
                        const isToday = isCurrentMonth && d === today.getDate();
                        const isSelected = viewDate.getMonth() === selectedDate.getMonth() && d === selectedDate.getDate() && viewDate.getFullYear() === selectedDate.getFullYear();
                        const hasEvents = (events[dateStr]?.length || 0) > 0;

                        return (
                            <button 
                                key={i} 
                                onClick={() => handleDayClick(d)}
                                className={`aspect-square flex flex-col items-center justify-center text-xs rounded transition-all relative ${
                                    isSelected 
                                        ? 'bg-blue-600 text-white font-bold shadow-md' 
                                        : isToday 
                                            ? 'bg-white/10 text-blue-300 font-bold border border-blue-500/30' 
                                            : 'hover:bg-white/10 text-neutral-300 hover:text-white'
                                }`}
                            >
                                <span>{d}</span>
                                {hasEvents && (
                                    <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-blue-400'}`}></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="h-px bg-white/10"></div>

            {/* Events Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-medium text-neutral-300">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'})}</span>
                    <span>{currentEvents.length} Events</span>
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {currentEvents.length === 0 ? (
                        <div className="text-xs text-neutral-500 italic py-2 text-center">No events planned</div>
                    ) : (
                        currentEvents.map(evt => (
                            <div key={evt.id} className="group flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 text-xs">
                                <span className="truncate flex-1 text-white">{evt.title}</span>
                                <button onClick={() => handleDeleteEvent(evt.id)} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all p-0.5"><Trash2 size={12}/></button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Event Input */}
                <form onSubmit={handleAddEvent} className="flex gap-2 mt-1">
                    <input 
                        value={newEvent}
                        onChange={e => setNewEvent(e.target.value)}
                        placeholder="Add event..."
                        className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50 placeholder:text-neutral-500"
                    />
                    <button type="submit" disabled={!newEvent.trim()} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 text-blue-300 rounded border border-blue-500/20 transition-colors">
                        <Plus size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export const Taskbar: React.FC<TaskbarProps> = ({ 
  openWindows, activeWindowId, onStartClick, onWindowClick, isStartOpen, accentColor 
}) => {
  const [time, setTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
              setShowCalendar(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const accentClass = accentColor.split('-')[0];

  return (
    <>
        {showCalendar && (
            <div ref={calendarRef}>
                <MiniCalendar />
            </div>
        )}

        <div className="fixed md:bottom-0 md:top-auto top-0 bottom-auto left-0 right-0 h-[32px] md:h-[40px] bg-neutral-900/80 backdrop-blur-xl border-b md:border-b-0 md:border-t border-white/10 flex items-center justify-between px-2 z-[1000] shadow-2xl transition-all select-none">
        
        {/* Start & Apps */}
        <div className="flex items-center gap-2 h-full py-1">
            <button 
                onClick={onStartClick}
                className={`h-full aspect-square rounded-md transition-all duration-200 flex items-center justify-center ${
                    isStartOpen 
                    ? `bg-white/15 text-white shadow-inner border border-white/10` 
                    : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                }`}
                title="Start"
            >
                <LayoutGrid size={18} />
            </button>

            <div className="h-4 w-px bg-white/10 mx-1 hidden md:block" />

            {/* Open Windows */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-linear-fade h-full">
            {openWindows.map(win => (
                <button
                key={win.id}
                onClick={() => onWindowClick(win.id)}
                className={`px-3 h-full rounded-md text-[11px] md:text-xs max-w-[140px] truncate transition-all flex items-center gap-2 border ${
                    !win.isMinimized && activeWindowId === win.id
                    ? `bg-white/10 text-white shadow-sm border-white/10`
                    : 'border-transparent text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                } ${win.isMinimized ? 'opacity-60 grayscale' : 'opacity-100'}`}
                >
                <div className={`w-1.5 h-1.5 rounded-full ${!win.isMinimized && activeWindowId === win.id ? `bg-${accentClass}-400 shadow-[0_0_6px_rgba(255,255,255,0.6)]` : 'bg-neutral-600'}`}></div>
                {win.title}
                </button>
            ))}
            </div>
        </div>

        {/* System Tray (Minimal) */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 pl-2 h-full py-1">
            <button 
                onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar); }}
                className={`h-full flex flex-col justify-center items-end px-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors border border-transparent hover:border-white/5 ${showCalendar ? 'bg-white/10 border-white/5' : ''}`}
            >
                <span className="leading-none text-white">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[9px] font-medium text-neutral-400 leading-none mt-0.5">{time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </button>
        </div>
        </div>
    </>
  );
};
