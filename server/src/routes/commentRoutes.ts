import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken } from '../middlewares/auth';
import { AuthRequest, ProjectRole } from '../types';
import { broadcastCommentCreated, sendNotificationToUser } from '../socket/socketHandler';

const router = Router();

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty'),
});

// GET /api/tasks/:taskId/comments
router.get('/tasks/:taskId/comments', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

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
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.project.members.length) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ comments });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/:taskId/comments
router.post('/tasks/:taskId/comments', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const { content } = createCommentSchema.parse(req.body);

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
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const member = task.project.members[0];
    if (!member || member.role === ProjectRole.VIEWER) {
      return res.status(403).json({ message: 'You do not have permission to comment on this task' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Real-time broadcast
    broadcastCommentCreated(task.projectId, taskId, comment);

    // Notify task assignee or creator
    const targetUserId = task.assigneeId && task.assigneeId !== userId ? task.assigneeId : (task.createdById !== userId ? task.createdById : null);

    if (targetUserId) {
      const commenterName = comment.user.name;
      const notification = await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'COMMENT_ADDED',
          title: 'New Comment',
          message: `${commenterName} commented on task "${task.title}": "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
          link: `/projects/${task.projectId}?task=${task.id}`,
        },
      });
      sendNotificationToUser(targetUserId, notification);
    }

    return res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

export default router;
