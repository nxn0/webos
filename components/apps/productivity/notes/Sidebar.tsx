
import React from 'react';
import { Search, Tag, Folder, Plus } from 'lucide-react';
import { Note } from '../../../../services/notesService';

interface SidebarProps {
    notes: Note[];
    selectedNoteId: string | null;
    onSelectNote: (id: string) => void;
    onCreateNote: () => void;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ notes, selectedNoteId, onSelectNote, onCreateNote, activeFilter, onFilterChange }) => {
    const tags = Array.from(new Set(notes.flatMap(n => n.tags)));

    return (
        <div className="w-64 bg-black/20 border-r border-white/5 flex flex-col h-full backdrop-blur-sm">
            <div className="p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 text-neutral-500" size={14}/>
                    <input className="w-full bg-black/20 rounded-lg pl-8 pr-3 py-2 text-sm text-neutral-200 outline-none focus:ring-1 ring-blue-400/50 border border-white/5 placeholder:text-neutral-600" placeholder="Search..." />
                </div>
                
                <button onClick={onCreateNote} className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/20 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors">
                    <Plus size={16}/> New Note
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                <div className="text-xs font-bold text-neutral-500 px-3 py-2 uppercase tracking-wider">Library</div>
                <button 
                    onClick={() => onFilterChange('all')}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-colors ${activeFilter === 'all' ? 'bg-white/10 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'}`}
                >
                    <Folder size={16}/> All Notes
                </button>

                <div className="text-xs font-bold text-neutral-500 px-3 py-2 mt-4 uppercase tracking-wider">Tags</div>
                {tags.map(tag => (
                    <button 
                        key={tag}
                        onClick={() => onFilterChange(`tag:${tag}`)}
                        className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${activeFilter === `tag:${tag}` ? 'bg-white/10 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'}`}
                    >
                        <Tag size={14} className="text-blue-300"/> {tag}
                    </button>
                ))}
                {tags.length === 0 && <div className="px-3 text-xs text-neutral-600 italic">No tags yet</div>}
            </div>
            
            <div className="border-t border-white/5 p-2">
                <div className="space-y-1">
                    {notes.slice(0, 5).map(note => (
                         <button 
                            key={note.id} 
                            onClick={() => onSelectNote(note.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${selectedNoteId === note.id ? 'bg-blue-500/20 text-blue-200 border border-blue-500/10' : 'text-neutral-400 hover:bg-white/5'}`}
                         >
                             {note.title || 'Untitled'}
                         </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
