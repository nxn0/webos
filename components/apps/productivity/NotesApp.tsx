
import React, { useState, useEffect } from 'react';
import { Sidebar } from './notes/Sidebar';
import { Editor } from './notes/Editor';
import { Note, getNotes, saveNote, deleteNote } from '../../../services/notesService';
import { Loader2 } from 'lucide-react';

export const NotesApp = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const loaded = await getNotes();
            setNotes(loaded);
            if (!selectedNoteId && loaded.length > 0) {
                setSelectedNoteId(loaded[0].id);
            }
        } catch (e) {
            console.error("Failed to load notes", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: '',
            content: '',
            tags: [],
            isSticky: false,
            isPinned: false,
            position: { x: 100, y: 100, width: 250, height: 250, color: '#fef3c7' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            images: []
        };
        await saveNote(newNote);
        setNotes([newNote, ...notes]);
        setSelectedNoteId(newNote.id);
    };

    const handleUpdateNote = async (updated: Note) => {
        // Optimistic update
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
        // Direct save is fine for IDB
        await saveNote(updated);
    };

    const handleDeleteNote = async (id: string) => {
        await deleteNote(id);
        setNotes(prev => prev.filter(n => n.id !== id));
        if (selectedNoteId === id) setSelectedNoteId(null);
    };

    const filteredNotes = notes.filter(n => {
        if (filter === 'all') return true;
        if (filter.startsWith('tag:')) return n.tags.includes(filter.replace('tag:', ''));
        return true;
    });

    const activeNote = notes.find(n => n.id === selectedNoteId);

    if (loading) return <div className="h-full flex items-center justify-center bg-transparent text-neutral-200"><Loader2 className="animate-spin text-neutral-500" /></div>;

    return (
        <div className="flex h-full bg-transparent text-neutral-200 overflow-hidden font-sans">
            <Sidebar 
                notes={filteredNotes}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onCreateNote={handleCreateNote}
                activeFilter={filter}
                onFilterChange={setFilter}
            />
            
            <div className="flex-1 h-full relative bg-transparent">
                {activeNote ? (
                    <Editor note={activeNote} onChange={handleUpdateNote} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                        <p>Select a note or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
