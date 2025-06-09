import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Copy, Star, Play, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/supabase';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';

export const PromptsDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  useEffect(() => {
    if (projectId) {
      fetchPrompts(projectId);
    }
  }, [projectId]);

  const fetchPrompts = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getPrompts(id);
      if (fetchError) throw fetchError;
      setPrompts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const categories = Array.from(new Set(prompts.map(prompt => prompt.category)));
  
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
        <ModuleContainer title="Prompts" type="prompts">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading prompts...</p>
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
        <ModuleContainer title="Prompts" type="prompts">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (prompts.length === 0) {
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
        <ModuleContainer title="Prompts" type="prompts">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prompts Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create AI prompts to streamline your development workflow.
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Prompt
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
      
      <ModuleContainer title="Prompts" type="prompts">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search prompts..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  !selectedCategory 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === category 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Prompts List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredPrompts.map((prompt) => (
              <div 
                key={prompt.id}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-sm text-gray-900">{prompt.name}</h4>
                    {prompt.is_template && (
                      <Star className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy prompt"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button 
                      className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                      title="Use prompt"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {prompt.description && (
                  <p className="text-xs text-gray-600 mb-2">{prompt.description}</p>
                )}
                
                <div className="bg-gray-50 rounded-md p-2 mb-2">
                  <p className="text-xs text-gray-700 font-mono leading-relaxed">
                    {prompt.content.length > 100 
                      ? `${prompt.content.substring(0, 100)}...` 
                      : prompt.content
                    }
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {prompt.category}
                    </span>
                    <span>Used {prompt.usage_count} times</span>
                  </div>
                  <span>{format(new Date(prompt.updated_at), 'MMM d')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {filteredPrompts.length} of {prompts.length} prompts
            </div>
            <button className="text-xs px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
              New Prompt
            </button>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};