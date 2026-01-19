
import React, { useState } from 'react';
import { Palette } from 'lucide-react';

export const ColorPickerApp = () => {
  const [color, setColor] = useState("#3b82f6");
  
  const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return `${r}, ${g}, ${b}`;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-transparent transition-colors" style={{backgroundColor: color + '20'}}>
      <div className="bg-black/40 p-8 rounded-2xl shadow-xl flex flex-col items-center w-full max-w-sm backdrop-blur-md border border-white/10">
        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><Palette className="text-gray-400"/> Color Picker</h2>
        
        <div className="w-full aspect-video rounded-lg shadow-inner mb-6 border border-white/10" style={{backgroundColor: color}}></div>
        
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-12 cursor-pointer mb-6 rounded-lg bg-transparent" />
        
        <div className="w-full space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                <span className="text-gray-500 font-bold text-xs uppercase">HEX</span>
                <span className="font-mono font-bold text-white select-all">{color.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                <span className="text-gray-500 font-bold text-xs uppercase">RGB</span>
                <span className="font-mono font-bold text-white select-all">{hexToRgb(color)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
