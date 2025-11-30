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
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
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

// GET /api/admin/users/pending - Get all pending approval users
export const getPendingUsers = asyncHandler(async (req: Request, res: Response) => {
  const pendingUsers = await prisma.user.findMany({
    where: {
      OR: [
        { isApproved: null },
        { isApproved: false }
      ],
      role: {
        in: ['DEVELOPER', 'ADMIN']
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      skills: true,
      experience: true,
      githubUsername: true,
      portfolio: true,
      position: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    success: true,
    count: pendingUsers.length,
    data: pendingUsers
  });
});

// DELETE /api/admin/users/:id - Delete a user
// DELETE /api/admin/users/:id - Delete a user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      projects: true,
      assignedTasks: true,
      createdTasks: true,
      memberships: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting yourself
  const currentUserId = (req as any).user?.userId;
  if (currentUserId === id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  // Check if user has projects (CLIENT users)
  if (user.projects && user.projects.length > 0) {
    throw new AppError(
      `Cannot delete user with ${user.projects.length} active project(s). Please reassign or delete projects first.`,
      400
    );
  }

  // Delete in transaction to handle all related records
  await prisma.$transaction(async (tx) => {
    // Delete project memberships
    await tx.projectMember.deleteMany({
      where: { userId: id }
    });

    // Unassign tasks (don't delete them, just remove assignment)
    await tx.task.updateMany({
      where: { assignedTo: id },
      data: { assignedTo: null }
    });

    // Delete tasks created by user (or reassign them)
    await tx.task.deleteMany({
      where: { createdBy: id }
    });

    // Finally delete the user
    await tx.user.delete({
      where: { id }
    });
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
      lastName: true,
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
      lastName: true,
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
  const adminId = (req as any).user?.userId; // Get admin ID from auth middleware

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (existingUser.isApproved === true) {
    throw new AppError('User is already approved', 400);
  }

  // Approve the user
  const user = await prisma.user.update({
    where: { id },
    data: {
      isApproved: true,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: adminId
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isApproved: true
    }
  });

  // TODO: Send approval email
  // await sendApprovalEmail(user.email, user.firstName);

  res.status(200).json({
    success: true,
    message: 'User approved successfully. They can now log in.',
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
    prisma.user.count({ 
      where: { 
        OR: [
          { isApproved: null },
          { isApproved: false }
        ],
        role: {
          in: ['DEVELOPER', 'ADMIN']
        }
      } 
    }),
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