
import React from 'react';
import { RefreshCw } from 'lucide-react';

export const RefreshApp = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-transparent text-neutral-200">
            <h2 className="text-lg font-medium mb-6 text-neutral-300">System Issues?</h2>
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-200 border border-red-500/20 rounded-xl hover:bg-red-500/30 shadow-lg transition-colors font-medium">
                <RefreshCw size={18} /> Reload System
            </button>
        </div>
    )
}
