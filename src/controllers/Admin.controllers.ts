import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';
import { ActivityType } from '@prisma/client';

// Helper function to check if user is super admin
const isSuperAdmin = (user: any) => user.role === 'SUPER_ADMIN';

// Helper function to check admin permissions
const hasPermission = (user: any, permission: string) => {
  if (isSuperAdmin(user)) return true;
  return user[permission] === true;
};

// Log admin activity
const logActivity = async (
  performedById: string,
  type: ActivityType,
  targetId?: string,
  targetType?: string,
  details?: any,
  ipAddress?: string
) => {

  // Check if we have a valid performer ID
  if (!performedById) {
    console.warn('No performer ID provided for activity log');
    return; // Skip logging if no performer
  }
  await prisma.activityLog.create({
    data: {
      type,
      performedById,
      targetId,
      targetType,
      details,
      ipAddress
    }
  });
};

// GET /api/admin/users - Fetch all users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { role, status, search } = req.query;

  const where: any = {};

  if (role) where.role = role as string;

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
      canApproveUsers: true,
      canDeleteUsers: true,
      canManageProjects: true,
      canAssignTasks: true,
      createdAt: true,
      updatedAt: true,
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
      canApproveUsers: true,
      canDeleteUsers: true,
      canManageProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      createdAt: true,
      updatedAt: true,
      assignedTasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true
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
  const currentUser = (req as any).user;
  const updateData = req.body;

  // Check if trying to update another super admin
  const targetUser = await prisma.user.findUnique({ where: { id } });
  
  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Only SUPER_ADMIN can modify other SUPER_ADMINs
  if (targetUser.role === 'SUPER_ADMIN' && !isSuperAdmin(currentUser)) {
    throw new AppError('Only Super Admins can modify other Super Admins', 403);
  }

  // Only SUPER_ADMIN can grant SUPER_ADMIN role
  if (updateData.role === 'SUPER_ADMIN' && !isSuperAdmin(currentUser)) {
    throw new AppError('Only Super Admins can grant Super Admin role', 403);
  }

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
      isApproved: true,
      canApproveUsers: true,
      canDeleteUsers: true,
      canManageProjects: true,
      canAssignTasks: true
    }
  });

  // Log activity
  await logActivity(
    currentUser.userId,
    'USER_UPDATED',
    id,
    'user',
    { updates: Object.keys(updateData) },
    req.ip
  );

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// DELETE /api/admin/users/:id - Delete a user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;

  // Check if user has permission
  if (!hasPermission(currentUser, 'canDeleteUsers')) {
    throw new AppError('You do not have permission to delete users', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      projects: true,
      assignedTasks: true,
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting yourself
  if (currentUser.userId === id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  // Only SUPER_ADMIN can delete other SUPER_ADMINs
  if (user.role === 'SUPER_ADMIN' && !isSuperAdmin(currentUser)) {
    throw new AppError('Only Super Admins can delete other Super Admins', 403);
  }

  if (user.projects && user.projects.length > 0) {
    throw new AppError(
      `Cannot delete user with ${user.projects.length} active project(s)`,
      400
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.deleteMany({ where: { userId: id } });
    await tx.task.updateMany({
      where: { assignedTo: id },
      data: { assignedTo: null }
    });
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  // Log activity
  await logActivity(
    currentUser.userId,
    'USER_DELETED',
    id,
    'user',
    { email: user.email, role: user.role },
    req.ip
  );

  res.status(200).json({
    success: true,
    message: 'User successfully deleted'
  });
});

// PATCH /api/admin/users/:id/approve - Approve user
export const approveUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;

  // Check if user has permission
  if (!hasPermission(currentUser, 'canApproveUsers')) {
    throw new AppError('You do not have permission to approve users', 403);
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (existingUser.isApproved === true) {
    throw new AppError('User is already approved', 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      isApproved: true,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: currentUser.userId
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Account Approved',
      message: 'Your account has been approved. You can now access all features.',
      type: 'approval'
    }
  });

  // Log activity
  await logActivity(
    currentUser.userId,
    'USER_APPROVED',
    id,
    'user',
    { email: user.email, role: user.role },
    req.ip
  );

  res.status(200).json({
    success: true,
    message: 'User approved successfully',
    data: user
  });
});

// GET /api/admin/activity - Get activity logs
export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;

  // Only SUPER_ADMIN can view all activity logs
  if (currentUser.role !== 'SUPER_ADMIN') {
    throw new AppError('Only Super Admins can view activity logs', 403);
  }

  // Parse and validate limit parameter with better error handling
  let limit = 50; // default
  if (req.query.limit) {
    const parsedLimit = parseInt(req.query.limit as string, 10);
    if (isNaN(parsedLimit)) {
      throw new AppError('Limit parameter must be a valid number', 400);
    }
    if (parsedLimit < 1 || parsedLimit > 100) {
      throw new AppError('Limit parameter must be between 1 and 100', 400);
    }
    limit = parsedLimit;
  }

  const type = req.query.type as string | undefined;

  const where: any = {};
  if (type) where.type = type;

  try {
    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        performer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw new AppError('Failed to fetch activity logs', 500);
  }
});

// GET /api/admin/stats - Dashboard statistics
export const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    activeUsers,
    pendingApprovals,
    totalProjects,
    totalTasks,
    adminCount,
    developerCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ 
      where: { 
        OR: [{ isApproved: null }, { isApproved: false }],
        role: { in: ['DEVELOPER', 'ADMIN'] }
      } 
    }),
    prisma.project.count(),
    prisma.task.count(),
    prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
    prisma.user.count({ where: { role: 'DEVELOPER' } })
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      pendingApprovals,
      totalProjects,
      totalTasks,
      adminCount,
      developerCount
    }
  });
});

export const getPendingUsers = asyncHandler(async (req: Request, res: Response) => {
  const pendingUsers = await prisma.user.findMany({
    where: {
      OR: [{ isApproved: null }, { isApproved: false }],
      role: { in: ['DEVELOPER', 'ADMIN'] }
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
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    count: pendingUsers.length,
    data: pendingUsers
  });
});

// PATCH /api/admin/users/:id/reject - Reject user
export const rejectUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const currentUser = (req as any).user;

  if (!reason || !reason.trim()) {
    throw new AppError('Please provide a reason for rejection', 400);
  }

  // Check if user has permission
  if (!hasPermission(currentUser, 'canApproveUsers')) {
    throw new AppError('You do not have permission to reject users', 403);
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (existingUser.isApproved === false) {
    throw new AppError('User is already rejected', 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      isApproved: false,
      isActive: false,
      approvedAt: new Date(),
      approvedBy: currentUser.id || currentUser.userId
    },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isApproved: true,
      isActive: true
    }
  });

  // Create notification
  try {
    await prisma.notification.create({
      data: {
        userId: id,
        title: 'Application Rejected',
        message: `Your application has been rejected. Reason: ${reason}`,
        type: 'approval'
      }
    });
  } catch (notifError) {
    console.error('❌ Error creating notification:', notifError);
  }

  // Log activity
  const performerId = currentUser.id || currentUser.userId;
  if (performerId) {
    await logActivity(
      performerId,
      'USER_UPDATED',
      id,
      'user',
      { 
        action: 'rejected', 
        reason, 
        email: user.email, 
        role: user.role 
      },
      req.ip
    );
  }

  res.status(200).json({
    success: true,
    message: 'User rejected successfully',
    data: user
  });
});
