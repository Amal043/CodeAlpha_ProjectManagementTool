import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { projectAPI } from '../services/api';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, CheckCircle2, Folder, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [refreshSidebarTrigger, setRefreshSidebarTrigger] = useState<number>(0);

  const fetchProjects = async () => {
    try {
      const data = await projectAPI.getAll();
      setProjects(data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setRefreshSidebarTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onOpenCreateProject={() => setIsCreateModalOpen(true)}
          refreshTrigger={refreshSidebarTrigger}
        />

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-900/10 relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-200 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Workspace Overview
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, {user?.name.split(' ')[0]}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-brand-200 mt-1 max-w-xl">
                  Manage your active team projects, collaborate on Kanban boards, and track project tasks in real time.
                </p>
              </div>

              <div className="relative z-10 shrink-0">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-white text-brand-900 hover:bg-brand-50 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-brand-600" />
                  New Project
                </button>
              </div>

              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-brand-50 text-brand-600">
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Projects</p>
                  <p className="text-xl font-extrabold text-slate-900">{projects.length}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Members</p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {projects.reduce((acc, p) => acc + (p._count?.members || 0), 0)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks</p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {projects.reduce((acc, p) => acc + (p._count?.tasks || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Your Projects</h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                    <Folder className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">No Projects Found</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Get started by creating your first collaborative project workspace!
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {projects.map((proj) => (
                    <Link
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="p-2 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                            <Folder className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {proj.ownerId === user?.id ? 'Owner' : 'Member'}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-brand-600 transition-colors">
                          {proj.name}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {proj.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {proj._count?.members || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                            {proj._count?.tasks || 0} tasks
                          </span>
                        </div>

                        <span className="text-brand-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold text-[11px]">
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
};
