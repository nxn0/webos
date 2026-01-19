
import React, { useState } from 'react';

export const ClickerApp = () => {
  const [count, setCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-transparent">
      <h1 className="text-6xl font-black text-orange-300 mb-8 drop-shadow-sm">{count}</h1>
      <button 
        onClick={() => setCount(c => c + multiplier)}
        className="w-32 h-32 rounded-full bg-orange-500/80 hover:bg-orange-500 text-white font-bold text-xl shadow-lg active:scale-95 transition-transform border-4 border-orange-300/20"
      >
        CLICK!
      </button>
      <div className="mt-8 space-y-2">
        <button 
          disabled={count < 50}
          onClick={() => { setCount(c => c - 50); setMultiplier(m => m + 1); }}
          className="block px-4 py-2 bg-white/5 rounded-lg shadow-sm disabled:opacity-50 text-neutral-200 backdrop-blur-sm hover:bg-white/10 transition-colors border border-white/5"
        >
          Buy Upgrade (Cost: 50) - Current: x{multiplier}
        </button>
      </div>
    </div>
  );
};
