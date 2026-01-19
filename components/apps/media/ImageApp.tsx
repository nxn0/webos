
import React from 'react';

export const ImageApp = () => {
  return (
    <div className="h-full bg-transparent flex items-center justify-center overflow-hidden">
        <div className="grid grid-cols-3 gap-2 p-2 w-full h-full overflow-y-auto content-start">
            {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(i => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-white/5 hover:opacity-80 cursor-pointer transition-all">
                    <img src={`https://picsum.photos/300/300?random=${i}`} className="w-full h-full object-cover" alt="Gallery" />
                </div>
            ))}
        </div>
    </div>
  );
};
