import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { Folder, Settings, Archive, ChevronDown, ChevronRight, RotateCcw, Users, PanelLeftClose, PanelLeftOpen, Menu, Wrench } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onNewProjectClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewProjectClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProjects, archivedProjects, currentProject, setCurrentProject, restoreProject } = useProjectStore();
  const [showArchived, setShowArchived] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isOnCommunity = location.pathname === '/community';
  const isOnSettings = location.pathname === '/settings';

  const handleProjectClick = (project: any) => {
    navigate(`/workspace/${project.id}`);
  };

  const handleRestoreProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await restoreProject(projectId);
    } catch (error) {
      console.error('Failed to restore project:', error);
    }
  };

  // Helper function to get project initial
  const getProjectInitial = (projectName: string) => {
    return projectName.charAt(0).toUpperCase();
  };

  return (
    <aside className={`h-full flex flex-col bg-background border-r border-foreground-dim/20 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className={`p-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {/* Community Hub */}
        <button
          onClick={() => navigate('/community')}
          className={`${isOnCommunity ? 'sidebar-item-active' : 'sidebar-item'} ${
            isCollapsed ? 'w-8 h-8 p-2 flex items-center justify-center' : 'flex items-center space-x-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors mb-3 px-3 py-2 rounded-md w-full text-left'
          }`}
          title="Community Hub"
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Community Hub</span>}
        </button>

        {/* Divider under Community Hub */}
        <div className={`border-b border-foreground-dim/20 ${isCollapsed ? 'my-3 w-6' : 'my-4'}`}></div>

        {/* Active Projects */}
        <div className={isCollapsed ? 'flex flex-col items-center space-y-2' : ''}>
          {!isCollapsed && (
            <div className="mt-4 mb-3 px-3">
              <h2 className="flex items-center space-x-2 text-sm font-semibold text-foreground">
                <Wrench className="w-3.5 h-3.5" />
                <span>Projects</span>
              </h2>
            </div>
          )}
          
          <div className={`sidebar-section ${isCollapsed ? 'space-y-2' : ''}`}>
            {activeProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className={`${currentProject?.id === project.id && !isOnCommunity && !isOnSettings ? 'sidebar-item-active' : 'sidebar-item'} ${
                  isCollapsed ? 'w-8 h-8 p-2 flex items-center justify-center' : ''
                }`}
                title={project.name}
              >
                {isCollapsed ? (
                  // Show project initial with unified styling when collapsed
                  <div className="w-4 h-4 rounded-sm bg-secondary/50 flex items-center justify-center text-primary text-xs font-bold">
                    {getProjectInitial(project.name)}
                  </div>
                ) : (
                  // Show folder icon and name when expanded
                  <>
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Archived Projects */}
        {archivedProjects.length > 0 && (
          <div className={isCollapsed ? 'flex flex-col items-center' : 'mt-6'}>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center space-x-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors mb-3 ${
                isCollapsed ? 'w-8 h-8 p-2 justify-center' : 'px-3 py-2 rounded-md w-full text-left'
              }`}
              title={`Archived Projects (${archivedProjects.length})`}
            >
              {!isCollapsed && (
                <>
                  {showArchived ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Archive className="w-4 h-4 text-primary/70" />
                  <span>Archived ({archivedProjects.length})</span>
                </>
              )}
            </button>

            {showArchived && !isCollapsed && (
              <div className="sidebar-section mt-4">
                {archivedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center space-x-2 px-3 py-2 text-sm rounded-md text-foreground-dim/70 hover:bg-secondary/50 transition-colors"
                  >
                    <button
                      onClick={() => handleProjectClick(project)}
                      className="flex items-center space-x-2 flex-1 text-left"
                      title={project.name}
                    >
                      <Folder className="w-4 h-4" />
                      <span className="truncate">{project.name}</span>
                    </button>
                    <button
                      onClick={(e) => handleRestoreProject(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-foreground-dim hover:text-primary transition-all"
                      title="Restore project"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with conditional settings button and collapse button */}
      <div className="p-4 border-t border-foreground-dim/20">
        {isCollapsed ? (
          // When collapsed, only show the expand button centered
          <div className="flex justify-center">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-8 h-8 p-2 flex items-center justify-center text-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // When expanded, show both settings and collapse buttons
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/settings')}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors font-mono ${
                isOnSettings ? 'bg-primary/10 text-primary border-primary/50'  : 'text-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};