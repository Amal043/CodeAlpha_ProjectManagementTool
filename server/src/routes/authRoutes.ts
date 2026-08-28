import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken } from '../middlewares/auth';
import { AuthRequest, ProjectRole } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_jwt_secret_key_violet_2026';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  projectId: z.string().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatarUrl: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email: rawEmail, password, name, projectId: paramProjectId, role: paramRole } = registerSchema.parse(req.body);
    const email = rawEmail.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        avatarUrl,
      },
    });

    // Process pending project invitations for this email
    const pendingInvites = await prisma.projectInvite.findMany({
      where: { email },
    });

    for (const invite of pendingInvites) {
      await prisma.projectMember.create({
        data: {
          projectId: invite.projectId,
          userId: user.id,
          role: invite.role as ProjectRole,
        },
      }).catch(() => {}); // Ignore duplicate
    }

    // Delete processed invites
    if (pendingInvites.length > 0) {
      await prisma.projectInvite.deleteMany({ where: { email } });
    }

    // If explicit projectId parameter was passed
    if (paramProjectId) {
      const assignedRole = (paramRole as ProjectRole) || ProjectRole.MEMBER;
      await prisma.projectMember.create({
        data: {
          projectId: paramProjectId,
          userId: user.id,
          role: assignedRole,
        },
      }).catch(() => {});
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile - Update name, avatarUrl, or password
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { name, avatarUrl, password } = updateProfileSchema.parse(req.body);

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim();
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    return res.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
