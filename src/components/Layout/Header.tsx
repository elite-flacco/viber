import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { LogOut, Settings, User, Plus } from 'lucide-react';

interface HeaderProps {
  onNewProjectClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewProjectClick }) => {
  const { user, signOut } = useAuthStore();
  const { currentProject } = useProjectStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">VibeLab</h1>
          {currentProject && (
            <div className="text-sm text-gray-500">
              / {currentProject.name}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onNewProjectClick}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{user?.name || user?.email}</span>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};