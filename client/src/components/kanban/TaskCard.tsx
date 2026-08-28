import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, TaskPriority } from '../../types';
import { Calendar, MessageSquare, Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const PRIORITY_BADGES: Record<TaskPriority, { bg: string; text: string }> = {
  LOW: { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300', text: 'Low' },
  MEDIUM: { bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400', text: 'Medium' },
  HIGH: { bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400', text: 'High' },
  URGENT: { bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400', text: 'Urgent' },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const priority = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer transition-all ${
            snapshot.isDragging ? 'shadow-xl ring-2 ring-brand-500/50 scale-[1.02] rotate-1 z-50' : ''
          }`}
        >
          {/* Priority & Due Date Header */}
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${priority.bg}`}>
              {priority.text}
            </span>

            {task.dueDate && (
              <span
                className={`text-[10px] font-semibold flex items-center gap-1 ${
                  isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          {/* Title & Description */}
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-snug line-clamp-2">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Footer: Assignee & Comments Count */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-3 h-3" />
              <span>{task._count?.comments || 0}</span>
            </div>

            {task.assignee ? (
              <img
                src={task.assignee.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignee.name}`}
                alt={task.assignee.name}
                title={`Assigned to ${task.assignee.name}`}
                className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover"
              />
            ) : (
              <span className="text-[10px] italic text-slate-400 dark:text-slate-500">Unassigned</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
