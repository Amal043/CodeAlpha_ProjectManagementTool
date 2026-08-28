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

// POST /api/projects/:id/members - Invite/add member by email
router.post(
  '/:id/members',
  authenticateToken,
  checkProjectRole([ProjectRole.OWNER, ProjectRole.ADMIN]),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const projectId = req.params.id;
      const { email: rawEmail, role } = addMemberSchema.parse(req.body);
      const email = rawEmail.toLowerCase().trim();
      const currentUserId = req.user!.id;

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const sender = await prisma.user.findUnique({ where: { id: currentUserId } });
      const senderName = sender?.name || 'A team member';

      // Dynamically detect client URL from request headers or environment
      const clientUrl = (
        req.headers.origin && req.headers.origin !== 'null'
          ? req.headers.origin
          : (process.env.CLIENT_URL || 'https://code-alpha-project-management-tool-indo.vercel.app')
      );

      // 1. Check if user already exists in database
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        // Check if already a member
        const existingMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: existingUser.id,
            },
          },
        });

        if (existingMember) {
          return res.status(400).json({ message: `${email} is already a member of this project` });
        }

        const newMember = await prisma.projectMember.create({
          data: {
            projectId,
            userId: existingUser.id,
            role,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        });

        const inviteLink = `${clientUrl}/projects/${projectId}`;

        const emailSent = await sendProjectInviteEmail({
          toEmail: email,
          senderName,
          projectName: project.name,
          role,
          inviteLink,
        });

        // Notify user in-app
        const notification = await prisma.notification.create({
          data: {
            userId: existingUser.id,
            type: 'PROJECT_INVITE',
            title: 'Added to Project',
            message: `You were added to project "${project.name}" as a ${role.toLowerCase()}.`,
            link: `/projects/${projectId}`,
          },
        });

        sendNotificationToUser(existingUser.id, notification);

        return res.status(201).json({
          member: newMember,
          inviteLink,
          isNewUser: false,
          message: emailSent
            ? `Invitation email delivered directly to ${email}! Added to project.`
            : `Added ${existingUser.name} (${email}) to project! Share the join link below.`,
        });
      }

      // 2. User does not exist yet -> Save ProjectInvite record & generate registration link
      await prisma.projectInvite.upsert({
        where: {
          projectId_email: {
            projectId,
            email,
          },
        },
        create: {
          projectId,
          email,
          role,
          invitedById: currentUserId,
        },
        update: {
          role,
          invitedById: currentUserId,
        },
      });

      const inviteLink = `${clientUrl}/register?email=${encodeURIComponent(email)}&projectId=${projectId}&role=${role}`;

      const emailSent = await sendProjectInviteEmail({
        toEmail: email,
        senderName,
        projectName: project.name,
        role,
        inviteLink,
      });

      return res.status(200).json({
        inviteLink,
        isNewUser: true,
        message: emailSent
          ? `Invitation email delivered directly to ${email}!`
          : `Invitation generated for ${email}! Share the join link below. (Add GMAIL_USER & GMAIL_APP_PASS on Render for automatic email delivery)`,
      });
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
