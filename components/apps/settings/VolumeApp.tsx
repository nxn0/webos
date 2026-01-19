
import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';

export const VolumeApp = () => {
    const [vol, setVol] = useState(50);
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-transparent text-neutral-200">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                <Volume2 size={32} className="text-neutral-400" />
            </div>
            <h2 className="text-3xl font-bold mb-8">{vol}%</h2>
            <input 
                type="range" min="0" max="100" value={vol} 
                onChange={e => setVol(Number(e.target.value))} 
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
            />
        </div>
    )
}
