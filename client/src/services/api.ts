import axios from 'axios';
import { Project, Task, Comment, Notification, User, ProjectRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://codealpha-projectmanagementtool-do67.onrender.com/api'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string, projectId?: string, role?: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password, projectId, role });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data;
  },
  updateProfile: async (data: { name?: string; avatarUrl?: string; password?: string }) => {
    const res = await api.put<{ user: User; message: string }>('/auth/profile', data);
    return res.data;
  },
};

export const userAPI = {
  search: async (query: string) => {
    const res = await api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },
};

export const projectAPI = {
  getAll: async () => {
    const res = await api.get<{ projects: Project[] }>('/projects');
    return res.data;
  },
  create: async (name: string, description?: string, imageUrl?: string) => {
    const res = await api.post<{ project: Project }>('/projects', { name, description, imageUrl });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ project: Project & { tasks: Task[] }; currentUserRole: ProjectRole }>(`/projects/${id}`);
    return res.data;
  },
  update: async (id: string, name: string, description?: string, imageUrl?: string) => {
    const res = await api.put<{ project: Project }>(`/projects/${id}`, { name, description, imageUrl });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ message: string }>(`/projects/${id}`);
    return res.data;
  },
  addMember: async (projectId: string, email: string, role: ProjectRole) => {
    const res = await api.post<{ member?: any; inviteLink?: string; isNewUser?: boolean; message?: string }>(`/projects/${projectId}/members`, { email, role });
    return res.data;
  },
  updateMemberRole: async (projectId: string, memberId: string, role: ProjectRole) => {
    const res = await api.put<{ member: any }>(`/projects/${projectId}/members/${memberId}`, { role });
    return res.data;
  },
  removeMember: async (projectId: string, memberId: string) => {
    const res = await api.delete<{ message: string }>(`/projects/${projectId}/members/${memberId}`);
    return res.data;
  },
};

export const taskAPI = {
  getByProject: async (projectId: string) => {
    const res = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`);
    return res.data;
  },
  create: async (projectId: string, data: { title: string; description?: string; status?: string; priority?: string; dueDate?: string; assigneeId?: string }) => {
    const res = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, data);
    return res.data;
  },
  getById: async (taskId: string) => {
    const res = await api.get<{ task: Task }>(`/tasks/${taskId}`);
    return res.data;
  },
  update: async (taskId: string, data: Partial<Task>) => {
    const res = await api.put<{ task: Task }>(`/tasks/${taskId}`, data);
    return res.data;
  },
  delete: async (taskId: string) => {
    const res = await api.delete<{ message: string }>(`/tasks/${taskId}`);
    return res.data;
  },
};

export const commentAPI = {
  getByTask: async (taskId: string) => {
    const res = await api.get<{ comments: Comment[] }>(`/tasks/${taskId}/comments`);
    return res.data;
  },
  create: async (taskId: string, content: string) => {
    const res = await api.post<{ comment: Comment }>(`/tasks/${taskId}/comments`, { content });
    return res.data;
  },
};

export const notificationAPI = {
  getAll: async () => {
    const res = await api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications');
    return res.data;
  },
  markAsRead: async (id: string) => {
    const res = await api.put<{ notification: Notification }>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.put<{ message: string }>('/notifications/read-all');
    return res.data;
  },
};

export default api;
