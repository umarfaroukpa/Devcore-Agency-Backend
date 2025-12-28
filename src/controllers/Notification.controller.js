"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ErrorHandler_1 = require("../middleware/ErrorHandler");
// GET /api/notifications
exports.getNotifications = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ErrorHandler_1.AppError('User not authenticated', 401);
    }
    const notifications = await prisma_1.default.notification.findMany({
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
exports.markAsRead = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        throw new ErrorHandler_1.AppError('User not authenticated', 401);
    }
    // Find notification belonging to user
    const notification = await prisma_1.default.notification.findFirst({
        where: {
            id,
            userId
        }
    });
    if (!notification) {
        throw new ErrorHandler_1.AppError('Notification not found', 404);
    }
    // Update notification
    const updatedNotification = await prisma_1.default.notification.update({
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
exports.markAllAsRead = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ErrorHandler_1.AppError('User not authenticated', 401);
    }
    // Mark all user's notifications as read
    await prisma_1.default.notification.updateMany({
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
