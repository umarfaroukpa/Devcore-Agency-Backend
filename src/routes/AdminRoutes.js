"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const Admin_controllers_1 = require("../controllers/Admin.controllers");
const TaskAssignment_controllers_1 = require("../controllers/TaskAssignment.controllers");
const ReportRoutes_1 = __importDefault(require("./ReportRoutes"));
const InviteCode_routes_1 = __importDefault(require("./InviteCode.routes"));
const adminRouter = (0, express_1.Router)();
// All routes require authentication
adminRouter.use(Auth_middleware_1.authenticate);
// Logging middleware for debugging
adminRouter.use((req, res, next) => {
    const authReq = req;
    console.log('📍 Admin Route:', req.method, req.path);
    console.log('👤 User Role:', authReq.user?.role);
    console.log('🔍 Query Params:', req.query);
    next();
});
// Apply role restrictions differently for different routes
adminRouter.use((req, res, next) => {
    const authReq = req;
    // Check the path to apply different restrictions
    if (req.path.startsWith('/activity')) {
        console.log('🔒 Checking SUPER_ADMIN access for activity logs...');
        // For activity logs, only SUPER_ADMIN
        if (authReq.user?.role !== 'SUPER_ADMIN') {
            console.log('❌ Access denied - not a SUPER_ADMIN');
            return res.status(403).json({
                success: false,
                error: 'Only Super Admins can view activity logs'
            });
        }
        console.log('✅ SUPER_ADMIN access granted');
    }
    else {
        // For other routes, allow ADMIN and SUPER_ADMIN
        if (!['ADMIN', 'SUPER_ADMIN'].includes(authReq.user?.role || '')) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Requires ADMIN or SUPER_ADMIN role.'
            });
        }
    }
    next();
});
// Stats all admins can view
adminRouter.get('/stats', Admin_controllers_1.getAdminStats);
// Tasks
adminRouter.get('/tasks', TaskAssignment_controllers_1.getAllTasks);
// Users management - ADMIN and SUPER_ADMIN
adminRouter.get('/users/pending', Admin_controllers_1.getPendingUsers);
adminRouter.get('/users', Admin_controllers_1.getUsers);
adminRouter.get('/users/:id', Admin_controllers_1.getUserById);
// Update user - all admins, but with role restrictions in controller
adminRouter.patch('/users/:id', Admin_controllers_1.updateUser);
// Approve users - requires permission
adminRouter.patch('/users/:id/approve', Admin_controllers_1.approveUser);
// Reject users - requires permission
adminRouter.patch('/users/:id/reject', Admin_controllers_1.rejectUser);
// Delete users - SUPER_ADMIN only with permission
adminRouter.delete('/users/:id', (req, res, next) => {
    const authReq = req;
    if (authReq.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Only Super Admins can delete users'
        });
    }
    next();
}, (0, Auth_middleware_1.requirePermission)('canDeleteUsers'), Admin_controllers_1.deleteUser);
// Activity logs - SUPER_ADMIN only
adminRouter.get('/activity', (req, res, next) => {
    console.log('🎯 Activity endpoint hit');
    console.log('Query:', req.query);
    next();
}, Admin_controllers_1.getActivityLogs);
// Reports - ADMIN and SUPER_ADMIN
adminRouter.use('/reports', ReportRoutes_1.default);
// Invite Codes - ADMIN and SUPER_ADMIN
adminRouter.use('/invite-codes', InviteCode_routes_1.default);
exports.default = adminRouter;
