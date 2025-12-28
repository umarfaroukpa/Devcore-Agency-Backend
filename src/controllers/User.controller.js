"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyPassword = exports.updateMyProfile = exports.getMyProfile = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ErrorHandler_1 = require("../middleware/ErrorHandler");
// GET /api/users/me - Get current user profile
exports.getMyProfile = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const currentUser = req.user;
    const user = await prisma_1.default.user.findUnique({
        where: { id: currentUser.userId || currentUser.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            avatar: true,
            companyName: true,
            industry: true,
            position: true,
            skills: true,
            experience: true,
            githubUsername: true,
            portfolio: true,
            isActive: true,
            isApproved: true,
            createdAt: true,
            updatedAt: true
        }
    });
    if (!user) {
        throw new ErrorHandler_1.AppError('User not found', 404);
    }
    res.json({
        success: true,
        data: user
    });
});
// PATCH /api/users/me - Update current user profile
exports.updateMyProfile = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const currentUser = req.user;
    const updates = req.body;
    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.email;
    delete updates.password;
    delete updates.role;
    delete updates.isApproved;
    delete updates.isActive;
    const updatedUser = await prisma_1.default.user.update({
        where: { id: currentUser.userId || currentUser.id },
        data: updates,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            avatar: true,
            companyName: true,
            industry: true,
            position: true,
            skills: true,
            experience: true,
            githubUsername: true,
            portfolio: true,
            isActive: true,
            isApproved: true
        }
    });
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
    });
});
// PATCH /api/users/updatePassword - Change password
exports.updateMyPassword = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const currentUser = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ErrorHandler_1.AppError('Current password and new password are required', 400);
    }
    if (newPassword.length < 8) {
        throw new ErrorHandler_1.AppError('New password must be at least 8 characters', 400);
    }
    // Get user with password
    const user = await prisma_1.default.user.findUnique({
        where: { id: currentUser.userId || currentUser.id },
        select: {
            id: true,
            password: true
        }
    });
    if (!user) {
        throw new ErrorHandler_1.AppError('User not found', 404);
    }
    // Verify current password
    const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new ErrorHandler_1.AppError('Current password is incorrect', 401);
    }
    // Hash new password
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
    // Update password
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });
    res.json({
        success: true,
        message: 'Password updated successfully'
    });
});
