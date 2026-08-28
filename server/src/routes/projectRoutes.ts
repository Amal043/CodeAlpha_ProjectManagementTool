import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, checkProjectRole } from '../middlewares/auth';
import { AuthRequest, ProjectRole } from '../types';
import { sendNotificationToUser } from '../socket/socketHandler';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});

// GET /api/projects - List user's projects
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create project
router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, description } = createProjectSchema.parse(req.body);
    const userId = req.user!.id;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: ProjectRole.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    return res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project details
router.get(
  '/:id',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          tasks: {
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
          },
        },
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      return res.json({
        project,
        currentUserRole: req.projectMember?.role,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/projects/:id - Update project metadata
router.put(
  '/:id',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER, ProjectRole.ADMIN]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const { name, description } = createProjectSchema.parse(req.body);

      const project = await prisma.project.update({
        where: { id },
        data: {
          name,
          description: description || null,
        },
      });

      return res.json({ project });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/projects/:id - Delete project
router.delete(
  '/:id',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;

      await prisma.project.delete({ where: { id } });

      return res.json({ message: 'Project successfully deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/projects/:id/members - Add member by email
router.post(
  '/:id/members',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER, ProjectRole.ADMIN]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const projectId = req.params.id;
      const { email, role } = addMemberSchema.parse(req.body);

      const userToAdd = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!userToAdd) {
        return res.status(404).json({ message: `No user found with email ${email}` });
      }

      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: userToAdd.id,
          },
        },
      });

      if (existingMember) {
        return res.status(400).json({ message: 'User is already a member of this project' });
      }

      const newMember = await prisma.projectMember.create({
        data: {
          projectId,
          userId: userToAdd.id,
          role,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      const project = await prisma.project.findUnique({ where: { id: projectId } });

      // Notify invited user
      const notification = await prisma.notification.create({
        data: {
          userId: userToAdd.id,
          type: 'PROJECT_INVITE',
          title: 'Added to Project',
          message: `You were added to project "${project?.name}" as a ${role.toLowerCase()}.`,
          link: `/projects/${projectId}`,
        },
      });

      sendNotificationToUser(userToAdd.id, notification);

      return res.status(201).json({ member: newMember });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/projects/:id/members/:memberId - Update member role
router.put(
  '/:id/members/:memberId',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { memberId } = req.params;
      const { role } = updateMemberRoleSchema.parse(req.body);

      const updatedMember = await prisma.projectMember.update({
        where: { id: memberId },
        data: { role },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      return res.json({ member: updatedMember });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/projects/:id/members/:memberId - Remove member
router.delete(
  '/:id/members/:memberId',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER, ProjectRole.ADMIN]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { memberId } = req.params;

      const targetMember = await prisma.projectMember.findUnique({ where: { id: memberId } });
      if (!targetMember) {
        return res.status(404).json({ message: 'Member not found' });
      }

      if (targetMember.role === ProjectRole.OWNER) {
        return res.status(400).json({ message: 'Cannot remove the project owner' });
      }

      await prisma.projectMember.delete({ where: { id: memberId } });

      return res.json({ message: 'Member removed from project' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
