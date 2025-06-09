import React, { useState, useEffect } from 'react';
import { Map, Calendar, Target, Plus, Edit3, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/supabase';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';

interface RoadmapItem {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
  progress: number;
  dependencies: string[];
  milestone: boolean;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export const RoadmapDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  
  useEffect(() => {
    if (projectId) {
      fetchRoadmapItems(projectId);
    }
  }, [projectId]);

  const fetchRoadmapItems = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getRoadmapItems(id);
      if (fetchError) throw fetchError;
      setRoadmapItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roadmap items');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const sortedItems = roadmapItems.sort((a, b) => a.position - b.position);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-gray-300';
  };

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
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading roadmap...</p>
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
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (roadmapItems.length === 0) {
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
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roadmap Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create roadmap items to plan your project phases.
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Phase
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
      
      <ModuleContainer title="Roadmap" type="roadmap">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Timeline
              </button>
            </div>
            
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Roadmap Content */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'kanban' ? (
              <div className="space-y-3">
                {sortedItems.map((item, index) => (
                  <div key={item.id} className="relative">
                    <div 
                      className="bg-white border-2 rounded-lg p-3 hover:shadow-sm transition-shadow"
                      style={{ borderColor: item.color }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                          {item.milestone && (
                            <Target className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-xs mb-3 leading-relaxed">{item.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Progress</span>
                          <span className="text-xs font-medium text-gray-700">{item.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${getProgressColor(item.progress)}`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Dates */}
                      {(item.start_date || item.end_date) && (
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          {item.start_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Start: {format(new Date(item.start_date), 'MMM d')}</span>
                            </div>
                          )}
                          {item.end_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>End: {format(new Date(item.end_date), 'MMM d')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Connection Line */}
                    {index < sortedItems.length - 1 && (
                      <div className="flex justify-center my-2">
                        <div className="w-0.5 h-4 bg-gray-300"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                        {item.milestone && (
                          <Target className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{item.progress}%</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {roadmapItems.length} phase{roadmapItems.length !== 1 ? 's' : ''} • {roadmapItems.filter(item => item.status === 'completed').length} completed
            </div>
            <button className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              Add Phase
            </button>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};