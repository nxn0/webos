
import React from 'react';
import { AppId } from '../../types';
import { Sparkles } from 'lucide-react';

interface DesktopIconsProps {
  onAppClick: (appId: AppId) => void;
}

export const DesktopIcons: React.FC<DesktopIconsProps> = ({ onAppClick }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            {/* Hidden Easter Egg Icon */}
            <div 
                className="absolute bottom-20 right-10 w-12 h-12 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-500 cursor-pointer flex flex-col items-center justify-center group"
                onClick={() => onAppClick(AppId.EASTER_EGG)}
            >
                <div className="w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    <Sparkles size={20} className="text-purple-400 animate-pulse" />
                </div>
                <span className="text-[10px] text-purple-200 mt-1 font-mono">Void</span>
            </div>
        </div>
    );
};
