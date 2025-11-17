import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { NoteType, GroupType } from './types';
import { NOTE_COLORS, GROUP_COLORS } from './constants';
import { Note } from './components/Note';
import { Group } from './components/Group';

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const GroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const App: React.FC = () => {
    const [notes, setNotes] = useState<NoteType[]>([]);
    const [groups, setGroups] = useState<GroupType[]>([]);
    const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

    useEffect(() => {
        try {
            const savedState = localStorage.getItem('sticky-notes-app-state');
            if (savedState) {
                const { notes, groups } = JSON.parse(savedState);
                setNotes(notes || []);
                setGroups(groups || []);
            }
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
            setNotes([]);
            setGroups([]);
        }
    }, []);

    useEffect(() => {
        try {
            const stateToSave = { notes, groups };
            localStorage.setItem('sticky-notes-app-state', JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [notes, groups]);
    
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
        setGroups(prevGroups => {
            return prevGroups.map(group => ({
                ...group,
                noteIds: group.noteIds.filter(noteId => noteId !== id)
            })).filter(group => group.noteIds.length > 0);
        });
        setSelectedNoteIds(prev => prev.filter(noteId => noteId !== id));
    }, []);
    
    const clearAllNotes = useCallback(() => {
        if (window.confirm('Are you sure you want to delete all notes and groups? This action cannot be undone.')) {
            setNotes([]);
            setGroups([]);
            setSelectedNoteIds([]);
        }
    }, []);

    const handleNoteSelect = useCallback((noteId: string, isMultiSelect: boolean) => {
        setSelectedNoteIds(prev => {
            if (isMultiSelect) {
                return prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId];
            }
            // If it's a single click and the note is already the only one selected, deselect it.
            if (prev.length === 1 && prev[0] === noteId) {
                return [];
            }
            return [noteId];
        });
    }, []);

    const handleGroupSelection = useCallback(() => {
        if (selectedNoteIds.length === 0) return;

        const groupTitle = window.prompt("Enter a name for the new group:", "My Group");
        if (!groupTitle) return;

        const selectedNotes = notes.filter(n => selectedNoteIds.includes(n.id));
        if (selectedNotes.length === 0) return;

        const minX = Math.min(...selectedNotes.map(n => n.x));
        const minY = Math.min(...selectedNotes.map(n => n.y));
        const maxX = Math.max(...selectedNotes.map(n => n.x + n.width));
        const maxY = Math.max(...selectedNotes.map(n => n.y + n.height));
        const padding = 40;

        const newGroup: GroupType = {
            id: `group-${new Date().toISOString()}`,
            title: groupTitle,
            noteIds: selectedNoteIds,
            x: minX - padding,
            y: minY - padding,
            width: (maxX - minX) + (padding * 2),
            height: (maxY - minY) + (padding * 2),
            color: GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)],
            isCollapsed: false,
        };

        setGroups(prev => [...prev, newGroup]);
        setSelectedNoteIds([]);
    }, [notes, selectedNoteIds]);
    
    const updateGroup = useCallback((id: string, newProps: Partial<Omit<GroupType, 'id'>>) => {
        setGroups(prevGroups =>
            prevGroups.map(group => (group.id === id ? { ...group, ...newProps } : group))
        );
    }, []);

    const groupedNoteIds = useMemo(() => new Set(groups.flatMap(g => g.noteIds)), [groups]);
    const ungroupedNotes = useMemo(() => notes.filter(note => !groupedNoteIds.has(note.id)), [notes, groupedNoteIds]);

    const handleBackgroundClick = (e: React.MouseEvent<HTMLElement>) => {
        // Deselect notes only if the click is on the main background itself, not on any child element.
        if (e.target === e.currentTarget) {
            setSelectedNoteIds([]);
        }
    };

    return (
        <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8 overflow-hidden">
            <header className="text-center mb-8 relative z-10">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-100">Gemini Sticky Notes</h1>
                <p className="text-gray-400 mt-2">Drag to move, resize, Cmd/Ctrl+Click to select, and double-click to edit.</p>
            </header>
            
            <div className="fixed bottom-6 right-6 z-30 flex flex-col space-y-4">
                {selectedNoteIds.length > 0 && (
                     <button
                        onClick={handleGroupSelection}
                        className="flex items-center justify-center w-16 h-16 bg-purple-500/20 text-purple-200 rounded-full shadow-lg backdrop-blur-md border border-white/20 hover:bg-purple-500/40 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500/50"
                        aria-label="Group selected notes"
                     >
                        <GroupIcon />
                    </button>
                )}
                <button
                    onClick={addNote}
                    className="flex items-center justify-center w-16 h-16 bg-white/10 text-white rounded-full shadow-lg backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white/50"
                    aria-label="Add new note"
                >
                    <AddIcon />
                </button>
                 <button
                    onClick={clearAllNotes}
                    disabled={notes.length === 0 && groups.length === 0}
                    className="flex items-center justify-center w-16 h-16 bg-red-500/20 text-red-300 rounded-full shadow-lg backdrop-blur-md border border-white/20 hover:bg-red-500/40 hover:text-white disabled:bg-white/5 disabled:text-gray-500 disabled:border-gray-500/20 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500/50"
                    aria-label="Delete all notes"
                 >
                    <TrashIcon />
                </button>
            </div>

            <main className="absolute top-0 left-0 w-full h-full" onClick={handleBackgroundClick}>
                {ungroupedNotes.length > 0 || groups.length > 0 ? (
                    <>
                        {groups.map(group => (
                            <Group 
                                key={group.id} 
                                group={group}
                                notes={notes.filter(n => group.noteIds.includes(n.id))}
                                onUpdateGroup={updateGroup}
                                onUpdateNote={updateNote}
                                onDeleteNote={deleteNote}
                                onSelectNote={handleNoteSelect}
                                selectedNoteIds={selectedNoteIds}
                            />
                        ))}
                        {ungroupedNotes.map(note => (
                            <Note 
                                key={note.id} 
                                note={note}
                                onUpdate={updateNote}
                                onDelete={deleteNote}
                                onSelect={handleNoteSelect}
                                isSelected={selectedNoteIds.includes(note.id)}
                            />
                        ))}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full pointer-events-none">
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