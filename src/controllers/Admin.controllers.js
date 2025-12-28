"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectUser = exports.getPendingUsers = exports.getAdminStats = exports.getActivityLogs = exports.approveUser = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ErrorHandler_1 = require("../middleware/ErrorHandler");
// Helper function to check if user is super admin
const isSuperAdmin = (user) => user.role === 'SUPER_ADMIN';
// Helper function to check admin permissions
const hasPermission = (user, permission) => {
    if (isSuperAdmin(user))
        return true;
    return user[permission] === true;
};
// Log admin activity
const logActivity = async (performedById, type, targetId, targetType, details, ipAddress) => {
    // Check if we have a valid performer ID
    if (!performedById) {
        console.warn('No performer ID provided for activity log');
        return; // Skip logging if no performer
    }
    await prisma_1.default.activityLog.create({
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
exports.getUsers = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const currentUser = req.user;
    const { role, status, search } = req.query;
    const where = {};
    if (role)
        where.role = role;
    if (status === 'active') {
        where.isActive = true;
    }
    else if (status === 'inactive') {
        where.isActive = false;
    }
    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }
    const users = await prisma_1.default.user.findMany({
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
exports.getUserById = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await prisma_1.default.user.findUnique({
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
        throw new ErrorHandler_1.AppError('User not found', 404);
    }
    res.status(200).json({
        success: true,
        data: user
    });
});
// PATCH /api/admin/users/:id - Update user
exports.updateUser = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    const updateData = req.body;
    // Check if trying to update another super admin
    const targetUser = await prisma_1.default.user.findUnique({ where: { id } });
    if (!targetUser) {
        throw new ErrorHandler_1.AppError('User not found', 404);
    }
    // Only SUPER_ADMIN can modify other SUPER_ADMINs
    if (targetUser.role === 'SUPER_ADMIN' && !isSuperAdmin(currentUser)) {
        throw new ErrorHandler_1.AppError('Only Super Admins can modify other Super Admins', 403);
    }
    // Only SUPER_ADMIN can grant SUPER_ADMIN role
    if (updateData.role === 'SUPER_ADMIN' && !isSuperAdmin(currentUser)) {
        throw new ErrorHandler_1.AppError('Only Super Admins can grant Super Admin role', 403);
    }
    // Remove fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.id;
    const user = await prisma_1.default.user.update({
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
    await logActivity(currentUser.userId, 'USER_UPDATED', id, 'user', { updates: Object.keys(updateData) }, req.ip);
    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
    });
});
// DELETE /api/admin/users/:id - Delete a user
exports.deleteUser = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    // Check if user has permission
    if (!hasPermission(currentUser, 'canDeleteUsers')) {
        throw new ErrorHandler_1.AppError('You do not have permission to delete users', 403);
    }
    const user = await prisma_1.default.user.findUnique({
        where: { id },
        include: {
            projects: true,
            assignedTasks: true,
        }
    });
    if (!user) {
        throw new ErrorHandler_1.AppError('User not found', 404);
    }
    // Prevent deleting yourself
    if (currentUser.userId === id) {
        throw new ErrorHandler_1.AppError('You cannot delete your own account', 400);
    }
    // Only SUPER_ADMIN can delete other SUPER_ADMINs
    if (user.role === 'SUPER_ADMIN' && !isSuperAdmin(currentUser)) {
        throw new ErrorHandler_1.AppError('Only Super Admins can delete other Super Admins', 403);
    }
    if (user.projects && user.projects.length > 0) {
        throw new ErrorHandler_1.AppError(`Cannot delete user with ${user.projects.length} active project(s)`, 400);
    }
    await prisma_1.default.$transaction(async (tx) => {
        await tx.projectMember.deleteMany({ where: { userId: id } });
        await tx.task.updateMany({
            where: { assignedTo: id },
            data: { assignedTo: null }
        });
        await tx.notification.deleteMany({ where: { userId: id } });
        await tx.user.delete({ where: { id } });
    });
    // Log activity
    await logActivity(currentUser.userId, 'USER_DELETED', id, 'user', { email: user.email, role: user.role }, req.ip);
    res.status(200).json({
        success: true,
        message: 'User successfully deleted'
    });
});
// PATCH /api/admin/users/:id/approve - Approve user
exports.approveUser = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    // Check if user has permission
    if (!hasPermission(currentUser, 'canApproveUsers')) {
        throw new ErrorHandler_1.AppError('You do not have permission to approve users', 403);
    }
    const existingUser = await prisma_1.default.user.findUnique({ where: { id } });
    if (!existingUser) {
        throw new ErrorHandler_1.AppError('User not found', 404);
    }
    if (existingUser.isApproved === true) {
        throw new ErrorHandler_1.AppError('User is already approved', 400);
    }
    const user = await prisma_1.default.user.update({
        where: { id },
        data: {
            isApproved: true,
            isActive: true,
            approvedAt: new Date(),
            approvedBy: currentUser.userId
        }
    });
    // Create notification
    await prisma_1.default.notification.create({
        data: {
            userId: id,
            title: 'Account Approved',
            message: 'Your account has been approved. You can now access all features.',
            type: 'approval'
        }
    });
    // Log activity
    await logActivity(currentUser.userId, 'USER_APPROVED', id, 'user', { email: user.email, role: user.role }, req.ip);
    res.status(200).json({
        success: true,
        message: 'User approved successfully',
        data: user
    });
});
// GET /api/admin/activity - Get activity logs
exports.getActivityLogs = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const currentUser = req.user;
    // Only SUPER_ADMIN can view all activity logs
    if (currentUser.role !== 'SUPER_ADMIN') {
        throw new ErrorHandler_1.AppError('Only Super Admins can view activity logs', 403);
    }
    // Parse and validate limit parameter with better error handling
    let limit = 50; // default
    if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit, 10);
        if (isNaN(parsedLimit)) {
            throw new ErrorHandler_1.AppError('Limit parameter must be a valid number', 400);
        }
        if (parsedLimit < 1 || parsedLimit > 100) {
            throw new ErrorHandler_1.AppError('Limit parameter must be between 1 and 100', 400);
        }
        limit = parsedLimit;
    }
    const type = req.query.type;
    const where = {};
    if (type)
        where.type = type;
    try {
        const logs = await prisma_1.default.activityLog.findMany({
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
    }
    catch (error) {
        console.error('Error fetching activity logs:', error);
        throw new ErrorHandler_1.AppError('Failed to fetch activity logs', 500);
    }
});
// GET /api/admin/stats - Dashboard statistics
exports.getAdminStats = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const [totalUsers, activeUsers, pendingApprovals, totalProjects, totalTasks, adminCount, developerCount] = await Promise.all([
        prisma_1.default.user.count(),
        prisma_1.default.user.count({ where: { isActive: true } }),
        prisma_1.default.user.count({
            where: {
                OR: [{ isApproved: null }, { isApproved: false }],
                role: { in: ['DEVELOPER', 'ADMIN'] }
            }
        }),
        prisma_1.default.project.count(),
        prisma_1.default.task.count(),
        prisma_1.default.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
        prisma_1.default.user.count({ where: { role: 'DEVELOPER' } })
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
exports.getPendingUsers = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const pendingUsers = await prisma_1.default.user.findMany({
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
exports.rejectUser = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUser = req.user;
    if (!reason || !reason.trim()) {
        throw new ErrorHandler_1.AppError('Please provide a reason for rejection', 400);
    }
    // Check if user has permission
    if (!hasPermission(currentUser, 'canApproveUsers')) {
        throw new ErrorHandler_1.AppError('You do not have permission to reject users', 403);
    }
    const existingUser = await prisma_1.default.user.findUnique({ where: { id } });
    if (!existingUser) {
        throw new ErrorHandler_1.AppError('User not found', 404);
    }
    if (existingUser.isApproved === false) {
        throw new ErrorHandler_1.AppError('User is already rejected', 400);
    }
    const user = await prisma_1.default.user.update({
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
        await prisma_1.default.notification.create({
            data: {
                userId: id,
                title: 'Application Rejected',
                message: `Your application has been rejected. Reason: ${reason}`,
                type: 'approval'
            }
        });
    }
    catch (notifError) {
        console.error('❌ Error creating notification:', notifError);
    }
    // Log activity
    const performerId = currentUser.id || currentUser.userId;
    if (performerId) {
        await logActivity(performerId, 'USER_UPDATED', id, 'user', {
            action: 'rejected',
            reason,
            email: user.email,
            role: user.role
        }, req.ip);
    }
    res.status(200).json({
        success: true,
        message: 'User rejected successfully',
        data: user
    });
});
