import React, { useState, useEffect } from 'react';
import { Map, Sparkles, Save, Edit3, Plus, Trash2, Loader2, RefreshCw, Calendar, Target } from 'lucide-react';
import { generateRoadmap } from '../../lib/openai';
import { db } from '../../lib/supabase';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed';
  start_date?: string;
  end_date?: string;
  milestone: boolean;
  color: string;
  position: number;
}

interface RoadmapGeneratorProps {
  projectId: string;
  prdContent: string;
  onRoadmapGenerated: (roadmapData: { items: RoadmapItem[]; count: number }) => void;
}

export const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({ 
  projectId, 
  prdContent, 
  onRoadmapGenerated 
}) => {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Auto-generate roadmap when component mounts
  useEffect(() => {
    if (prdContent && !hasGenerated) {
      handleGenerateRoadmap();
    }
  }, [prdContent, hasGenerated]);

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generatedItems = await generateRoadmap(prdContent);
      setRoadmapItems(generatedItems);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate roadmap');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRoadmap = async () => {
    if (roadmapItems.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save each roadmap item to database
      const savedItems = [];
      for (const item of roadmapItems) {
        const { data: roadmapItem, error: saveError } = await db.createRoadmapItem({
          project_id: projectId,
          title: item.title,
          description: item.description,
          status: item.status,
          start_date: item.start_date || null,
          end_date: item.end_date || null,
          milestone: item.milestone,
          color: item.color,
          position: item.position,
        });

        if (saveError) throw saveError;
        savedItems.push(roadmapItem);
      }

      // Call the callback with roadmap data
      onRoadmapGenerated({
        items: roadmapItems,
        count: roadmapItems.length,
      });
    } catch (error) {
      console.error('Error saving roadmap:', error);
      setError(error instanceof Error ? error.message : 'Failed to save roadmap');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = () => {
    const newItem: RoadmapItem = {
      title: 'New Roadmap Item',
      description: 'Add description here...',
      status: 'planned',
      milestone: false,
      color: '#3b82f6',
      position: roadmapItems.length,
    };
    setRoadmapItems([...roadmapItems, newItem]);
    setEditingIndex(roadmapItems.length);
  };

  const handleUpdateItem = (index: number, updates: Partial<RoadmapItem>) => {
    const updatedItems = roadmapItems.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    );
    setRoadmapItems(updatedItems);
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = roadmapItems.filter((_, i) => i !== index);
    // Update positions
    const reorderedItems = updatedItems.map((item, i) => ({ ...item, position: i }));
    setRoadmapItems(reorderedItems);
    setEditingIndex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhaseLabel = (index: number) => {
    if (index === 0) return 'MVP';
    if (index === 1) return 'Phase 2';
    if (index === 2) return 'Phase 3';
    return `Phase ${index + 1}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Map className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Project Roadmap</h3>
            <p className="text-sm text-gray-600">AI-generated roadmap based on your PRD</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasGenerated && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? 'Done Editing' : 'Edit Items'}
            </button>
          )}
          
          {hasGenerated && (
            <button
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="flex-1 bg-gray-50 rounded-lg p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Roadmap</h3>
            <p className="text-gray-600">
              AI is analyzing your PRD and creating a phased development roadmap...
            </p>
          </div>
        </div>
      )}

      {/* Roadmap Items */}
      {hasGenerated && !isGenerating && (
        <div className="flex-1 flex flex-col">
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex-1 overflow-y-auto">
            <div className="space-y-6">
              {roadmapItems.map((item, index) => (
                <div key={index} className="relative">
                  {/* Phase Label */}
                  <div className="flex items-center mb-3">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {getPhaseLabel(index)}
                    </div>
                    {item.milestone && (
                      <div className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        Milestone
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {editingIndex === index ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(index, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Roadmap item title"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                          rows={3}
                          placeholder="Description of this phase..."
                        />
                        <div className="flex items-center space-x-4">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateItem(index, { status: e.target.value as any })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="planned">Planned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={item.milestone}
                              onChange={(e) => handleUpdateItem(index, { milestone: e.target.checked })}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">Milestone</span>
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                            {isEditing && (
                              <button
                                onClick={() => setEditingIndex(index)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{item.description}</p>
                        {(item.start_date || item.end_date) && (
                          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                            {item.start_date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Start: {new Date(item.start_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {item.end_date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>End: {new Date(item.end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Connection Line */}
                  {index < roadmapItems.length - 1 && (
                    <div className="flex justify-center my-4">
                      <div className="w-0.5 h-6 bg-gray-300"></div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Item Button */}
              {isEditing && (
                <button
                  onClick={handleAddItem}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Roadmap Item</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasGenerated && !isGenerating && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
          <div className="text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>Review your roadmap phases, then save to continue</span>
            </span>
          </div>
          
          <button
            onClick={handleSaveRoadmap}
            disabled={roadmapItems.length === 0 || isSaving}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Roadmap...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Roadmap & Continue
              </>
            )}
          </button>
        </div>
      )}

      {/* Initial Generate Button */}
      {!hasGenerated && !isGenerating && (
        <div className="flex-1 bg-gray-50 rounded-lg p-8 flex items-center justify-center">
          <div className="text-center">
            <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate Your Roadmap</h3>
            <p className="text-gray-600 mb-6">
              I'll create a phased development roadmap based on your PRD, breaking down the work into manageable phases.
            </p>
            <button
              onClick={handleGenerateRoadmap}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Roadmap
            </button>
          </div>
        </div>
      )}
    </div>
  );
};