"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const Notification_controller_1 = require("../controllers/Notification.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(Auth_middleware_1.authenticate);
// GET /api/notifications - Get user's notifications
router.get('/', Notification_controller_1.getNotifications);
// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', Notification_controller_1.markAsRead);
// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', Notification_controller_1.markAllAsRead);
exports.default = router;
