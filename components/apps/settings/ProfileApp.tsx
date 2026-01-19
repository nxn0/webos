
import React from 'react';
import { User } from 'lucide-react';

export const ProfileApp = () => {
    return (
        <div className="h-full p-6 flex flex-col items-center bg-transparent text-neutral-200">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-200 shadow-lg border border-blue-500/20">
                <User size={48} />
            </div>
            <h2 className="text-xl font-bold">Guest User</h2>
            <p className="text-neutral-500 mb-8">Administrator</p>
            
            <div className="w-full space-y-2">
                <div className="p-3 bg-white/5 rounded-lg flex justify-between backdrop-blur-sm border border-white/5">
                    <span className="text-neutral-400">Account Type</span>
                    <span className="font-bold">Local</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg flex justify-between backdrop-blur-sm border border-white/5">
                    <span className="text-neutral-400">Uptime</span>
                    <span className="font-bold">0h 42m</span>
                </div>
            </div>
        </div>
    )
}
