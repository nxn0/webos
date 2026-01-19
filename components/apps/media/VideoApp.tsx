
import React from 'react';

export const VideoApp = () => {
  return (
    <div className="h-full bg-transparent flex flex-col p-4">
      <div className="flex-1 flex items-center justify-center bg-black/40 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm shadow-2xl">
        <video controls className="max-h-full max-w-full" poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg">
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};
