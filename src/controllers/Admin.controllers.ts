import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';

// GET /api/admin/users - Fetch all users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, status, search } = req.query;

  // Build filter
  const where: any = {};

  if (role) {
    where.role = role as string;
  }

  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      isApproved: true,
      createdAt: true,
      updatedAt: true,
      // Don't return password
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// DELETE /api/admin/users/:id - Delete a user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting yourself (optional)
  // if (req.user?.userId === id) {
  //   throw new AppError('You cannot delete your own account', 400);
  // }

  // Delete user
  await prisma.user.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'User successfully deleted'
  });
});

// GET /api/admin/users/:id - Get user details
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      isApproved: true,
      companyName: true,
      industry: true,
      position: true,
      skills: true,
      experience: true,
      portfolio: true,
      githubUsername: true,
      createdAt: true,
      updatedAt: true,
      assignedTasks: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      projects: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// PATCH /api/admin/users/:id - Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.password;
  delete updateData.id;

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      firstName: true,
      email: true,
      role: true,
      isActive: true,
      isApproved: true
    }
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// PATCH /api/admin/users/:id/approve - Approve user
export const approveUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.update({
    where: { id },
    data: {
      isApproved: true,
      isActive: true,
      approvedAt: new Date()
      // approvedBy: req.user?.userId // If you track who approved
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      role: true
    }
  });

  // TODO: Send approval email
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Account Approved',
  //   template: 'account-approved'
  // });

  res.status(200).json({
    success: true,
    message: 'User approved successfully',
    data: user
  });
});

// GET /api/admin/stats - Get dashboard statistics
export const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    activeUsers,
    pendingApprovals,
    totalProjects,
    totalTasks
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isApproved: false } }),
    prisma.project.count(),
    prisma.task.count()
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      pendingApprovals,
      totalProjects,
      totalTasks
    }
  });
});
