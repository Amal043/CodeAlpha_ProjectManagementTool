import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, TaskPriority, TaskStatus, User, ProjectRole } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { taskAPI } from '../../services/api';
import { Search, Filter, Layers } from 'lucide-react';
import { TaskDetailModal } from './TaskDetailModal';

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  members: User[];
  currentUserRole: ProjectRole | null;
  onTaskUpdated: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'border-slate-400 text-slate-700 dark:text-slate-300' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-amber-500 text-amber-600 dark:text-amber-400' },
  { id: 'REVIEW', title: 'Review', color: 'border-indigo-500 text-indigo-600 dark:text-indigo-400' },
  { id: 'DONE', title: 'Done', color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  tasks: initialTasks,
  members,
  currentUserRole,
  onTaskUpdated,
}) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = selectedPriority === 'ALL' || task.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  const onDragEnd = async (result: DropResult) => {
    if (currentUserRole === 'VIEWER') return;

    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetStatus = destination.droppableId as TaskStatus;

    // Optimistic local state update
    const updatedTasks = tasks.map((t) => (t.id === draggableId ? { ...t, status: targetStatus } : t));
    setTasks(updatedTasks);

    try {
      await taskAPI.update(draggableId, {
        status: targetStatus,
        position: destination.index,
      });
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update task drag status:', err);
      setTasks(initialTasks); // Rollback
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tasks by keyword..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
          </div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Kanban Drag-and-Drop Columns Grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 flex-1 items-start overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                title={col.title}
                colorClass={col.color}
                tasks={columnTasks}
                onTaskClick={(task) => setSelectedTask(task)}
              />
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Detail & Comments Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={members}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            onTaskUpdated();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
