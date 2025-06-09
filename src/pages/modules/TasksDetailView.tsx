import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Filter, Clock, Tag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/supabase';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';

export const TasksDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  
  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId]);

  const fetchTasks = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getTasks(id);
      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return showCompleted || task.status !== 'done';
    return task.status === filter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string, completed: boolean = false) => {
    if (status === 'done' || completed) {
      return <CheckSquare className="w-4 h-4 text-green-600" />;
    }
    return <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />;
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
        <ModuleContainer title="Tasks" type="tasks">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tasks...</p>
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
        <ModuleContainer title="Tasks" type="tasks">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (tasks.length === 0) {
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
        <ModuleContainer title="Tasks" type="tasks">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create tasks to track your development progress.
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
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
      
      <ModuleContainer title="Tasks" type="tasks">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  showCompleted 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {showCompleted ? 'Hide' : 'Show'} Completed
              </button>
            </div>
            
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredTasks.map((task) => (
              <div 
                key={task.id} 
                className={`bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer ${
                  task.status === 'done' ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <button 
                    className="mt-0.5 flex-shrink-0"
                    onClick={() => {
                      // TODO: Toggle task completion
                    }}
                  >
                    {getStatusIcon(task.status)}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-medium text-sm ${
                        task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{task.description}</p>
                    )}
                    
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      {task.estimated_hours && (
                        <span className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimated_hours}h</span>
                        </span>
                      )}
                      
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          Due {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {task.tags.slice(0, 2).join(', ')}
                            {task.tags.length > 2 && ` +${task.tags.length - 2}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {tasks.filter(t => t.status !== 'done').length} active • {tasks.filter(t => t.status === 'done').length} completed
            </div>
            <button className="text-xs px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
              Add Task
            </button>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};