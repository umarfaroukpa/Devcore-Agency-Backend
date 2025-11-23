import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';
import crypto from 'crypto';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// Generate a random invite code
const generateInviteCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// POST /api/admin/invite-codes - Create new invite code (Admin only)
export const createInviteCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role, expiresInDays } = req.body;

  const validRoles = ['ADMIN', 'DEVELOPER'];
  if (!validRoles.includes(role)) {
    throw new AppError('Invalid role. Only ADMIN or DEVELOPER codes can be created', 400);
  }

  const code = generateInviteCode();
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const inviteCode = await prisma.inviteCode.create({
    data: {
      code,
      role,
      expiresAt
    }
  });

  res.status(201).json({
    success: true,
    message: 'Invite code created successfully',
    data: inviteCode
  });
});

// GET /api/admin/invite-codes - Get all invite codes (Admin only)
export const getAllInviteCodes = asyncHandler(async (req: Request, res: Response) => {
  const { status, role } = req.query;

  const where: any = {};

  if (status === 'active') {
    where.used = false;
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];
  } else if (status === 'used') {
    where.used = true;
  } else if (status === 'expired') {
    where.used = false;
    where.expiresAt = { lte: new Date() };
  }

  if (role) {
    where.role = role;
  }

  const inviteCodes = await prisma.inviteCode.findMany({
    where,
    orderBy: { id: 'desc' }
  });

  res.status(200).json({
    success: true,
    count: inviteCodes.length,
    data: inviteCodes
  });
});

// POST /api/auth/verify-invite - Verify invite code (Public)
export const verifyInviteCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    throw new AppError('Invite code is required', 400);
  }

  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (!inviteCode) {
    throw new AppError('Invalid invite code', 404);
  }

  if (inviteCode.used) {
    throw new AppError('This invite code has already been used', 400);
  }

  if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
    throw new AppError('This invite code has expired', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Invite code is valid',
    data: {
      role: inviteCode.role
    }
  });
});

// DELETE /api/admin/invite-codes/:id - Delete invite code (Admin only)
export const deleteInviteCode = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const inviteCode = await prisma.inviteCode.findUnique({
    where: { id }
  });

  if (!inviteCode) {
    throw new AppError('Invite code not found', 404);
  }

  if (inviteCode.used) {
    throw new AppError('Cannot delete used invite code', 400);
  }

  await prisma.inviteCode.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Invite code deleted successfully'
  });
});