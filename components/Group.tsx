import React, { useRef } from 'react';
import type { GroupType, NoteType } from '../types';
import { Note } from './Note';

interface GroupProps {
    group: GroupType;
    notes: NoteType[];
    onUpdateGroup: (id: string, newProps: Partial<Omit<GroupType, 'id'>>) => void;
    onUpdateNote: (id: string, newProps: Partial<Omit<NoteType, 'id'>>) => void;
    onDeleteNote: (id: string) => void;
    onSelectNote: (id: string, isMultiSelect: boolean) => void;
    selectedNoteIds: string[];
}

const CollapseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);

const ExpandIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


export const Group: React.FC<GroupProps> = ({ group, notes, onUpdateGroup, onUpdateNote, onDeleteNote, onSelectNote, selectedNoteIds }) => {
    const groupRef = useRef<HTMLDivElement>(null);

    const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button, .note-controls, .resize-handle') || (e.target as HTMLElement).closest('.group > .relative')) {
            return;
        }
        e.stopPropagation();

        const startPos = { x: e.clientX, y: e.clientY };
        const startGroupPos = { x: group.x, y: group.y };
        const startNotesPos: Map<string, { x: number; y: number; }> = new Map(notes.map(n => [n.id, { x: n.x, y: n.y }]));
        let hasDragged = false;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startPos.x;
            const dy = moveEvent.clientY - startPos.y;

            if (!hasDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                hasDragged = true;
            }

            if (hasDragged) {
                groupRef.current!.style.transform = `translate(${startGroupPos.x + dx}px, ${startGroupPos.y + dy}px)`;
            }
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            if (hasDragged) {
                const dx = upEvent.clientX - startPos.x;
                const dy = upEvent.clientY - startPos.y;
                
                onUpdateGroup(group.id, { x: startGroupPos.x + dx, y: startGroupPos.y + dy });
                notes.forEach(note => {
                    const initialPos = startNotesPos.get(note.id);
                    if (initialPos) {
                        onUpdateNote(note.id, { x: initialPos.x + dx, y: initialPos.y + dy });
                    }
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const toggleCollapse = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdateGroup(group.id, { isCollapsed: !group.isCollapsed });
    }

    const effectiveHeight = group.isCollapsed ? 'auto' : group.height;

    return (
        <div
            ref={groupRef}
            style={{
                position: 'absolute',
                transform: `translate(${group.x}px, ${group.y}px)`,
                width: group.width,
                height: effectiveHeight,
                zIndex: 0,
            }}
            className={`shadow-xl shadow-black/30 rounded-xl backdrop-blur-lg border border-white/10 transition-all duration-300 ${group.color} cursor-grab active:cursor-grabbing flex flex-col`}
            onMouseDown={handleDragMouseDown}
        >
            <header className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
                <h3 className="font-bold font-sans text-gray-200 truncate">{group.title}</h3>
                <button 
                    onClick={toggleCollapse}
                    className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
                    aria-label={group.isCollapsed ? "Expand group" : "Collapse group"}
                >
                    {group.isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
                </button>
            </header>
            
            {!group.isCollapsed && (
                <div className="relative w-full h-full flex-grow">
                    {notes.map(note => (
                        <Note
                            key={note.id}
                            note={note}
                            onUpdate={onUpdateNote}
                            onDelete={onDeleteNote}
                            onSelect={onSelectNote}
                            isSelected={selectedNoteIds.includes(note.id)}
                            groupPosition={{ x: group.x, y: group.y }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};