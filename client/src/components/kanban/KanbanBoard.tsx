import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { taskAPI } from '../../services/api';
import { Search, Filter } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  canEdit: boolean;
}

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'REVIEW', title: 'Review' },
  { status: 'DONE', title: 'Done' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskUpdated,
  onTaskClick,
  onAddTask,
  canEdit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Filter tasks based on search & priority
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const newPosition = destination.index;

    const targetTask = tasks.find((t) => t.id === draggableId);
    if (!targetTask) return;

    // Optimistic UI update
    const updatedTask: Task = {
      ...targetTask,
      status: newStatus,
      position: newPosition,
    };
    onTaskUpdated(updatedTask);

    try {
      await taskAPI.update(draggableId, {
        status: newStatus,
        position: newPosition,
      });
    } catch (error) {
      console.error('Failed to update task position on backend:', error);
      // Revert if error
      onTaskUpdated(targetTask);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Board Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tasks by keyword..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Priority:</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Drag-and-Drop Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <KanbanColumn
                key={col.status}
                status={col.status}
                title={col.title}
                tasks={columnTasks}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
                canEdit={canEdit}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
