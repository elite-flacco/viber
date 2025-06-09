import React, { useState, useEffect } from 'react';
import { ListTodo, Sparkles, Save, Edit3, Plus, Trash2, Loader2, RefreshCw, Clock, Tag, Calendar } from 'lucide-react';
import { generateTasks } from '../../lib/openai';
import { db } from '../../lib/supabase';
import { format } from 'date-fns';

interface TaskItem {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  due_date?: string;
  tags: string[];
  dependencies: string[];
  position: number;
}

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

interface TaskGeneratorProps {
  projectId: string;
  prdContent: string;
  roadmapItems: RoadmapItem[];
  onTasksGenerated: (tasksData: { tasks: TaskItem[]; count: number }) => void;
}

export const TaskGenerator: React.FC<TaskGeneratorProps> = ({ 
  projectId, 
  prdContent, 
  roadmapItems, 
  onTasksGenerated 
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Debug logging for component props
  useEffect(() => {
    console.log('🔍 TaskGenerator Debug - Component Mounted');
    console.log('  - projectId:', projectId);
    console.log('  - prdContent length:', prdContent?.length || 0);
    console.log('  - roadmapItems count:', roadmapItems?.length || 0);
    console.log('  - roadmapItems:', roadmapItems);
    console.log('  - hasGenerated:', hasGenerated);
  }, []);

  // Auto-generate tasks when component mounts
  useEffect(() => {
    console.log('🔍 TaskGenerator Debug - useEffect Trigger');
    console.log('  - prdContent exists:', !!prdContent);
    console.log('  - roadmapItems.length:', roadmapItems?.length || 0);
    console.log('  - hasGenerated:', hasGenerated);
    console.log('  - Condition met:', prdContent && roadmapItems.length > 0 && !hasGenerated);
    
    if (prdContent && roadmapItems.length > 0 && !hasGenerated) {
      console.log('🔍 TaskGenerator Debug - Triggering handleGenerateTasks');
      handleGenerateTasks();
    }
  }, [prdContent, roadmapItems, hasGenerated]);

  const handleGenerateTasks = async () => {
    console.log('🔍 TaskGenerator Debug - handleGenerateTasks called');
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🔍 TaskGenerator Debug - Calling generateTasks API');
      const generatedTasks = await generateTasks(prdContent, roadmapItems);
      console.log('🔍 TaskGenerator Debug - Generated tasks:', generatedTasks);
      setTasks(generatedTasks);
      setHasGenerated(true);
    } catch (error) {
      console.error('🔍 TaskGenerator Debug - Error generating tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTasks = async () => {
    if (tasks.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save each task to database
      const savedTasks = [];
      for (const task of tasks) {
        const { data: savedTask, error: saveError } = await db.createTask({
          project_id: projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          estimated_hours: task.estimated_hours,
          due_date: task.due_date,
          tags: task.tags,
          dependencies: task.dependencies,
          position: task.position,
        });

        if (saveError) throw saveError;
        savedTasks.push(savedTask);
      }

      // Call the callback with task data
      onTasksGenerated({
        tasks,
        count: tasks.length,
      });
    } catch (error) {
      console.error('Error saving tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to save tasks');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTask = () => {
    const newTask: TaskItem = {
      title: 'New Task',
      description: 'Add task description here...',
      status: 'todo',
      priority: 'medium',
      estimated_hours: 4,
      due_date: null,
      tags: [],
      dependencies: [],
      position: tasks.length,
    };
    setTasks([...tasks, newTask]);
    setEditingIndex(tasks.length);
  };

  const handleUpdateTask = (index: number, updates: Partial<TaskItem>) => {
    const updatedTasks = tasks.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
  };

  const handleDeleteTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    // Update positions
    const reorderedTasks = updatedTasks.map((task, i) => ({ ...task, position: i }));
    setTasks(reorderedTasks);
    setEditingIndex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTagsInput = (tags: string[]) => tags.join(', ');
  const parseTagsInput = (input: string) => 
    input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ListTodo className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Task Breakdown</h3>
            <p className="text-sm text-gray-600">AI-generated tasks based on your PRD and roadmap</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasGenerated && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? 'Done Editing' : 'Edit Tasks'}
            </button>
          )}
          
          {hasGenerated && (
            <button
              onClick={handleGenerateTasks}
              disabled={isGenerating}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Context Info */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-orange-900 mb-2">Based on your project:</h4>
        <div className="text-sm text-orange-800 space-y-1">
          <p>• PRD with {prdContent.split('\n').length} sections</p>
          <p>• {roadmapItems.length} roadmap phases: {roadmapItems.map(item => item.title).join(', ')}</p>
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
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Tasks</h3>
            <p className="text-gray-600">
              AI is analyzing your PRD and roadmap to create actionable development tasks...
            </p>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {hasGenerated && !isGenerating && (
        <div className="flex-1 flex flex-col">
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  {editingIndex === index ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleUpdateTask(index, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                        placeholder="Task title"
                      />
                      <textarea
                        value={task.description}
                        onChange={(e) => handleUpdateTask(index, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                        rows={3}
                        placeholder="Task description..."
                      />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTask(index, { status: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            value={task.priority}
                            onChange={(e) => handleUpdateTask(index, { priority: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                          <input
                            type="number"
                            value={task.estimated_hours || ''}
                            onChange={(e) => handleUpdateTask(index, { estimated_hours: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                            placeholder="Hours"
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                          <input
                            type="date"
                            value={task.due_date || ''}
                            onChange={(e) => handleUpdateTask(index, { due_date: e.target.value || null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                        <input
                          type="text"
                          value={formatTagsInput(task.tags)}
                          onChange={(e) => handleUpdateTask(index, { tags: parseTagsInput(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          placeholder="frontend, backend, design"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleDeleteTask(index)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{task.description}</p>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="ml-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.estimated_hours && (
                          <span className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimated_hours}h</span>
                          </span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          </span>
                        )}
                        {task.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {task.tags.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Task Button */}
              {isEditing && (
                <button
                  onClick={handleAddTask}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Task</span>
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
              <span>Review your tasks, then save to continue</span>
            </span>
          </div>
          
          <button
            onClick={handleSaveTasks}
            disabled={tasks.length === 0 || isSaving}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Tasks...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Tasks & Continue
              </>
            )}
          </button>
        </div>
      )}

      {/* Initial Generate Button */}
      {!hasGenerated && !isGenerating && (
        <div className="flex-1 bg-gray-50 rounded-lg p-8 flex items-center justify-center">
          <div className="text-center">
            <ListTodo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate Your Tasks</h3>
            <p className="text-gray-600 mb-6">
              I'll create actionable development tasks based on your PRD and roadmap, breaking down the work into manageable pieces.
            </p>
            <button
              onClick={handleGenerateTasks}
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};