import { Request, Response } from 'express';
import { prisma } from '@nightguard/database';
import { hashPassword, verifyPassword, signToken, generateSecureToken } from '@nightguard/security';
import {
  RegisterUserSchema,
  LoginUserSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  AuditAction,
} from '@nightguard/shared';
import { config } from '../config';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    const input = RegisterUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        timezone: input.timezone || 'UTC',
        isVerified: true,
      },
    });

    // Create default network for user
    const network = await prisma.network.create({
      data: {
        userId: user.id,
        name: 'My Wi-Fi Network',
        ssid: 'Home_Wi-Fi',
        isDefault: true,
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret);

    res.cookie(config.sessionCookieName, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.USER_REGISTERED,
        entityType: 'USER',
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, timezone: user.timezone },
        token,
        defaultNetworkId: network.id,
      },
    });
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const input = LoginUserSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret);

    res.cookie(config.sessionCookieName, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.USER_LOGGED_IN,
        entityType: 'USER',
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, timezone: user.timezone },
        token,
      },
    });
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie(config.sessionCookieName);
    res.json({ success: true, message: 'Logged out successfully.' });
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, timezone: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({ success: true, data: { user } });
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    const input = ForgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

    if (!user) {
      // Do not disclose account existence
      res.json({ success: true, message: 'If an account matches that email, a password reset link has been dispatched.' });
      return;
    }

    const resetToken = generateSecureToken('rst', 16);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    res.json({
      success: true,
      message: 'If an account matches that email, a password reset link has been dispatched.',
      resetTokenPreview: config.isProduction ? undefined : resetToken,
    });
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    const input = ResetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: input.token,
        resetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
      return;
    }

    const passwordHash = await hashPassword(input.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
      },
    });

    res.json({ success: true, message: 'Password has been updated. You can now log in.' });
  }
}
