import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Bell, Calendar, Users, BarChart3, Settings, HelpCircle, FolderPlus, Plus, X } from 'lucide-react';
import { Project } from '../../types';

interface SidebarProps {
  projects: Project[];
  onOpenCreateProjectModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const COLORS = ['bg-brand-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-blue-600', 'bg-cyan-600', 'bg-pink-500', 'bg-indigo-500'];

function getProjectColor(index: number) {
  return COLORS[index % COLORS.length];
}

function getProjectInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
        className={`fixed md:sticky top-0 md:top-16 left-0 z-40 h-screen md:h-[calc(100vh-4rem)] w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header Close Button */}
        <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-white text-sm">Navigation</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 space-y-5 flex-1 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-[18px] h-[18px]" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <CheckSquare className="w-[18px] h-[18px]" />
              <span>My Tasks</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <Bell className="w-[18px] h-[18px]" />
              <span>Notifications</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <Calendar className="w-[18px] h-[18px]" />
              <span>Calendar</span>
            </NavLink>
          </div>

          {/* Workspaces */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspaces
              </p>
              <button
                onClick={() => {
                  onOpenCreateProjectModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Create New Project"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.map((project, index) => (
                <NavLink
                  key={project.id}
                  to={`/projects/${project.id}`}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <div className={`w-6 h-6 rounded ${getProjectColor(index)} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                    {getProjectInitials(project.name)}
                  </div>
                  <span className="truncate">{project.name}</span>
                </NavLink>
              ))}

              <button
                onClick={() => {
                  onOpenCreateProjectModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all w-full"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Tools */}
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Tools
            </p>
            <div className="space-y-0.5">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer">
                <Users className="w-[18px] h-[18px]" />
                <span>Team Members</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer">
                <BarChart3 className="w-[18px] h-[18px]" />
                <span>Reports</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer">
                <Settings className="w-[18px] h-[18px]" />
                <span>Settings</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer">
                <HelpCircle className="w-[18px] h-[18px]" />
                <span>Help & Support</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
