import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticateToken } from '../middlewares/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/users/search?q=query
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const query = (req.query.q as string || '').trim().toLowerCase();

    if (!query) {
      return res.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query } },
          { name: { contains: query } },
        ],
        NOT: {
          id: req.user!.id,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
      take: 10,
    });

    return res.json({ users });
  } catch (error) {
    next(error);
  }
});

export default router;
