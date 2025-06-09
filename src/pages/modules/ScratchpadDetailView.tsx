import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Search, Pin, Tag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/supabase';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';

export const ScratchpadDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  useEffect(() => {
    if (projectId) {
      fetchNotes(projectId);
    }
  }, [projectId]);

  const fetchNotes = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getScratchpadNotes(id);
      if (fetchError) throw fetchError;
      setNotes(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));
  
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleReturnToWorkspace}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspace
          </button>
        </div>
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading notes...</p>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleReturnToWorkspace}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspace
          </button>
        </div>
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleReturnToWorkspace}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspace
          </button>
        </div>
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notes Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create notes to capture ideas and important information.
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </button>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={handleReturnToWorkspace}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Workspace
        </button>
      </div>
      
      <ModuleContainer title="Scratchpad" type="scratchpad">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  !selectedTag 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    selectedTag === tag 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Notes Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3">
              {filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  className="relative bg-white border-l-4 border-yellow-400 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  style={{ backgroundColor: note.color || '#fef3c7' }}
                >
                  {note.is_pinned && (
                    <Pin className="w-4 h-4 text-yellow-600 absolute top-2 right-2" />
                  )}
                  
                  <div className="pr-6">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {note.content.length > 150 
                        ? `${note.content.substring(0, 150)}...` 
                        : note.content
                      }
                    </p>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag}
                              className="text-xs bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {format(new Date(note.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {filteredNotes.length} of {notes.length} notes
            </div>
            <button className="text-xs px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
              New Note
            </button>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};