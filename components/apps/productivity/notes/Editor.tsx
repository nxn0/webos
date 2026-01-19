
import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, CheckSquare, Image as ImageIcon, Link2, Type } from 'lucide-react';
import { Note } from '../../../../services/notesService';

interface EditorProps {
    note: Note;
    onChange: (note: Note) => void;
}

export const Editor: React.FC<EditorProps> = ({ note, onChange }) => {
    const [content, setContent] = useState(note.content);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setContent(note.content);
    }, [note.id]);

    const handleChange = (val: string) => {
        setContent(val);
        onChange({ ...note, content: val, updatedAt: Date.now() });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = contentRef.current!.selectionStart;
            const end = contentRef.current!.selectionEnd;
            const val = content.substring(0, start) + "\t" + content.substring(end);
            setContent(val);
            onChange({ ...note, content: val });
            setTimeout(() => {
                contentRef.current!.selectionStart = contentRef.current!.selectionEnd = start + 1;
            }, 0);
        }
    };

    const insertFormat = (prefix: string, suffix: string = "") => {
        const textarea = contentRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);
        
        const newVal = before + prefix + selected + suffix + after;
        setContent(newVal);
        onChange({ ...note, content: newVal });
        textarea.focus();
    };

    return (
        <div className="flex flex-col h-full bg-transparent text-neutral-200">
            <div className="flex justify-between border-b border-white/5 items-center pr-4">
                <input 
                    value={note.title} 
                    onChange={e => onChange({...note, title: e.target.value, updatedAt: Date.now()})}
                    className="bg-transparent text-2xl font-bold p-4 outline-none placeholder-neutral-600 flex-1 text-neutral-100"
                    placeholder="Untitled Note"
                />
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-black/10 overflow-x-auto">
                <button onClick={() => insertFormat('**', '**')} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white" title="Bold"><Bold size={16}/></button>
                <button onClick={() => insertFormat('*', '*')} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white" title="Italic"><Italic size={16}/></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button onClick={() => insertFormat('- ')} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white" title="List"><List size={16}/></button>
                <button onClick={() => insertFormat('- [ ] ')} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white" title="Checkbox"><CheckSquare size={16}/></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button onClick={() => insertFormat('# ')} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white" title="Heading"><Type size={16}/></button>
                <button onClick={() => insertFormat('[[', ']]')} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white" title="Link Note"><Link2 size={16}/></button>
            </div>

            <textarea 
                ref={contentRef}
                className="flex-1 bg-transparent p-4 outline-none resize-none font-mono text-sm leading-relaxed text-neutral-300 placeholder-neutral-700"
                value={content}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start typing..."
            />

            <div className="p-2 border-t border-white/5 text-xs text-neutral-600 flex justify-between bg-black/10">
                <span>{content.length} chars</span>
                <span>Last updated: {new Date(note.updatedAt).toLocaleTimeString()}</span>
            </div>
        </div>
    );
};
