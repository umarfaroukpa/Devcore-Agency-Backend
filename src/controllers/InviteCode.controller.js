"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInviteCode = exports.verifyInviteCode = exports.getAllInviteCodes = exports.createInviteCode = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ErrorHandler_1 = require("../middleware/ErrorHandler");
const crypto_1 = __importDefault(require("crypto"));
// Generate a random invite code
const generateInviteCode = () => {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
};
// POST /api/admin/invite-codes - Create new invite code (Admin only)
exports.createInviteCode = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { role, expiresInDays } = req.body;
    const creatorId = req.user?.id;
    if (!creatorId) {
        throw new ErrorHandler_1.AppError('Authentication context missing for creator ID.', 500);
    }
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'];
    if (!validRoles.includes(role)) {
        throw new ErrorHandler_1.AppError('Invalid role. Only ADMIN or DEVELOPER codes can be created', 400);
    }
    const code = generateInviteCode();
    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;
    const inviteCode = await prisma_1.default.inviteCode.create({
        data: {
            code,
            role,
            expiresAt,
            createdBy: creatorId,
        }
    });
    res.status(201).json({
        success: true,
        message: 'Invite code created successfully',
        data: inviteCode
    });
});
// GET /api/admin/invite-codes - Get all invite codes (Admin only)
exports.getAllInviteCodes = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { status, role } = req.query;
    const where = {};
    if (status === 'active') {
        where.used = false;
        where.OR = [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
        ];
    }
    else if (status === 'used') {
        where.used = true;
    }
    else if (status === 'expired') {
        where.used = false;
        where.expiresAt = { lte: new Date() };
    }
    if (role) {
        where.role = role;
    }
    const inviteCodes = await prisma_1.default.inviteCode.findMany({
        where,
        orderBy: { id: 'desc' }
    });
    res.status(200).json({
        success: true,
        count: inviteCodes.length,
        data: inviteCodes
    });
});
// POST /api/auth/verify-invite - Verify invite code (Public)
exports.verifyInviteCode = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { code } = req.body;
    if (!code) {
        throw new ErrorHandler_1.AppError('Invite code is required', 400);
    }
    const inviteCode = await prisma_1.default.inviteCode.findUnique({
        where: { code: code.toUpperCase() }
    });
    if (!inviteCode) {
        throw new ErrorHandler_1.AppError('Invalid invite code', 404);
    }
    if (inviteCode.used) {
        throw new ErrorHandler_1.AppError('This invite code has already been used', 400);
    }
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
        throw new ErrorHandler_1.AppError('This invite code has expired', 400);
    }
    res.status(200).json({
        success: true,
        message: 'Invite code is valid',
        data: {
            role: inviteCode.role
        }
    });
});
// DELETE /api/admin/invite-codes/:id - Delete invite code (Admin only)
exports.deleteInviteCode = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const inviteCode = await prisma_1.default.inviteCode.findUnique({
        where: { id }
    });
    if (!inviteCode) {
        throw new ErrorHandler_1.AppError('Invite code not found', 404);
    }
    if (inviteCode.used) {
        throw new ErrorHandler_1.AppError('Cannot delete used invite code', 400);
    }
    await prisma_1.default.inviteCode.delete({
        where: { id }
    });
    res.status(200).json({
        success: true,
        message: 'Invite code deleted successfully'
    });
});
