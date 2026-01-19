
import React, { useState, useEffect } from 'react';

export const TimerApp = () => {
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [inputVal, setInputVal] = useState("5");

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggle = () => {
    if (timeLeft === 0 && !isRunning) setTimeLeft(parseInt(inputVal) * 60);
    setIsRunning(!isRunning);
  };

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-transparent text-white p-6 relative overflow-hidden">
      <div className={`absolute w-64 h-64 rounded-full border-4 border-white/10 ${isRunning ? 'animate-pulse' : ''}`}></div>
      
      <div className="text-7xl font-mono mb-8 font-bold tracking-widest text-blue-400 z-10 drop-shadow-lg">
        {format(timeLeft)}
      </div>
      <div className="flex gap-4 items-center z-10 bg-white/5 p-2 rounded-lg border border-white/10">
         <input 
            type="number" 
            value={inputVal} 
            onChange={(e) => setInputVal(e.target.value)} 
            className="w-16 p-2 rounded bg-black/20 text-white font-bold text-center border-none outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            disabled={isRunning}
         />
         <span className="text-gray-400 font-bold pr-2">min</span>
      </div>
      <button 
        onClick={toggle}
        className={`mt-10 px-10 py-4 rounded-full text-xl font-bold transition-all shadow-xl z-10 text-white ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-500'}`}
      >
        {isRunning ? 'Stop' : 'Start Timer'}
      </button>
    </div>
  );
};
