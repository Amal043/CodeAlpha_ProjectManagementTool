import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderPlus, Hash, Plus, X } from 'lucide-react';
import { Project } from '../../types';

interface SidebarProps {
  projects: Project[];
  onOpenCreateProjectModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  onOpenCreateProjectModal,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-16 left-0 z-40 h-screen md:h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header Close Button */}
        <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-extrabold text-slate-900 dark:text-white text-base">Navigation</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Menu
            </p>
            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800/50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* Projects List Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Projects ({projects.length})
              </p>
              <button
                onClick={() => {
                  onOpenCreateProjectModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="p-1 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors"
                title="Create New Project"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {projects.map((project) => (
                <NavLink
                  key={project.id}
                  to={`/projects/${project.id}`}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Hash className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="truncate flex-1">{project.name}</span>
                </NavLink>
              ))}

              {projects.length === 0 && (
                <div className="px-3 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">No projects yet</p>
                  <button
                    onClick={() => {
                      onOpenCreateProjectModal();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mx-auto"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Create one
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Project Button */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onOpenCreateProjectModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <FolderPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>New Project</span>
          </button>
        </div>
      </aside>
    </>
  );
};
