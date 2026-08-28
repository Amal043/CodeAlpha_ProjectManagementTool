import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, notificationAPI } from '../services/api';
import { Project, Task, Notification } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import {
  FolderPlus, Layout, CheckCircle2, AlertTriangle, ArrowRight,
  Plus, ChevronDown, MoreVertical, Calendar, Zap
} from 'lucide-react';

const PRIORITY_BADGE: Record<string, { bg: string; text: string }> = {
  LOW: { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', text: 'Low' },
  MEDIUM: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400', text: 'Medium' },
  HIGH: { bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400', text: 'High' },
  URGENT: { bg: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400', text: 'Urgent' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  TODO: { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', text: 'To Do' },
  IN_PROGRESS: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400', text: 'In Progress' },
  REVIEW: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400', text: 'Review' },
  DONE: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400', text: 'Done' },
};

const PROJECT_COLORS = ['bg-brand-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-blue-600', 'bg-cyan-600'];
const PROGRESS_COLORS = ['bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500', 'bg-cyan-500'];

function getProjectInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const projectData = await projectAPI.getAll();
      setProjects(projectData.projects);

      const taskPromises = projectData.projects.map((p: Project) =>
        projectAPI.getById(p.id).then((d) => d.project.tasks || []).catch(() => [])
      );
      const allTaskArrays = await Promise.all(taskPromises);
      setAllTasks(allTaskArrays.flat());

      try {
        const notifData = await notificationAPI.getAll();
        setNotifications(notifData.notifications.slice(0, 4));
      } catch { setNotifications([]); }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const myTasks = allTasks.filter((t) => t.assigneeId === user?.id);
  const completedTasks = allTasks.filter((t) => t.status === 'DONE');
  const dueSoonTasks = allTasks.filter((t) => {
    if (!t.dueDate || t.status === 'DONE') return false;
    const diff = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });
  const displayTasks = (myTasks.length > 0 ? myTasks : allTasks.filter((t) => t.status !== 'DONE')).slice(0, 5);
  const upcomingDeadlines = allTasks
    .filter((t) => t.dueDate && t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

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

        <main className="flex-1 p-3 sm:p-4 lg:p-5 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="max-w-[1100px] mx-auto space-y-4">
              {/* Greeting + New Project */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Here's what's happening with your projects today.</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> New Project <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </div>

              {/* Stats Cards — compact */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: Layout, color: 'bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400', value: projects.length, label: 'Active Projects' },
                  { icon: CheckCircle2, color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400', value: myTasks.length || allTasks.length, label: 'My Tasks' },
                  { icon: AlertTriangle, color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400', value: dueSoonTasks.length, label: 'Due Soon' },
                  { icon: CheckCircle2, color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400', value: completedTasks.length, label: 'Completed' },
                ].map(({ icon: Icon, color, value, label }) => (
                  <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
                    <div>
                      <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{value}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Your Projects */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Projects</h3>
                  <button className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                    View all projects <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
                    <FolderPlus className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 dark:text-white text-sm">No Projects Yet</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create your first project to get started.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="mt-3 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold inline-flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5" /> Create First Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {projects.slice(0, 4).map((project, index) => {
                      const projectTasks = allTasks.filter((t) => t.projectId === project.id);
                      const doneTasks = projectTasks.filter((t) => t.status === 'DONE').length;
                      const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
                      return (
                        <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer transition-all group">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg ${PROJECT_COLORS[index % PROJECT_COLORS.length]} text-white text-xs font-bold flex items-center justify-center`}>
                                {getProjectInitials(project.name)}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{project.name}</h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{project.description || 'Project workspace'}</p>
                              </div>
                            </div>
                            <button className="p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {/* Progress */}
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${PROGRESS_COLORS[index % PROGRESS_COLORS.length]} rounded-full`} style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{progress}%</span>
                          </div>
                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center -space-x-1">
                              {(project.members || []).slice(0, 3).map((m) => (
                                <img key={m.id} src={m.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user.name}&backgroundColor=7c3aed&textColor=ffffff`}
                                  alt={m.user.name} title={m.user.name} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 object-cover" />
                              ))}
                              {(project.members || []).length > 3 && (
                                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 text-[8px] font-bold text-slate-600 flex items-center justify-center">
                                  +{(project.members || []).length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{project._count?.tasks || 0} Tasks · {project._count?.members || 0} Members</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom: My Tasks + Deadlines + Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* My Tasks Table */}
                <div id="section-my-tasks" className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">My Tasks</h3>
                    <button className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
                  </div>
                  {displayTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">No tasks assigned yet.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task</th>
                          <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Project</th>
                          <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Due</th>
                          <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                          <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayTasks.map((task) => {
                          const tp = projects.find((p) => p.id === task.projectId);
                          const pri = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.MEDIUM;
                          const sts = STATUS_BADGE[task.status] || STATUS_BADGE.TODO;
                          return (
                            <tr key={task.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                              onClick={() => tp && navigate(`/projects/${tp.id}`)}>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'DONE' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                  <span className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate max-w-[180px]">{task.title}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2.5 hidden sm:table-cell">
                                <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">{tp?.name || '—'}</span>
                              </td>
                              <td className="px-2 py-2.5 hidden md:table-cell">
                                <span className={`text-[11px] font-medium ${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {task.dueDate ? formatDueDate(task.dueDate) : '—'}
                                </span>
                              </td>
                              <td className="px-2 py-2.5"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pri.bg}`}>{pri.text}</span></td>
                              <td className="px-2 py-2.5"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${sts.bg}`}>{sts.text}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Right: Deadlines + Activity */}
                <div className="space-y-3">
                  <div id="section-deadlines" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">Upcoming Deadlines</h4>
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="p-2.5 space-y-1.5">
                      {upcomingDeadlines.length === 0 ? (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-3">No upcoming deadlines</p>
                      ) : upcomingDeadlines.map((task) => {
                        const tp = projects.find((p) => p.id === task.projectId);
                        const isToday = task.dueDate && formatDueDate(task.dueDate) === 'Today';
                        return (
                          <div key={task.id} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                            onClick={() => tp && navigate(`/projects/${tp.id}`)}>
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isToday ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">{task.title}</p>
                              <p className="text-[10px] text-slate-400">{tp?.name}</p>
                            </div>
                            <span className={`text-[10px] font-semibold shrink-0 ${isToday ? 'text-rose-600' : 'text-slate-500'}`}>{task.dueDate ? formatDueDate(task.dueDate) : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div id="section-activity" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">Recent Activity</h4>
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="p-2.5 space-y-1.5">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-3">No recent activity</p>
                      ) : notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-300' : 'bg-brand-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">{n.message}</p>
                            <p className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { fetchDashboardData(); setIsCreateModalOpen(false); }}
      />
    </div>
  );
};
