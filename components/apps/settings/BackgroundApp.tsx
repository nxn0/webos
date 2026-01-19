
import React from 'react';

export const BackgroundApp = ({ setBg }: { setBg: (url: string) => void }) => {
  const bgs = [
    "https://picsum.photos/id/11/1920/1080",
    "https://picsum.photos/id/15/1920/1080",
    "https://picsum.photos/id/29/1920/1080",
    "https://picsum.photos/id/48/1920/1080"
  ];
  return (
    <div className="h-full p-4 bg-transparent text-white">
      <h2 className="text-xl font-bold mb-4">Choose Background</h2>
      <div className="grid grid-cols-2 gap-4">
        {bgs.map((url, i) => (
          <div key={i} onClick={() => setBg(url)} className="aspect-video cursor-pointer rounded overflow-hidden border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-md transition-all">
             <img src={url} className="w-full h-full object-cover" alt="bg" />
          </div>
        ))}
      </div>
    </div>
  );
};
