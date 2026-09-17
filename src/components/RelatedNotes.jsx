import React, { useState } from 'react';
import { useNotes, useCreateNote, useDeleteNote } from '../hooks/useNotes';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

export default function RelatedNotes({ entityType, entityId, currentUser }) {
  const [newNote, setNewNote] = useState('');
  
  const params = {};
  if (entityType === 'deal') params.dealId = entityId;
  if (entityType === 'lead') params.leadId = entityId;
  if (entityType === 'company') params.companyId = entityId;
  if (entityType === 'contact') params.contactId = entityId;
  
  const { data, isLoading } = useNotes(params);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    try {
      await createNote.mutateAsync({
        content: newNote.trim(),
        ...params
      });
      setNewNote('');
    } catch (error) {
      alert('Failed to add note');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this note?')) {
      try {
        await deleteNote.mutateAsync(id);
      } catch (error) {
        alert('Failed to delete note');
      }
    }
  };

  const notes = data?.data || [];

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddNote} className="relative">
        <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <label htmlFor="note" className="sr-only">Add a note</label>
          <textarea
            rows={3}
            name="note"
            id="note"
            className="block w-full py-3 px-4 border-0 resize-none focus:ring-0 sm:text-sm"
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <div className="py-2 px-3 bg-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={!newNote.trim() || createNote.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              Add Note
            </button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="text-gray-500 text-sm">Loading notes...</div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-500">No notes yet.</p>
      ) : (
        <div className="space-y-4">
          {notes.map(note => {
            const canDelete = currentUser?.role !== 'SALES_REP' || note.author?.id === currentUser?.id;
            
            return (
              <div key={note.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm text-gray-900">
                      {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Unknown'}
                    </span>
                    <span className="text-gray-500 text-sm">&middot;</span>
                    <span className="text-gray-500 text-sm">
                      {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                  {note.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
