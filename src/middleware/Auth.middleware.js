"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminOnly = exports.requirePermission = exports.restrictTo = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const ErrorHandler_1 = require("./ErrorHandler");
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                isActive: true,
                canApproveUsers: true,
                canDeleteUsers: true,
                canManageProjects: true,
                canAssignTasks: true,
                canViewAllProjects: true
            }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = {
            ...user,
            userId: user.id,
            id: user.id,
            role: user.role
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const restrictTo = (roles) => {
    return (req, res, next) => {
        console.log('🔒 Checking role access...');
        console.log('   Required roles:', roles);
        console.log('   User role:', req.user?.role);
        console.log('   User object:', req.user);
        // here to ensure the user is authenticated and the user object exists
        if (!req.user) {
            console.log('❌ No user object on request');
            return res.status(403).json({
                error: 'Access denied. User not authenticated.',
                requiredRoles: roles
            });
        }
        if (!roles.includes(req.user.role)) {
            console.log('❌ User role not in allowed roles');
            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }
        console.log('✅ Role check passed');
        next();
    };
};
exports.restrictTo = restrictTo;
// Middleware to check specific permission
const requirePermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;
        // SUPER_ADMIN always has all permissions
        if (user.role === 'SUPER_ADMIN') {
            return next();
        }
        // Check if user has specific permission
        if (!user[permission]) {
            return next(new ErrorHandler_1.AppError(`Permission denied: ${permission} required`, 403));
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Middleware to restrict SUPER_ADMIN only routes
const superAdminOnly = (req, res, next) => {
    if (req.user?.role !== 'SUPER_ADMIN') {
        return next(new ErrorHandler_1.AppError('This action requires Super Admin privileges', 403));
    }
    next();
};
exports.superAdminOnly = superAdminOnly;
