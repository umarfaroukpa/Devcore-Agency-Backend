import { Router } from 'express';
import { authenticate } from '../middleware/Auth.middleware';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/Notification.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', markAsRead);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', markAllAsRead);

export default router;