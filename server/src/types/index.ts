import { Request } from 'express';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export const ProjectRole = {
  OWNER: 'OWNER' as ProjectRole,
  ADMIN: 'ADMIN' as ProjectRole,
  MEMBER: 'MEMBER' as ProjectRole,
  VIEWER: 'VIEWER' as ProjectRole,
};

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export const TaskStatus = {
  TODO: 'TODO' as TaskStatus,
  IN_PROGRESS: 'IN_PROGRESS' as TaskStatus,
  REVIEW: 'REVIEW' as TaskStatus,
  DONE: 'DONE' as TaskStatus,
};

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export const TaskPriority = {
  LOW: 'LOW' as TaskPriority,
  MEDIUM: 'MEDIUM' as TaskPriority,
  HIGH: 'HIGH' as TaskPriority,
  URGENT: 'URGENT' as TaskPriority,
};

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'COMMENT_ADDED' | 'PROJECT_INVITE';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  projectMember?: {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectRole;
  };
}
