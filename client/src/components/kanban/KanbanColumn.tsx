import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  columnId: TaskStatus;
  title: string;
  colorClass: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  columnId,
  title,
  colorClass,
  tasks,
  onTaskClick,
}) => {
  return (
    <div className="bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/80 flex flex-col max-h-full min-w-[260px] transition-colors duration-200">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${colorClass.split(' ')[0]}`} />
          <h3 className={`font-extrabold text-xs tracking-wider uppercase ${colorClass.split(' ').slice(1).join(' ')}`}>
            {title}
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold shadow-xs">
          {tasks.length}
        </span>
      </div>

      {/* Droppable Task Area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto space-y-3 min-h-[160px] p-1 rounded-xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-brand-50/50 dark:bg-brand-950/30 border-2 border-dashed border-brand-300 dark:border-brand-700' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-28 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-center p-4">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">No tasks in {title.toLowerCase()}</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};
