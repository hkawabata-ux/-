
import React, { useState, useRef, useEffect } from 'react';
import type { NoteType } from '../types';
import { NOTE_COLORS } from '../constants';
import { summarizeNote } from '../services/geminiService';

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const ResizeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 opacity-50 absolute bottom-0 right-0">
      <path d="M16 0V16H0L16 0Z" fill="currentColor"/>
    </svg>
);

const SummarizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const SpinnerIcon = () => (
     <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface NoteProps {
  note: NoteType;
  onUpdate: (id: string, newProps: Partial<Omit<NoteType, 'id'>>) => void;
  onDelete: (id: string) => void;
}

const ColorPicker: React.FC<{ onColorSelect: (color: string) => void }> = ({ onColorSelect }) => {
    return (
        <div className="absolute -top-3 left-2 flex space-x-1 p-1 bg-black/20 backdrop-blur-md rounded-full shadow-sm note-controls">
            {NOTE_COLORS.map(color => (
                <button
                    key={color}
                    aria-label={`Select ${color} color`}
                    className={`w-4 h-4 rounded-full ${color} border border-white/20 hover:scale-125 transition-transform`}
                    onClick={() => onColorSelect(color)}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            ))}
        </div>
    )
}

export const Note: React.FC<NoteProps> = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const [zIndex, setZIndex] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (text !== note.text) {
      onUpdate(note.id, { text });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        textareaRef.current?.blur();
    }
    if (e.key === 'Escape') {
        e.preventDefault();
        setText(note.text);
        setIsEditing(false);
    }
  };

  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing || (e.target as HTMLElement).closest('.note-controls, .resize-handle')) {
        return;
    }
    
    setZIndex(999);

    const startPos = { x: e.clientX, y: e.clientY };
    const startNotePos = { x: note.x, y: note.y };
    let hasDragged = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startPos.x;
      const dy = moveEvent.clientY - startPos.y;

      if (!hasDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        hasDragged = true;
      }

      if(hasDragged) {
        moveEvent.preventDefault();
        noteRef.current!.style.transform = `translate(${startNotePos.x + dx}px, ${startNotePos.y + dy}px)`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if(hasDragged) {
        const dx = upEvent.clientX - startPos.x;
        const dy = upEvent.clientY - startPos.y;
        noteRef.current!.style.transform = '';
        onUpdate(note.id, { x: startNotePos.x + dx, y: startNotePos.y + dy });
      }

      setZIndex(1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setZIndex(999);

    const startPos = { x: e.clientX, y: e.clientY };
    const startSize = { width: note.width, height: note.height };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startSize.width + (moveEvent.clientX - startPos.x);
      const newHeight = startSize.height + (moveEvent.clientY - startPos.y);
      noteRef.current!.style.width = `${Math.max(newWidth, 180)}px`;
      noteRef.current!.style.height = `${Math.max(newHeight, 180)}px`;
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        const newWidth = startSize.width + (upEvent.clientX - startPos.x);
        const newHeight = startSize.height + (upEvent.clientY - startPos.y);
        onUpdate(note.id, { 
            width: Math.max(newWidth, 180),
            height: Math.max(newHeight, 180)
        });
        setZIndex(1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

    const handleSummarize = async () => {
        if (!note.text.trim()) return;

        setIsSummarizing(true);
        setSummaryContent('');
        setIsSummaryModalOpen(true);
    
        try {
            const summary = await summarizeNote(note.text);
            setSummaryContent(summary);
        } catch (error) {
            console.error("Error during summarization:", error);
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            setSummaryContent(`Sorry, I couldn't summarize the note.\n\n**Error:** ${errorMessage}`);
        } finally {
            setIsSummarizing(false);
        }
    };

  return (
    <>
      <div 
        ref={noteRef}
        style={{
          position: 'absolute',
          transform: `translate(${note.x}px, ${note.y}px)`,
          width: note.width,
          height: note.height,
          zIndex,
        }}
        className={`group font-hand p-6 text-gray-200 shadow-xl shadow-black/30 rounded-lg backdrop-blur-md border border-white/10 transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/50 ${note.color} flex flex-col cursor-grab active:cursor-grabbing`}
        onMouseDown={handleDragMouseDown}
      >
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity note-controls flex items-center space-x-2">
          <button
              onClick={handleSummarize}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={!note.text.trim() || isSummarizing}
              className="text-gray-400 hover:text-purple-400 disabled:text-gray-600 disabled:cursor-not-allowed"
              aria-label="Summarize note"
            >
              {isSummarizing ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <SummarizeIcon />}
            </button>
          <button
            onClick={() => onDelete(note.id)}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-red-500"
            aria-label="Delete note"
          >
            <DeleteIcon />
          </button>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ColorPicker onColorSelect={(color) => onUpdate(note.id, { color })} />
        </div>

        <div className="flex-grow overflow-y-auto" onDoubleClick={() => setIsEditing(true)}>
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full h-full bg-transparent resize-none focus:outline-none text-lg leading-relaxed cursor-text"
              />
            ) : (
              <div className="w-full h-full whitespace-pre-wrap break-words text-lg leading-relaxed">
                {note.text || <span className="text-gray-500">Double click to edit...</span>}
              </div>
            )}
        </div>
        <div 
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          >
            <ResizeIcon />
        </div>
      </div>
       {isSummaryModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
              <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col" role="document">
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <h2 className="text-2xl font-bold text-gray-100 font-sans">Note Summary</h2>
                      <button 
                          onClick={() => setIsSummaryModalOpen(false)} 
                          className="text-gray-400 hover:text-white text-3xl"
                          aria-label="Close summary modal"
                      >
                          &times;
                      </button>
                  </div>
                  <div className="overflow-y-auto flex-grow pr-2">
                      {isSummarizing ? (
                          <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                              <SpinnerIcon />
                              <p className="mt-4 font-sans">Gemini is summarizing your note...</p>
                          </div>
                      ) : (
                          <article className="prose prose-invert prose-sm sm:prose-base max-w-none">
                              <p style={{whiteSpace: 'pre-wrap'}}>{summaryContent}</p>
                          </article>
                      )}
                  </div>
                  <div className="mt-6 text-right flex-shrink-0">
                      <button 
                          onClick={() => setIsSummaryModalOpen(false)} 
                          className="bg-purple-500/20 text-purple-200 px-6 py-2 rounded-md hover:bg-purple-500/40 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 font-sans"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};