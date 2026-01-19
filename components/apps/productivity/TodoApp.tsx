
import React, { useState, useEffect, useMemo } from 'react';
import { CheckSquare, Plus, GripVertical, Clock, BarChart2, Play, Pause, RotateCcw, Bell, Settings, X, CheckCircle2, Trash2, Watch } from 'lucide-react';
import { playDing } from '../../../utils/audio';

interface TodoTask {
    id: string;
    text: string;
    done: boolean;
    completedAt?: string;
}

interface PomodoroSettings {
    workMinutes: number;
    breakMinutes: number;
}

export const TodoApp = () => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'timer' | 'stopwatch' | 'stats'>('tasks');
    const [tasks, setTasks] = useState<TodoTask[]>([]);
    const [history, setHistory] = useState<Record<string, number>>({});
    const [input, setInput] = useState("");
    
    // Pomodoro State
    const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');
    const [pomoTime, setPomoTime] = useState(25 * 60);
    const [pomoActive, setPomoActive] = useState(false);
    const [pomoSettings, setPomoSettings] = useState<PomodoroSettings>({ workMinutes: 25, breakMinutes: 5 });
    const [showSettings, setShowSettings] = useState(false);

    // Stopwatch State
    const [swTime, setSwTime] = useState(0);
    const [swRunning, setSwRunning] = useState(false);
    const [swLaps, setSwLaps] = useState<number[]>([]);

    useEffect(() => {
        try {
            const savedTasks = localStorage.getItem('os_new_tasks');
            if (savedTasks) setTasks(JSON.parse(savedTasks));
            const savedPomo = localStorage.getItem('os_pomo_settings');
            if (savedPomo) setPomoSettings(JSON.parse(savedPomo));
            const savedHistory = localStorage.getItem('os_todo_history');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch(e) { console.error(e); }
    }, []);

    useEffect(() => { localStorage.setItem('os_new_tasks', JSON.stringify(tasks)); }, [tasks]);
    useEffect(() => { localStorage.setItem('os_pomo_settings', JSON.stringify(pomoSettings)); }, [pomoSettings]);
    useEffect(() => { localStorage.setItem('os_todo_history', JSON.stringify(history)); }, [history]);

    // --- Task Logic ---
    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setTasks(prev => [{ id: Date.now().toString(), text: input.trim(), done: false }, ...prev]);
        setInput("");
    };

    const toggleTask = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const isNowDone = !task.done;
        const today = new Date().toISOString().split('T')[0];

        setHistory(prev => {
            const next = { ...prev };
            if (isNowDone) next[today] = (next[today] || 0) + 1;
            else if (task.completedAt && next[task.completedAt.split('T')[0]] > 0) next[task.completedAt.split('T')[0]] -= 1;
            return next;
        });

        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: isNowDone, completedAt: isNowDone ? new Date().toISOString() : undefined } : t));
    };

    const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

    // --- Pomodoro Logic ---
    useEffect(() => {
        let interval: any = null;
        if (pomoActive && pomoTime > 0) interval = setInterval(() => setPomoTime(t => t - 1), 1000);
        else if (pomoActive && pomoTime === 0) {
            playDing();
            if (pomoMode === 'work') { setPomoMode('break'); setPomoTime(pomoSettings.breakMinutes * 60); }
            else { setPomoActive(false); setPomoMode('work'); setPomoTime(pomoSettings.workMinutes * 60); }
        }
        return () => clearInterval(interval);
    }, [pomoActive, pomoTime, pomoMode, pomoSettings]);

    // --- Stopwatch Logic ---
    useEffect(() => {
        let int: any;
        if (swRunning) int = setInterval(() => setSwTime(t => t + 10), 10);
        return () => clearInterval(int);
    }, [swRunning]);

    const formatSw = (ms: number) => {
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const c = Math.floor((ms % 1000) / 10);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${c.toString().padStart(2, '0')}`;
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const statsData = useMemo(() => {
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });
        const counts = last7Days.map(date => ({ date, count: history[date] || 0 }));
        const max = Math.max(...counts.map(c => c.count), 5);
        return { data: counts, max };
    }, [history]);

    return (
        <div className="h-full flex flex-col bg-transparent text-neutral-200 font-sans">
            <div className="flex border-b border-white/5 bg-black/10">
                <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'tasks' ? 'text-blue-300 border-b-2 border-blue-400/50' : 'text-neutral-500 hover:text-neutral-300'}`}><CheckSquare size={16}/> Tasks</button>
                <button onClick={() => setActiveTab('timer')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'timer' ? 'text-blue-300 border-b-2 border-blue-400/50' : 'text-neutral-500 hover:text-neutral-300'}`}><Clock size={16}/> Timer</button>
                <button onClick={() => setActiveTab('stopwatch')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'stopwatch' ? 'text-blue-300 border-b-2 border-blue-400/50' : 'text-neutral-500 hover:text-neutral-300'}`}><Watch size={16}/> Stopwatch</button>
                <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'stats' ? 'text-blue-300 border-b-2 border-blue-400/50' : 'text-neutral-500 hover:text-neutral-300'}`}><BarChart2 size={16}/> Stats</button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'tasks' && (
                    <div className="h-full flex flex-col">
                        <form onSubmit={addTask} className="p-4 border-b border-white/5 bg-transparent">
                            <div className="relative">
                                <input value={input} onChange={e => setInput(e.target.value)} placeholder="What needs to be done?" className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-4 pr-12 text-neutral-200 placeholder:text-neutral-600 focus:border-blue-400/50 outline-none transition-all shadow-inner" />
                                <button type="submit" className="absolute right-2 top-2 p-1 bg-blue-500/20 text-blue-200 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/20"><Plus size={18}/></button>
                            </div>
                        </form>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {tasks.map((task) => (
                                <div key={task.id} className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${task.done ? 'bg-green-500/5 border-transparent opacity-60' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                    <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.done ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'border-neutral-600 hover:border-neutral-400'}`}>{task.done && <CheckSquare size={14} />}</button>
                                    <span className={`flex-1 truncate ${task.done ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>{task.text}</span>
                                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-500 hover:text-red-300 hover:bg-white/5 rounded transition-all"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'timer' && (
                    <div className="h-full flex flex-col items-center justify-center p-6 relative">
                        {showSettings && (
                            <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md z-20 flex flex-col p-6 animate-in fade-in zoom-in-95">
                                <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-bold text-neutral-200">Timer Settings</h3><button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded text-neutral-400"><X/></button></div>
                                <div className="space-y-6">
                                    <div><label className="block text-sm text-neutral-500 mb-2">Work (min)</label><input type="number" value={pomoSettings.workMinutes} onChange={e => setPomoSettings({...pomoSettings, workMinutes: Number(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded p-2 text-neutral-200"/></div>
                                    <div><label className="block text-sm text-neutral-500 mb-2">Break (min)</label><input type="number" value={pomoSettings.breakMinutes} onChange={e => setPomoSettings({...pomoSettings, breakMinutes: Number(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded p-2 text-neutral-200"/></div>
                                    <button onClick={() => { setShowSettings(false); setPomoActive(false); setPomoTime((pomoMode === 'work' ? pomoSettings.workMinutes : pomoSettings.breakMinutes) * 60); }} className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/20 rounded font-bold mt-4 transition-all">Save & Reset</button>
                                </div>
                            </div>
                        )}
                        <div className={`text-8xl font-mono font-bold tracking-wider mb-8 tabular-nums drop-shadow-lg ${pomoMode === 'work' ? 'text-red-300' : 'text-green-300'}`}>{formatTime(pomoTime)}</div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => setPomoActive(!pomoActive)} className="w-16 h-16 rounded-full bg-neutral-200 text-neutral-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl border border-white/20">{pomoActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1"/>}</button>
                            <button onClick={() => { setPomoActive(false); setPomoTime((pomoMode === 'work' ? pomoSettings.workMinutes : pomoSettings.breakMinutes) * 60); }} className="w-12 h-12 rounded-full bg-white/10 text-neutral-200 flex items-center justify-center hover:bg-white/20 transition-all border border-white/5"><RotateCcw size={20}/></button>
                            <button onClick={() => setShowSettings(true)} className="w-12 h-12 rounded-full bg-white/10 text-neutral-200 flex items-center justify-center hover:bg-white/20 transition-all border border-white/5"><Settings size={20}/></button>
                        </div>
                    </div>
                )}

                {activeTab === 'stopwatch' && (
                    <div className="h-full flex flex-col items-center p-6">
                         <div className="flex-1 flex flex-col justify-center items-center">
                            <div className="text-6xl font-mono font-bold mb-10 tabular-nums tracking-wider drop-shadow-sm text-neutral-100">{formatSw(swTime)}</div>
                            <div className="flex gap-4">
                                <button onClick={() => setSwRunning(!swRunning)} className={`w-24 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 border ${swRunning ? 'bg-red-500/20 text-red-200 border-red-500/20 hover:bg-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/20 hover:bg-green-500/30'}`}>{swRunning ? 'Stop' : 'Start'}</button>
                                <button onClick={() => setSwLaps([swTime, ...swLaps])} disabled={!swRunning} className="w-24 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold shadow-lg disabled:opacity-30 border border-white/10 text-neutral-300">Lap</button>
                                <button onClick={() => { setSwRunning(false); setSwTime(0); setSwLaps([]); }} className="w-24 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold shadow-lg text-neutral-300 border border-white/10">Reset</button>
                            </div>
                        </div>
                        {swLaps.length > 0 && (
                            <div className="h-1/3 w-full border-t border-white/5 overflow-auto pt-2">
                                {swLaps.map((l, i) => (
                                    <div key={i} className="flex justify-between px-8 py-2 border-b border-white/5 text-neutral-400 font-mono text-sm hover:bg-white/5 transition-colors"><span>Lap {swLaps.length - i}</span><span>{formatSw(l)}</span></div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="h-full p-6 flex flex-col">
                        <h3 className="text-lg font-bold mb-1 text-neutral-200">Productivity Report</h3>
                        <div className="flex-1 flex items-end gap-2 relative border-b border-l border-white/10 p-2 min-h-[200px]">
                             {statsData.data.map((d, i) => {
                                 const heightPct = (d.count / statsData.max) * 100;
                                 return (<div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full"><div className="w-full max-w-[30px] bg-blue-500/30 hover:bg-blue-400/50 rounded-t transition-all relative border-t border-x border-blue-400/20" style={{ height: `${heightPct}%`, minHeight: '4px' }}></div><span className="text-[10px] text-neutral-500 mt-2 rotate-0 truncate w-full text-center">{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}</span></div>)
                             })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
