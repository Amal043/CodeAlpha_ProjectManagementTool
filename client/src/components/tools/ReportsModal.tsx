import React from 'react';
import { X, BarChart3, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';
import { Project, Task } from '../../types';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose, projects, tasks }) => {
  if (!isOpen) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const highUrgentTasks = tasks.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Workspace Analytics & Reports</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Live stats from your active projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Main Progress Metric */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-200">Overall Task Completion</span>
              <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">{completionRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {completedTasks} of {totalTasks} tasks completed across {projects.length} workspace projects.
            </p>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
              <span className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-300">In Progress</span>
              <p className="text-xl font-extrabold text-blue-900 dark:text-blue-100 mt-1">{inProgressTasks}</p>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
              <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-300">In Review</span>
              <p className="text-xl font-extrabold text-purple-900 dark:text-purple-100 mt-1">{reviewTasks}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">To Do</span>
              <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">{todoTasks}</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-300">High / Urgent</span>
              <p className="text-xl font-extrabold text-rose-900 dark:text-rose-100 mt-1">{highUrgentTasks}</p>
            </div>
          </div>

          {/* Project Breakdown List */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Projects Summary</h4>
            <div className="space-y-2">
              {projects.map((p) => {
                const projectTasks = tasks.filter((t) => t.projectId === p.id);
                const done = projectTasks.filter((t) => t.status === 'DONE').length;
                const pct = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;

                return (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{projectTasks.length} tasks · {done} done</p>
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
