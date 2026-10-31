import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '@nightguard/security';
import { config } from '../config';
import { UserRole } from '@nightguard/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.[config.sessionCookieName] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to proceed.',
    });
    return;
  }

  try {
    const payload = verifyToken(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.',
    });
    return;
  }
  next();
}
