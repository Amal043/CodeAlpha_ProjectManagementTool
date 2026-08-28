import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { CreateTaskModal } from '../components/kanban/CreateTaskModal';
import { TaskDetailModal } from '../components/kanban/TaskDetailModal';
import { InviteMemberModal } from '../components/projects/InviteMemberModal';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { projectAPI, taskAPI } from '../services/api';
import { Project, Task, TaskStatus, ProjectRole } from '../types';
import { useSocket } from '../context/SocketContext';
import { Plus, UserPlus, Users, Loader2, Trash2 } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket, joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole>('VIEWER');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>('TODO');
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState<boolean>(false);

  const fetchProjectData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await projectAPI.getById(projectId);
      setProject(data.project);
      setTasks(data.project.tasks || []);
      setCurrentUserRole(data.currentUserRole);
    } catch (error: any) {
      console.error('Failed to load project:', error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Real-time WebSocket connection setup
  useEffect(() => {
    if (!projectId) return;
    joinProject(projectId);

    return () => {
      leaveProject(projectId);
    };
  }, [projectId]);

  // Listen for real-time WebSocket Kanban events
  useEffect(() => {
    if (!socket || !projectId) return;

    const handleTaskCreated = (newTask: Task) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      // Update modal if currently viewing this task
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    };

    const handleTaskDeleted = (data: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
      if (selectedTask?.id === data.taskId) {
        setSelectedTask(null);
      }
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [socket, projectId, selectedTask?.id]);

  const canEdit = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN' || currentUserRole === 'MEMBER';
  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const handleOpenAddTask = (status: TaskStatus) => {
    setInitialTaskStatus(status);
    setIsCreateTaskOpen(true);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || currentUserRole !== 'OWNER') return;
    if (!window.confirm(`Are you sure you want to delete project "${project.name}"?`)) return;

    try {
      await projectAPI.delete(project.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenCreateProject={() => setIsCreateProjectOpen(true)} />

        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : !project ? (
            <div className="p-8 text-center text-slate-500">Project not found</div>
          ) : (
            <div className="flex-1 flex flex-col space-y-5 overflow-hidden">
              {/* Project Header Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {project.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-100 text-brand-700">
                      {currentUserRole}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-xs text-slate-500 max-w-2xl">{project.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Member Avatars */}
                  <div className="flex items-center -space-x-2 mr-1">
                    {project.members?.slice(0, 5).map((m) => (
                      <img
                        key={m.id}
                        src={m.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user.name}`}
                        alt={m.user.name}
                        title={`${m.user.name} (${m.role})`}
                        className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                      />
                    ))}
                    {(project.members?.length || 0) > 5 && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                        +{(project.members?.length || 0) - 5}
                      </div>
                    )}
                  </div>

                  {canManageMembers && (
                    <button
                      onClick={() => setIsInviteOpen(true)}
                      className="px-3 py-2 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invite
                    </button>
                  )}

                  {canEdit && (
                    <button
                      onClick={() => handleOpenAddTask('TODO')}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Task
                    </button>
                  )}

                  {currentUserRole === 'OWNER' && (
                    <button
                      onClick={handleDeleteProject}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Kanban Board Container */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <KanbanBoard
                  tasks={tasks}
                  onTaskUpdated={handleTaskUpdated}
                  onTaskClick={(task) => setSelectedTask(task)}
                  onAddTask={handleOpenAddTask}
                  canEdit={canEdit}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {project && (
        <>
          <CreateTaskModal
            isOpen={isCreateTaskOpen}
            projectId={project.id}
            initialStatus={initialTaskStatus}
            members={project.members || []}
            onClose={() => setIsCreateTaskOpen(false)}
            onSuccess={handleTaskCreated}
          />

          <InviteMemberModal
            isOpen={isInviteOpen}
            projectId={project.id}
            onClose={() => setIsInviteOpen(false)}
            onSuccess={fetchProjectData}
          />
        </>
      )}

      <TaskDetailModal
        task={selectedTask}
        members={project?.members || []}
        canEdit={canEdit}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSuccess={(newProj) => navigate(`/projects/${newProj.id}`)}
      />
    </div>
  );
};
