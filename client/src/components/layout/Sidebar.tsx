import React, { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { LayoutDashboard, FolderPlus, Folder, ChevronRight, Hash } from 'lucide-react';
import { Project } from '../../types';
import { projectAPI } from '../../services/api';

interface SidebarProps {
  onOpenCreateProject?: () => void;
  refreshTrigger?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateProject, refreshTrigger }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { id: activeProjectId } = useParams<{ id: string }>();

  const fetchProjects = async () => {
    try {
      const data = await projectAPI.getAll();
      setProjects(data.projects);
    } catch (error) {
      console.error('Failed to load projects in sidebar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {/* Main Nav */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
            Menu
          </p>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-brand-600" />
            Dashboard
          </NavLink>
        </div>

        {/* Projects Section */}
        <div className="flex-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Projects ({projects.length})
            </p>
            {onOpenCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="p-1 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                title="Create New Project"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 px-3 py-2">
                <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ) : projects.length === 0 ? (
              <div className="px-3 py-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-xs text-slate-400 mb-2">No projects yet</p>
                {onOpenCreateProject && (
                  <button
                    onClick={onOpenCreateProject}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    + Create one
                  </button>
                )}
              </div>
            ) : (
              projects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                return (
                  <NavLink
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors group ${
                      isActive
                        ? 'bg-brand-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-200' : 'text-slate-400'}`} />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-brand-200' : 'text-slate-400'}`} />
                  </NavLink>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
