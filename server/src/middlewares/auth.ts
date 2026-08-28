import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, ProjectRole } from '../types';
import { prisma } from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_jwt_secret_key_violet_2026';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const checkProjectRole = (allowedRoles: ProjectRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User unauthenticated' });
      }

      const projectId = req.params.projectId || req.params.id || req.body.projectId;

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID required for authorization check' });
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
      }

      if (!allowedRoles.includes(member.role as ProjectRole)) {
        return res.status(403).json({ message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}` });
      }

      req.projectMember = {
        id: member.id,
        projectId: member.projectId,
        userId: member.userId,
        role: member.role as ProjectRole,
      };

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json({ message: 'Internal authorization error' });
    }
  };
};
