import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, checkProjectRole } from '../middlewares/auth';
import { AuthRequest, ProjectRole, TaskStatus, TaskPriority } from '../types';
import {
  broadcastTaskCreated,
  broadcastTaskUpdated,
  broadcastTaskDeleted,
  sendNotificationToUser,
} from '../socket/socketHandler';

const router = Router({ mergeParams: true });

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  position: z.number().int().optional(),
});

async function getTaskAndCheckAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  if (!task) return { task: null, member: null };
  const member = task.project.members[0] || null;
  return { task, member };
}

// GET /api/projects/:projectId/tasks
router.get(
  '/projects/:projectId/tasks',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { projectId } = req.params;

      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: [
          { position: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return res.json({ tasks });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/projects/:projectId/tasks
router.post(
  '/projects/:projectId/tasks',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { projectId } = req.params;
      const { title, description, status, priority, dueDate, assigneeId } = createTaskSchema.parse(req.body);
      const userId = req.user!.id;

      const existingCount = await prisma.task.count({
        where: { projectId, status },
      });

      const task = await prisma.task.create({
        data: {
          title,
          description: description || null,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          position: existingCount,
          projectId,
          assigneeId: assigneeId || null,
          createdById: userId,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      });

      broadcastTaskCreated(projectId, task);

      if (assigneeId && assigneeId !== userId) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        const notification = await prisma.notification.create({
          data: {
            userId: assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: `You were assigned task "${task.title}" in project "${project?.name}".`,
            link: `/projects/${projectId}?task=${task.id}`,
          },
        });
        sendNotificationToUser(assigneeId, notification);
      }

      return res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tasks/:taskId
router.get('/tasks/:taskId', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { taskId } = req.params;
    const { task, member } = await getTaskAndCheckAccess(taskId, req.user!.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!member) {
      return res.status(403).json({ message: 'Access denied to this task' });
    }

    return res.json({ task });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:taskId
router.put('/tasks/:taskId', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    const { task: existingTask, member } = await getTaskAndCheckAccess(taskId, userId);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!member || member.role === ProjectRole.VIEWER) {
      return res.status(403).json({ message: 'You do not have permission to edit this task' });
    }

    const payload = updateTaskSchema.parse(req.body);

    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description || null;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.priority !== undefined) updateData.priority = payload.priority;
    if (payload.position !== undefined) updateData.position = payload.position;
    if (payload.dueDate !== undefined) updateData.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    if (payload.assigneeId !== undefined) updateData.assigneeId = payload.assigneeId || null;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    broadcastTaskUpdated(existingTask.projectId, updatedTask);

    if (payload.status && payload.status !== existingTask.status) {
      const recipientId = updatedTask.assigneeId || updatedTask.createdById;
      if (recipientId && recipientId !== userId) {
        const notification = await prisma.notification.create({
          data: {
            userId: recipientId,
            type: 'TASK_STATUS_CHANGED',
            title: 'Task Status Updated',
            message: `Task "${updatedTask.title}" status changed to ${updatedTask.status.replace('_', ' ')}.`,
            link: `/projects/${existingTask.projectId}?task=${updatedTask.id}`,
          },
        });
        sendNotificationToUser(recipientId, notification);
      }
    }

    if (payload.assigneeId && payload.assigneeId !== existingTask.assigneeId && payload.assigneeId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          userId: payload.assigneeId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `Task "${updatedTask.title}" was assigned to you.`,
          link: `/projects/${existingTask.projectId}?task=${updatedTask.id}`,
        },
      });
      sendNotificationToUser(payload.assigneeId, notification);
    }

    return res.json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:taskId
router.delete('/tasks/:taskId', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    const { task, member } = await getTaskAndCheckAccess(taskId, userId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!member || (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.ADMIN && task.createdById !== userId)) {
      return res.status(403).json({ message: 'Permission denied to delete this task' });
    }

    await prisma.task.delete({ where: { id: taskId } });

    broadcastTaskDeleted(task.projectId, taskId);

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
