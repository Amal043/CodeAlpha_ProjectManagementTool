import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  canEdit: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  onTaskClick,
  onAddTask,
  canEdit,
}) => {
  const getHeaderColor = (colStatus: TaskStatus) => {
    switch (colStatus) {
      case 'TODO':
        return 'bg-slate-200 text-slate-700';
      case 'IN_PROGRESS':
        return 'bg-violet-200 text-violet-800';
      case 'REVIEW':
        return 'bg-amber-200 text-amber-900';
      case 'DONE':
        return 'bg-emerald-200 text-emerald-800';
    }
  };

  return (
    <div className="w-72 sm:w-80 shrink-0 bg-slate-100/70 rounded-2xl p-3 flex flex-col border border-slate-200/60 max-h-[calc(100vh-12rem)]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 py-2 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-xs tracking-tight">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getHeaderColor(status)}`}>
            {tasks.length}
          </span>
        </div>

        {canEdit && (
          <button
            onClick={() => onAddTask(status)}
            className="p-1 rounded-lg text-slate-500 hover:text-violet-700 hover:bg-white transition-colors"
            title={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Task List Droppable Zone */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto custom-scrollbar space-y-2.5 p-1 min-h-[150px] rounded-xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-violet-50/60 ring-2 ring-violet-300 ring-dashed' : ''
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
              <div className="h-24 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400 font-medium">
                No tasks in {title.toLowerCase()}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};
