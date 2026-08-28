import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, checkProjectRole } from '../middlewares/auth';
import { AuthRequest, ProjectRole } from '../types';
import { sendNotificationToUser } from '../socket/socketHandler';
import { sendProjectInviteEmail } from '../services/emailService';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
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
    const { name, description, imageUrl } = createProjectSchema.parse(req.body);
    const userId = req.user!.id;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
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

// GET /api/projects/:id - Get project details with tasks and members
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
      const { name, description, imageUrl } = updateProjectSchema.parse(req.body);

      const project = await prisma.project.update({
        where: { id },
        data: {
          name,
          description: description || null,
          imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined,
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

// POST /api/projects/:projectId/members - Invite/Add member
router.post(
  '/:projectId/members',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER, ProjectRole.ADMIN]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { projectId } = req.params;
      const { email: rawEmail, role } = addMemberSchema.parse(req.body);
      const email = rawEmail.toLowerCase().trim();

      const existingUser = await prisma.user.findUnique({ where: { email } });

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      if (existingUser) {
        const existingMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: existingUser.id,
            },
          },
        });

        if (existingMember) {
          return res.status(400).json({ message: 'User is already a member of this project' });
        }

        const newMember = await prisma.projectMember.create({
          data: {
            projectId,
            userId: existingUser.id,
            role: role as ProjectRole,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        });

        const notification = await prisma.notification.create({
          data: {
            userId: existingUser.id,
            type: 'PROJECT_INVITE',
            title: 'Project Invitation',
            message: `You were added to project "${project.name}" as ${role}`,
            link: `/projects/${projectId}`,
          },
        });
        sendNotificationToUser(existingUser.id, notification);

        return res.status(201).json({ member: newMember, isNewUser: false });
      }

      const invite = await prisma.projectInvite.upsert({
        where: {
          projectId_email: {
            projectId,
            email,
          },
        },
        update: {
          role: role as ProjectRole,
          invitedById: req.user!.id,
        },
        create: {
          projectId,
          email,
          role: role as ProjectRole,
          invitedById: req.user!.id,
        },
      });

      const origin = req.headers.origin || 'https://code-alpha-project-management-tool-indo.vercel.app';
      const inviteLink = `${origin}/register?email=${encodeURIComponent(email)}&projectId=${projectId}&role=${role}`;

      const inviterName = req.user!.name || 'A team member';
      await sendProjectInviteEmail(email, project.name, inviterName, inviteLink).catch((err) => {
        console.error('Email service dispatch warning:', err);
      });

      return res.status(200).json({
        inviteLink,
        isNewUser: true,
        message: `Invitation generated for ${email}. Join link sent via email.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
