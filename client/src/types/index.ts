export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'COMMENT_ADDED' | 'PROJECT_INVITE';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: ProjectMember[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  position: number;
  projectId: string;
  assigneeId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  createdBy?: User;
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}
