
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Trash2, X } from 'lucide-react';

export const CalendarApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<Record<string, {id: string, title: string, time: string}[]>>({});
  const [newEvent, setNewEvent] = useState("");
  const [newTime, setNewTime] = useState("");

  // Load events
  useEffect(() => {
    try {
        const saved = localStorage.getItem('os_calendar_events');
        if (saved) setEvents(JSON.parse(saved));
    } catch (e) { console.error(e); }
  }, []);

  // Save events
  useEffect(() => {
      localStorage.setItem('os_calendar_events', JSON.stringify(events));
  }, [events]);

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    // Padding
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  };

  const navMonth = (dir: number) => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
  };

  const handleDayClick = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      setSelectedDate(dateStr);
  };

  const addEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDate || !newEvent.trim()) return;
      
      const evt = {
          id: Date.now().toString(),
          title: newEvent,
          time: newTime || 'All Day'
      };
      
      setEvents(prev => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] || []), evt]
      }));
      setNewEvent("");
      setNewTime("");
  };

  const deleteEvent = (dateStr: string, id: string) => {
      setEvents(prev => ({
          ...prev,
          [dateStr]: prev[dateStr].filter(e => e.id !== id)
      }));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const days = getDaysInMonth(year, month);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col bg-transparent text-neutral-200 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
            <button onClick={() => navMonth(-1)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"><ChevronLeft /></button>
            <h2 className="text-xl font-bold text-neutral-100">{monthName} {year}</h2>
            <button onClick={() => navMonth(1)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"><ChevronRight /></button>
        </div>

        {/* Grid */}
        <div className="flex-1 p-4">
            <div className="grid grid-cols-7 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-neutral-500 text-sm font-bold uppercase">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {days.map((d, i) => {
                    if (!d) return <div key={i}></div>;
                    const dateStr = d.toISOString().split('T')[0];
                    const isToday = dateStr === todayStr;
                    const hasEvents = events[dateStr]?.length > 0;
                    
                    return (
                        <button 
                            key={i}
                            onClick={() => handleDayClick(d)}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all border border-transparent ${
                                isToday ? 'bg-blue-500/30 text-blue-100 shadow-sm border-blue-400/20' : 'hover:bg-white/5 text-neutral-300'
                            } ${hasEvents && !isToday ? 'bg-white/5 border-white/5' : ''}`}
                        >
                            <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{d.getDate()}</span>
                            {hasEvents && (
                                <div className="flex gap-0.5 mt-1">
                                    {events[dateStr].slice(0, 3).map((_, idx) => (
                                        <div key={idx} className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-blue-300'}`}></div>
                                    ))}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Event Modal / Overlay */}
        {selectedDate && (
            <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md z-10 flex flex-col animate-in slide-in-from-bottom-5 duration-200">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-200">{new Date(selectedDate).toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'})}</h3>
                        <p className="text-xs text-neutral-500">Manage Events</p>
                    </div>
                    <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white"><X /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {(events[selectedDate] || []).length === 0 && (
                        <div className="text-center text-neutral-600 py-10 italic">No events for this day.</div>
                    )}
                    {(events[selectedDate] || []).map(e => (
                        <div key={e.id} className="bg-white/5 border border-white/5 p-3 rounded-lg flex items-center justify-between group">
                            <div>
                                <div className="font-medium text-neutral-200">{e.title}</div>
                                <div className="text-xs text-blue-300">{e.time}</div>
                            </div>
                            <button onClick={() => deleteEvent(selectedDate, e.id)} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-300 transition-all p-2"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>

                <form onSubmit={addEvent} className="p-4 border-t border-white/5 bg-black/20">
                    <div className="flex gap-2 mb-2">
                        <input 
                            className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-400/50" 
                            placeholder="Event title..." 
                            value={newEvent}
                            onChange={e => setNewEvent(e.target.value)}
                        />
                        <input 
                            type="time"
                            className="w-24 bg-black/20 border border-white/10 rounded px-2 py-2 text-sm text-neutral-200 outline-none focus:border-blue-400/50"
                            value={newTime}
                            onChange={e => setNewTime(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/20 py-2 rounded font-medium transition-colors">Add Event</button>
                </form>
            </div>
        )}
    </div>
  );
};
