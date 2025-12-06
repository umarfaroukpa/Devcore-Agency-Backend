import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';
import { Request, Response } from 'express';

// GET /api/users/me - Get current user profile
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId || currentUser.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatar: true,
      companyName: true,
      industry: true,
      position: true,
      skills: true,
      experience: true,
      githubUsername: true,
      portfolio: true,
      isActive: true,
      isApproved: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

// PATCH /api/users/me - Update current user profile
export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.id;
  delete updates.email;
  delete updates.password;
  delete updates.role;
  delete updates.isApproved;
  delete updates.isActive;

  const updatedUser = await prisma.user.update({
    where: { id: currentUser.userId || currentUser.id },
    data: updates,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatar: true,
      companyName: true,
      industry: true,
      position: true,
      skills: true,
      experience: true,
      githubUsername: true,
      portfolio: true,
      isActive: true,
      isApproved: true
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

// PATCH /api/users/updatePassword - Change password
export const updateMyPassword = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId || currentUser.id },
    select: {
      id: true,
      password: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});