
import React, { useState, useEffect, useCallback } from 'react';
import type { NoteType } from './types';
import { NOTE_COLORS } from './constants';
import { Note } from './components/Note';

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const App: React.FC = () => {
    const [notes, setNotes] = useState<NoteType[]>([]);

    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem('sticky-notes-app');
            if (savedNotes) {
                setNotes(JSON.parse(savedNotes));
            }
        } catch (error) {
            console.error("Failed to load notes from localStorage", error);
            setNotes([]);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('sticky-notes-app', JSON.stringify(notes));
        } catch (error) {
            console.error("Failed to save notes to localStorage", error);
        }
    }, [notes]);
    
    const addNote = useCallback(() => {
        const newNote: NoteType = {
            id: new Date().toISOString(),
            text: '',
            color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
            x: 50 + (notes.length % 10) * 30,
            y: 150 + Math.floor(notes.length / 10) * 30,
            width: 240,
            height: 240,
        };
        setNotes(prevNotes => [newNote, ...prevNotes]);
    }, [notes.length]);

    const updateNote = useCallback((id: string, newProps: Partial<Omit<NoteType, 'id'>>) => {
        setNotes(prevNotes =>
            prevNotes.map(note => (note.id === id ? { ...note, ...newProps } : note))
        );
    }, []);

    const deleteNote = useCallback((id: string) => {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    }, []);
    
    const clearAllNotes = useCallback(() => {
        if (window.confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
            setNotes([]);
        }
    }, []);

    return (
        <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8 overflow-hidden">
            <header className="text-center mb-8 relative z-10">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-100">Gemini Sticky Notes</h1>
                <p className="text-gray-400 mt-2">Drag to move, resize, and double-click to edit. Press Cmd/Ctrl+Enter to save.</p>
            </header>
            
            <div className="fixed bottom-6 right-6 z-20 flex flex-col space-y-4">
                <button
                    onClick={addNote}
                    className="flex items-center justify-center w-16 h-16 bg-white/10 text-white rounded-full shadow-lg backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white/50"
                    aria-label="Add new note"
                >
                    <AddIcon />
                </button>
                 <button
                    onClick={clearAllNotes}
                    disabled={notes.length === 0}
                    className="flex items-center justify-center w-16 h-16 bg-red-500/20 text-red-300 rounded-full shadow-lg backdrop-blur-md border border-white/20 hover:bg-red-500/40 hover:text-white disabled:bg-white/5 disabled:text-gray-500 disabled:border-gray-500/20 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500/50"
                    aria-label="Delete all notes"
                 >
                    <TrashIcon />
                </button>
            </div>

            <main className="absolute top-0 left-0 w-full h-full">
                {notes.length > 0 ? (
                    <div>
                        {notes.map(note => (
                            <Note 
                                key={note.id} 
                                note={note}
                                onUpdate={updateNote}
                                onDelete={deleteNote}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-gray-400 text-xl">No notes yet. Add one to get started!</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;