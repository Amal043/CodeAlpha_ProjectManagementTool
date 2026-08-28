import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { Project, Task, ProjectRole } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { CreateTaskModal } from '../components/kanban/CreateTaskModal';
import { InviteMemberModal } from '../components/projects/InviteMemberModal';
import { useSocket } from '../context/SocketContext';
import { Plus, UserPlus, Trash2, Shield, ArrowLeft } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { joinProject, leaveProject, socket } = useSocket();

  const [project, setProject] = useState<(Project & { tasks: Task[] }) | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      const data = await projectAPI.getById(id);
      setProject(data.project);
      setCurrentUserRole(data.currentUserRole);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProjects = async () => {
    try {
      const data = await projectAPI.getAll();
      setUserProjects(data.projects);
    } catch (err) {
      console.error('Failed to fetch user projects:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchProjectDetails();
    fetchUserProjects();

    if (id) {
      joinProject(id);
    }

    return () => {
      if (id) {
        leaveProject(id);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleTaskCreated = (newTask: Task) => {
      if (newTask.projectId === id) {
        setProject((prev) => (prev ? { ...prev, tasks: [...prev.tasks, newTask] } : null));
      }
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask.projectId === id) {
        setProject((prev) =>
          prev
            ? {
                ...prev,
                tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
              }
            : null
        );
      }
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.filter((t) => t.id !== taskId),
            }
          : null
      );
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [socket, id]);

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    if (window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      try {
        await projectAPI.delete(id);
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const isViewer = currentUserRole === 'VIEWER';

  const memberUsers = (project?.members || []).map((m) => m.user);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          projects={userProjects}
          onOpenCreateProjectModal={() => {}}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !project ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Project Not Found</h3>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Board Top Control Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-0.5"
                    title="Back to Dashboard"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {project.name}
                      </h2>
                      {currentUserRole && (
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {currentUserRole}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {project.description || 'No project description.'}
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Member Avatars */}
                  <div className="flex items-center -space-x-2 mr-2">
                    {(project.members || []).slice(0, 4).map((m) => (
                      <img
                        key={m.id}
                        src={m.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user.name}`}
                        alt={m.user.name}
                        title={`${m.user.name} (${m.role})`}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 object-cover"
                      />
                    ))}
                    {(project.members || []).length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                        +{(project.members || []).length - 4}
                      </div>
                    )}
                  </div>

                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span>Invite</span>
                    </button>
                  )}

                  {!isViewer && (
                    <button
                      onClick={() => setIsCreateTaskOpen(true)}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Task</span>
                    </button>
                  )}

                  {currentUserRole === 'OWNER' && (
                    <button
                      onClick={handleDeleteProject}
                      className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Drag-and-Drop Kanban Board */}
              <div className="flex-1">
                <KanbanBoard
                  projectId={project.id}
                  tasks={project.tasks || []}
                  members={memberUsers}
                  currentUserRole={currentUserRole}
                  onTaskUpdated={fetchProjectDetails}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {project && (
        <>
          <CreateTaskModal
            isOpen={isCreateTaskOpen}
            projectId={project.id}
            members={memberUsers}
            onClose={() => setIsCreateTaskOpen(false)}
            onSuccess={() => {
              fetchProjectDetails();
              setIsCreateTaskOpen(false);
            }}
          />

          <InviteMemberModal
            isOpen={isInviteModalOpen}
            projectId={project.id}
            onClose={() => setIsInviteModalOpen(false)}
            onSuccess={() => {
              fetchProjectDetails();
            }}
          />
        </>
      )}
    </div>
  );
};
