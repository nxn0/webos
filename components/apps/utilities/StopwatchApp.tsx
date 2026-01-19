
import React, { useState, useEffect } from 'react';
import { Watch } from 'lucide-react';

export const StopwatchApp = () => {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    let int: any;
    if (running) int = setInterval(() => setTime(t => t + 10), 10);
    return () => clearInterval(int);
  }, [running]);

  const format = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const c = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${c.toString().padStart(2, '0')}`;
  };

  const lap = () => {
      setLaps([time, ...laps]);
  };

  return (
    <div className="h-full flex flex-col items-center bg-transparent text-neutral-200 p-6">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
            <Watch size={32} className="text-blue-300" />
        </div>
        <div className="text-6xl font-mono font-bold mb-10 tabular-nums tracking-wider drop-shadow-sm text-neutral-100">{format(time)}</div>
        <div className="flex gap-4">
            <button onClick={() => setRunning(!running)} className={`w-24 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 border ${running ? 'bg-red-500/20 text-red-200 border-red-500/20 hover:bg-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/20 hover:bg-green-500/30'}`}>
            {running ? 'Stop' : 'Start'}
            </button>
            <button onClick={lap} disabled={!running} className="w-24 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold shadow-lg disabled:opacity-30 border border-white/10 text-neutral-300">Lap</button>
            <button onClick={() => { setRunning(false); setTime(0); setLaps([]); }} className="w-24 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold shadow-lg text-neutral-300 border border-white/10">Reset</button>
        </div>
      </div>
      
      {laps.length > 0 && (
          <div className="h-1/3 w-full border-t border-white/5 overflow-auto pt-2">
              {laps.map((l, i) => (
                  <div key={i} className="flex justify-between px-8 py-2 border-b border-white/5 text-neutral-400 font-mono text-sm hover:bg-white/5 transition-colors">
                      <span>Lap {laps.length - i}</span>
                      <span>{format(l)}</span>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};
