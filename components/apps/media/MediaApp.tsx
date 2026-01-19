
import React, { useState } from 'react';
import { Music, Image, Video, Clapperboard } from 'lucide-react';
import { MusicApp } from './MusicApp';
import { ImageApp } from './ImageApp';
import { VideoApp } from './VideoApp';

type MediaTab = 'music' | 'gallery' | 'video';

export const MediaApp = () => {
    const [activeTab, setActiveTab] = useState<MediaTab>('music');

    return (
        <div className="h-full flex flex-col bg-transparent text-neutral-200">
            {/* Sidebar / Topbar Navigation */}
            <div className="flex border-b border-white/5 bg-black/10">
                <button 
                    onClick={() => setActiveTab('music')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'music' ? 'text-pink-300 border-b-2 border-pink-400/50 bg-white/5' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <Music size={16}/> Music
                </button>
                <button 
                    onClick={() => setActiveTab('gallery')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'gallery' ? 'text-blue-300 border-b-2 border-blue-400/50 bg-white/5' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <Image size={16}/> Gallery
                </button>
                <button 
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'video' ? 'text-purple-300 border-b-2 border-purple-400/50 bg-white/5' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <Clapperboard size={16}/> Video
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'music' && <MusicApp />}
                {activeTab === 'gallery' && <ImageApp />}
                {activeTab === 'video' && <VideoApp />}
            </div>
        </div>
    );
};
