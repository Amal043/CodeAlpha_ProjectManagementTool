import React, { useState } from 'react';
import { X, CheckSquare, Calendar, ArrowRight, Filter } from 'lucide-react';
import { Task, Project } from '../../types';
import { useNavigate } from 'react-router-dom';

interface MyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  userId?: string;
}

export const MyTasksModal: React.FC<MyTasksModalProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  userId,
}) => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  if (!isOpen) return null;

  // My tasks or all tasks
  const myTasks = tasks.filter((t) => (userId ? t.assigneeId === userId : true));
  const displayTasksList = myTasks.length > 0 ? myTasks : tasks;

  const filteredTasks = displayTasksList.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  const STATUS_COLORS: Record<string, string> = {
    TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
    DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-950/60">
              <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">My Assigned Tasks</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{filteredTasks.length} tasks listed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status:</span>
          </div>
          <div className="flex items-center gap-1">
            {['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${
                  filterStatus === st
                    ? 'bg-brand-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Feed */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {filteredTasks.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">No tasks found for this filter.</p>
          ) : (
            filteredTasks.map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (project) {
                      onClose();
                      navigate(`/projects/${project.id}`);
                    }
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${STATUS_COLORS[t.status]}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      {project && (
                        <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {project.name}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-1 truncate">{t.title}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {t.dueDate && (
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
