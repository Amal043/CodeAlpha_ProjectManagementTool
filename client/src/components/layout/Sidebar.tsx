import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Bell, Calendar, Users, BarChart3, Settings, HelpCircle, Plus, X } from 'lucide-react';
import { Project } from '../../types';

interface SidebarProps {
  projects: Project[];
  onOpenCreateProjectModal: () => void;
  onOpenMyTasksModal?: () => void;
  onOpenNotificationsModal?: () => void;
  onOpenCalendarModal?: () => void;
  onOpenTeamMembersModal?: () => void;
  onOpenReportsModal?: () => void;
  onOpenSettingsModal?: () => void;
  onOpenHelpModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const COLORS = ['bg-brand-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-blue-600', 'bg-cyan-600', 'bg-pink-500', 'bg-indigo-500'];

function getProjectColor(index: number) {
  return COLORS[index % COLORS.length];
}

function getProjectInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  onOpenCreateProjectModal,
  onOpenMyTasksModal,
  onOpenNotificationsModal,
  onOpenCalendarModal,
  onOpenTeamMembersModal,
  onOpenReportsModal,
  onOpenSettingsModal,
  onOpenHelpModal,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-16 left-0 z-40 h-screen md:h-[calc(100vh-4rem)] w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="md:hidden p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-white text-sm">Navigation</span>
          <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2.5 space-y-4 flex-1 overflow-y-auto text-[13px]">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              <LayoutDashboard className="w-[17px] h-[17px]" />
              <span>Dashboard</span>
            </NavLink>

            <button
              onClick={() => { onOpenMyTasksModal?.(); if (onCloseMobile) onCloseMobile(); }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full text-left cursor-pointer"
            >
              <CheckSquare className="w-[17px] h-[17px]" />
              <span>My Tasks</span>
            </button>

            <button
              onClick={() => { onOpenNotificationsModal?.(); if (onCloseMobile) onCloseMobile(); }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full text-left cursor-pointer"
            >
              <Bell className="w-[17px] h-[17px]" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => { onOpenCalendarModal?.(); if (onCloseMobile) onCloseMobile(); }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full text-left cursor-pointer"
            >
              <Calendar className="w-[17px] h-[17px]" />
              <span>Calendar</span>
            </button>
          </div>

          {/* Workspaces */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Workspaces</p>
              <button
                onClick={() => { onOpenCreateProjectModal(); if (onCloseMobile) onCloseMobile(); }}
                className="p-0.5 rounded text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {projects.map((project, index) => (
                <NavLink
                  key={project.id}
                  to={`/projects/${project.id}`}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <div className={`w-5 h-5 rounded ${getProjectColor(index)} text-white text-[8px] font-bold flex items-center justify-center shrink-0`}>
                    {getProjectInitials(project.name)}
                  </div>
                  <span className="truncate">{project.name}</span>
                </NavLink>
              ))}
              <button
                onClick={() => { onOpenCreateProjectModal(); if (onCloseMobile) onCloseMobile(); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all w-full cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Tools */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Tools</p>
            <div className="space-y-0.5">
              <button
                onClick={() => { onOpenTeamMembersModal?.(); if (onCloseMobile) onCloseMobile(); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer w-full text-left"
              >
                <Users className="w-[17px] h-[17px]" />
                <span>Team Members</span>
              </button>

              <button
                onClick={() => { onOpenReportsModal?.(); if (onCloseMobile) onCloseMobile(); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer w-full text-left"
              >
                <BarChart3 className="w-[17px] h-[17px]" />
                <span>Reports</span>
              </button>

              <button
                onClick={() => { onOpenSettingsModal?.(); if (onCloseMobile) onCloseMobile(); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer w-full text-left"
              >
                <Settings className="w-[17px] h-[17px]" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => { onOpenHelpModal?.(); if (onCloseMobile) onCloseMobile(); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer w-full text-left"
              >
                <HelpCircle className="w-[17px] h-[17px]" />
                <span>Help & Support</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
