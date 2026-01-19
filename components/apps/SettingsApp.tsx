
import React, { useState } from 'react';
import { User, Monitor, Check } from 'lucide-react';

interface SettingsAppProps {
    setBg: (url: string) => void;
    userName: string;
    setUserName: (name: string) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ 
    setBg, userName, setUserName 
}) => {
    const [bgInput, setBgInput] = useState("");
    const [nameInput, setNameInput] = useState(userName);

    const wallpapers = [
        "https://picsum.photos/id/11/1920/1080",
        "https://picsum.photos/id/15/1920/1080",
        "https://picsum.photos/id/29/1920/1080",
        "https://picsum.photos/id/48/1920/1080"
    ];

    const handleNameSave = () => {
        setUserName(nameInput);
    };

    const handleBgSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (bgInput) setBg(bgInput);
    };

    return (
        <div className="h-full flex flex-col bg-transparent text-neutral-200 overflow-y-auto">
            <div className="p-6 max-w-2xl mx-auto w-full space-y-8">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                        <User size={32} className="text-blue-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{userName}</h2>
                        <p className="text-neutral-500">System Administrator</p>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="bg-white/5 rounded-xl border border-white/5 p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User size={20}/> Profile</h3>
                    <div className="flex gap-2">
                        <input 
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 outline-none focus:border-white/30 text-neutral-200"
                            placeholder="Enter your name"
                        />
                        <button onClick={handleNameSave} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded font-medium transition-colors">
                            Save
                        </button>
                    </div>
                </div>

                {/* Wallpaper Section */}
                <div className="bg-white/5 rounded-xl border border-white/5 p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Monitor size={20}/> Wallpaper</h3>
                    <div>
                         <div className="grid grid-cols-4 gap-2 mb-4">
                             {wallpapers.map(url => (
                                 <button key={url} onClick={() => setBg(url)} className="aspect-video rounded overflow-hidden border border-white/10 hover:border-white/50 transition-colors">
                                     <img src={url} className="w-full h-full object-cover" alt="wallpaper" />
                                 </button>
                             ))}
                         </div>
                         <form onSubmit={handleBgSubmit} className="flex gap-2">
                             <input 
                                value={bgInput}
                                onChange={e => setBgInput(e.target.value)}
                                placeholder="Custom Image URL..."
                                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm outline-none text-neutral-200"
                             />
                             <button type="submit" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm font-medium">Set</button>
                         </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
