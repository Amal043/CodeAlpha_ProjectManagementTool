import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { Project } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { FolderPlus, Layout, Users, CheckCircle2, Clock, ArrowRight, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectAPI.getAll();
      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const totalTasks = projects.reduce((sum, p) => sum + (p._count?.tasks || 0), 0);
  const totalMembers = projects.reduce((sum, p) => sum + (p._count?.members || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          projects={projects}
          onOpenCreateProjectModal={() => setIsCreateModalOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Hero Welcome Banner */}
          <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-600/15 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Collaborative Dashboard
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Project Management Workspaces</h2>
              <p className="text-brand-100 text-xs sm:text-sm mt-2 max-w-xl">
                Organize team projects, create tasks, assign roles, and track progress on interactive Kanban boards.
              </p>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 px-5 py-2.5 rounded-2xl bg-white text-brand-700 hover:bg-slate-100 font-bold text-xs shadow-lg shadow-black/10 inline-flex items-center gap-2 transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                Create New Project
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                <Layout className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{projects.length}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Workspaces</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalTasks}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Workspace Tasks</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalMembers}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Collaborators</p>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Projects</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select a project board to manage tasks</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              New Project
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wider">
                        Workspace
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {project.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {project.description || 'No description provided for this project.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{project._count?.tasks || 0} Tasks</span>
                      <span>•</span>
                      <span>{project._count?.members || 0} Members</span>
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-600 group-hover:text-white text-slate-400 dark:text-slate-500 flex items-center justify-center transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-base">No Projects Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Create your first project workspace to start organizing tasks on Kanban boards.
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-2 transition-all"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Create First Project
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchProjects();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
};
