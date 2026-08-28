import React from 'react';
import { Clock, MessageSquare, AlertCircle, GripVertical } from 'lucide-react';
import { Task, TaskPriority } from '../../types';
import { Draggable } from '@hello-pangea/dnd';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold uppercase tracking-wider">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-medium uppercase tracking-wider">Medium</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium uppercase tracking-wider">Low</span>;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={onClick}
          className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer select-none group relative ${
            snapshot.isDragging
              ? 'shadow-xl border-violet-500 ring-2 ring-violet-500/20 rotate-1 scale-[1.02] z-50'
              : 'border-slate-200/80 hover:border-violet-300 hover:shadow-md'
          }`}
        >
          {/* Top Bar: Drag Handle + Priority */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <div
                {...provided.dragHandleProps}
                className="p-1 rounded-md text-slate-300 group-hover:text-slate-500 hover:bg-slate-100 cursor-grab active:cursor-grabbing transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
              {getPriorityBadge(task.priority)}
            </div>

            {task.dueDate && (
              <div
                className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  isOverdue
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-100'
                }`}
              >
                <Clock className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>

          {/* Title & Description preview */}
          <h4 className="text-xs font-semibold text-slate-800 mb-1 line-clamp-2 group-hover:text-violet-700 transition-colors">
            {task.title}
          </h4>

          {task.description && (
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
              {task.description}
            </p>
          )}

          {/* Footer: Comments Count + Assignee */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{task._count?.comments || 0}</span>
            </div>

            {task.assignee ? (
              <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee.name}`}>
                <img
                  src={task.assignee.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignee.name}`}
                  alt={task.assignee.name}
                  className="w-6 h-6 rounded-full bg-violet-100 object-cover border border-violet-200"
                />
              </div>
            ) : (
              <span className="text-[10px] italic text-slate-400">Unassigned</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
