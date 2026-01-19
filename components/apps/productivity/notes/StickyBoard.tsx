
import React, { useRef, useState, useEffect } from 'react';
import { Note } from '../../../../services/notesService';
import { Pin, X, GripHorizontal, Palette, FileText } from 'lucide-react';

interface StickyBoardProps {
    notes: Note[];
    onUpdate: (note: Note) => void;
    onDelete: (id: string) => void;
}

export const StickyBoard: React.FC<StickyBoardProps> = ({ notes, onUpdate, onDelete }) => {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [tempPos, setTempPos] = useState<{x: number, y: number} | null>(null);
    
    // Refs for drag state to avoid stale closures in event listeners
    const dragData = useRef<{ startX: number, startY: number, noteX: number, noteY: number } | null>(null);
    const currentPosRef = useRef<{x: number, y: number} | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingId || !dragData.current) return;
            e.preventDefault();

            const dx = e.clientX - dragData.current.startX;
            const dy = e.clientY - dragData.current.startY;
            
            const newPos = {
                x: dragData.current.noteX + dx,
                y: dragData.current.noteY + dy
            };
            
            currentPosRef.current = newPos;
            setTempPos(newPos);
        };

        const handleMouseUp = () => {
            if (draggingId && currentPosRef.current) {
                const note = notes.find(n => n.id === draggingId);
                if (note) {
                    onUpdate({
                        ...note,
                        position: { ...note.position, x: currentPosRef.current.x, y: currentPosRef.current.y }
                    });
                }
            }
            setDraggingId(null);
            setTempPos(null);
            dragData.current = null;
            currentPosRef.current = null;
        };

        if (draggingId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingId, notes, onUpdate]);

    const handleMouseDown = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        setDraggingId(note.id);
        dragData.current = {
            startX: e.clientX,
            startY: e.clientY,
            noteX: note.position.x,
            noteY: note.position.y
        };
        currentPosRef.current = { x: note.position.x, y: note.position.y };
        setTempPos({ x: note.position.x, y: note.position.y });
    };

    const togglePin = (note: Note) => {
        onUpdate({ ...note, isPinned: !note.isPinned });
    };

    const toggleStickyMode = (note: Note) => {
        onUpdate({ ...note, isSticky: false });
    };

    const changeColor = (note: Note) => {
        const colors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3f4f6'];
        const currentIdx = colors.indexOf(note.position.color);
        const nextColor = colors[(currentIdx + 1) % colors.length];
        onUpdate({ ...note, position: { ...note.position, color: nextColor }});
    };

    return (
        <div className="flex-1 bg-transparent relative overflow-hidden">
            <div className="absolute top-4 left-4 text-neutral-500 pointer-events-none select-none z-0">
                Drag stickies to arrange.
            </div>

            {notes.map(note => {
                const isDragging = draggingId === note.id;
                const pos = isDragging && tempPos ? tempPos : note.position;

                return (
                    <div
                        key={note.id}
                        className={`absolute rounded-xl shadow-lg flex flex-col w-64 h-64 border border-white/10 transition-shadow backdrop-blur-md ${isDragging ? 'shadow-2xl z-50 cursor-grabbing' : 'hover:shadow-xl z-10'}`}
                        style={{ 
                            left: pos.x, 
                            top: pos.y, 
                            backgroundColor: note.position.color + 'E6' // Add transparency to hex
                        }}
                    >
                        <div 
                            className="h-8 cursor-grab active:cursor-grabbing flex items-center justify-between px-2 border-b border-black/5 select-none"
                            onMouseDown={(e) => handleMouseDown(e, note)}
                        >
                            <GripHorizontal size={14} className="text-black/30" />
                            <div className="flex gap-1" onMouseDown={e => e.stopPropagation()}>
                                <button onClick={() => toggleStickyMode(note)} className="p-1 hover:bg-black/10 rounded text-black/40" title="Convert to regular note"><FileText size={12} /></button>
                                <button onClick={() => changeColor(note)} className="p-1 hover:bg-black/10 rounded text-black/40" title="Change Color"><Palette size={12} /></button>
                                <button onClick={() => togglePin(note)} className={`p-1 hover:bg-black/10 rounded ${note.isPinned ? 'text-blue-500' : 'text-black/40'}`} title="Pin to Desktop"><Pin size={12} fill={note.isPinned ? "currentColor" : "none"}/></button>
                                <button onClick={() => onDelete(note.id)} className="p-1 hover:bg-red-500/10 rounded text-red-500/60 hover:text-red-600" title="Delete"><X size={12} /></button>
                            </div>
                        </div>
                        <textarea 
                            className="flex-1 bg-transparent p-4 outline-none resize-none text-gray-800 text-sm font-medium leading-relaxed placeholder-black/30"
                            value={note.content}
                            onChange={(e) => onUpdate({...note, content: e.target.value, updatedAt: Date.now()})}
                            placeholder="Type a sticky note..."
                            onMouseDown={e => e.stopPropagation()} 
                        />
                    </div>
                );
            })}
        </div>
    );
};
