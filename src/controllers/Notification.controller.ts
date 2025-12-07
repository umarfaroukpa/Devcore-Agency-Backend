import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// GET /api/notifications
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const notifications = await prisma.notification.findMany({
    where: { 
      userId,
      isRead: false // Only get unread notifications, or remove this filter for all
    },
    orderBy: { 
      createdAt: 'desc' 
    },
    take: 50 // Limit to 20 notifications
  });

  res.status(200).json({
    success: true,
    data: notifications
  });
});

// PATCH /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Find notification belonging to user
  const notification = await prisma.notification.findFirst({
    where: { 
      id, 
      userId 
    }
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  // Update notification
  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: updatedNotification
  });
});

// PATCH /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Mark all user's notifications as read
  await prisma.notification.updateMany({
    where: { 
      userId,
      isRead: false 
    },
    data: { isRead: true }
  });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});